'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Plus,
  Loader2,
  CheckCircle2,
  Clock,
  Circle,
  Building2,
  FileText,
  Calendar,
} from 'lucide-react';
import { HANDOFF_TYPES } from '@/lib/constants';

interface Handoff {
  id: string;
  handoffNumber: number;
  type: string;
  status: string;
  completedAt: string | null;
  dueAt: string | null;
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

export default function HandoffsPage() {
  const [handoffs, setHandoffs] = useState<Handoff[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');

  useEffect(() => {
    async function fetchHandoffs() {
      try {
        const response = await fetch('/api/handoffs');
        if (response.ok) {
          const data = await response.json();
          setHandoffs(data);
        }
      } catch (err) {
        console.error('Error fetching handoffs:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHandoffs();
  }, []);

  const filteredHandoffs = handoffs.filter((h) => {
    if (filter === 'all') return true;
    return h.status === filter.toUpperCase();
  });

  const statusCounts = {
    all: handoffs.length,
    pending: handoffs.filter((h) => h.status === 'PENDING').length,
    in_progress: handoffs.filter((h) => h.status === 'IN_PROGRESS').length,
    completed: handoffs.filter((h) => h.status === 'COMPLETED').length,
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Handoffs</h1>
          <p className="mt-1 text-gray-500">
            Track work transfers between teams
          </p>
        </div>
        <Link
          href="/handoffs/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New Handoff
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {(['all', 'pending', 'in_progress', 'completed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {status === 'all' ? 'All' : status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
            <span className="ml-2 text-xs opacity-75">({statusCounts[status]})</span>
          </button>
        ))}
      </div>

      {/* Handoffs List */}
      {filteredHandoffs.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <ArrowRight className="mx-auto h-12 w-12 text-gray-300" />
          <h2 className="mt-4 text-lg font-medium text-gray-900">No handoffs found</h2>
          <p className="mt-2 text-gray-500">
            {filter === 'all'
              ? 'Create your first handoff to get started.'
              : `No ${filter.replace('_', ' ')} handoffs.`}
          </p>
          <Link
            href="/handoffs/new"
            className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:underline"
          >
            <Plus className="h-4 w-4" />
            Create Handoff
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHandoffs.map((handoff) => {
            const handoffInfo = HANDOFF_TYPES.find((h) => h.number === handoff.handoffNumber);
            return (
              <Link
                key={handoff.id}
                href={`/handoffs/${handoff.id}`}
                className="block rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  {/* Handoff Number Badge */}
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full text-white font-bold ${
                      handoff.status === 'COMPLETED'
                        ? 'bg-green-500'
                        : handoff.status === 'IN_PROGRESS'
                        ? 'bg-blue-500'
                        : 'bg-gray-400'
                    }`}
                  >
                    {handoff.status === 'COMPLETED' ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      handoff.handoffNumber
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {handoffInfo?.label}
                      </h3>
                      <HandoffStatusBadge status={handoff.status} />
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1 truncate">
                        <Building2 className="h-4 w-4 flex-shrink-0" />
                        {handoff.project.client.name}
                      </span>
                      <span className="flex items-center gap-1 truncate">
                        <FileText className="h-4 w-4 flex-shrink-0" />
                        {handoff.project.name}
                      </span>
                      {handoff.dueAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          Due {new Date(handoff.dueAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HandoffStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
    PENDING: {
      label: 'Pending',
      icon: Circle,
      className: 'bg-gray-100 text-gray-700',
    },
    IN_PROGRESS: {
      label: 'In Progress',
      icon: Clock,
      className: 'bg-blue-100 text-blue-700',
    },
    COMPLETED: {
      label: 'Completed',
      icon: CheckCircle2,
      className: 'bg-green-100 text-green-700',
    },
  };

  const { label, icon: Icon, className } = config[status] || config.PENDING;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
