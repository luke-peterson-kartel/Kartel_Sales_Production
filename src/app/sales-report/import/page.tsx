'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Loader2,
  Users,
  TrendingUp,
  Calendar,
  ChevronDown,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import {
  ExtractedSalesReport,
  ExtractedDeal,
  ImportPreview,
  ImportResult,
} from '@/lib/types/sales-report';
import {
  SALES_STAGE_LABELS,
  SALES_STAGE_COLORS,
  formatDealValue,
  SalesStage,
} from '@/lib/constants/sales-stages';

type ImportStep = 'upload' | 'preview' | 'importing' | 'complete';

export default function SalesReportImportPage() {
  const router = useRouter();
  const [step, setStep] = useState<ImportStep>('upload');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Extracted data
  const [extractedReport, setExtractedReport] = useState<ExtractedSalesReport | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Import options
  const [options, setOptions] = useState({
    createNewClients: true,
    updateExisting: true,
    createTasks: true,
  });

  // Expanded sections
  const [expandedOwners, setExpandedOwners] = useState<Record<string, boolean>>({
    Ben: true,
    Luke: true,
    Emmet: true,
    Kevin: true,
  });

  /**
   * Handle file drop/upload
   */
  const handleFileUpload = useCallback(async (file: File) => {
    setError(null);
    setIsProcessing(true);

    try {
      // Read file as text (for now, assuming extracted text from PDF)
      // In production, you'd use a PDF library to extract text
      const text = await file.text();

      // Send to parse API
      const response = await fetch('/api/sales-report/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfContent: text,
          fileName: file.name,
          isBase64Image: false,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to parse report');
      }

      setExtractedReport(data.data);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Handle drag and drop
   */
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  /**
   * Get import preview
   */
  const getPreview = useCallback(async () => {
    if (!extractedReport) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/sales-report/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extractedReport,
          options: { ...options, dryRun: true },
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to get preview');
      }

      setImportPreview(data.preview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preview import');
    } finally {
      setIsProcessing(false);
    }
  }, [extractedReport, options]);

  /**
   * Execute import
   */
  const executeImport = useCallback(async () => {
    if (!extractedReport) return;

    setStep('importing');
    setIsProcessing(true);

    try {
      const response = await fetch('/api/sales-report/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extractedReport,
          options: { ...options, dryRun: false },
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Import failed');
      }

      setImportResult(data.result);
      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setStep('preview');
    } finally {
      setIsProcessing(false);
    }
  }, [extractedReport, options]);

  /**
   * Toggle owner section expansion
   */
  const toggleOwner = (owner: string) => {
    setExpandedOwners((prev) => ({ ...prev, [owner]: !prev[owner] }));
  };

  /**
   * Reset and start over
   */
  const reset = () => {
    setStep('upload');
    setExtractedReport(null);
    setImportPreview(null);
    setImportResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Import Sales Report</h1>
          </div>
          <p className="mt-1 text-gray-500">
            Upload a Daily Sales Report PDF to update client pipeline data
          </p>
        </div>

        {step !== 'upload' && (
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Start Over
          </button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <div className="font-medium text-red-800">Error</div>
            <div className="text-sm text-red-700">{error}</div>
          </div>
        </div>
      )}

      {/* Step: Upload */}
      {step === 'upload' && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-12 text-center hover:border-blue-400 transition-colors"
        >
          {isProcessing ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
              <div className="text-lg font-medium text-gray-900">Processing report...</div>
              <div className="text-sm text-gray-500">Extracting deal data...</div>
            </div>
          ) : (
            <>
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4 text-lg font-medium text-gray-900">
                Drop your Daily Sales Report CSV here
              </div>
              <p className="mt-2 text-sm text-gray-500">
                or click to browse for a file
              </p>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="mt-6 text-xs text-gray-400">
                Export from Google Sheets as CSV for best results
              </div>
            </>
          )}
        </div>
      )}

      {/* Step: Preview */}
      {step === 'preview' && extractedReport && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <SummaryCard
              icon={<Users className="h-5 w-5 text-blue-600" />}
              label="Total Deals"
              value={extractedReport.totalDeals.toString()}
            />
            <SummaryCard
              icon={<TrendingUp className="h-5 w-5 text-green-600" />}
              label="Pipeline Value"
              value={formatDealValue(extractedReport.totalValue)}
            />
            <SummaryCard
              icon={<Users className="h-5 w-5 text-purple-600" />}
              label="Key Leads"
              value={extractedReport.totalLeads.toString()}
            />
            <SummaryCard
              icon={<Calendar className="h-5 w-5 text-amber-600" />}
              label="Meetings"
              value={extractedReport.totalMeetings.toString()}
            />
          </div>

          {/* Deals by Owner */}
          <div className="rounded-xl bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Deal Pipeline by Owner</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {Object.entries(extractedReport.dealsByOwner).map(([owner, deals]) => (
                <div key={owner}>
                  <button
                    onClick={() => toggleOwner(owner)}
                    className="w-full flex items-center justify-between px-6 py-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      {expandedOwners[owner] ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="font-medium text-gray-900">{owner}</span>
                      <span className="text-sm text-gray-500">
                        ({deals.length} deals)
                      </span>
                    </div>
                    <div className="text-sm font-medium text-gray-700">
                      {formatDealValue(deals.reduce((sum, d) => sum + (d.valueParsed || 0), 0))}
                    </div>
                  </button>

                  {expandedOwners[owner] && deals.length > 0 && (
                    <div className="px-6 pb-4">
                      <table className="min-w-full">
                        <thead>
                          <tr className="text-xs text-gray-500">
                            <th className="text-left py-2 font-medium">Deal</th>
                            <th className="text-left py-2 font-medium">Value</th>
                            <th className="text-left py-2 font-medium">Stage</th>
                            <th className="text-left py-2 font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {deals.map((deal, idx) => (
                            <DealRow key={idx} deal={deal} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Import Options */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Import Options</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={options.createNewClients}
                  onChange={(e) =>
                    setOptions((prev) => ({ ...prev, createNewClients: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Create new clients for unmatched deals
                </span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={options.updateExisting}
                  onChange={(e) =>
                    setOptions((prev) => ({ ...prev, updateExisting: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Update existing client data
                </span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={options.createTasks}
                  onChange={(e) =>
                    setOptions((prev) => ({ ...prev, createTasks: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Create sales tasks from due dates
                </span>
              </label>
            </div>
          </div>

          {/* Preview / Import Buttons */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={getPreview}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Preview Changes
            </button>
            <button
              onClick={executeImport}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Import Data
            </button>
          </div>

          {/* Import Preview Results */}
          {importPreview && (
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Import Preview</h3>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-5 text-sm">
                <div>
                  <div className="text-gray-500">Will Create</div>
                  <div className="text-lg font-semibold text-green-600">
                    {importPreview.summary.dealsToCreate}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Will Update</div>
                  <div className="text-lg font-semibold text-blue-600">
                    {importPreview.summary.dealsToUpdate}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Will Skip</div>
                  <div className="text-lg font-semibold text-gray-500">
                    {importPreview.summary.dealsToSkip}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Tasks</div>
                  <div className="text-lg font-semibold text-amber-600">
                    {importPreview.summary.tasksToCreate}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Warnings</div>
                  <div className="text-lg font-semibold text-red-600">
                    {importPreview.summary.warnings.length}
                  </div>
                </div>
              </div>
              {importPreview.summary.warnings.length > 0 && (
                <div className="mt-4 text-sm text-amber-700">
                  {importPreview.summary.warnings.map((w, i) => (
                    <div key={i}>• {w}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step: Importing */}
      {step === 'importing' && (
        <div className="rounded-xl bg-white p-12 shadow-sm text-center">
          <Loader2 className="mx-auto h-12 w-12 text-blue-600 animate-spin" />
          <div className="mt-4 text-lg font-medium text-gray-900">Importing data...</div>
          <div className="mt-2 text-sm text-gray-500">
            Creating and updating client records
          </div>
        </div>
      )}

      {/* Step: Complete */}
      {step === 'complete' && importResult && (
        <div className="space-y-6">
          <div className="rounded-xl bg-green-50 border border-green-200 p-6 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
            <div className="mt-4 text-lg font-medium text-green-800">Import Complete!</div>
            <div className="mt-2 text-sm text-green-700">
              {importResult.clientsCreated} clients created, {importResult.clientsUpdated} updated
            </div>
          </div>

          {/* Results Summary */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <SummaryCard
              icon={<Users className="h-5 w-5 text-green-600" />}
              label="Clients Created"
              value={importResult.clientsCreated.toString()}
            />
            <SummaryCard
              icon={<RefreshCw className="h-5 w-5 text-blue-600" />}
              label="Clients Updated"
              value={importResult.clientsUpdated.toString()}
            />
            <SummaryCard
              icon={<Calendar className="h-5 w-5 text-amber-600" />}
              label="Tasks Created"
              value={importResult.tasksCreated.toString()}
            />
            <SummaryCard
              icon={<AlertCircle className="h-5 w-5 text-red-600" />}
              label="Errors"
              value={importResult.errors.length.toString()}
            />
          </div>

          {/* Created Clients */}
          {importResult.createdClients.length > 0 && (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Created Clients</h3>
              <div className="flex flex-wrap gap-2">
                {importResult.createdClients.map((client) => (
                  <span
                    key={client.id}
                    className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800"
                  >
                    {client.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Errors */}
          {importResult.errors.length > 0 && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-6">
              <h3 className="text-sm font-semibold text-red-800 mb-3">Errors</h3>
              <ul className="text-sm text-red-700 space-y-1">
                {importResult.errors.map((err, i) => (
                  <li key={i}>• {err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => router.push('/clients')}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              View Clients
            </button>
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Import Another Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Components

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-gray-100 p-2">{icon}</div>
        <div>
          <div className="text-sm text-gray-500">{label}</div>
          <div className="text-xl font-bold text-gray-900">{value}</div>
        </div>
      </div>
    </div>
  );
}

function DealRow({ deal }: { deal: ExtractedDeal }) {
  const stageColor = deal.stageMapped
    ? SALES_STAGE_COLORS[deal.stageMapped as SalesStage]
    : '#94a3b8';
  const stageLabel = deal.stageMapped
    ? SALES_STAGE_LABELS[deal.stageMapped as SalesStage]
    : deal.stage;

  return (
    <tr className="text-sm">
      <td className="py-2">
        <div className="font-medium text-gray-900">{deal.dealName}</div>
        {deal.nextStep && (
          <div className="text-xs text-gray-500 truncate max-w-xs">{deal.nextStep}</div>
        )}
      </td>
      <td className="py-2 text-gray-700">{formatDealValue(deal.valueParsed)}</td>
      <td className="py-2">
        <span
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: `${stageColor}20`,
            color: stageColor,
          }}
        >
          {stageLabel}
        </span>
      </td>
      <td className="py-2">
        {deal.matchedClientId ? (
          <span className="inline-flex items-center text-xs text-blue-600">
            <RefreshCw className="h-3 w-3 mr-1" />
            Update
          </span>
        ) : (
          <span className="inline-flex items-center text-xs text-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Create
          </span>
        )}
      </td>
    </tr>
  );
}
