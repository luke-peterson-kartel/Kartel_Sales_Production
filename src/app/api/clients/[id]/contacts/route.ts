// GET /api/clients/[id]/contacts - List contacts for a client
// POST /api/clients/[id]/contacts - Create a new contact

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { inferSeniority, inferSeniorityScore, inferDepartment, suggestDecisionAuthority } from '@/lib/title-intelligence';

// GET - List all contacts for a client
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Get contacts sorted by seniority (decision makers first)
    const contacts = await prisma.contact.findMany({
      where: { clientId: id },
      orderBy: [
        { seniorityScore: 'desc' },
        { isPrimary: 'desc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Create a new contact
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
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
    } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Contact name is required' },
        { status: 400 }
      );
    }

    // Auto-infer intelligence from job title if not provided
    let finalSeniority = seniority;
    let finalSeniorityScore = seniorityScore;
    let finalDepartment = department;
    let finalDecisionAuthority = decisionAuthority;

    if (jobTitle) {
      if (!finalSeniority) {
        finalSeniority = inferSeniority(jobTitle);
      }
      if (!finalSeniorityScore) {
        finalSeniorityScore = inferSeniorityScore(jobTitle);
      }
      if (!finalDepartment) {
        finalDepartment = inferDepartment(jobTitle);
      }
      if (!finalDecisionAuthority) {
        finalDecisionAuthority = suggestDecisionAuthority(jobTitle);
      }
    }

    // If this contact is being set as primary, unset other primary contacts
    if (isPrimary) {
      await prisma.contact.updateMany({
        where: {
          clientId: id,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    // Create the contact
    const contact = await prisma.contact.create({
      data: {
        clientId: id,
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        role: role?.trim() || null,
        isPrimary: isPrimary || false,
        jobTitle: jobTitle?.trim() || null,
        department: finalDepartment || null,
        seniority: finalSeniority || null,
        seniorityScore: finalSeniorityScore || null,
        decisionAuthority: finalDecisionAuthority || null,
        buyingRole: buyingRole || null,
        linkedInUrl: linkedInUrl?.trim() || null,
        notes: notes?.trim() || null,
        enrichedAt: jobTitle ? new Date() : null,
        enrichmentSource: 'MANUAL',
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
