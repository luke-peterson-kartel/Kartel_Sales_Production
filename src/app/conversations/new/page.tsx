'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Upload,
  Sparkles,
  AlertCircle,
  Loader2,
  Building2,
  Phone,
  CheckCircle2,
  MessageSquare,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { TRANSCRIPT_SOURCES } from '@/lib/types/conversation';
import { QUALIFICATION_CALLS } from '@/lib/constants';

interface Client {
  id: string;
  name: string;
}

interface QualificationCall {
  id: string;
  callNumber: number;
  callType: string;
  completed: boolean;
}

interface ExistingConversation {
  id: string;
  createdAt: string;
  processed: boolean;
  transcriptSource: string;
  callSummary: string | null;
  qualificationCalls: Array<{
    id: string;
    callNumber: number;
    callType: string;
  }>;
}

// Stage selection uses call types, not IDs (since records may not exist yet)
interface SelectedStage {
  callNumber: number;
  callType: string;
  existingId?: string;  // ID if the QualificationCall record exists
}

function NewConversationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get('clientId');

  const [transcript, setTranscript] = useState('');
  const [source, setSource] = useState('manual');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loadingClient, setLoadingClient] = useState(!!preselectedClientId);
  const [existingCalls, setExistingCalls] = useState<QualificationCall[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);  // Call types: "INTRO", "PRODUCT_SCOPE", etc.
  const [loadingCalls, setLoadingCalls] = useState(false);
  const [existingConversations, setExistingConversations] = useState<ExistingConversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);

  // Fetch client info if preselected
  useEffect(() => {
    if (preselectedClientId) {
      fetch(`/api/clients/${preselectedClientId}`)
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data) setClient({ id: data.id, name: data.name });
        })
        .catch(console.error)
        .finally(() => setLoadingClient(false));
    }
  }, [preselectedClientId]);

  // Fetch existing qualification calls when client is loaded (to know which are completed)
  useEffect(() => {
    if (client?.id) {
      setLoadingCalls(true);
      fetch(`/api/clients/${client.id}/qualification`)
        .then((res) => res.ok ? res.json() : [])
        .then((data) => {
          setExistingCalls(data);
        })
        .catch(console.error)
        .finally(() => setLoadingCalls(false));
    }
  }, [client?.id]);

  // Fetch existing conversations for this client
  useEffect(() => {
    if (client?.id) {
      setLoadingConversations(true);
      fetch(`/api/conversations?clientId=${client.id}`)
        .then((res) => res.ok ? res.json() : [])
        .then((data) => {
          setExistingConversations(data);
        })
        .catch(console.error)
        .finally(() => setLoadingConversations(false));
    }
  }, [client?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (transcript.trim().length < 100) {
      setError('Please paste a complete conversation transcript (at least 100 characters).');
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Create the conversation with selected qualification stages
      const createResponse = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawTranscript: transcript,
          transcriptSource: source,
          clientId: preselectedClientId || undefined,
          // Send stage types - API will find/create QualificationCall records
          qualificationStages: selectedStages.length > 0 ? selectedStages : undefined,
        }),
      });

      if (!createResponse.ok) {
        const data = await createResponse.json();
        throw new Error(data.error || 'Failed to create conversation');
      }

      const conversation = await createResponse.json();

      // Step 2: Process with Claude
      const processResponse = await fetch(
        `/api/conversations/${conversation.id}/process`,
        {
          method: 'POST',
        }
      );

      if (!processResponse.ok) {
        const data = await processResponse.json();
        // Still redirect to view the conversation, even if processing failed
        console.error('Processing error:', data.error);
      }

      // Redirect to the conversation view
      router.push(`/conversations/${conversation.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={client ? `/clients/${client.id}` : "/conversations"}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          {client ? `Back to ${client.name}` : 'Back to Conversations'}
        </Link>

        <h1 className="text-3xl font-bold text-gray-900">
          Process New Transcript
        </h1>
        <p className="mt-1 text-gray-500">
          Paste a client call transcript and let Claude AI extract key information,
          next steps, and draft follow-up emails.
        </p>

        {/* Client Link Indicator */}
        {loadingClient ? (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading client...
          </div>
        ) : client ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-sm text-blue-700">
              <Building2 className="h-4 w-4" />
              Will be linked to: <strong>{client.name}</strong>
            </div>
            {selectedStages.length > 0 && (
              <div className="inline-flex items-center gap-2 rounded-lg bg-purple-50 border border-purple-200 px-3 py-2 text-sm text-purple-700">
                <Phone className="h-4 w-4" />
                {selectedStages.length} call stage{selectedStages.length > 1 ? 's' : ''} selected
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Existing Conversations (when client is linked) */}
      {client && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-gray-500" />
                Previous Conversations
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                View or continue from an existing conversation
              </p>
            </div>
          </div>

          {loadingConversations ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading conversations...
            </div>
          ) : existingConversations.length === 0 ? (
            <div className="text-sm text-gray-500 py-4 text-center border border-dashed border-gray-200 rounded-lg">
              No previous conversations for this client
            </div>
          ) : (
            <div className="space-y-2">
              {existingConversations.map((conv) => {
                // Parse call summary to get account name
                let accountName = 'Conversation';
                try {
                  if (conv.callSummary) {
                    const summary = JSON.parse(conv.callSummary);
                    accountName = summary.accountName || 'Conversation';
                  }
                } catch {
                  // Ignore parse errors
                }

                return (
                  <Link
                    key={conv.id}
                    href={`/conversations/${conv.id}`}
                    className="flex items-center gap-4 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 ${
                        conv.processed
                          ? 'bg-green-100 text-green-600'
                          : 'bg-yellow-100 text-yellow-600'
                      }`}
                    >
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {accountName}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(conv.createdAt).toLocaleDateString()}
                        </span>
                        <span className="capitalize">{conv.transcriptSource}</span>
                        {conv.qualificationCalls.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {conv.qualificationCalls.length} stage{conv.qualificationCalls.length > 1 ? 's' : ''}
                          </span>
                        )}
                        {!conv.processed && (
                          <span className="text-yellow-600 font-medium">Not processed</span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Source Selection */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Transcript Source
          </label>
          <div className="flex flex-wrap gap-2">
            {TRANSCRIPT_SOURCES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSource(s.value)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  source === s.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Qualification Call Stage Selection (only when client is linked) */}
        {client && (
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link to Qualification Stages (Optional)
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Select all stages this conversation covers. Many calls address multiple stages.
            </p>
            {loadingCalls ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {QUALIFICATION_CALLS.map((stage) => {
                  const existingCall = existingCalls.find(c => c.callType === stage.value);
                  const isSelected = selectedStages.includes(stage.value);
                  return (
                    <button
                      key={stage.value}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedStages(selectedStages.filter(s => s !== stage.value));
                        } else {
                          setSelectedStages([...selectedStages, stage.value]);
                        }
                      }}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {/* Checkbox indicator */}
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded border shrink-0 ${
                          isSelected
                            ? 'bg-purple-600 border-purple-600'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isSelected && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        )}
                      </div>
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${
                          existingCall?.completed
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {existingCall?.completed ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <span className="text-sm font-medium">{stage.number}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {stage.label}
                        </div>
                        <div className="text-xs text-gray-500">
                          {stage.goal}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Transcript Input */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <label
            htmlFor="transcript"
            className="block text-sm font-medium text-gray-700 mb-3"
          >
            Conversation Transcript
          </label>
          <div className="relative">
            <textarea
              id="transcript"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={`Paste your conversation transcript here...

Example format (Tactiq):
Meeting started: 1/23/2026, 12:00:50 PM
Duration: 50 minutes
Participants: Emmet Reilly, John Dohrmann, Luke Peterson, sascha peuckert

## Transcript

00:00 Luke Peterson: Hello everyone...
00:05 sascha peuckert: Hi, nice to meet you...`}
              rows={20}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={isProcessing}
            />
            {transcript.length > 0 && (
              <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                {transcript.length.toLocaleString()} characters
              </div>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Paste the full transcript including meeting metadata and speaker names.
            Timestamps are optional but helpful for context.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 p-4">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">
                Processing Error
              </p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* What You'll Get Section */}
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            What Claude AI Will Extract
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
            <ul className="space-y-1">
              <li>• Meeting details & participants</li>
              <li>• Key takeaways & concerns</li>
              <li>• Next steps with ownership</li>
            </ul>
            <ul className="space-y-1">
              <li>• Opportunity details & deal sizing</li>
              <li>• Test engagement plan (if applicable)</li>
              <li>• Draft follow-up emails</li>
            </ul>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/conversations"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isProcessing || transcript.trim().length < 100}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing with Claude...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Process Transcript
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewConversationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <NewConversationForm />
    </Suspense>
  );
}
