import Link from 'next/link';
import { Plus, Search, FolderKanban, Calendar, Building2, DollarSign } from 'lucide-react';
import prisma from '@/lib/db';
import { PROJECT_TYPES, PROJECT_STATUSES, FOLDER_PARTITIONS } from '@/lib/constants';

async function getProjects() {
  return prisma.project.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      client: {
        select: { id: true, name: true },
      },
      _count: {
        select: { handoffs: true, deliverables: true },
      },
    },
  });
}

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="mt-1 text-gray-500">
            Manage active projects and their progress through the production pipeline
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">All Statuses</option>
          {PROJECT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">All Types</option>
          {PROJECT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Project List */}
      {projects.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <FolderKanban className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No projects yet</h3>
          <p className="mt-2 text-gray-500">
            Get started by creating your first project.
          </p>
          <Link
            href="/projects/new"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Create Project
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="block rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {project.name}
                    </h3>
                    <ProjectStatusBadge status={project.status} />
                    <ProjectTypeBadge type={project.type} />
                  </div>

                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                    <span className="font-mono text-gray-400">{project.jobId}</span>
                    <span className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {project.client.name}
                    </span>
                    {project.finalDueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Due {new Date(project.finalDueDate).toLocaleDateString()}
                      </span>
                    )}
                    {project.acv && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          maximumFractionDigits: 0,
                        }).format(project.acv)} ACV
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-6">
                    {/* Partition Progress */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Folder:</span>
                      <div className="flex gap-1">
                        {FOLDER_PARTITIONS.map((partition) => (
                          <div
                            key={partition.number}
                            className={`h-2 w-6 rounded ${
                              project.currentPartition >= partition.number
                                ? 'bg-blue-500'
                                : 'bg-gray-200'
                            }`}
                            title={partition.name}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">
                        {FOLDER_PARTITIONS.find(p => p.number === project.currentPartition)?.name}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{project._count.deliverables} deliverables</span>
                      <span>{project._count.handoffs} handoffs</span>
                    </div>
                  </div>
                </div>

                {/* Producer */}
                {project.producer && (
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Producer</div>
                    <div className="text-sm font-medium text-gray-700">
                      {project.producer}
                    </div>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    ON_DECK: { label: 'On Deck', className: 'bg-gray-100 text-gray-700' },
    IN_SPEC: { label: 'In Spec', className: 'bg-blue-100 text-blue-700' },
    IN_PRODUCTION: { label: 'In Production', className: 'bg-yellow-100 text-yellow-700' },
    FINISHING: { label: 'Finishing', className: 'bg-purple-100 text-purple-700' },
    COMPLETE: { label: 'Complete', className: 'bg-green-100 text-green-700' },
    CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
  };

  const { label, className } = config[status] || config.ON_DECK;

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function ProjectTypeBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; className: string }> = {
    SPEC: { label: 'Spec', className: 'bg-orange-100 text-orange-700' },
    STANDARD: { label: 'Standard', className: 'bg-blue-100 text-blue-700' },
    ADVANCED: { label: 'Advanced', className: 'bg-purple-100 text-purple-700' },
  };

  const { label, className } = config[type] || config.STANDARD;

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
