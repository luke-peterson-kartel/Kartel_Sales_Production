import Link from 'next/link';
import { Plus, Search, Building2, Globe, Tag } from 'lucide-react';
import prisma from '@/lib/db';
import { VERTICALS } from '@/lib/constants';

async function getClients() {
  return prisma.client.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: {
        select: { projects: true },
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
            Manage client accounts and qualification
          </p>
        </div>
        <Link
          href="/clients/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New Client
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">All Verticals</option>
          {VERTICALS.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
        <select className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">All Status</option>
          <option value="qualified">Qualified</option>
          <option value="unqualified">Not Qualified</option>
        </select>
      </div>

      {/* Client List */}
      {clients.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No clients yet</h3>
          <p className="mt-2 text-gray-500">
            Get started by adding your first client.
          </p>
          <Link
            href="/clients/new"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Client
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Vertical
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Classification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Projects
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <Link href={`/clients/${client.id}`} className="block">
                      <div className="font-medium text-gray-900">{client.name}</div>
                      {client.website && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Globe className="h-3 w-3" />
                          {client.website}
                        </div>
                      )}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                      <Tag className="h-3 w-3" />
                      {client.vertical}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <ClassificationBadge classification={client.classification} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {client._count.projects} project{client._count.projects !== 1 ? 's' : ''}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <QualificationBadge qualified={client.qualified} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <Link
                      href={`/clients/${client.id}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ClassificationBadge({ classification }: { classification: string }) {
  const config: Record<string, { label: string; className: string }> = {
    SYSTEM: { label: 'System', className: 'bg-green-100 text-green-700' },
    PROJECT: { label: 'Project', className: 'bg-blue-100 text-blue-700' },
    UNDETERMINED: { label: 'Undetermined', className: 'bg-gray-100 text-gray-700' },
  };

  const { label, className } = config[classification] || config.UNDETERMINED;

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function QualificationBadge({ qualified }: { qualified: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        qualified
          ? 'bg-green-100 text-green-700'
          : 'bg-yellow-100 text-yellow-700'
      }`}
    >
      {qualified ? 'Qualified' : 'In Progress'}
    </span>
  );
}
