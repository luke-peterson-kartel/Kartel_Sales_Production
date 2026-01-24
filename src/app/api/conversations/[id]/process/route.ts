import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { processWithRetry } from '@/lib/claude';

// POST /api/conversations/[id]/process - Process conversation with Claude AI
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch the conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    if (!conversation.rawTranscript) {
      return NextResponse.json(
        { error: 'Conversation has no transcript to process' },
        { status: 400 }
      );
    }

    // Process with Claude (with retry logic)
    const result = await processWithRetry(conversation.rawTranscript);

    if (!result.success || !result.data) {
      // Store the error
      await prisma.conversation.update({
        where: { id },
        data: {
          processingError: result.error || 'Unknown processing error',
        },
      });

      return NextResponse.json(
        { error: result.error || 'Failed to process transcript' },
        { status: 500 }
      );
    }

    // Update conversation with extracted data
    const updatedConversation = await prisma.conversation.update({
      where: { id },
      data: {
        processed: true,
        processedAt: new Date(),
        processingModel: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
        processingTokens: result.usage
          ? result.usage.inputTokens + result.usage.outputTokens
          : null,
        processingError: null,

        // Meeting metadata
        meetingDate: result.data.meetingDate ? new Date(result.data.meetingDate) : null,
        meetingDuration: result.data.meetingDuration || null,
        meetingStage: result.data.meetingStage || null,

        // Participants (stored as JSON)
        clientAttendees: JSON.stringify(result.data.clientAttendees || []),
        kartelAttendees: JSON.stringify(result.data.kartelAttendees || []),

        // Extracted content (stored as JSON)
        callSummary: JSON.stringify(result.data.callSummary),
        opportunityData: JSON.stringify(result.data.opportunityData),
        testEngagement: result.data.testEngagement
          ? JSON.stringify(result.data.testEngagement)
          : null,
        followUpEmails: JSON.stringify(result.data.followUpEmails || []),
        internalChecklist: JSON.stringify(result.data.internalChecklist),
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

    return NextResponse.json({
      success: true,
      conversation: updatedConversation,
      extractedData: result.data,
      usage: result.usage,
    });
  } catch (error) {
    console.error('Error processing conversation:', error);
    return NextResponse.json(
      { error: 'Failed to process conversation' },
      { status: 500 }
    );
  }
}
