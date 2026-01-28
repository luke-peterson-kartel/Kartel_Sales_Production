'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Globe,
  Users,
  Building2,
  Loader2,
  RefreshCw,
  Lightbulb,
  HelpCircle,
  ExternalLink,
  Crown,
  Star,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import type { LeadershipMember } from '@/lib/types/contact-intelligence';

interface ClientIntelligenceProps {
  clientId: string;
  clientName: string;
  websiteUrl: string | null;
  vertical: string;
  existingIntelligence: {
    companyDescription?: string;
    companySize?: string;
    estimatedEmployees?: string;
    industry?: string;
    leadershipTeam?: LeadershipMember[];
    currentCreativeApproach?: string;
    suggestedTalkingPoints?: string[];
    suggestedQuestions?: string[];
    websiteAnalyzedAt?: Date | null;
  } | null;
}

export default function ClientIntelligenceSection({
  clientId,
  clientName,
  websiteUrl,
  vertical,
  existingIntelligence,
}: ClientIntelligenceProps) {
  const router = useRouter();
  const [intelligence, setIntelligence] = useState(existingIntelligence);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTalkingPoints, setShowTalkingPoints] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);

  // Website editing state
  const [isEditingWebsite, setIsEditingWebsite] = useState(false);
  const [editedWebsite, setEditedWebsite] = useState(websiteUrl || '');
  const [isSavingWebsite, setIsSavingWebsite] = useState(false);
  const [currentWebsiteUrl, setCurrentWebsiteUrl] = useState(websiteUrl);

  const handleSaveWebsite = async () => {
    setIsSavingWebsite(true);
    setError(null);

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website: editedWebsite || null }),
      });

      if (!response.ok) {
        throw new Error('Failed to save website');
      }

      setCurrentWebsiteUrl(editedWebsite || null);
      setIsEditingWebsite(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save website');
    } finally {
      setIsSavingWebsite(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedWebsite(currentWebsiteUrl || '');
    setIsEditingWebsite(false);
  };

  const analyzeWebsite = async () => {
    if (!currentWebsiteUrl) {
      setError('No website URL configured for this client');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch(`/api/clients/${clientId}/analyze-website`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze website');
      }

      // Update local state with new intelligence
      setIntelligence({
        companyDescription: data.intelligence.companyDescription,
        companySize: data.intelligence.companySize,
        estimatedEmployees: data.intelligence.estimatedEmployees,
        industry: data.intelligence.industry,
        leadershipTeam: data.intelligence.leadershipTeam || [],
        currentCreativeApproach: data.intelligence.currentCreativeApproach,
        suggestedTalkingPoints: data.intelligence.suggestedTalkingPoints || [],
        suggestedQuestions: data.intelligence.suggestedQuestions || [],
        websiteAnalyzedAt: new Date(),
      });

      // Reload page to show new contacts
      if (data.createdContacts?.length > 0) {
        window.location.reload();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const hasIntelligence = intelligence && intelligence.websiteAnalyzedAt;

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Company Intelligence
        </h2>
        {currentWebsiteUrl && (
          <button
            onClick={analyzeWebsite}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : hasIntelligence ? (
              <>
                <RefreshCw className="h-4 w-4" />
                Re-analyze
              </>
            ) : (
              <>
                <Globe className="h-4 w-4" />
                Analyze Website
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Website URL Section */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Globe className="h-4 w-4" />
            Website
          </div>
          {!isEditingWebsite && (
            <button
              onClick={() => setIsEditingWebsite(true)}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Pencil className="h-3 w-3" />
              {currentWebsiteUrl ? 'Edit' : 'Add'}
            </button>
          )}
        </div>

        {isEditingWebsite ? (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="url"
              value={editedWebsite}
              onChange={(e) => setEditedWebsite(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={isSavingWebsite}
            />
            <button
              onClick={handleSaveWebsite}
              disabled={isSavingWebsite}
              className="p-1.5 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              title="Save"
            >
              {isSavingWebsite ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={handleCancelEdit}
              disabled={isSavingWebsite}
              className="p-1.5 rounded-md bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-50"
              title="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="mt-1">
            {currentWebsiteUrl ? (
              <a
                href={currentWebsiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                {currentWebsiteUrl}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <p className="text-sm text-gray-400 italic">No website configured</p>
            )}
          </div>
        )}
      </div>

      {!currentWebsiteUrl && !isEditingWebsite && (
        <div className="text-center py-4 text-gray-500">
          <Sparkles className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p className="text-sm">Add a website URL above to enable intelligence analysis</p>
        </div>
      )}

      {currentWebsiteUrl && !hasIntelligence && !isAnalyzing && (
        <div className="text-center py-6 text-gray-500">
          <Sparkles className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p className="text-sm mb-3">Click "Analyze Website" to extract company intelligence</p>
          <p className="text-xs text-gray-400">
            This will fetch the website and use AI to identify leadership, company info, and talking points
          </p>
        </div>
      )}

      {isAnalyzing && (
        <div className="text-center py-8">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-purple-500 mb-3" />
          <p className="text-sm text-gray-600">Analyzing {clientName}'s website...</p>
          <p className="text-xs text-gray-400 mt-1">This may take 15-30 seconds</p>
        </div>
      )}

      {hasIntelligence && !isAnalyzing && (
        <div className="space-y-4">
          {/* Company Overview */}
          {intelligence.companyDescription && (
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Building2 className="h-4 w-4" />
                About {clientName}
              </div>
              <p className="text-sm text-gray-600">{intelligence.companyDescription}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {intelligence.industry && (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                    {intelligence.industry}
                  </span>
                )}
                {intelligence.companySize && (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    {intelligence.companySize}
                  </span>
                )}
                {intelligence.estimatedEmployees && (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                    ~{intelligence.estimatedEmployees} employees
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Leadership Team */}
          {intelligence.leadershipTeam && intelligence.leadershipTeam.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Users className="h-4 w-4" />
                Leadership Team
              </div>
              <div className="space-y-2">
                {intelligence.leadershipTeam.slice(0, 5).map((leader, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{leader.name}</span>
                        {leader.isLikelyDM && (
                          <span title="Likely Decision Maker">
                            <Crown className="h-3.5 w-3.5 text-amber-500" />
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{leader.title}</span>
                    </div>
                    {leader.linkedIn && (
                      <a
                        href={leader.linkedIn}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                ))}
                {intelligence.leadershipTeam.length > 5 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{intelligence.leadershipTeam.length - 5} more found
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Creative Approach */}
          {intelligence.currentCreativeApproach && (
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Star className="h-4 w-4" />
                Current Creative Approach
              </div>
              <p className="text-sm text-gray-600">{intelligence.currentCreativeApproach}</p>
            </div>
          )}

          {/* Talking Points */}
          {intelligence.suggestedTalkingPoints && intelligence.suggestedTalkingPoints.length > 0 && (
            <div>
              <button
                onClick={() => setShowTalkingPoints(!showTalkingPoints)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                <Lightbulb className="h-4 w-4" />
                Suggested Talking Points
                <span className="text-xs text-gray-500">({intelligence.suggestedTalkingPoints.length})</span>
              </button>
              {showTalkingPoints && (
                <ul className="mt-2 space-y-1 pl-6 list-disc">
                  {intelligence.suggestedTalkingPoints.map((point, index) => (
                    <li key={index} className="text-sm text-gray-600">{point}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Discovery Questions */}
          {intelligence.suggestedQuestions && intelligence.suggestedQuestions.length > 0 && (
            <div>
              <button
                onClick={() => setShowQuestions(!showQuestions)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                <HelpCircle className="h-4 w-4" />
                Discovery Questions
                <span className="text-xs text-gray-500">({intelligence.suggestedQuestions.length})</span>
              </button>
              {showQuestions && (
                <ul className="mt-2 space-y-1 pl-6 list-disc">
                  {intelligence.suggestedQuestions.map((question, index) => (
                    <li key={index} className="text-sm text-gray-600">{question}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Last Analyzed */}
          <div className="pt-2 border-t border-gray-100 text-xs text-gray-400">
            Last analyzed: {new Date(intelligence.websiteAnalyzedAt!).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
