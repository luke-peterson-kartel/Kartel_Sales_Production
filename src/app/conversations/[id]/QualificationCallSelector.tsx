'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Phone,
  Link as LinkIcon,
  X,
  ChevronDown,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { QUALIFICATION_CALLS } from '@/lib/constants';

interface QualificationCall {
  id: string;
  callNumber: number;
  callType: string;
  completed: boolean;
  completedAt: string | null;
}

interface CurrentCall {
  id: string;
  callNumber: number;
  callType: string;
}

interface QualificationCallSelectorProps {
  conversationId: string;
  clientId: string | null;
  currentCalls: CurrentCall[];
}

export default function QualificationCallSelector({
  conversationId,
  clientId,
  currentCalls,
}: QualificationCallSelectorProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calls, setCalls] = useState<QualificationCall[]>([]);
  const [loadingCalls, setLoadingCalls] = useState(false);

  // Fetch qualification calls when dropdown opens and clientId exists
  useEffect(() => {
    if (isOpen && clientId && calls.length === 0) {
      fetchCalls();
    }
  }, [isOpen, clientId]);

  const fetchCalls = async () => {
    if (!clientId) return;

    setLoadingCalls(true);
    try {
      const response = await fetch(`/api/clients/${clientId}/qualification`);
      if (response.ok) {
        const data = await response.json();
        setCalls(data);
      }
    } catch (error) {
      console.error('Error fetching qualification calls:', error);
    } finally {
      setLoadingCalls(false);
    }
  };

  const updateLinkedCalls = async (callIds: string[]) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qualificationCallIds: callIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to update links');
      }

      router.refresh();
    } catch (error) {
      console.error('Error updating qualification call links:', error);
      alert('Failed to update links. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCall = async (callId: string) => {
    const currentIds = currentCalls.map(c => c.id);
    const isCurrentlyLinked = currentIds.includes(callId);

    const newIds = isCurrentlyLinked
      ? currentIds.filter(id => id !== callId)
      : [...currentIds, callId];

    await updateLinkedCalls(newIds);
  };

  const unlinkCall = async (callId: string) => {
    const newIds = currentCalls.filter(c => c.id !== callId).map(c => c.id);
    await updateLinkedCalls(newIds);
  };

  const getCallLabel = (callNumber: number) => {
    const call = QUALIFICATION_CALLS.find(c => c.number === callNumber);
    return call?.label || `Call ${callNumber}`;
  };

  // If no client is linked, show a message
  if (!clientId) {
    return (
      <div className="text-sm text-gray-500 flex items-center gap-2">
        <Phone className="h-4 w-4" />
        <span>Link to a client first to add to qualification calls</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Current State Display */}
      <div className="flex flex-wrap items-center gap-2">
        {currentCalls.length > 0 ? (
          <>
            {currentCalls.map((call) => (
              <div
                key={call.id}
                className="inline-flex items-center gap-2 rounded-lg bg-purple-50 border border-purple-200 px-3 py-2 text-sm text-purple-700"
              >
                <Phone className="h-4 w-4" />
                <span>Call {call.callNumber}: {getCallLabel(call.callNumber)}</span>
                <button
                  onClick={() => unlinkCall(call.id)}
                  disabled={loading}
                  className="ml-1 hover:bg-purple-200 rounded p-0.5 disabled:opacity-50"
                  title="Remove from this call"
                >
                  {loading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                </button>
              </div>
            ))}
          </>
        ) : null}

        {/* Add button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          <LinkIcon className="h-4 w-4" />
          {currentCalls.length === 0 ? 'Link to Qualification Calls' : 'Add More'}
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 rounded-lg bg-white border border-gray-200 shadow-lg z-50">
          <div className="p-3 border-b border-gray-100">
            <h4 className="text-sm font-medium text-gray-900">Select Qualification Calls</h4>
            <p className="text-xs text-gray-500 mt-1">
              Link this conversation to qualification stages
            </p>
          </div>

          {loadingCalls ? (
            <div className="p-4 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : calls.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500">
                No qualification calls found. Start the qualification process from the client page.
              </p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {calls.map((call) => {
                const isLinked = currentCalls.some(c => c.id === call.id);
                return (
                  <button
                    key={call.id}
                    onClick={() => toggleCall(call.id)}
                    disabled={loading}
                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors disabled:opacity-50 border-b border-gray-100 last:border-0 ${
                      isLinked ? 'bg-purple-50' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded border shrink-0 ${
                        isLinked
                          ? 'bg-purple-600 border-purple-600'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isLinked && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                    </div>

                    {/* Call number indicator */}
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${
                        call.completed
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {call.completed ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <span className="text-sm font-medium">{call.callNumber}</span>
                      )}
                    </div>

                    {/* Call details */}
                    <div className="text-left flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        Call {call.callNumber}: {getCallLabel(call.callNumber)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {call.completed
                          ? `Completed ${call.completedAt ? new Date(call.completedAt).toLocaleDateString() : ''}`
                          : 'Not completed'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="p-2 border-t border-gray-100">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
