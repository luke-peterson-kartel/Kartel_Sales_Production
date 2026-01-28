// POST /api/sales-report/parse
// Parses a Daily Sales Report (CSV or PDF) and extracts structured data

import { NextRequest, NextResponse } from 'next/server';
import { parseSalesReportPdf } from '@/lib/sales-report/parse-pdf';
import { parseSalesReportCsv, isCSVContent } from '@/lib/sales-report/parse-csv';
import { batchMatchDeals, getSuggestedAction } from '@/lib/sales-report/match-clients';
import { ExtractedDeal, ExtractedSalesReport } from '@/lib/types/sales-report';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pdfContent, fileName, isBase64Image } = body;

    if (!pdfContent) {
      return NextResponse.json(
        { success: false, error: 'File content is required' },
        { status: 400 }
      );
    }

    if (!fileName) {
      return NextResponse.json(
        { success: false, error: 'File name is required' },
        { status: 400 }
      );
    }

    let extractedData: ExtractedSalesReport | null = null;
    let parsingMethod: string = 'unknown';

    // Determine if content is CSV or needs Claude processing
    const isCSV = fileName.toLowerCase().endsWith('.csv') || isCSVContent(pdfContent);

    if (isCSV) {
      // Parse CSV directly - no Claude API call needed
      console.log('Parsing as CSV file');
      parsingMethod = 'csv-parser';
      extractedData = parseSalesReportCsv(pdfContent, fileName);
    } else if (isBase64Image) {
      // Use Claude for image-based PDFs
      console.log('Parsing as image with Claude');
      parsingMethod = 'claude-image';
      const parseResult = await parseSalesReportPdf(pdfContent, fileName, true);
      if (!parseResult.success || !parseResult.data) {
        return NextResponse.json(
          { success: false, error: parseResult.error || 'Failed to parse PDF image' },
          { status: 500 }
        );
      }
      extractedData = parseResult.data;
    } else {
      // Check if content looks like valid text for Claude
      // If it looks like binary/garbled data, reject it
      const isBinaryGarbled = isBinaryContent(pdfContent);
      if (isBinaryGarbled) {
        return NextResponse.json(
          {
            success: false,
            error: 'PDF file detected but content appears to be binary. Please export the sales report as CSV from Google Sheets, or copy-paste the text content.',
          },
          { status: 400 }
        );
      }

      // Use Claude for text extraction
      console.log('Parsing as text with Claude');
      parsingMethod = 'claude-text';
      const parseResult = await parseSalesReportPdf(pdfContent, fileName, false);
      if (!parseResult.success || !parseResult.data) {
        return NextResponse.json(
          { success: false, error: parseResult.error || 'Failed to parse content' },
          { status: 500 }
        );
      }
      extractedData = parseResult.data;
    }

    if (!extractedData || extractedData.allDeals.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No deals found in the file. Please check the file format.',
        },
        { status: 400 }
      );
    }

    // Match deals to existing clients
    const dealNames = extractedData.allDeals.map((d) => d.dealName);
    const matchResults = await batchMatchDeals(dealNames);

    // Enhance deals with match information
    const enhancedDeals: ExtractedDeal[] = extractedData.allDeals.map((deal) => {
      const matches = matchResults.get(deal.dealName) || [];
      const suggestedAction = getSuggestedAction(matches);
      const bestMatch = matches[0];

      return {
        ...deal,
        matchedClientId: bestMatch?.clientId,
        matchConfidence: bestMatch?.confidence,
        importAction: suggestedAction === 'use_match' ? 'update' : suggestedAction === 'create_new' ? 'create' : undefined,
      };
    });

    // Update the report with enhanced deals
    const enhancedReport = {
      ...extractedData,
      allDeals: enhancedDeals,
      processingModel: parsingMethod,
      dealsByOwner: Object.fromEntries(
        Object.entries(extractedData.dealsByOwner).map(([owner, deals]) => [
          owner,
          deals.map((deal) => {
            const enhanced = enhancedDeals.find((d) => d.dealName === deal.dealName);
            return enhanced || deal;
          }),
        ])
      ),
    };

    return NextResponse.json({
      success: true,
      data: enhancedReport,
      matches: Object.fromEntries(matchResults),
      parsingMethod,
    });
  } catch (error) {
    console.error('Error parsing sales report:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * Check if content appears to be binary/garbled PDF data
 * Real text should have mostly printable ASCII characters
 */
function isBinaryContent(content: string): boolean {
  // Sample first 1000 characters
  const sample = content.slice(0, 1000);

  // Count non-printable characters (excluding common whitespace)
  let nonPrintable = 0;
  for (let i = 0; i < sample.length; i++) {
    const code = sample.charCodeAt(i);
    // Allow: tab (9), newline (10), carriage return (13), and printable ASCII (32-126)
    // Also allow some common extended ASCII and UTF-8
    if (code < 9 || (code > 13 && code < 32) || (code > 126 && code < 160)) {
      nonPrintable++;
    }
  }

  // If more than 10% non-printable, it's likely binary
  const ratio = nonPrintable / sample.length;
  return ratio > 0.1;
}
