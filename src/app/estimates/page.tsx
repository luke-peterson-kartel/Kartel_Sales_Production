'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Loader2,
  Calculator,
  Building2,
  FileText,
  Calendar,
  ArrowRight,
  Package,
  Clock,
  Sparkles,
  Settings,
} from 'lucide-react';

interface Estimate {
  id: string;
  totalAssets: number;
  setupDays: number;
  monthlyProductionDays: number;
  requiresLoRA: boolean;
  projectType: string;
  createdAt: string;
  project: {
    id: string;
    name: string;
    jobId: string;
    client: {
      id: string;
      name: string;
    };
  };
}

export default function EstimatesPage() {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEstimates() {
      try {
        const response = await fetch('/api/estimates');
        if (response.ok) {
          const data = await response.json();
          setEstimates(data);
        }
      } catch (err) {
        console.error('Error fetching estimates:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchEstimates();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Estimates</h1>
          <p className="mt-1 text-gray-500">
            Project effort calculations and scoping
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/settings/estimation"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Settings className="h-4 w-4" />
            Calculation Settings
          </Link>
          <Link
            href="/estimates/from-request"
            className="inline-flex items-center gap-2 rounded-lg border border-purple-300 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100"
          >
            <Sparkles className="h-4 w-4" />
            Parse Client Request
          </Link>
          <Link
            href="/estimates/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New Estimate
          </Link>
        </div>
      </div>

      {/* Estimates List */}
      {estimates.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <Calculator className="mx-auto h-12 w-12 text-gray-300" />
          <h2 className="mt-4 text-lg font-medium text-gray-900">No estimates yet</h2>
          <p className="mt-2 text-gray-500">
            Create your first estimate to calculate project effort.
          </p>
          <Link
            href="/estimates/new"
            className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:underline"
          >
            <Plus className="h-4 w-4" />
            Create Estimate
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {estimates.map((estimate) => (
            <Link
              key={estimate.id}
              href={`/estimates/${estimate.id}`}
              className="block rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    estimate.projectType === 'ADVANCED'
                      ? 'bg-purple-100 text-purple-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}
                >
                  <Calculator className="h-6 w-6" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {estimate.project.name}
                    </h3>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        estimate.projectType === 'ADVANCED'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {estimate.projectType}
                    </span>
                    {estimate.requiresLoRA && (
                      <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                        LoRA
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1 truncate">
                      <Building2 className="h-4 w-4 flex-shrink-0" />
                      {estimate.project.client.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="h-4 w-4 flex-shrink-0" />
                      {estimate.totalAssets} assets
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      {estimate.setupDays} setup + {estimate.monthlyProductionDays.toFixed(1)}/mo
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      {new Date(estimate.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
