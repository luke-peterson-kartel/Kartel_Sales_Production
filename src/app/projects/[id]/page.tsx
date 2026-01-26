import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/db';
import {
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  User,
  FileText,
  CheckCircle2,
  Clock,
  Printer
} from 'lucide-react';
import { FOLDER_PARTITIONS, PROJECT_STATUSES, HANDOFF_TYPES } from '@/lib/constants';
import ProjectActions from './ProjectActions';

async function getProject(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
      milestones: {
        orderBy: { order: 'asc' },
      },
      handoffs: {
        orderBy: { handoffNumber: 'asc' },
      },
      estimates: {
        orderBy: { createdAt: 'desc' },
      },
      deliverables: true,
    },
  });

  return project;
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  const statusInfo = PROJECT_STATUSES.find(s => s.value === project.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <ProjectStatusBadge status={project.status} />
              <ProjectTypeBadge type={project.type} />
            </div>
            <div className="mt-2 flex items-center gap-4 text-gray-500">
              <span className="font-mono text-sm">{project.jobId}</span>
              <Link
                href={`/clients/${project.client.id}`}
                className="flex items-center gap-1 hover:text-blue-600"
              >
                <Building2 className="h-4 w-4" />
                {project.client.name}
              </Link>
              {project.producer && (
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {project.producer}
                </span>
              )}
              {project.finalDueDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Due {new Date(project.finalDueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/projects/${project.id}/print`}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Printer className="h-4 w-4" />
              Print Forms
            </Link>
            <ProjectActions project={project} />
          </div>
        </div>
      </div>

      {/* Folder Partition Navigation */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-gray-700">Physical Folder Position</h2>
          <span className="text-sm text-gray-500">
            Currently in: <strong>{FOLDER_PARTITIONS.find(p => p.number === project.currentPartition)?.name}</strong>
          </span>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {FOLDER_PARTITIONS.map((partition) => (
            <button
              key={partition.number}
              className={`
                relative rounded-lg border-2 p-3 text-left transition-all
                ${project.currentPartition === partition.number
                  ? 'border-blue-500 bg-blue-50'
                  : project.currentPartition > partition.number
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }
              `}
            >
              {project.currentPartition > partition.number && (
                <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-green-500" />
              )}
              <div className="text-xs font-medium text-gray-500">#{partition.number}</div>
              <div className="text-sm font-medium text-gray-900">{partition.name}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Handoffs */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Handoffs</h2>
              <Link
                href={`/handoffs/new?projectId=${project.id}`}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Create Handoff
              </Link>
            </div>
            <div className="space-y-3">
              {HANDOFF_TYPES.map((handoff) => {
                const existingHandoff = project.handoffs.find(
                  h => h.handoffNumber === handoff.number
                );
                const href = existingHandoff
                  ? `/handoffs/${existingHandoff.id}`
                  : `/handoffs/new?projectId=${project.id}&handoffNumber=${handoff.number}`;
                return (
                  <Link
                    key={handoff.number}
                    href={href}
                    className={`flex items-center gap-4 rounded-lg border p-4 transition-colors ${
                      existingHandoff?.status === 'COMPLETED'
                        ? 'bg-green-50 border-green-200 hover:bg-green-100'
                        : existingHandoff?.status === 'IN_PROGRESS'
                        ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        existingHandoff?.status === 'COMPLETED'
                          ? 'bg-green-500 text-white'
                          : existingHandoff?.status === 'IN_PROGRESS'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {existingHandoff?.status === 'COMPLETED' ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : existingHandoff?.status === 'IN_PROGRESS' ? (
                        <Clock className="h-5 w-5" />
                      ) : (
                        <span className="font-semibold">{handoff.number}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{handoff.label}</div>
                      <div className="text-sm text-gray-500">
                        {handoff.timing} - {handoff.description}
                      </div>
                    </div>
                    <span className="text-sm text-blue-600">
                      {existingHandoff ? 'View' : 'Create'}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Estimates */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Estimates ({project.estimates.length})
              </h2>
              <Link
                href={`/estimates/new?projectId=${project.id}`}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                New Estimate
              </Link>
            </div>
            {project.estimates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>No estimates yet</p>
                <Link
                  href={`/estimates/new?projectId=${project.id}`}
                  className="mt-2 inline-block text-sm text-blue-600 hover:underline"
                >
                  Create an estimate
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {project.estimates.map((estimate) => (
                  <Link
                    key={estimate.id}
                    href={`/estimates/${estimate.id}`}
                    className="block rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{estimate.name}</div>
                        <div className="text-sm text-gray-500">
                          {estimate.projectType} - {estimate.totalAssets} assets
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          {estimate.totalMonthlyDays} days/mo
                        </div>
                        <div className="text-sm text-gray-500">
                          + {estimate.setupDays} setup days
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Deliverables Summary */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Deliverables ({project.deliverables.length})
              </h2>
              <Link
                href={`/projects/${project.id}/deliverables`}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Manage Deliverables
              </Link>
            </div>
            {project.deliverables.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>No deliverables defined yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <DeliverableSummary
                  title="Total Assets"
                  value={project.deliverables.reduce((sum, d) => sum + d.totalCount, 0)}
                />
                <DeliverableSummary
                  title="Monthly Assets"
                  value={project.deliverables.reduce((sum, d) => sum + d.monthlyCount, 0)}
                />
                <DeliverableSummary
                  title="Platforms"
                  value={new Set(project.deliverables.map(d => d.platform)).size}
                />
                <DeliverableSummary
                  title="Est. Days/Month"
                  value={project.deliverables.reduce((sum, d) => sum + d.estimatedDays, 0).toFixed(1)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Financials */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Financials</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-1 text-gray-500 text-sm">
                  <DollarSign className="h-4 w-4" />
                  Annual Contract Value
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {project.acv
                    ? new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        maximumFractionDigits: 0,
                      }).format(project.acv)
                    : '-'
                  }
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Monthly Fee</div>
                <div className="text-xl font-semibold text-gray-900">
                  {project.monthlyFee
                    ? new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        maximumFractionDigits: 0,
                      }).format(project.monthlyFee)
                    : '-'
                  }
                </div>
              </div>
              {project.estimatedMargin && (
                <div>
                  <div className="text-sm text-gray-500">Est. Margin</div>
                  <div className="text-xl font-semibold text-green-600">
                    {project.estimatedMargin}%
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Team */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Team</h3>
            <div className="space-y-3">
              <TeamSection title="Producer" members={project.producer ? [project.producer] : []} />
              <TeamSection
                title="Creative Team"
                members={project.creativeTeam ? JSON.parse(project.creativeTeam) : []}
              />
              <TeamSection
                title="LoRA Team"
                members={project.loraTeam ? JSON.parse(project.loraTeam) : []}
              />
              <TeamSection
                title="Gen Team"
                members={project.genTeam ? JSON.parse(project.genTeam) : []}
              />
              <TeamSection
                title="External Artists"
                members={project.externalArtists ? JSON.parse(project.externalArtists) : []}
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-900">
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last Updated</span>
                <span className="text-gray-900">
                  {new Date(project.updatedAt).toLocaleDateString()}
                </span>
              </div>
              {project.finalDueDate && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Due Date</span>
                  <span className="text-gray-900 font-medium">
                    {new Date(project.finalDueDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href={`/estimates/new?projectId=${project.id}`}
                className="block w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-center"
              >
                Create Estimate
              </Link>
              <Link
                href={`/handoffs/new?projectId=${project.id}`}
                className="block w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-center"
              >
                Create Handoff
              </Link>
              <Link
                href={`/projects/${project.id}/print`}
                className="block w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-center"
              >
                Print All Forms
              </Link>
            </div>
          </div>
        </div>
      </div>
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

function DeliverableSummary({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500">{title}</div>
    </div>
  );
}

function TeamSection({ title, members }: { title: string; members: string[] }) {
  if (members.length === 0) {
    return (
      <div>
        <div className="text-sm text-gray-500">{title}</div>
        <div className="text-sm text-gray-400 italic">Not assigned</div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-sm font-medium text-gray-900">
        {members.join(', ')}
      </div>
    </div>
  );
}
