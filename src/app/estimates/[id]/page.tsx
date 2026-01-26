import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/db';
import {
  ArrowLeft,
  Calculator,
  Calendar,
  Building2,
  FileText,
  Zap,
  Cpu,
  Users,
  Clock,
  Pencil,
} from 'lucide-react';

async function getEstimate(id: string) {
  const estimate = await prisma.estimate.findUnique({
    where: { id },
    include: {
      project: {
        include: {
          client: true,
          deliverables: true,
        },
      },
    },
  });

  return estimate;
}

export default async function EstimateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const estimate = await getEstimate(id);

  if (!estimate) {
    notFound();
  }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/projects/${estimate.project.id}`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Project
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{estimate.name}</h1>
            <div className="mt-2 flex items-center gap-4 text-gray-500">
              <Link
                href={`/projects/${estimate.project.id}`}
                className="flex items-center gap-1 hover:text-blue-600"
              >
                <FileText className="h-4 w-4" />
                {estimate.project.name}
              </Link>
              <Link
                href={`/clients/${estimate.project.client.id}`}
                className="flex items-center gap-1 hover:text-blue-600"
              >
                <Building2 className="h-4 w-4" />
                {estimate.project.client.name}
              </Link>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Created {new Date(estimate.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                estimate.projectType === 'ADVANCED'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {estimate.projectType}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white">
          <div className="flex items-center gap-2 text-blue-100 text-sm">
            <Clock className="h-4 w-4" />
            Setup Days
          </div>
          <div className="text-4xl font-bold mt-2">{estimate.setupDays}</div>
          <div className="text-sm text-blue-100 mt-1">One-time setup</div>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white">
          <div className="flex items-center gap-2 text-purple-100 text-sm">
            <Calculator className="h-4 w-4" />
            Days/Month
          </div>
          <div className="text-4xl font-bold mt-2">{estimate.totalMonthlyDays}</div>
          <div className="text-sm text-purple-100 mt-1">Production effort</div>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white">
          <div className="flex items-center gap-2 text-green-100 text-sm">
            <FileText className="h-4 w-4" />
            Total Assets
          </div>
          <div className="text-4xl font-bold mt-2">{estimate.totalAssets}</div>
          <div className="text-sm text-green-100 mt-1">
            Over {estimate.contractMonths} months
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white">
          <div className="flex items-center gap-2 text-orange-100 text-sm">
            <Calendar className="h-4 w-4" />
            Contract
          </div>
          <div className="text-4xl font-bold mt-2">{estimate.contractMonths}</div>
          <div className="text-sm text-orange-100 mt-1">Months</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Team Effort Breakdown */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-400" />
              Monthly Team Effort
            </h2>
            <div className="space-y-4">
              <EffortBar
                label="Gen Team"
                days={estimate.monthlyGenTeamDays}
                total={estimate.totalMonthlyDays}
                color="purple"
              />
              <EffortBar
                label="Production"
                days={estimate.monthlyProductionDays}
                total={estimate.totalMonthlyDays}
                color="blue"
              />
              <EffortBar
                label="Internal QC"
                days={estimate.monthlyQCDays}
                total={estimate.totalMonthlyDays}
                color="green"
              />
              <EffortBar
                label="Client Review"
                days={estimate.monthlyClientReviewDays}
                total={estimate.totalMonthlyDays}
                color="orange"
              />
            </div>
          </div>

          {/* Deliverables */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Deliverables ({estimate.project.deliverables.length})
            </h2>
            {estimate.project.deliverables.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>No deliverables defined yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 font-medium text-gray-500">Platform</th>
                      <th className="text-left py-2 font-medium text-gray-500">Type</th>
                      <th className="text-left py-2 font-medium text-gray-500">Size</th>
                      <th className="text-left py-2 font-medium text-gray-500">Duration</th>
                      <th className="text-right py-2 font-medium text-gray-500">Monthly</th>
                      <th className="text-right py-2 font-medium text-gray-500">Total</th>
                      <th className="text-right py-2 font-medium text-gray-500">Days/Mo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estimate.project.deliverables.map((d) => (
                      <tr key={d.id} className="border-b border-gray-100">
                        <td className="py-3">{d.platform}</td>
                        <td className="py-3">{d.creativeType}</td>
                        <td className="py-3">{d.size}</td>
                        <td className="py-3">{d.duration ? `${d.duration}s` : '-'}</td>
                        <td className="py-3 text-right">{d.monthlyCount}</td>
                        <td className="py-3 text-right">{d.totalCount}</td>
                        <td className="py-3 text-right font-medium">{d.estimatedDays.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50">
                      <td colSpan={4} className="py-3 font-medium">Total</td>
                      <td className="py-3 text-right font-medium">
                        {estimate.project.deliverables.reduce((sum, d) => sum + d.monthlyCount, 0)}
                      </td>
                      <td className="py-3 text-right font-medium">
                        {estimate.project.deliverables.reduce((sum, d) => sum + d.totalCount, 0)}
                      </td>
                      <td className="py-3 text-right font-bold">
                        {estimate.project.deliverables
                          .reduce((sum, d) => sum + d.estimatedDays, 0)
                          .toFixed(1)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Classification */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Classification</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    estimate.requiresLoRA
                      ? 'bg-purple-100 text-purple-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">LoRA Required</div>
                  <div className="text-sm text-gray-500">
                    {estimate.requiresLoRA ? 'Yes (+21 setup days)' : 'No'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    estimate.requiresCustomWorkflow
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Custom Workflow</div>
                  <div className="text-sm text-gray-500">
                    {estimate.requiresCustomWorkflow ? 'Yes (+14 setup days)' : 'No'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Contract Totals</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Setup Days</span>
                <span className="font-medium text-gray-900">{estimate.setupDays}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Monthly Days</span>
                <span className="font-medium text-gray-900">{estimate.totalMonthlyDays}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Contract Length</span>
                <span className="font-medium text-gray-900">{estimate.contractMonths} months</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="font-medium text-gray-700">Total Production Days</span>
                <span className="font-bold text-gray-900">
                  {(estimate.setupDays + estimate.totalMonthlyDays * estimate.contractMonths).toFixed(0)}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-900">
                  {new Date(estimate.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last Updated</span>
                <span className="text-gray-900">
                  {new Date(estimate.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Actions</h3>
            <div className="space-y-2">
              <Link
                href={`/estimates/${estimate.id}/edit`}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                <Pencil className="h-4 w-4" />
                Edit Estimate
              </Link>
              <Link
                href={`/projects/${estimate.project.id}`}
                className="block w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-center text-gray-700 hover:bg-gray-50"
              >
                View Project
              </Link>
              <Link
                href={`/estimates/new?projectId=${estimate.project.id}`}
                className="block w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-center text-gray-700 hover:bg-gray-50"
              >
                Create New Version
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EffortBar({
  label,
  days,
  total,
  color,
}: {
  label: string;
  days: number;
  total: number;
  color: 'purple' | 'blue' | 'green' | 'orange';
}) {
  const percentage = total > 0 ? (days / total) * 100 : 0;

  const colorClasses = {
    purple: 'bg-purple-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-medium text-gray-900">{days} days</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
