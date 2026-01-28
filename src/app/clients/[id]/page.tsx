import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/db';
import {
  ArrowLeft,
  Globe,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Calendar,
  FileText,
  PhoneCall,
  DollarSign,
  User,
  CheckSquare,
} from 'lucide-react';
import { VERTICALS, RED_FLAGS, QUALIFICATION_CALLS } from '@/lib/constants';
import {
  SALES_STAGE_LABELS,
  SALES_STAGE_COLORS,
  formatDealValue,
  SalesStage,
} from '@/lib/constants/sales-stages';
import ClientActions from './ClientActions';
import ClientIntelligenceSection from '@/components/clients/ClientIntelligenceSection';
import ContactsList from '@/components/contacts/ContactsList';
import ConversationsWidget from '@/components/clients/ConversationsWidget';
import { TaskCard } from '@/components/tasks/TaskCard';

async function getClient(id: string) {
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      contacts: {
        orderBy: [
          { seniorityScore: 'desc' },
          { isPrimary: 'desc' },
          { name: 'asc' },
        ],
      },
      projects: {
        orderBy: { createdAt: 'desc' },
      },
      qualificationCalls: {
        orderBy: { callNumber: 'asc' },
      },
      conversations: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      intelligence: true,
      salesTasks: {
        orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }],
      },
      subDeals: {
        select: { id: true, name: true, dealValue: true, salesStage: true },
      },
      parentClient: {
        select: { id: true, name: true },
      },
    },
  });

  return client;
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);

  if (!client) {
    notFound();
  }

  const redFlags = client.redFlags ? JSON.parse(client.redFlags) : [];
  const verticalInfo = VERTICALS.find(v => v.value === client.vertical);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/clients"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
              <QualificationBadge qualified={client.qualified} score={client.qualificationScore} />
            </div>
            <div className="mt-2 flex items-center gap-4 text-gray-500">
              {client.website && (
                <a
                  href={client.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-blue-600"
                >
                  <Globe className="h-4 w-4" />
                  {client.website}
                </a>
              )}
              <span className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                {verticalInfo?.label || client.vertical}
              </span>
              {client.parentClient && (
                <Link
                  href={`/clients/${client.parentClient.id}`}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                >
                  Parent: {client.parentClient.name}
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/clients/${client.id}/prep`}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <PhoneCall className="h-4 w-4" />
              Prepare for Call
            </Link>
            <ClientActions client={client} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Classification & Status - MOVED TO TOP */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Classification</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Deal Type</label>
                <p className="mt-1 font-medium">
                  <ClassificationBadge classification={client.classification} />
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Deal-Behind-Spec</label>
                <p className="mt-1 font-medium">
                  {client.dealBehindSpec ? (
                    <span className="text-green-600">Yes - committed to paid engagement</span>
                  ) : (
                    <span className="text-gray-500">No</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Sales Pipeline */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Sales Pipeline
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-gray-500">Deal Value</label>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {client.dealValue ? formatDealValue(client.dealValue) : '—'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Sales Stage</label>
                <p className="mt-1">
                  <SalesStageBadge stage={client.salesStage as SalesStage | null} />
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Deal Owner</label>
                <p className="mt-1 flex items-center gap-2">
                  {client.dealOwner ? (
                    <>
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{client.dealOwner}</span>
                    </>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Last Imported</label>
                <p className="mt-1 text-sm text-gray-600">
                  {client.lastImportedAt
                    ? new Date(client.lastImportedAt).toLocaleString()
                    : '—'}
                </p>
              </div>
            </div>
            {client.nextStepNotes && (
              <div className="mt-4 pt-4 border-t">
                <label className="text-sm text-gray-500">Next Step</label>
                <p className="mt-1 text-gray-900">{client.nextStepNotes}</p>
              </div>
            )}
          </div>

          {/* Sales Tasks - Using TaskCard component */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-amber-600" />
                Tasks ({client.salesTasks.length})
              </h2>
            </div>
            {client.salesTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckSquare className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>No tasks assigned</p>
              </div>
            ) : (
              <div className="space-y-3">
                {client.salesTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={{
                      id: task.id,
                      description: task.description,
                      dueDate: task.dueDate?.toISOString() || null,
                      status: task.status || 'OPEN',
                      completed: task.completed,
                      completedAt: task.completedAt?.toISOString() || null,
                      owner: task.owner,
                      isOverdue: task.isOverdue,
                      priority: task.priority,
                      updatedAt: task.updatedAt.toISOString(),
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sub-deals - NEW (if any) */}
          {client.subDeals && client.subDeals.length > 0 && (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Sub-Deals ({client.subDeals.length})
              </h2>
              <div className="space-y-2">
                {client.subDeals.map((subDeal) => (
                  <Link
                    key={subDeal.id}
                    href={`/clients/${subDeal.id}`}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                  >
                    <span className="font-medium text-gray-900">{subDeal.name}</span>
                    <div className="flex items-center gap-3">
                      {subDeal.dealValue && (
                        <span className="text-sm font-medium text-gray-600">
                          {formatDealValue(subDeal.dealValue)}
                        </span>
                      )}
                      <SalesStageBadge stage={subDeal.salesStage as SalesStage | null} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Company Intelligence */}
          <ClientIntelligenceSection
            clientId={client.id}
            clientName={client.name}
            websiteUrl={client.website}
            vertical={client.vertical}
            existingIntelligence={client.intelligence ? {
              companyDescription: client.intelligence.companyDescription ?? undefined,
              companySize: client.intelligence.companySize ?? undefined,
              estimatedEmployees: client.intelligence.estimatedEmployees ?? undefined,
              industry: client.intelligence.industry ?? undefined,
              leadershipTeam: client.intelligence.leadershipTeam ? JSON.parse(client.intelligence.leadershipTeam) : [],
              currentCreativeApproach: client.intelligence.currentCreativeApproach ?? undefined,
              suggestedTalkingPoints: client.intelligence.suggestedTalkingPoints ? JSON.parse(client.intelligence.suggestedTalkingPoints) : [],
              suggestedQuestions: client.intelligence.suggestedQuestions ? JSON.parse(client.intelligence.suggestedQuestions) : [],
              websiteAnalyzedAt: client.intelligence.websiteAnalyzedAt,
            } : null}
          />

          {/* Red Flags */}
          {redFlags.length > 0 && (
            <div className="rounded-xl bg-red-50 p-6 shadow-sm border border-red-200">
              <h2 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Red Flags ({redFlags.length})
              </h2>
              <div className="space-y-2">
                {redFlags.map((flag: string) => {
                  const flagInfo = RED_FLAGS.find(f => f.value === flag);
                  return (
                    <div
                      key={flag}
                      className={`rounded-lg px-3 py-2 text-sm font-medium ${
                        flagInfo?.severity === 'critical'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {flagInfo?.label || flag}
                      <span className="ml-2 text-xs opacity-75">
                        ({flagInfo?.severity || 'warning'})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Qualification Calls */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Qualification Calls</h2>
              <Link
                href={`/clients/${client.id}/qualification`}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Manage Calls
              </Link>
            </div>
            <div className="space-y-3">
              {QUALIFICATION_CALLS.map((call) => {
                const completed = client.qualificationCalls.find(
                  c => c.callNumber === call.number && c.completed
                );
                return (
                  <Link
                    key={call.number}
                    href={`/clients/${client.id}/qualification?call=${call.number}`}
                    className={`flex items-center gap-4 rounded-lg border p-4 transition-colors hover:shadow-md ${
                      completed ? 'bg-green-50 border-green-200 hover:bg-green-100' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      completed ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                    }`}>
                      {completed ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <span className="font-semibold">{call.number}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{call.label}</div>
                      <div className="text-sm text-gray-500">{call.day} - {call.goal}</div>
                    </div>
                    {completed && (
                      <div className="text-sm text-gray-500">
                        <Calendar className="inline h-3 w-3 mr-1" />
                        {new Date(completed.completedAt!).toLocaleDateString()}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Projects */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Projects ({client.projects.length})
              </h2>
              <Link
                href={`/projects/new?clientId=${client.id}`}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                New Project
              </Link>
            </div>
            {client.projects.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>No projects yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {client.projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{project.name}</div>
                        <div className="text-sm text-gray-500">{project.jobId}</div>
                      </div>
                      <ProjectStatusBadge status={project.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          {client.notes && (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {client.qualificationScore}%
                </div>
                <div className="text-sm text-gray-500">Qualification Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {client.qualificationCalls.filter(c => c.completed).length}/4
                </div>
                <div className="text-sm text-gray-500">Calls Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {client.projects.length}
                </div>
                <div className="text-sm text-gray-500">Projects</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600">
                  {client.salesTasks.filter(t => !t.completed).length}
                </div>
                <div className="text-sm text-gray-500">Open Tasks</div>
              </div>
            </div>
          </div>

          {/* Contacts */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <ContactsList
              contacts={client.contacts}
              clientId={client.id}
              clientName={client.name}
            />
          </div>

          {/* Conversations - MOVED TO SIDEBAR */}
          <ConversationsWidget
            clientId={client.id}
            conversations={client.conversations.map(c => ({
              id: c.id,
              meetingDate: c.meetingDate?.toISOString() || null,
              meetingStage: c.meetingStage,
              transcriptSource: c.transcriptSource,
              processed: c.processed,
              createdAt: c.createdAt.toISOString(),
            }))}
          />

          {/* Timeline */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-900">
                  {new Date(client.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last Updated</span>
                <span className="text-gray-900">
                  {new Date(client.updatedAt).toLocaleDateString()}
                </span>
              </div>
              {client.lastImportedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Imported</span>
                  <span className="text-gray-900">
                    {new Date(client.lastImportedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SalesStageBadge({ stage }: { stage: SalesStage | null }) {
  if (!stage) {
    return <span className="text-gray-400">—</span>;
  }

  const label = SALES_STAGE_LABELS[stage] || stage;
  const colorClass = SALES_STAGE_COLORS[stage] || 'bg-gray-100 text-gray-700';

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
}

function ClassificationBadge({ classification }: { classification: string }) {
  const config: Record<string, { label: string; className: string }> = {
    SYSTEM: { label: 'System Deal', className: 'bg-green-100 text-green-700' },
    PROJECT: { label: 'Project Deal', className: 'bg-blue-100 text-blue-700' },
    UNDETERMINED: { label: 'Undetermined', className: 'bg-gray-100 text-gray-700' },
  };

  const { label, className } = config[classification] || config.UNDETERMINED;

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function QualificationBadge({ qualified, score }: { qualified: boolean; score: number }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        qualified
          ? 'bg-green-100 text-green-700'
          : score < 30
          ? 'bg-red-100 text-red-700'
          : 'bg-yellow-100 text-yellow-700'
      }`}
    >
      {qualified ? (
        <>
          <CheckCircle2 className="h-3 w-3" />
          Qualified
        </>
      ) : score < 30 ? (
        <>
          <AlertTriangle className="h-3 w-3" />
          At Risk
        </>
      ) : (
        'In Progress'
      )}
    </span>
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
