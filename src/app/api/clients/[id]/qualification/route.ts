import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { QUALIFICATION_CALLS } from '@/lib/constants';

// GET /api/clients/[id]/qualification - Get all qualification calls for a client
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const calls = await prisma.qualificationCall.findMany({
      where: { clientId: id },
      orderBy: { callNumber: 'asc' },
      include: {
        conversations: {
          select: {
            id: true,
            meetingDate: true,
            meetingStage: true,
            callSummary: true,
            processed: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return NextResponse.json(calls);
  } catch (error) {
    console.error('Error fetching qualification calls:', error);
    return NextResponse.json(
      { error: 'Failed to fetch qualification calls' },
      { status: 500 }
    );
  }
}

// POST /api/clients/[id]/qualification - Create or initialize qualification calls
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Check if calls already exist
    const existingCalls = await prisma.qualificationCall.findMany({
      where: { clientId: id },
    });

    if (existingCalls.length > 0) {
      return NextResponse.json(
        { error: 'Qualification calls already exist for this client' },
        { status: 400 }
      );
    }

    // Create all 4 qualification calls
    const calls = await Promise.all(
      QUALIFICATION_CALLS.map((call) =>
        prisma.qualificationCall.create({
          data: {
            clientId: id,
            callNumber: call.number,
            callType: call.value,
          },
        })
      )
    );

    return NextResponse.json(calls, { status: 201 });
  } catch (error) {
    console.error('Error creating qualification calls:', error);
    return NextResponse.json(
      { error: 'Failed to create qualification calls' },
      { status: 500 }
    );
  }
}
