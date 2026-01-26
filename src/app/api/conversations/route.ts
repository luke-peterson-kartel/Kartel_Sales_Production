import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/conversations - List all conversations
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const processed = searchParams.get('processed');

    const where: {
      clientId?: string;
      processed?: boolean;
    } = {};

    if (clientId) {
      where.clientId = clientId;
    }

    if (processed !== null) {
      where.processed = processed === 'true';
    }

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            vertical: true,
          },
        },
        qualificationCalls: {
          select: {
            id: true,
            callNumber: true,
            callType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// Map call types to their numbers
const CALL_TYPE_TO_NUMBER: Record<string, number> = {
  'INTRO': 1,
  'PRODUCT_SCOPE': 2,
  'BUDGET_SCOPE': 3,
  'PROPOSAL': 4,
};

// POST /api/conversations - Create new conversation
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rawTranscript, transcriptSource, clientId, qualificationStages } = body;

    if (!rawTranscript || rawTranscript.trim().length < 50) {
      return NextResponse.json(
        { error: 'Transcript is required and must be at least 50 characters' },
        { status: 400 }
      );
    }

    // If qualification stages are provided and client is linked, find/create QualificationCall records
    let qualificationCallIds: string[] = [];

    if (clientId && Array.isArray(qualificationStages) && qualificationStages.length > 0) {
      // For each selected stage, find existing or create new QualificationCall
      for (const callType of qualificationStages) {
        const callNumber = CALL_TYPE_TO_NUMBER[callType];
        if (!callNumber) continue;

        // Try to find existing
        let call = await prisma.qualificationCall.findFirst({
          where: {
            clientId,
            callType,
          },
        });

        // Create if not exists
        if (!call) {
          call = await prisma.qualificationCall.create({
            data: {
              clientId,
              callNumber,
              callType,
              completed: false,
            },
          });
        }

        qualificationCallIds.push(call.id);
      }
    }

    // Build the connect array for qualification calls (many-to-many)
    const qualificationCallsConnect = qualificationCallIds.length > 0
      ? { connect: qualificationCallIds.map((id: string) => ({ id })) }
      : undefined;

    const conversation = await prisma.conversation.create({
      data: {
        rawTranscript,
        transcriptSource: transcriptSource || 'manual',
        clientId: clientId || null,
        qualificationCalls: qualificationCallsConnect,
        processed: false,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        qualificationCalls: {
          select: {
            id: true,
            callNumber: true,
            callType: true,
          },
        },
      },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
