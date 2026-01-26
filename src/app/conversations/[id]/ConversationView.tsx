'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Building2,
  TestTube,
  Mail,
  CheckSquare,
  Users,
  AlertTriangle,
  Target,
  Calendar,
  Copy,
  Check,
  UserPlus,
  Loader2,
} from 'lucide-react';
import type {
  CallSummary,
  OpportunityData,
  TestEngagement,
  FollowUpEmail,
  InternalChecklist,
  ClientAttendee,
  KartelAttendee,
} from '@/lib/types/conversation';

interface ConversationViewProps {
  conversation: {
    id: string;
    meetingDate: Date | null;
    meetingDuration: string | null;
    meetingStage: string | null;
    clientId?: string | null;
  };
  client?: {
    id: string;
    name: string;
  } | null;
  parsedData: {
    clientAttendees: ClientAttendee[];
    kartelAttendees: KartelAttendee[];
    callSummary: CallSummary | null;
    opportunityData: OpportunityData | null;
    testEngagement: TestEngagement | null;
    followUpEmails: FollowUpEmail[];
    internalChecklist: InternalChecklist | null;
  };
}

const TABS = [
  { id: 'summary', label: 'Summary', icon: FileText },
  { id: 'opportunity', label: 'Opportunity', icon: Building2 },
  { id: 'test', label: 'Test Engagement', icon: TestTube },
  { id: 'emails', label: 'Emails', icon: Mail },
  { id: 'checklist', label: 'Checklist', icon: CheckSquare },
];

