// Kartel Project Calculator - Constants and Type Definitions

// ============================================
// VERTICALS
// ============================================

export const VERTICALS = [
  { value: 'Automotive', label: 'Automotive', clients: ['Toyota/Saatchi', 'Lexus/TeamOne'] },
  { value: 'CPG', label: 'CPG (Consumer Packaged Goods)', clients: ['Newell/Rubbermaid'] },
  { value: 'Fashion', label: 'Fashion', clients: ['Marc Jacobs'] },
  { value: 'Retail', label: 'Retail', clients: ['PriceSmart'] },
  { value: 'Health', label: 'Health & Wellness', clients: ['Thesis'] },
  { value: 'MediaTech', label: 'MediaTech', clients: ['Horizon/Blu'] },
  { value: 'RealEstate', label: 'Real Estate', clients: ['Woodmont', 'AvantStay'] },
  { value: 'Entertainment', label: 'Media/Entertainment', clients: ['Fox (Masked Singer)'] },
] as const;

export type Vertical = typeof VERTICALS[number]['value'];

// ============================================
// PROJECT TYPES & STATUS
// ============================================

export const PROJECT_TYPES = [
  { value: 'SPEC', label: 'Spec Work', description: '$0 revenue, same process' },
  { value: 'STANDARD', label: 'Standard', description: 'No LoRA or Gen team needed' },
  { value: 'ADVANCED', label: 'Advanced', description: 'LoRA capture + Gen Engineering required' },
] as const;

export type ProjectType = typeof PROJECT_TYPES[number]['value'];

export const PROJECT_STATUSES = [
  { value: 'ON_DECK', label: 'On Deck', color: 'gray' },
  { value: 'IN_SPEC', label: 'In Spec', color: 'blue' },
  { value: 'IN_PRODUCTION', label: 'In Production', color: 'yellow' },
  { value: 'FINISHING', label: 'Finishing', color: 'purple' },
  { value: 'COMPLETE', label: 'Complete', color: 'green' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'red' },
] as const;

export type ProjectStatus = typeof PROJECT_STATUSES[number]['value'];

// ============================================
// CLASSIFICATION
// ============================================

export const CLASSIFICATIONS = [
  { value: 'SYSTEM', label: 'System Deal', description: 'Ongoing creative infrastructure (12-month minimum)' },
  { value: 'PROJECT', label: 'Project Deal', description: 'One-time campaign or initiative' },
  { value: 'UNDETERMINED', label: 'Undetermined', description: 'Not yet classified' },
] as const;

export type Classification = typeof CLASSIFICATIONS[number]['value'];

// ============================================
// RED FLAGS
// ============================================

export const RED_FLAGS = [
  { value: 'BUDGET_UNDER_600K', label: 'Budget Under $600K', severity: 'critical' },
  { value: 'ONE_OFF_ONLY', label: 'One-Off Project Only', severity: 'warning' },
  { value: 'NO_DATA_ASSETS', label: 'No Data/Assets Available', severity: 'warning' },
  { value: 'UNREALISTIC_TIMELINE', label: 'Unrealistic Timeline', severity: 'warning' },
  { value: 'NO_DECISION_MAKER', label: 'No Decision Maker Access', severity: 'critical' },
] as const;

export type RedFlag = typeof RED_FLAGS[number]['value'];

// ============================================
// HANDOFFS
// ============================================

export const HANDOFF_TYPES = [
  {
    number: 1,
    value: 'SALES_TO_PRODUCTION',
    label: 'Sales → Production',
    timing: '48 hours',
    description: 'SOW signed, all client info transferred'
  },
  {
    number: 2,
    value: 'PRODUCTION_TO_GENERATIVE',
    label: 'Production → Generative',
    timing: '1 week lead time',
    description: 'Brand assets, workflow specs, quality criteria'
  },
  {
    number: 3,
    value: 'GENERATIVE_TO_PRODUCTION',
    label: 'Generative → Production',
    timing: 'After QC',
    description: 'QC-passed deliverables, technical notes'
  },
  {
    number: 4,
    value: 'PRODUCTION_TO_SALES',
    label: 'Production → Sales',
    timing: 'Project close',
    description: 'Closing report, margin data, case study materials'
  },
] as const;

export type HandoffType = typeof HANDOFF_TYPES[number]['value'];

