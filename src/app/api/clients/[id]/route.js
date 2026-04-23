import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { encrypt, getEncryptionConfigurationError, maskSSN } from '@/lib/encryption';
import { requireRole } from '@/lib/api-safety';

const CLIENT_MUTATION_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'];

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const client = await prisma.client.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        emergencyContacts: {
          select: {
            id: true,
            name: true,
            relation: true,
            phone: true,
            email: true,
          },
        },
        carePlans: {
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        },
        visits: {
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
            status: true,
            staff: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { startTime: 'desc' },
          take: 10,
        },
        medications: {
          select: {
            id: true,
            name: true,
            dosage: true,
            frequency: true,
            status: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            carePlans: true,
            visits: true,
            forms: true,
            invoices: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...client,
      ssn: client.ssn ? maskSSN(client.ssn) : null,
      avatar: client.avatar,
      fullName: `${client.firstName} ${client.lastName}`,
    });
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const forbiddenResponse = requireRole(session, CLIENT_MUTATION_ROLES);
    if (forbiddenResponse) {
      return forbiddenResponse;
    }

    const { id } = params;
    const body = await request.json();

    // Check if client exists
    const existing = await prisma.client.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: { user: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    if (body.ssn) {
      const encryptionConfigurationError = getEncryptionConfigurationError();
      if (encryptionConfigurationError) {
        return NextResponse.json(
          {
            error: 'SSN encryption is not configured on the server. Add ENCRYPTION_KEY and redeploy, or leave SSN blank.',
            details: { ssn: [encryptionConfigurationError] },
          },
          { status: 503 }
        );
      }
    }

    const nextClientEmail = typeof body.email === 'string'
      ? body.email.trim()
      : body.email;

    if (body.dateOfBirth) {
      const dob = new Date(body.dateOfBirth);
      const year = dob.getFullYear();
      if (isNaN(dob.getTime()) || year < 1900 || year > new Date().getFullYear()) {
        return NextResponse.json(
          { error: 'Invalid date of birth. Please enter a valid date.' },
          { status: 400 }
        );
      }
    }

    if (existing.userId && body.email !== undefined && !nextClientEmail) {
      return NextResponse.json(
        { error: 'Email is required while this client has a portal account.' },
        { status: 400 }
      );
    }

    // Check for duplicate email if provided and changed
    if (nextClientEmail && nextClientEmail !== existing.email) {
      const duplicate = await prisma.client.findFirst({
        where: {
          email: nextClientEmail,
          organizationId: session.user.organizationId,
          id: { not: id },
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        );
      }
    }

    // Handle password update if provided
    let userData = {};
    if (body.password) {
      userData.password = await bcrypt.hash(body.password, 10);
    }

    // Update client and user
    const result = await prisma.$transaction(async (tx) => {
      let user = null;

      // Update user if it exists
      if (existing.userId) {
        user = await tx.user.update({
          where: { id: existing.userId },
          data: {
            ...(body.email !== undefined && { email: nextClientEmail }),
            ...(body.firstName && { firstName: body.firstName }),
            ...(body.lastName && { lastName: body.lastName }),
            ...userData,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        });
      } else if (body.password) {
        // Only create user if password is provided (data inconsistency fix)
        const userDataToCreate = {
          email: nextClientEmail || existing.email || '',
          firstName: body.firstName || existing.firstName,
          lastName: body.lastName || existing.lastName,
          role: 'CLIENT',
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
          },
        });

        // Link user to client
        await tx.client.update({
          where: { id },
          data: { userId: user.id },
        });
      }

      // Update emergency contacts
      let emergencyContactsData = undefined;
      if (Array.isArray(body.emergencyContacts)) {
        // Delete existing emergency contacts
        await tx.emergencyContact.deleteMany({
          where: { clientId: id },
        });

        // Create new emergency contacts
        emergencyContactsData = {
          create: body.emergencyContacts
            .filter(c => c.name.trim())
            .map(contact => ({
              name: contact.name,
              relation: contact.relation,
              phone: contact.phone,
              email: contact.email || null,
            })),
        };
      }

      // Update client
      const client = await tx.client.update({
        where: { id },
        data: {
          ...(body.firstName && { firstName: body.firstName }),
          ...(body.lastName && { lastName: body.lastName }),
          ...(body.email !== undefined && { email: nextClientEmail || null }),
          ...(body.phone !== undefined && { phone: body.phone || null }),
          ...(body.dateOfBirth !== undefined && { dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null }),
          ...(body.gender !== undefined && { gender: body.gender }),
          ...(body.ssn !== undefined && { ssn: body.ssn ? encrypt(body.ssn) : null }),
          ...(body.address !== undefined && { address: body.address || null }),
          ...(body.city !== undefined && { city: body.city || null }),
          ...(body.state !== undefined && { state: body.state || null }),
          ...(body.zipCode !== undefined && { zipCode: body.zipCode || null }),
          ...(body.status && { status: body.status }),
          ...(body.insuranceType !== undefined && { insuranceType: body.insuranceType || null }),
          ...(body.insuranceId !== undefined && { insuranceId: body.insuranceId || null }),
          ...(body.branchId !== undefined && { branchId: body.branchId }),
          ...(emergencyContactsData && { emergencyContacts: emergencyContactsData }),
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          zipCode: true,
          status: true,
          dateOfBirth: true,
          gender: true,
          insuranceType: true,
          insuranceId: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
          emergencyContacts: {
            select: {
              id: true,
              name: true,
              relation: true,
              phone: true,
              email: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return { user, client };
    });

    return NextResponse.json({
      ...result.client,
      user: result.user,
      fullName: `${result.client.firstName} ${result.client.lastName}`,
    });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const forbiddenResponse = requireRole(session, CLIENT_MUTATION_ROLES);
    if (forbiddenResponse) {
      return forbiddenResponse;
    }

    const { id } = params;

    // Check if client exists and count visits
    const existing = await prisma.client.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        user: true,
        _count: {
          select: { visits: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Preserve clinical and billing history; discharge the client and disable portal access.
    const client = await prisma.$transaction(async (tx) => {
      if (existing.userId) {
        await tx.user.update({
          where: { id: existing.userId },
          data: { status: false },
        });
      }

      return tx.client.update({
        where: { id },
        data: { status: 'DISCHARGED' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          status: true,
          updatedAt: true,
        },
      });
    });

    return NextResponse.json({ message: 'Client discharged', client });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
