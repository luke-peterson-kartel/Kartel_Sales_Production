import Link from 'next/link';
import {
  Users,
  FolderKanban,
  ArrowRightLeft,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import prisma from '@/lib/db';

async function getDashboardStats() {
  const [
    clientCount,
    projectCount,
    activeProjects,
    pendingHandoffs,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.project.count(),
    prisma.project.count({
      where: {
        status: {
          in: ['ON_DECK', 'IN_SPEC', 'IN_PRODUCTION', 'FINISHING'],
        },
      },
    }),
    prisma.handoff.count({
      where: {
        status: 'PENDING',
      },
    }),
  ]);

  return {
    clientCount,
    projectCount,
    activeProjects,
    pendingHandoffs,
  };
}

async function getRecentProjects() {
  return prisma.project.findMany({
    take: 5,
    orderBy: { updatedAt: 'desc' },
    include: {
      client: true,
    },
  });
}

async function getPendingHandoffs() {
  return prisma.handoff.findMany({
    where: { status: 'PENDING' },
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      project: {
        include: {
          client: true,
        },
      },
    },
  });
}

export default async function Dashboard() {
  const stats = await getDashboardStats();
  const recentProjects = await getRecentProjects();
  const pendingHandoffs = await getPendingHandoffs();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-500">
            Overview of clients, projects, and handoffs
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/clients/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New Client
          </Link>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Clients"
          value={stats.clientCount}
          icon={Users}
          color="blue"
          href="/clients"
        />
        <StatCard
          title="Total Projects"
          value={stats.projectCount}
          icon={FolderKanban}
          color="purple"
          href="/projects"
        />
        <StatCard
          title="Active Projects"
          value={stats.activeProjects}
          icon={Clock}
          color="yellow"
          href="/projects?status=active"
        />
        <StatCard
          title="Pending Handoffs"
          value={stats.pendingHandoffs}
          icon={ArrowRightLeft}
          color="red"
          href="/handoffs?status=pending"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Recent Projects */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
            <Link href="/projects" className="text-sm text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>
          {recentProjects.length === 0 ? (
            <EmptyState
              message="No projects yet"
              action={{ label: 'Create Project', href: '/projects/new' }}
            />
          ) : (
            <div className="space-y-3">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{project.name}</p>
                    <p className="text-sm text-gray-500">{project.client.name}</p>
                  </div>
                  <StatusBadge status={project.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Pending Handoffs */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pending Handoffs</h2>
            <Link href="/handoffs" className="text-sm text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>
          {pendingHandoffs.length === 0 ? (
            <EmptyState
              message="No pending handoffs"
              icon={CheckCircle}
              iconColor="text-green-500"
            />
          ) : (
            <div className="space-y-3">
              {pendingHandoffs.map((handoff) => (
                <Link
                  key={handoff.id}
                  href={`/handoffs/${handoff.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      Handoff #{handoff.handoffNumber}: {handoff.type.replace(/_/g, ' → ').replace('TO', '')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {handoff.project.name} - {handoff.project.client.name}
                    </p>
                  </div>
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <QuickActionCard
            title="Pre-Call Prep"
            description="Prepare for a client call"
            href="/clients/new?mode=prep"
          />
          <QuickActionCard
            title="New Estimate"
            description="Calculate project scope"
            href="/estimates/new"
          />
          <QuickActionCard
            title="Create Handoff"
            description="Start a department handoff"
            href="/handoffs/new"
          />
          <QuickActionCard
            title="Print Forms"
            description="Generate folder packet"
            href="/print"
          />
        </div>
      </div>
    </div>
  );
}

// Components

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  href,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'purple' | 'yellow' | 'red';
  href: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <Link
      href={href}
      className="rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-center gap-4">
        <div className={`rounded-lg p-3 ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{title}</p>
        </div>
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    ON_DECK: { label: 'On Deck', className: 'bg-gray-100 text-gray-700' },
    IN_SPEC: { label: 'In Spec', className: 'bg-blue-100 text-blue-700' },
    IN_PRODUCTION: { label: 'In Production', className: 'bg-yellow-100 text-yellow-700' },
    FINISHING: { label: 'Finishing', className: 'bg-purple-100 text-purple-700' },
    COMPLETE: { label: 'Complete', className: 'bg-green-100 text-green-700' },
    CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
  };

  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-700' };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

function EmptyState({
  message,
  action,
  icon: Icon = AlertTriangle,
  iconColor = 'text-gray-400',
}: {
  message: string;
  action?: { label: string; href: string };
  icon?: React.ComponentType<{ className?: string }>;
  iconColor?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Icon className={`h-8 w-8 ${iconColor} mb-2`} />
      <p className="text-gray-500">{message}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
    >
      <p className="font-medium text-gray-900">{title}</p>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </Link>
  );
}