export const HANDOFF_STATUSES = [
  { value: 'PENDING', label: 'Pending', color: 'gray' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'blue' },
  { value: 'COMPLETED', label: 'Completed', color: 'green' },
] as const;

export type HandoffStatus = typeof HANDOFF_STATUSES[number]['value'];

// ============================================
// QUALIFICATION CALLS
// ============================================

export const QUALIFICATION_CALLS = [
  {
    number: 1,
    value: 'INTRO',
    label: 'Introduction & Qualification',
    day: 'Day 0',
    goal: 'Qualify lead, frame scope'
  },
  {
    number: 2,
    value: 'PRODUCT_SCOPE',
    label: 'Product Scope & Discovery',
    day: 'Day 3-7',
    goal: 'Confirm DM, discover needs'
  },
  {
    number: 3,
    value: 'BUDGET_SCOPE',
    label: 'Budget Scope & Alignment',
    day: 'Day 14-21',
    goal: 'Capture all proposal inputs'
  },
  {
    number: 4,
    value: 'PROPOSAL',
    label: 'Proposal Presentation',
    day: 'Day 21-30',
    goal: 'Present and close'
  },
] as const;

export type QualificationCallType = typeof QUALIFICATION_CALLS[number]['value'];

// ============================================
// DELIVERABLES
// ============================================

export const PLATFORMS = [
  { value: 'Meta', label: 'Meta (Facebook/Instagram)' },
  { value: 'TikTok', label: 'TikTok' },
  { value: 'Pinterest', label: 'Pinterest' },
  { value: 'YouTube', label: 'YouTube' },
  { value: 'OLV', label: 'OLV (Online Video Ad)' },
  { value: 'OTT', label: 'OTT (Over-The-Top)' },
  { value: 'CTV', label: 'CTV (Connected TV)' },
  { value: 'TV', label: 'TV/Long Form' },
  { value: 'GIF', label: 'Animated GIF' },
] as const;

export type Platform = typeof PLATFORMS[number]['value'];

export const CREATIVE_TYPES = [
  { value: 'Static', label: 'Static Image' },
  { value: 'Carousel', label: 'Carousel' },
  { value: 'Video', label: 'Video' },
  { value: 'UGC', label: 'UGC-Style Video' },
  { value: 'Branded', label: 'Branded Video' },
  { value: 'GIF', label: 'Animated GIF' },
  { value: 'StaticPin', label: 'Static Pin' },
  { value: 'IdeaPin', label: 'Idea Pin' },
  { value: 'VideoPin', label: 'Video Pin' },
] as const;

export type CreativeType = typeof CREATIVE_TYPES[number]['value'];

export const SIZES = [
  { value: '1x1', label: '1:1 (1080x1080)', platforms: ['Meta', 'TikTok', 'Pinterest', 'YouTube', 'OLV'] },
  { value: '9x16', label: '9:16 (1080x1920)', platforms: ['Meta', 'TikTok', 'Pinterest'] },
  { value: '4x5', label: '4:5 (Mobile)', platforms: ['Meta'] },
  { value: '16x9', label: '16:9 (1920x1080)', platforms: ['YouTube', 'OLV', 'CTV', 'TV', 'TikTok'] },
  { value: '2x3', label: '2:3 (Pinterest)', platforms: ['Pinterest'] },
  { value: '4x3', label: '4:3', platforms: ['OLV', 'YouTube', 'GIF'] },
] as const;

export type Size = typeof SIZES[number]['value'];

export const DURATIONS = [
  { value: 6, label: '6 seconds', category: 'short' },
  { value: 9, label: '9 seconds', category: 'short' },
  { value: 15, label: '15 seconds', category: 'short' },
  { value: 30, label: '30 seconds', category: 'medium' },
  { value: 45, label: '45 seconds', category: 'long' },
  { value: 60, label: '60 seconds', category: 'long' },
] as const;

export type Duration = typeof DURATIONS[number]['value'];

// ============================================
// DEPARTMENTS
// ============================================

export const DEPARTMENTS = [
  { value: 'Sales', label: 'Sales Team' },
  { value: 'Production', label: 'Production Team' },
  { value: 'LoRA', label: 'LoRA Team' },
  { value: 'GenEngineering', label: 'Gen Engineering Team' },
  { value: 'Creative', label: 'Creative Team' },
] as const;

