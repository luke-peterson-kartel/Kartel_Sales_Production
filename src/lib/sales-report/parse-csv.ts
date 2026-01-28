// Sales Report CSV Parsing
// Directly parses CSV exported from the Daily Sales Report spreadsheet
// Handles varying column positions due to merged cells in Google Sheets

import {
  ExtractedSalesReport,
  ExtractedDeal,
  ExtractedTask,
} from '@/lib/types/sales-report';
import {
  parseDealValue,
  mapPdfStageToEnum,
  SalesOwner,
} from '@/lib/constants/sales-stages';

// Known stage keywords for detection
const STAGE_KEYWORDS = [
  'discovery', 'scoping', 'spec production', 'spec', 'negotiation',
  'proposal sent', 'proposal', 'closed won', 'closed lost'
];

/**
 * Parse the Daily Sales Report CSV file
 * Handles flexible column positions from Google Sheets export
 */
export function parseSalesReportCsv(csvContent: string, fileName: string): ExtractedSalesReport {
  // Remove BOM if present
  const cleanContent = csvContent.replace(/^\uFEFF/, '');
  const lines = cleanContent.split('\n').map(line => line.trim());

  // Extract report date from header
  let reportDate = new Date();
  let reportDateText = '';

  for (const line of lines.slice(0, 5)) {
    const dateMatch = line.match(/(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s*\d{4}/i);
    if (dateMatch) {
      reportDateText = dateMatch[0];
      const parsed = new Date(reportDateText);
      if (!isNaN(parsed.getTime())) {
        reportDate = parsed;
      }
      break;
    }
  }

  const allDeals: ExtractedDeal[] = [];
  const dealsByOwner: Record<SalesOwner, ExtractedDeal[]> = {
    Ben: [],
    Luke: [],
    Emmet: [],
    Kevin: [],
  };

  let currentOwner: SalesOwner | null = null;
  let lastMainDeal: ExtractedDeal | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines
    if (!line || line.match(/^,*$/)) continue;

    // Detect owner section header
    const ownerMatch = line.match(/^"?(Ben|Luke|Emmet|Kevin)\s+\w+\s*[-–—]\s*Sales/i);
    if (ownerMatch) {
      currentOwner = ownerMatch[1] as SalesOwner;
      lastMainDeal = null;
      continue;
    }

    // Skip if no owner yet
    if (!currentOwner) continue;

    // Skip header rows and summary rows
    if (line.match(/^,?Deal,/i)) continue;
    if (line.match(/Total:/i)) continue;
    if (line.match(/^"?(Ben|Luke|Emmet|Kevin):/i)) continue;
    if (line.match(/Total Active:/i)) continue;

    // Parse the line into fields
    const fields = parseCSVLine(line);

    // Try to extract deal data using flexible detection
    const dealData = extractDealFromFields(fields);

    if (!dealData.dealName) continue;

    // Skip orphan data rows (start with date, no deal name pattern)
    if (dealData.dealName.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d/i)) {
      continue;
    }

    // Check if this is a sub-deal
    const isSubDeal = dealData.dealName.startsWith('↳') ||
                      dealData.dealName.startsWith('→') ||
                      dealData.dealName.includes('(sub-deal)');
    const cleanDealName = dealData.dealName
      .replace(/^[↳→\->]+\s*/, '')
      .replace(/\s*\(sub-deal\)\s*/i, '')
      .trim();

    if (!cleanDealName) continue;

    // Parse value
    const valueParsed = parseDealValue(dealData.valueText || '');

    // Parse stage
    const normalizedStage = normalizeStageText(dealData.stage || '');
    const stageMapped = mapPdfStageToEnum(normalizedStage);

    // Parse task
    let task: ExtractedTask | null = null;
    if (dealData.taskDue && dealData.taskDue !== '—' && dealData.taskDue !== '-') {
      const taskInfo = parseTaskField(dealData.taskDue, reportDate.getFullYear());
      if (taskInfo) {
        task = taskInfo;
      }
    }

    const deal: ExtractedDeal = {
      dealName: cleanDealName,
      owner: currentOwner,
      valueText: dealData.valueText || '',
      valueParsed,
      stage: normalizedStage,
      stageMapped,
      nextStep: dealData.nextStep || null,
      task,
      isSubDeal,
      parentDealName: isSubDeal && lastMainDeal ? lastMainDeal.dealName : undefined,
      matchConfidence: undefined,
      importAction: undefined,
    };

    allDeals.push(deal);
    dealsByOwner[currentOwner].push(deal);

    if (!isSubDeal) {
      lastMainDeal = deal;
    }
  }

  // Calculate totals
  const totalValue = allDeals.reduce((sum, deal) => sum + (deal.valueParsed || 0), 0);

  return {
    reportDate,
    reportDateText,
    fileName,
    dealsByOwner,
    allDeals,
    allLeads: [],
    allMeetings: [],
    totalDeals: allDeals.length,
    totalValue,
    totalLeads: 0,
    totalMeetings: 0,
    extractedAt: new Date(),
    processingModel: 'csv-parser',
    rawResponse: csvContent,
  };
}

/**
 * Extract deal data from fields using pattern detection
 * Handles varying column positions
 */
function extractDealFromFields(fields: string[]): {
  dealName: string;
  valueText: string;
  stage: string;
  nextStep: string;
  taskDue: string;
} {
  let dealName = '';
  let valueText = '';
  let stage = '';
  let nextStep = '';
  let taskDue = '';

  // Find each field by pattern matching
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i].trim();
    if (!field) continue;

    // Value pattern: $xxxK, $xxxM, or $x.xM
    if (!valueText && field.match(/^\$[\d.,]+[KMB]?$/i)) {
      valueText = field;
      continue;
    }

    // Stage pattern: known stage keywords
    if (!stage && STAGE_KEYWORDS.some(kw => field.toLowerCase().includes(kw))) {
      stage = field;
      continue;
    }

    // Task due pattern: date at start (Jan 27, Feb 3, etc.) or contains ⚠
    if (!taskDue && (
      field.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*\d/i) ||
      field.includes('⚠') ||
      field === '—' ||
      field === '-'
    )) {
      taskDue = field;
      continue;
    }

    // Deal name: first substantial text field that's not value/stage/task
    // Usually contains company name patterns
    if (!dealName && field.length > 1 &&
        !field.match(/^\$/) &&
        !field.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*\d/i) &&
        !STAGE_KEYWORDS.some(kw => field.toLowerCase() === kw)) {
      // Check if this looks like a deal name (not a long sentence)
      if (field.length < 80 && !field.includes('.') || field.startsWith('↳')) {
        dealName = field;
        continue;
      }
    }

    // Next step: longer text field, usually contains periods or is descriptive
    if (!nextStep && field.length > 20) {
      nextStep = field;
    }
  }

  // If we still don't have nextStep but have remaining long fields, use them
  if (!nextStep) {
    for (const field of fields) {
      const trimmed = field.trim();
      if (trimmed.length > 30 &&
          trimmed !== dealName &&
          trimmed !== valueText &&
          trimmed !== stage &&
          trimmed !== taskDue) {
        nextStep = trimmed;
        break;
      }
    }
  }

  return { dealName, valueText, stage, nextStep, taskDue };
}

