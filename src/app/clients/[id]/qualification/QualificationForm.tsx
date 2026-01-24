'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Save,
  Phone,
  Target,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { QUALIFICATION_CALLS } from '@/lib/constants';

interface QualificationCall {
  id: string;
  callNumber: number;
  callType: string;
  completed: boolean;
  completedAt: Date | null;
  gateCriteria: string | null;
  gateCleared: boolean;
  notes: string | null;
  discoveryAnswers: string | null;
}

interface Client {
  id: string;
  name: string;
  vertical: string;
  classification: string;
}

interface Props {
  client: Client;
  existingCalls: QualificationCall[];
  missingCallNumbers: number[];
}

// Gate criteria for each call
const GATE_CRITERIA = {
  1: [
    { id: 'need_timeline', label: 'Defined need and timeline?' },
    { id: 'budget_dm', label: 'Budget authority or DM access?' },
    { id: 'system_or_project', label: 'System or Project opportunity?' },
    { id: 'urgency', label: 'Urgency or triggering event?' },
  ],
  2: [
    { id: 'dm_confirmed', label: 'Decision-maker confirmed and engaged?' },
    { id: 'need_validated', label: 'Need and ability to pay validated?' },
    { id: 'success_criteria', label: 'Success criteria clear?' },
    { id: 'poc_decision', label: 'POC decision made?' },
  ],
  3: [
    { id: 'proposal_info', label: 'All proposal info captured?' },
    { id: 'budget_alignment', label: 'Budget alignment confirmed?' },
    { id: 'special_considerations', label: 'Special considerations understood?' },
    { id: 'call4_proposal', label: 'Call #4 = proposal presentation?' },
  ],
  4: [
    { id: 'all_covered', label: 'All elements covered, no surprises?' },
    { id: 'client_articulate', label: 'Client can articulate the deal back?' },
    { id: 'concerns_addressed', label: 'All concerns raised and addressed?' },
    { id: 'path_to_signature', label: 'Clear path to signature?' },
  ],
};

