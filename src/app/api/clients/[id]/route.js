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

    const client = await prisma.client.findUnique({
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
        medications: {
          select: {
            id: true,
            name: true,
            dosage: true,
            frequency: true,
            notes: true,
          },
        },
        medicalHistory: {
          select: {
            id: true,
            condition: true,
            diagnosis: true,
            date: true,
            notes: true,
          },
        },
        carePlans: {
          select: {
            id: true,
            name: true,
            description: true,
            startDate: true,
            endDate: true,
            status: true,
            staff: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            service: {
              select: {
                name: true,
              },
            },
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
        forms: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            submittedAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            amount: true,
            status: true,
            dueDate: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(client);
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

    const { id } = params;
    const body = await request.json();

    // Check if client exists
    const existing = await prisma.client.findUnique({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      ssn,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      status,
      insuranceType,
      insuranceId,
      branchId,
    } = body;

    // Check for duplicate email if email is being changed
    if (email && email !== existing.email) {
      const duplicate = await prisma.client.findFirst({
        where: {
          organizationId: session.user.organizationId,
          email,
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

    const client = await prisma.client.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
        ...(gender !== undefined && { gender }),
        ...(ssn !== undefined && { ssn }),
        ...(email !== undefined && { email }),
        ...(phone && { phone }),
        ...(address && { address }),
        ...(city && { city }),
        ...(state && { state }),
        ...(zipCode && { zipCode }),
        ...(status && { status }),
        ...(insuranceType !== undefined && { insuranceType }),
        ...(insuranceId !== undefined && { insuranceId }),
        ...(branchId !== undefined && { branchId }),
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
        ssn: true,
        insuranceType: true,
        insuranceId: true,
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
      },
    });

    return NextResponse.json(client);
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

    const { id } = params;

    // Check if client exists
    const existing = await prisma.client.findUnique({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Check if client has related data
    const hasVisits = await prisma.visit.count({
      where: { clientId: id },
    });

    if (hasVisits > 0) {
      return NextResponse.json(
        { error: 'Cannot delete client with existing visits' },
        { status: 400 }
      );
    }

    await prisma.client.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