export type Department = typeof DEPARTMENTS[number]['value'];

// ============================================
// MILESTONES
// ============================================

export const DEFAULT_MILESTONES = [
  // Sales Team
  { name: 'Turnover from Sales', department: 'Sales', order: 1 },

  // Production Team - Setup
  { name: 'Production Setup Complete', department: 'Production', order: 2 },
  { name: 'Creative Kickoff Complete', department: 'Production', order: 3 },
  { name: 'SOW Signed', department: 'Production', order: 4 },
  { name: 'First Payment Received', department: 'Production', order: 5 },
  { name: 'Creative Brief Approved', department: 'Production', order: 6 },
  { name: 'Project Pod Assigned', department: 'Production', order: 7 },

  // LoRA Team
  { name: 'Assets Received from Client', department: 'LoRA', order: 8 },
  { name: 'LoRA Photo/Video Capture Complete', department: 'LoRA', order: 9 },
  { name: 'Data Parsing Complete', department: 'LoRA', order: 10 },

  // Gen Engineering
  { name: 'Workflow Created', department: 'GenEngineering', order: 11 },
  { name: 'LoRA Training Complete', department: 'GenEngineering', order: 12 },
  { name: 'LoRA Validation Complete', department: 'GenEngineering', order: 13 },
  { name: 'Image/Video Library Generated', department: 'GenEngineering', order: 14 },

  // Production Team - Delivery
  { name: 'Spec Deck Sent to Client', department: 'Production', order: 15 },
  { name: 'Moodboard/Concept Sent', department: 'Production', order: 16 },
  { name: 'Moodboard/Concept Approved', department: 'Production', order: 17 },
  { name: 'Animatic/First Look Sent', department: 'Production', order: 18 },
  { name: 'Animatic/First Look Approved', department: 'Production', order: 19 },
  { name: 'Rough Cut/2nd Look Sent', department: 'Production', order: 20 },
  { name: 'Rough Cut/2nd Look Approved', department: 'Production', order: 21 },
  { name: 'Fine Cut/Last Look Sent', department: 'Production', order: 22 },
  { name: 'Fine Cut/Last Look Approved', department: 'Production', order: 23 },
  { name: 'Final Internal Creative Approval', department: 'Production', order: 24 },
  { name: 'Final Client Creative Approval', department: 'Production', order: 25 },
  { name: 'Production Finishing Complete', department: 'Production', order: 26 },
  { name: 'Final Deliverables Sent', department: 'Production', order: 27 },
  { name: 'Project Archived', department: 'Production', order: 28 },
  { name: 'Project Closed', department: 'Production', order: 29 },
] as const;

// ============================================
// FILE FOLDER PARTITIONS
// ============================================

export const FOLDER_PARTITIONS = [
  { number: 1, name: 'Project Overview', description: 'Job ID, Client, Teams, Deliverables, Due Date' },
  { number: 2, name: 'Milestones by Department', description: 'Sales → Production → LoRA → Gen → Production' },
  { number: 3, name: 'Pre-Production Questions', description: 'Sales questions, Pre-prod questions, Workflow notes' },
  { number: 4, name: 'Standard Project', description: 'Checklist for projects NOT needing LoRA/Gen team' },
  { number: 5, name: 'Advanced Project', description: 'Checklist with LoRA + Gen Engineering stages' },
  { number: 6, name: 'Finishing + Post Mortem', description: 'Final delivery, archiving, close, post-mortem notes' },
] as const;

// ============================================
// COST TABLE DEFAULTS
// ============================================

export const DEFAULT_COST_TABLE = {
  // Setup costs (in days)
  dataCaptureDays: 1,
  dataParsingDays: 1,
  dataCaptioningDays: 1,
  loraTrainingDays: 4,
  loraValidationDays: 2,
  workflowBuildDays: 2,
  imageGenerationDays: 5,
  videoGenerationDays: 5,
  totalSetupDays: 21,

  // Per-asset multipliers (days per asset)
  staticImageDays: 0.1,
  gifDays: 0.15,
  shortVideoDays: 0.2,  // 6-15s
  mediumVideoDays: 0.3, // 30s
  longVideoDays: 0.5,   // 45-60s
} as const;
