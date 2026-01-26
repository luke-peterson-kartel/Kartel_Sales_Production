'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
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
  Settings,
} from 'lucide-react';
import { PLATFORMS, CREATIVE_TYPES, SIZES, DURATIONS } from '@/lib/constants';
import {
  getDaysPerAsset,
  calculateSetupDays,
  DEFAULT_ESTIMATION_CONFIG,
  VIDEO_TYPES,
} from '@/lib/estimation';

interface Deliverable {
  id: string;
  platform: string;
  creativeType: string;
  size: string;
  duration: number | null;
  monthlyCount: number;
}

interface EstimationConfig {
  staticImageDays: number;
  gifDays: number;
  shortVideoDays: number;
  mediumVideoDays: number;
  longVideoDays: number;
  baseSetupDays: number;
  loraSetupDays: number;
  customWorkflowDays: number;
  genTeamPercent: number;
  productionPercent: number;
  qcPercent: number;
  clientReviewPercent: number;
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
  requiresLoRA: boolean;
  requiresCustomWorkflow: boolean;
  contractMonths: number;
  projectType: string;
  deliverables: EstimateDeliverable[];  // Estimate's own deliverables
  project: {
    id: string;
    name: string;
    client: {
      id: string;
      name: string;
    };
  };
}

export default function EditEstimatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [config, setConfig] = useState<EstimationConfig | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    requiresLoRA: false,
    requiresCustomWorkflow: false,
    contractMonths: 12,
  });

  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);

  // Load estimate data and estimation config
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch both estimate and config in parallel
        const [estimateRes, configRes] = await Promise.all([
          fetch(`/api/estimates/${id}`),
          fetch('/api/settings/estimation'),
        ]);

        if (!estimateRes.ok) {
          throw new Error('Failed to load estimate');
        }

        const estimateData: Estimate = await estimateRes.json();
        setEstimate(estimateData);
        setFormData({
          name: estimateData.name,
          requiresLoRA: estimateData.requiresLoRA,
          requiresCustomWorkflow: estimateData.requiresCustomWorkflow,
          contractMonths: estimateData.contractMonths,
        });

        // Load deliverables from estimate's own deliverables
        const loadedDeliverables: Deliverable[] = estimateData.deliverables.map((d) => ({
          id: d.id,
          platform: d.platform,
          creativeType: d.creativeType,
          size: d.size,
          duration: d.duration,
          monthlyCount: d.monthlyCount,
        }));

        // If no deliverables exist, start with one default
        if (loadedDeliverables.length === 0) {
          loadedDeliverables.push({
            id: `new-${crypto.randomUUID()}`,
            platform: 'Meta',
            creativeType: 'Video',
            size: '9x16',
            duration: 15,
            monthlyCount: 10,
          });
        }

        setDeliverables(loadedDeliverables);

        // Load config (use defaults if API fails)
        if (configRes.ok) {
          const configData = await configRes.json();
          setConfig(configData);
        } else {
          setConfig(DEFAULT_ESTIMATION_CONFIG as unknown as EstimationConfig);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load estimate');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id]);

  // Get the active config (or defaults)
  const activeConfig = config || (DEFAULT_ESTIMATION_CONFIG as unknown as EstimationConfig);

  // Calculate days for a deliverable using centralized config
  const calculateDeliverableDays = (d: Deliverable): number => {
    const daysPerAsset = getDaysPerAsset(d.creativeType, d.duration, activeConfig);
    return d.monthlyCount * daysPerAsset;
  };

  const addDeliverable = () => {
    setDeliverables([
      ...deliverables,
      {
        id: `new-${crypto.randomUUID()}`,
        platform: 'Meta',
        creativeType: 'Video',
        size: '9x16',
        duration: 15,
        monthlyCount: 10,
      },
    ]);
  };

  const removeDeliverable = (delId: string) => {
    if (deliverables.length > 1) {
      setDeliverables(deliverables.filter((d) => d.id !== delId));
    }
  };

  const updateDeliverable = (delId: string, field: string, value: string | number | null) => {
    setDeliverables(
      deliverables.map((d) =>
        d.id === delId ? { ...d, [field]: value } : d
      )
    );
  };

  // Calculate totals using centralized config
  const totalMonthlyAssets = deliverables.reduce((sum, d) => sum + d.monthlyCount, 0);
  const totalMonthlyDays = deliverables.reduce((sum, d) => sum + calculateDeliverableDays(d), 0);
  const setupDays = calculateSetupDays(
    formData.requiresLoRA,
    formData.requiresCustomWorkflow,
    activeConfig
  );

  // Team effort split from config
  const monthlyGenTeamDays = Math.round(totalMonthlyDays * activeConfig.genTeamPercent * 10) / 10;
  const monthlyProductionDays = Math.round(totalMonthlyDays * activeConfig.productionPercent * 10) / 10;
  const monthlyQCDays = Math.round(totalMonthlyDays * activeConfig.qcPercent * 10) / 10;
  const monthlyClientReviewDays = Math.round(totalMonthlyDays * activeConfig.clientReviewPercent * 10) / 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      // Send deliverables to the API - it will recalculate everything server-side
      const response = await fetch(`/api/estimates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          requiresLoRA: formData.requiresLoRA,
          requiresCustomWorkflow: formData.requiresCustomWorkflow,
          contractMonths: formData.contractMonths,
          deliverables: deliverables.map((d) => ({
            platform: d.platform,
            creativeType: d.creativeType,
            size: d.size,
            duration: d.duration,
            monthlyCount: d.monthlyCount,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update estimate');
      }

      router.push(`/estimates/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const isVideoType = (type: string) =>
    VIDEO_TYPES.includes(type as typeof VIDEO_TYPES[number]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && !estimate) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-red-600">
        <p>{error}</p>
        <Link href="/estimates" className="mt-4 inline-block text-sm underline">
          Back to Estimates
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/estimates/${id}`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Estimate
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Estimate</h1>
            <p className="mt-1 text-gray-500">
              {estimate?.project.client.name} - {estimate?.project.name}
            </p>
          </div>
          <Link
            href="/settings/estimation"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <Settings className="h-4 w-4" />
            Calculation Settings
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Estimate Details */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Estimate Details</h2>
          <div className="grid grid-cols-2 gap-4">
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

        {/* Project Classification */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Classification</h2>
          <div className="grid grid-cols-2 gap-4">
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
                <span className="text-xs text-gray-500">+{activeConfig.loraSetupDays} day setup</span>
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
                <span className="text-xs text-gray-500">+{activeConfig.customWorkflowDays} day setup</span>
              </div>
            </label>
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
            {deliverables.map((deliverable) => (
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
            href={`/estimates/${id}`}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? (
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
  );
}
