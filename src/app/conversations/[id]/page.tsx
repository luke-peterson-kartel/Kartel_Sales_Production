import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/db';
import { ArrowLeft, AlertCircle, Clock } from 'lucide-react';
import ConversationView from './ConversationView';

async function getConversation(id: string) {
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
    },
  });

  return conversation;
}

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const conversation = await getConversation(id);

  if (!conversation) {
    notFound();
  }

  // Parse JSON fields
  const parsedData = {
    clientAttendees: conversation.clientAttendees
      ? JSON.parse(conversation.clientAttendees)
      : [],
    kartelAttendees: conversation.kartelAttendees
      ? JSON.parse(conversation.kartelAttendees)
      : [],
    callSummary: conversation.callSummary
      ? JSON.parse(conversation.callSummary)
      : null,
    opportunityData: conversation.opportunityData
      ? JSON.parse(conversation.opportunityData)
      : null,
    testEngagement: conversation.testEngagement
      ? JSON.parse(conversation.testEngagement)
      : null,
    followUpEmails: conversation.followUpEmails
      ? JSON.parse(conversation.followUpEmails)
      : [],
    internalChecklist: conversation.internalChecklist
      ? JSON.parse(conversation.internalChecklist)
      : null,
  };

  // Get account name for display
  const accountName = parsedData.callSummary?.accountName || 'Conversation';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/conversations"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Conversations
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{accountName}</h1>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
              {conversation.meetingDate && (
                <span>
                  Meeting:{' '}
                  {new Date(conversation.meetingDate).toLocaleDateString()}
                </span>
              )}
              {conversation.meetingDuration && (
                <span>{conversation.meetingDuration}</span>
              )}
              {parsedData.callSummary?.callType && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">
                  {parsedData.callSummary.callType}
                </span>
              )}
            </div>
          </div>

          {conversation.client && (
            <Link
              href={`/clients/${conversation.client.id}`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              View Client: {conversation.client.name}
            </Link>
          )}
        </div>
      </div>

      {/* Processing Status */}
      {!conversation.processed && (
        <div className="flex items-start gap-3 rounded-lg bg-yellow-50 border border-yellow-200 p-4">
          <Clock className="h-5 w-5 text-yellow-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Processing Pending
            </p>
            <p className="text-sm text-yellow-700">
              This transcript has not been processed yet. Click the button below to
              process it with Claude AI.
            </p>
          </div>
        </div>
      )}

      {conversation.processingError && (
        <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 p-4">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Processing Error</p>
            <p className="text-sm text-red-700">{conversation.processingError}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {conversation.processed ? (
        <ConversationView
          conversation={conversation}
          parsedData={parsedData}
        />
      ) : (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Raw Transcript
          </h2>
          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono bg-gray-50 p-4 rounded-lg max-h-96 overflow-auto">
            {conversation.rawTranscript}
          </pre>
        </div>
      )}
    </div>
  );
}
