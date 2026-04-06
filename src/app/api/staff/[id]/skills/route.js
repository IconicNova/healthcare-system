import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Verify staff belongs to organization
    const staff = await prisma.staff.findUnique({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    const skills = await prisma.staffSkill.findMany({
      where: { staffId: id },
      select: {
        id: true,
        name: true,
        level: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(skills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    const { name, level } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Skill name is required' },
        { status: 400 }
      );
    }

    // Verify staff belongs to organization
    const staff = await prisma.staff.findUnique({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Check if skill already exists for this staff
    const existing = await prisma.staffSkill.findUnique({
      where: {
        staffId_name: {
          staffId: id,
          name: name,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Skill already exists for this staff member' },
        { status: 400 }
      );
    }

    const skill = await prisma.staffSkill.create({
      data: {
        name,
        level: level || null,
        staffId: id,
      },
      select: {
        id: true,
        name: true,
        level: true,
        createdAt: true,
      },
    });

    return NextResponse.json(skill, { status: 201 });
  } catch (error) {
    console.error('Error adding skill:', error);
    return NextResponse.json({ error: 'Failed to add skill' }, { status: 500 });
  }
}
