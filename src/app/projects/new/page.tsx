'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FolderKanban,
  Save,
  Loader2,
  Calendar,
  DollarSign,
  User
} from 'lucide-react';
import { PROJECT_TYPES } from '@/lib/constants';

interface Client {
  id: string;
  name: string;
  vertical: string;
}

function NewProjectForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get('clientId');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    clientId: preselectedClientId || '',
    type: 'STANDARD',
    producer: '',
    finalDueDate: '',
    acv: '',
    monthlyFee: '',
  });

  useEffect(() => {
    async function fetchClients() {
      try {
        const response = await fetch('/api/clients');
        if (response.ok) {
          const data = await response.json();
          setClients(data);
        }
      } catch (err) {
        console.error('Error fetching clients:', err);
      } finally {
        setLoadingClients(false);
      }
    }
    fetchClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create project');
      }

      const project = await response.json();
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedClient = clients.find((c) => c.id === formData.clientId);

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">New Project</h1>
        <p className="mt-1 text-gray-500">
          Create a new project and begin the production pipeline
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Client Selection */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Client
          </h2>
          <div>
            <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
              Select Client *
            </label>
            {loadingClients ? (
              <div className="flex items-center gap-2 py-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading clients...
              </div>
            ) : (
              <select
                id="clientId"
                required
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select a client...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.vertical})
                  </option>
                ))}
              </select>
            )}
            {clients.length === 0 && !loadingClients && (
              <p className="mt-2 text-sm text-gray-500">
                No clients found.{' '}
                <Link href="/clients/new" className="text-blue-600 hover:underline">
                  Create a client first
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* Project Details */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Project Details
          </h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Project Name *
              </label>
              <div className="relative">
                <FolderKanban className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g., Q1 2026 Meta Campaign"
                />
              </div>
              {selectedClient && (
                <p className="mt-1 text-xs text-gray-500">
                  Job ID will be generated as: {selectedClient.name.split(/[\/\s]/)[0].toUpperCase().slice(0, 10)}-YYYYMMDD-###
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Type *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {PROJECT_TYPES.map((t) => (
                  <label
                    key={t.value}
                    className={`
                      flex cursor-pointer flex-col rounded-lg border p-4 transition-colors
                      ${formData.type === t.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={t.value}
                      checked={formData.type === t.value}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                      className="sr-only"
                    />
                    <span className="font-medium text-gray-900">{t.label}</span>
                    <span className="mt-1 text-xs text-gray-500">{t.description}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="producer" className="block text-sm font-medium text-gray-700 mb-1">
                Producer
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  id="producer"
                  value={formData.producer}
                  onChange={(e) => setFormData({ ...formData, producer: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g., Veronica"
                />
              </div>
            </div>

            <div>
              <label htmlFor="finalDueDate" className="block text-sm font-medium text-gray-700 mb-1">
                Final Due Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  id="finalDueDate"
                  value={formData.finalDueDate}
                  onChange={(e) => setFormData({ ...formData, finalDueDate: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Financials */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Financials
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="acv" className="block text-sm font-medium text-gray-700 mb-1">
                Annual Contract Value (ACV)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  id="acv"
                  value={formData.acv}
                  onChange={(e) => setFormData({ ...formData, acv: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="1000000"
                  min="0"
                  step="1000"
                />
              </div>
            </div>

            <div>
              <label htmlFor="monthlyFee" className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Fee
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  id="monthlyFee"
                  value={formData.monthlyFee}
                  onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="83333"
                  min="0"
                  step="100"
                />
              </div>
              {formData.acv && (
                <p className="mt-1 text-xs text-gray-500">
                  Suggested monthly: ${(parseFloat(formData.acv) / 12).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
              )}
            </div>
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
            href="/projects"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLoading || !formData.clientId}
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
                Create Project
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewProjectPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <NewProjectForm />
    </Suspense>
  );
}
