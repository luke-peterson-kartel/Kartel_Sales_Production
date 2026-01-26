'use client';

import { Phone, Mail, ExternalLink, Crown, DollarSign, Star, User, Shield } from 'lucide-react';
import { getSeniorityLabel, getDecisionAuthorityInfo, getBuyingRoleInfo } from '@/lib/constants/contact-intelligence';

interface Contact {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  isPrimary: boolean;
  jobTitle?: string | null;
  department?: string | null;
  seniority?: string | null;
  seniorityScore?: number | null;
  decisionAuthority?: string | null;
  buyingRole?: string | null;
  linkedInUrl?: string | null;
}

interface ContactCardProps {
  contact: Contact;
  clientId: string;
  onEdit?: () => void;
}

export default function ContactCard({ contact, clientId, onEdit }: ContactCardProps) {
  const authorityInfo = getDecisionAuthorityInfo(contact.decisionAuthority);
  const buyingRoleInfo = getBuyingRoleInfo(contact.buyingRole);

  // Get authority icon
  const AuthorityIcon = () => {
    switch (contact.decisionAuthority) {
      case 'DECISION_MAKER':
        return <Crown className="h-3.5 w-3.5" />;
      case 'BUDGET_HOLDER':
        return <DollarSign className="h-3.5 w-3.5" />;
      case 'INFLUENCER':
        return <Star className="h-3.5 w-3.5" />;
      case 'END_USER':
        return <User className="h-3.5 w-3.5" />;
      case 'GATEKEEPER':
        return <Shield className="h-3.5 w-3.5" />;
      default:
        return null;
    }
  };

  // Get authority color
  const getAuthorityColor = () => {
    switch (contact.decisionAuthority) {
      case 'DECISION_MAKER':
        return 'bg-green-100 text-green-700';
      case 'BUDGET_HOLDER':
        return 'bg-blue-100 text-blue-700';
      case 'INFLUENCER':
        return 'bg-yellow-100 text-yellow-700';
      case 'END_USER':
        return 'bg-gray-100 text-gray-700';
      case 'GATEKEEPER':
        return 'bg-orange-100 text-orange-700';
      default:
        return '';
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Name and Primary Badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900 truncate">{contact.name}</span>
            {contact.isPrimary && (
              <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                Primary
              </span>
            )}
          </div>

          {/* Job Title */}
          {contact.jobTitle && (
            <div className="text-sm text-gray-600 mt-0.5">{contact.jobTitle}</div>
          )}

          {/* Decision Authority Badge */}
          {authorityInfo && (
            <div className="mt-1.5">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getAuthorityColor()}`}>
                <AuthorityIcon />
                {authorityInfo.label}
              </span>
              {buyingRoleInfo && (
                <span className="ml-1.5 inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                  {buyingRoleInfo.label}
                </span>
              )}
            </div>
          )}

          {/* Contact Info */}
          <div className="mt-2 space-y-0.5">
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
              >
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">{contact.email}</span>
              </a>
            )}
            {contact.phone && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Phone className="h-3.5 w-3.5" />
                {contact.phone}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-2">
          {contact.linkedInUrl && (
            <a
              href={contact.linkedInUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-gray-400 hover:text-blue-600 rounded"
              title="View LinkedIn Profile"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact version for sidebar
export function ContactCardCompact({ contact }: { contact: Contact }) {
  return (
    <div className="text-sm">
      <div className="flex items-center gap-1.5">
        <span className="font-medium text-gray-900">{contact.name}</span>
        {contact.isPrimary && (
          <span className="text-xs text-blue-600">(Primary)</span>
        )}
        {contact.decisionAuthority === 'DECISION_MAKER' && (
          <span title="Decision Maker">
            <Crown className="h-3 w-3 text-green-600" />
          </span>
        )}
        {contact.decisionAuthority === 'BUDGET_HOLDER' && (
          <span title="Budget Holder">
            <DollarSign className="h-3 w-3 text-blue-600" />
          </span>
        )}
      </div>
      {contact.jobTitle && (
        <div className="text-gray-500 text-xs">{contact.jobTitle}</div>
      )}
      {contact.email && (
        <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline text-xs">
          {contact.email}
        </a>
      )}
      {contact.phone && (
        <div className="flex items-center gap-1 text-gray-500 text-xs">
          <Phone className="h-3 w-3" />
          {contact.phone}
        </div>
      )}
    </div>
  );
}
