import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/db';
import {
  ArrowLeft,
  Mail,
  Phone,
  Linkedin,
  Twitter,
  Github,
  MapPin,
  Building2,
  Briefcase,
  Crown,
  DollarSign,
  Star,
  User,
  Shield,
  Calendar,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { getSeniorityLabel, getDecisionAuthorityInfo, getBuyingRoleInfo } from '@/lib/constants/contact-intelligence';
import ContactEnrichButton from './ContactEnrichButton';

async function getContact(clientId: string, contactId: string) {
  const contact = await prisma.contact.findFirst({
    where: {
      id: contactId,
      clientId: clientId,
    },
    include: {
      client: true,
    },
  });

  return contact;
}

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string; contactId: string }>;
}) {
  const { id: clientId, contactId } = await params;
  const contact = await getContact(clientId, contactId);

  if (!contact) {
    notFound();
  }

  const employmentHistory = contact.employmentHistory
    ? JSON.parse(contact.employmentHistory)
    : [];

  const authorityInfo = getDecisionAuthorityInfo(contact.decisionAuthority);
  const buyingRoleInfo = getBuyingRoleInfo(contact.buyingRole);
  const seniorityLabel = getSeniorityLabel(contact.seniority);

  // Format location
  const locationParts = [contact.city, contact.state, contact.country].filter(Boolean);
  const location = locationParts.join(', ');

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/clients/${clientId}`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {contact.client.name}
        </Link>

        <div className="flex items-start gap-6">
          {/* Profile Photo */}
          {contact.photoUrl ? (
            <img
              src={contact.photoUrl}
              alt={contact.name}
              className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg"
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg">
              <User className="h-12 w-12 text-gray-400" />
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-gray-900">{contact.name}</h1>
              {contact.isPrimary && (
                <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                  Primary Contact
                </span>
              )}
            </div>

            {contact.jobTitle && (
              <p className="text-lg text-gray-600 mt-1">{contact.jobTitle}</p>
            )}

            {contact.headline && (
              <p className="text-sm text-gray-500 mt-1">{contact.headline}</p>
            )}

            <div className="flex items-center gap-2 mt-3">
              <ContactEnrichButton contactId={contact.id} enrichedAt={contact.enrichedAt} />
              <Link
                href={`/clients/${clientId}/contacts/${contactId}/edit`}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Edit Contact
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-4">
              {contact.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {contact.email}
                    </a>
                    {contact.emailStatus && (
                      <span className={`ml-2 inline-flex items-center gap-1 text-xs ${
                        contact.emailStatus === 'verified'
                          ? 'text-green-600'
                          : contact.emailStatus === 'guessed'
                          ? 'text-yellow-600'
                          : 'text-gray-500'
                      }`}>
                        {contact.emailStatus === 'verified' ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <AlertCircle className="h-3 w-3" />
                        )}
                        {contact.emailStatus}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {contact.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">{contact.phone}</span>
                </div>
              )}

              {location && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">{location}</span>
                </div>
              )}

              {contact.client && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-gray-400" />
                  <Link
                    href={`/clients/${clientId}`}
                    className="text-blue-600 hover:underline"
                  >
                    {contact.client.name}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Social Links */}
          {(contact.linkedInUrl || contact.twitterUrl || contact.githubUrl || contact.facebookUrl) && (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Social Profiles</h2>
              <div className="flex flex-wrap gap-3">
                {contact.linkedInUrl && (
                  <a
                    href={contact.linkedInUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {contact.twitterUrl && (
                  <a
                    href={contact.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100"
                  >
                    <Twitter className="h-4 w-4" />
                    Twitter
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {contact.githubUrl && (
                  <a
                    href={contact.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                  >
                    <Github className="h-4 w-4" />
                    GitHub
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Employment History */}
          {employmentHistory.length > 0 && (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Employment History</h2>
              <div className="space-y-4">
                {employmentHistory.map((job: {
                  organization_name: string;
                  title: string;
                  start_date?: string;
                  end_date?: string;
                  current?: boolean;
                }, index: number) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 ${
                      index === 0 ? '' : 'border-t border-gray-100 pt-4'
                    }`}
                  >
                    <Briefcase className={`h-5 w-5 ${job.current ? 'text-blue-500' : 'text-gray-400'}`} />
                    <div>
                      <div className="font-medium text-gray-900">
                        {job.title}
                        {job.current && (
                          <span className="ml-2 text-xs text-blue-600">(Current)</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">{job.organization_name}</div>
                      {(job.start_date || job.end_date) && (
                        <div className="text-xs text-gray-500 mt-1">
                          {job.start_date || '?'} - {job.current ? 'Present' : job.end_date || '?'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {contact.notes && (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{contact.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Decision Authority */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Decision Authority</h3>

            {authorityInfo ? (
              <div className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                contact.decisionAuthority === 'DECISION_MAKER'
                  ? 'bg-green-100 text-green-700'
                  : contact.decisionAuthority === 'BUDGET_HOLDER'
                  ? 'bg-blue-100 text-blue-700'
                  : contact.decisionAuthority === 'INFLUENCER'
                  ? 'bg-yellow-100 text-yellow-700'
                  : contact.decisionAuthority === 'GATEKEEPER'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {contact.decisionAuthority === 'DECISION_MAKER' && <Crown className="h-4 w-4" />}
                {contact.decisionAuthority === 'BUDGET_HOLDER' && <DollarSign className="h-4 w-4" />}
                {contact.decisionAuthority === 'INFLUENCER' && <Star className="h-4 w-4" />}
                {contact.decisionAuthority === 'END_USER' && <User className="h-4 w-4" />}
                {contact.decisionAuthority === 'GATEKEEPER' && <Shield className="h-4 w-4" />}
                {authorityInfo.label}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Not specified</p>
            )}

            {buyingRoleInfo && (
              <div className="mt-3">
                <span className="text-xs text-gray-500">Buying Role:</span>
                <div className="inline-flex ml-2 items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                  {buyingRoleInfo.label}
                </div>
              </div>
            )}
          </div>

          {/* Job Intelligence */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Job Intelligence</h3>
            <div className="space-y-3">
              {seniorityLabel && (
                <div>
                  <span className="text-xs text-gray-500">Seniority</span>
                  <p className="text-sm font-medium text-gray-900">{seniorityLabel}</p>
                </div>
              )}
              {contact.department && (
                <div>
                  <span className="text-xs text-gray-500">Department</span>
                  <p className="text-sm font-medium text-gray-900">
                    {contact.department.replace(/_/g, ' ')}
                  </p>
                </div>
              )}
              {contact.seniorityScore && (
                <div>
                  <span className="text-xs text-gray-500">Seniority Score</span>
                  <p className="text-sm font-medium text-gray-900">{contact.seniorityScore}/10</p>
                </div>
              )}
            </div>
          </div>

          {/* Engagement */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Engagement</h3>
            <div className="space-y-3">
              {contact.lastContactedAt && (
                <div>
                  <span className="text-xs text-gray-500">Last Contacted</span>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(contact.lastContactedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              {contact.engagementScore && (
                <div>
                  <span className="text-xs text-gray-500">Engagement Score</span>
                  <p className="text-sm font-medium text-gray-900">{contact.engagementScore}%</p>
                </div>
              )}
            </div>
          </div>

          {/* Enrichment Status */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Data Source</h3>
            {contact.enrichedAt ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-900">
                    Enriched via {contact.enrichmentSource || 'Apollo'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  <Calendar className="inline h-3 w-3 mr-1" />
                  {new Date(contact.enrichedAt).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Not enriched yet</p>
            )}
          </div>

          {/* Timestamps */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-900">
                  {new Date(contact.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Updated</span>
                <span className="text-gray-900">
                  {new Date(contact.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
