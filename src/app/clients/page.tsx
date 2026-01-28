import Link from 'next/link';
import { Plus, Building2 } from 'lucide-react';
import prisma from '@/lib/db';
import ClientsTable from '@/components/clients/ClientsTable';

async function getClients() {
  return prisma.client.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      website: true,
      vertical: true,
      classification: true,
      qualified: true,
      // Sales Pipeline fields
      dealOwner: true,
      salesStage: true,
      dealValue: true,
      nextStepNotes: true,
      lastImportedAt: true,
      // Counts
      _count: {
        select: {
          projects: true,
          salesTasks: true,
        },
      },
    },
  });
}

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="mt-1 text-gray-500">
            Manage client accounts and sales pipeline
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/sales-report/import"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Import Sales Report
          </Link>
          <Link
            href="/clients/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New Client
          </Link>
        </div>
      </div>

      {/* Client List */}
      {clients.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No clients yet</h3>
          <p className="mt-2 text-gray-500">
            Get started by importing a Sales Report or adding clients manually.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link
              href="/sales-report/import"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Import Sales Report
            </Link>
            <Link
              href="/clients/new"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Client
            </Link>
          </div>
        </div>
      ) : (
        <ClientsTable clients={clients} />
      )}
    </div>
  );
}
