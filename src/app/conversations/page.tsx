import Link from 'next/link';
import prisma from '@/lib/db';
import {
  Plus,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
} from 'lucide-react';

async function getConversations() {
  const conversations = await prisma.conversation.findMany({
    include: {
      client: {
        select: {
          id: true,
          name: true,
          vertical: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return conversations;
}

export default async function ConversationsPage() {
  const conversations = await getConversations();

  const processedCount = conversations.filter((c) => c.processed).length;
  const pendingCount = conversations.filter((c) => !c.processed).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Conversations</h1>
          <p className="mt-1 text-gray-500">
            Process client call transcripts with AI to extract key information
          </p>
        </div>
        <Link
          href="/conversations/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Process New Transcript
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {conversations.length}
              </div>
              <div className="text-sm text-gray-500">Total Conversations</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {processedCount}
              </div>
              <div className="text-sm text-gray-500">Processed</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {pendingCount}
              </div>
              <div className="text-sm text-gray-500">Pending Processing</div>
            </div>
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="rounded-xl bg-white shadow-sm">
        {conversations.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No conversations yet
            </h3>
            <p className="mt-2 text-gray-500">
              Paste a call transcript to get started with AI-powered extraction.
            </p>
            <Link
              href="/conversations/new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Process First Transcript
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {conversations.map((conversation) => {
              // Parse call summary to get account name
              let accountName = 'Unknown Account';
              let callType = '';
              if (conversation.callSummary) {
                try {
                  const summary = JSON.parse(conversation.callSummary);
                  accountName = summary.accountName || 'Unknown Account';
                  callType = summary.callType || '';
                } catch {
                  // ignore parse errors
                }
              }

              return (
                <Link
                  key={conversation.id}
                  href={`/conversations/${conversation.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      conversation.processed
                        ? 'bg-green-100 text-green-600'
                        : conversation.processingError
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {conversation.processed ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : conversation.processingError ? (
                      <AlertCircle className="h-5 w-5" />
                    ) : (
                      <Clock className="h-5 w-5" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {conversation.processed ? accountName : 'Unprocessed Transcript'}
                      </span>
                      {conversation.processed && callType && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                          {callType}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                      {conversation.client && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          Linked to {conversation.client.name}
                        </span>
                      )}
                      {conversation.meetingDate && (
                        <span>
                          Meeting:{' '}
                          {new Date(conversation.meetingDate).toLocaleDateString()}
                        </span>
                      )}
                      {conversation.meetingDuration && (
                        <span>{conversation.meetingDuration}</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-sm text-gray-500">
                    <div>
                      {new Date(conversation.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs">
                      {conversation.transcriptSource}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
