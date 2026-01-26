'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  Mail,
  Loader2,
  Building2,
  FileText,
  Calendar,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { HANDOFF_TYPES } from '@/lib/constants';

// Handoff checklist templates
const HANDOFF_CHECKLISTS: Record<string, Array<{ id: string; label: string; required: boolean }>> = {
  SALES_TO_PRODUCTION: [
    { id: 'sow_signed', label: 'SOW signed and received', required: true },
    { id: 'client_info', label: 'Client company information complete', required: true },
    { id: 'contacts', label: 'Key contacts identified', required: true },
    { id: 'brand_guidelines', label: 'Brand guidelines received', required: false },
    { id: 'deliverables', label: 'Deliverables list confirmed', required: true },
    { id: 'timeline', label: 'Project timeline agreed', required: true },
    { id: 'budget', label: 'Budget confirmed', required: true },
    { id: 'kickoff', label: 'Kickoff meeting scheduled', required: false },
  ],
  PRODUCTION_TO_GENERATIVE: [
    { id: 'brand_assets', label: 'Brand assets uploaded to shared drive', required: true },
    { id: 'style_guide', label: 'Visual style guide created', required: true },
    { id: 'quality_criteria', label: 'Quality criteria documented', required: true },
    { id: 'workflow_specs', label: 'Workflow specifications defined', required: true },
    { id: 'reference_images', label: 'Reference images provided', required: true },
    { id: 'lora_requirements', label: 'LoRA training requirements (if applicable)', required: false },
    { id: 'revision_process', label: 'Revision process explained', required: true },
  ],
  GENERATIVE_TO_PRODUCTION: [
    { id: 'deliverables_qc', label: 'All deliverables passed internal QC', required: true },
    { id: 'file_naming', label: 'File naming convention followed', required: true },
    { id: 'formats_correct', label: 'All formats and sizes correct', required: true },
    { id: 'technical_notes', label: 'Technical notes documented', required: false },
    { id: 'revisions_addressed', label: 'Previous revision feedback addressed', required: true },
    { id: 'uploaded', label: 'Files uploaded to delivery platform', required: true },
  ],
  PRODUCTION_TO_SALES: [
    { id: 'final_deliverables', label: 'Final deliverables approved by client', required: true },
    { id: 'closing_report', label: 'Project closing report complete', required: true },
    { id: 'margin_data', label: 'Margin data calculated', required: true },
    { id: 'case_study', label: 'Case study materials gathered', required: false },
    { id: 'testimonial', label: 'Testimonial requested', required: false },
    { id: 'lessons_learned', label: 'Lessons learned documented', required: false },
    { id: 'renewal_opportunity', label: 'Renewal opportunity assessed', required: true },
  ],
};

