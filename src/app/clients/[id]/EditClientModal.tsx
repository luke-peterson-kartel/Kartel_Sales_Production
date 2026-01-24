'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Save, Loader2, Globe, Building2 } from 'lucide-react';
import { VERTICALS, CLASSIFICATIONS, RED_FLAGS } from '@/lib/constants';

interface Client {
  id: string;
  name: string;
  website: string | null;
  vertical: string;
  notes: string | null;
  classification: string;
  dealBehindSpec: boolean;
  redFlags: string | null;
}

export default function EditClientModal({
  client,
  onClose,
}: {
  client: Client;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedRedFlags = client.redFlags ? JSON.parse(client.redFlags) : [];

  const [formData, setFormData] = useState({
    name: client.name,
    website: client.website || '',
    vertical: client.vertical,
    notes: client.notes || '',
    classification: client.classification,
    dealBehindSpec: client.dealBehindSpec,
    redFlags: parsedRedFlags as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          redFlags: JSON.stringify(formData.redFlags),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update client');
      }

      router.refresh();
      onClose();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl m-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Edit Client</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Basic Information</h3>

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
                />
              </div>
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
                {VERTICALS.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Classification */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Classification</h3>

            <div className="grid grid-cols-3 gap-3">
              {CLASSIFICATIONS.map((c) => (
                <label
                  key={c.value}
                  className={`
                    flex cursor-pointer flex-col rounded-lg border p-3 transition-colors text-sm
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
                </label>
              ))}
            </div>

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
                <span className="font-medium text-gray-900 text-sm">Deal-Behind-Spec</span>
                <p className="text-xs text-gray-500">
                  Client commits to paid engagement after successful spec work
                </p>
              </div>
            </label>
          </div>

          {/* Red Flags */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Red Flags</h3>
            <div className="space-y-2">
              {RED_FLAGS.map((flag) => (
                <label
                  key={flag.value}
                  className={`
                    flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors text-sm
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
                  <span className="flex-1 font-medium text-gray-900">{flag.label}</span>
                  <span
                    className={`text-xs font-medium ${
                      flag.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'
                    }`}
                  >
                    {flag.severity}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
