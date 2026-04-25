import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/api-safety';

const STAFF_MUTATION_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'];

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const forbiddenResponse = requireRole(session, STAFF_MUTATION_ROLES);
    if (forbiddenResponse) {
      return forbiddenResponse;
    }

    const { id: staffId, skillId } = params;
    const body = await request.json();

    const { name, level } = body;

    // Verify staff belongs to organization
    const staff = await prisma.staff.findFirst({
      where: {
        id: staffId,
        organizationId: session.user.organizationId,
      },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Verify skill belongs to staff
    const existingSkill = await prisma.staffSkill.findFirst({
      where: {
        id: skillId,
        staffId: staffId,
      },
    });

    if (!existingSkill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    // Check for duplicate name if name is being updated
    if (name && name !== existingSkill.name) {
      const duplicate = await prisma.staffSkill.findUnique({
        where: {
          staffId_name: {
            staffId: staffId,
            name: name,
          },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'Skill with this name already exists for this staff member' },
          { status: 400 }
        );
      }
    }

    const updatedSkill = await prisma.staffSkill.update({
      where: { id: skillId },
      data: {
        ...(name && { name }),
        ...(level !== undefined && { level: level || null }),
      },
      select: {
        id: true,
        name: true,
        level: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedSkill);
  } catch (error) {
    console.error('Error updating skill:', error);
    return NextResponse.json({ error: 'Failed to update skill' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const forbiddenResponse = requireRole(session, STAFF_MUTATION_ROLES);
    if (forbiddenResponse) {
      return forbiddenResponse;
    }

    const { id: staffId, skillId } = params;

    // Verify staff belongs to organization
    const staff = await prisma.staff.findFirst({
      where: {
        id: staffId,
        organizationId: session.user.organizationId,
      },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Verify skill belongs to staff
    const skill = await prisma.staffSkill.findFirst({
      where: {
        id: skillId,
        staffId: staffId,
      },
    });

    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    await prisma.staffSkill.delete({
      where: { id: skillId },
    });

    return NextResponse.json({ message: 'Skill removed successfully' });
  } catch (error) {
    console.error('Error removing skill:', error);
    return NextResponse.json({ error: 'Failed to remove skill' }, { status: 500 });
  }
}
