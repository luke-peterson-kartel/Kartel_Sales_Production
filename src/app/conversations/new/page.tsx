'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Upload,
  Sparkles,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { TRANSCRIPT_SOURCES } from '@/lib/types/conversation';

export default function NewConversationPage() {
  const router = useRouter();
  const [transcript, setTranscript] = useState('');
  const [source, setSource] = useState('manual');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (transcript.trim().length < 100) {
      setError('Please paste a complete conversation transcript (at least 100 characters).');
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Create the conversation
      const createResponse = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawTranscript: transcript,
          transcriptSource: source,
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
          href="/conversations"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Conversations
        </Link>

        <h1 className="text-3xl font-bold text-gray-900">
          Process New Transcript
        </h1>
        <p className="mt-1 text-gray-500">
          Paste a client call transcript and let Claude AI extract key information,
          next steps, and draft follow-up emails.
        </p>
      </div>

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
