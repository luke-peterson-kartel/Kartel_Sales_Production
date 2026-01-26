'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Link2, Unlink, Loader2, ChevronDown, Plus } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  vertical: string | null;
}

interface ClientLinkSelectorProps {
  conversationId: string;
  currentClient: {
    id: string;
    name: string;
  } | null;
}

export default function ClientLinkSelector({
  conversationId,
  currentClient,
}: ClientLinkSelectorProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen && clients.length === 0) {
      fetchClients();
    }
  }, [isOpen]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async (clientId: string | null) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });

      if (response.ok) {
        router.refresh();
        setIsOpen(false);
      }
    } catch (err) {
      console.error('Error linking client:', err);
    } finally {
      setSaving(false);
    }
  };

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      {currentClient ? (
        <div className="flex items-center gap-2">
          <a
            href={`/clients/${currentClient.id}`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Building2 className="h-4 w-4" />
            {currentClient.name}
          </a>
          <button
            onClick={() => handleLink(null)}
            disabled={saving}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            title="Unlink client"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Unlink className="h-4 w-4" />
            )}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700"
        >
          <Link2 className="h-4 w-4" />
          Link to Client
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {/* Dropdown */}
      {isOpen && !currentClient && (
        <div className="absolute right-0 top-full z-10 mt-2 w-72 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="p-3 border-b border-gray-100">
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div className="max-h-64 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                {search ? 'No clients found' : 'No clients available'}
              </div>
            ) : (
              <div className="py-2">
                {filteredClients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => handleLink(client.id)}
                    disabled={saving}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">{client.name}</div>
                      {client.vertical && (
                        <div className="text-xs text-gray-500">{client.vertical}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 p-2">
            <a
              href="/clients/new"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
            >
              <Plus className="h-4 w-4" />
              Create New Client
            </a>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
