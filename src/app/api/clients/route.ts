import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { projects: true },
        },
      },
    });
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, website, vertical, notes, classification, dealBehindSpec, redFlags } = body;

    if (!name || !vertical) {
      return NextResponse.json(
        { error: 'Name and vertical are required' },
        { status: 400 }
      );
    }

    // Check for critical red flags
    const parsedRedFlags = typeof redFlags === 'string' ? JSON.parse(redFlags) : redFlags || [];
    const hasCriticalFlags = parsedRedFlags.some(
      (flag: string) => flag === 'BUDGET_UNDER_600K' || flag === 'NO_DECISION_MAKER'
    );

    const client = await prisma.client.create({
      data: {
        name,
        website: website || null,
        vertical,
        notes: notes || null,
        classification: classification || 'UNDETERMINED',
        dealBehindSpec: dealBehindSpec || false,
        redFlags: JSON.stringify(parsedRedFlags),
        qualified: !hasCriticalFlags && parsedRedFlags.length === 0,
        qualificationScore: calculateQualificationScore(parsedRedFlags, classification, dealBehindSpec),
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
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
