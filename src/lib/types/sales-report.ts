// Types for Daily Sales Report Import feature
// These types represent the data extracted from the PDF before import

import { SalesStage, LeadStatus, SalesOwner, TaskPriority } from '@/lib/constants/sales-stages';

// ============================================
// EXTRACTED DEAL DATA
// ============================================

export interface ExtractedDeal {
  // Core deal info
  dealName: string; // e.g., "Saatchi (Toyota)", "Treefort Microdrama"
  owner: SalesOwner; // Ben, Luke, Emmet, Kevin
  valueText: string; // e.g., "$1.2M", "$500K" - raw text from PDF
  valueParsed: number | null; // Parsed numeric value
  stage: string; // Raw stage text from PDF
  stageMapped: SalesStage | null; // Mapped to our enum
  nextStep: string | null; // Free text next step

  // Task extracted from deal row
  task: ExtractedTask | null;

  // For matching/import
  matchedClientId?: string; // If matched to existing client
  matchConfidence?: 'exact' | 'partial' | 'fuzzy';

  // Parent deal info for sub-deals
  parentDealName?: string; // e.g., "Treefort" is parent of "Treefort Microdrama"
  isSubDeal: boolean;

  // Import status
  importAction?: 'create' | 'update' | 'skip';
  importError?: string;
}

export interface ExtractedTask {
  dueDate: Date | null; // Parsed from "Jan 27", "Feb 3" etc.
  dueDateText: string; // Raw text: "Jan 27 Schedule Garage mtg"
  description: string; // Extracted action: "Schedule Garage mtg"
  isOverdue: boolean;
  priority: TaskPriority;
}

// ============================================
// EXTRACTED LEAD DATA
// ============================================

export interface ExtractedLead {
  name: string;
  company: string;
  status: string; // Raw status text
  statusMapped: LeadStatus | null;
  owner: SalesOwner;

  // For matching/import
  matchedClientId?: string;
  matchedContactId?: string;

  // Import status
  importAction?: 'create' | 'update' | 'skip';
}

// ============================================
// EXTRACTED MEETING DATA
// ============================================

export interface ExtractedMeeting {
  title: string;
  dateText: string; // Raw: "Jan 28", "Jan 29 AM"
  dateParsed: Date | null;
  time: string | null; // If time is specified
  attendees: string[]; // Names mentioned
  relatedDeal: string | null; // If associated with a deal
}

// ============================================
// FULL EXTRACTED REPORT
// ============================================

export interface ExtractedSalesReport {
  // Metadata
  reportDate: Date;
  reportDateText: string; // Raw: "Jan 27, 2026"
  fileName: string;

  // Extracted content by owner
  dealsByOwner: Record<SalesOwner, ExtractedDeal[]>;

  // Flat lists for processing
  allDeals: ExtractedDeal[];
  allLeads: ExtractedLead[];
  allMeetings: ExtractedMeeting[];

  // Statistics
  totalDeals: number;
  totalValue: number; // Sum of all parsed values
  totalLeads: number;
  totalMeetings: number;

  // Processing info
  extractedAt: Date;
  processingModel?: string;
  rawResponse?: string; // Claude's raw response for debugging
}

// ============================================
// IMPORT PREVIEW & RESULTS
// ============================================

export interface ImportPreview {
  deals: ImportDealPreview[];
  leads: ImportLeadPreview[];
  summary: ImportSummary;
}

export interface ImportDealPreview {
  extracted: ExtractedDeal;

  // Match info
  matchedClient: {
    id: string;
    name: string;
  } | null;

  // What will happen
  action: 'create' | 'update' | 'skip';
  reason?: string; // Why skipped, or update details

  // Changes if updating
  changes?: {
    field: string;
    oldValue: string | null;
    newValue: string;
  }[];
}

export interface ImportLeadPreview {
  extracted: ExtractedLead;
  matchedClient: { id: string; name: string } | null;
  matchedContact: { id: string; name: string } | null;
  action: 'create_client' | 'add_contact' | 'update' | 'skip';
  reason?: string;
}

export interface ImportSummary {
  dealsToCreate: number;
  dealsToUpdate: number;
  dealsToSkip: number;
  leadsToProcess: number;
  tasksToCreate: number;
  warnings: string[];
}

export interface ImportResult {
  success: boolean;
  importId: string; // SalesReportImport record ID

  // Counts
  clientsCreated: number;
  clientsUpdated: number;
  contactsCreated: number;
  tasksCreated: number;

  // Details
  createdClients: { id: string; name: string }[];
  updatedClients: { id: string; name: string; changes: string[] }[];
  errors: string[];
  warnings: string[];
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface ParseSalesReportRequest {
  pdfContent: string; // Base64 encoded PDF or extracted text
  fileName: string;
  reportDate?: string; // ISO date if known, otherwise extracted from PDF
}

export interface ParseSalesReportResponse {
  success: boolean;
  data?: ExtractedSalesReport;
  error?: string;
}

export interface ImportSalesReportRequest {
  extractedReport: ExtractedSalesReport;
  options: {
    createNewClients: boolean; // Create clients for unmatched deals
    updateExisting: boolean; // Update existing client data
    createTasks: boolean; // Create SalesTask records
    dryRun: boolean; // Preview only, don't actually import
  };
}

export interface ImportSalesReportResponse {
  success: boolean;
  preview?: ImportPreview; // If dryRun
  result?: ImportResult; // If not dryRun
  error?: string;
}

// ============================================
// CLIENT MATCHING
// ============================================

export interface ClientMatch {
  clientId: string;
  clientName: string;
  confidence: 'exact' | 'partial' | 'fuzzy';
  score: number; // 0-100 match score
  reason: string; // Why this match was suggested
}

export interface MatchClientRequest {
  dealName: string;
  existingClientIds?: string[]; // Optional list to search within
}

export interface MatchClientResponse {
  matches: ClientMatch[];
  suggestedAction: 'use_match' | 'create_new' | 'review';
}
