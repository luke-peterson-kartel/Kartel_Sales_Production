// Sales Report PDF Parsing with Claude AI
// Extracts structured deal, lead, and meeting data from Daily Sales Report PDFs

import Anthropic from '@anthropic-ai/sdk';
import {
  ExtractedSalesReport,
  ExtractedDeal,
  ExtractedLead,
  ExtractedMeeting,
  ExtractedTask,
} from '@/lib/types/sales-report';
import {
  parseDealValue,
  mapPdfStageToEnum,
  SALES_OWNERS,
  SalesOwner,
} from '@/lib/constants/sales-stages';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';

// System prompt for sales report extraction
const SALES_REPORT_SYSTEM_PROMPT = `You are an expert at extracting structured data from sales pipeline reports. You will analyze a Daily Sales Report PDF and extract all deal, lead, and meeting information.

## Report Structure

The Daily Sales Report typically contains:

1. **Deal Pipelines by Owner** - Each salesperson (Ben, Luke, Emmet, Kevin) has their own section with:
   - Deal name (sometimes with end client in parentheses, e.g., "Saatchi (Toyota)")
   - Value (e.g., "$1.2M", "$500K")
   - Stage (e.g., "Discovery", "Scoping", "Spec Production", "Negotiation", "Proposal Sent")
   - Next Step (free text description)
   - Task Due (date + action, e.g., "Jan 27 Schedule Garage mtg")

2. **Key Leads** - New leads with:
   - Lead name (person)
   - Company
   - Status
   - Owner

3. **Upcoming Meetings** - Scheduled meetings with:
   - Title/description
   - Date/time
   - Attendees (sometimes)

## Output Format

Return a valid JSON object with this structure:

{
  "reportDate": "string - ISO date extracted from report header (YYYY-MM-DD)",
  "reportDateText": "string - raw date text from report",

  "deals": [
    {
      "dealName": "string - the deal/client name",
      "owner": "string - Ben, Luke, Emmet, or Kevin",
      "valueText": "string - raw value text like '$1.2M'",
      "stage": "string - raw stage text",
      "nextStep": "string or null - next step description",
      "taskDueText": "string or null - raw task text like 'Jan 27 Schedule Garage mtg'",
      "taskDueDate": "string or null - ISO date if parseable (YYYY-MM-DD)",
      "taskDescription": "string or null - extracted action from task",
      "isSubDeal": false,
      "parentDealName": "string or null - if this is a sub-deal"
    }
  ],

  "leads": [
    {
      "name": "string - person's name",
      "company": "string - company name",
      "status": "string - lead status",
      "owner": "string - sales owner"
    }
  ],

  "meetings": [
    {
      "title": "string - meeting title/description",
      "dateText": "string - raw date/time text",
      "dateParsed": "string or null - ISO date if parseable",
      "time": "string or null - time if specified",
      "attendees": ["array of names"] or [],
      "relatedDeal": "string or null - associated deal if mentioned"
    }
  ]
}

## Parsing Guidelines

1. **Deal Names**: Watch for sub-deals indicated by patterns like:
   - "Treefort Microdrama" (sub-deal of "Treefort")
   - Deal name containing parent in parentheses

2. **Values**: Parse carefully - "$1.2M" = $1,200,000, "$500K" = $500,000

3. **Tasks**: The "Task Due" field often has format "Jan 27 Schedule meeting" - extract both the date and the action

4. **Dates**: The report header usually shows the report date (e.g., "Daily Sales Report - Jan 27, 2026")

5. **Owners**: Match to exactly: Ben, Luke, Emmet, Kevin

Return ONLY the JSON object, no additional text or markdown formatting.`;

