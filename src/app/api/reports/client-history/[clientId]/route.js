import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { format } from 'date-fns';
import { countSubmittedLikeStatuses, normalizeFormStatus } from '@/lib/form-review';

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clientId } = await params;

    // Get client details
    const client = await prisma.client.findUnique({
      where: {
        id: clientId,
        organizationId: session.user.organizationId,
      },
      include: {
        carePlans: {
          where: { status: true },
        },
        medications: true,
        forms: {
          include: {
            template: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get client visits
    const visits = await prisma.visit.findMany({
      where: {
        clientId,
        organizationId: session.user.organizationId,
      },
      include: {
        staff: true,
        service: true,
        visitTasks: true,
        visitNotes: true,
      },
      orderBy: { startTime: 'desc' },
    });

    // Get medication administrations
    const medAdministrations = await prisma.medAdministration.findMany({
      where: {
        medication: {
          clientId,
        },
      },
      include: {
        medication: true,
        staff: true,
      },
      orderBy: { administeredAt: 'desc' },
    });

    // Format visits for history
    const visitHistory = visits.map(visit => ({
      id: visit.id,
      date: format(new Date(visit.startTime), 'MMM d, yyyy'),
      time: format(new Date(visit.startTime), 'h:mm a'),
      staffName: visit.staff ? `${visit.staff.firstName} ${visit.staff.lastName}` : 'Unassigned',
      serviceName: visit.service?.name || 'General Care',
      status: visit.status,
      duration: visit.actualStart && visit.actualEnd
        ? ((new Date(visit.actualEnd) - new Date(visit.actualStart)) / (1000 * 60 * 60)).toFixed(2)
        : visit.startTime && visit.endTime
        ? ((new Date(visit.endTime) - new Date(visit.startTime)) / (1000 * 60 * 60)).toFixed(2)
        : 'N/A',
      notes: visit.notes,
      tasks: visit.visitTasks,
    }));

    // Format medication history
    const medicationHistory = medAdministrations.map(med => ({
      id: med.id,
      date: format(new Date(med.administeredAt), 'MMM d, yyyy'),
      medication: med.medication.name,
      dosage: med.dosage || med.medication.dosage,
      administeredBy: med.staff ? `${med.staff.firstName} ${med.staff.lastName}` : 'Unknown',
      status: med.status,
    }));

    // Format form history
    const formHistory = client.forms.map(form => ({
      id: form.id,
      date: format(new Date(form.createdAt), 'MMM d, yyyy'),
      formName: form.template.name,
      status: normalizeFormStatus(form.status),
      submittedBy: form.submittedBy || 'N/A',
    }));

    // Summary stats
    const summary = {
      totalVisits: visits.length,
      activeCarePlans: client.carePlans.length,
      medicationsCount: client.medications.length,
      formsSubmitted: countSubmittedLikeStatuses(client.forms.map((form) => form.status)),
    };

    return NextResponse.json({
      client: {
        id: client.id,
        name: `${client.firstName} ${client.lastName}`,
      },
      summary,
      visitHistory,
      medicationHistory,
      formHistory,
    });
  } catch (error) {
    console.error('Error fetching client history:', error);
    return NextResponse.json({ error: 'Failed to fetch client history' }, { status: 500 });
  }
}
