// GET /api/clients/[id]/contacts/[contactId] - Get a single contact
// PUT /api/clients/[id]/contacts/[contactId] - Update a contact
// DELETE /api/clients/[id]/contacts/[contactId] - Delete a contact

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { inferSeniority, inferSeniorityScore, inferDepartment, suggestDecisionAuthority } from '@/lib/title-intelligence';

// GET - Get a single contact
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    const { id, contactId } = await params;

    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        clientId: id,
      },
    });

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Error fetching contact:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT - Update a contact
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    const { id, contactId } = await params;
    const body = await request.json();

    // Verify contact exists and belongs to client
    const existingContact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        clientId: id,
      },
    });

    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Extract fields from request
    const {
      name,
      email,
      phone,
      role,
      isPrimary,
      jobTitle,
      department,
      seniority,
      seniorityScore,
      decisionAuthority,
      buyingRole,
      linkedInUrl,
      notes,
      lastContactedAt,
      engagementScore,
    } = body;

    // Auto-infer intelligence from job title if title is provided and intelligence fields are not
    let finalSeniority = seniority;
    let finalSeniorityScore = seniorityScore;
    let finalDepartment = department;
    let finalDecisionAuthority = decisionAuthority;

    const titleChanged = jobTitle !== undefined && jobTitle !== existingContact.jobTitle;

    if (titleChanged && jobTitle) {
      // Re-infer from new title if not explicitly provided
      if (seniority === undefined) {
        finalSeniority = inferSeniority(jobTitle);
      }
      if (seniorityScore === undefined) {
        finalSeniorityScore = inferSeniorityScore(jobTitle);
      }
      if (department === undefined) {
        finalDepartment = inferDepartment(jobTitle);
      }
      if (decisionAuthority === undefined) {
        finalDecisionAuthority = suggestDecisionAuthority(jobTitle);
      }
    }

    // If this contact is being set as primary, unset other primary contacts
    if (isPrimary && !existingContact.isPrimary) {
      await prisma.contact.updateMany({
        where: {
          clientId: id,
          isPrimary: true,
          id: { not: contactId },
        },
        data: {
          isPrimary: false,
        },
      });
    }

    // Build update data (only include fields that were provided)
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email?.trim() || null;
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (role !== undefined) updateData.role = role?.trim() || null;
    if (isPrimary !== undefined) updateData.isPrimary = isPrimary;
    if (jobTitle !== undefined) updateData.jobTitle = jobTitle?.trim() || null;
    if (finalDepartment !== undefined) updateData.department = finalDepartment;
    if (finalSeniority !== undefined) updateData.seniority = finalSeniority;
    if (finalSeniorityScore !== undefined) updateData.seniorityScore = finalSeniorityScore;
    if (finalDecisionAuthority !== undefined) updateData.decisionAuthority = finalDecisionAuthority;
    if (buyingRole !== undefined) updateData.buyingRole = buyingRole;
    if (linkedInUrl !== undefined) updateData.linkedInUrl = linkedInUrl?.trim() || null;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;
    if (lastContactedAt !== undefined) updateData.lastContactedAt = lastContactedAt ? new Date(lastContactedAt) : null;
    if (engagementScore !== undefined) updateData.engagementScore = engagementScore;

    // Update enrichment timestamp if intelligence fields changed
    if (titleChanged || seniority !== undefined || decisionAuthority !== undefined || buyingRole !== undefined) {
      updateData.enrichedAt = new Date();
      if (!existingContact.enrichmentSource) {
        updateData.enrichmentSource = 'MANUAL';
      }
    }

    // Update the contact
    const contact = await prisma.contact.update({
      where: { id: contactId },
      data: updateData,
    });

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a contact
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    const { id, contactId } = await params;

    // Verify contact exists and belongs to client
    const existingContact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        clientId: id,
      },
    });

    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Delete the contact
    await prisma.contact.delete({
      where: { id: contactId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
