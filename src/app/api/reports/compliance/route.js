import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { format, addDays, startOfMonth } from 'date-fns';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const thirtyDaysFromNow = addDays(now, 30);
    const monthStart = startOfMonth(now);

    // Expiring certifications (next 30 days)
    const expiringCerts = await prisma.staffCertification.findMany({
      where: {
        expiryDate: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
        staff: {
          organizationId: session.user.organizationId,
        },
      },
      include: {
        staff: true,
      },
      orderBy: { expiryDate: 'asc' },
    });

    const expiringCertifications = expiringCerts.map(cert => ({
      id: cert.id,
      staffName: `${cert.staff.firstName} ${cert.staff.lastName}`,
      staffRole: cert.staff.role,
      certificationName: cert.name,
      expiryDate: format(cert.expiryDate, 'MMM d, yyyy'),
      daysUntilExpiry: Math.floor((cert.expiryDate - now) / (1000 * 60 * 60 * 24)),
    }));

    // Overdue forms (DRAFT forms past their expected submission date)
    const overdueForms = await prisma.clientForm.findMany({
      where: {
        status: 'DRAFT',
        client: {
          organizationId: session.user.organizationId,
        },
        createdAt: {
          lt: addDays(now, -7), // Forms older than 7 days in DRAFT status
        },
      },
      include: {
        template: true,
        client: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const overdueFormsData = overdueForms.map(form => ({
      id: form.id,
      formName: form.template.name,
      clientName: `${form.client.firstName} ${form.client.lastName}`,
      createdAt: format(form.createdAt, 'MMM d, yyyy'),
      daysOverdue: Math.floor((now - form.createdAt) / (1000 * 60 * 60 * 24)) - 7,
    }));

    // Missed visits this month
    const missedVisits = await prisma.visit.findMany({
      where: {
        organizationId: session.user.organizationId,
        status: { in: ['MISSED', 'NO_SHOW'] },
        startTime: {
          gte: monthStart,
        },
      },
      include: {
        client: true,
        staff: true,
      },
      orderBy: { startTime: 'desc' },
    });

    const missedVisitsData = missedVisits.map(visit => ({
      id: visit.id,
      clientName: `${visit.client.firstName} ${visit.client.lastName}`,
      staffName: visit.staff ? `${visit.staff.firstName} ${visit.staff.lastName}` : 'Unassigned',
      scheduledDate: format(new Date(visit.startTime), 'MMM d, yyyy'),
      scheduledTime: format(new Date(visit.startTime), 'h:mm a'),
    }));

    // GPS compliance rate
    const allVisits = await prisma.visit.findMany({
      where: {
        organizationId: session.user.organizationId,
        startTime: {
          gte: monthStart,
        },
      },
    });

    // Check for visits with actual start time (proxy for GPS verification)
    const visitsWithGPS = allVisits.filter(v => v.actualStart !== null).length;
    const gpsComplianceRate = allVisits.length > 0
      ? ((visitsWithGPS / allVisits.length) * 100).toFixed(1)
      : 0;

    return NextResponse.json({
      expiringCertifications,
      overdueForms: overdueFormsData,
      missedVisits: missedVisitsData,
      gpsCompliance: {
        rate: parseFloat(gpsComplianceRate),
        verified: visitsWithGPS,
        total: allVisits.length,
      },
    });
  } catch (error) {
    console.error('Error fetching compliance report:', error);
    return NextResponse.json({ error: 'Failed to fetch compliance report' }, { status: 500 });
  }
}
