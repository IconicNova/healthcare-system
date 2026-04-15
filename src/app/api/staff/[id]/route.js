import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const staff = await prisma.staff.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            avatar: true,
            branchId: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
          },
        },
        skills: {
          select: {
            id: true,
            name: true,
            level: true,
            createdAt: true,
          },
        },
        certifications: {
          select: {
            id: true,
            name: true,
            number: true,
            issuedBy: true,
            issueDate: true,
            expiryDate: true,
            createdAt: true,
          },
        },
        availability: {
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            isAvailable: true,
          },
          orderBy: { dayOfWeek: 'asc' },
        },
        visits: {
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
            status: true,
            client: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { startTime: 'desc' },
          take: 10,
        },
        timesheets: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            totalHours: true,
            status: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...staff,
      fullName: `${staff.firstName} ${staff.lastName}`,
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Check if staff exists
    const existing = await prisma.staff.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: { user: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Handle password update if provided
    let userData = {};
    if (body.password) {
      userData.password = await bcrypt.hash(body.password, 10);
    }

    // Update email if provided and check for duplicates within organization
    if (body.email && body.email !== existing.email) {
      // Check User duplicates within org excluding existing.userId
      const duplicateUser = await prisma.user.findFirst({
        where: {
          email: body.email,
          organizationId: session.user.organizationId,
          id: { not: existing.userId },
        },
      });

      if (duplicateUser) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        );
      }

      // Check Staff duplicates within org excluding existing.id
      const duplicateStaff = await prisma.staff.findFirst({
        where: {
          email: body.email,
          organizationId: session.user.organizationId,
          id: { not: existing.id },
        },
      });

      if (duplicateStaff) {
        return NextResponse.json(
          { error: 'Staff with this email already exists' },
          { status: 400 }
        );
      }
    }

    // Update user and staff
    const result = await prisma.$transaction(async (tx) => {
      let user = null;

      // Update user if it exists
      if (existing.userId) {
        user = await tx.user.update({
          where: { id: existing.userId },
          data: {
            ...(body.email && { email: body.email }),
            ...(body.firstName && { firstName: body.firstName }),
            ...(body.lastName && { lastName: body.lastName }),
            ...userData,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            avatar: true,
          },
        });
      } else if (body.password) {
        // Only create user if password is provided (data inconsistency fix)
        const userDataToCreate = {
          email: body.email || existing.email,
          firstName: body.firstName || existing.firstName,
          lastName: body.lastName || existing.lastName,
          role: body.role || existing.role,
          password: await bcrypt.hash(body.password, 10),
          organizationId: session.user.organizationId,
        };

        user = await tx.user.create({
          data: userDataToCreate,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            avatar: true,
          },
        });

        // Link user to staff
        await tx.staff.update({
          where: { id },
          data: { userId: user.id },
        });
      }
      // If no userId and no password, skip user creation (just update staff record)

      // Update staff
      const staff = await tx.staff.update({
        where: { id },
        data: {
          ...(body.firstName && { firstName: body.firstName }),
          ...(body.lastName && { lastName: body.lastName }),
          ...(body.email && { email: body.email }),
          ...(body.phone && { phone: body.phone }),
          ...(body.role && { role: body.role }),
          ...(body.payType && { payType: body.payType }),
          ...(body.payRate !== undefined && { hourlyRate: body.payRate }),
          ...(body.status && { status: body.status }),
          ...(body.branchId !== undefined && { branchId: body.branchId }),
          ...(body.hireDate && { hireDate: new Date(body.hireDate) }),
          ...(body.licenseNumber !== undefined && { licenseNumber: body.licenseNumber }),
          ...(body.licenseExpiry && { licenseExpiry: new Date(body.licenseExpiry) }),
        },
        include: {
          user: {
            select: {
              avatar: true,
            },
          },
          branch: {
            select: {
              name: true,
            },
          },
          skills: {
            select: {
              id: true,
              name: true,
              level: true,
            },
          },
          certifications: {
            select: {
              id: true,
              name: true,
              expiryDate: true,
            },
          },
        },
      });

      return { user, staff };
    });

    return NextResponse.json({
      ...result.staff,
      user: result.user,
      fullName: `${result.staff.firstName} ${result.staff.lastName}`,
    });
  } catch (error) {
    console.error('Error updating staff:', error);
    return NextResponse.json({ error: 'Failed to update staff' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if staff exists
    const existing = await prisma.staff.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: { visits: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Nullify staff on visits instead of deleting them (preserves client care history)
    await prisma.$transaction(async (tx) => {
      // For active/assignable visits: unassign staff and mark as VACANT
      const activeStatuses = ['SCHEDULED', 'IN_PROGRESS', 'CLOCKED_IN', 'OFFERED', 'VACANT', 'ON_HOLD', 'LATE'];
      await tx.visit.updateMany({
        where: { staffId: id, status: { in: activeStatuses } },
        data: { staffId: null, status: 'VACANT' },
      });

      // For terminal visits (COMPLETED, APPROVED, CANCELLED, etc.): only nullify staffId, preserve status
      await tx.visit.updateMany({
        where: { staffId: id, status: { notIn: activeStatuses } },
        data: { staffId: null },
      });

      // Delete all staff-specific records
      await tx.staffSkill.deleteMany({ where: { staffId: id } });
      await tx.staffCertification.deleteMany({ where: { staffId: id } });
      await tx.staffAvailability.deleteMany({ where: { staffId: id } });
      await tx.medAdministration.deleteMany({ where: { staffId: id } });
      await tx.timesheet.deleteMany({ where: { staffId: id } });

      // Delete associated user if exists - this will cascade delete the staff record
      if (existing.userId) {
        // Delete any remaining timesheets associated with this user
        await tx.timesheet.deleteMany({
          where: { userId: existing.userId },
        });

        await tx.user.delete({
          where: { id: existing.userId },
        });
        // Staff is automatically deleted via CASCADE when user is deleted
      } else {
        // If no user, delete staff directly
        await tx.staff.delete({
          where: { id },
        });
      }
    });

    return NextResponse.json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    console.error('Error deleting staff:', error);
    return NextResponse.json({ error: 'Failed to delete staff' }, { status: 500 });
  }
}
