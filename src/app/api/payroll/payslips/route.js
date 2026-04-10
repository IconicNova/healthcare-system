import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasRoleAccess } from '@/lib/utils';

const OVERTIME_THRESHOLD = 40;
const OVERTIME_MULTIPLIER = 1.5;

// Estimated deduction rates (placeholder - real payroll uses tax tables)
const FEDERAL_TAX_RATE = 0.12;
const STATE_TAX_RATE = 0.05;
const FICA_RATE = 0.0765;

// GET - Compute payslips from approved timesheets
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasRoleAccess(session.user.role, ['ADMIN', 'MANAGER', 'STAFF'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const staffId = searchParams.get('staffId');

    const organizationId = session.user.organizationId;

    // Default to current month
    const now = new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate
      ? new Date(endDate)
      : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const where = {
      organizationId,
      status: { in: ['APPROVED', 'PAID'] },
      startDate: { gte: start },
      endDate: { lte: end },
    };

    // STAFF can only see their own
    if (session.user.role === 'STAFF') {
      const staffRecord = await prisma.staff.findFirst({
        where: { userId: session.user.id },
      });
      if (staffRecord) {
        where.staffId = staffRecord.id;
      }
    } else if (staffId) {
      where.staffId = staffId;
    }

    const timesheets = await prisma.timesheet.findMany({
      where,
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            email: true,
            hourlyRate: true,
            payType: true,
            role: true,
          },
        },
        timesheetEntries: {
          include: {
            visit: {
              select: {
                id: true,
                title: true,
                startTime: true,
                endTime: true,
                client: {
                  select: { firstName: true, lastName: true },
                },
                service: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    // Group timesheets by staff to combine into payslips
    const staffMap = new Map();

    for (const ts of timesheets) {
      const key = ts.staffId;
      if (!staffMap.has(key)) {
        staffMap.set(key, {
          staff: ts.staff,
          timesheets: [],
        });
      }
      staffMap.get(key).timesheets.push(ts);
    }

    const payslips = Array.from(staffMap.values()).map((entry) => {
      const { staff, timesheets: staffTimesheets } = entry;
      const payRate = staff.hourlyRate || 0;

      let totalRegularHours = 0;
      let totalOvertimeHours = 0;

      for (const ts of staffTimesheets) {
        const hours = ts.totalHours || 0;
        const regular = Math.min(hours, OVERTIME_THRESHOLD);
        const overtime = Math.max(0, hours - OVERTIME_THRESHOLD);
        totalRegularHours += regular;
        totalOvertimeHours += overtime;
      }

      let regularPay = 0;
      let overtimePay = 0;

      if (staff.payType === 'HOURLY') {
        regularPay = totalRegularHours * payRate;
        overtimePay = totalOvertimeHours * payRate * OVERTIME_MULTIPLIER;
      } else if (staff.payType === 'SALARY') {
        // Weekly rate × number of weeks
        const weekCount = staffTimesheets.length;
        regularPay = (payRate / 52) * weekCount;
        overtimePay = 0;
      } else {
        regularPay = totalRegularHours * payRate;
        overtimePay = 0;
      }

      const mileagePay = 0; // placeholder
      const grossPay = regularPay + overtimePay + mileagePay;

      // Estimated deductions
      const federalTax = grossPay * FEDERAL_TAX_RATE;
      const stateTax = grossPay * STATE_TAX_RATE;
      const fica = grossPay * FICA_RATE;
      const totalDeductions = federalTax + stateTax + fica;
      const netPay = grossPay - totalDeductions;

      // Generate payslip number
      const periodStr = `${start.getFullYear()}${String(start.getMonth() + 1).padStart(2, '0')}`;
      const payslipNumber = `PS-${periodStr}-${staff.employeeId}`;

      return {
        payslipNumber,
        staffId: staff.id,
        staffName: `${staff.firstName} ${staff.lastName}`,
        employeeId: staff.employeeId,
        email: staff.email,
        role: staff.role,
        payType: staff.payType,
        payRate,
        period: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
        earnings: {
          regularHours: parseFloat(totalRegularHours.toFixed(2)),
          overtimeHours: parseFloat(totalOvertimeHours.toFixed(2)),
          regularPay: parseFloat(regularPay.toFixed(2)),
          overtimePay: parseFloat(overtimePay.toFixed(2)),
          mileagePay: parseFloat(mileagePay.toFixed(2)),
          grossPay: parseFloat(grossPay.toFixed(2)),
        },
        deductions: {
          federalTax: parseFloat(federalTax.toFixed(2)),
          stateTax: parseFloat(stateTax.toFixed(2)),
          fica: parseFloat(fica.toFixed(2)),
          totalDeductions: parseFloat(totalDeductions.toFixed(2)),
        },
        netPay: parseFloat(netPay.toFixed(2)),
        timesheetCount: staffTimesheets.length,
        timesheetIds: staffTimesheets.map((ts) => ts.id),
        entries: staffTimesheets.flatMap((ts) =>
          ts.timesheetEntries.map((entry) => ({
            date: entry.date,
            hours: entry.hours,
            visitTitle: entry.visit?.title || 'Manual Entry',
            clientName: entry.visit
              ? `${entry.visit.client.firstName} ${entry.visit.client.lastName}`
              : '-',
            serviceName: entry.visit?.service?.name || '-',
          }))
        ),
      };
    });

    return NextResponse.json({
      payslips,
      period: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      summary: {
        totalStaff: payslips.length,
        totalGrossPay: parseFloat(
          payslips.reduce((sum, p) => sum + p.earnings.grossPay, 0).toFixed(2)
        ),
        totalNetPay: parseFloat(
          payslips.reduce((sum, p) => sum + p.netPay, 0).toFixed(2)
        ),
        totalDeductions: parseFloat(
          payslips.reduce((sum, p) => sum + p.deductions.totalDeductions, 0).toFixed(2)
        ),
      },
    });
  } catch (error) {
    console.error('Error computing payslips:', error);
    return NextResponse.json({ error: 'Failed to compute payslips' }, { status: 500 });
  }
}
