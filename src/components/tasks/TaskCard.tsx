'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  User,
  ChevronDown,
  Check,
  Circle,
  Loader2,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import { SALES_OWNERS } from '@/lib/constants/sales-stages';

interface Task {
  id: string;
  description: string;
  dueDate: string | null;
  status: string;
  completed: boolean;
  completedAt: string | null;
  owner: string | null;
  isOverdue: boolean;
  priority: string;
  updatedAt: string;
}

interface TaskCardProps {
  task: Task;
  onUpdate?: () => void;
}

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Open', color: 'bg-gray-100 text-gray-700', icon: Circle },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: Clock },
  { value: 'COMPLETED', label: 'Completed', color: 'bg-green-100 text-green-700', icon: Check },
];

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function TaskCard({ task, onUpdate }: TaskCardProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentStatus = STATUS_OPTIONS.find(s => s.value === task.status) || STATUS_OPTIONS[0];
  const StatusIcon = currentStatus.icon;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';

  const handleStatusChange = async (newStatus: string) => {
    setShowStatusDropdown(false);
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update task');

      router.refresh();
      onUpdate?.();
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOwnerChange = async (newOwner: string | null) => {
    setShowOwnerDropdown(false);
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner: newOwner }),
      });

      if (!response.ok) throw new Error('Failed to update task');

      router.refresh();
      onUpdate?.();
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete task');

      router.refresh();
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={`rounded-lg border p-4 ${task.status === 'COMPLETED' ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'}`}>
      <div className="flex items-start justify-between gap-3">
        {/* Task description */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${task.status === 'COMPLETED' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
            {task.description}
          </p>

          {/* Metadata row */}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            {/* Due date */}
            {task.dueDate && (
              <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                {isOverdue && <AlertTriangle className="h-3 w-3" />}
                <Calendar className="h-3 w-3" />
                {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}

            {/* Owner dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowOwnerDropdown(!showOwnerDropdown)}
                className="flex items-center gap-1 hover:text-gray-700"
                disabled={isUpdating}
              >
                <User className="h-3 w-3" />
                <span>{task.owner || 'Unassigned'}</span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {showOwnerDropdown && (
                <div className="absolute left-0 top-full mt-1 z-10 w-32 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    <button
                      onClick={() => handleOwnerChange(null)}
                      className="block w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100"
                    >
                      Unassigned
                    </button>
                    {SALES_OWNERS.map((owner) => (
                      <button
                        key={owner}
                        onClick={() => handleOwnerChange(owner)}
                        className="block w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100"
                      >
                        {owner}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Updated timestamp */}
            <span className="text-gray-400">
              Updated {formatTimeAgo(task.updatedAt)}
            </span>
          </div>
        </div>

        {/* Right side: Status dropdown and delete */}
        <div className="flex items-center gap-2">
          {/* Status dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${currentStatus.color}`}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <StatusIcon className="h-3 w-3" />
              )}
              <span>{currentStatus.label}</span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {showStatusDropdown && (
              <div className="absolute right-0 top-full mt-1 z-10 w-36 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                <div className="py-1">
                  {STATUS_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleStatusChange(option.value)}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-gray-100 ${
                          option.value === task.status ? 'bg-gray-50' : ''
                        }`}
                      >
                        <Icon className="h-3 w-3" />
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Delete button */}
          <button
            onClick={handleDelete}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            disabled={isDeleting}
            title="Delete task"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
