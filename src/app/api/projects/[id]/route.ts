import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        milestones: {
          orderBy: { order: 'asc' },
        },
        handoffs: {
          orderBy: { handoffNumber: 'asc' },
        },
        estimates: {
          orderBy: { createdAt: 'desc' },
        },
        deliverables: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
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

    const {
      name,
      type,
      status,
      currentPartition,
      producer,
      creativeTeam,
      loraTeam,
      genTeam,
      externalArtists,
      finalDueDate,
      acv,
      monthlyFee,
      estimatedMargin,
    } = body;

    const project = await prisma.project.update({
      where: { id },
      data: {
        name,
        type,
        status,
        currentPartition,
        producer: producer || null,
        creativeTeam: creativeTeam ? JSON.stringify(creativeTeam) : null,
        loraTeam: loraTeam ? JSON.stringify(loraTeam) : null,
        genTeam: genTeam ? JSON.stringify(genTeam) : null,
        externalArtists: externalArtists ? JSON.stringify(externalArtists) : null,
        finalDueDate: finalDueDate ? new Date(finalDueDate) : null,
        acv: acv ? parseFloat(acv) : null,
        monthlyFee: monthlyFee ? parseFloat(monthlyFee) : null,
        estimatedMargin: estimatedMargin ? parseFloat(estimatedMargin) : null,
      },
      include: {
        client: true,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
