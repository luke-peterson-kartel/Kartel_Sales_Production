'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
  Download,
  Save,
  Loader2,
  Calculator,
} from 'lucide-react';
import { PLATFORMS, CREATIVE_TYPES, SIZES, DURATIONS } from '@/lib/constants';
import { getDaysPerAsset, DEFAULT_ESTIMATION_CONFIG, VIDEO_TYPES } from '@/lib/estimation';

interface Deliverable {
  id?: string;
  platform: string;
  creativeType: string;
  size: string;
  duration: number | null;
  monthlyCount: number;
  totalCount: number;
  estimatedDays: number;
}

interface EstimateDeliverable {
  id: string;
  platform: string;
  creativeType: string;
  size: string;
  duration: number | null;
  monthlyCount: number;
  estimatedDays: number;
}

interface Estimate {
  id: string;
  name: string;
  projectType: string;
  totalAssets: number;
  totalMonthlyDays: number;
  setupDays: number;
  contractMonths: number;
  deliverables: EstimateDeliverable[];  // Estimate's own deliverables
}

interface Project {
  id: string;
  name: string;
  jobId: string;
  client: {
    id: string;
    name: string;
  };
}

interface EstimationConfig {
  staticImageDays: number;
  gifDays: number;
  shortVideoDays: number;
  mediumVideoDays: number;
  longVideoDays: number;
}

