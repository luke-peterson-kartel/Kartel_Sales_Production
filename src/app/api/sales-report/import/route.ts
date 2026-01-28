// POST /api/sales-report/import
// Imports extracted sales report data into the database

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  ExtractedSalesReport,
  ImportResult,
  ImportPreview,
  ImportDealPreview,
} from '@/lib/types/sales-report';
import { SalesStage } from '@/lib/constants/sales-stages';

interface ImportOptions {
  createNewClients: boolean;
  updateExisting: boolean;
  createTasks: boolean;
  dryRun: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { extractedReport, options } = body as {
      extractedReport: ExtractedSalesReport;
      options: ImportOptions;
    };

    if (!extractedReport) {
      return NextResponse.json(
        { success: false, error: 'Extracted report data is required' },
        { status: 400 }
      );
    }

    // Validate options with defaults
    const importOptions: ImportOptions = {
      createNewClients: options?.createNewClients ?? true,
      updateExisting: options?.updateExisting ?? true,
      createTasks: options?.createTasks ?? true,
      dryRun: options?.dryRun ?? false,
    };

    // If dry run, return preview
    if (importOptions.dryRun) {
      const preview = await generateImportPreview(extractedReport, importOptions);
      return NextResponse.json({ success: true, preview });
    }

    // Execute the import
    const result = await executeImport(extractedReport, importOptions);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error importing sales report:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * Generate a preview of what will be imported
 */
async function generateImportPreview(
  report: ExtractedSalesReport,
  options: ImportOptions
): Promise<ImportPreview> {
  const dealPreviews: ImportDealPreview[] = [];
  let dealsToCreate = 0;
  let dealsToUpdate = 0;
  let dealsToSkip = 0;
  let tasksToCreate = 0;
  const warnings: string[] = [];

  for (const deal of report.allDeals) {
    let matchedClient: { id: string; name: string } | null = null;
    let action: 'create' | 'update' | 'skip' = 'skip';
    let reason: string | undefined;
    const changes: { field: string; oldValue: string | null; newValue: string }[] = [];

    // Check if we have a matched client
    if (deal.matchedClientId) {
      const client = await prisma.client.findUnique({
        where: { id: deal.matchedClientId },
        select: {
          id: true,
          name: true,
          dealOwner: true,
          salesStage: true,
          dealValue: true,
          nextStepNotes: true,
        },
      });

      if (client) {
        matchedClient = { id: client.id, name: client.name };

        if (options.updateExisting) {
          action = 'update';

          // Track what will change
          if (client.dealOwner !== deal.owner) {
            changes.push({
              field: 'dealOwner',
              oldValue: client.dealOwner,
              newValue: deal.owner,
            });
          }
          if (client.salesStage !== deal.stageMapped) {
            changes.push({
              field: 'salesStage',
              oldValue: client.salesStage,
              newValue: deal.stageMapped || deal.stage,
            });
          }
          if (client.dealValue !== deal.valueParsed) {
            changes.push({
              field: 'dealValue',
              oldValue: client.dealValue?.toString() || null,
              newValue: deal.valueParsed?.toString() || 'null',
            });
          }
          if (client.nextStepNotes !== deal.nextStep) {
            changes.push({
              field: 'nextStepNotes',
              oldValue: client.nextStepNotes,
              newValue: deal.nextStep || '',
            });
          }

          dealsToUpdate++;
        } else {
          action = 'skip';
          reason = 'Update existing disabled';
          dealsToSkip++;
        }
      }
    } else if (options.createNewClients) {
      action = 'create';
      dealsToCreate++;
    } else {
      action = 'skip';
      reason = 'No match found and create new disabled';
      dealsToSkip++;
    }

    // Count tasks
    if (deal.task && options.createTasks && action !== 'skip') {
      tasksToCreate++;
    }

    dealPreviews.push({
      extracted: deal,
      matchedClient,
      action,
      reason,
      changes: changes.length > 0 ? changes : undefined,
    });
  }

  // Warnings
  if (dealsToSkip > 0) {
    warnings.push(`${dealsToSkip} deals will be skipped`);
  }

  const dealsWithoutValue = report.allDeals.filter((d) => !d.valueParsed);
  if (dealsWithoutValue.length > 0) {
    warnings.push(`${dealsWithoutValue.length} deals have no parsed value`);
  }

  return {
    deals: dealPreviews,
    leads: [], // TODO: Implement lead previews
    summary: {
      dealsToCreate,
      dealsToUpdate,
      dealsToSkip,
      leadsToProcess: report.allLeads.length,
      tasksToCreate,
      warnings,
    },
  };
}

/**
 * Execute the actual import
 */
async function executeImport(
  report: ExtractedSalesReport,
  options: ImportOptions
): Promise<ImportResult> {
  const createdClients: { id: string; name: string }[] = [];
  const updatedClients: { id: string; name: string; changes: string[] }[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  let contactsCreated = 0;
  let tasksCreated = 0;

  // Start a transaction for atomicity
  await prisma.$transaction(async (tx) => {
    for (const deal of report.allDeals) {
      try {
        if (deal.matchedClientId) {
          // Update existing client
          if (options.updateExisting) {
            const updateData: Record<string, unknown> = {
              dealOwner: deal.owner,
              salesStage: deal.stageMapped as SalesStage | null,
              dealValue: deal.valueParsed,
              nextStepNotes: deal.nextStep,
              lastImportedAt: new Date(),
            };

            const updated = await tx.client.update({
              where: { id: deal.matchedClientId },
              data: updateData,
              select: { id: true, name: true },
            });

            const changes = Object.keys(updateData).filter((k) => k !== 'lastImportedAt');
            updatedClients.push({
              id: updated.id,
              name: updated.name,
              changes,
            });

            // Create task if exists
            if (deal.task && options.createTasks) {
              await tx.salesTask.create({
                data: {
                  description: deal.task.description,
                  dueDate: deal.task.dueDate,
                  owner: deal.owner,
                  isOverdue: deal.task.isOverdue,
                  priority: deal.task.priority,
                  clientId: deal.matchedClientId,
                },
              });
              tasksCreated++;
            }
          }
        } else if (options.createNewClients) {
          // Create new client
          const newClient = await tx.client.create({
            data: {
              name: deal.dealName,
              vertical: 'Entertainment', // Default, can be updated later
              dealOwner: deal.owner,
              salesStage: deal.stageMapped as SalesStage | null,
              dealValue: deal.valueParsed,
              nextStepNotes: deal.nextStep,
              lastImportedAt: new Date(),
            },
            select: { id: true, name: true },
          });

          createdClients.push({ id: newClient.id, name: newClient.name });

          // Create task if exists
          if (deal.task && options.createTasks) {
            await tx.salesTask.create({
              data: {
                description: deal.task.description,
                dueDate: deal.task.dueDate,
                owner: deal.owner,
                isOverdue: deal.task.isOverdue,
                priority: deal.task.priority,
                clientId: newClient.id,
              },
            });
            tasksCreated++;
          }
        }
      } catch (error) {
        errors.push(
          `Failed to process deal "${deal.dealName}": ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Create the import audit record
    await tx.salesReportImport.create({
      data: {
        fileName: report.fileName,
        reportDate: report.reportDate,
        importedAt: new Date(),
        dealsImported: createdClients.length + updatedClients.length,
        dealsCreated: createdClients.length,
        dealsUpdated: updatedClients.length,
        leadsImported: 0, // TODO
        tasksCreated,
        meetingsFound: report.totalMeetings,
        rawExtraction: JSON.stringify(report),
        errors: errors.length > 0 ? JSON.stringify(errors) : null,
        warnings: warnings.length > 0 ? JSON.stringify(warnings) : null,
      },
    });
  });

  return {
    success: errors.length === 0,
    importId: '', // Will be set by transaction
    clientsCreated: createdClients.length,
    clientsUpdated: updatedClients.length,
    contactsCreated,
    tasksCreated,
    createdClients,
    updatedClients,
    errors,
    warnings,
  };
}
