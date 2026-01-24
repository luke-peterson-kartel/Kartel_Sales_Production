// Kartel Project Calculator - Claude AI Integration
// Processes conversation transcripts to extract structured data

import Anthropic from '@anthropic-ai/sdk';
import { ExtractedConversationData, ProcessingResult } from './types/conversation';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Model to use for processing
const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';

// System prompt for conversation processing
const SYSTEM_PROMPT = `You are an expert sales call analyst for Kartel AI, a company that provides AI-generated creative content solutions. Your task is to analyze meeting transcripts and extract structured information.

## About Kartel AI
Kartel AI creates AI-generated video and image content for enterprise clients. Key offerings:
- Custom LoRA model training on client brand/product data
- AI-generated static images, videos, and GIFs
- Platform-specific content for Meta, TikTok, YouTube, CTV, etc.
- Three-stage pipeline: Synthetic data → Image generation → Video generation
- Typical deal structure: 2-month spec period (free), then 12-month paid engagement
- Minimum deal size: $600K ACV
- Key verticals: Automotive, CPG, Fashion, Retail, Health, MediaTech, RealEstate, Entertainment

## Kartel Team Members (for reference)
- Luke Peterson: Co-Founder, Sales Lead
- Ben: Co-Founder
- Emmet Reilly: Technical / Demo Support
- Kristin Roberts: Producer (data collection & logistics)

## Output Requirements
Return a valid JSON object with the following structure. For any fields where information is not available in the transcript, use null or empty arrays as appropriate.

{
  "meetingDate": "string or null - ISO date format if mentioned (YYYY-MM-DD)",
  "meetingDuration": "string or null - e.g., '50 minutes'",
  "meetingStage": "string - 'Discovery', 'TestEngagement', 'Proposal', 'Negotiation', 'CheckIn', or 'Other'",

  "clientAttendees": [
    {"name": "string", "role": "string or null", "notes": "string or null", "email": "string or null"}
  ],
  "kartelAttendees": [
    {"name": "string", "role": "string"}
  ],

  "callSummary": {
    "accountName": "string - the company or agency name",
    "endClient": "string or null - if agency, who is the end client",
    "accountType": "string - 'Agency' or 'Direct'",
    "industry": "string - one of: Automotive, CPG, Fashion, Retail, Health, MediaTech, RealEstate, Entertainment, Other",
    "callType": "string - e.g., 'Introduction / Discovery', 'Test Engagement Discussion'",
    "keyTakeaways": {
      "immediateNeed": {
        "what": "string - what they need",
        "why": "string - why they need it",
        "urgency": "HIGH, MEDIUM, or LOW",
        "urgencyNote": "string or null - direct quote about urgency if available"
      },
      "useCase": ["array of strings describing the use case discussed"],
      "concerns": [{"concern": "string", "details": "string"}]
    },
    "nextSteps": [{"owner": "string - who is responsible", "action": "string - what they will do"}]
  },

  "opportunityData": {
    "accountInfo": {
      "accountName": "string",
      "endClient": "string or null",
      "accountType": "string",
      "industry": "string"
    },
    "contacts": [
      {"name": "string", "role": "string or null", "notes": "string or null", "email": "string or null"}
    ],
    "opportunityDetails": {
      "opportunityName": "string - e.g., 'TeamOne – Lexus LDA Content Production'",
      "useCase": "string - brief description of what they want",
      "primaryNeed": "string - the main problem to solve",
      "urgency": "HIGH, MEDIUM, or LOW",
      "stage": "string - e.g., 'Discovery Complete → Awaiting Test Data'"
    },
    "openQuestions": [
      {"question": "string - what needs to be clarified", "whyItMatters": "string - why this matters for the deal"}
    ],
    "dealSizing": {
      "note": "string or null - any caveats about the estimate",
      "scenarios": [
        {"scenario": "string - e.g., 'Low (25 videos/mo)'", "monthlyFee": "string - e.g., '$50-60K'", "acv": "string - e.g., '$600-720K'"}
      ]
    }
  },

  "testEngagement": null or {
    "purpose": [
      {"goal": "string", "whyItMatters": "string"}
    ],
    "scope": {
      "deliverables": [
        {"type": "string - e.g., 'Static images'", "quantity": "string - e.g., '5-10 variants'", "notes": "string"}
      ],
      "requiredAssets": [
        {"assetType": "string", "purpose": "string", "format": "string - e.g., 'JPG, PNG, TIFF'"}
      ],
      "helpfulAssets": [
        {"assetType": "string", "purpose": "string", "format": "string"}
      ],
      "briefRequirements": ["array of strings - what info is needed in the brief"]
    },
    "timeline": [
      {"phase": "string - e.g., 'Receive & Assess'", "duration": "string - e.g., 'Days 1-2'", "activities": "string"}
    ],
    "successCriteria": [
      {"criteria": "string", "measure": "string"}
    ],
    "risks": [
      {"risk": "string", "likelihood": "HIGH, MEDIUM, or LOW", "mitigation": "string"}
    ]
  },

  "followUpEmails": [
    {
      "emailType": "string - e.g., 'Post-Call Recap', 'Data Request'",
      "to": "string - recipient name",
      "cc": ["array of CC recipients"] or null,
      "subject": "string - email subject line",
      "body": "string - full email body in professional format"
    }
  ],

  "internalChecklist": {
    "dataIntake": [
      {"item": "string - e.g., 'Photography received'", "checked": false}
    ],
    "briefReview": [
      {"item": "string - e.g., 'Vehicle model/trim specified'", "checked": false}
    ],
    "communicationRhythm": [
      {"touchpoint": "string - e.g., 'Files received confirmation'", "owner": "string", "when": "string"}
    ]
  }
}

## Analysis Instructions

1. **Meeting Metadata**: Extract date, duration, and meeting type from the transcript header or content.

2. **Participants**: Identify all attendees. For client-side, note their roles and any relevant context. For Kartel team, assign roles based on the known team members.

3. **Call Summary**:
   - Identify the account/agency name and any end client
   - Determine if it's an agency relationship or direct
   - Match to the closest industry vertical
   - Extract the immediate need with urgency assessment
   - Note any concerns raised (legal, technical, timeline, budget)
   - List all agreed-upon next steps with clear ownership

4. **Opportunity Data**:
   - Create a descriptive opportunity name
   - Summarize the use case and primary need
   - Identify questions that need answers before proceeding
   - If budget/volume was discussed, provide deal sizing scenarios

5. **Test Engagement** (only if discussed):
   - What would be delivered in a test
   - What assets/data are needed from the client
   - Realistic timeline based on discussion
   - Success criteria and potential risks

6. **Follow-Up Emails**:
   - Draft a post-call recap email to the main contact
   - If data collection was discussed, draft a data request email
   - Match the professional but warm tone from the template
   - Include specific details from the conversation

7. **Internal Checklist**:
   - Create relevant checklist items based on what was discussed
   - Focus on data intake and brief review items
   - Set up communication rhythm based on agreed cadence

## Important Guidelines

- Be conservative with urgency ratings - only mark HIGH if there's explicit urgency language (e.g., "yesterday would have been the right answer", "holding media right now")
- For deal sizing, only provide estimates if budget numbers or volume were discussed
- For emails, be professional but personable - not overly formal
- Include direct quotes where relevant, especially for urgency indicators
- If test engagement wasn't discussed, set testEngagement to null
- All checklist items should have checked: false initially

Return ONLY the JSON object, no additional text or markdown formatting.`;

