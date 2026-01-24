import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/conversations/[id] - Get single conversation
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            vertical: true,
            website: true,
          },
        },
        qualificationCall: {
          select: {
            id: true,
            callNumber: true,
            callType: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

// PUT /api/conversations/[id] - Update conversation
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if conversation exists
    const existing = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    // Basic fields
    if (body.transcriptSource !== undefined) {
      updateData.transcriptSource = body.transcriptSource;
    }
    if (body.meetingDate !== undefined) {
      updateData.meetingDate = body.meetingDate ? new Date(body.meetingDate) : null;
    }
    if (body.meetingDuration !== undefined) {
      updateData.meetingDuration = body.meetingDuration;
    }
    if (body.meetingStage !== undefined) {
      updateData.meetingStage = body.meetingStage;
    }

    // JSON fields (store as strings)
    if (body.clientAttendees !== undefined) {
      updateData.clientAttendees = JSON.stringify(body.clientAttendees);
    }
    if (body.kartelAttendees !== undefined) {
      updateData.kartelAttendees = JSON.stringify(body.kartelAttendees);
    }
    if (body.callSummary !== undefined) {
      updateData.callSummary = JSON.stringify(body.callSummary);
    }
    if (body.opportunityData !== undefined) {
      updateData.opportunityData = JSON.stringify(body.opportunityData);
    }
    if (body.testEngagement !== undefined) {
      updateData.testEngagement = body.testEngagement ? JSON.stringify(body.testEngagement) : null;
    }
    if (body.followUpEmails !== undefined) {
      updateData.followUpEmails = JSON.stringify(body.followUpEmails);
    }
    if (body.internalChecklist !== undefined) {
      updateData.internalChecklist = JSON.stringify(body.internalChecklist);
    }

    // Relationship fields
    if (body.clientId !== undefined) {
      updateData.clientId = body.clientId;
    }
    if (body.qualificationCallId !== undefined) {
      updateData.qualificationCallId = body.qualificationCallId;
    }

    const conversation = await prisma.conversation.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations/[id] - Delete conversation
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if conversation exists
    const existing = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    await prisma.conversation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}
