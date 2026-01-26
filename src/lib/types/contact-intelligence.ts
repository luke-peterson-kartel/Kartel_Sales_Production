// Contact Intelligence Types
// TypeScript interfaces for contact enrichment and client intelligence

import type {
  SeniorityLevel,
  DecisionAuthorityType,
  BuyingRoleType,
  DepartmentType,
  EnrichmentSourceType,
  CompanySizeType,
} from '../constants/contact-intelligence';

// ============================================
// CONTACT INTELLIGENCE
// ============================================

export interface ContactIntelligence {
  jobTitle?: string;
  department?: DepartmentType;
  seniority?: SeniorityLevel;
  seniorityScore?: number;
  decisionAuthority?: DecisionAuthorityType;
  buyingRole?: BuyingRoleType;
  linkedInUrl?: string;
  enrichedAt?: Date;
  enrichmentSource?: EnrichmentSourceType;
}

export interface EnrichedContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  isPrimary: boolean;

  // Intelligence fields
  jobTitle?: string;
  department?: string;
  seniority?: string;
  seniorityScore?: number;
  decisionAuthority?: string;
  buyingRole?: string;
  linkedInUrl?: string;
  enrichedAt?: Date | null;
  enrichmentSource?: string;
  enrichmentData?: string; // JSON string
  lastContactedAt?: Date | null;
  engagementScore?: number;
  notes?: string;

  clientId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// CLIENT INTELLIGENCE (Website Analysis)
// ============================================

export interface LeadershipMember {
  name: string;
  title: string;
  linkedIn?: string;
  email?: string;
  isLikelyDM?: boolean;
  department?: string;
}

export interface SocialPresence {
  platforms: string[];
  followers?: Record<string, number>;
  notes?: string;
}

export interface ClientIntelligenceData {
  // Company Info
  companyDescription?: string;
  companySize?: CompanySizeType;
  estimatedEmployees?: string;
  estimatedRevenue?: string;
  industry?: string;

  // Leadership
  leadershipTeam?: LeadershipMember[];
  keyContacts?: LeadershipMember[];

  // Creative/Marketing Intel
  currentCreativeApproach?: string;
  brandGuidelines?: string;
  socialPresence?: SocialPresence;
  competitors?: string[];

  // AI Suggestions
  suggestedTalkingPoints?: string[];
  suggestedQuestions?: string[];

  // Metadata
  websiteAnalyzedAt?: Date;
  websiteUrl?: string;
  analysisModel?: string;
  analysisTokens?: number;
  analysisError?: string;
}

// ============================================
// WEBSITE ANALYSIS
// ============================================

export interface WebsiteAnalysisRequest {
  clientId: string;
  websiteUrl: string;
  vertical?: string;
}

export interface WebsiteAnalysisResult {
  success: boolean;
  data?: {
    companyInfo: {
      description: string;
      industry?: string;
      sizeIndicator?: CompanySizeType;
      estimatedEmployees?: string;
    };
    leadershipTeam: LeadershipMember[];
    creativeInsights?: {
      currentApproach?: string;
      platforms?: string[];
      brandNotes?: string;
    };
    socialPresence?: SocialPresence;
    recommendations?: {
      priorityContacts: string[];
      talkingPoints: string[];
      suggestedQuestions: string[];
    };
  };
  error?: string;
  tokensUsed?: number;
}

// ============================================
// CONTACT ENRICHMENT
// ============================================

export interface ContactEnrichmentRequest {
  contactId: string;
  source: EnrichmentSourceType;
  // Optional identifiers for external APIs
  email?: string;
  name?: string;
  company?: string;
  linkedInUrl?: string;
}

export interface ContactEnrichmentResult {
  success: boolean;
  source: EnrichmentSourceType;
  data?: {
    jobTitle?: string;
    seniority?: SeniorityLevel;
    seniorityScore?: number;
    department?: DepartmentType;
    linkedInUrl?: string;
    company?: string;
    location?: string;
    // Raw response for storage
    raw?: Record<string, unknown>;
  };
  error?: string;
  creditsUsed?: number;
}

// ============================================
// APOLLO.IO TYPES
// ============================================

export interface ApolloPersonMatch {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  linkedin_url?: string;
  title?: string;
  seniority?: string;
  departments?: string[];
  email?: string;
  phone_numbers?: Array<{
    raw_number: string;
    type: string;
  }>;
  organization?: {
    id: string;
    name: string;
    website_url?: string;
    industry?: string;
    estimated_num_employees?: number;
  };
}

export interface ApolloEnrichmentResponse {
  person?: ApolloPersonMatch;
  status?: string;
  error?: string;
}

// ============================================
// DECISION MAKER MAPPING
// ============================================

export interface BuyingCommitteeMember {
  contact: EnrichedContact;
  authority: DecisionAuthorityType;
  role: BuyingRoleType;
  engaged: boolean;
  lastEngagementDate?: Date;
}

export interface BuyingCommittee {
  clientId: string;
  clientName: string;
  members: BuyingCommitteeMember[];
  coverage: {
    hasDecisionMaker: boolean;
    hasBudgetHolder: boolean;
    hasChampion: boolean;
    hasEconomicBuyer: boolean;
  };
  gaps: string[]; // Missing roles
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ContactCreateRequest {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  isPrimary?: boolean;
  jobTitle?: string;
  department?: string;
  seniority?: string;
  decisionAuthority?: string;
  buyingRole?: string;
  linkedInUrl?: string;
  notes?: string;
}

export interface ContactUpdateRequest extends Partial<ContactCreateRequest> {
  id: string;
}

export interface ClientIntelligenceUpdateRequest {
  clientId: string;
  companyDescription?: string;
  companySize?: string;
  estimatedEmployees?: string;
  industry?: string;
  leadershipTeam?: LeadershipMember[];
  currentCreativeApproach?: string;
  suggestedTalkingPoints?: string[];
  suggestedQuestions?: string[];
}
