// Kartel Project Calculator - Conversation Processing Types
// Based on Initial_Call_Processing_Template.md

// ============================================
// PARTICIPANT TYPES
// ============================================

export interface ClientAttendee {
  name: string;
  role?: string;
  notes?: string;
  email?: string;
}

export interface KartelAttendee {
  name: string;
  role: string;
}

// ============================================
// CALL SUMMARY SECTION
// ============================================

export interface ImmediateNeed {
  what: string;
  why: string;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  urgencyNote?: string; // Direct quote about urgency if available
}

export interface Concern {
  concern: string;
  details: string;
}

export interface NextStep {
  owner: string;
  action: string;
}

export interface KeyTakeaways {
  immediateNeed: ImmediateNeed;
  useCase: string[];
  concerns: Concern[];
}

export interface CallSummary {
  accountName: string;
  endClient?: string;
  accountType?: string; // "Agency", "Direct", etc.
  industry?: string;
  callType: string; // "Introduction / Discovery", "Test Engagement", etc.
  keyTakeaways: KeyTakeaways;
  nextSteps: NextStep[];
}

// ============================================
// OPPORTUNITY RECORD SECTION
// ============================================

export interface AccountInfo {
  accountName: string;
  endClient?: string;
  accountType: string;
  industry: string;
}

export interface OpportunityDetails {
  opportunityName: string;
  useCase: string;
  primaryNeed: string;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  stage: string;
}

export interface OpenQuestion {
  question: string;
  whyItMatters: string;
}

export interface DealScenario {
  scenario: string;
  monthlyFee: string;
  acv: string;
}

export interface DealSizing {
  note?: string;
  scenarios: DealScenario[];
}

export interface OpportunityData {
  accountInfo: AccountInfo;
  contacts: ClientAttendee[];
  opportunityDetails: OpportunityDetails;
  openQuestions: OpenQuestion[];
  dealSizing: DealSizing;
}

// ============================================
// TEST ENGAGEMENT SECTION
// ============================================

export interface TestPurpose {
  goal: string;
  whyItMatters: string;
}

export interface TestDeliverable {
  type: string;
  quantity: string;
  notes: string;
}

export interface RequiredAsset {
  assetType: string;
  purpose: string;
  format: string;
}

export interface TestScope {
  deliverables: TestDeliverable[];
  requiredAssets: RequiredAsset[];
  helpfulAssets: RequiredAsset[];
  briefRequirements: string[];
}

export interface TimelinePhase {
  phase: string;
  duration: string;
  activities: string;
}

export interface SuccessCriteria {
  criteria: string;
  measure: string;
}

export interface TestRisk {
  risk: string;
  likelihood: 'HIGH' | 'MEDIUM' | 'LOW';
  mitigation: string;
}

export interface TestEngagement {
  purpose: TestPurpose[];
  scope: TestScope;
  timeline: TimelinePhase[];
  successCriteria: SuccessCriteria[];
  risks: TestRisk[];
}

// ============================================
// FOLLOW-UP EMAILS SECTION
// ============================================

export interface FollowUpEmail {
  emailType: string; // "Post-Call Recap", "Data Request", etc.
  to: string;
  cc?: string[];
  subject: string;
  body: string;
}

// ============================================
// INTERNAL CHECKLIST SECTION
// ============================================

export interface ChecklistItem {
  item: string;
  checked: boolean;
}

export interface CommunicationRhythmItem {
  touchpoint: string;
  owner: string;
  when: string;
}

export interface InternalChecklist {
  dataIntake: ChecklistItem[];
  briefReview: ChecklistItem[];
  communicationRhythm: CommunicationRhythmItem[];
}

// ============================================
// COMPLETE EXTRACTED DATA
// ============================================

export interface ExtractedConversationData {
  // Meeting Metadata
  meetingDate?: string;
  meetingDuration?: string;
  meetingStage?: string;

  // Participants
  clientAttendees: ClientAttendee[];
  kartelAttendees: KartelAttendee[];

  // Sections
  callSummary: CallSummary;
  opportunityData: OpportunityData;
  testEngagement?: TestEngagement; // Optional - only if test engagement was discussed
  followUpEmails: FollowUpEmail[];
  internalChecklist: InternalChecklist;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ProcessingResult {
  success: boolean;
  data?: ExtractedConversationData;
  error?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

// ============================================
// CONSTANTS
// ============================================

export const TRANSCRIPT_SOURCES = [
  { value: 'manual', label: 'Manual Entry' },
  { value: 'tactiq', label: 'Tactiq' },
  { value: 'otter', label: 'Otter.ai' },
  { value: 'zoom', label: 'Zoom Transcript' },
  { value: 'teams', label: 'Microsoft Teams' },
  { value: 'other', label: 'Other' },
] as const;

export type TranscriptSource = typeof TRANSCRIPT_SOURCES[number]['value'];

export const MEETING_STAGES = [
  { value: 'Discovery', label: 'Discovery / Introduction' },
  { value: 'TestEngagement', label: 'Test Engagement' },
  { value: 'Proposal', label: 'Proposal Presentation' },
  { value: 'Negotiation', label: 'Negotiation' },
  { value: 'CheckIn', label: 'Check-In / Status' },
  { value: 'Other', label: 'Other' },
] as const;

export type MeetingStage = typeof MEETING_STAGES[number]['value'];

export const URGENCY_LEVELS = [
  { value: 'HIGH', label: 'High', color: 'red' },
  { value: 'MEDIUM', label: 'Medium', color: 'yellow' },
  { value: 'LOW', label: 'Low', color: 'gray' },
] as const;

export type UrgencyLevel = typeof URGENCY_LEVELS[number]['value'];
