// GET /api/estimates - List estimates (optional projectId filter)
// POST /api/estimates - Create new estimate with deliverables

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import {
  getDaysPerAsset,
  calculateSetupDays,
  DEFAULT_ESTIMATION_CONFIG,
} from '@/lib/estimation';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const estimates = await prisma.estimate.findMany({
      where: projectId ? { projectId } : undefined,
      include: {
        deliverables: true,  // Include estimate's own deliverables
        project: {
          include: {
            client: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(estimates);
  } catch (error) {
    console.error('Error fetching estimates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch estimates' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      projectId,
      name,
      requiresLoRA,
      requiresCustomWorkflow,
      contractMonths,
      deliverables,
    } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Fetch estimation config from database (or use defaults)
    let config = DEFAULT_ESTIMATION_CONFIG;
    try {
      const dbConfig = await prisma.costTableTemplate.findFirst({
        where: { isDefault: true },
      });
      if (dbConfig) {
        config = {
          ...DEFAULT_ESTIMATION_CONFIG,
          staticImageDays: dbConfig.staticImageDays,
          gifDays: dbConfig.gifDays,
          shortVideoDays: dbConfig.shortVideoDays,
          mediumVideoDays: dbConfig.mediumVideoDays,
          longVideoDays: dbConfig.longVideoDays,
          baseSetupDays: dbConfig.baseSetupDays,
          loraSetupDays: dbConfig.loraSetupDays,
          customWorkflowDays: dbConfig.customWorkflowDays,
          genTeamPercent: dbConfig.genTeamPercent,
          productionPercent: dbConfig.productionPercent,
          qcPercent: dbConfig.qcPercent,
          clientReviewPercent: dbConfig.clientReviewPercent,
        };
      }
    } catch {
      // Use defaults if config fetch fails
    }

    // Prepare deliverables with calculated days
    const deliverablesData = (deliverables || []).map((d: {
      platform: string;
      creativeType: string;
      size: string;
      duration: number | null;
      monthlyCount: number;
    }) => {
      const daysPerAsset = getDaysPerAsset(d.creativeType, d.duration, config);
      return {
        platform: d.platform,
        creativeType: d.creativeType,
        size: d.size,
        duration: d.duration,
        monthlyCount: d.monthlyCount,
        estimatedDays: Math.round(d.monthlyCount * daysPerAsset * 10) / 10,
      };
    });

    // Calculate totals
    const totalMonthlyDays = deliverablesData.reduce(
      (sum: number, d: { estimatedDays: number }) => sum + d.estimatedDays,
      0
    );
    const totalMonthlyAssets = deliverablesData.reduce(
      (sum: number, d: { monthlyCount: number }) => sum + d.monthlyCount,
      0
    );
    const months = contractMonths || 12;
    const totalAssets = totalMonthlyAssets * months;

    // Calculate setup days
    const setupDays = calculateSetupDays(
      requiresLoRA || false,
      requiresCustomWorkflow || false,
      config
    );

    // Calculate team splits
    const monthlyGenTeamDays = Math.round(totalMonthlyDays * config.genTeamPercent * 10) / 10;
    const monthlyProductionDays = Math.round(totalMonthlyDays * config.productionPercent * 10) / 10;
    const monthlyQCDays = Math.round(totalMonthlyDays * config.qcPercent * 10) / 10;
    const monthlyClientReviewDays = Math.round(totalMonthlyDays * config.clientReviewPercent * 10) / 10;

    // Determine project type
    const projectType = (requiresLoRA || requiresCustomWorkflow) ? 'ADVANCED' : 'STANDARD';

    // Create estimate with deliverables in a transaction
    const estimate = await prisma.$transaction(async (tx) => {
      // Create the estimate
      const newEstimate = await tx.estimate.create({
        data: {
          projectId,
          name: name || 'Draft Estimate',
          requiresLoRA: requiresLoRA || false,
          requiresCustomWorkflow: requiresCustomWorkflow || false,
          projectType,
          setupDays,
          monthlyGenTeamDays,
          monthlyProductionDays,
          monthlyQCDays,
          monthlyClientReviewDays,
          totalMonthlyDays: Math.round(totalMonthlyDays * 10) / 10,
          totalAssets,
          contractMonths: months,
        },
      });

      // Create estimate deliverables
      if (deliverablesData.length > 0) {
        await tx.estimateDeliverable.createMany({
          data: deliverablesData.map((d: {
            platform: string;
            creativeType: string;
            size: string;
            duration: number | null;
            monthlyCount: number;
            estimatedDays: number;
          }) => ({
            estimateId: newEstimate.id,
            platform: d.platform,
            creativeType: d.creativeType,
            size: d.size,
            duration: d.duration,
            monthlyCount: d.monthlyCount,
            estimatedDays: d.estimatedDays,
          })),
        });
      }

      // Fetch the complete estimate with relations
      return tx.estimate.findUnique({
        where: { id: newEstimate.id },
        include: {
          deliverables: true,
          project: {
            include: {
              client: true,
            },
          },
        },
      });
    });

    return NextResponse.json(estimate);
  } catch (error) {
    console.error('Error creating estimate:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create estimate' },
      { status: 500 }
    );
  }
}
