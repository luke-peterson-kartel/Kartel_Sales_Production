/**
 * Centralized Estimation Calculation Module
 *
 * This is the SINGLE SOURCE OF TRUTH for all effort/cost calculations.
 * All estimate pages and APIs should import from this module.
 */

// ============================================
// TYPES
// ============================================

export interface EstimationConfig {
  id: string;
  name: string;

  // Setup days
  baseSetupDays: number;        // Default setup for any project
  loraSetupDays: number;        // Additional days when LoRA is required
  customWorkflowDays: number;   // Additional days for custom workflow

  // Per-asset production days (days per single asset)
  staticImageDays: number;      // Static images, carousels
  gifDays: number;              // Animated GIFs
  shortVideoDays: number;       // Videos 6-15 seconds
  mediumVideoDays: number;      // Videos 16-30 seconds
  longVideoDays: number;        // Videos 31-60 seconds

  // Team effort split (percentages, should sum to 1.0)
  genTeamPercent: number;       // Gen team allocation
  productionPercent: number;    // Production team allocation
  qcPercent: number;            // QC team allocation
  clientReviewPercent: number;  // Client review allocation

  // Metadata
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Deliverable {
  platform: string;
  creativeType: string;
  size: string;
  duration: number | null;
  monthlyCount: number;
}

export interface CalculationResult {
  projectType: 'STANDARD' | 'ADVANCED';
  setupDays: number;
  totalMonthlyDays: number;
  monthlyGenTeamDays: number;
  monthlyProductionDays: number;
  monthlyQCDays: number;
  monthlyClientReviewDays: number;
  totalAssets: number;
  deliverableBreakdown: Array<{
    deliverable: Deliverable;
    daysPerAsset: number;
    totalDays: number;
  }>;
}

// ============================================
// DEFAULT CONFIGURATION
// ============================================

export const DEFAULT_ESTIMATION_CONFIG: Omit<EstimationConfig, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Default',

  // Setup days
  baseSetupDays: 7,
  loraSetupDays: 21,        // Total setup days when LoRA is needed (replaces base)
  customWorkflowDays: 14,   // Total setup days when custom workflow is needed (replaces base)

  // Per-asset production days
  staticImageDays: 0.1,     // 10 statics = 1 day
  gifDays: 0.15,            // ~7 GIFs = 1 day
  shortVideoDays: 0.2,      // 5 short videos = 1 day (6-15s)
  mediumVideoDays: 0.3,     // ~3 medium videos = 1 day (16-30s)
  longVideoDays: 0.5,       // 2 long videos = 1 day (31-60s)

  // Team effort split (40% gen, 30% prod, 20% QC, 10% client review)
  genTeamPercent: 0.4,
  productionPercent: 0.3,
  qcPercent: 0.2,
  clientReviewPercent: 0.1,

  isActive: true,
};

// Video types that require duration-based calculation
export const VIDEO_TYPES = ['Video', 'UGC', 'Branded', 'VideoPin'] as const;

// ============================================
// CALCULATION FUNCTIONS
// ============================================

/**
 * Get the days-per-asset rate for a deliverable based on its type and duration
 */
export function getDaysPerAsset(
  creativeType: string,
  duration: number | null,
  config: Pick<EstimationConfig, 'staticImageDays' | 'gifDays' | 'shortVideoDays' | 'mediumVideoDays' | 'longVideoDays'>
): number {
  // GIFs
  if (creativeType === 'GIF') {
    return config.gifDays;
  }

  // Video types
  if (VIDEO_TYPES.includes(creativeType as typeof VIDEO_TYPES[number])) {
    if (duration && duration <= 15) {
      return config.shortVideoDays;
    } else if (duration && duration <= 30) {
      return config.mediumVideoDays;
    } else {
      return config.longVideoDays;
    }
  }

  // Static (default)
  return config.staticImageDays;
}

/**
 * Calculate the total days for a single deliverable
 */
