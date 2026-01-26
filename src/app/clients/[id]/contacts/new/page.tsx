'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, User, Briefcase, Mail, Phone, Linkedin, Save } from 'lucide-react';
import {
  SENIORITY_LEVELS,
  DECISION_AUTHORITY,
  BUYING_ROLES,
  CONTACT_DEPARTMENTS,
} from '@/lib/constants/contact-intelligence';
import { analyzeTitleIntelligence } from '@/lib/title-intelligence';

interface Client {
  id: string;
  name: string;
}

export default function NewContactPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    jobTitle: '',
    department: '',
    seniority: '',
    decisionAuthority: '',
    buyingRole: '',
    linkedInUrl: '',
    isPrimary: false,
    notes: '',
  });

  // Auto-inferred values from job title
  const [inferred, setInferred] = useState<{
    seniority?: string;
    department?: string;
    decisionAuthority?: string;
  }>({});

  // Fetch client info
  useEffect(() => {
    async function fetchClient() {
      try {
        const response = await fetch(`/api/clients/${clientId}`);
        if (response.ok) {
          const data = await response.json();
          setClient(data);
        } else {
          setError('Client not found');
        }
      } catch {
        setError('Failed to load client');
      } finally {
        setIsLoading(false);
      }
    }

    fetchClient();
  }, [clientId]);

  // Auto-infer intelligence when job title changes
  useEffect(() => {
    if (formData.jobTitle) {
      const analysis = analyzeTitleIntelligence(formData.jobTitle);
      if (analysis) {
        setInferred({
          seniority: analysis.seniority,
          department: analysis.department,
          decisionAuthority: analysis.suggestedAuthority || undefined,
        });
      }
    } else {
      setInferred({});
    }
  }, [formData.jobTitle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/clients/${clientId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          // Use inferred values if user hasn't selected explicitly
          seniority: formData.seniority || inferred.seniority,
          department: formData.department || inferred.department,
          decisionAuthority: formData.decisionAuthority || inferred.decisionAuthority,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create contact');
      }

      router.push(`/clients/${clientId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error && !client) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <Link href="/clients" className="text-blue-600 hover:underline mt-2 inline-block">
          Back to Clients
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/clients/${clientId}`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {client?.name}
        </Link>

        <h1 className="text-2xl font-bold text-gray-900">Add Contact</h1>
        <p className="text-gray-500 mt-1">Add a new contact for {client?.name}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-gray-400" />
            Basic Information
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                placeholder="John Smith"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1 relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="block w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <div className="mt-1 relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="block w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="linkedIn" className="block text-sm font-medium text-gray-700">
                LinkedIn URL
              </label>
              <div className="mt-1 relative">
                <Linkedin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="url"
                  id="linkedIn"
                  value={formData.linkedInUrl}
                  onChange={(e) => setFormData({ ...formData, linkedInUrl: e.target.value })}
                  className="block w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="https://linkedin.com/in/johnsmith"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPrimary"
                checked={formData.isPrimary}
                onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isPrimary" className="text-sm text-gray-700">
                Set as primary contact
              </label>
            </div>
          </div>
        </div>

        {/* Job Intelligence */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-gray-400" />
            Job Information
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700">
                Job Title
              </label>
              <input
                type="text"
                id="jobTitle"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                placeholder="VP of Marketing"
              />
              {inferred.seniority && (
                <p className="mt-1 text-xs text-gray-500">
                  Auto-detected: {SENIORITY_LEVELS.find(s => s.value === inferred.seniority)?.label} level,{' '}
                  {CONTACT_DEPARTMENTS.find(d => d.value === inferred.department)?.label || 'Other'} department
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <select
                  id="department"
                  value={formData.department || inferred.department || ''}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select department</option>
                  {CONTACT_DEPARTMENTS.map((dept) => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="seniority" className="block text-sm font-medium text-gray-700">
                  Seniority Level
                </label>
                <select
                  id="seniority"
                  value={formData.seniority || inferred.seniority || ''}
                  onChange={(e) => setFormData({ ...formData, seniority: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select seniority</option>
                  {SENIORITY_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="decisionAuthority" className="block text-sm font-medium text-gray-700">
                  Decision Authority
                </label>
                <select
                  id="decisionAuthority"
                  value={formData.decisionAuthority || inferred.decisionAuthority || ''}
                  onChange={(e) => setFormData({ ...formData, decisionAuthority: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select authority</option>
                  {DECISION_AUTHORITY.map((auth) => (
                    <option key={auth.value} value={auth.value}>
                      {auth.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="buyingRole" className="block text-sm font-medium text-gray-700">
                  Buying Role
                </label>
                <select
                  id="buyingRole"
                  value={formData.buyingRole}
                  onChange={(e) => setFormData({ ...formData, buyingRole: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select role</option>
                  {BUYING_ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            id="notes"
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
            placeholder="Any additional notes about this contact..."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href={`/clients/${clientId}`}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving || !formData.name}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Contact
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
