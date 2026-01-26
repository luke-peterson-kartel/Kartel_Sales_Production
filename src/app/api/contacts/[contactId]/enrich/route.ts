// POST /api/contacts/[contactId]/enrich - Enrich a contact with Apollo.io

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { smartEnrich, isApolloConfigured } from '@/lib/integrations/apollo';
import { inferSeniority, inferSeniorityScore, inferDepartment, suggestDecisionAuthority } from '@/lib/title-intelligence';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ contactId: string }> }
) {
  try {
    const { contactId } = await params;

    // Check if Apollo is configured
    if (!isApolloConfigured()) {
      return NextResponse.json(
        { error: 'Apollo.io API key not configured. Add APOLLO_API_KEY to your environment.' },
        { status: 400 }
      );
    }

    // Get the contact with client info
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      include: {
        client: true,
      },
    });

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Extract company domain from client website
    let companyDomain: string | undefined;
    if (contact.client?.website) {
      try {
        const url = new URL(
          contact.client.website.startsWith('http')
            ? contact.client.website
            : `https://${contact.client.website}`
        );
        companyDomain = url.hostname.replace(/^www\./, '');
      } catch {
        // Invalid URL, skip domain
      }
    }

    // Enrich the contact
    const result = await smartEnrich({
      fullName: contact.name,
      email: contact.email || undefined,
      linkedInUrl: contact.linkedInUrl || undefined,
      companyName: contact.client?.name,
      companyDomain,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Enrichment failed' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      enrichedAt: new Date(),
      enrichmentSource: 'APOLLO',
      enrichmentData: JSON.stringify(result.rawData),
    };

    // Only update fields that are empty or if we have better data
    if (!contact.email && result.email) {
      updateData.email = result.email;
    }
    if (!contact.phone && result.phone) {
      updateData.phone = result.phone;
    }
    if (!contact.linkedInUrl && result.linkedInUrl) {
      updateData.linkedInUrl = result.linkedInUrl;
    }
    if (!contact.jobTitle && result.jobTitle) {
      updateData.jobTitle = result.jobTitle;
      // Re-infer intelligence from new job title
      updateData.seniority = inferSeniority(result.jobTitle);
      updateData.seniorityScore = inferSeniorityScore(result.jobTitle);
      updateData.department = inferDepartment(result.jobTitle);
      updateData.decisionAuthority = suggestDecisionAuthority(result.jobTitle);
    }
    if (!contact.seniority && result.seniority) {
      updateData.seniority = result.seniority;
    }
    if (!contact.department && result.department) {
      updateData.department = result.department;
    }

    // New fields from Apollo
    if (!contact.photoUrl && result.photoUrl) {
      updateData.photoUrl = result.photoUrl;
    }
    if (!contact.headline && result.rawData?.headline) {
      updateData.headline = result.rawData.headline;
    }
    if (!contact.twitterUrl && result.rawData?.twitter_url) {
      updateData.twitterUrl = result.rawData.twitter_url;
    }
    if (!contact.githubUrl && result.rawData?.github_url) {
      updateData.githubUrl = result.rawData.github_url;
    }
    if (!contact.facebookUrl && result.rawData?.facebook_url) {
      updateData.facebookUrl = result.rawData.facebook_url;
    }
    if (!contact.city && result.city) {
      updateData.city = result.city;
    }
    if (!contact.state && result.state) {
      updateData.state = result.state;
    }
    if (!contact.country && result.country) {
      updateData.country = result.country;
    }
    if (!contact.employmentHistory && result.rawData?.employment_history?.length) {
      updateData.employmentHistory = JSON.stringify(result.rawData.employment_history);
    }
    if (!contact.emailStatus && result.rawData?.email_status) {
      updateData.emailStatus = result.rawData.email_status;
    }

    // Update the contact
    const updatedContact = await prisma.contact.update({
      where: { id: contactId },
      data: updateData,
    });

    // Also update ClientIntelligence with company data from Apollo
    if (contact.clientId && result.rawData?.organization) {
      const org = result.rawData.organization;
      const companyData: Record<string, unknown> = {};

      // Map employee count to company size
      if (org.estimated_num_employees) {
        const employees = org.estimated_num_employees;
        if (employees < 50) {
          companyData.companySize = 'STARTUP';
        } else if (employees < 200) {
          companyData.companySize = 'SMB';
        } else if (employees < 1000) {
          companyData.companySize = 'MID_MARKET';
        } else {
          companyData.companySize = 'ENTERPRISE';
        }
        companyData.estimatedEmployees = employees.toString();
      }

      if (org.industry) {
        companyData.industry = org.industry;
      }

      // Only update if we have company data
      if (Object.keys(companyData).length > 0) {
        await prisma.clientIntelligence.upsert({
          where: { clientId: contact.clientId },
          create: {
            clientId: contact.clientId,
            ...companyData,
          },
          update: companyData,
        });
      }
    }

    return NextResponse.json({
      success: true,
      contact: updatedContact,
      enrichment: {
        email: result.email,
        phone: result.phone,
        linkedInUrl: result.linkedInUrl,
        jobTitle: result.jobTitle,
        seniority: result.seniority,
        department: result.department,
        companyName: result.companyName,
        city: result.city,
        state: result.state,
      },
    });
  } catch (error) {
    console.error('Error enriching contact:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET - Check enrichment status / Apollo configuration
export async function GET() {
  return NextResponse.json({
    configured: isApolloConfigured(),
    provider: 'apollo.io',
  });
}
