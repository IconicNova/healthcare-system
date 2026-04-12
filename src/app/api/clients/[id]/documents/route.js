import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/clients/[id]/documents - Get all documents for a client
export async function GET(
  request,
  { params }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify client belongs to user's organization
    const client = await prisma.client.findUnique({
      where: { id, organizationId: session.user.organizationId },
      select: { id: true },
    });
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const where = { clientId: id };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { type: { contains: search, mode: 'insensitive' } },
      ];
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

// POST /api/clients/[id]/documents - Create a new document
export async function POST(
  request,
  { params }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify client belongs to user's organization
    const client = await prisma.client.findUnique({
      where: { id, organizationId: session.user.organizationId },
      select: { id: true },
    });
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, type, url, size } = body;

    // Validate required fields
    if (!name || !type || !url) {
      return NextResponse.json({ error: 'Name, type, and url are required' }, { status: 400 });
    }

    const document = await prisma.document.create({
      data: {
        clientId: id,
        name,
        type,
        url,
        size: size ? parseInt(size) : null,
        uploadedBy: `${session.user.firstName} ${session.user.lastName}`,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}

// DELETE /api/clients/[id]/documents - Delete a document
export async function DELETE(
  request,
  { params }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify client belongs to user's organization
    const client = await prisma.client.findUnique({
      where: { id, organizationId: session.user.organizationId },
      select: { id: true },
    });
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    await prisma.document.delete({
      where: { id: documentId, clientId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
