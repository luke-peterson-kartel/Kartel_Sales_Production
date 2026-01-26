// POST /api/clients/[id]/analyze-website
// Fetches client website and extracts intelligence using Claude

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { analyzeClientWebsite, fetchWebsiteContent } from '@/lib/website-analysis';
import { inferSeniority, inferSeniorityScore, inferDepartment, isLikelyDecisionMaker, suggestDecisionAuthority } from '@/lib/title-intelligence';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Fetch client with website URL
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        intelligence: true,
        contacts: true,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    if (!client.website) {
      return NextResponse.json(
        { error: 'Client has no website URL configured' },
        { status: 400 }
      );
    }

    // 2. Fetch and analyze website
    const result = await analyzeClientWebsite(client.website, client.vertical);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || 'Failed to analyze website' },
        { status: 500 }
      );
    }

    // 3. Store results in ClientIntelligence
    const intelligenceData = {
      companyDescription: result.data.companyInfo.description,
      companySize: result.data.companyInfo.sizeIndicator,
      estimatedEmployees: result.data.companyInfo.estimatedEmployees,
      industry: result.data.companyInfo.industry,
      leadershipTeam: JSON.stringify(result.data.leadershipTeam),
      currentCreativeApproach: result.data.creativeInsights?.currentApproach,
      socialPresence: JSON.stringify(result.data.socialPresence),
      suggestedTalkingPoints: JSON.stringify(result.data.recommendations?.talkingPoints),
      suggestedQuestions: JSON.stringify(result.data.recommendations?.suggestedQuestions),
      websiteAnalyzedAt: new Date(),
      websiteUrl: client.website,
      analysisModel: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
      analysisTokens: result.tokensUsed,
    };

    // Upsert ClientIntelligence
    const intelligence = await prisma.clientIntelligence.upsert({
      where: { clientId: id },
      create: {
        clientId: id,
        ...intelligenceData,
      },
      update: intelligenceData,
    });

    // 4. Auto-create contacts from leadership team if they don't exist
    const createdContacts = [];
    const existingContactNames = client.contacts.map(c => c.name.toLowerCase());

    for (const leader of result.data.leadershipTeam) {
      // Check if contact already exists (by name)
      if (existingContactNames.includes(leader.name.toLowerCase())) {
        continue;
      }

      // Infer intelligence from title
      const seniority = inferSeniority(leader.title);
      const seniorityScore = inferSeniorityScore(leader.title);
      const department = inferDepartment(leader.title);
      const decisionAuthority = suggestDecisionAuthority(leader.title);

      const newContact = await prisma.contact.create({
        data: {
          clientId: id,
          name: leader.name,
          jobTitle: leader.title,
          linkedInUrl: leader.linkedIn,
          seniority,
          seniorityScore,
          department,
          decisionAuthority,
          role: leader.isLikelyDM ? 'Decision Maker' : 'Stakeholder',
          isPrimary: false,
          enrichedAt: new Date(),
          enrichmentSource: 'WEBSITE_ANALYSIS',
        },
      });

      createdContacts.push(newContact);
    }

    // Return results
    return NextResponse.json({
      success: true,
      intelligence: {
        ...intelligence,
        leadershipTeam: result.data.leadershipTeam,
        socialPresence: result.data.socialPresence,
        suggestedTalkingPoints: result.data.recommendations?.talkingPoints,
        suggestedQuestions: result.data.recommendations?.suggestedQuestions,
      },
      createdContacts,
      recommendations: result.data.recommendations,
      tokensUsed: result.tokensUsed,
    });
  } catch (error) {
    console.error('Error analyzing website:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check current intelligence status
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const intelligence = await prisma.clientIntelligence.findUnique({
      where: { clientId: id },
    });

    if (!intelligence) {
      return NextResponse.json({ hasIntelligence: false });
    }

    return NextResponse.json({
      hasIntelligence: true,
      intelligence: {
        ...intelligence,
        leadershipTeam: intelligence.leadershipTeam ? JSON.parse(intelligence.leadershipTeam) : [],
        socialPresence: intelligence.socialPresence ? JSON.parse(intelligence.socialPresence) : null,
        suggestedTalkingPoints: intelligence.suggestedTalkingPoints ? JSON.parse(intelligence.suggestedTalkingPoints) : [],
        suggestedQuestions: intelligence.suggestedQuestions ? JSON.parse(intelligence.suggestedQuestions) : [],
      },
    });
  } catch (error) {
    console.error('Error fetching intelligence:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
