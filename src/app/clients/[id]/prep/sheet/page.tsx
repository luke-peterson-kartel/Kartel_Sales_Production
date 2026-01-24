import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/db';
import { ArrowLeft, Printer } from 'lucide-react';
import { getVerticalContent, UNIVERSAL_DISCOVERY_QUESTIONS } from '@/lib/verticals';
import { QUALIFICATION_CALLS } from '@/lib/constants';
import PrintButton from './PrintButton';

async function getClient(id: string) {
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      contacts: true,
      qualificationCalls: {
        orderBy: { callNumber: 'asc' },
      },
    },
  });

  return client;
}

export default async function PrepSheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);

  if (!client) {
    notFound();
  }

  const verticalContent = getVerticalContent(client.vertical);
  const nextCallNumber = client.qualificationCalls.filter(c => c.completed).length + 1;
  const callInfo = QUALIFICATION_CALLS.find(c => c.number === (nextCallNumber > 4 ? 4 : nextCallNumber));

  return (
    <div>
      {/* Screen-only header */}
      <div className="print:hidden mb-6">
        <Link
          href={`/clients/${client.id}/prep`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Prep
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Prep Sheet</h1>
            <p className="mt-1 text-gray-500">
              Print this sheet to use during your call with {client.name}
            </p>
          </div>
          <PrintButton />
        </div>
      </div>

      {/* Printable Content */}
      <div className="bg-white print:shadow-none shadow-sm rounded-xl print:rounded-none p-8 print:p-0">
        {/* Header */}
        <div className="border-b-2 border-gray-900 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
              <p className="text-gray-600">{verticalContent?.label || client.vertical}</p>
              {client.website && (
                <p className="text-sm text-gray-500">{client.website}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">
                Call #{nextCallNumber > 4 ? 4 : nextCallNumber}
              </div>
              <div className="text-sm text-gray-600">{callInfo?.label}</div>
              <div className="text-sm text-gray-500">{callInfo?.day}</div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Contacts */}
            {client.contacts.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2 border-b border-gray-300 pb-1">
                  Contacts
                </h2>
                <div className="space-y-2 text-sm">
                  {client.contacts.map(contact => (
                    <div key={contact.id}>
                      <span className="font-medium">{contact.name}</span>
                      {contact.role && <span className="text-gray-500"> - {contact.role}</span>}
                      {contact.isPrimary && <span className="text-blue-600 text-xs ml-1">(Primary)</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Talking Points */}
            {verticalContent && (
              <div>
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2 border-b border-gray-300 pb-1">
                  Key Talking Points
                </h2>
                <ul className="space-y-1 text-sm">
                  {verticalContent.talkingPoints.slice(0, 4).map((point, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-gray-400">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Pain Points to Probe */}
            {verticalContent && (
              <div>
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2 border-b border-gray-300 pb-1">
                  Pain Points to Probe
                </h2>
                <ul className="space-y-1 text-sm">
                  {verticalContent.commonPainPoints.slice(0, 4).map((pain, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-gray-400">•</span>
                      <span>{pain}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Notes Section */}
            <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2 border-b border-gray-300 pb-1">
                Call Notes
              </h2>
              <div className="border border-gray-200 rounded h-32"></div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Discovery Questions */}
            <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2 border-b border-gray-300 pb-1">
                Must-Ask Questions
              </h2>
              <ul className="space-y-2 text-sm">
                {verticalContent?.discoveryQuestions.slice(0, 3).map((q, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-4 h-4 border border-gray-300 rounded shrink-0 mt-0.5"></span>
                    <span>{q}</span>
                  </li>
                ))}
                {UNIVERSAL_DISCOVERY_QUESTIONS.decisionMaking.slice(0, 1).map((q, i) => (
                  <li key={`dm-${i}`} className="flex items-start gap-2">
                    <span className="w-4 h-4 border border-gray-300 rounded shrink-0 mt-0.5"></span>
                    <span>{q}</span>
                  </li>
                ))}
                {UNIVERSAL_DISCOVERY_QUESTIONS.urgency.slice(0, 1).map((q, i) => (
                  <li key={`urg-${i}`} className="flex items-start gap-2">
                    <span className="w-4 h-4 border border-gray-300 rounded shrink-0 mt-0.5"></span>
                    <span>{q}</span>
                  </li>
                ))}
                {UNIVERSAL_DISCOVERY_QUESTIONS.budget.slice(0, 1).map((q, i) => (
                  <li key={`bud-${i}`} className="flex items-start gap-2">
                    <span className="w-4 h-4 border border-gray-300 rounded shrink-0 mt-0.5"></span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Gate Criteria */}
            <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2 border-b border-gray-300 pb-1">
                Gate Criteria (Must Confirm)
              </h2>
              {(nextCallNumber === 1 || nextCallNumber > 4) && (
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 border border-gray-300 rounded shrink-0 mt-0.5"></span>
                    <span>Defined need and timeline?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 border border-gray-300 rounded shrink-0 mt-0.5"></span>
                    <span>Budget authority or DM access?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 border border-gray-300 rounded shrink-0 mt-0.5"></span>
                    <span>System or Project opportunity?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 border border-gray-300 rounded shrink-0 mt-0.5"></span>
                    <span>Urgency or triggering event?</span>
                  </li>
                </ul>
              )}
              {nextCallNumber === 2 && (
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 border border-gray-300 rounded shrink-0 mt-0.5"></span>
                    <span>Decision-maker confirmed and engaged?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 border border-gray-300 rounded shrink-0 mt-0.5"></span>
                    <span>Need and ability to pay validated?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 border border-gray-300 rounded shrink-0 mt-0.5"></span>
                    <span>Success criteria clear?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 border border-gray-300 rounded shrink-0 mt-0.5"></span>
                    <span>POC decision made?</span>
                  </li>
                </ul>
              )}
              {nextCallNumber === 3 && (
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 border border-gray-300 rounded shrink-0 mt-0.5"></span>
                    <span>All proposal info captured?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 border border-gray-300 rounded shrink-0 mt-0.5"></span>
                    <span>Budget alignment confirmed?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 border border-gray-300 rounded shrink-0 mt-0.5"></span>
                    <span>Special considerations understood?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 border border-gray-300 rounded shrink-0 mt-0.5"></span>
                    <span>Call #4 = proposal presentation?</span>
                  </li>
                </ul>
              )}
              {nextCallNumber === 4 && (
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 border border-gray-300 rounded shrink-0 mt-0.5"></span>
                    <span>All elements covered, no surprises?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 border border-gray-300 rounded shrink-0 mt-0.5"></span>
                    <span>Client can articulate the deal back?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 border border-gray-300 rounded shrink-0 mt-0.5"></span>
                    <span>All concerns raised and addressed?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 border border-gray-300 rounded shrink-0 mt-0.5"></span>
                    <span>Clear path to signature?</span>
                  </li>
                </ul>
              )}
            </div>

            {/* Classification */}
            <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2 border-b border-gray-300 pb-1">
                Opportunity Classification
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="border border-gray-200 rounded p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-4 h-4 border border-gray-300 rounded"></span>
                    <span className="font-medium">SYSTEM Deal</span>
                  </div>
                  <p className="text-xs text-gray-500">Ongoing infrastructure, 12mo+</p>
                </div>
                <div className="border border-gray-200 rounded p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-4 h-4 border border-gray-300 rounded"></span>
                    <span className="font-medium">PROJECT Deal</span>
                  </div>
                  <p className="text-xs text-gray-500">One-time, beachhead potential</p>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2 border-b border-gray-300 pb-1">
                Next Steps
              </h2>
              <div className="border border-gray-200 rounded h-20"></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-400 flex justify-between">
          <span>Kartel Project Calculator</span>
          <span>Call #{nextCallNumber > 4 ? 4 : nextCallNumber} - {client.name}</span>
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
