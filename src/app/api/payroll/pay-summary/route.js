import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasRoleAccess } from '@/lib/utils';

// IRS mileage rate (2024)
const MILEAGE_RATE = 0.67;

// GET - Get pay summary for all staff in period
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check RBAC - only ADMIN, MANAGER can view pay summary
    if (!hasRoleAccess(session.user.role, ['ADMIN', 'MANAGER'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Default to current week
    const start = startDate ? new Date(startDate) : (() => {
      const d = new Date();
      d.setDate(d.getDate() - d.getDay());
      d.setHours(0, 0, 0, 0);
      return d;
    })();

    const end = endDate ? new Date(endDate) : (() => {
      const d = new Date(start);
      d.setDate(d.getDate() + 6);
      d.setHours(23, 59, 59, 999);
      return d;
    })();

    const organizationId = session.user.organizationId;

    // Get all approved timesheets in period
    const timesheets = await prisma.timesheet.findMany({
      where: {
        organizationId,
        status: 'APPROVED',
        startDate: { gte: start },
        endDate: { lte: end },
      },
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            hourlyRate: true,
            payType: true,
          },
        },
        timesheetEntries: true,
      },
    });

    // Calculate pay for each staff
    const paySummary = timesheets.map((timesheet) => {
      const staff = timesheet.staff;
      const totalHours = timesheet.totalHours || 0;

      // Calculate regular and overtime hours
      // Assuming 40 hours/week is regular, over 40 is overtime
      const regularHours = Math.min(totalHours, 40);
      const overtimeHours = Math.max(0, totalHours - 40);

      // Get pay rate
      const payRate = staff.hourlyRate || 0;

      // Calculate pay based on pay type
      let regularPay = 0;
      let overtimePay = 0;
      let grossPay = 0;

      if (staff.payType === 'HOURLY') {
        regularPay = regularHours * payRate;
        overtimePay = overtimeHours * payRate * 1.5; // 1.5x for overtime
        grossPay = regularPay + overtimePay;
      } else if (staff.payType === 'SALARY') {
        // For salary, use weekly rate (annual / 52)
        const weeklyRate = payRate / 52;
        regularPay = weeklyRate;
        overtimePay = 0; // Salaried typically no overtime
        grossPay = regularPay;
      } else {
        // PER_VISIT or default
        regularPay = totalHours * payRate;
        overtimePay = 0;
        grossPay = regularPay;
      }

      // Calculate mileage pay (sum of mileage from entries if tracked)
      // For now, we'll estimate based on entries
      const totalMiles = 0; // TODO: Add mileage tracking to TimesheetEntry model
      const mileagePay = totalMiles * MILEAGE_RATE;

      return {
        staffId: staff.id,
        staffName: `${staff.firstName} ${staff.lastName}`,
        employeeId: staff.employeeId,
        payType: staff.payType,
        payRate: payRate,
        regularHours: parseFloat(regularHours.toFixed(2)),
        overtimeHours: parseFloat(overtimeHours.toFixed(2)),
        regularPay: parseFloat(regularPay.toFixed(2)),
        overtimePay: parseFloat(overtimePay.toFixed(2)),
        mileagePay: parseFloat(mileagePay.toFixed(2)),
        grossPay: parseFloat((grossPay + mileagePay).toFixed(2)),
        timesheetPeriod: `${formatDate(timesheet.startDate)} - ${formatDate(timesheet.endDate)}`,
      };
    });

    // Calculate totals
    const totals = paySummary.reduce(
      (acc, staff) => ({
        regularHours: acc.regularHours + staff.regularHours,
        overtimeHours: acc.overtimeHours + staff.overtimeHours,
        regularPay: acc.regularPay + staff.regularPay,
        overtimePay: acc.overtimePay + staff.overtimePay,
        mileagePay: acc.mileagePay + staff.mileagePay,
        grossPay: acc.grossPay + staff.grossPay,
      }),
      { regularHours: 0, overtimeHours: 0, regularPay: 0, overtimePay: 0, mileagePay: 0, grossPay: 0 }
    );

    return NextResponse.json({
      paySummary,
      totals: {
        regularHours: parseFloat(totals.regularHours.toFixed(2)),
        overtimeHours: parseFloat(totals.overtimeHours.toFixed(2)),
        regularPay: parseFloat(totals.regularPay.toFixed(2)),
        overtimePay: parseFloat(totals.overtimePay.toFixed(2)),
        mileagePay: parseFloat(totals.mileagePay.toFixed(2)),
        grossPay: parseFloat(totals.grossPay.toFixed(2)),
      },
      period: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching pay summary:', error);
    return NextResponse.json({ error: 'Failed to fetch pay summary' }, { status: 500 });
  }
}

// Helper function to format date
function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
