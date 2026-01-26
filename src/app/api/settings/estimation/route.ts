import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { DEFAULT_ESTIMATION_CONFIG } from '@/lib/estimation';

/**
 * GET /api/settings/estimation
 * Fetch the active estimation configuration (or create default if none exists)
 */
export async function GET() {
  try {
    // Try to find the default/active configuration
    let config = await prisma.costTableTemplate.findFirst({
      where: { isDefault: true },
    });

    // If no config exists, create the default one
    if (!config) {
      config = await prisma.costTableTemplate.create({
        data: {
          name: DEFAULT_ESTIMATION_CONFIG.name,
          baseSetupDays: DEFAULT_ESTIMATION_CONFIG.baseSetupDays,
          loraSetupDays: DEFAULT_ESTIMATION_CONFIG.loraSetupDays,
          customWorkflowDays: DEFAULT_ESTIMATION_CONFIG.customWorkflowDays,
          staticImageDays: DEFAULT_ESTIMATION_CONFIG.staticImageDays,
          gifDays: DEFAULT_ESTIMATION_CONFIG.gifDays,
          shortVideoDays: DEFAULT_ESTIMATION_CONFIG.shortVideoDays,
          mediumVideoDays: DEFAULT_ESTIMATION_CONFIG.mediumVideoDays,
          longVideoDays: DEFAULT_ESTIMATION_CONFIG.longVideoDays,
          genTeamPercent: DEFAULT_ESTIMATION_CONFIG.genTeamPercent,
          productionPercent: DEFAULT_ESTIMATION_CONFIG.productionPercent,
          qcPercent: DEFAULT_ESTIMATION_CONFIG.qcPercent,
          clientReviewPercent: DEFAULT_ESTIMATION_CONFIG.clientReviewPercent,
          isDefault: true,
        },
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching estimation config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch estimation configuration' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings/estimation
 * Update the estimation configuration
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const {
      name,
      baseSetupDays,
      loraSetupDays,
      customWorkflowDays,
      staticImageDays,
      gifDays,
      shortVideoDays,
      mediumVideoDays,
      longVideoDays,
      genTeamPercent,
      productionPercent,
      qcPercent,
      clientReviewPercent,
    } = body;

    // Validate team percentages sum to approximately 1.0
    const totalPercent = (genTeamPercent || 0) + (productionPercent || 0) + (qcPercent || 0) + (clientReviewPercent || 0);
    if (Math.abs(totalPercent - 1.0) > 0.01) {
      return NextResponse.json(
        { error: `Team allocation percentages must sum to 100% (currently ${(totalPercent * 100).toFixed(0)}%)` },
        { status: 400 }
      );
    }

    // Find or create the default config
    let config = await prisma.costTableTemplate.findFirst({
      where: { isDefault: true },
    });

    if (config) {
      // Update existing config
      config = await prisma.costTableTemplate.update({
        where: { id: config.id },
        data: {
          name: name || config.name,
          baseSetupDays: baseSetupDays ?? config.baseSetupDays,
          loraSetupDays: loraSetupDays ?? config.loraSetupDays,
          customWorkflowDays: customWorkflowDays ?? config.customWorkflowDays,
          staticImageDays: staticImageDays ?? config.staticImageDays,
          gifDays: gifDays ?? config.gifDays,
          shortVideoDays: shortVideoDays ?? config.shortVideoDays,
          mediumVideoDays: mediumVideoDays ?? config.mediumVideoDays,
          longVideoDays: longVideoDays ?? config.longVideoDays,
          genTeamPercent: genTeamPercent ?? config.genTeamPercent,
          productionPercent: productionPercent ?? config.productionPercent,
          qcPercent: qcPercent ?? config.qcPercent,
          clientReviewPercent: clientReviewPercent ?? config.clientReviewPercent,
        },
      });
    } else {
      // Create new default config
      config = await prisma.costTableTemplate.create({
        data: {
          name: name || 'Default',
          baseSetupDays: baseSetupDays ?? DEFAULT_ESTIMATION_CONFIG.baseSetupDays,
          loraSetupDays: loraSetupDays ?? DEFAULT_ESTIMATION_CONFIG.loraSetupDays,
          customWorkflowDays: customWorkflowDays ?? DEFAULT_ESTIMATION_CONFIG.customWorkflowDays,
          staticImageDays: staticImageDays ?? DEFAULT_ESTIMATION_CONFIG.staticImageDays,
          gifDays: gifDays ?? DEFAULT_ESTIMATION_CONFIG.gifDays,
          shortVideoDays: shortVideoDays ?? DEFAULT_ESTIMATION_CONFIG.shortVideoDays,
          mediumVideoDays: mediumVideoDays ?? DEFAULT_ESTIMATION_CONFIG.mediumVideoDays,
          longVideoDays: longVideoDays ?? DEFAULT_ESTIMATION_CONFIG.longVideoDays,
          genTeamPercent: genTeamPercent ?? DEFAULT_ESTIMATION_CONFIG.genTeamPercent,
          productionPercent: productionPercent ?? DEFAULT_ESTIMATION_CONFIG.productionPercent,
          qcPercent: qcPercent ?? DEFAULT_ESTIMATION_CONFIG.qcPercent,
          clientReviewPercent: clientReviewPercent ?? DEFAULT_ESTIMATION_CONFIG.clientReviewPercent,
          isDefault: true,
        },
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error updating estimation config:', error);
    return NextResponse.json(
      { error: 'Failed to update estimation configuration' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/estimation/reset
 * Reset to default values
 */
export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'reset') {
      // Find and update the default config to reset values
      const config = await prisma.costTableTemplate.findFirst({
        where: { isDefault: true },
      });

      if (config) {
        const resetConfig = await prisma.costTableTemplate.update({
          where: { id: config.id },
          data: {
            name: DEFAULT_ESTIMATION_CONFIG.name,
            baseSetupDays: DEFAULT_ESTIMATION_CONFIG.baseSetupDays,
            loraSetupDays: DEFAULT_ESTIMATION_CONFIG.loraSetupDays,
            customWorkflowDays: DEFAULT_ESTIMATION_CONFIG.customWorkflowDays,
            staticImageDays: DEFAULT_ESTIMATION_CONFIG.staticImageDays,
            gifDays: DEFAULT_ESTIMATION_CONFIG.gifDays,
            shortVideoDays: DEFAULT_ESTIMATION_CONFIG.shortVideoDays,
            mediumVideoDays: DEFAULT_ESTIMATION_CONFIG.mediumVideoDays,
            longVideoDays: DEFAULT_ESTIMATION_CONFIG.longVideoDays,
            genTeamPercent: DEFAULT_ESTIMATION_CONFIG.genTeamPercent,
            productionPercent: DEFAULT_ESTIMATION_CONFIG.productionPercent,
            qcPercent: DEFAULT_ESTIMATION_CONFIG.qcPercent,
            clientReviewPercent: DEFAULT_ESTIMATION_CONFIG.clientReviewPercent,
          },
        });
        return NextResponse.json(resetConfig);
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error resetting estimation config:', error);
    return NextResponse.json(
      { error: 'Failed to reset estimation configuration' },
      { status: 500 }
    );
  }
}
