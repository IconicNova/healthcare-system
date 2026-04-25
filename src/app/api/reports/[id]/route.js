import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { VisitReportPatchSchema } from '@/lib/validations';
import { logAuditEvent } from '@/lib/audit-log';

// GET - Fetch a single visit report
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const report = await prisma.visitReport.findFirst({
      where: {
        id,
        client: {
          organizationId: session.user.organizationId,
        },
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
  }
}

// PATCH - Update a visit report
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const validationResult = VisitReportPatchSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const report = await prisma.visitReport.findFirst({
      where: {
        id,
        client: {
          organizationId: session.user.organizationId,
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (validationResult.data.visitIds?.length) {
      const matchingVisits = await prisma.visit.findMany({
        where: {
          id: { in: validationResult.data.visitIds },
          organizationId: session.user.organizationId,
          clientId: report.clientId,
        },
        select: { id: true },
      });

      if (matchingVisits.length !== validationResult.data.visitIds.length) {
        return NextResponse.json(
          { error: 'One or more selected visits are invalid for this client' },
          { status: 400 }
        );
      }
    }

    const updateData = {
      ...validationResult.data,
    };

    if (Object.prototype.hasOwnProperty.call(updateData, 'startDate') && updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }

    if (Object.prototype.hasOwnProperty.call(updateData, 'endDate') && updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }

    const updatedReport = await prisma.visitReport.update({
      where: { id },
      data: updateData,
    });

    await logAuditEvent({
      action: 'UPDATE',
      entity: 'VisitReport',
      entityId: updatedReport.id,
      userId: session.user.id,
      before: report,
      after: updatedReport,
    });

    return NextResponse.json(updatedReport);
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
  }
}

// DELETE - Delete a visit report
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const report = await prisma.visitReport.findFirst({
      where: {
        id,
        client: {
          organizationId: session.user.organizationId,
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    await prisma.visitReport.delete({
      where: { id },
    });

    await logAuditEvent({
      action: 'DELETE',
      entity: 'VisitReport',
      entityId: report.id,
      userId: session.user.id,
      before: report,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
  }
}
