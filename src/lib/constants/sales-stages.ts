// Sales Pipeline Stages and Constants
// Used for the Daily Sales Report Import feature

// Sales Stages (from sales pipeline workflow)
export const SALES_STAGES = {
  DISCOVERY: 'DISCOVERY',
  SCOPING: 'SCOPING',
  SPEC_PRODUCTION: 'SPEC_PRODUCTION',
  NEGOTIATION: 'NEGOTIATION',
  PROPOSAL_SENT: 'PROPOSAL_SENT',
  CLOSED_WON: 'CLOSED_WON',
  CLOSED_LOST: 'CLOSED_LOST',
} as const;

export type SalesStage = (typeof SALES_STAGES)[keyof typeof SALES_STAGES];

export const SALES_STAGE_LABELS: Record<SalesStage, string> = {
  DISCOVERY: 'Discovery',
  SCOPING: 'Scoping',
  SPEC_PRODUCTION: 'Spec Production',
  NEGOTIATION: 'Negotiation',
  PROPOSAL_SENT: 'Proposal Sent',
  CLOSED_WON: 'Closed Won',
  CLOSED_LOST: 'Closed Lost',
};

export const SALES_STAGE_COLORS: Record<SalesStage, string> = {
  DISCOVERY: '#6366f1', // Indigo
  SCOPING: '#8b5cf6', // Violet
  SPEC_PRODUCTION: '#f59e0b', // Amber
  NEGOTIATION: '#3b82f6', // Blue
  PROPOSAL_SENT: '#10b981', // Emerald
  CLOSED_WON: '#22c55e', // Green
  CLOSED_LOST: '#ef4444', // Red
};

// Ordered for pipeline display
export const SALES_STAGE_ORDER: SalesStage[] = [
  'DISCOVERY',
  'SCOPING',
  'SPEC_PRODUCTION',
  'NEGOTIATION',
  'PROPOSAL_SENT',
  'CLOSED_WON',
  'CLOSED_LOST',
];

// Lead Status (for contacts from Key Leads section)
export const LEAD_STATUSES = {
  LEAD: 'LEAD',
  CONNECTED: 'CONNECTED',
  OPEN_DEAL: 'OPEN_DEAL',
  CONVERTED_TO_DEAL: 'CONVERTED_TO_DEAL',
} as const;

export type LeadStatus = (typeof LEAD_STATUSES)[keyof typeof LEAD_STATUSES];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  LEAD: 'Lead',
  CONNECTED: 'Connected',
  OPEN_DEAL: 'Open Deal',
  CONVERTED_TO_DEAL: 'Converted to Deal',
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  LEAD: '#94a3b8', // Slate
  CONNECTED: '#3b82f6', // Blue
  OPEN_DEAL: '#f59e0b', // Amber
  CONVERTED_TO_DEAL: '#22c55e', // Green
};

// Sales Team Members (deal owners from the report)
export const SALES_OWNERS = ['Ben', 'Luke', 'Emmet', 'Kevin'] as const;
export type SalesOwner = (typeof SALES_OWNERS)[number];

// Task Priority Levels
export const TASK_PRIORITIES = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[keyof typeof TASK_PRIORITIES];

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: 'Low',
  NORMAL: 'Normal',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: '#94a3b8', // Slate
  NORMAL: '#3b82f6', // Blue
  HIGH: '#f59e0b', // Amber
  URGENT: '#ef4444', // Red
};

// Helper function to parse deal value strings like "$1.2M", "$500K", "$2.5M"
export function parseDealValue(valueStr: string): number | null {
  if (!valueStr) return null;

  // Remove whitespace and currency symbol
  const cleaned = valueStr.replace(/[\s$,]/g, '').toUpperCase();

  // Match patterns like "1.2M", "500K", "2500000"
  const match = cleaned.match(/^([\d.]+)([MK])?$/);
  if (!match) return null;

  const num = parseFloat(match[1]);
  if (isNaN(num)) return null;

  const multiplier = match[2];
  if (multiplier === 'M') return num * 1_000_000;
  if (multiplier === 'K') return num * 1_000;
  return num;
}

// Helper function to format deal value for display
export function formatDealValue(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';

  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

// Helper to map PDF stage text to our stage enum
export function mapPdfStageToEnum(stageText: string): SalesStage | null {
  const normalized = stageText.toLowerCase().trim();

  if (normalized.includes('discovery') || normalized.includes('intro')) {
    return 'DISCOVERY';
  }
  if (normalized.includes('scoping') || normalized.includes('scope')) {
    return 'SCOPING';
  }
  if (normalized.includes('spec') || normalized.includes('test')) {
    return 'SPEC_PRODUCTION';
  }
  if (normalized.includes('negotiat')) {
    return 'NEGOTIATION';
  }
  if (normalized.includes('proposal')) {
    return 'PROPOSAL_SENT';
  }
  if (normalized.includes('won') || normalized.includes('closed won')) {
    return 'CLOSED_WON';
  }
  if (normalized.includes('lost') || normalized.includes('closed lost')) {
    return 'CLOSED_LOST';
  }

  return null;
}
