import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/api-safety';

const STAFF_MUTATION_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'];

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

    const certifications = await prisma.staffCertification.findMany({
      where: { staffId: id },
      select: {
        id: true,
        name: true,
        number: true,
        issuedBy: true,
        issueDate: true,
        expiryDate: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate status for each certification
    const now = new Date();
    const certificationsWithStatus = certifications.map(cert => {
      if (!cert.expiryDate) {
        return { ...cert, status: 'ACTIVE' };
      }

      const daysUntilExpiry = Math.ceil((new Date(cert.expiryDate) - now) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry < 0) {
        return { ...cert, status: 'EXPIRED' };
      } else if (daysUntilExpiry <= 30) {
        return { ...cert, status: 'EXPIRING_SOON' };
      } else {
        return { ...cert, status: 'ACTIVE' };
      }
    });

    return NextResponse.json(certificationsWithStatus);
  } catch (error) {
    console.error('Error fetching certifications:', error);
    return NextResponse.json({ error: 'Failed to fetch certifications' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const forbiddenResponse = requireRole(session, STAFF_MUTATION_ROLES);
    if (forbiddenResponse) {
      return forbiddenResponse;
    }

    const { id } = params;
    const body = await request.json();

    const { name, number, issuedBy, issueDate, expiryDate } = body;

    // Validate required fields
    if (!name || !issuedBy || !issueDate) {
      return NextResponse.json(
        { error: 'Name, issuedBy, and issueDate are required' },
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

    const certification = await prisma.staffCertification.create({
      data: {
        name,
        number: number || null,
        issuedBy,
        issueDate: new Date(issueDate),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        staffId: id,
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

    return NextResponse.json({ ...certification, status }, { status: 201 });
  } catch (error) {
    console.error('Error adding certification:', error);
    return NextResponse.json({ error: 'Failed to add certification' }, { status: 500 });
  }
}
