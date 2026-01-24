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

// POST /api/conversations - Create new conversation
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rawTranscript, transcriptSource, clientId, qualificationCallId } = body;

    if (!rawTranscript || rawTranscript.trim().length < 50) {
      return NextResponse.json(
        { error: 'Transcript is required and must be at least 50 characters' },
        { status: 400 }
      );
    }

    const conversation = await prisma.conversation.create({
      data: {
        rawTranscript,
        transcriptSource: transcriptSource || 'manual',
        clientId: clientId || null,
        qualificationCallId: qualificationCallId || null,
        processed: false,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
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
