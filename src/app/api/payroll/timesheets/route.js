import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasRoleAccess } from '@/lib/utils';

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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    const status = searchParams.get('status') || '';
    const staffId = searchParams.get('staffId') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const organizationId = session.user.organizationId;

    // Build where clause
    const where = { organizationId };

    // Staff can only see their own timesheets
    if (session.user.role === 'STAFF') {
      where.staffId = session.user.id;
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

    // Validate required fields
    if (!staffId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: staffId, startDate, endDate' },
        { status: 400 }
      );
    }

    const organizationId = session.user.organizationId;

    // Check if timesheet already exists for this staff and week
    const existing = await prisma.timesheet.findFirst({
      where: {
        organizationId,
        staffId,
        startDate: new Date(startDate),
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Timesheet already exists for this period' },
        { status: 400 }
      );
    }

    const timesheet = await prisma.timesheet.create({
      data: {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
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

    return NextResponse.json(timesheet, { status: 201 });
  } catch (error) {
    console.error('Error creating timesheet:', error);
    return NextResponse.json({ error: 'Failed to create timesheet' }, { status: 500 });
  }
}
