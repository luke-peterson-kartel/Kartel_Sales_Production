'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Globe,
  Tag,
  CheckSquare,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import { VERTICALS } from '@/lib/constants';
import {
  SALES_STAGE_LABELS,
  SALES_STAGE_COLORS,
  SALES_STAGES,
  SALES_OWNERS,
  formatDealValue,
  parseDealValue,
  SalesStage,
} from '@/lib/constants/sales-stages';

interface Client {
  id: string;
  name: string;
  website: string | null;
  vertical: string;
  classification: string;
  qualified: boolean;
  dealOwner: string | null;
  salesStage: string | null;
  dealValue: number | null;
  nextStepNotes: string | null;
  lastImportedAt: Date | null;
  _count: {
    projects: number;
    salesTasks: number;
  };
}

interface ClientsTableProps {
  clients: Client[];
}

type SortField = 'name' | 'vertical' | 'dealValue' | 'salesStage' | 'dealOwner' | 'tasks';
type SortDirection = 'asc' | 'desc';

export default function ClientsTable({ clients }: ClientsTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [verticalFilter, setVerticalFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ clientId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Filter and sort clients
  const filteredClients = useMemo(() => {
    let result = [...clients];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          c.website?.toLowerCase().includes(searchLower) ||
          c.dealOwner?.toLowerCase().includes(searchLower)
      );
    }

    // Vertical filter
    if (verticalFilter) {
      result = result.filter((c) => c.vertical === verticalFilter);
    }

    // Stage filter
    if (stageFilter) {
      result = result.filter((c) => c.salesStage === stageFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'vertical':
          comparison = a.vertical.localeCompare(b.vertical);
          break;
        case 'dealValue':
          comparison = (a.dealValue || 0) - (b.dealValue || 0);
          break;
        case 'salesStage':
          comparison = (a.salesStage || '').localeCompare(b.salesStage || '');
          break;
        case 'dealOwner':
          comparison = (a.dealOwner || '').localeCompare(b.dealOwner || '');
          break;
        case 'tasks':
          comparison = a._count.salesTasks - b._count.salesTasks;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [clients, search, verticalFilter, stageFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4 text-blue-600" />
    ) : (
      <ChevronDown className="h-4 w-4 text-blue-600" />
    );
  };

  const startEditing = (clientId: string, field: string, currentValue: string | null) => {
    setEditingCell({ clientId, field });
    setEditValue(currentValue || '');
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const saveEdit = async (clientId: string, field: string, value: string) => {
    setIsSaving(true);

    try {
      const updateData: Record<string, unknown> = {};

      if (field === 'dealValue') {
        // Parse value like "$1.2M" or "1200000"
        const parsed = parseDealValue(value);
        updateData.dealValue = parsed;
      } else {
        updateData[field] = value || null;
      }

      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) throw new Error('Failed to save');

      router.refresh();
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, clientId: string, field: string) => {
    if (e.key === 'Enter') {
      saveEdit(clientId, field, editValue);
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={verticalFilter}
          onChange={(e) => setVerticalFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Verticals</option>
          {VERTICALS.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Stages</option>
          {Object.entries(SALES_STAGE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500">
        Showing {filteredClients.length} of {clients.length} clients
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  Client
                  <SortIcon field="name" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('vertical')}
              >
                <div className="flex items-center gap-1">
                  Vertical
                  <SortIcon field="vertical" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('dealValue')}
              >
                <div className="flex items-center gap-1">
                  Value
                  <SortIcon field="dealValue" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('salesStage')}
              >
                <div className="flex items-center gap-1">
                  Stage
                  <SortIcon field="salesStage" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('dealOwner')}
              >
                <div className="flex items-center gap-1">
                  Owner
                  <SortIcon field="dealOwner" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('tasks')}
              >
                <div className="flex items-center gap-1">
                  Tasks
                  <SortIcon field="tasks" />
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredClients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                {/* Client Name - Not editable */}
                <td className="whitespace-nowrap px-6 py-4">
                  <Link href={`/clients/${client.id}`} className="block">
                    <div className="font-medium text-gray-900">{client.name}</div>
                    {client.website && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Globe className="h-3 w-3" />
                        {client.website}
                      </div>
                    )}
                  </Link>
                </td>

                {/* Vertical - Editable dropdown */}
                <td className="whitespace-nowrap px-6 py-4">
                  {editingCell?.clientId === client.id && editingCell?.field === 'vertical' ? (
                    <div className="flex items-center gap-1">
                      <select
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, client.id, 'vertical')}
                        autoFocus
                        className="rounded border border-blue-500 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        disabled={isSaving}
                      >
                        {VERTICALS.map((v) => (
                          <option key={v.value} value={v.value}>
                            {v.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => saveEdit(client.id, 'vertical', editValue)}
                        disabled={isSaving}
                        className="p-1 text-green-600 hover:text-green-700"
                      >
                        {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      </button>
                      <button
                        onClick={cancelEditing}
                        disabled={isSaving}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditing(client.id, 'vertical', client.vertical)}
                      className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      <Tag className="h-3 w-3" />
                      {VERTICALS.find((v) => v.value === client.vertical)?.label || client.vertical}
                    </button>
                  )}
                </td>

                {/* Value - Editable input */}
                <td className="whitespace-nowrap px-6 py-4">
                  {editingCell?.clientId === client.id && editingCell?.field === 'dealValue' ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, client.id, 'dealValue')}
                        placeholder="$500K"
                        autoFocus
                        className="w-20 rounded border border-blue-500 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        disabled={isSaving}
                      />
                      <button
                        onClick={() => saveEdit(client.id, 'dealValue', editValue)}
                        disabled={isSaving}
                        className="p-1 text-green-600 hover:text-green-700"
                      >
                        {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      </button>
                      <button
                        onClick={cancelEditing}
                        disabled={isSaving}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        startEditing(client.id, 'dealValue', client.dealValue ? formatDealValue(client.dealValue) : '')
                      }
                      className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {client.dealValue ? formatDealValue(client.dealValue) : <span className="text-gray-400">—</span>}
                    </button>
                  )}
                </td>

                {/* Stage - Editable dropdown */}
                <td className="whitespace-nowrap px-6 py-4">
                  {editingCell?.clientId === client.id && editingCell?.field === 'salesStage' ? (
                    <div className="flex items-center gap-1">
                      <select
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, client.id, 'salesStage')}
                        autoFocus
                        className="rounded border border-blue-500 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        disabled={isSaving}
                      >
                        <option value="">— None —</option>
                        {Object.entries(SALES_STAGE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => saveEdit(client.id, 'salesStage', editValue)}
                        disabled={isSaving}
                        className="p-1 text-green-600 hover:text-green-700"
                      >
                        {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      </button>
                      <button
                        onClick={cancelEditing}
                        disabled={isSaving}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditing(client.id, 'salesStage', client.salesStage)}
                      className="hover:opacity-80 transition-opacity"
                    >
                      <SalesStageBadge stage={client.salesStage as SalesStage | null} />
                    </button>
                  )}
                </td>

                {/* Owner - Editable dropdown */}
                <td className="whitespace-nowrap px-6 py-4">
                  {editingCell?.clientId === client.id && editingCell?.field === 'dealOwner' ? (
                    <div className="flex items-center gap-1">
                      <select
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, client.id, 'dealOwner')}
                        autoFocus
                        className="rounded border border-blue-500 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        disabled={isSaving}
                      >
                        <option value="">— Unassigned —</option>
                        {SALES_OWNERS.map((owner) => (
                          <option key={owner} value={owner}>
                            {owner}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => saveEdit(client.id, 'dealOwner', editValue)}
                        disabled={isSaving}
                        className="p-1 text-green-600 hover:text-green-700"
                      >
                        {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      </button>
                      <button
                        onClick={cancelEditing}
                        disabled={isSaving}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditing(client.id, 'dealOwner', client.dealOwner)}
                      className="text-sm text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {client.dealOwner || <span className="text-gray-400">—</span>}
                    </button>
                  )}
                </td>

                {/* Tasks - Not editable */}
                <td className="whitespace-nowrap px-6 py-4">
                  <TaskCountBadge count={client._count.salesTasks} />
                </td>

                {/* Actions */}
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                  <Link href={`/clients/${client.id}`} className="text-blue-600 hover:text-blue-700">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredClients.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            <p>No clients match your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SalesStageBadge({ stage }: { stage: SalesStage | null }) {
  if (!stage) {
    return <span className="text-gray-400">—</span>;
  }

  const label = SALES_STAGE_LABELS[stage] || stage;
  const colorClass = SALES_STAGE_COLORS[stage] || 'bg-gray-100 text-gray-700';

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
}

function TaskCountBadge({ count }: { count: number }) {
  if (count === 0) {
    return <span className="text-gray-400">—</span>;
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
      <CheckSquare className="h-3 w-3" />
      {count} task{count !== 1 ? 's' : ''}
    </span>
  );
}
