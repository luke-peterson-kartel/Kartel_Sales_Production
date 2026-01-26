'use client';

import { useState } from 'react';
import { Search, Linkedin, Sparkles, Loader2, Check, AlertCircle } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  email?: string | null;
  linkedInUrl?: string | null;
  jobTitle?: string | null;
  enrichedAt?: Date | null;
}

interface ContactActionsProps {
  contact: Contact;
  companyName?: string;
  onEnrichComplete?: () => void;
}

export default function ContactActions({ contact, companyName, onEnrichComplete }: ContactActionsProps) {
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichResult, setEnrichResult] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generate LinkedIn search URL
  const linkedInSearchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
    `${contact.name}${companyName ? ` ${companyName}` : ''}`
  )}`;

  // Generate Google search URL
  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(
    `${contact.name}${companyName ? ` ${companyName}` : ''} site:linkedin.com`
  )}`;

  const handleEnrich = async () => {
    setIsEnriching(true);
    setEnrichResult(null);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/contacts/${contact.id}/enrich`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Enrichment failed');
      }

      setEnrichResult('success');
      onEnrichComplete?.();

      // Clear success indicator after 3 seconds
      setTimeout(() => setEnrichResult(null), 3000);
    } catch (error) {
      setEnrichResult('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');

      // Clear error after 5 seconds
      setTimeout(() => {
        setEnrichResult(null);
        setErrorMessage(null);
      }, 5000);
    } finally {
      setIsEnriching(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {/* LinkedIn Search */}
      {!contact.linkedInUrl && (
        <a
          href={linkedInSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
          title="Search LinkedIn"
        >
          <Linkedin className="h-3.5 w-3.5" />
        </a>
      )}

      {/* Google Search */}
      <a
        href={googleSearchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
        title="Search Google"
      >
        <Search className="h-3.5 w-3.5" />
      </a>

      {/* Enrich with Apollo */}
      <button
        onClick={handleEnrich}
        disabled={isEnriching}
        className={`p-1 rounded transition-colors ${
          enrichResult === 'success'
            ? 'text-green-600'
            : enrichResult === 'error'
            ? 'text-red-500'
            : 'text-gray-400 hover:text-purple-600'
        }`}
        title={
          enrichResult === 'success'
            ? 'Enriched!'
            : enrichResult === 'error'
            ? errorMessage || 'Enrichment failed'
            : contact.enrichedAt
            ? 'Re-enrich with Apollo'
            : 'Enrich with Apollo'
        }
      >
        {isEnriching ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : enrichResult === 'success' ? (
          <Check className="h-3.5 w-3.5" />
        ) : enrichResult === 'error' ? (
          <AlertCircle className="h-3.5 w-3.5" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

// Bulk enrich button for enriching all contacts
export function BulkEnrichButton({
  contactIds,
  onComplete
}: {
  contactIds: string[];
  onComplete?: () => void;
}) {
  const [isEnriching, setIsEnriching] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleBulkEnrich = async () => {
    if (contactIds.length === 0) return;

    setIsEnriching(true);
    setProgress(0);

    let completed = 0;

    for (const contactId of contactIds) {
      try {
        await fetch(`/api/contacts/${contactId}/enrich`, {
          method: 'POST',
        });
      } catch {
        // Continue with other contacts even if one fails
      }

      completed++;
      setProgress(Math.round((completed / contactIds.length) * 100));

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsEnriching(false);
    onComplete?.();
  };

  if (contactIds.length === 0) return null;

  return (
    <button
      onClick={handleBulkEnrich}
      disabled={isEnriching}
      className="inline-flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700 disabled:opacity-50"
    >
      {isEnriching ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          Enriching... {progress}%
        </>
      ) : (
        <>
          <Sparkles className="h-3 w-3" />
          Enrich All ({contactIds.length})
        </>
      )}
    </button>
  );
}
