import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { buildReviewQueueFilters } from '@/components/care-delivery/forms-review.helpers';
import { buildReviewQueueWhereClause, normalizeFormStatus } from '@/lib/form-review';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const filters = buildReviewQueueFilters(
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );

    const where = buildReviewQueueWhereClause(
      session.user.organizationId,
      filters
    );

    const forms = await prisma.clientForm.findMany({
      where,
      orderBy: [{ submittedAt: 'desc' }, { updatedAt: 'desc' }],
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            category: true,
            isRequired: true,
          },
        },
        visit: {
          select: {
            id: true,
            title: true,
            startTime: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({
      forms: forms.map((form) => ({
        ...form,
        status: normalizeFormStatus(form.status),
      })),
    });
  } catch (error) {
    console.error('Error fetching review queue forms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review queue forms' },
      { status: 500 }
    );
  }
}
