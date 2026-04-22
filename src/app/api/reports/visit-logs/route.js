import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { format, parseISO } from 'date-fns';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '25');
    const skip = (page - 1) * pageSize;

    // Filters
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const clientId = searchParams.get('clientId');
    const staffId = searchParams.get('staffId');
    const serviceId = searchParams.get('serviceId');
    const branchId = searchParams.get('branchId');
    const status = searchParams.get('status');

    // Build where clause
    const where = {
      organizationId: session.user.organizationId,
    };

    if (dateFrom) {
      const fromDate = parseISO(dateFrom);
      const startOfDay = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate(), 0, 0, 0, 0);
      where.startTime = { ...where.startTime, gte: startOfDay };
    }
    if (dateTo) {
      const toDate = parseISO(dateTo);
      const endOfDay = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59, 999);
      where.startTime = { ...where.startTime, lte: endOfDay };
    }
    if (clientId) {
      where.clientId = clientId;
    }
    if (staffId) {
      where.staffId = staffId;
    }
    if (serviceId) {
      where.serviceId = serviceId;
    }
    if (branchId) {
      where.branchId = branchId;
    }
    if (status) {
      where.status = status;
    }

    // Get total count
    const totalCount = await prisma.visit.count({ where });

    // Get visits with includes
    const visits = await prisma.visit.findMany({
      where,
      include: {
        client: true,
        staff: true,
        service: true,
        branch: true,
      },
      orderBy: { startTime: 'desc' },
      skip,
      take: pageSize,
    });

    // Format visits
    const visitLogs = visits.map(visit => ({
      id: visit.id.slice(0, 8),
      date: format(new Date(visit.startTime), 'MMM d, yyyy'),
      client: `${visit.client.firstName} ${visit.client.lastName}`,
      staff: visit.staff ? `${visit.staff.firstName} ${visit.staff.lastName}` : 'Unassigned',
      service: visit.service ? `${visit.service.name}` : 'General',
      scheduled: {
        start: format(new Date(visit.startTime), 'h:mm a'),
        end: format(new Date(visit.endTime), 'h:mm a'),
      },
      actual: visit.actualStart && visit.actualEnd ? {
        start: format(new Date(visit.actualStart), 'h:mm a'),
        end: format(new Date(visit.actualEnd), 'h:mm a'),
      } : null,
      duration: visit.actualStart && visit.actualEnd
        ? ((new Date(visit.actualEnd) - new Date(visit.actualStart)) / (1000 * 60 * 60)).toFixed(2)
        : visit.startTime && visit.endTime
        ? ((new Date(visit.endTime) - new Date(visit.startTime)) / (1000 * 60 * 60)).toFixed(2)
        : 'N/A',
      status: visit.status,
      evvVerified: visit.actualStart !== null, // Placeholder for GPS verification
      branch: visit.branch?.name || 'Main',
    }));

    // Get filter options
    const clients = await prisma.client.findMany({
      where: { organizationId: session.user.organizationId },
      select: { id: true, firstName: true, lastName: true },
      take: 50,
    });

    const staff = await prisma.staff.findMany({
      where: { organizationId: session.user.organizationId },
      select: { id: true, firstName: true, lastName: true },
      take: 50,
    });

    const services = await prisma.service.findMany({
      where: { organizationId: session.user.organizationId },
      select: { id: true, name: true },
    });

    const branches = await prisma.branch.findMany({
      where: { organizationId: session.user.organizationId },
      select: { id: true, name: true },
    });

    return NextResponse.json({
      visits: visitLogs,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
      filters: {
        clients: clients.map(c => ({ id: c.id, name: `${c.firstName} ${c.lastName}` })),
        staff: staff.map(s => ({ id: s.id, name: `${s.firstName} ${s.lastName}` })),
        services,
        branches,
      },
    });
  } catch (error) {
    console.error('Error fetching visit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch visit logs' }, { status: 500 });
  }
}
