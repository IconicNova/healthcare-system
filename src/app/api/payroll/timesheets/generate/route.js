import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasRoleAccess } from '@/lib/utils';

// POST - Auto-generate timesheets from completed visits
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check RBAC - only ADMIN, MANAGER can generate timesheets
    if (!hasRoleAccess(session.user.role, ['ADMIN', 'MANAGER'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { startDate, endDate } = body;

    // Validate required fields
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: startDate, endDate' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const organizationId = session.user.organizationId;

    // Find all COMPLETED visits in the date range
    const visits = await prisma.visit.findMany({
      where: {
        organizationId,
        status: 'COMPLETED',
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        service: {
          select: {
            name: true,
            duration: true,
          },
        },
        client: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    if (visits.length === 0) {
      return NextResponse.json(
        { error: 'No completed visits found for the specified date range' },
        { status: 400 }
      );
    }

    // Group visits by staff
    const visitsByStaff = visits.reduce((acc, visit) => {
      if (visit.staffId) {
        if (!acc[visit.staffId]) {
          acc[visit.staffId] = [];
        }
        acc[visit.staffId].push(visit);
      }
      return acc;
    }, {});

    if (Object.keys(visitsByStaff).length === 0) {
      return NextResponse.json(
        { error: 'No staff-associated visits found' },
        { status: 400 }
      );
    }

    // Generate timesheets in a transaction
    const generatedTimesheets = await prisma.$transaction(async (tx) => {
      const timesheets = [];

      for (const [staffId, staffVisits] of Object.entries(visitsByStaff)) {
        // Check if timesheet already exists for this staff and week
        const existingTimesheet = await tx.timesheet.findFirst({
          where: {
            organizationId,
            staffId,
            startDate: start,
          },
        });

        if (existingTimesheet) {
          continue; // Skip if already exists
        }

        // Calculate total hours from visits
        let totalHours = 0;
        const entries = staffVisits.map((visit) => {
          let hours = 0;

          // Use actual times if available
          if (visit.actualStart && visit.actualEnd) {
            const start = new Date(visit.actualStart);
            const end = new Date(visit.actualEnd);
            hours = (end - start) / (1000 * 60 * 60);
          } else if (visit.scheduledStart && visit.scheduledEnd) {
            const start = new Date(visit.scheduledStart);
            const end = new Date(visit.scheduledEnd);
            hours = (end - start) / (1000 * 60 * 60);
          } else if (visit.service?.duration) {
            hours = visit.service.duration / 60;
          }

          totalHours += hours;

          return {
            date: visit.date,
            hours: parseFloat(hours.toFixed(2)),
            billable: true,
            timesheetId: '', // Will be set after timesheet creation
            visitId: visit.id,
            description: `${visit.service?.name || 'Service'} - ${visit.client.firstName} ${visit.client.lastName}`,
          };
        });

        // Create timesheet with entries
        const timesheet = await tx.timesheet.create({
          data: {
            startDate: start,
            endDate: end,
            totalHours: parseFloat(totalHours.toFixed(2)),
            status: 'DRAFT',
            organizationId,
            staffId,
            userId: session.user.id,
            timesheetEntries: {
              create: entries.map((entry) => ({
                date: entry.date,
                hours: entry.hours,
                billable: entry.billable,
                visitId: entry.visitId,
                notes: entry.description,
              })),
            },
          },
          include: {
            staff: {
              select: {
                firstName: true,
                lastName: true,
                employeeId: true,
              },
            },
            timesheetEntries: true,
          },
        });

        timesheets.push({
          ...timesheet,
          staffName: `${timesheet.staff.firstName} ${timesheet.staff.lastName}`,
          visitCount: staffVisits.length,
        });
      }

      return timesheets;
    });

    return NextResponse.json({
      message: `Generated ${generatedTimesheets.length} timesheet(s)`,
      timesheets: generatedTimesheets,
    });
  } catch (error) {
    console.error('Error generating timesheets:', error);
    return NextResponse.json({ error: 'Failed to generate timesheets' }, { status: 500 });
  }
}