export default function ConversationView({
  conversation,
  client,
  parsedData,
}: ConversationViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('summary');
  const [copiedEmail, setCopiedEmail] = useState<number | null>(null);
  const [importingContacts, setImportingContacts] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const copyEmail = async (email: FollowUpEmail, index: number) => {
    const text = `To: ${email.to}\n${
      email.cc?.length ? `CC: ${email.cc.join(', ')}\n` : ''
    }Subject: ${email.subject}\n\n${email.body}`;
    await navigator.clipboard.writeText(text);
    setCopiedEmail(index);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleImportContacts = async () => {
    if (!client) return;

    setImportingContacts(true);
    setImportResult(null);

    try {
      const response = await fetch(
        `/api/conversations/${conversation.id}/import-contacts`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: client.id,
            attendees: parsedData.clientAttendees,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setImportResult({ success: true, message: data.message });
        router.refresh();
      } else {
        setImportResult({ success: false, message: data.error });
      }
    } catch (error) {
      setImportResult({ success: false, message: 'Failed to import contacts' });
    } finally {
      setImportingContacts(false);
    }
  };

  const { callSummary, opportunityData, testEngagement, followUpEmails, internalChecklist } =
    parsedData;

  return (
    <div>
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isDisabled = tab.id === 'test' && !testEngagement;

            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && setActiveTab(tab.id)}
                disabled={isDisabled}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : isDisabled
                    ? 'border-transparent text-gray-300 cursor-not-allowed'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="rounded-xl bg-white shadow-sm">
        {/* Summary Tab */}
        {activeTab === 'summary' && callSummary && (
          <div className="p-6 space-y-6">
            {/* Meeting Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Meeting Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="text-sm text-gray-500">Account</div>
                  <div className="font-medium text-gray-900">
                    {callSummary.accountName}
                  </div>
                  {callSummary.endClient && (
                    <div className="text-sm text-gray-600">
                      End Client: {callSummary.endClient}
                    </div>
                  )}
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="text-sm text-gray-500">Type</div>
                  <div className="font-medium text-gray-900">
                    {callSummary.accountType} • {callSummary.industry}
                  </div>
                  <div className="text-sm text-gray-600">{callSummary.callType}</div>
                </div>
              </div>
            </div>

            {/* Attendees */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Attendees
                </h3>
                {client && parsedData.clientAttendees.length > 0 && (
                  <button
                    onClick={handleImportContacts}
                    disabled={importingContacts}
                    className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {importingContacts ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Import as Contacts
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Import Result Message */}
              {importResult && (
                <div
                  className={`mb-4 rounded-lg p-3 text-sm ${
                    importResult.success
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {importResult.message}
                </div>
              )}

              {/* No client linked warning */}
              {!client && parsedData.clientAttendees.length > 0 && (
                <div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-700">
                  Link this conversation to a client to import attendees as contacts.
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Client Side ({parsedData.clientAttendees.length})
                  </h4>
                  <div className="space-y-2">
                    {parsedData.clientAttendees.map((attendee, i) => (
                      <div
                        key={i}
                        className="rounded-lg bg-gray-50 p-3 text-sm"
                      >
                        <div className="font-medium">{attendee.name}</div>
                        {attendee.role && (
                          <div className="text-gray-500">{attendee.role}</div>
                        )}
                        {attendee.email && (
                          <div className="text-blue-600 text-xs">{attendee.email}</div>
                        )}
                        {attendee.notes && (
                          <div className="text-gray-600 text-xs mt-1">
                            {attendee.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Kartel Team ({parsedData.kartelAttendees.length})
                  </h4>
                  <div className="space-y-2">
                    {parsedData.kartelAttendees.map((attendee, i) => (
                      <div
                        key={i}
                        className="rounded-lg bg-blue-50 p-3 text-sm"
                      >
                        <div className="font-medium">{attendee.name}</div>
                        <div className="text-blue-600">{attendee.role}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Key Takeaways */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Key Takeaways
              </h3>

              {/* Immediate Need */}
              <div className="rounded-lg border border-gray-200 p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-gray-900">Immediate Need</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      callSummary.keyTakeaways.immediateNeed.urgency === 'HIGH'
                        ? 'bg-red-100 text-red-700'
                        : callSummary.keyTakeaways.immediateNeed.urgency ===
                          'MEDIUM'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {callSummary.keyTakeaways.immediateNeed.urgency} Urgency
                  </span>
                </div>
                <p className="text-gray-700">
                  <strong>What:</strong>{' '}
                  {callSummary.keyTakeaways.immediateNeed.what}
                </p>
                <p className="text-gray-700">
                  <strong>Why:</strong>{' '}
                  {callSummary.keyTakeaways.immediateNeed.why}
                </p>
                {callSummary.keyTakeaways.immediateNeed.urgencyNote && (
                  <p className="mt-2 text-sm text-red-600 italic">
                    &ldquo;{callSummary.keyTakeaways.immediateNeed.urgencyNote}&rdquo;
                  </p>
                )}
              </div>

              {/* Use Case */}
              {callSummary.keyTakeaways.useCase?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Use Case Discussed
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                    {callSummary.keyTakeaways.useCase.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Concerns */}
              {callSummary.keyTakeaways.concerns?.length > 0 && (
                <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Concerns Raised
                  </h4>
                  <div className="space-y-2">
                    {callSummary.keyTakeaways.concerns.map((concern, i) => (
                      <div key={i} className="text-sm">
                        <span className="font-medium text-yellow-900">
                          {concern.concern}:
                        </span>{' '}
                        <span className="text-yellow-800">{concern.details}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Next Steps */}
            {callSummary.nextSteps?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Agreed Next Steps
                </h3>
                <div className="space-y-2">
                  {callSummary.nextSteps.map((step, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg bg-gray-50 p-3"
                    >
                      <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {step.owner}
                      </span>
                      <span className="text-sm text-gray-700">{step.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Opportunity Tab */}
        {activeTab === 'opportunity' && opportunityData && (
          <div className="p-6 space-y-6">
            {/* Account Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Account Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Account Name</div>
                  <div className="font-medium">{opportunityData.accountInfo.accountName}</div>
                </div>
                {opportunityData.accountInfo.endClient && (
                  <div>
                    <div className="text-sm text-gray-500">End Client</div>
                    <div className="font-medium">{opportunityData.accountInfo.endClient}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-500">Account Type</div>
                  <div className="font-medium">{opportunityData.accountInfo.accountType}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Industry</div>
                  <div className="font-medium">{opportunityData.accountInfo.industry}</div>
                </div>
              </div>
            </div>

            {/* Contacts */}
            {opportunityData.contacts?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Contacts
                </h3>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Role
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {opportunityData.contacts.map((contact, i) => (
                        <tr key={i}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {contact.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {contact.role || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {contact.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Opportunity Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Opportunity Details
              </h3>
              <div className="rounded-lg bg-gray-50 p-4 space-y-3">
                <div>
                  <div className="text-sm text-gray-500">Opportunity Name</div>
                  <div className="font-medium">
                    {opportunityData.opportunityDetails.opportunityName}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Use Case</div>
                  <div className="text-gray-700">
                    {opportunityData.opportunityDetails.useCase}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Primary Need</div>
                  <div className="text-gray-700">
                    {opportunityData.opportunityDetails.primaryNeed}
                  </div>
                </div>
                <div className="flex gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Urgency</div>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        opportunityData.opportunityDetails.urgency === 'HIGH'
                          ? 'bg-red-100 text-red-700'
                          : opportunityData.opportunityDetails.urgency === 'MEDIUM'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {opportunityData.opportunityDetails.urgency}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Stage</div>
                    <div className="text-gray-700">
                      {opportunityData.opportunityDetails.stage}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Open Questions */}
            {opportunityData.openQuestions?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Open Questions (Gaps to Fill)
                </h3>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Question
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Why It Matters
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {opportunityData.openQuestions.map((q, i) => (
                        <tr key={i}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {q.question}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {q.whyItMatters}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Deal Sizing */}
            {opportunityData.dealSizing?.scenarios?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Preliminary Deal Sizing
                </h3>
                {opportunityData.dealSizing.note && (
                  <p className="text-sm text-yellow-700 bg-yellow-50 rounded-lg p-3 mb-4">
                    {opportunityData.dealSizing.note}
                  </p>
                )}
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Scenario
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Monthly Fee
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          ACV
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {opportunityData.dealSizing.scenarios.map((s, i) => (
                        <tr key={i}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {s.scenario}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {s.monthlyFee}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-green-600">
                            {s.acv}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Test Engagement Tab */}
        {activeTab === 'test' && testEngagement && (
          <div className="p-6 space-y-6">
            {/* Purpose */}
            {testEngagement.purpose?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Purpose of Test
                </h3>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Goal
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Why It Matters
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {testEngagement.purpose.map((p, i) => (
                        <tr key={i}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {p.goal}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {p.whyItMatters}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Timeline */}
            {testEngagement.timeline?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Test Timeline
                </h3>
                <div className="space-y-2">
                  {testEngagement.timeline.map((phase, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 rounded-lg bg-gray-50 p-3"
                    >
                      <span className="shrink-0 w-24 text-sm font-medium text-blue-600">
                        {phase.duration}
                      </span>
                      <span className="shrink-0 w-40 font-medium text-gray-900">
                        {phase.phase}
                      </span>
                      <span className="text-sm text-gray-600">
                        {phase.activities}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deliverables */}
            {testEngagement.scope?.deliverables?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  What We&apos;ll Deliver
                </h3>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Deliverable
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {testEngagement.scope.deliverables.map((d, i) => (
                        <tr key={i}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {d.type}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {d.quantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {d.notes}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Risks */}
            {testEngagement.risks?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Risks & Mitigations
                </h3>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Risk
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Likelihood
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Mitigation
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {testEngagement.risks.map((r, i) => (
                        <tr key={i}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {r.risk}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                r.likelihood === 'HIGH'
                                  ? 'bg-red-100 text-red-700'
                                  : r.likelihood === 'MEDIUM'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {r.likelihood}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {r.mitigation}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Emails Tab */}
        {activeTab === 'emails' && (
          <div className="p-6 space-y-6">
            {followUpEmails.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Mail className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>No follow-up emails generated</p>
              </div>
            ) : (
              followUpEmails.map((email, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-gray-200 overflow-hidden"
                >
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900">
                        {email.emailType}
                      </span>
                    </div>
                    <button
                      onClick={() => copyEmail(email, i)}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      {copiedEmail === i ? (
                        <>
                          <Check className="h-4 w-4 text-green-600" />
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
                  <div className="p-4 space-y-3">
                    <div className="text-sm">
                      <span className="text-gray-500">To:</span>{' '}
                      <span className="text-gray-900">{email.to}</span>
                    </div>
                    {email.cc && email.cc.length > 0 && (
                      <div className="text-sm">
                        <span className="text-gray-500">CC:</span>{' '}
                        <span className="text-gray-900">{email.cc.join(', ')}</span>
                      </div>
                    )}
                    <div className="text-sm">
                      <span className="text-gray-500">Subject:</span>{' '}
                      <span className="font-medium text-gray-900">
                        {email.subject}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-3">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                        {email.body}
                      </pre>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Checklist Tab */}
        {activeTab === 'checklist' && internalChecklist && (
          <div className="p-6 space-y-6">
            {/* Data Intake */}
            {internalChecklist.dataIntake?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Data Intake Checklist
                </h3>
                <div className="space-y-2">
                  {internalChecklist.dataIntake.map((item, i) => (
                    <label
                      key={i}
                      className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        defaultChecked={item.checked}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{item.item}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Brief Review */}
            {internalChecklist.briefReview?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Brief Review Checklist
                </h3>
                <div className="space-y-2">
                  {internalChecklist.briefReview.map((item, i) => (
                    <label
                      key={i}
                      className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        defaultChecked={item.checked}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{item.item}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Communication Rhythm */}
            {internalChecklist.communicationRhythm?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Communication Rhythm
                </h3>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Touchpoint
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Owner
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          When
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {internalChecklist.communicationRhythm.map((item, i) => (
                        <tr key={i}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.touchpoint}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {item.owner}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {item.when}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
