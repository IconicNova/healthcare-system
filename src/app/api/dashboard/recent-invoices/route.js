import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { format } from 'date-fns';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get 5 most recent invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        visit: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    const recentInvoices = invoices.map(invoice => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      clientName: `${invoice.client.firstName} ${invoice.client.lastName}`,
      amount: invoice.amount,
      formattedAmount: `$${invoice.amount.toFixed(2)}`,
      dueDate: format(invoice.dueDate, 'MMM d, yyyy'),
      status: invoice.status,
      createdAt: format(invoice.createdAt, 'MMM d, yyyy'),
    }));

    return NextResponse.json({ invoices: recentInvoices });
  } catch (error) {
    console.error('Error fetching recent invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch recent invoices' }, { status: 500 });
  }
}
