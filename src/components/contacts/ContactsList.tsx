'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Phone, Crown, DollarSign, Linkedin, User } from 'lucide-react';
import ContactActions, { BulkEnrichButton } from './ContactActions';

interface Contact {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  isPrimary: boolean;
  jobTitle?: string | null;
  decisionAuthority?: string | null;
  linkedInUrl?: string | null;
  enrichedAt?: Date | null;
  photoUrl?: string | null;
}

interface ContactsListProps {
  contacts: Contact[];
  clientId: string;
  clientName: string;
}

export default function ContactsList({ contacts, clientId, clientName }: ContactsListProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleEnrichComplete = () => {
    // Refresh the page to show updated data
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Get contacts that haven't been enriched yet
  const unenrichedContactIds = contacts
    .filter(c => !c.enrichedAt)
    .map(c => c.id);

  return (
    <div className={`transition-opacity ${isRefreshing ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">
          Contacts ({contacts.length})
        </h3>
        <div className="flex items-center gap-3">
          {unenrichedContactIds.length > 0 && (
            <BulkEnrichButton
              contactIds={unenrichedContactIds}
              onComplete={handleEnrichComplete}
            />
          )}
          <Link
            href={`/clients/${clientId}/contacts/new`}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Add Contact
          </Link>
        </div>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          <Building2 className="mx-auto h-6 w-6 mb-2 opacity-50" />
          <p className="text-sm">No contacts yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="text-sm border-b border-gray-100 pb-3 last:border-0 last:pb-0"
            >
              <div className="flex items-start gap-3">
                {/* Photo */}
                <Link href={`/clients/${clientId}/contacts/${contact.id}`}>
                  {contact.photoUrl ? (
                    <img
                      src={contact.photoUrl}
                      alt={contact.name}
                      className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Link
                      href={`/clients/${clientId}/contacts/${contact.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600 hover:underline"
                    >
                      {contact.name}
                    </Link>
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
                    {contact.enrichedAt && (
                      <span className="text-xs text-purple-500" title="Enriched with Apollo">
                        enriched
                      </span>
                    )}
                  </div>

                  {contact.jobTitle && (
                    <div className="text-gray-500 text-xs">{contact.jobTitle}</div>
                  )}
                  {!contact.jobTitle && contact.role && (
                    <div className="text-gray-500 text-xs">{contact.role}</div>
                  )}

                  <div className="flex items-center gap-2 mt-1">
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        {contact.email}
                      </a>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-1 text-gray-500 text-xs">
                        <Phone className="h-3 w-3" />
                        {contact.phone}
                      </div>
                    )}
                    {contact.linkedInUrl && (
                      <a
                        href={contact.linkedInUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                        title="View LinkedIn Profile"
                      >
                        <Linkedin className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="ml-2">
                  <ContactActions
                    contact={contact}
                    companyName={clientName}
                    onEnrichComplete={handleEnrichComplete}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
