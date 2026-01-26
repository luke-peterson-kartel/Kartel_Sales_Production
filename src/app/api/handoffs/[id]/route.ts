// GET /api/handoffs/[id] - Get single handoff
// PUT /api/handoffs/[id] - Update handoff
// DELETE /api/handoffs/[id] - Delete handoff

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const handoff = await prisma.handoff.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!handoff) {
      return NextResponse.json(
        { error: 'Handoff not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(handoff);
  } catch (error) {
    console.error('Error fetching handoff:', error);
    return NextResponse.json(
      { error: 'Failed to fetch handoff' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === 'COMPLETED') {
        updateData.completedAt = new Date();
        // Check if on time
        const handoff = await prisma.handoff.findUnique({ where: { id } });
        if (handoff?.dueAt) {
          updateData.isOnTime = new Date() <= new Date(handoff.dueAt);
        }
      }
    }

    if (body.checklist !== undefined) {
      updateData.checklist = typeof body.checklist === 'string'
        ? body.checklist
        : JSON.stringify(body.checklist);
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }

    if (body.dueAt !== undefined) {
      updateData.dueAt = body.dueAt ? new Date(body.dueAt) : null;
    }

    if (body.transferredItems !== undefined) {
      updateData.transferredItems = typeof body.transferredItems === 'string'
        ? body.transferredItems
        : JSON.stringify(body.transferredItems);
    }

    if (body.emailExported !== undefined) {
      updateData.emailExported = body.emailExported;
      if (body.emailExported) {
        updateData.emailExportedAt = new Date();
      }
    }

    const handoff = await prisma.handoff.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          include: {
            client: true,
          },
        },
      },
    });

    // Update project partition if handoff completed
    if (body.status === 'COMPLETED') {
      const partitionMap: Record<number, number> = {
        1: 2, // After Sales → Production, move to partition 2
        2: 3, // After Production → Generative, move to partition 3
        3: 4, // After Generative → Production, move to partition 4
        4: 6, // After Production → Sales, move to partition 6
      };

      const newPartition = partitionMap[handoff.handoffNumber];
      if (newPartition) {
        await prisma.project.update({
          where: { id: handoff.projectId },
          data: { currentPartition: newPartition },
        });
      }
    }

    return NextResponse.json(handoff);
  } catch (error) {
    console.error('Error updating handoff:', error);
    return NextResponse.json(
      { error: 'Failed to update handoff' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.handoff.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting handoff:', error);
    return NextResponse.json(
      { error: 'Failed to delete handoff' },
      { status: 500 }
    );
  }
}
