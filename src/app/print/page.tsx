'use client';

import { useState, useEffect } from 'react';
import { Printer, FileText, Loader2 } from 'lucide-react';
import { FOLDER_PARTITIONS } from '@/lib/constants';

interface Project {
  id: string;
  name: string;
  jobId: string;
  type: string;
  producer: string | null;
  finalDueDate: string | null;
  acv: number | null;
  monthlyFee: number | null;
  client: {
    id: string;
    name: string;
    contacts?: Array<{
      id: string;
      name: string;
      role: string | null;
      jobTitle: string | null;
      email: string | null;
      phone: string | null;
    }>;
  };
  deliverables?: Array<{
    totalCount: number;
    monthlyCount: number;
  }>;
  estimates?: Array<{
    setupDays: number;
    totalMonthlyDays: number;
  }>;
}

export default function PrintFormsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProject, setLoadingProject] = useState(false);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch('/api/projects');
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  useEffect(() => {
    async function fetchProject() {
      if (!selectedProjectId) {
        setProject(null);
        return;
      }
      setLoadingProject(true);
      try {
        const response = await fetch(`/api/projects/${selectedProjectId}`);
        if (response.ok) {
          const data = await response.json();
          setProject(data);
        }
      } catch (err) {
        console.error('Error fetching project:', err);
      } finally {
        setLoadingProject(false);
      }
    }
    fetchProject();
  }, [selectedProjectId]);

  const handlePrint = () => {
    window.print();
  };

  // Use project data or blank placeholders
  const jobId = project?.jobId || '________________';
  const clientName = project?.client?.name || '________________';
  const projectName = project?.name || '________________';
  const projectType = project?.type || '________________';
  const producer = project?.producer || '________________';
  const dueDate = project?.finalDueDate
    ? new Date(project.finalDueDate).toLocaleDateString()
    : '________________';
  const acv = project?.acv
    ? `$${project.acv.toLocaleString()}`
    : '$________________';
  const monthlyFee = project?.monthlyFee
    ? `$${project.monthlyFee.toLocaleString()}`
    : '$________________';
  const contacts = project?.client?.contacts || [];
  const totalAssets = project?.deliverables?.reduce((sum, d) => sum + d.totalCount, 0) || '-';
  const monthlyAssets = project?.deliverables?.reduce((sum, d) => sum + d.monthlyCount, 0) || '-';
  const setupDays = project?.estimates?.[0]?.setupDays || '-';
  const monthlyDays = project?.estimates?.[0]?.totalMonthlyDays || '-';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header - Not printed */}
      <div className="print:hidden mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Print Forms</h1>
            <p className="mt-1 text-gray-500">
              6-partition folder forms for physical project files
            </p>
          </div>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Printer className="h-4 w-4" />
            Print All Forms
          </button>
        </div>

        {/* Project Selector */}
        <div className="rounded-xl bg-white p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Project (Optional)</h2>
          <p className="text-sm text-gray-500 mb-4">
            Choose a project to populate forms with data, or leave blank for empty templates.
          </p>
          {loading ? (
            <div className="flex items-center gap-2 py-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading projects...
            </div>
          ) : (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Blank Templates (no project selected)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.client.name} - {p.name} ({p.jobId})
                </option>
              ))}
            </select>
          )}
          {loadingProject && (
            <div className="flex items-center gap-2 mt-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading project data...
            </div>
          )}
        </div>

        {/* Partition Navigation */}
        <div className="grid grid-cols-6 gap-2">
          {FOLDER_PARTITIONS.map((partition) => (
            <a
              key={partition.number}
              href={`#partition-${partition.number}`}
              className="rounded-lg border border-gray-200 p-3 text-center hover:bg-gray-50"
            >
              <div className="text-xs text-gray-500">#{partition.number}</div>
              <div className="text-sm font-medium text-gray-900">{partition.name}</div>
            </a>
          ))}
        </div>
      </div>

      {/* Printable Forms */}
      <div className="space-y-8 print:space-y-0">
        {/* Partition 1: Project Overview */}
        <section id="partition-1" className="print:break-after-page">
          <div className="print:hidden mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Partition 1: Project Overview
            </h2>
          </div>
          <div className="border border-gray-300 rounded-lg p-8 bg-white print:border-2 print:border-black print:rounded-none">
            <div className="text-center border-b-2 border-black pb-4 mb-6">
              <h1 className="text-2xl font-bold">PROJECT OVERVIEW</h1>
              <div className="text-lg font-mono mt-2">{jobId}</div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                  Client
                </label>
                <div className="text-lg font-semibold border-b border-gray-300 pb-1">
                  {clientName}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                  Project Name
                </label>
                <div className="text-lg font-semibold border-b border-gray-300 pb-1">
                  {projectName}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                  Project Type
                </label>
                <div className="border-b border-gray-300 pb-1">{projectType}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                  Producer
                </label>
                <div className="border-b border-gray-300 pb-1">{producer}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                  Due Date
                </label>
                <div className="border-b border-gray-300 pb-1">{dueDate}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                  ACV
                </label>
                <div className="text-lg font-semibold border-b border-gray-300 pb-1">{acv}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                  Monthly Fee
                </label>
                <div className="text-lg font-semibold border-b border-gray-300 pb-1">{monthlyFee}</div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-medium text-gray-500 uppercase mb-2">
                Key Contacts
              </label>
              <div className="border border-gray-200 rounded">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-3 py-2 font-medium">Name</th>
                      <th className="text-left px-3 py-2 font-medium">Role</th>
                      <th className="text-left px-3 py-2 font-medium">Email</th>
                      <th className="text-left px-3 py-2 font-medium">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.length > 0 ? (
                      contacts.slice(0, 4).map((contact) => (
                        <tr key={contact.id} className="border-t border-gray-200">
                          <td className="px-3 py-2">{contact.name}</td>
                          <td className="px-3 py-2">{contact.role || contact.jobTitle || '-'}</td>
                          <td className="px-3 py-2">{contact.email || '-'}</td>
                          <td className="px-3 py-2">{contact.phone || '-'}</td>
                        </tr>
                      ))
                    ) : (
                      [1, 2, 3, 4].map((i) => (
                        <tr key={i} className="border-t border-gray-200">
                          <td className="px-3 py-2">________________</td>
                          <td className="px-3 py-2">________________</td>
                          <td className="px-3 py-2">________________</td>
                          <td className="px-3 py-2">________________</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-2">
                Deliverables Summary
              </label>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="border border-gray-200 rounded p-3">
                  <div className="text-2xl font-bold">{totalAssets}</div>
                  <div className="text-xs text-gray-500">Total Assets</div>
                </div>
                <div className="border border-gray-200 rounded p-3">
                  <div className="text-2xl font-bold">{monthlyAssets}</div>
                  <div className="text-xs text-gray-500">Monthly</div>
                </div>
                <div className="border border-gray-200 rounded p-3">
                  <div className="text-2xl font-bold">{setupDays}</div>
                  <div className="text-xs text-gray-500">Setup Days</div>
                </div>
                <div className="border border-gray-200 rounded p-3">
                  <div className="text-2xl font-bold">{monthlyDays}</div>
                  <div className="text-xs text-gray-500">Days/Month</div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-400 text-center">
              Generated {new Date().toLocaleDateString()} | Kartel Sales Prod
            </div>
          </div>
        </section>

        {/* Partition 2: Milestones */}
        <section id="partition-2" className="print:break-after-page">
          <div className="print:hidden mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Partition 2: Milestones by Department
            </h2>
          </div>
          <div className="border border-gray-300 rounded-lg p-8 bg-white print:border-2 print:border-black print:rounded-none">
            <div className="text-center border-b-2 border-black pb-4 mb-6">
              <h1 className="text-2xl font-bold">MILESTONES BY DEPARTMENT</h1>
              <div className="text-lg font-mono mt-2">{jobId} | {clientName}</div>
            </div>

            <div className="space-y-6">
              {['Sales', 'Production', 'LoRA', 'GenEngineering', 'Creative'].map((dept) => (
                <div key={dept} className="border border-gray-200 rounded p-4">
                  <h3 className="font-semibold text-lg mb-3 border-b pb-2">{dept}</h3>
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-6 h-6 border-2 border-gray-400 rounded" />
                        <div className="flex-1 border-b border-gray-200 py-2">
                          <span className="text-gray-400">Milestone {i}</span>
                        </div>
                        <div className="text-sm text-gray-400 w-24">Date: _______</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-400 text-center">
              Generated {new Date().toLocaleDateString()} | Kartel Sales Prod
            </div>
          </div>
        </section>

        {/* Partition 3: Pre-Production Questions */}
        <section id="partition-3" className="print:break-after-page">
          <div className="print:hidden mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Partition 3: Pre-Production Questions
            </h2>
          </div>
          <div className="border border-gray-300 rounded-lg p-8 bg-white print:border-2 print:border-black print:rounded-none">
            <div className="text-center border-b-2 border-black pb-4 mb-6">
              <h1 className="text-2xl font-bold">PRE-PRODUCTION QUESTIONS</h1>
              <div className="text-lg font-mono mt-2">{jobId} | {clientName}</div>
            </div>

            <div className="space-y-6">
              {[
                'What is the primary goal of this creative?',
                'Who is the target audience?',
                'What are the key brand guidelines to follow?',
                'Are there any specific color palettes or fonts required?',
                'What tone should the creative convey?',
                'Are there reference images or inspiration pieces?',
                'What are the must-have elements?',
                'What should be avoided?',
                'What is the approval process?',
                'Who has final approval authority?',
              ].map((question, i) => (
                <div key={i}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {i + 1}. {question}
                  </label>
                  <div className="h-16 border border-gray-300 rounded bg-gray-50" />
                </div>
              ))}
            </div>

            <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-400 text-center">
              Generated {new Date().toLocaleDateString()} | Kartel Sales Prod
            </div>
          </div>
        </section>

        {/* Partition 4: Standard Project Checklist */}
        <section id="partition-4" className="print:break-after-page">
          <div className="print:hidden mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Partition 4: Standard Project Checklist
            </h2>
          </div>
          <div className="border border-gray-300 rounded-lg p-8 bg-white print:border-2 print:border-black print:rounded-none">
            <div className="text-center border-b-2 border-black pb-4 mb-6">
              <h1 className="text-2xl font-bold">STANDARD PROJECT CHECKLIST</h1>
              <div className="text-lg font-mono mt-2">{jobId} | {clientName}</div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 border-b pb-2">Pre-Production</h3>
                {[
                  'Brand assets received',
                  'Style guide reviewed',
                  'Reference images collected',
                  'Deliverables list finalized',
                  'Timeline confirmed',
                  'Team assigned',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <div className="w-5 h-5 border-2 border-gray-400 rounded" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="font-semibold mb-3 border-b pb-2">Production</h3>
                {[
                  'Initial concepts approved',
                  'First draft complete',
                  'Client review #1 complete',
                  'Revisions addressed',
                  'Final approval received',
                  'Files delivered',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <div className="w-5 h-5 border-2 border-gray-400 rounded" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="font-semibold mb-3 border-b pb-2">Quality Control</h3>
                {[
                  'File naming correct',
                  'Dimensions verified',
                  'Color profiles correct',
                  'Text/copy verified',
                  'Brand compliance checked',
                  'Final QC passed',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <div className="w-5 h-5 border-2 border-gray-400 rounded" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="font-semibold mb-3 border-b pb-2">Delivery</h3>
                {[
                  'Files organized',
                  'Uploaded to delivery platform',
                  'Client notified',
                  'Download confirmed',
                  'Feedback received',
                  'Project closed',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <div className="w-5 h-5 border-2 border-gray-400 rounded" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-400 text-center">
              Generated {new Date().toLocaleDateString()} | Kartel Sales Prod
            </div>
          </div>
        </section>

        {/* Partition 5: Advanced Project Checklist */}
        <section id="partition-5" className="print:break-after-page">
          <div className="print:hidden mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Partition 5: Advanced Project Checklist (LoRA + Gen)
            </h2>
          </div>
          <div className="border border-gray-300 rounded-lg p-8 bg-white print:border-2 print:border-black print:rounded-none">
            <div className="text-center border-b-2 border-black pb-4 mb-6">
              <h1 className="text-2xl font-bold">ADVANCED PROJECT CHECKLIST</h1>
              <div className="text-sm text-gray-500">LoRA + Generative Workflows</div>
              <div className="text-lg font-mono mt-2">{jobId} | {clientName}</div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 border-b pb-2">LoRA Training</h3>
                {[
                  'Training images collected (50+)',
                  'Image quality verified',
                  'Training captions written',
                  'LoRA training initiated',
                  'Training complete',
                  'LoRA tested and approved',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <div className="w-5 h-5 border-2 border-gray-400 rounded" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="font-semibold mb-3 border-b pb-2">Workflow Setup</h3>
                {[
                  'Workflow requirements defined',
                  'Custom nodes identified',
                  'Workflow built',
                  'Test generations complete',
                  'Quality threshold met',
                  'Production ready',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <div className="w-5 h-5 border-2 border-gray-400 rounded" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="font-semibold mb-3 border-b pb-2">Generation</h3>
                {[
                  'Batch 1 generated',
                  'Internal QC passed',
                  'Client review submitted',
                  'Feedback incorporated',
                  'Final batch complete',
                  'All outputs approved',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <div className="w-5 h-5 border-2 border-gray-400 rounded" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="font-semibold mb-3 border-b pb-2">Documentation</h3>
                {[
                  'LoRA settings documented',
                  'Workflow saved to library',
                  'Prompt templates saved',
                  'Technical notes written',
                  'Replication guide complete',
                  'Team training done',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <div className="w-5 h-5 border-2 border-gray-400 rounded" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-400 text-center">
              Generated {new Date().toLocaleDateString()} | Kartel Sales Prod
            </div>
          </div>
        </section>

        {/* Partition 6: Finishing + Post Mortem */}
        <section id="partition-6">
          <div className="print:hidden mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Partition 6: Finishing + Post Mortem
            </h2>
          </div>
          <div className="border border-gray-300 rounded-lg p-8 bg-white print:border-2 print:border-black print:rounded-none">
            <div className="text-center border-b-2 border-black pb-4 mb-6">
              <h1 className="text-2xl font-bold">FINISHING + POST MORTEM</h1>
              <div className="text-lg font-mono mt-2">{jobId} | {clientName}</div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="font-semibold mb-3 border-b pb-2">Final Delivery</h3>
                {[
                  'All deliverables approved',
                  'Final files organized',
                  'Delivery complete',
                  'Client confirmation received',
                  'Invoice sent',
                  'Payment received',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <div className="w-5 h-5 border-2 border-gray-400 rounded" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="font-semibold mb-3 border-b pb-2">Closing Tasks</h3>
                {[
                  'Project folder archived',
                  'Lessons learned documented',
                  'Case study materials gathered',
                  'Testimonial requested',
                  'Renewal opportunity assessed',
                  'Handoff to sales complete',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <div className="w-5 h-5 border-2 border-gray-400 rounded" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What went well?
                </label>
                <div className="h-20 border border-gray-300 rounded bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What could be improved?
                </label>
                <div className="h-20 border border-gray-300 rounded bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key learnings for future projects
                </label>
                <div className="h-20 border border-gray-300 rounded bg-gray-50" />
              </div>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div className="border border-gray-200 rounded p-4">
                <div className="text-xs text-gray-500 mb-1">Actual Margin</div>
                <div className="text-xl font-bold">______%</div>
              </div>
              <div className="border border-gray-200 rounded p-4">
                <div className="text-xs text-gray-500 mb-1">Client Satisfaction</div>
                <div className="text-xl font-bold">____ / 10</div>
              </div>
              <div className="border border-gray-200 rounded p-4">
                <div className="text-xs text-gray-500 mb-1">Renewal Likelihood</div>
                <div className="text-xl font-bold">_____%</div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-400 text-center">
              Generated {new Date().toLocaleDateString()} | Kartel Sales Prod
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
