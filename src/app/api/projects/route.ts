import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;

    const projects = await prisma.project.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        client: {
          select: { id: true, name: true },
        },
        handoffs: {
          select: { handoffNumber: true },
        },
        _count: {
          select: { handoffs: true, deliverables: true },
        },
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      clientId,
      type,
      producer,
      finalDueDate,
      acv,
      monthlyFee,
    } = body;

    if (!name || !clientId || !type) {
      return NextResponse.json(
        { error: 'Name, client, and project type are required' },
        { status: 400 }
      );
    }

    // Generate job ID: CLIENT-YYYYMMDD-###
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { name: true },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Get count of projects for this client today to generate unique number
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const clientPrefix = client.name.split(/[\/\s]/)[0].toUpperCase().slice(0, 10);

    const existingProjects = await prisma.project.count({
      where: {
        jobId: {
          startsWith: `${clientPrefix}-${dateStr}`,
        },
      },
    });

    const jobId = `${clientPrefix}-${dateStr}-${String(existingProjects + 1).padStart(3, '0')}`;

    // Determine initial status based on type
    const initialStatus = type === 'SPEC' ? 'IN_SPEC' : 'ON_DECK';

    const project = await prisma.project.create({
      data: {
        jobId,
        name,
        clientId,
        type,
        status: initialStatus,
        currentPartition: 1,
        producer: producer || null,
        finalDueDate: finalDueDate ? new Date(finalDueDate) : null,
        acv: acv ? parseFloat(acv) : null,
        monthlyFee: monthlyFee ? parseFloat(monthlyFee) : null,
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