/**
 * Process a conversation transcript with Claude AI
 */
export async function processConversationTranscript(
  transcript: string
): Promise<ProcessingResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      success: false,
      error: 'ANTHROPIC_API_KEY environment variable is not set',
    };
  }

  if (!transcript || transcript.trim().length < 100) {
    return {
      success: false,
      error: 'Transcript is too short. Please provide a complete conversation transcript.',
    };
  }

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Analyze this meeting transcript and extract structured information:\n\n---\n${transcript}\n---\n\nReturn the JSON object with all extracted data.`,
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
    let data: ExtractedConversationData;
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

      data = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse Claude response as JSON:', responseText);
      return {
        success: false,
        error: `Failed to parse response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
      };
    }

    return {
      success: true,
      data,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    };
  } catch (error) {
    console.error('Claude API error:', error);

    // Handle specific Anthropic errors
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
 * Retry wrapper for processing with exponential backoff
 */
export async function processWithRetry(
  transcript: string,
  maxRetries: number = 3
): Promise<ProcessingResult> {
  let lastError: string = '';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await processConversationTranscript(transcript);

    if (result.success) {
      return result;
    }

    lastError = result.error || 'Unknown error';

    // Don't retry on certain errors
    if (
      lastError.includes('API key') ||
      lastError.includes('too short') ||
      lastError.includes('environment variable')
    ) {
      return result;
    }

    // Wait before retrying (exponential backoff)
    if (attempt < maxRetries) {
      const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  return {
    success: false,
    error: `Failed after ${maxRetries} attempts. Last error: ${lastError}`,
  };
}
