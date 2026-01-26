import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { inferSeniority, inferSeniorityScore, inferDepartment } from '@/lib/title-intelligence';

// POST /api/conversations/[id]/import-contacts - Import attendees as client contacts
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { clientId, attendees } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    if (!attendees || !Array.isArray(attendees) || attendees.length === 0) {
      return NextResponse.json(
        { error: 'No attendees provided' },
        { status: 400 }
      );
    }

    // Verify conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        contacts: {
          select: { email: true, name: true },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Get existing contact emails and names for duplicate checking
    const existingEmails = new Set(
      client.contacts.filter((c) => c.email).map((c) => c.email?.toLowerCase())
    );
    const existingNames = new Set(
      client.contacts.map((c) => c.name.toLowerCase())
    );

    // Filter out duplicates and prepare contacts
    const contactsToCreate = [];
    const skipped = [];

    for (const attendee of attendees) {
      // Skip if email already exists
      if (attendee.email && existingEmails.has(attendee.email.toLowerCase())) {
        skipped.push({ name: attendee.name, reason: 'Email already exists' });
        continue;
      }

      // Skip if name already exists (and no email to differentiate)
      if (!attendee.email && existingNames.has(attendee.name.toLowerCase())) {
        skipped.push({ name: attendee.name, reason: 'Name already exists' });
        continue;
      }

      // Infer seniority and department from role/title
      const jobTitle = attendee.role || null;
      const seniority = jobTitle ? inferSeniority(jobTitle) : null;
      const seniorityScore = jobTitle ? inferSeniorityScore(jobTitle) : null;
      const department = jobTitle ? inferDepartment(jobTitle) : null;

      contactsToCreate.push({
        name: attendee.name,
        email: attendee.email || null,
        role: attendee.role || null,
        jobTitle: attendee.role || null,
        notes: attendee.notes || null,
        clientId: clientId,
        isPrimary: false,
        seniority: seniority,
        seniorityScore: seniorityScore,
        department: department,
        enrichmentSource: 'CONVERSATION',
      });
    }

    // Create contacts in batch
    if (contactsToCreate.length > 0) {
      await prisma.contact.createMany({
        data: contactsToCreate,
      });
    }

    // Link conversation to client if not already linked
    if (!conversation.clientId) {
      await prisma.conversation.update({
        where: { id },
        data: { clientId },
      });
    }

    return NextResponse.json({
      success: true,
      imported: contactsToCreate.length,
      skipped: skipped,
      message: `Imported ${contactsToCreate.length} contacts${
        skipped.length > 0 ? `, skipped ${skipped.length} duplicates` : ''
      }`,
    });
  } catch (error) {
    console.error('Error importing contacts:', error);
    return NextResponse.json(
      { error: 'Failed to import contacts' },
      { status: 500 }
    );
  }
}
