import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// PUT /api/clients/[id]/qualification/[callNumber] - Update a specific qualification call
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; callNumber: string }> }
) {
  try {
    const { id, callNumber } = await params;
    const callNum = parseInt(callNumber, 10);

    if (isNaN(callNum) || callNum < 1 || callNum > 4) {
      return NextResponse.json(
        { error: 'Invalid call number' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { completed, notes, gateCriteria, gateCleared, discoveryAnswers } = body;

    // Find the existing call
    let call = await prisma.qualificationCall.findFirst({
      where: {
        clientId: id,
        callNumber: callNum,
      },
    });

    // If call doesn't exist, create it
    if (!call) {
      const callTypes = ['INTRO', 'PRODUCT_SCOPE', 'BUDGET_SCOPE', 'PROPOSAL'];
      call = await prisma.qualificationCall.create({
        data: {
          clientId: id,
          callNumber: callNum,
          callType: callTypes[callNum - 1],
        },
      });
    }

    // Update the call
    const updatedCall = await prisma.qualificationCall.update({
      where: { id: call.id },
      data: {
        completed: completed ?? call.completed,
        completedAt: completed ? new Date() : call.completedAt,
        notes: notes ?? call.notes,
        gateCriteria: gateCriteria !== undefined ? JSON.stringify(gateCriteria) : call.gateCriteria,
        gateCleared: gateCleared ?? call.gateCleared,
        discoveryAnswers: discoveryAnswers !== undefined ? JSON.stringify(discoveryAnswers) : call.discoveryAnswers,
      },
    });

    // Calculate and update client qualification score
    await updateClientQualificationScore(id);

    return NextResponse.json(updatedCall);
  } catch (error) {
    console.error('Error updating qualification call:', error);
    return NextResponse.json(
      { error: 'Failed to update qualification call' },
      { status: 500 }
    );
  }
}

// Helper function to calculate and update client qualification score
async function updateClientQualificationScore(clientId: string) {
  const calls = await prisma.qualificationCall.findMany({
    where: { clientId },
  });

  // Calculate score: 25% per completed call with cleared gates
  const completedCalls = calls.filter(c => c.completed);
  const clearedGates = calls.filter(c => c.gateCleared);

  // Score formula:
  // - Each completed call = 15 points (60 total)
  // - Each cleared gate = 10 points (40 total)
  const callPoints = completedCalls.length * 15;
  const gatePoints = clearedGates.length * 10;
  const score = Math.min(100, callPoints + gatePoints);

  // Client is qualified if all 4 calls completed and at least 3 gates cleared
  const qualified = completedCalls.length >= 4 && clearedGates.length >= 3;

  await prisma.client.update({
    where: { id: clientId },
    data: {
      qualificationScore: score,
      qualified,
    },
  });
}