export default function QualificationForm({
  client,
  existingCalls,
  missingCallNumbers,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expandedCall, setExpandedCall] = useState<number | null>(null);
  const [saving, setSaving] = useState<number | null>(null);

  // Merge existing calls with call info
  const calls = QUALIFICATION_CALLS.map(callInfo => {
    const existing = existingCalls.find(c => c.callNumber === callInfo.number);
    return {
      ...callInfo,
      id: existing?.id || null,
      completed: existing?.completed || false,
      completedAt: existing?.completedAt || null,
      gateCriteria: existing?.gateCriteria ? JSON.parse(existing.gateCriteria) : {},
      gateCleared: existing?.gateCleared || false,
      notes: existing?.notes || '',
      discoveryAnswers: existing?.discoveryAnswers ? JSON.parse(existing.discoveryAnswers) : {},
    };
  });

  // Local state for form data
  const [formData, setFormData] = useState<Record<number, {
    notes: string;
    gateCriteria: Record<string, boolean>;
    gateCleared: boolean;
  }>>(
    Object.fromEntries(
      calls.map(c => [c.number, {
        notes: c.notes,
        gateCriteria: c.gateCriteria,
        gateCleared: c.gateCleared,
      }])
    )
  );

  const toggleExpand = (callNumber: number) => {
    setExpandedCall(expandedCall === callNumber ? null : callNumber);
  };

  const updateGateCriteria = (callNumber: number, criteriaId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [callNumber]: {
        ...prev[callNumber],
        gateCriteria: {
          ...prev[callNumber].gateCriteria,
          [criteriaId]: checked,
        },
      },
    }));
  };

  const updateNotes = (callNumber: number, notes: string) => {
    setFormData(prev => ({
      ...prev,
      [callNumber]: {
        ...prev[callNumber],
        notes,
      },
    }));
  };

  const saveCall = async (callNumber: number, completed: boolean) => {
    setSaving(callNumber);
    const data = formData[callNumber];
    const criteria = GATE_CRITERIA[callNumber as keyof typeof GATE_CRITERIA];
    const allGatesCleared = criteria.every(c => data.gateCriteria[c.id]);

    try {
      const response = await fetch(`/api/clients/${client.id}/qualification/${callNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completed,
          notes: data.notes,
          gateCriteria: data.gateCriteria,
          gateCleared: allGatesCleared,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error('Error saving call:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(null);
    }
  };

  const getCallStatusColor = (call: typeof calls[0]) => {
    if (call.completed && call.gateCleared) return 'border-green-500 bg-green-50';
    if (call.completed) return 'border-yellow-500 bg-yellow-50';
    return 'border-gray-200 bg-white';
  };

  const getPreviousCallsCompleted = (callNumber: number) => {
    return calls.slice(0, callNumber - 1).every(c => c.completed);
  };

  return (
    <div className="space-y-4">
      {calls.map((call) => {
        const isExpanded = expandedCall === call.number;
        const criteria = GATE_CRITERIA[call.number as keyof typeof GATE_CRITERIA];
        const data = formData[call.number];
        const checkedCount = criteria.filter(c => data.gateCriteria[c.id]).length;
        const canStart = getPreviousCallsCompleted(call.number);

        return (
          <div
            key={call.number}
            className={`rounded-xl border-2 transition-all ${getCallStatusColor(call)}`}
          >
            {/* Header */}
            <button
              onClick={() => toggleExpand(call.number)}
              className="w-full px-6 py-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    call.completed
                      ? 'bg-green-500 text-white'
                      : canStart
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {call.completed ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <span className="text-xl font-bold">{call.number}</span>
                  )}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{call.label}</span>
                    {!canStart && call.number > 1 && (
                      <span className="text-xs text-gray-400">(Complete previous call first)</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">{call.day} - {call.goal}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Gate progress */}
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-700">
                    Gates: {checkedCount}/{criteria.length}
                  </div>
                  {call.completed && (
                    <div className="text-xs text-gray-500">
                      {call.completedAt
                        ? (call.completedAt instanceof Date
                            ? call.completedAt.toLocaleDateString()
                            : new Date(call.completedAt).toLocaleDateString())
                        : 'Completed'}
                    </div>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t border-gray-200 px-6 py-4 space-y-6">
                {/* Gate Criteria */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Gate Criteria
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {criteria.map((criterion) => (
                      <label
                        key={criterion.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          data.gateCriteria[criterion.id]
                            ? 'border-green-300 bg-green-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={data.gateCriteria[criterion.id] || false}
                          onChange={(e) =>
                            updateGateCriteria(call.number, criterion.id, e.target.checked)
                          }
                          className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700">{criterion.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Call Notes
                  </h3>
                  <textarea
                    value={data.notes}
                    onChange={(e) => updateNotes(call.number, e.target.value)}
                    placeholder="Record key takeaways, action items, and follow-up needed..."
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Warning if gates not cleared */}
                {checkedCount < criteria.length && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        {criteria.length - checkedCount} gate criteria remaining
                      </p>
                      <p className="text-sm text-yellow-700">
                        You can still mark the call as complete, but all gates should be cleared before progressing.
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <button
                    onClick={() => saveCall(call.number, false)}
                    disabled={saving === call.number || !canStart}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    Save Progress
                  </button>

                  <div className="flex items-center gap-3">
                    {call.completed ? (
                      <button
                        onClick={() => saveCall(call.number, false)}
                        disabled={saving === call.number}
                        className="inline-flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-700 hover:bg-yellow-100 disabled:opacity-50"
                      >
                        Reopen Call
                      </button>
                    ) : (
                      <button
                        onClick={() => saveCall(call.number, true)}
                        disabled={saving === call.number || !canStart}
                        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {saving === call.number ? (
                          <>
                            <span className="animate-spin">⏳</span>
                            Saving...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Mark Call Complete
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Classification Section */}
      <div className="mt-8 rounded-xl bg-white border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Opportunity Classification
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div
            className={`p-4 rounded-lg border-2 ${
              client.classification === 'SYSTEM'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200'
            }`}
          >
            <h3 className="font-semibold text-gray-900">System Deal</h3>
            <p className="text-sm text-gray-500">
              Ongoing creative infrastructure with 12+ month commitment
            </p>
          </div>
          <div
            className={`p-4 rounded-lg border-2 ${
              client.classification === 'PROJECT'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200'
            }`}
          >
            <h3 className="font-semibold text-gray-900">Project Deal</h3>
            <p className="text-sm text-gray-500">
              One-time campaign with beachhead potential
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Classification is set from the client details page. Use the qualification calls to determine the appropriate classification.
        </p>
      </div>
    </div>
  );
}
