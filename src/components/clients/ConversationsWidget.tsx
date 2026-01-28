'use client';

import Link from 'next/link';
import { MessageSquare, Plus, ChevronRight, Check, Clock } from 'lucide-react';

interface Conversation {
  id: string;
  meetingDate: string | null;
  meetingStage: string | null;
  transcriptSource: string | null;
  processed: boolean;
  createdAt: string;
}

interface ConversationsWidgetProps {
  clientId: string;
  conversations: Conversation[];
}

export default function ConversationsWidget({
  clientId,
  conversations,
}: ConversationsWidgetProps) {
  const displayedConversations = conversations.slice(0, 3);
  const hasMore = conversations.length > 3;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStageBadgeColor = (stage: string | null) => {
    if (!stage) return 'bg-gray-100 text-gray-600';
    const stageLower = stage.toLowerCase();
    if (stageLower.includes('discovery')) return 'bg-indigo-100 text-indigo-700';
    if (stageLower.includes('scoping')) return 'bg-purple-100 text-purple-700';
    if (stageLower.includes('proposal')) return 'bg-green-100 text-green-700';
    if (stageLower.includes('negotiation')) return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-gray-500" />
          Conversations
          {conversations.length > 0 && (
            <span className="ml-1 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {conversations.length}
            </span>
          )}
        </h3>
        <Link
          href={`/conversations/new?clientId=${clientId}`}
          className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100"
        >
          <Plus className="h-3 w-3" />
          Add
        </Link>
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-4 text-gray-400">
          <MessageSquare className="mx-auto h-6 w-6 mb-1 opacity-50" />
          <p className="text-xs">No conversations yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayedConversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/conversations/${conversation.id}`}
              className="block rounded-lg border border-gray-100 p-2 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Processing status indicator */}
                  {conversation.processed ? (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-100">
                      <Check className="h-2.5 w-2.5 text-green-600" />
                    </span>
                  ) : (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-yellow-100">
                      <Clock className="h-2.5 w-2.5 text-yellow-600" />
                    </span>
                  )}
                  <span className="text-xs font-medium text-gray-700">
                    {formatDate(conversation.meetingDate)}
                  </span>
                </div>
                {conversation.meetingStage && (
                  <span
                    className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${getStageBadgeColor(
                      conversation.meetingStage
                    )}`}
                  >
                    {conversation.meetingStage}
                  </span>
                )}
              </div>
            </Link>
          ))}

          {hasMore && (
            <Link
              href={`/conversations?clientId=${clientId}`}
              className="flex items-center justify-center gap-1 py-1 text-xs text-blue-600 hover:text-blue-700"
            >
              View all {conversations.length}
              <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
