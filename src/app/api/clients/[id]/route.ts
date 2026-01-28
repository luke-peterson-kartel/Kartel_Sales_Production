import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        contacts: true,
        projects: {
          orderBy: { createdAt: 'desc' },
        },
        qualificationCalls: {
          orderBy: { callNumber: 'asc' },
        },
        salesTasks: {
          orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }],
        },
        subDeals: {
          select: { id: true, name: true, dealValue: true, salesStage: true },
        },
        parentClient: {
          select: { id: true, name: true },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client' },
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
      website,
      vertical,
      notes,
      classification,
      dealBehindSpec,
      redFlags,
      qualified,
      // Sales pipeline fields
      dealOwner,
      salesStage,
      dealValue,
      nextStepNotes,
    } = body;

    // Parse red flags if needed
    const parsedRedFlags = typeof redFlags === 'string' ? JSON.parse(redFlags) : redFlags || [];

    // Recalculate qualification score
    const hasCriticalFlags = parsedRedFlags.some(
      (flag: string) => flag === 'BUDGET_UNDER_600K' || flag === 'NO_DECISION_MAKER'
    );

    const client = await prisma.client.update({
      where: { id },
      data: {
        name,
        website: website || null,
        vertical,
        notes: notes || null,
        classification,
        dealBehindSpec: dealBehindSpec || false,
        redFlags: JSON.stringify(parsedRedFlags),
        qualified: qualified !== undefined ? qualified : (!hasCriticalFlags && parsedRedFlags.length === 0),
        qualificationScore: calculateQualificationScore(parsedRedFlags, classification, dealBehindSpec),
        // Sales pipeline fields (only update if provided)
        ...(dealOwner !== undefined && { dealOwner }),
        ...(salesStage !== undefined && { salesStage }),
        ...(dealValue !== undefined && { dealValue: dealValue ? parseFloat(dealValue) : null }),
        ...(nextStepNotes !== undefined && { nextStepNotes }),
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Failed to update client' },
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

    await prisma.client.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    );
  }
}

function calculateQualificationScore(
  redFlags: string[],
  classification: string,
  dealBehindSpec: boolean
): number {
  let score = 50; // Base score

  // Classification bonus
  if (classification === 'SYSTEM') score += 30;
  else if (classification === 'PROJECT') score += 10;

  // Deal-behind-spec bonus
  if (dealBehindSpec) score += 10;

  // Red flag penalties
  redFlags.forEach((flag) => {
    if (flag === 'BUDGET_UNDER_600K') score -= 40;
    else if (flag === 'NO_DECISION_MAKER') score -= 30;
    else if (flag === 'ONE_OFF_ONLY') score -= 20;
    else score -= 10;
  });

  return Math.max(0, Math.min(100, score));
}
