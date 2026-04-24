import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasRoleAccess } from '@/lib/utils';
import { parsePaginationParams } from '@/lib/api-safety';
import { hasTimesheetOverlap } from '@/lib/timesheet-helpers';
import { logAuditEvent } from '@/lib/audit-log';
import { rateLimit } from '@/lib/rate-limit';

// GET - List timesheets with filters
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check RBAC
    if (!hasRoleAccess(session.user.role, ['ADMIN', 'MANAGER', 'SUPERVISOR', 'STAFF'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePaginationParams(searchParams, { defaultLimit: 10 });
    const status = searchParams.get('status') || '';
    const staffId = searchParams.get('staffId') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const organizationId = session.user.organizationId;

    // Build where clause
    const where = { organizationId };

    // Staff can only see their own timesheets — look up their Staff record
    if (session.user.role === 'STAFF') {
      const staffRecord = await prisma.staff.findFirst({
        where: { userId: session.user.id },
        select: { id: true },
      });
      if (staffRecord) {
        where.staffId = staffRecord.id;
      } else {
        // No staff record found for this user — return empty
        return NextResponse.json({
          timesheets: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        });
      }
    }

    // Add status filter
    if (status) {
      where.status = status;
    }

    // Add staff filter (ADMIN/MANAGER only)
    if (staffId && hasRoleAccess(session.user.role, ['ADMIN', 'MANAGER'])) {
      where.staffId = staffId;
    }

    // Add date range filter
    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate);
      if (endDate) where.startDate.lte = new Date(endDate);
    }

    const [timesheets, total] = await Promise.all([
      prisma.timesheet.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: 'desc' },
        include: {
          staff: {
            select: {
              firstName: true,
              lastName: true,
              employeeId: true,
            },
          },
          _count: {
            select: { timesheetEntries: true },
          },
        },
      }),
      prisma.timesheet.count({ where }),
    ]);

    // Format timesheets
    const formattedTimesheets = timesheets.map((ts) => ({
      ...ts,
      staffName: `${ts.staff.firstName} ${ts.staff.lastName}`,
      staff: undefined,
    }));

    return NextResponse.json({
      timesheets: formattedTimesheets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching timesheets:', error);
    return NextResponse.json({ error: 'Failed to fetch timesheets' }, { status: 500 });
  }
}

// POST - Create a new timesheet
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check RBAC - only ADMIN, MANAGER can create timesheets manually
    if (!hasRoleAccess(session.user.role, ['ADMIN', 'MANAGER'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { staffId, startDate, endDate, notes } = body;

    const rateLimitResult = await rateLimit(`timesheets:create:${session.user.id}`, {
      maxRequests: 30,
      windowMs: 60 * 1000,
    });
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many timesheet changes. Please try again shortly.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) },
        }
      );
    }

    // Validate required fields
    if (!staffId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: staffId, startDate, endDate' },
        { status: 400 }
      );
    }

    // Validate date range
    if (new Date(endDate) <= new Date(startDate)) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    const organizationId = session.user.organizationId;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid start or end date' },
        { status: 400 }
      );
    }

    const hasOverlap = await hasTimesheetOverlap({
      prisma,
      organizationId,
      staffId,
      startDate: start,
      endDate: end,
    });

    if (hasOverlap) {
      return NextResponse.json(
        { error: 'Timesheet overlaps an existing period' },
        { status: 400 }
      );
    }

    const timesheet = await prisma.timesheet.create({
      data: {
        startDate: start,
        endDate: end,
        totalHours: 0,
        status: 'DRAFT',
        notes: notes || null,
        organizationId,
        staffId,
        userId: session.user.id,
      },
      include: {
        staff: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true,
          },
        },
      },
    });

    await logAuditEvent({
      action: 'CREATE',
      entity: 'Timesheet',
      entityId: timesheet.id,
      userId: session.user.id,
      after: timesheet,
    });

    return NextResponse.json(timesheet, { status: 201 });
  } catch (error) {
    console.error('Error creating timesheet:', error);
    return NextResponse.json({ error: 'Failed to create timesheet' }, { status: 500 });
  }
}
