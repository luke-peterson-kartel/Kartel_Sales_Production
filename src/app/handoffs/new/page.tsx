'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Save,
  Calendar,
} from 'lucide-react';
import { HANDOFF_TYPES } from '@/lib/constants';

interface Project {
  id: string;
  name: string;
  jobId: string;
  client: {
    id: string;
    name: string;
  };
  handoffs: Array<{
    handoffNumber: number;
  }>;
}

function NewHandoffForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedProjectId = searchParams.get('projectId');
  const preselectedHandoffNumber = searchParams.get('handoffNumber');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Determine initial handoff number and type
  const initialHandoffNumber = preselectedHandoffNumber ? parseInt(preselectedHandoffNumber, 10) : 1;
  const initialHandoffType = HANDOFF_TYPES.find((h) => h.number === initialHandoffNumber);

  const [formData, setFormData] = useState({
    projectId: preselectedProjectId || '',
    handoffNumber: initialHandoffNumber,
    type: initialHandoffType?.value || 'SALES_TO_PRODUCTION',
    notes: '',
    dueAt: '',
  });

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch('/api/projects');
        if (response.ok) {
          const data = await response.json();
          setProjects(data);

          // If project preselected and no specific handoff number requested, determine next available
          if (preselectedProjectId && !preselectedHandoffNumber) {
            const project = data.find((p: Project) => p.id === preselectedProjectId);
            if (project) {
              const existingNumbers = project.handoffs.map((h: { handoffNumber: number }) => h.handoffNumber);
              const nextNumber = [1, 2, 3, 4].find((n) => !existingNumbers.includes(n)) || 1;
              const handoffType = HANDOFF_TYPES.find((h) => h.number === nextNumber);
              setFormData((prev) => ({
                ...prev,
                handoffNumber: nextNumber,
                type: handoffType?.value || 'SALES_TO_PRODUCTION',
              }));
            }
          }
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
      } finally {
        setLoadingProjects(false);
      }
    }
    fetchProjects();
  }, [preselectedProjectId, preselectedHandoffNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/handoffs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create handoff');
      }

      const handoff = await response.json();
      router.push(`/handoffs/${handoff.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedProject = projects.find((p) => p.id === formData.projectId);
  const existingHandoffNumbers = selectedProject?.handoffs.map((h) => h.handoffNumber) || [];
  const availableHandoffs = HANDOFF_TYPES.filter(
    (h) => !existingHandoffNumbers.includes(h.number)
  );

  const selectedHandoff = HANDOFF_TYPES.find((h) => h.number === formData.handoffNumber);

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={preselectedProjectId ? `/projects/${preselectedProjectId}` : '/projects'}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          {preselectedProjectId ? 'Back to Project' : 'Back to Projects'}
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">New Handoff</h1>
        <p className="mt-1 text-gray-500">
          Create a handoff to transfer work between teams
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Project Selection */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Project</h2>
          <div>
            <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-1">
              Select Project *
            </label>
            {loadingProjects ? (
              <div className="flex items-center gap-2 py-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading projects...
              </div>
            ) : (
              <select
                id="projectId"
                required
                value={formData.projectId}
                onChange={(e) => {
                  const project = projects.find((p) => p.id === e.target.value);
                  const existingNumbers = project?.handoffs.map((h) => h.handoffNumber) || [];
                  const nextNumber = [1, 2, 3, 4].find((n) => !existingNumbers.includes(n)) || 1;
                  const handoffType = HANDOFF_TYPES.find((h) => h.number === nextNumber);
                  setFormData({
                    ...formData,
                    projectId: e.target.value,
                    handoffNumber: nextNumber,
                    type: handoffType?.value || 'SALES_TO_PRODUCTION',
                  });
                }}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select a project...</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.client.name} - {project.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Handoff Type Selection */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Handoff Type</h2>

          {availableHandoffs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>All handoffs have been created for this project.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {HANDOFF_TYPES.map((handoff) => {
                const isExisting = existingHandoffNumbers.includes(handoff.number);
                const isSelected = formData.handoffNumber === handoff.number;

                return (
                  <label
                    key={handoff.number}
                    className={`
                      flex items-center gap-4 rounded-lg border p-4 cursor-pointer transition-colors
                      ${isExisting
                        ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                        : isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="handoffNumber"
                      value={handoff.number}
                      checked={isSelected}
                      disabled={isExisting}
                      onChange={() =>
                        setFormData({
                          ...formData,
                          handoffNumber: handoff.number,
                          type: handoff.value,
                        })
                      }
                      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        isExisting
                          ? 'bg-green-100 text-green-600'
                          : isSelected
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {isExisting ? '✓' : handoff.number}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{handoff.label}</div>
                      <div className="text-sm text-gray-500">
                        {handoff.timing} - {handoff.description}
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Details */}
        {selectedHandoff && (
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="dueAt" className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="datetime-local"
                    id="dueAt"
                    value={formData.dueAt}
                    onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Suggested timing: {selectedHandoff.timing}
                </p>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  id="notes"
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Any additional notes for this handoff..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link
            href={preselectedProjectId ? `/projects/${preselectedProjectId}` : '/projects'}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLoading || !formData.projectId || availableHandoffs.length === 0}
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
                Create Handoff
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewHandoffPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <NewHandoffForm />
    </Suspense>
  );
}
