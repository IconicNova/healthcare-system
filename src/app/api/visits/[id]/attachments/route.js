import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Fetch attachments for a visit
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const visit = await prisma.visit.findFirst({
      where: { id, organizationId: session.user.organizationId },
    });

    if (!visit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    const attachments = await prisma.visitAttachment.findMany({
      where: { visitId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ attachments });
  } catch (error) {
    console.error('Error fetching visit attachments:', error);
    return NextResponse.json({ error: 'Failed to fetch attachments' }, { status: 500 });
  }
}

// POST - Upload attachments (stored as base64 data URLs)
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const visit = await prisma.visit.findFirst({
      where: { id, organizationId: session.user.organizationId },
    });

    if (!visit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files');

    if (!files.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const created = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds 10MB limit` },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;

      const attachment = await prisma.visitAttachment.create({
        data: {
          name: file.name,
          type: file.type,
          size: file.size,
          url: dataUrl,
          uploadedBy: session.user.name || session.user.email,
          visitId: id,
        },
      });

      created.push(attachment);
    }

    // Log activity
    await prisma.visitActivity.create({
      data: {
        visitId: id,
        action: 'ATTACHMENT_ADDED',
        details: `Uploaded ${created.length} file(s): ${created.map(a => a.name).join(', ')}`,
        performedBy: session.user.name || session.user.email,
      },
    });

    return NextResponse.json({ attachments: created }, { status: 201 });
  } catch (error) {
    console.error('Error uploading attachments:', error);
    return NextResponse.json({ error: 'Failed to upload attachments' }, { status: 500 });
  }
}
