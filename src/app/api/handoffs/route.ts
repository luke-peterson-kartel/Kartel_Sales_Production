// GET /api/handoffs - List handoffs (optional projectId filter)
// POST /api/handoffs - Create new handoff

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Handoff checklist templates based on handoff type
const HANDOFF_CHECKLISTS: Record<string, Array<{ id: string; label: string; required: boolean }>> = {
  SALES_TO_PRODUCTION: [
    { id: 'sow_signed', label: 'SOW signed and received', required: true },
    { id: 'client_info', label: 'Client company information complete', required: true },
    { id: 'contacts', label: 'Key contacts identified', required: true },
    { id: 'brand_guidelines', label: 'Brand guidelines received', required: false },
    { id: 'deliverables', label: 'Deliverables list confirmed', required: true },
    { id: 'timeline', label: 'Project timeline agreed', required: true },
    { id: 'budget', label: 'Budget confirmed', required: true },
    { id: 'kickoff', label: 'Kickoff meeting scheduled', required: false },
  ],
  PRODUCTION_TO_GENERATIVE: [
    { id: 'brand_assets', label: 'Brand assets uploaded to shared drive', required: true },
    { id: 'style_guide', label: 'Visual style guide created', required: true },
    { id: 'quality_criteria', label: 'Quality criteria documented', required: true },
    { id: 'workflow_specs', label: 'Workflow specifications defined', required: true },
    { id: 'reference_images', label: 'Reference images provided', required: true },
    { id: 'lora_requirements', label: 'LoRA training requirements (if applicable)', required: false },
    { id: 'revision_process', label: 'Revision process explained', required: true },
  ],
  GENERATIVE_TO_PRODUCTION: [
    { id: 'deliverables_qc', label: 'All deliverables passed internal QC', required: true },
    { id: 'file_naming', label: 'File naming convention followed', required: true },
    { id: 'formats_correct', label: 'All formats and sizes correct', required: true },
    { id: 'technical_notes', label: 'Technical notes documented', required: false },
    { id: 'revisions_addressed', label: 'Previous revision feedback addressed', required: true },
    { id: 'uploaded', label: 'Files uploaded to delivery platform', required: true },
  ],
  PRODUCTION_TO_SALES: [
    { id: 'final_deliverables', label: 'Final deliverables approved by client', required: true },
    { id: 'closing_report', label: 'Project closing report complete', required: true },
    { id: 'margin_data', label: 'Margin data calculated', required: true },
    { id: 'case_study', label: 'Case study materials gathered', required: false },
    { id: 'testimonial', label: 'Testimonial requested', required: false },
    { id: 'lessons_learned', label: 'Lessons learned documented', required: false },
    { id: 'renewal_opportunity', label: 'Renewal opportunity assessed', required: true },
  ],
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const handoffs = await prisma.handoff.findMany({
      where: projectId ? { projectId } : undefined,
      include: {
        project: {
          include: {
            client: true,
          },
        },
      },
      orderBy: [
        { handoffNumber: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(handoffs);
  } catch (error) {
    console.error('Error fetching handoffs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch handoffs' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { projectId, handoffNumber, type, notes, dueAt } = body;

    if (!projectId || !handoffNumber || !type) {
      return NextResponse.json(
        { error: 'Project ID, handoff number, and type are required' },
        { status: 400 }
      );
    }

    // Check if handoff already exists
    const existing = await prisma.handoff.findFirst({
      where: {
        projectId,
        handoffNumber,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A handoff with this number already exists for this project' },
        { status: 400 }
      );
    }

    // Get checklist template for this handoff type
    const checklistTemplate = HANDOFF_CHECKLISTS[type] || [];
    const checklist = checklistTemplate.reduce(
      (acc, item) => ({ ...acc, [item.id]: false }),
      {}
    );

    // Create handoff
    const handoff = await prisma.handoff.create({
      data: {
        projectId,
        handoffNumber,
        type,
        notes,
        dueAt: dueAt ? new Date(dueAt) : null,
        checklist: JSON.stringify(checklist),
        status: 'IN_PROGRESS',
      },
      include: {
        project: {
          include: {
            client: true,
          },
        },
      },
    });

    return NextResponse.json(handoff);
  } catch (error) {
    console.error('Error creating handoff:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create handoff' },
      { status: 500 }
    );
  }
}
