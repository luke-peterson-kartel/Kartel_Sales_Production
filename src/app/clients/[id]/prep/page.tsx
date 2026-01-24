import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/db';
import { ArrowLeft } from 'lucide-react';
import PrepCallForm from './PrepCallForm';
import { getVerticalContent } from '@/lib/verticals';

async function getClient(id: string) {
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      qualificationCalls: {
        orderBy: { callNumber: 'asc' },
      },
    },
  });

  return client;
}

export default async function PrepCallPage({
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

        <h1 className="text-3xl font-bold text-gray-900">
          Pre-Call Preparation
        </h1>
        <p className="mt-1 text-gray-500">
          Prepare for Call #{nextCallNumber > 4 ? 4 : nextCallNumber} with {client.name}
        </p>
      </div>

      <PrepCallForm
        client={client}
        verticalContent={verticalContent}
        nextCallNumber={nextCallNumber > 4 ? 4 : nextCallNumber}
      />
    </div>
  );
}
