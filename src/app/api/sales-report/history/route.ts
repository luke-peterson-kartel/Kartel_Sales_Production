// GET /api/sales-report/history
// Lists past sales report imports

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const [imports, total] = await Promise.all([
      prisma.salesReportImport.findMany({
        orderBy: { importedAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          fileName: true,
          reportDate: true,
          importedAt: true,
          importedBy: true,
          dealsImported: true,
          dealsCreated: true,
          dealsUpdated: true,
          leadsImported: true,
          tasksCreated: true,
          meetingsFound: true,
          errors: true,
          warnings: true,
        },
      }),
      prisma.salesReportImport.count(),
    ]);

    // Parse JSON fields
    const formattedImports = imports.map((imp) => ({
      ...imp,
      errors: imp.errors ? JSON.parse(imp.errors) : [],
      warnings: imp.warnings ? JSON.parse(imp.warnings) : [],
      hasErrors: imp.errors ? JSON.parse(imp.errors).length > 0 : false,
    }));

    return NextResponse.json({
      success: true,
      data: formattedImports,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching import history:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