interface Handoff {
  id: string;
  handoffNumber: number;
  type: string;
  status: string;
  completedAt: string | null;
  dueAt: string | null;
  isOnTime: boolean | null;
  checklist: string | null;
  transferredItems: string | null;
  notes: string | null;
  emailExported: boolean;
  emailExportedAt: string | null;
  createdAt: string;
  updatedAt: string;
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

export default function HandoffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [handoff, setHandoff] = useState<Handoff | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchHandoff() {
      try {
        const response = await fetch(`/api/handoffs/${id}`);
        if (response.ok) {
          const data = await response.json();
          setHandoff(data);
          setChecklistState(data.checklist ? JSON.parse(data.checklist) : {});
          setNotes(data.notes || '');
        }
      } catch (err) {
        console.error('Error fetching handoff:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHandoff();
  }, [id]);

  const handleChecklistChange = async (itemId: string, checked: boolean) => {
    const newState = { ...checklistState, [itemId]: checked };
    setChecklistState(newState);

    // Save to server
    await fetch(`/api/handoffs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checklist: newState }),
    });
  };

  const handleNotesChange = async () => {
    setSaving(true);
    await fetch(`/api/handoffs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    setSaving(false);
  };

  const handleComplete = async () => {
    setSaving(true);
    const response = await fetch(`/api/handoffs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });

    if (response.ok) {
      router.push(`/projects/${handoff?.project.id}`);
    }
    setSaving(false);
  };

  const generateEmailContent = () => {
    if (!handoff) return '';

    const handoffInfo = HANDOFF_TYPES.find((h) => h.number === handoff.handoffNumber);
    const checklistItems = HANDOFF_CHECKLISTS[handoff.type] || [];

    const completedItems = checklistItems
      .filter((item) => checklistState[item.id])
      .map((item) => `  ✓ ${item.label}`)
      .join('\n');

    const pendingItems = checklistItems
      .filter((item) => !checklistState[item.id] && item.required)
      .map((item) => `  ○ ${item.label} (REQUIRED)`)
      .join('\n');

    return `Subject: [HANDOFF ${handoff.handoffNumber}] ${handoff.project.client.name} - ${handoff.project.name}

Hi Team,

This is the handoff notification for ${handoffInfo?.label}.

PROJECT: ${handoff.project.client.name} - ${handoff.project.name}
JOB ID: ${handoff.project.jobId}
HANDOFF: ${handoffInfo?.label}
STATUS: ${handoff.status}

COMPLETED ITEMS:
${completedItems || '  (none)'}

${pendingItems ? `PENDING REQUIRED ITEMS:\n${pendingItems}\n` : ''}
${handoff.notes ? `NOTES:\n${handoff.notes}\n` : ''}

Please review and confirm receipt.

Best,
[Your Name]`;
  };

  const copyEmail = () => {
    navigator.clipboard.writeText(generateEmailContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!handoff) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h2 className="mt-4 text-lg font-medium text-gray-900">Handoff not found</h2>
        <Link href="/projects" className="mt-2 text-blue-600 hover:underline">
          Back to Projects
        </Link>
      </div>
    );
  }

  const handoffInfo = HANDOFF_TYPES.find((h) => h.number === handoff.handoffNumber);
  const checklistItems = HANDOFF_CHECKLISTS[handoff.type] || [];
  const requiredItems = checklistItems.filter((item) => item.required);
  const completedRequired = requiredItems.filter((item) => checklistState[item.id]).length;
  const allRequiredComplete = completedRequired === requiredItems.length;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/projects/${handoff.project.id}`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Project
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
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
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{handoffInfo?.label}</h1>
                <div className="flex items-center gap-3 text-gray-500">
                  <span className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {handoff.project.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {handoff.project.client.name}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <HandoffStatusBadge status={handoff.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Gate Checklist
              </h2>
              <span className="text-sm text-gray-500">
                {completedRequired}/{requiredItems.length} required items complete
              </span>
            </div>

            <div className="h-2 bg-gray-200 rounded-full mb-6">
              <div
                className={`h-2 rounded-full transition-all ${
                  allRequiredComplete ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{
                  width: `${requiredItems.length > 0 ? (completedRequired / requiredItems.length) * 100 : 0}%`,
                }}
              />
            </div>

            <div className="space-y-3">
              {checklistItems.map((item) => (
                <label
                  key={item.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                    ${checklistState[item.id]
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }
                    ${handoff.status === 'COMPLETED' ? 'pointer-events-none opacity-75' : ''}
                  `}
                >
                  <input
                    type="checkbox"
                    checked={checklistState[item.id] || false}
                    onChange={(e) => handleChecklistChange(item.id, e.target.checked)}
                    disabled={handoff.status === 'COMPLETED'}
                    className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span
                    className={`flex-1 ${
                      checklistState[item.id] ? 'text-green-700' : 'text-gray-700'
                    }`}
                  >
                    {item.label}
                  </span>
                  {item.required && (
                    <span className="text-xs font-medium text-red-500">Required</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesChange}
              disabled={handoff.status === 'COMPLETED'}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-50"
              placeholder="Add any notes about this handoff..."
            />
          </div>

          {/* Email Export */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Mail className="h-5 w-5 text-gray-400" />
                Email Template
              </h2>
              <button
                onClick={copyEmail}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Email
                  </>
                )}
              </button>
            </div>
            <pre className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap font-mono overflow-x-auto">
              {generateEmailContent()}
            </pre>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Timing</span>
                <span className="text-gray-900">{handoffInfo?.timing}</span>
              </div>
              {handoff.dueAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Due</span>
                  <span className="text-gray-900">
                    {new Date(handoff.dueAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {handoff.completedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Completed</span>
                  <span className="text-gray-900">
                    {new Date(handoff.completedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {handoff.isOnTime !== null && (
                <div className="flex justify-between">
                  <span className="text-gray-500">On Time</span>
                  <span
                    className={handoff.isOnTime ? 'text-green-600' : 'text-red-600'}
                  >
                    {handoff.isOnTime ? 'Yes' : 'No'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-900">
                  {new Date(handoff.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Updated</span>
                <span className="text-gray-900">
                  {new Date(handoff.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Complete Button */}
          {handoff.status !== 'COMPLETED' && (
            <div className="rounded-xl bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
              <h3 className="font-semibold mb-2">Complete Handoff</h3>
              <p className="text-sm text-green-100 mb-4">
                {allRequiredComplete
                  ? 'All required items are checked. Ready to complete!'
                  : `${requiredItems.length - completedRequired} required items remaining.`}
              </p>
              <button
                onClick={handleComplete}
                disabled={!allRequiredComplete || saving}
                className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Completing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Mark as Complete
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Navigation */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Navigation</h3>
            <div className="space-y-2">
              <Link
                href={`/projects/${handoff.project.id}`}
                className="block w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-center text-gray-700 hover:bg-gray-50"
              >
                View Project
              </Link>
              <Link
                href={`/clients/${handoff.project.client.id}`}
                className="block w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-center text-gray-700 hover:bg-gray-50"
              >
                View Client
              </Link>
            </div>
          </div>
        </div>
      </div>
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
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${className}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </span>
  );
}
