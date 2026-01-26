import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { PLATFORMS, CREATIVE_TYPES, SIZES, DURATIONS } from '@/lib/constants';
import mammoth from 'mammoth';
import { extractText } from 'unpdf';

const anthropic = new Anthropic();

// System prompt for parsing client requests (same as parse-request)
const SYSTEM_PROMPT = `You are an expert at parsing creative production requests and extracting structured deliverable information.

Your job is to analyze client requests (which may come in various formats like emails, spreadsheets, briefs, or free-form text) and extract the deliverables they need.

## Available Options

**Platforms:**
${PLATFORMS.map(p => `- ${p.value}: ${p.label}`).join('\n')}

**Creative Types:**
${CREATIVE_TYPES.map(t => `- ${t.value}: ${t.label}`).join('\n')}

**Sizes:**
${SIZES.map(s => `- ${s.value}: ${s.label} (for: ${s.platforms.join(', ')})`).join('\n')}

**Video Durations (in seconds):**
${DURATIONS.map(d => `- ${d.value}: ${d.label}`).join('\n')}

## Extraction Rules

1. **Platform Detection:**
   - "Facebook", "Instagram", "FB", "IG" → Meta
   - "TT", "Tik Tok" → TikTok
   - "Pin", "Pins" → Pinterest
   - "YT", "Youtube" → YouTube
   - "OLV", "pre-roll", "mid-roll" → OLV
   - "CTV", "streaming", "connected" → CTV
   - "TV", "broadcast", "linear" → TV

2. **Creative Type Detection:**
   - "static", "still", "image" → Static
   - "carousel", "multi-image", "slides" → Carousel
   - "video", "motion" → Video
   - "UGC", "user generated", "creator" → UGC
   - "branded", "hero" → Branded
   - "GIF", "animated" → GIF

3. **Size Detection:**
   - "square", "1:1", "1080x1080" → 1x1
   - "vertical", "9:16", "story", "reels", "1080x1920" → 9x16
   - "4:5", "portrait" → 4x5
   - "horizontal", "16:9", "landscape", "1920x1080" → 16x9
   - "2:3", "pinterest" → 2x3

4. **Duration Detection:**
   - Extract seconds from mentions like "15s", "15 sec", ":15", "15 second"
   - Round to nearest standard duration: 6, 9, 15, 30, 45, 60
   - If no duration for video, default to 15

5. **Volume/Count:**
   - Look for numbers like "10x", "10 units", "10 assets"
   - Monthly vs total: "per month", "/mo", "monthly" indicates monthly count
   - If unclear, assume the number is monthly count

6. **Handling Ambiguity:**
   - If platform unclear but size suggests it (e.g., 2:3 → Pinterest), infer platform
   - If creative type unclear for video content, default to "Video"
   - If size unclear, default based on platform norms
   - Always make your best guess - don't leave fields empty

## Response Format

Return a JSON object with this exact structure:
{
  "deliverables": [
    {
      "platform": "Meta",
      "creativeType": "Video",
      "size": "9x16",
      "duration": 15,
      "monthlyCount": 10,
      "notes": "Instagram Reels"
    }
  ],
  "summary": "Brief summary of what was extracted",
  "assumptions": ["List of assumptions made due to ambiguity"],
  "unparseableItems": ["Items mentioned but couldn't be parsed"]
}

IMPORTANT:
- Always return valid JSON
- duration should be null for Static/Carousel, a number for video types
- monthlyCount should always be a positive integer (minimum 1)
- Make reasonable assumptions rather than omitting items`;

interface ParsedDeliverable {
  platform: string;
  creativeType: string;
  size: string;
  duration: number | null;
  monthlyCount: number;
  notes?: string;
}

interface ParseResult {
  deliverables: ParsedDeliverable[];
  summary: string;
  assumptions: string[];
  unparseableItems: string[];
}

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // Use unpdf to extract text from the PDF
  const { text } = await extractText(buffer);
  // text is an array of strings (one per page), join them
  return Array.isArray(text) ? text.join('\n\n') : text;
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

