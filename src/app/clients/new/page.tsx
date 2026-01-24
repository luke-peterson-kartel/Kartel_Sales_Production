'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Globe, Building2, Save, Loader2 } from 'lucide-react';
import { VERTICALS, CLASSIFICATIONS, RED_FLAGS } from '@/lib/constants';

export default function NewClientPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    website: '',
    vertical: '',
    notes: '',
    classification: 'UNDETERMINED',
    dealBehindSpec: false,
    redFlags: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          redFlags: JSON.stringify(formData.redFlags),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create client');
      }

      const client = await response.json();
      router.push(`/clients/${client.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRedFlag = (flag: string) => {
    setFormData((prev) => ({
      ...prev,
      redFlags: prev.redFlags.includes(flag)
        ? prev.redFlags.filter((f) => f !== flag)
        : [...prev.redFlags, flag],
    }));
  };

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/clients"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">New Client</h1>
        <p className="mt-1 text-gray-500">
          Add a new client for pre-call preparation and qualification
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Basic Information
          </h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Client Name *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g., Toyota / Saatchi"
                />
              </div>
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="url"
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="https://example.com"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                We&apos;ll fetch website content for pre-call intel
              </p>
            </div>

            <div>
              <label htmlFor="vertical" className="block text-sm font-medium text-gray-700 mb-1">
                Vertical *
              </label>
              <select
                id="vertical"
                required
                value={formData.vertical}
                onChange={(e) => setFormData({ ...formData, vertical: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select a vertical...</option>
                {VERTICALS.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Initial Notes
              </label>
              <textarea
                id="notes"
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Any initial notes about this client, their needs, or context for the call..."
              />
            </div>
          </div>
        </div>

        {/* Classification */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Classification
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deal Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                {CLASSIFICATIONS.map((c) => (
                  <label
                    key={c.value}
                    className={`
                      flex cursor-pointer flex-col rounded-lg border p-4 transition-colors
                      ${formData.classification === c.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="classification"
                      value={c.value}
                      checked={formData.classification === c.value}
                      onChange={(e) =>
                        setFormData({ ...formData, classification: e.target.value })
                      }
                      className="sr-only"
                    />
                    <span className="font-medium text-gray-900">{c.label}</span>
                    <span className="mt-1 text-xs text-gray-500">{c.description}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.dealBehindSpec}
                  onChange={(e) =>
                    setFormData({ ...formData, dealBehindSpec: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-gray-900">Deal-Behind-Spec</span>
                  <p className="text-xs text-gray-500">
                    Client agrees: successful spec work leads to paid engagement
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Red Flags */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Red Flags
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Mark any known concerns that may disqualify this opportunity
          </p>
          <div className="space-y-3">
            {RED_FLAGS.map((flag) => (
              <label
                key={flag.value}
                className={`
                  flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors
                  ${formData.redFlags.includes(flag.value)
                    ? flag.severity === 'critical'
                      ? 'border-red-300 bg-red-50'
                      : 'border-yellow-300 bg-yellow-50'
                    : 'border-gray-200 hover:bg-gray-50'
                  }
                `}
              >
                <input
                  type="checkbox"
                  checked={formData.redFlags.includes(flag.value)}
                  onChange={() => toggleRedFlag(flag.value)}
                  className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <div className="flex-1">
                  <span className="font-medium text-gray-900">{flag.label}</span>
                  <span
                    className={`ml-2 text-xs font-medium ${
                      flag.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'
                    }`}
                  >
                    ({flag.severity})
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link
            href="/clients"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Create Client
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