export function calculateDeliverableDays(
  deliverable: Deliverable,
  config: Pick<EstimationConfig, 'staticImageDays' | 'gifDays' | 'shortVideoDays' | 'mediumVideoDays' | 'longVideoDays'>
): number {
  const daysPerAsset = getDaysPerAsset(deliverable.creativeType, deliverable.duration, config);
  return deliverable.monthlyCount * daysPerAsset;
}

/**
 * Calculate setup days based on project requirements
 */
export function calculateSetupDays(
  requiresLoRA: boolean,
  requiresCustomWorkflow: boolean,
  config: Pick<EstimationConfig, 'baseSetupDays' | 'loraSetupDays' | 'customWorkflowDays'>
): number {
  if (requiresLoRA) {
    return config.loraSetupDays;
  }
  if (requiresCustomWorkflow) {
    return config.customWorkflowDays;
  }
  return config.baseSetupDays;
}

/**
 * Full estimate calculation
 */
export function calculateEstimate(
  deliverables: Deliverable[],
  requiresLoRA: boolean,
  requiresCustomWorkflow: boolean,
  contractMonths: number,
  config: EstimationConfig | typeof DEFAULT_ESTIMATION_CONFIG
): CalculationResult {
  // Calculate setup days
  const setupDays = calculateSetupDays(requiresLoRA, requiresCustomWorkflow, config);

  // Calculate per-deliverable breakdown
  const deliverableBreakdown = deliverables.map(deliverable => {
    const daysPerAsset = getDaysPerAsset(deliverable.creativeType, deliverable.duration, config);
    return {
      deliverable,
      daysPerAsset,
      totalDays: deliverable.monthlyCount * daysPerAsset,
    };
  });

  // Sum up total monthly production days
  const totalMonthlyDays = deliverableBreakdown.reduce((sum, item) => sum + item.totalDays, 0);

  // Calculate team splits
  const monthlyGenTeamDays = Math.round(totalMonthlyDays * config.genTeamPercent * 10) / 10;
  const monthlyProductionDays = Math.round(totalMonthlyDays * config.productionPercent * 10) / 10;
  const monthlyQCDays = Math.round(totalMonthlyDays * config.qcPercent * 10) / 10;
  const monthlyClientReviewDays = Math.round(totalMonthlyDays * config.clientReviewPercent * 10) / 10;

  // Calculate total assets
  const totalMonthlyAssets = deliverables.reduce((sum, d) => sum + d.monthlyCount, 0);
  const totalAssets = totalMonthlyAssets * contractMonths;

  // Determine project type
  const projectType = requiresLoRA || requiresCustomWorkflow ? 'ADVANCED' : 'STANDARD';

  return {
    projectType,
    setupDays,
    totalMonthlyDays: Math.round(totalMonthlyDays * 10) / 10,
    monthlyGenTeamDays,
    monthlyProductionDays,
    monthlyQCDays,
    monthlyClientReviewDays,
    totalAssets,
    deliverableBreakdown,
  };
}

/**
 * Get a human-readable label for the asset type category
 */
export function getAssetTypeLabel(creativeType: string, duration: number | null): string {
  if (creativeType === 'GIF') return 'GIF';
  if (VIDEO_TYPES.includes(creativeType as typeof VIDEO_TYPES[number])) {
    if (duration && duration <= 15) return 'Short Video (6-15s)';
    if (duration && duration <= 30) return 'Medium Video (16-30s)';
    return 'Long Video (31-60s)';
  }
  return 'Static Image';
}

/**
 * Format days as a readable string
 */
export function formatDays(days: number): string {
  if (days === 1) return '1 day';
  return `${days} days`;
}

/**
 * Calculate the rate description (e.g., "10 assets = 1 day")
 */
export function getRateDescription(daysPerAsset: number): string {
  const assetsPerDay = Math.round(1 / daysPerAsset);
  return `${assetsPerDay} assets = 1 day`;
}
