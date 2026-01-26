'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, Check, AlertCircle } from 'lucide-react';

interface ContactEnrichButtonProps {
  contactId: string;
  enrichedAt: Date | null;
}

export default function ContactEnrichButton({ contactId, enrichedAt }: ContactEnrichButtonProps) {
  const router = useRouter();
  const [isEnriching, setIsEnriching] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleEnrich = async () => {
    setIsEnriching(true);
    setResult(null);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/contacts/${contactId}/enrich`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Enrichment failed');
      }

      setResult('success');
      router.refresh();

      setTimeout(() => setResult(null), 3000);
    } catch (error) {
      setResult('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');

      setTimeout(() => {
        setResult(null);
        setErrorMessage(null);
      }, 5000);
    } finally {
      setIsEnriching(false);
    }
  };

  return (
    <button
      onClick={handleEnrich}
      disabled={isEnriching}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
        result === 'success'
          ? 'bg-green-100 text-green-700'
          : result === 'error'
          ? 'bg-red-100 text-red-700'
          : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
      } disabled:opacity-50`}
    >
      {isEnriching ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Enriching...
        </>
      ) : result === 'success' ? (
        <>
          <Check className="h-4 w-4" />
          Enriched!
        </>
      ) : result === 'error' ? (
        <>
          <AlertCircle className="h-4 w-4" />
          {errorMessage || 'Failed'}
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          {enrichedAt ? 'Re-enrich with Apollo' : 'Enrich with Apollo'}
        </>
      )}
    </button>
  );
}
