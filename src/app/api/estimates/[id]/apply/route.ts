// POST /api/estimates/[id]/apply - Apply estimate deliverables to project

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: estimateId } = await params;

    // Fetch the estimate with its deliverables
    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
      include: {
        deliverables: true,
        project: true,
      },
    });

    if (!estimate) {
      return NextResponse.json(
        { error: 'Estimate not found' },
        { status: 404 }
      );
    }

    const projectId = estimate.projectId;
    const contractMonths = estimate.contractMonths || 12;

    // Apply estimate deliverables to project in a transaction
    const project = await prisma.$transaction(async (tx) => {
      // Delete existing project deliverables
      await tx.deliverable.deleteMany({
        where: { projectId },
      });

      // Create new project deliverables from estimate deliverables
      if (estimate.deliverables.length > 0) {
        await tx.deliverable.createMany({
          data: estimate.deliverables.map((d) => ({
            projectId,
            platform: d.platform,
            creativeType: d.creativeType,
            size: d.size,
            duration: d.duration,
            monthlyCount: d.monthlyCount,
            totalCount: d.monthlyCount * contractMonths,
            estimatedDays: d.estimatedDays,
          })),
        });
      }

      // Update project type based on estimate
      await tx.project.update({
        where: { id: projectId },
        data: {
          type: estimate.projectType,
        },
      });

      // Fetch and return the updated project with deliverables
      return tx.project.findUnique({
        where: { id: projectId },
        include: {
          client: true,
          deliverables: true,
          estimates: {
            include: {
              deliverables: true,
            },
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Applied ${estimate.deliverables.length} deliverables from estimate "${estimate.name}" to project`,
      project,
    });
  } catch (error) {
    console.error('Error applying estimate to project:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to apply estimate to project' },
      { status: 500 }
    );
  }
}
