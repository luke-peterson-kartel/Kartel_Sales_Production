'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Save, Loader2 } from 'lucide-react';
import { PROJECT_TYPES, PROJECT_STATUSES, FOLDER_PARTITIONS } from '@/lib/constants';

interface Project {
  id: string;
  jobId: string;
  name: string;
  type: string;
  status: string;
  currentPartition: number;
  producer: string | null;
  creativeTeam: string | null;
  loraTeam: string | null;
  genTeam: string | null;
  externalArtists: string | null;
  finalDueDate: Date | null;
  acv: number | null;
  monthlyFee: number | null;
  estimatedMargin: number | null;
}

export default function EditProjectModal({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: project.name,
    type: project.type,
    status: project.status,
    currentPartition: project.currentPartition,
    producer: project.producer || '',
    creativeTeam: project.creativeTeam ? JSON.parse(project.creativeTeam).join(', ') : '',
    loraTeam: project.loraTeam ? JSON.parse(project.loraTeam).join(', ') : '',
    genTeam: project.genTeam ? JSON.parse(project.genTeam).join(', ') : '',
    externalArtists: project.externalArtists ? JSON.parse(project.externalArtists).join(', ') : '',
    finalDueDate: project.finalDueDate
      ? new Date(project.finalDueDate).toISOString().split('T')[0]
      : '',
    acv: project.acv?.toString() || '',
    monthlyFee: project.monthlyFee?.toString() || '',
    estimatedMargin: project.estimatedMargin?.toString() || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          creativeTeam: formData.creativeTeam
            ? formData.creativeTeam.split(',').map((s: string) => s.trim()).filter(Boolean)
            : [],
          loraTeam: formData.loraTeam
            ? formData.loraTeam.split(',').map((s: string) => s.trim()).filter(Boolean)
            : [],
          genTeam: formData.genTeam
            ? formData.genTeam.split(',').map((s: string) => s.trim()).filter(Boolean)
            : [],
          externalArtists: formData.externalArtists
            ? formData.externalArtists.split(',').map((s: string) => s.trim()).filter(Boolean)
            : [],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update project');
      }

      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
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
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Edit Project</h2>
            <p className="text-sm text-gray-500">{project.jobId}</p>
          </div>
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
                Project Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Project Type
                </label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {PROJECT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {PROJECT_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="currentPartition" className="block text-sm font-medium text-gray-700 mb-1">
                Folder Partition
              </label>
              <select
                id="currentPartition"
                value={formData.currentPartition}
                onChange={(e) => setFormData({ ...formData, currentPartition: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {FOLDER_PARTITIONS.map((p) => (
                  <option key={p.number} value={p.number}>
                    #{p.number} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="finalDueDate" className="block text-sm font-medium text-gray-700 mb-1">
                Final Due Date
              </label>
              <input
                type="date"
                id="finalDueDate"
                value={formData.finalDueDate}
                onChange={(e) => setFormData({ ...formData, finalDueDate: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Team */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Team Assignment</h3>

            <div>
              <label htmlFor="producer" className="block text-sm font-medium text-gray-700 mb-1">
                Producer
              </label>
              <input
                type="text"
                id="producer"
                value={formData.producer}
                onChange={(e) => setFormData({ ...formData, producer: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., Veronica"
              />
            </div>

            <div>
              <label htmlFor="creativeTeam" className="block text-sm font-medium text-gray-700 mb-1">
                Creative Team
              </label>
              <input
                type="text"
                id="creativeTeam"
                value={formData.creativeTeam}
                onChange={(e) => setFormData({ ...formData, creativeTeam: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Separate names with commas"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="loraTeam" className="block text-sm font-medium text-gray-700 mb-1">
                  LoRA Team
                </label>
                <input
                  type="text"
                  id="loraTeam"
                  value={formData.loraTeam}
                  onChange={(e) => setFormData({ ...formData, loraTeam: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Separate names with commas"
                />
              </div>

              <div>
                <label htmlFor="genTeam" className="block text-sm font-medium text-gray-700 mb-1">
                  Gen Team
                </label>
                <input
                  type="text"
                  id="genTeam"
                  value={formData.genTeam}
                  onChange={(e) => setFormData({ ...formData, genTeam: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Separate names with commas"
                />
              </div>
            </div>

            <div>
              <label htmlFor="externalArtists" className="block text-sm font-medium text-gray-700 mb-1">
                External Artists
              </label>
              <input
                type="text"
                id="externalArtists"
                value={formData.externalArtists}
                onChange={(e) => setFormData({ ...formData, externalArtists: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Separate names with commas"
              />
            </div>
          </div>

          {/* Financials */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Financials</h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="acv" className="block text-sm font-medium text-gray-700 mb-1">
                  ACV ($)
                </label>
                <input
                  type="number"
                  id="acv"
                  value={formData.acv}
                  onChange={(e) => setFormData({ ...formData, acv: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  min="0"
                  step="1000"
                />
              </div>

              <div>
                <label htmlFor="monthlyFee" className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Fee ($)
                </label>
                <input
                  type="number"
                  id="monthlyFee"
                  value={formData.monthlyFee}
                  onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  min="0"
                  step="100"
                />
              </div>

              <div>
                <label htmlFor="estimatedMargin" className="block text-sm font-medium text-gray-700 mb-1">
                  Est. Margin (%)
                </label>
                <input
                  type="number"
                  id="estimatedMargin"
                  value={formData.estimatedMargin}
                  onChange={(e) => setFormData({ ...formData, estimatedMargin: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  min="0"
                  max="100"
                  step="1"
                />
              </div>
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
