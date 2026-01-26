import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/db';
import { ArrowLeft } from 'lucide-react';
import QualificationForm from './QualificationForm';
import { QUALIFICATION_CALLS } from '@/lib/constants';

async function getClient(id: string) {
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      qualificationCalls: {
        orderBy: { callNumber: 'asc' },
        include: {
          conversations: {
            select: {
              id: true,
              meetingDate: true,
              meetingStage: true,
              callSummary: true,
              processed: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
      contacts: true,
    },
  });

  return client;
}

export default async function QualificationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ call?: string }>;
}) {
  const { id } = await params;
  const { call } = await searchParams;
  const client = await getClient(id);
  const initialExpandedCall = call ? parseInt(call, 10) : null;

  if (!client) {
    notFound();
  }

  // Ensure we have qualification call records for all 4 calls
  // If not, we'll initialize them in the form
  const existingCallNumbers = client.qualificationCalls.map(c => c.callNumber);
  const missingCalls = QUALIFICATION_CALLS.filter(
    c => !existingCallNumbers.includes(c.number)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/clients/${client.id}`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {client.name}
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Qualification Calls
            </h1>
            <p className="mt-1 text-gray-500">
              Track and manage the 4-call qualification process for {client.name}
            </p>
          </div>

          {/* Progress indicator */}
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">
              {client.qualificationCalls.filter(c => c.completed).length}/4
            </div>
            <div className="text-sm text-gray-500">Calls Completed</div>
            <div className="mt-1">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                client.qualified
                  ? 'bg-green-100 text-green-700'
                  : client.qualificationScore < 30
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {client.qualificationScore}% Qualified
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Qualification Form */}
      <QualificationForm
        client={client}
        existingCalls={client.qualificationCalls}
        missingCallNumbers={missingCalls.map(c => c.number)}
        initialExpandedCall={initialExpandedCall}
      />
    </div>
  );
}
