'use client';

import { useState, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Edit3,
  Trash2,
  Plus,
  ArrowRight,
  FileText,
  AlertTriangle,
  Upload,
  File,
  X,
} from 'lucide-react';
import { PLATFORMS, CREATIVE_TYPES, SIZES, DURATIONS } from '@/lib/constants';

interface ParsedDeliverable {
  platform: string;
  creativeType: string;
  size: string;
  duration: number | null;
  monthlyCount: number;
  notes: string;
}

interface ParseResult {
  deliverables: ParsedDeliverable[];
  summary: string;
  assumptions: string[];
  unparseableItems: string[];
}

// Cost calculation (matching the estimate API)
const COST_TABLE = {
  static: 0.1,
  gif: 0.15,
  shortVideo: 0.2,
  mediumVideo: 0.3,
  longVideo: 0.5,
};

function calculateDaysPerAsset(creativeType: string, duration: number | null): number {
  if (creativeType === 'GIF') return COST_TABLE.gif;
  if (['Video', 'UGC', 'Branded', 'VideoPin'].includes(creativeType)) {
    if (duration && duration <= 15) return COST_TABLE.shortVideo;
    if (duration && duration <= 30) return COST_TABLE.mediumVideo;
    return COST_TABLE.longVideo;
  }
  return COST_TABLE.static;
}

type InputMode = 'paste' | 'upload';

function EstimateFromRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const [inputMode, setInputMode] = useState<InputMode>('paste');
  const [clientRequest, setClientRequest] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/csv',
    ];
    const validExtensions = ['.pdf', '.docx', '.doc', '.csv'];

    const hasValidExtension = validExtensions.some(ext =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!validTypes.includes(file.type) && !hasValidExtension) {
      setError('Please upload a PDF, Word document (.docx), or CSV file.');
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleParseFile = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    setIsParsing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/estimates/parse-file', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse file');
      }

      setParseResult({
        deliverables: data.deliverables,
        summary: data.summary,
        assumptions: data.assumptions,
        unparseableItems: data.unparseableItems,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsParsing(false);
    }
  };

  const handleParse = async () => {
    if (clientRequest.trim().length < 10) {
      setError('Please enter a client request (at least 10 characters)');
      return;
    }

    setIsParsing(true);
    setError(null);

    try {
      const response = await fetch('/api/estimates/parse-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientRequest }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse request');
      }

      setParseResult({
        deliverables: data.deliverables,
        summary: data.summary,
        assumptions: data.assumptions,
        unparseableItems: data.unparseableItems,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsParsing(false);
    }
  };

  const updateDeliverable = (index: number, updates: Partial<ParsedDeliverable>) => {
    if (!parseResult) return;
    const newDeliverables = [...parseResult.deliverables];
    newDeliverables[index] = { ...newDeliverables[index], ...updates };
    setParseResult({ ...parseResult, deliverables: newDeliverables });
  };

  const removeDeliverable = (index: number) => {
    if (!parseResult) return;
    const newDeliverables = parseResult.deliverables.filter((_, i) => i !== index);
    setParseResult({ ...parseResult, deliverables: newDeliverables });
  };

  const addDeliverable = () => {
    if (!parseResult) return;
    const newDeliverable: ParsedDeliverable = {
      platform: 'Meta',
      creativeType: 'Static',
      size: '1x1',
      duration: null,
      monthlyCount: 1,
      notes: '',
    };
    setParseResult({
      ...parseResult,
      deliverables: [...parseResult.deliverables, newDeliverable],
    });
    setEditingIndex(parseResult.deliverables.length);
  };

  const calculateTotals = () => {
    if (!parseResult) return { totalAssets: 0, totalDays: 0 };

    let totalAssets = 0;
    let totalDays = 0;

    for (const d of parseResult.deliverables) {
      totalAssets += d.monthlyCount;
      totalDays += d.monthlyCount * calculateDaysPerAsset(d.creativeType, d.duration);
    }

    return {
      totalAssets,
      totalDays: Math.round(totalDays * 10) / 10,
    };
  };

  const handleCreateEstimate = () => {
    if (!parseResult || parseResult.deliverables.length === 0) return;

    // Store deliverables in sessionStorage for the estimate form to pick up
    sessionStorage.setItem('parsedDeliverables', JSON.stringify(parseResult.deliverables));
    const params = new URLSearchParams({ fromParsed: 'true' });
    if (projectId) params.set('projectId', projectId);
    router.push(`/estimates/new?${params.toString()}`);
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/estimates"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Estimates
        </Link>

        <h1 className="text-3xl font-bold text-gray-900">
          Parse Client Request
        </h1>
        <p className="mt-1 text-gray-500">
          Paste a client request in any format and let AI extract the deliverables for your estimate.
        </p>
      </div>

      {/* Input Section */}
      {!parseResult && (
        <div className="space-y-6">
          {/* Input Mode Tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
            <button
              onClick={() => setInputMode('paste')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                inputMode === 'paste'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Paste Text
            </button>
            <button
              onClick={() => setInputMode('upload')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                inputMode === 'upload'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Upload File
            </button>
          </div>

          {/* Paste Text Input */}
          {inputMode === 'paste' && (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Client Request
              </label>
              <textarea
                value={clientRequest}
                onChange={(e) => setClientRequest(e.target.value)}
                placeholder={`Paste the client request here in any format...

Examples of what you can paste:
• Email text: "We need 10 Instagram Reels (9:16, 15s each) and 5 static feed posts per month"
• CSV data: Platform, Format, Size, Duration, Qty
• Spreadsheet content: Just copy and paste from Excel/Sheets
• Brief excerpt: "Campaign requires 20 TikTok videos, 30 Meta statics, and 10 YouTube pre-rolls"
• Free-form: "We want about 50 assets monthly - mix of video and static for social"`}
                rows={12}
                disabled={isParsing}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              {clientRequest.length > 0 && (
                <div className="mt-2 text-xs text-gray-400 text-right">
                  {clientRequest.length.toLocaleString()} characters
                </div>
              )}
            </div>
          )}

          {/* File Upload Input */}
          {inputMode === 'upload' && (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Upload File
              </label>

              {/* Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : selectedFile
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.csv"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-3">
                      <File className="h-10 w-10 text-green-600" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                        className="p-1 rounded-full hover:bg-gray-200"
                      >
                        <X className="h-5 w-5 text-gray-500" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Click to choose a different file
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="h-10 w-10 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Drop your file here, or click to browse
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Supports PDF, Word (.docx), and CSV files
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* What AI Will Do */}
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              What Claude AI Will Extract
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
              <ul className="space-y-1">
                <li>• Platform (Meta, TikTok, YouTube, etc.)</li>
                <li>• Creative type (Static, Video, Carousel)</li>
                <li>• Aspect ratio / size</li>
              </ul>
              <ul className="space-y-1">
                <li>• Video duration if applicable</li>
                <li>• Monthly volume / count</li>
                <li>• Notes and context</li>
              </ul>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 p-4">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Parse Button */}
          <div className="flex justify-end">
            {inputMode === 'paste' ? (
              <button
                onClick={handleParse}
                disabled={isParsing || clientRequest.trim().length < 10}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Parsing with Claude...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Parse Request
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleParseFile}
                disabled={isParsing || !selectedFile}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing file...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Parse File
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results Section */}
      {parseResult && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="rounded-xl bg-green-50 border border-green-200 p-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-green-900">
                  Parsed Successfully
                </h3>
                <p className="text-sm text-green-700 mt-1">{parseResult.summary}</p>
              </div>
            </div>
          </div>

          {/* Assumptions Warning */}
          {parseResult.assumptions.length > 0 && (
            <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-6">
              <h3 className="text-sm font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Assumptions Made
              </h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                {parseResult.assumptions.map((assumption, i) => (
                  <li key={i}>• {assumption}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Unparseable Items */}
          {parseResult.unparseableItems.length > 0 && (
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Could Not Parse
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                {parseResult.unparseableItems.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Deliverables Table */}
          <div className="rounded-xl bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Extracted Deliverables ({parseResult.deliverables.length})
              </h2>
              <button
                onClick={addDeliverable}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Plus className="h-4 w-4" />
                Add Row
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monthly</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days/Mo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {parseResult.deliverables.map((d, index) => {
                    const isEditing = editingIndex === index;
                    const daysPerMonth = d.monthlyCount * calculateDaysPerAsset(d.creativeType, d.duration);
                    const isVideoType = ['Video', 'UGC', 'Branded', 'VideoPin', 'GIF'].includes(d.creativeType);

                    return (
                      <tr key={index} className={isEditing ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <select
                              value={d.platform}
                              onChange={(e) => updateDeliverable(index, { platform: e.target.value })}
                              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                            >
                              {PLATFORMS.map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-sm text-gray-900">{d.platform}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <select
                              value={d.creativeType}
                              onChange={(e) => {
                                const newType = e.target.value;
                                const needsDuration = ['Video', 'UGC', 'Branded', 'VideoPin', 'GIF'].includes(newType);
                                updateDeliverable(index, {
                                  creativeType: newType,
                                  duration: needsDuration ? (d.duration || 15) : null,
                                });
                              }}
                              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                            >
                              {CREATIVE_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-sm text-gray-900">{d.creativeType}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <select
                              value={d.size}
                              onChange={(e) => updateDeliverable(index, { size: e.target.value })}
                              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                            >
                              {SIZES.map(s => (
                                <option key={s.value} value={s.value}>{s.value}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-sm text-gray-900">{d.size}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isVideoType ? (
                            isEditing ? (
                              <select
                                value={d.duration || 15}
                                onChange={(e) => updateDeliverable(index, { duration: parseInt(e.target.value) })}
                                className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                              >
                                {DURATIONS.map(dur => (
                                  <option key={dur.value} value={dur.value}>{dur.label}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-sm text-gray-900">{d.duration}s</span>
                            )
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              type="number"
                              min="1"
                              value={d.monthlyCount}
                              onChange={(e) => updateDeliverable(index, { monthlyCount: parseInt(e.target.value) || 1 })}
                              className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
                            />
                          ) : (
                            <span className="text-sm text-gray-900">{d.monthlyCount}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-blue-600">
                            {Math.round(daysPerMonth * 10) / 10}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={d.notes}
                              onChange={(e) => updateDeliverable(index, { notes: e.target.value })}
                              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                              placeholder="Notes..."
                            />
                          ) : (
                            <span className="text-sm text-gray-500 truncate max-w-[150px] block">
                              {d.notes || '-'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingIndex(isEditing ? null : index)}
                              className={`p-1 rounded hover:bg-gray-200 ${isEditing ? 'text-blue-600' : 'text-gray-500'}`}
                              title={isEditing ? 'Done editing' : 'Edit'}
                            >
                              {isEditing ? <CheckCircle2 className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => removeDeliverable(index)}
                              className="p-1 rounded text-gray-500 hover:bg-red-100 hover:text-red-600"
                              title="Remove"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-gray-900">
                      Monthly Total
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {totals.totalAssets} assets
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-blue-600">
                      {totals.totalDays} days
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setParseResult(null);
                setEditingIndex(null);
                setSelectedFile(null);
                setClientRequest('');
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Start Over
            </button>

            <button
              onClick={handleCreateEstimate}
              disabled={parseResult.deliverables.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              Create Estimate
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EstimateFromRequestPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <EstimateFromRequestForm />
    </Suspense>
  );
}
