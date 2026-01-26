// Website Analysis Module
// Fetch client websites and analyze with Claude to extract intelligence

import Anthropic from '@anthropic-ai/sdk';
import type { WebsiteAnalysisResult, LeadershipMember } from './types/contact-intelligence';
import type { CompanySizeType } from './constants/contact-intelligence';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';

// ============================================
// WEBSITE FETCHING
// ============================================

interface FetchResult {
  success: boolean;
  content?: string;
  error?: string;
}

/**
 * Fetch website content from multiple pages
 */
export async function fetchWebsiteContent(baseUrl: string): Promise<FetchResult> {
  try {
    // Normalize URL
    let url = baseUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    // Remove trailing slash
    url = url.replace(/\/$/, '');

    const pagesToFetch = [
      url, // Homepage
      `${url}/about`,
      `${url}/about-us`,
      `${url}/team`,
      `${url}/our-team`,
      `${url}/leadership`,
      `${url}/people`,
      `${url}/contact`,
    ];

    const contents: string[] = [];

    // Fetch pages in parallel with timeout
    const fetchPromises = pagesToFetch.map(async (pageUrl) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(pageUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; KartelBot/1.0; +https://kartel.ai)',
            'Accept': 'text/html,application/xhtml+xml',
          },
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const html = await response.text();
          return { url: pageUrl, html };
        }
        return null;
      } catch {
        return null;
      }
    });

    const results = await Promise.all(fetchPromises);

    for (const result of results) {
      if (result) {
        // Extract text content from HTML (basic extraction)
        const textContent = extractTextFromHtml(result.html);
        if (textContent) {
          contents.push(`=== Page: ${result.url} ===\n${textContent}`);
        }
      }
    }

    if (contents.length === 0) {
      return {
        success: false,
        error: 'Could not fetch any content from the website',
      };
    }

    // Combine and truncate content
    const combinedContent = contents.join('\n\n');
    const truncatedContent = combinedContent.slice(0, 30000); // Limit to ~30k chars

    return {
      success: true,
      content: truncatedContent,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error fetching website',
    };
  }
}

/**
 * Basic HTML to text extraction
 */
function extractTextFromHtml(html: string): string {
  // Remove script and style tags and their content
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");

  // Clean up whitespace
  text = text.replace(/\s+/g, ' ');
  text = text.trim();

  return text;
}

// ============================================
// CLAUDE ANALYSIS
// ============================================

const WEBSITE_ANALYSIS_PROMPT = `You are analyzing a company website for a B2B sales team at Kartel AI (an AI creative agency that creates AI-generated advertising content).

Your job is to extract useful intelligence from the website content to help prepare for sales calls.

Extract the following information from the website content:

1. **Company Overview**
   - What does the company do? (1-2 sentence description)
   - What industry are they in?
   - Company size indicators (look for employee counts, office locations, "we are X people")

2. **Leadership/Key People**
   - Names and titles of leadership team members
   - Marketing/Creative team members if visible
   - Look for: About pages, Team pages, Leadership sections
   - For each person: name, title, and whether they might be a decision maker for creative/marketing services

3. **Current Creative Approach**
   - What does their current advertising/creative look like?
   - What social media platforms are they active on?
   - Any brand style observations (colors, tone, messaging)

4. **Recommendations for Sales Team**
   - Who are the priority contacts to reach out to?
   - What talking points would resonate with this company?
   - What discovery questions should we ask?

Return your analysis as JSON in this exact format:
{
  "companyInfo": {
    "description": "string - 1-2 sentence description",
    "industry": "string - industry category",
    "sizeIndicator": "STARTUP | SMB | MID_MARKET | ENTERPRISE",
    "estimatedEmployees": "string - e.g. '50-100' or '1000+'"
  },
  "leadershipTeam": [
    {
      "name": "string",
      "title": "string",
      "isLikelyDM": true/false,
      "department": "string - Marketing, Creative, Executive, etc."
    }
  ],
  "creativeInsights": {
    "currentApproach": "string - description of their current creative/advertising",
    "platforms": ["string - list of social/ad platforms they use"],
    "brandNotes": "string - observations about their brand style"
  },
  "socialPresence": {
    "platforms": ["string - social platforms found"],
    "notes": "string - any notes about their social presence"
  },
  "recommendations": {
    "priorityContacts": ["string - names of people to prioritize reaching"],
    "talkingPoints": ["string - talking points for sales calls"],
    "suggestedQuestions": ["string - discovery questions to ask"]
  }
}

IMPORTANT:
- Only include information you can actually find in the website content
- If you can't find leadership team information, return an empty array
- Be specific with names and titles - don't make them up
- For company size, use these guidelines:
  - STARTUP: 1-50 employees
  - SMB: 51-200 employees
  - MID_MARKET: 201-1000 employees
  - ENTERPRISE: 1000+ employees
- Mark someone as isLikelyDM if they have titles like: CMO, VP Marketing, Head of Creative, Director of Marketing, etc.`;

/**
 * Analyze website content with Claude
 */
export async function analyzeWebsiteWithClaude(
  websiteContent: string,
  vertical: string
): Promise<WebsiteAnalysisResult> {
  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `Analyze this ${vertical} company's website content:\n\n${websiteContent}`,
        },
      ],
      system: WEBSITE_ANALYSIS_PROMPT,
    });

    // Extract text from response
    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return {
        success: false,
        error: 'No text response from Claude',
      };
    }

    // Parse JSON from response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        success: false,
        error: 'Could not extract JSON from Claude response',
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Transform to our expected format
    const result: WebsiteAnalysisResult = {
      success: true,
      data: {
        companyInfo: {
          description: parsed.companyInfo?.description || '',
          industry: parsed.companyInfo?.industry,
          sizeIndicator: parsed.companyInfo?.sizeIndicator as CompanySizeType,
          estimatedEmployees: parsed.companyInfo?.estimatedEmployees,
        },
        leadershipTeam: (parsed.leadershipTeam || []).map((member: LeadershipMember) => ({
          name: member.name,
          title: member.title,
          isLikelyDM: member.isLikelyDM,
          department: member.department,
        })),
        creativeInsights: parsed.creativeInsights,
        socialPresence: parsed.socialPresence,
        recommendations: parsed.recommendations,
      },
      tokensUsed: response.usage?.input_tokens + response.usage?.output_tokens,
    };

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error analyzing website',
    };
  }
}

// ============================================
// COMBINED WORKFLOW
// ============================================

/**
 * Full website analysis workflow: fetch + analyze
 */
export async function analyzeClientWebsite(
  websiteUrl: string,
  vertical: string = 'Unknown'
): Promise<WebsiteAnalysisResult> {
  // Step 1: Fetch website content
  const fetchResult = await fetchWebsiteContent(websiteUrl);

  if (!fetchResult.success || !fetchResult.content) {
    return {
      success: false,
      error: fetchResult.error || 'Failed to fetch website content',
    };
  }

  // Step 2: Analyze with Claude
  const analysisResult = await analyzeWebsiteWithClaude(fetchResult.content, vertical);

  return analysisResult;
}

/**
 * Re-analyze with existing content (for retries without re-fetching)
 */
export async function reanalyzeWebsiteContent(
  cachedContent: string,
  vertical: string = 'Unknown'
): Promise<WebsiteAnalysisResult> {
  return analyzeWebsiteWithClaude(cachedContent, vertical);
}
