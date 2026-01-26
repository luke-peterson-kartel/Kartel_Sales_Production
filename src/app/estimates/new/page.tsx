'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calculator,
  Plus,
  Trash2,
  Loader2,
  Save,
  Zap,
  Cpu,
  Sparkles,
} from 'lucide-react';
import { PLATFORMS, CREATIVE_TYPES, SIZES, DURATIONS } from '@/lib/constants';

interface Project {
  id: string;
  name: string;
  jobId: string;
  client: {
    id: string;
    name: string;
  };
}

interface Deliverable {
  id: string;
  platform: string;
  creativeType: string;
  size: string;
  duration: number | null;
  monthlyCount: number;
}

// Cost table for calculation
const COST_TABLE = {
  static: 0.1,
  gif: 0.15,
  shortVideo: 0.2,
  mediumVideo: 0.3,
  longVideo: 0.5,
};

function calculateDeliverableDays(d: Deliverable): number {
  let daysPerAsset = COST_TABLE.static;

  if (d.creativeType === 'GIF') {
    daysPerAsset = COST_TABLE.gif;
  } else if (['Video', 'UGC', 'Branded', 'VideoPin'].includes(d.creativeType)) {
    if (d.duration && d.duration <= 15) {
      daysPerAsset = COST_TABLE.shortVideo;
    } else if (d.duration && d.duration <= 30) {
      daysPerAsset = COST_TABLE.mediumVideo;
    } else {
      daysPerAsset = COST_TABLE.longVideo;
    }
  }

  return d.monthlyCount * daysPerAsset;
}

function NewEstimateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedProjectId = searchParams.get('projectId');
  const fromParsed = searchParams.get('fromParsed') === 'true';

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadedFromParsed, setLoadedFromParsed] = useState(false);

  const [formData, setFormData] = useState({
    projectId: preselectedProjectId || '',
    name: '',
    requiresLoRA: false,
    requiresCustomWorkflow: false,
    contractMonths: 12,
  });

  const [deliverables, setDeliverables] = useState<Deliverable[]>([
    {
      id: crypto.randomUUID(),
      platform: 'Meta',
      creativeType: 'Video',
      size: '9x16',
      duration: 15,
      monthlyCount: 10,
    },
  ]);

  // Load parsed deliverables from sessionStorage if coming from parse page
  useEffect(() => {
    if (fromParsed && !loadedFromParsed) {
      const stored = sessionStorage.getItem('parsedDeliverables');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const loadedDeliverables = parsed.map((d: {
              platform: string;
              creativeType: string;
              size: string;
              duration: number | null;
              monthlyCount: number;
            }) => ({
              id: crypto.randomUUID(),
              platform: d.platform,
              creativeType: d.creativeType,
              size: d.size,
              duration: d.duration,
              monthlyCount: d.monthlyCount,
            }));
            setDeliverables(loadedDeliverables);
            setFormData(prev => ({ ...prev, name: 'Parsed Estimate' }));
          }
        } catch {
          console.error('Failed to parse stored deliverables');
        }
        sessionStorage.removeItem('parsedDeliverables');
      }
      setLoadedFromParsed(true);
    }
  }, [fromParsed, loadedFromParsed]);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch('/api/projects');
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
      } finally {
        setLoadingProjects(false);
      }
    }
    fetchProjects();
  }, []);

  const addDeliverable = () => {
    setDeliverables([
      ...deliverables,
      {
        id: crypto.randomUUID(),
        platform: 'Meta',
        creativeType: 'Video',
        size: '9x16',
        duration: 15,
        monthlyCount: 10,
      },
    ]);
  };

  const removeDeliverable = (id: string) => {
    if (deliverables.length > 1) {
      setDeliverables(deliverables.filter((d) => d.id !== id));
    }
  };

  const updateDeliverable = (id: string, field: string, value: string | number | null) => {
    setDeliverables(
      deliverables.map((d) =>
        d.id === id ? { ...d, [field]: value } : d
      )
    );
  };

  // Calculate totals
  const totalMonthlyAssets = deliverables.reduce((sum, d) => sum + d.monthlyCount, 0);
  const totalMonthlyDays = deliverables.reduce((sum, d) => sum + calculateDeliverableDays(d), 0);
  const setupDays = formData.requiresLoRA ? 21 : formData.requiresCustomWorkflow ? 14 : 7;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          deliverables: deliverables.map((d) => ({
            platform: d.platform,
            creativeType: d.creativeType,
            size: d.size,
            duration: d.duration,
            monthlyCount: d.monthlyCount,
            totalCount: d.monthlyCount * formData.contractMonths,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create estimate');
      }

      const estimate = await response.json();
      router.push(`/estimates/${estimate.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedProject = projects.find((p) => p.id === formData.projectId);

  const isVideoType = (type: string) =>
    ['Video', 'UGC', 'Branded', 'VideoPin'].includes(type);

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={preselectedProjectId ? `/projects/${preselectedProjectId}` : '/projects'}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          {preselectedProjectId ? 'Back to Project' : 'Back to Projects'}
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">New Estimate</h1>
            <p className="mt-1 text-gray-500">
              Calculate team effort based on deliverable requirements
            </p>
          </div>
          <Link
            href={`/estimates/from-request${preselectedProjectId ? `?projectId=${preselectedProjectId}` : ''}`}
            className="inline-flex items-center gap-2 rounded-lg border border-purple-300 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100"
          >
            <Sparkles className="h-4 w-4" />
            Parse Client Request
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Project Selection */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Project</h2>
          <div className="grid grid-cols-2 gap-4">
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
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
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
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Estimate Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., Initial Scope v1"
              />
            </div>
          </div>
        </div>

        {/* Project Classification */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Classification</h2>
          <div className="grid grid-cols-3 gap-4">
            <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={formData.requiresLoRA}
                onChange={(e) => setFormData({ ...formData, requiresLoRA: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-500" />
                  <span className="font-medium text-gray-900">Requires LoRA</span>
                </div>
                <span className="text-xs text-gray-500">+21 day setup</span>
              </div>
            </label>
            <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={formData.requiresCustomWorkflow}
                onChange={(e) => setFormData({ ...formData, requiresCustomWorkflow: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-gray-900">Custom Workflow</span>
                </div>
                <span className="text-xs text-gray-500">+14 day setup</span>
              </div>
            </label>
            <div>
              <label htmlFor="contractMonths" className="block text-sm font-medium text-gray-700 mb-1">
                Contract Duration (months)
              </label>
              <input
                type="number"
                id="contractMonths"
                min="1"
                max="36"
                value={formData.contractMonths}
                onChange={(e) => setFormData({ ...formData, contractMonths: parseInt(e.target.value) || 12 })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Deliverables */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Deliverables</h2>
            <button
              type="button"
              onClick={addDeliverable}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Plus className="h-4 w-4" />
              Add Deliverable
            </button>
          </div>

          <div className="space-y-4">
            {deliverables.map((deliverable, index) => (
              <div
                key={deliverable.id}
                className="grid grid-cols-6 gap-3 items-end p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Platform
                  </label>
                  <select
                    value={deliverable.platform}
                    onChange={(e) => updateDeliverable(deliverable.id, 'platform', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.value}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Type
                  </label>
                  <select
                    value={deliverable.creativeType}
                    onChange={(e) => {
                      updateDeliverable(deliverable.id, 'creativeType', e.target.value);
                      if (!isVideoType(e.target.value)) {
                        updateDeliverable(deliverable.id, 'duration', null);
                      }
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    {CREATIVE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.value}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Size
                  </label>
                  <select
                    value={deliverable.size}
                    onChange={(e) => updateDeliverable(deliverable.id, 'size', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    {SIZES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.value}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Duration
                  </label>
                  <select
                    value={deliverable.duration || ''}
                    onChange={(e) =>
                      updateDeliverable(
                        deliverable.id,
                        'duration',
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    disabled={!isVideoType(deliverable.creativeType)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="">N/A</option>
                    {DURATIONS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Monthly Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={deliverable.monthlyCount}
                    onChange={(e) =>
                      updateDeliverable(deliverable.id, 'monthlyCount', parseInt(e.target.value) || 0)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 text-right">
                    <span className="text-xs text-gray-500">Days:</span>
                    <span className="ml-1 font-semibold text-gray-900">
                      {calculateDeliverableDays(deliverable).toFixed(1)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDeliverable(deliverable.id)}
                    disabled={deliverables.length === 1}
                    className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Estimate Summary
          </h2>
          <div className="grid grid-cols-4 gap-6">
            <div>
              <div className="text-3xl font-bold">{setupDays}</div>
              <div className="text-sm text-blue-100">Setup Days</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{totalMonthlyDays.toFixed(1)}</div>
              <div className="text-sm text-blue-100">Days/Month</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{totalMonthlyAssets}</div>
              <div className="text-sm text-blue-100">Assets/Month</div>
            </div>
            <div>
              <div className="text-3xl font-bold">
                {totalMonthlyAssets * formData.contractMonths}
              </div>
              <div className="text-sm text-blue-100">Total Assets ({formData.contractMonths} mo)</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20 text-sm">
            <span className={`inline-flex rounded-full px-2.5 py-0.5 font-medium ${
              formData.requiresLoRA || formData.requiresCustomWorkflow
                ? 'bg-purple-500/30 text-white'
                : 'bg-blue-500/30 text-white'
            }`}>
              {formData.requiresLoRA || formData.requiresCustomWorkflow ? 'ADVANCED' : 'STANDARD'} Project
            </span>
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
            href={preselectedProjectId ? `/projects/${preselectedProjectId}` : '/projects'}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLoading || !formData.projectId}
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
                Create Estimate
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewEstimatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <NewEstimateForm />
    </Suspense>
  );
}
