import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const deliverables = await prisma.deliverable.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(deliverables);
  } catch (error) {
    console.error('Error fetching deliverables:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deliverables' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { deliverables } = body;

    if (!deliverables || !Array.isArray(deliverables)) {
      return NextResponse.json(
        { error: 'Deliverables array is required' },
        { status: 400 }
      );
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Delete existing deliverables and create new ones in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing deliverables
      await tx.deliverable.deleteMany({
        where: { projectId: id },
      });

      // Create new deliverables
      const createdDeliverables = await Promise.all(
        deliverables.map((d: {
          platform: string;
          creativeType: string;
          size: string;
          duration: number | null;
          monthlyCount: number;
          estimatedDays: number;
        }) =>
          tx.deliverable.create({
            data: {
              projectId: id,
              platform: d.platform,
              creativeType: d.creativeType,
              size: d.size,
              duration: d.duration || null,
              monthlyCount: d.monthlyCount,
              totalCount: d.monthlyCount, // For now, same as monthly
              estimatedDays: d.estimatedDays,
            },
          })
        )
      );

      return createdDeliverables;
    });

    return NextResponse.json({
      success: true,
      deliverables: result,
    });
  } catch (error) {
    console.error('Error updating deliverables:', error);
    return NextResponse.json(
      { error: 'Failed to update deliverables' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      platform,
      creativeType,
      size,
      duration,
      monthlyCount,
      estimatedDays,
    } = body;

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const deliverable = await prisma.deliverable.create({
      data: {
        projectId: id,
        platform,
        creativeType,
        size,
        duration: duration || null,
        monthlyCount,
        totalCount: monthlyCount,
        estimatedDays,
      },
    });

    return NextResponse.json(deliverable);
  } catch (error) {
    console.error('Error creating deliverable:', error);
    return NextResponse.json(
      { error: 'Failed to create deliverable' },
      { status: 500 }
    );
  }
}
