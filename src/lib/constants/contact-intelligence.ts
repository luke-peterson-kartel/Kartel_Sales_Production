// Contact Intelligence Constants
// Seniority levels, decision authority, buying roles, and departments

// Seniority Levels with scoring for sorting
export const SENIORITY_LEVELS = [
  { value: 'C_LEVEL', label: 'C-Level', score: 10, description: 'CEO, CTO, CMO, CFO, COO, etc.' },
  { value: 'VP', label: 'VP/SVP/EVP', score: 8, description: 'Vice President level' },
  { value: 'DIRECTOR', label: 'Director', score: 6, description: 'Director level' },
  { value: 'MANAGER', label: 'Manager', score: 4, description: 'Manager level' },
  { value: 'INDIVIDUAL_CONTRIBUTOR', label: 'Individual Contributor', score: 2, description: 'No direct reports' },
] as const;

// Decision Authority Types
export const DECISION_AUTHORITY = [
  { value: 'DECISION_MAKER', label: 'Decision Maker', icon: 'crown', color: 'green', description: 'Has final say on purchase decisions' },
  { value: 'BUDGET_HOLDER', label: 'Budget Holder', icon: 'dollar-sign', color: 'blue', description: 'Controls the budget allocation' },
  { value: 'INFLUENCER', label: 'Influencer', icon: 'star', color: 'yellow', description: 'Influences the decision but doesn\'t decide' },
  { value: 'END_USER', label: 'End User', icon: 'user', color: 'gray', description: 'Will use the deliverables day-to-day' },
  { value: 'GATEKEEPER', label: 'Gatekeeper', icon: 'shield', color: 'orange', description: 'Controls access to decision makers' },
] as const;

// Buying Roles (MEDDIC/MEDDPICC inspired)
export const BUYING_ROLES = [
  { value: 'CHAMPION', label: 'Champion', description: 'Internal advocate pushing for the solution', tips: 'Nurture this relationship - they sell internally for you' },
  { value: 'ECONOMIC_BUYER', label: 'Economic Buyer', description: 'Controls budget and signs contracts', tips: 'Need direct access - understand their success metrics' },
  { value: 'TECHNICAL_BUYER', label: 'Technical Buyer', description: 'Evaluates technical fit and capabilities', tips: 'Address technical concerns and provide proof points' },
  { value: 'USER_BUYER', label: 'User Buyer', description: 'Will use the solution day-to-day', tips: 'Understand their workflow and pain points' },
  { value: 'COACH', label: 'Coach', description: 'Provides inside information about the org', tips: 'Valuable for navigating internal politics' },
] as const;

// Departments
export const CONTACT_DEPARTMENTS = [
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'CREATIVE', label: 'Creative' },
  { value: 'EXECUTIVE', label: 'Executive/Leadership' },
  { value: 'PROCUREMENT', label: 'Procurement' },
  { value: 'IT', label: 'IT/Technology' },
  { value: 'OPERATIONS', label: 'Operations' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'SALES', label: 'Sales' },
  { value: 'LEGAL', label: 'Legal' },
  { value: 'OTHER', label: 'Other' },
] as const;

// Enrichment Sources
export const ENRICHMENT_SOURCES = [
  { value: 'WEBSITE_ANALYSIS', label: 'Website Analysis', cost: 'Free (~$0.02 API)', description: 'Extracted from client website using Claude' },
  { value: 'APOLLO', label: 'Apollo.io', cost: 'Free tier: 100/month', description: 'B2B contact enrichment platform' },
  { value: 'CONVERSATION', label: 'Conversation', cost: 'Free', description: 'Extracted from call transcripts' },
  { value: 'MANUAL', label: 'Manual Entry', cost: 'Free', description: 'Manually entered by user' },
] as const;

// Company Size Classifications
export const COMPANY_SIZES = [
  { value: 'STARTUP', label: 'Startup', employees: '1-50', description: 'Early stage company' },
  { value: 'SMB', label: 'SMB', employees: '51-200', description: 'Small to medium business' },
  { value: 'MID_MARKET', label: 'Mid-Market', employees: '201-1000', description: 'Mid-sized company' },
  { value: 'ENTERPRISE', label: 'Enterprise', employees: '1000+', description: 'Large enterprise' },
] as const;

// Helper functions
export function getSeniorityScore(seniority: string | null | undefined): number {
  if (!seniority) return 0;
  const level = SENIORITY_LEVELS.find(l => l.value === seniority);
  return level?.score ?? 0;
}

export function getSeniorityLabel(seniority: string | null | undefined): string {
  if (!seniority) return 'Unknown';
  const level = SENIORITY_LEVELS.find(l => l.value === seniority);
  return level?.label ?? seniority;
}

export function getDecisionAuthorityInfo(authority: string | null | undefined) {
  if (!authority) return null;
  return DECISION_AUTHORITY.find(a => a.value === authority) ?? null;
}

export function getBuyingRoleInfo(role: string | null | undefined) {
  if (!role) return null;
  return BUYING_ROLES.find(r => r.value === role) ?? null;
}

export function getDepartmentLabel(department: string | null | undefined): string {
  if (!department) return 'Unknown';
  const dept = CONTACT_DEPARTMENTS.find(d => d.value === department);
  return dept?.label ?? department;
}

// Type exports for use in components
export type SeniorityLevel = typeof SENIORITY_LEVELS[number]['value'];
export type DecisionAuthorityType = typeof DECISION_AUTHORITY[number]['value'];
export type BuyingRoleType = typeof BUYING_ROLES[number]['value'];
export type DepartmentType = typeof CONTACT_DEPARTMENTS[number]['value'];
export type EnrichmentSourceType = typeof ENRICHMENT_SOURCES[number]['value'];
export type CompanySizeType = typeof COMPANY_SIZES[number]['value'];
