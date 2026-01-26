'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  RotateCcw,
  Loader2,
  Calculator,
  Clock,
  Users,
  Image,
  Film,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { DEFAULT_ESTIMATION_CONFIG } from '@/lib/estimation';

interface EstimationConfig {
  id: string;
  name: string;
  baseSetupDays: number;
  loraSetupDays: number;
  customWorkflowDays: number;
  staticImageDays: number;
  gifDays: number;
  shortVideoDays: number;
  mediumVideoDays: number;
  longVideoDays: number;
  genTeamPercent: number;
  productionPercent: number;
  qcPercent: number;
  clientReviewPercent: number;
}

export default function EstimationSettingsPage() {
  const [config, setConfig] = useState<EstimationConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch current config
  useEffect(() => {
    async function fetchConfig() {
      try {
        const response = await fetch('/api/settings/estimation');
        if (!response.ok) throw new Error('Failed to fetch configuration');
        const data = await response.json();
        setConfig(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load configuration');
      } finally {
        setIsLoading(false);
      }
    }
    fetchConfig();
  }, []);

  const handleSave = async () => {
    if (!config) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/settings/estimation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save configuration');
      }

      const updated = await response.json();
      setConfig(updated);
      setSuccess('Configuration saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all values to defaults?')) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/settings/estimation?action=reset', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to reset configuration');

      const updated = await response.json();
      setConfig(updated);
      setSuccess('Configuration reset to defaults!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const updateConfig = (field: keyof EstimationConfig, value: number | string) => {
    if (!config) return;
    setConfig({ ...config, [field]: value });
  };

  // Calculate team total percentage
  const teamTotalPercent = config
    ? config.genTeamPercent + config.productionPercent + config.qcPercent + config.clientReviewPercent
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/estimates"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Estimates
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Calculator className="h-8 w-8 text-blue-600" />
              Estimation Settings
            </h1>
            <p className="mt-1 text-gray-500">
              Configure the calculation rates used for project estimates. Changes will affect all new estimates.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Defaults
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
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
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 p-4">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 p-4">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {config && (
        <div className="space-y-6">
          {/* Setup Days */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-400" />
              Setup Days
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              One-time setup effort at the start of a project
            </p>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Setup
                  <span className="text-gray-400 font-normal ml-1">(Standard projects)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={config.baseSetupDays}
                    onChange={(e) => updateConfig('baseSetupDays', parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-12 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">days</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LoRA Setup
                  <span className="text-gray-400 font-normal ml-1">(When LoRA required)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={config.loraSetupDays}
                    onChange={(e) => updateConfig('loraSetupDays', parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-12 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">days</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Workflow
                  <span className="text-gray-400 font-normal ml-1">(Advanced)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={config.customWorkflowDays}
                    onChange={(e) => updateConfig('customWorkflowDays', parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-12 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Per-Asset Rates */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <Image className="h-5 w-5 text-gray-400" />
              Asset Production Rates
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Days of effort per single asset (lower = faster production)
            </p>

            <div className="space-y-6">
              {/* Static Assets */}
              <div className="grid grid-cols-2 gap-4">
                <RateInput
                  label="Static Image"
                  description="Images, carousels, static social"
                  value={config.staticImageDays}
                  onChange={(v) => updateConfig('staticImageDays', v)}
                  icon={<Image className="h-4 w-4" />}
                />
                <RateInput
                  label="Animated GIF"
                  description="Short animations, cinemagraphs"
                  value={config.gifDays}
                  onChange={(v) => updateConfig('gifDays', v)}
                  icon={<Sparkles className="h-4 w-4" />}
                />
              </div>

              {/* Video Assets */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Film className="h-4 w-4 text-gray-400" />
                  Video Assets (by duration)
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <RateInput
                    label="Short Video"
                    description="6-15 seconds"
                    value={config.shortVideoDays}
                    onChange={(v) => updateConfig('shortVideoDays', v)}
                  />
                  <RateInput
                    label="Medium Video"
                    description="16-30 seconds"
                    value={config.mediumVideoDays}
                    onChange={(v) => updateConfig('mediumVideoDays', v)}
                  />
                  <RateInput
                    label="Long Video"
                    description="31-60 seconds"
                    value={config.longVideoDays}
                    onChange={(v) => updateConfig('longVideoDays', v)}
                  />
                </div>
              </div>
            </div>

            {/* Quick Reference */}
            <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
              <h4 className="text-sm font-medium text-blue-900 flex items-center gap-2 mb-2">
                <Info className="h-4 w-4" />
                Quick Reference
              </h4>
              <div className="grid grid-cols-5 gap-4 text-sm text-blue-800">
                <div>
                  <div className="font-medium">{Math.round(1 / config.staticImageDays)} statics</div>
                  <div className="text-blue-600">= 1 day</div>
                </div>
                <div>
                  <div className="font-medium">{Math.round(1 / config.gifDays)} GIFs</div>
                  <div className="text-blue-600">= 1 day</div>
                </div>
                <div>
                  <div className="font-medium">{Math.round(1 / config.shortVideoDays)} short videos</div>
                  <div className="text-blue-600">= 1 day</div>
                </div>
                <div>
                  <div className="font-medium">{Math.round(1 / config.mediumVideoDays)} med videos</div>
                  <div className="text-blue-600">= 1 day</div>
                </div>
                <div>
                  <div className="font-medium">{Math.round(1 / config.longVideoDays)} long videos</div>
                  <div className="text-blue-600">= 1 day</div>
                </div>
              </div>
            </div>
          </div>

          {/* Team Allocation */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-400" />
              Team Effort Allocation
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              How production days are distributed across teams (must total 100%)
            </p>

            <div className="grid grid-cols-4 gap-4">
              <PercentInput
                label="Gen Team"
                value={config.genTeamPercent}
                onChange={(v) => updateConfig('genTeamPercent', v)}
                color="purple"
              />
              <PercentInput
                label="Production"
                value={config.productionPercent}
                onChange={(v) => updateConfig('productionPercent', v)}
                color="blue"
              />
              <PercentInput
                label="QC"
                value={config.qcPercent}
                onChange={(v) => updateConfig('qcPercent', v)}
                color="green"
              />
              <PercentInput
                label="Client Review"
                value={config.clientReviewPercent}
                onChange={(v) => updateConfig('clientReviewPercent', v)}
                color="orange"
              />
            </div>

            {/* Total indicator */}
            <div className={`mt-4 flex items-center gap-2 text-sm ${
              Math.abs(teamTotalPercent - 1) < 0.01 ? 'text-green-600' : 'text-red-600'
            }`}>
              {Math.abs(teamTotalPercent - 1) < 0.01 ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              Total: {(teamTotalPercent * 100).toFixed(0)}%
              {Math.abs(teamTotalPercent - 1) >= 0.01 && ' (must equal 100%)'}
            </div>
          </div>

          {/* Example Calculation */}
          <div className="rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 p-6 text-white">
            <h2 className="text-lg font-semibold mb-4">Example Calculation</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Input</h3>
                <ul className="text-sm space-y-1">
                  <li>20 static images/month</li>
                  <li>10 short videos (15s)/month</li>
                  <li>5 long videos (45s)/month</li>
                  <li>LoRA required</li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Output</h3>
                <ul className="text-sm space-y-1">
                  <li>Setup: <span className="font-medium text-blue-400">{config.loraSetupDays} days</span></li>
                  <li>
                    Monthly:{' '}
                    <span className="font-medium text-green-400">
                      {(
                        20 * config.staticImageDays +
                        10 * config.shortVideoDays +
                        5 * config.longVideoDays
                      ).toFixed(1)} days
                    </span>
                  </li>
                  <li className="text-gray-400 text-xs mt-2">
                    (20 x {config.staticImageDays}) + (10 x {config.shortVideoDays}) + (5 x {config.longVideoDays})
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RateInput({
  label,
  description,
  value,
  onChange,
  icon,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
        {icon}
        {label}
      </label>
      <p className="text-xs text-gray-500 mb-2">{description}</p>
      <div className="relative">
        <input
          type="number"
          step="0.01"
          min="0.01"
          max="5"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-20 text-sm focus:border-blue-500 focus:outline-none"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">days/asset</span>
      </div>
    </div>
  );
}

function PercentInput({
  label,
  value,
  onChange,
  color,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  color: 'purple' | 'blue' | 'green' | 'orange';
}) {
  const colorClasses = {
    purple: 'bg-purple-100 border-purple-200',
    blue: 'bg-blue-100 border-blue-200',
    green: 'bg-green-100 border-green-200',
    orange: 'bg-orange-100 border-orange-200',
  };

  return (
    <div className={`rounded-lg p-3 ${colorClasses[color]}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <input
          type="number"
          step="1"
          min="0"
          max="100"
          value={Math.round(value * 100)}
          onChange={(e) => onChange((parseFloat(e.target.value) || 0) / 100)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-8 text-sm focus:border-blue-500 focus:outline-none"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
      </div>
    </div>
  );
}