/**
 * Normalize stage text that might have merged words
 */
function normalizeStageText(stage: string): string {
  if (!stage) return '';

  return stage
    .replace(/SpecProduction/i, 'Spec Production')
    .replace(/ProposalSent/i, 'Proposal Sent')
    .replace(/ClosedWon/i, 'Closed Won')
    .replace(/ClosedLost/i, 'Closed Lost')
    .trim();
}

/**
 * Parse a CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  fields.push(current.trim());
  return fields;
}

/**
 * Parse task due field
 */
function parseTaskField(taskText: string, referenceYear: number): ExtractedTask | null {
  if (!taskText || taskText === '—' || taskText === '-') return null;

  const isOverdue = taskText.includes('⚠') || taskText.toLowerCase().includes('overdue');
  const cleanText = taskText.replace(/⚠/g, '').trim();

  const datePatterns = [
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*(\d{1,2})/i,
    /^(\d{1,2})\/(\d{1,2})/,
  ];

  const monthMap: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };

  let dueDate: Date | null = null;
  let description = cleanText;

  for (const pattern of datePatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      let month: number;
      let day: number;

      if (match[1].length <= 2) {
        month = parseInt(match[1], 10) - 1;
        day = parseInt(match[2], 10);
      } else {
        month = monthMap[match[1].toLowerCase()];
        day = parseInt(match[2], 10);
      }

      dueDate = new Date(referenceYear, month, day);
      description = cleanText.replace(match[0], '').trim();
      break;
    }
  }

  if (!dueDate && !isOverdue && description === cleanText) {
    return null;
  }

  const now = new Date();
  const actuallyOverdue = dueDate ? dueDate < now : isOverdue;

  return {
    dueDate,
    dueDateText: taskText,
    description: description || taskText,
    isOverdue: actuallyOverdue,
    priority: actuallyOverdue ? 'HIGH' : 'NORMAL',
  };
}

/**
 * Check if the content is a CSV file
 */
export function isCSVContent(content: string): boolean {
  const lines = content.split('\n').slice(0, 15);

  let commaCount = 0;
  let hasStructuredData = false;

  for (const line of lines) {
    const commas = (line.match(/,/g) || []).length;
    if (commas > 2) commaCount++;

    if (line.includes('Daily Sales Report') ||
        line.match(/^"?(Ben|Luke|Emmet|Kevin)\s+\w+\s*[-–—]\s*Sales/i) ||
        line.match(/Deal.*Value.*Stage/i) ||
        line.match(/\$[\d.]+[KMB]/i)) {
      hasStructuredData = true;
    }
  }

  return commaCount >= 3 || hasStructuredData;
}
