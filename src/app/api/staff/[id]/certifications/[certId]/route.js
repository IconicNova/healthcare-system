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

    const { id: staffId, certId } = params;
    const body = await request.json();

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

    // Verify certification belongs to staff
    const existing = await prisma.staffCertification.findFirst({
      where: {
        id: certId,
        staffId: staffId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Certification not found' }, { status: 404 });
    }

    const certification = await prisma.staffCertification.update({
      where: { id: certId },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.number !== undefined && { number: body.number }),
        ...(body.issuedBy && { issuedBy: body.issuedBy }),
        ...(body.issueDate && { issueDate: new Date(body.issueDate) }),
        ...(body.expiryDate !== undefined && { expiryDate: body.expiryDate ? new Date(body.expiryDate) : null }),
      },
      select: {
        id: true,
        name: true,
        number: true,
        issuedBy: true,
        issueDate: true,
        expiryDate: true,
        createdAt: true,
      },
    });

    // Calculate status
    const now = new Date();
    let status = 'ACTIVE';
    if (certification.expiryDate) {
      const daysUntilExpiry = Math.ceil((new Date(certification.expiryDate) - now) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry < 0) {
        status = 'EXPIRED';
      } else if (daysUntilExpiry <= 30) {
        status = 'EXPIRING_SOON';
      }
    }

    return NextResponse.json({ ...certification, status });
  } catch (error) {
    console.error('Error updating certification:', error);
    return NextResponse.json({ error: 'Failed to update certification' }, { status: 500 });
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

    const { id: staffId, certId } = params;

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

    // Verify certification belongs to staff
    const cert = await prisma.staffCertification.findFirst({
      where: {
        id: certId,
        staffId: staffId,
      },
    });

    if (!cert) {
      return NextResponse.json({ error: 'Certification not found' }, { status: 404 });
    }

    await prisma.staffCertification.delete({
      where: { id: certId },
    });

    return NextResponse.json({ message: 'Certification removed successfully' });
  } catch (error) {
    console.error('Error removing certification:', error);
    return NextResponse.json({ error: 'Failed to remove certification' }, { status: 500 });
  }
}
