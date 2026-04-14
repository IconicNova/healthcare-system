import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST - Generate a report from visit data
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { clientId, type, startDate, endDate, visitIds } = body;

    // Verify the client belongs to the user's organization
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        organizationId: session.user.organizationId,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Fetch visit data to include in the report
    let visits = [];
    let servicesDelivered = [];
    let notes = [];
    let vitals = [];
    let medications = [];

    if (visitIds && visitIds.length > 0) {
      visits = await prisma.visit.findMany({
        where: {
          id: { in: visitIds },
          clientId: clientId,
        },
        include: {
          staff: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          visitNotes: true,
          vitalSigns: true,
          medAdministrations: {
            include: {
              medication: true,
            },
          },
        },
      });

      servicesDelivered = visits.map(v => ({
        serviceName: v.service?.name || 'Home Health Care',
        startTime: v.startTime,
        endTime: v.endTime,
        staff: `${v.staff?.firstName || ''} ${v.staff?.lastName || ''}`.trim(),
      }));

      notes = visits.flatMap(v => v.visitNotes);
      vitals = visits.flatMap(v => v.vitalSigns);
      medications = visits.flatMap(v => v.medAdministrations);
    }

    // Generate summary from data
    const summary = body.summary || generateSummaryFromData(client, visits, notes, vitals, medications, type);

    const report = await prisma.visitReport.create({
      data: {
        clientId,
        type,
        period: body.period || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        summary,
        clientCondition: body.clientCondition || null,
        notableEvents: body.notableEvents || null,
        recommendations: body.recommendations || null,
        servicesDelivered: servicesDelivered.length > 0 ? servicesDelivered : null,
        generatedBy: session.user.id,
        visitIds: visitIds || [],
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}

// Helper function to generate summary from visit data
function generateSummaryFromData(client, visits, notes, vitals, medications, type) {
  const visitCount = visits.length;
  const visitDates = visits.map(v => new Date(v.startTime).toLocaleDateString()).join(', ');
  const latestVitals = vitals.length > 0 ? vitals.sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))[0] : null;
  const medicationsGiven = medications.length;

  let summary = `Visit Report for ${client.firstName} ${client.lastName}\n\n`;

  if (type === 'VISIT_SUMMARY' && visitCount === 1) {
    summary += `Single visit completed on ${visitDates}.\n\n`;
  } else if (type === 'PERIOD_SUMMARY') {
    summary += `Period covering ${visitCount} visit(s) from ${visitDates}.\n\n`;
  }

  if (latestVitals) {
    summary += `Latest Vital Signs:\n`;
    if (latestVitals.temperature) summary += `- Temperature: ${latestVitals.temperature}${latestVitals.temperatureUnit || 'F'}\n`;
    if (latestVitals.heartRate) summary += `- Heart Rate: ${latestVitals.heartRate} bpm\n`;
    if (latestVitals.bloodPressureSystolic && latestVitals.bloodPressureDiastolic) {
      summary += `- Blood Pressure: ${latestVitals.bloodPressureSystolic}/${latestVitals.bloodPressureDiastolic} mmHg\n`;
    }
    if (latestVitals.oxygenSaturation) summary += `- Oxygen Saturation: ${latestVitals.oxygenSaturation}%\n`;
    if (latestVitals.painLevel !== null) summary += `- Pain Level: ${latestVitals.painLevel}/10\n`;
    summary += '\n';
  }

  if (medicationsGiven > 0) {
    summary += `Medications Administered: ${medicationsGiven} dose(s)\n\n`;
  }

  if (notes.length > 0) {
    summary += `Clinical Notes:\n${notes.map(n => `- ${n.content}`).join('\n')}\n\n`;
  }

  summary += `Report generated on ${new Date().toLocaleString()}`;

  return summary;
}