export interface ParseSalesReportResult {
  success: boolean;
  data?: ExtractedSalesReport;
  error?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Parse a Daily Sales Report PDF using Claude AI
 * The PDF content should be provided as either extracted text or base64 image data
 */
export async function parseSalesReportPdf(
  pdfContent: string,
  fileName: string,
  isBase64Image: boolean = false
): Promise<ParseSalesReportResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      success: false,
      error: 'ANTHROPIC_API_KEY environment variable is not set',
    };
  }

  if (!pdfContent || pdfContent.trim().length < 50) {
    return {
      success: false,
      error: 'PDF content is too short. Please provide valid report content.',
    };
  }

  try {
    // Build the message content
    const userContent: Anthropic.MessageCreateParams['messages'][0]['content'] = isBase64Image
      ? [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: pdfContent,
            },
          },
          {
            type: 'text',
            text: `This is a Daily Sales Report PDF. Extract all deal pipeline, lead, and meeting information into the structured JSON format described.`,
          },
        ]
      : `Extract all deal pipeline, lead, and meeting information from this Daily Sales Report text:\n\n---\n${pdfContent}\n---\n\nReturn the JSON object with all extracted data.`;

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8192,
      system: SALES_REPORT_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userContent,
        },
      ],
    });

    // Extract the text content from the response
    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return {
        success: false,
        error: 'No text response received from Claude',
      };
    }

    const responseText = textContent.text.trim();

    // Try to parse the JSON response
    let rawData: {
      reportDate: string;
      reportDateText: string;
      deals: Array<{
        dealName: string;
        owner: string;
        valueText: string;
        stage: string;
        nextStep: string | null;
        taskDueText: string | null;
        taskDueDate: string | null;
        taskDescription: string | null;
        isSubDeal: boolean;
        parentDealName: string | null;
      }>;
      leads: Array<{
        name: string;
        company: string;
        status: string;
        owner: string;
      }>;
      meetings: Array<{
        title: string;
        dateText: string;
        dateParsed: string | null;
        time: string | null;
        attendees: string[];
        relatedDeal: string | null;
      }>;
    };

    try {
      // Handle potential markdown code blocks
      let jsonText = responseText;
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.slice(7);
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.slice(3);
      }
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.slice(0, -3);
      }
      jsonText = jsonText.trim();

      rawData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse Claude response as JSON:', responseText);
      return {
        success: false,
        error: `Failed to parse response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
      };
    }

    // Transform raw data into our structured format
    const extractedReport = transformRawData(rawData, fileName, responseText);

    return {
      success: true,
      data: extractedReport,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    };
  } catch (error) {
    console.error('Claude API error:', error);

    if (error instanceof Anthropic.APIError) {
      if (error.status === 401) {
        return {
          success: false,
          error: 'Invalid API key. Please check your ANTHROPIC_API_KEY.',
        };
      }
      if (error.status === 429) {
        return {
          success: false,
          error: 'Rate limit exceeded. Please try again in a moment.',
        };
      }
      return {
        success: false,
        error: `API error: ${error.message}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Transform raw Claude response into our structured ExtractedSalesReport format
 */
function transformRawData(
  rawData: {
    reportDate: string;
    reportDateText: string;
    deals: Array<{
      dealName: string;
      owner: string;
      valueText: string;
      stage: string;
      nextStep: string | null;
      taskDueText: string | null;
      taskDueDate: string | null;
      taskDescription: string | null;
      isSubDeal: boolean;
      parentDealName: string | null;
    }>;
    leads: Array<{
      name: string;
      company: string;
      status: string;
      owner: string;
    }>;
    meetings: Array<{
      title: string;
      dateText: string;
      dateParsed: string | null;
      time: string | null;
      attendees: string[];
      relatedDeal: string | null;
    }>;
  },
  fileName: string,
  rawResponse: string
): ExtractedSalesReport {
  const now = new Date();

  // Parse report date
  let reportDate = now;
  if (rawData.reportDate) {
    const parsed = new Date(rawData.reportDate);
    if (!isNaN(parsed.getTime())) {
      reportDate = parsed;
    }
  }

  // Transform deals
  const allDeals: ExtractedDeal[] = rawData.deals.map((deal) => {
    const valueParsed = parseDealValue(deal.valueText);
    const stageMapped = mapPdfStageToEnum(deal.stage);
    const owner = normalizeOwner(deal.owner);

    // Parse task if present
    let task: ExtractedTask | null = null;
    if (deal.taskDueText || deal.taskDescription) {
      const taskDueDate = deal.taskDueDate ? new Date(deal.taskDueDate) : null;
      const isOverdue = taskDueDate ? taskDueDate < now : false;

      task = {
        dueDate: taskDueDate,
        dueDateText: deal.taskDueText || '',
        description: deal.taskDescription || deal.taskDueText || '',
        isOverdue,
        priority: isOverdue ? 'HIGH' : 'NORMAL',
      };
    }

    return {
      dealName: deal.dealName,
      owner,
      valueText: deal.valueText,
      valueParsed,
      stage: deal.stage,
      stageMapped,
      nextStep: deal.nextStep,
      task,
      isSubDeal: deal.isSubDeal || false,
      parentDealName: deal.parentDealName || undefined,
      matchConfidence: undefined,
      importAction: undefined,
    };
  });

  // Group deals by owner
  const dealsByOwner: Record<SalesOwner, ExtractedDeal[]> = {
    Ben: [],
    Luke: [],
    Emmet: [],
    Kevin: [],
  };

  allDeals.forEach((deal) => {
    if (deal.owner && dealsByOwner[deal.owner]) {
      dealsByOwner[deal.owner].push(deal);
    }
  });

  // Transform leads
  const allLeads: ExtractedLead[] = rawData.leads.map((lead) => ({
    name: lead.name,
    company: lead.company,
    status: lead.status,
    statusMapped: null, // Will be mapped during import
    owner: normalizeOwner(lead.owner),
  }));

  // Transform meetings
  const allMeetings: ExtractedMeeting[] = rawData.meetings.map((meeting) => ({
    title: meeting.title,
    dateText: meeting.dateText,
    dateParsed: meeting.dateParsed ? new Date(meeting.dateParsed) : null,
    time: meeting.time,
    attendees: meeting.attendees || [],
    relatedDeal: meeting.relatedDeal,
  }));

  // Calculate totals
  const totalValue = allDeals.reduce((sum, deal) => sum + (deal.valueParsed || 0), 0);

  return {
    reportDate,
    reportDateText: rawData.reportDateText,
    fileName,
    dealsByOwner,
    allDeals,
    allLeads,
    allMeetings,
    totalDeals: allDeals.length,
    totalValue,
    totalLeads: allLeads.length,
    totalMeetings: allMeetings.length,
    extractedAt: now,
    processingModel: MODEL,
    rawResponse,
  };
}

/**
 * Normalize owner name to match our enum
 */
function normalizeOwner(owner: string): SalesOwner {
  const normalized = owner.trim();

  for (const validOwner of SALES_OWNERS) {
    if (normalized.toLowerCase() === validOwner.toLowerCase()) {
      return validOwner;
    }
  }

  // Default to first owner if not recognized
  console.warn(`Unknown owner "${owner}", defaulting to Ben`);
  return 'Ben';
}

/**
 * Parse task due date from text like "Jan 27 Schedule meeting"
 */
export function parseTaskDueDate(
  taskText: string,
  referenceYear: number = new Date().getFullYear()
): Date | null {
  if (!taskText) return null;

  // Common date patterns: "Jan 27", "January 27", "1/27", "Jan 27, 2026"
  const patterns = [
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})(?:,?\s+(\d{4}))?/i,
    /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:,?\s+(\d{4}))?/i,
    /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/,
  ];

  const monthMap: Record<string, number> = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11,
  };

  for (const pattern of patterns) {
    const match = taskText.match(pattern);
    if (match) {
      let month: number;
      let day: number;
      let year = referenceYear;

      if (pattern.source.includes('Jan|Feb')) {
        // Month name pattern
        month = monthMap[match[1].toLowerCase()];
        day = parseInt(match[2], 10);
        if (match[3]) year = parseInt(match[3], 10);
      } else if (pattern.source.includes('January|February')) {
        month = monthMap[match[1].toLowerCase()];
        day = parseInt(match[2], 10);
        if (match[3]) year = parseInt(match[3], 10);
      } else {
        // Numeric pattern m/d/y
        month = parseInt(match[1], 10) - 1;
        day = parseInt(match[2], 10);
        if (match[3]) {
          year = parseInt(match[3], 10);
          if (year < 100) year += 2000; // Handle 2-digit years
        }
      }

      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  return null;
}
