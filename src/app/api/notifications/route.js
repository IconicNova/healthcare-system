import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { parsePaginationParams } from '@/lib/api-safety';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const { page, limit: pageSize, skip } = parsePaginationParams(searchParams, {
      defaultLimit: 20,
      pageSizeParam: 'pageSize',
    });
    const readFilter = searchParams.get('read');
    const category = searchParams.get('category');

    const where = {
      userId: session.user.id,
    };

    if (readFilter === 'true' || readFilter === 'false') {
      where.read = readFilter === 'true';
    }

    if (category && category !== 'all') {
      where.type = category;
    }

    const [notifications, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.notification.count({ where }),
    ]);

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