export default function DeliverablesPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [config, setConfig] = useState<EstimationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedEstimateId, setSelectedEstimateId] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch project, deliverables, estimates, and config
  useEffect(() => {
    async function fetchData() {
      try {
        const [projectRes, deliverablesRes, estimatesRes, configRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/projects/${projectId}/deliverables`),
          fetch(`/api/estimates?projectId=${projectId}`),
          fetch('/api/settings/estimation'),
        ]);

        if (projectRes.ok) {
          const projectData = await projectRes.json();
          setProject(projectData);
        }

        if (deliverablesRes.ok) {
          const deliverablesData = await deliverablesRes.json();
          setDeliverables(deliverablesData);
        }

        if (estimatesRes.ok) {
          const estimatesData = await estimatesRes.json();
          setEstimates(estimatesData);
        }

        if (configRes.ok) {
          const configData = await configRes.json();
          setConfig(configData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [projectId]);

  const activeConfig = config || DEFAULT_ESTIMATION_CONFIG;

  // Calculate estimated days for a deliverable
  const calculateDeliverableDays = (d: Deliverable): number => {
    const daysPerAsset = getDaysPerAsset(d.creativeType, d.duration, activeConfig);
    return Math.round(d.monthlyCount * daysPerAsset * 10) / 10;
  };

  // Check if creative type needs duration
  const needsDuration = (creativeType: string): boolean => {
    return VIDEO_TYPES.includes(creativeType as typeof VIDEO_TYPES[number]) || creativeType === 'GIF';
  };

  // Add new deliverable
  const addDeliverable = () => {
    const newDeliverable: Deliverable = {
      platform: 'Meta',
      creativeType: 'Static',
      size: '1x1',
      duration: null,
      monthlyCount: 1,
      totalCount: 1,
      estimatedDays: activeConfig.staticImageDays,
    };
    setDeliverables([...deliverables, newDeliverable]);
    setHasChanges(true);
  };

  // Update deliverable
  const updateDeliverable = (index: number, field: keyof Deliverable, value: string | number | null) => {
    const updated = [...deliverables];
    updated[index] = { ...updated[index], [field]: value };

    // Recalculate estimated days when relevant fields change
    if (field === 'creativeType' || field === 'duration' || field === 'monthlyCount') {
      updated[index].estimatedDays = calculateDeliverableDays(updated[index]);
    }

    // Also update totalCount when monthlyCount changes
    if (field === 'monthlyCount') {
      updated[index].totalCount = value as number;
    }

    setDeliverables(updated);
    setHasChanges(true);
  };

  // Remove deliverable
  const removeDeliverable = (index: number) => {
    const updated = deliverables.filter((_, i) => i !== index);
    setDeliverables(updated);
    setHasChanges(true);
  };

  // Apply estimate's deliverables to project using the apply API
  const applyEstimate = async () => {
    if (!selectedEstimateId) return;

    const selectedEstimate = estimates.find((e) => e.id === selectedEstimateId);
    if (!selectedEstimate) return;

    // Check if estimate has deliverables
    if (selectedEstimate.deliverables.length === 0) {
      alert(
        `This estimate ("${selectedEstimate.name}") has no deliverables.\n\n` +
        `Please edit the estimate and add deliverables first.`
      );
      return;
    }

    try {
      // Use the apply endpoint to copy deliverables to project
      const res = await fetch(`/api/estimates/${selectedEstimateId}/apply`, {
        method: 'POST',
      });

      if (res.ok) {
        const result = await res.json();
        // Refresh the deliverables from the response
        if (result.project?.deliverables) {
          setDeliverables(result.project.deliverables);
        } else {
          // Fallback: refetch deliverables
          const deliverablesRes = await fetch(`/api/projects/${projectId}/deliverables`);
          if (deliverablesRes.ok) {
            const deliverablesData = await deliverablesRes.json();
            setDeliverables(deliverablesData);
          }
        }
        setHasChanges(false);
        setSelectedEstimateId('');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to apply estimate');
      }
    } catch (error) {
      console.error('Error applying estimate:', error);
      alert('Failed to apply estimate deliverables');
    }
  };

  // Save deliverables
  const saveDeliverables = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/deliverables`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliverables }),
      });

      if (res.ok) {
        setHasChanges(false);
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to save deliverables');
      }
    } catch (error) {
      console.error('Error saving deliverables:', error);
      alert('Failed to save deliverables');
    } finally {
      setSaving(false);
    }
  };

  // Calculate totals
  const totalMonthlyAssets = deliverables.reduce((sum, d) => sum + d.monthlyCount, 0);
  const totalEstimatedDays = deliverables.reduce((sum, d) => sum + d.estimatedDays, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Project not found</p>
        <Link href="/projects" className="text-blue-600 hover:underline mt-2 inline-block">
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Project
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Deliverables</h1>
            <p className="mt-1 text-gray-500">
              {project.name} - {project.client.name}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/settings/estimation"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <Calculator className="h-4 w-4" />
              Calculation Settings
            </Link>
            <button
              onClick={saveDeliverables}
              disabled={!hasChanges || saving}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
                hasChanges
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Apply from Estimate */}
      {estimates.length > 0 && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-blue-900 mb-1">
                Apply Deliverables from Estimate
              </label>
              <select
                value={selectedEstimateId}
                onChange={(e) => setSelectedEstimateId(e.target.value)}
                className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select an estimate...</option>
                {estimates.map((est) => (
                  <option key={est.id} value={est.id}>
                    {est.deliverables?.length > 0 ? '✓ ' : '⚠ '}
                    {est.name} - {est.totalAssets} assets, {est.totalMonthlyDays} days/month ({est.deliverables?.length || 0} deliverables)
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={applyEstimate}
              disabled={!selectedEstimateId}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
                selectedEstimateId
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-200 text-blue-400 cursor-not-allowed'
              }`}
            >
              <Download className="h-4 w-4" />
              Apply
            </button>
          </div>
          <p className="mt-2 text-xs text-blue-700">
            ✓ = Has deliverables, ⚠ = No deliverables yet.
            Applying will replace all current project deliverables with the estimate's deliverables.
          </p>
        </div>
      )}

      {/* Deliverables Table */}
      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Deliverables ({deliverables.length})
            </h2>
            <button
              onClick={addDeliverable}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-800"
            >
              <Plus className="h-4 w-4" />
              Add Deliverable
            </button>
          </div>
        </div>

        {deliverables.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">No deliverables defined yet</p>
            <button
              onClick={addDeliverable}
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add your first deliverable
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Platform</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Size</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Duration</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Monthly</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Days/Mo</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {deliverables.map((deliverable, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <select
                        value={deliverable.platform}
                        onChange={(e) => updateDeliverable(index, 'platform', e.target.value)}
                        className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        {PLATFORMS.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={deliverable.creativeType}
                        onChange={(e) => updateDeliverable(index, 'creativeType', e.target.value)}
                        className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        {CREATIVE_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={deliverable.size}
                        onChange={(e) => updateDeliverable(index, 'size', e.target.value)}
                        className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        {SIZES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {needsDuration(deliverable.creativeType) ? (
                        <select
                          value={deliverable.duration || ''}
                          onChange={(e) =>
                            updateDeliverable(
                              index,
                              'duration',
                              e.target.value ? parseInt(e.target.value) : null
                            )
                          }
                          className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Select...</option>
                          {DURATIONS.map((d) => (
                            <option key={d.value} value={d.value}>
                              {d.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="1"
                        value={deliverable.monthlyCount}
                        onChange={(e) =>
                          updateDeliverable(index, 'monthlyCount', parseInt(e.target.value) || 1)
                        }
                        className="w-20 rounded border border-gray-200 px-2 py-1.5 text-sm text-right focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {deliverable.estimatedDays.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => removeDeliverable(index)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={4} className="px-4 py-3 font-medium text-gray-900">
                    Total
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{totalMonthlyAssets}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">
                    {totalEstimatedDays.toFixed(1)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Rate Reference */}
      <div className="mt-6 rounded-xl bg-gray-50 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Current Rates (days per asset)</h3>
        <div className="grid grid-cols-5 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Static:</span>{' '}
            <span className="font-medium">{activeConfig.staticImageDays}</span>
          </div>
          <div>
            <span className="text-gray-500">GIF:</span>{' '}
            <span className="font-medium">{activeConfig.gifDays}</span>
          </div>
          <div>
            <span className="text-gray-500">Short Video:</span>{' '}
            <span className="font-medium">{activeConfig.shortVideoDays}</span>
          </div>
          <div>
            <span className="text-gray-500">Medium Video:</span>{' '}
            <span className="font-medium">{activeConfig.mediumVideoDays}</span>
          </div>
          <div>
            <span className="text-gray-500">Long Video:</span>{' '}
            <span className="font-medium">{activeConfig.longVideoDays}</span>
          </div>
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {hasChanges && (
        <div className="fixed bottom-4 right-4 rounded-lg bg-yellow-50 border border-yellow-200 p-4 shadow-lg">
          <p className="text-sm text-yellow-800">
            You have unsaved changes.{' '}
            <button
              onClick={saveDeliverables}
              className="font-medium text-yellow-900 underline hover:no-underline"
            >
              Save now
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