function extractTextFromCSV(text: string): string {
  // For CSV, we just return the raw text
  // Claude will interpret the CSV format
  return text;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Get file type
    const fileName = file.name.toLowerCase();
    const fileType = fileName.endsWith('.pdf')
      ? 'pdf'
      : fileName.endsWith('.docx') || fileName.endsWith('.doc')
      ? 'docx'
      : fileName.endsWith('.csv')
      ? 'csv'
      : null;

    if (!fileType) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a PDF, Word document (.docx), or CSV file.' },
        { status: 400 }
      );
    }

    // Read file content
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text based on file type
    let extractedText: string;
    try {
      switch (fileType) {
        case 'pdf':
          extractedText = await extractTextFromPDF(buffer);
          break;
        case 'docx':
          extractedText = await extractTextFromDocx(buffer);
          break;
        case 'csv':
          extractedText = extractTextFromCSV(buffer.toString('utf-8'));
          break;
        default:
          throw new Error('Unknown file type');
      }
    } catch (extractError) {
      console.error('Error extracting text:', extractError);
      return NextResponse.json(
        { error: `Failed to read ${fileType.toUpperCase()} file. The file may be corrupted or password-protected.` },
        { status: 400 }
      );
    }

    if (!extractedText || extractedText.trim().length < 10) {
      return NextResponse.json(
        { error: 'Could not extract enough text from the file. Please check the file content.' },
        { status: 400 }
      );
    }

    // Call Claude to parse the request
    const message = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Parse the following client request (extracted from a ${fileType.toUpperCase()} file) and extract all deliverables. If the format is unusual (CSV, table, email, etc.), do your best to interpret it.

FILE NAME: ${file.name}

EXTRACTED CONTENT:
${extractedText}

Remember to return valid JSON with the exact structure specified.`,
        },
      ],
    });

    // Extract the text response
    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    // Try to parse the JSON from the response
    let parseResult: ParseResult;
    try {
      // Find JSON in the response (it might have markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      parseResult = JSON.parse(jsonMatch[0]);
    } catch {
      console.error('Failed to parse Claude response:', responseText);
      return NextResponse.json(
        {
          error: 'Failed to parse the response. Please try again.',
          rawResponse: responseText
        },
        { status: 500 }
      );
    }

    // Validate and clean up deliverables
    const validPlatforms = PLATFORMS.map(p => p.value) as string[];
    const validCreativeTypes = CREATIVE_TYPES.map(t => t.value) as string[];
    const validSizes = SIZES.map(s => s.value) as string[];
    const validDurations = DURATIONS.map(d => d.value);

    const cleanedDeliverables = parseResult.deliverables.map(d => {
      // Validate platform
      let platform = d.platform;
      if (!validPlatforms.includes(platform)) {
        platform = 'Meta'; // Default
      }

      // Validate creative type
      let creativeType = d.creativeType;
      if (!validCreativeTypes.includes(creativeType)) {
        creativeType = 'Static'; // Default
      }

      // Validate size
      let size = d.size;
      if (!validSizes.includes(size)) {
        size = '1x1'; // Default
      }

      // Validate duration
      let duration = d.duration;
      if (duration !== null) {
        // Round to nearest valid duration
        const nearestDuration = validDurations.reduce((prev, curr) =>
          Math.abs(curr - duration!) < Math.abs(prev - duration!) ? curr : prev
        );
        duration = nearestDuration;
      }

      // Ensure monthlyCount is valid
      const monthlyCount = Math.max(1, Math.round(d.monthlyCount || 1));

      return {
        platform,
        creativeType,
        size,
        duration: ['Video', 'UGC', 'Branded', 'VideoPin', 'GIF'].includes(creativeType) ? duration : null,
        monthlyCount,
        notes: d.notes || '',
      };
    });

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileType,
      extractedTextLength: extractedText.length,
      deliverables: cleanedDeliverables,
      summary: parseResult.summary || '',
      assumptions: parseResult.assumptions || [],
      unparseableItems: parseResult.unparseableItems || [],
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    });
  } catch (error) {
    console.error('Error parsing file:', error);
    return NextResponse.json(
      { error: 'Failed to parse file. Please try again.' },
      { status: 500 }
    );
  }
}
