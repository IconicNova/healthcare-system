import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// In a real app, this would be stored in the database
// For now, we'll use localStorage-like storage in a file
let config = {
  scheduling: {
    defaultShiftLength: 8,
    maxOvertimeHours: 10,
    clockInWindow: 15,
    lateThreshold: 6,
    requireGPS: true,
    autoCancelHours: 24,
  },
  billing: {
    taxRate: 0,
    paymentTerms: 30,
    invoicePrefix: 'INV',
    paymentMethods: ['cash', 'check', 'card', 'transfer'],
  },
  payroll: {
    overtimeThreshold: 40,
    overtimeMultiplier: 1.5,
    mileageRate: 0.67,
    payPeriod: 'biweekly',
  },
  notifications: {
    lateClockInAlert: true,
    lateClockInThreshold: 15,
    missedVisitAlert: true,
    expiringCertWarning: true,
    expiringCertDays: 30,
    formDueReminder: true,
    formDueHours: 24,
    invoiceOverdueAlert: true,
    invoiceOverdueDays: 7,
  },
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(config);
}

export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is ADMIN
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();

    // Update config based on what's provided
    if (body.scheduling) {
      config.scheduling = { ...config.scheduling, ...body.scheduling };
    }
    if (body.billing) {
      config.billing = { ...config.billing, ...body.billing };
    }
    if (body.payroll) {
      config.payroll = { ...config.payroll, ...body.payroll };
    }
    if (body.notifications) {
      config.notifications = { ...config.notifications, ...body.notifications };
    }

    // In a real app, save to database here

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error updating config:', error);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}
