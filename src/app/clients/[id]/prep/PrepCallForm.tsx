'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Globe,
  Lightbulb,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ChevronDown,
  ChevronUp,
  Printer,
  Building2,
  Target,
  Users,
  DollarSign,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  VerticalContent,
  UNIVERSAL_DISCOVERY_QUESTIONS,
  PRE_CALL_RED_FLAGS
} from '@/lib/verticals';
import { QUALIFICATION_CALLS } from '@/lib/constants';

interface Client {
  id: string;
  name: string;
  website: string | null;
  vertical: string;
  notes: string | null;
  redFlags: string | null;
}

interface PrepCallFormProps {
  client: Client;
  verticalContent: VerticalContent | null;
  nextCallNumber: number;
}

export default function PrepCallForm({
  client,
  verticalContent,
  nextCallNumber,
}: PrepCallFormProps) {
  const [websiteNotes, setWebsiteNotes] = useState('');
  const [selectedRedFlags, setSelectedRedFlags] = useState<string[]>(
    client.redFlags ? JSON.parse(client.redFlags) : []
  );
  const [prepNotes, setPrepNotes] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    talkingPoints: true,
    discovery: true,
    redFlags: true,
  });

  const callInfo = QUALIFICATION_CALLS.find(c => c.number === nextCallNumber);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleRedFlag = (flagId: string) => {
    setSelectedRedFlags(prev =>
      prev.includes(flagId)
        ? prev.filter(f => f !== flagId)
        : [...prev, flagId]
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Call Context */}
        <div className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-blue-100 text-sm">Preparing for</div>
              <h2 className="text-2xl font-bold mt-1">
                Call #{nextCallNumber}: {callInfo?.label || 'Follow-up'}
              </h2>
              <p className="mt-2 text-blue-100">
                {callInfo?.goal || 'Continue qualification process'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-blue-100 text-sm">Timeline</div>
              <div className="font-semibold">{callInfo?.day || 'Flexible'}</div>
            </div>
          </div>
        </div>

        {/* Client Intel */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-gray-400" />
            Client Intelligence
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm text-gray-500">Company</label>
              <p className="font-medium text-gray-900">{client.name}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Vertical</label>
              <p className="font-medium text-gray-900">{verticalContent?.label || client.vertical}</p>
            </div>
          </div>

          {client.website && (
            <div className="mb-4">
              <label className="text-sm text-gray-500">Website</label>
              <a
                href={client.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <Globe className="h-4 w-4" />
                {client.website}
              </a>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website Research Notes
            </label>
            <textarea
              rows={4}
              value={websiteNotes}
              onChange={(e) => setWebsiteNotes(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Review their website and note: What do they do? Who are their customers? What creative do they currently have? Any obvious pain points?"
            />
          </div>

          {client.notes && (
            <div className="mt-4 rounded-lg bg-gray-50 p-4">
              <label className="text-sm font-medium text-gray-700">Initial Notes</label>
              <p className="text-sm text-gray-600 mt-1">{client.notes}</p>
            </div>
          )}
        </div>

        {/* Talking Points */}
        {verticalContent && (
          <div className="rounded-xl bg-white shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection('talkingPoints')}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50"
            >
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                {verticalContent.label} Talking Points
              </h3>
              {expandedSections.talkingPoints ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {expandedSections.talkingPoints && (
              <div className="px-6 pb-6 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Key Value Props</h4>
                  <ul className="space-y-2">
                    {verticalContent.talkingPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <Sparkles className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Capabilities to Highlight</h4>
                  <ul className="space-y-2">
                    {verticalContent.capabilities.map((cap, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        {cap}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Common Pain Points They May Have</h4>
                  <ul className="space-y-2">
                    {verticalContent.commonPainPoints.map((pain, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <Target className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                        {pain}
                      </li>
                    ))}
                  </ul>
                </div>

                {verticalContent.caseStudyHints.length > 0 && (
                  <div className="rounded-lg bg-blue-50 p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-1">Reference Clients</h4>
                    <p className="text-sm text-blue-700">
                      {verticalContent.caseStudyHints.join(' | ')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Discovery Questions */}
        <div className="rounded-xl bg-white shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('discovery')}
            className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50"
          >
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              Discovery Questions
            </h3>
            {expandedSections.discovery ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {expandedSections.discovery && (
            <div className="px-6 pb-6 space-y-6">
              {/* Vertical-specific questions */}
              {verticalContent && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    {verticalContent.label}-Specific Questions
                  </h4>
                  <ul className="space-y-2">
                    {verticalContent.discoveryQuestions.map((q, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-blue-500 font-medium shrink-0">Q:</span>
                        <span className="text-sm text-gray-700">{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Universal questions by category */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  Decision Making
                </h4>
                <ul className="space-y-2">
                  {UNIVERSAL_DISCOVERY_QUESTIONS.decisionMaking.map((q, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-blue-500 font-medium shrink-0">Q:</span>
                      <span className="text-sm text-gray-700">{q}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  Urgency & Timeline
                </h4>
                <ul className="space-y-2">
                  {UNIVERSAL_DISCOVERY_QUESTIONS.urgency.map((q, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-blue-500 font-medium shrink-0">Q:</span>
                      <span className="text-sm text-gray-700">{q}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-gray-400" />
                  Success Criteria
                </h4>
                <ul className="space-y-2">
                  {UNIVERSAL_DISCOVERY_QUESTIONS.success.map((q, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-blue-500 font-medium shrink-0">Q:</span>
                      <span className="text-sm text-gray-700">{q}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  Budget
                </h4>
                <ul className="space-y-2">
                  {UNIVERSAL_DISCOVERY_QUESTIONS.budget.map((q, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-blue-500 font-medium shrink-0">Q:</span>
                      <span className="text-sm text-gray-700">{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Red Flags */}
        <div className="rounded-xl bg-white shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('redFlags')}
            className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50"
          >
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Red Flags to Watch For
            </h3>
            {expandedSections.redFlags ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {expandedSections.redFlags && (
            <div className="px-6 pb-6 space-y-3">
              {PRE_CALL_RED_FLAGS.map((flag) => (
                <label
                  key={flag.id}
                  className={`
                    flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors
                    ${selectedRedFlags.includes(flag.id)
                      ? flag.severity === 'critical'
                        ? 'border-red-300 bg-red-50'
                        : 'border-yellow-300 bg-yellow-50'
                      : 'border-gray-200 hover:bg-gray-50'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={selectedRedFlags.includes(flag.id)}
                    onChange={() => toggleRedFlag(flag.id)}
                    className="h-4 w-4 mt-0.5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 text-sm">{flag.label}</span>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          flag.severity === 'critical'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {flag.severity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{flag.description}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Prep Notes */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-400" />
            My Prep Notes
          </h3>
          <textarea
            rows={6}
            value={prepNotes}
            onChange={(e) => setPrepNotes(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Personal notes and reminders for the call..."
          />
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Actions</h3>
          <div className="space-y-2">
            <Link
              href={`/clients/${client.id}/prep/sheet`}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Printer className="h-4 w-4" />
              View Prep Sheet
            </Link>
            <Link
              href={`/clients/${client.id}`}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to Client
            </Link>
          </div>
        </div>

        {/* Call Checklist */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-4">
            Call #{nextCallNumber} Checklist
          </h3>
          {nextCallNumber === 1 && (
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <input type="checkbox" className="mt-1 rounded border-gray-300" />
                <span>Is there a defined need and timeline?</span>
              </li>
              <li className="flex items-start gap-2">
                <input type="checkbox" className="mt-1 rounded border-gray-300" />
                <span>Budget authority or DM access?</span>
              </li>
              <li className="flex items-start gap-2">
                <input type="checkbox" className="mt-1 rounded border-gray-300" />
                <span>System or Project opportunity?</span>
              </li>
              <li className="flex items-start gap-2">
                <input type="checkbox" className="mt-1 rounded border-gray-300" />
                <span>Urgency or triggering event?</span>
              </li>
            </ul>
          )}
          {nextCallNumber === 2 && (
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <input type="checkbox" className="mt-1 rounded border-gray-300" />
                <span>Decision-maker confirmed?</span>
              </li>
              <li className="flex items-start gap-2">
                <input type="checkbox" className="mt-1 rounded border-gray-300" />
                <span>Success criteria clear?</span>
              </li>
              <li className="flex items-start gap-2">
                <input type="checkbox" className="mt-1 rounded border-gray-300" />
                <span>POC needed? (yes/no)</span>
              </li>
              <li className="flex items-start gap-2">
                <input type="checkbox" className="mt-1 rounded border-gray-300" />
                <span>MSA circulated?</span>
              </li>
            </ul>
          )}
          {nextCallNumber === 3 && (
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <input type="checkbox" className="mt-1 rounded border-gray-300" />
                <span>Budget parameters captured?</span>
              </li>
              <li className="flex items-start gap-2">
                <input type="checkbox" className="mt-1 rounded border-gray-300" />
                <span>All stakeholders documented?</span>
              </li>
              <li className="flex items-start gap-2">
                <input type="checkbox" className="mt-1 rounded border-gray-300" />
                <span>Scope elements confirmed?</span>
              </li>
              <li className="flex items-start gap-2">
                <input type="checkbox" className="mt-1 rounded border-gray-300" />
                <span>Special requirements noted?</span>
              </li>
            </ul>
          )}
          {nextCallNumber === 4 && (
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <input type="checkbox" className="mt-1 rounded border-gray-300" />
                <span>Proposal prepared?</span>
              </li>
              <li className="flex items-start gap-2">
                <input type="checkbox" className="mt-1 rounded border-gray-300" />
                <span>SOW draft ready?</span>
              </li>
              <li className="flex items-start gap-2">
                <input type="checkbox" className="mt-1 rounded border-gray-300" />
                <span>Timeline prepared?</span>
              </li>
              <li className="flex items-start gap-2">
                <input type="checkbox" className="mt-1 rounded border-gray-300" />
                <span>Objection responses ready?</span>
              </li>
            </ul>
          )}
        </div>

        {/* Red Flag Summary */}
        {selectedRedFlags.length > 0 && (
          <div className="rounded-xl bg-red-50 p-6 border border-red-200">
            <h3 className="text-sm font-medium text-red-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Flagged Concerns ({selectedRedFlags.length})
            </h3>
            <ul className="space-y-1 text-sm text-red-700">
              {selectedRedFlags.map(flagId => {
                const flag = PRE_CALL_RED_FLAGS.find(f => f.id === flagId);
                return flag ? (
                  <li key={flagId}>• {flag.label}</li>
                ) : null;
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
