import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
import { hasRoleAccess } from '@/lib/utils';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check RBAC - only ADMIN, MANAGER, SUPERVISOR can access billing
    if (!hasRoleAccess(session.user.role, ['ADMIN', 'MANAGER', 'SUPERVISOR'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const organizationId = session.user.organizationId;

    // Calculate date range (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get total invoices count
    const totalInvoices = await prisma.invoice.count({
      where: {
        organizationId,
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Get pending amount (invoices not fully paid)
    const pendingInvoices = await prisma.invoice.findMany({
      where: {
        organizationId,
        status: { in: ['DRAFT', 'SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
      },
      include: {
        payments: true,
      },
    });

    const pendingAmount = pendingInvoices.reduce((sum, inv) => {
      const paid = inv.payments.reduce((pSum, p) => pSum + p.amount, 0);
      return sum + (inv.amount - paid);
    }, 0);

    // Get paid amount
    const paidResult = await prisma.invoice.aggregate({
      where: {
        organizationId,
        status: 'PAID',
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: { amount: true },
    });

    const paidAmount = paidResult._sum.amount || 0;

    // Get overdue count (SENT invoices past due date)
    const overdueCount = await prisma.invoice.count({
      where: {
        organizationId,
        status: 'SENT',
        dueDate: { lt: new Date() },
      },
    });

    return NextResponse.json({
      stats: {
        totalInvoices,
        pendingAmount,
        paidAmount,
        overdueCount,
      },
    });
  } catch (error) {
    console.error('Error fetching billing stats:', error);
    return NextResponse.json({ error: 'Failed to fetch billing stats' }, { status: 500 });
  }
}
