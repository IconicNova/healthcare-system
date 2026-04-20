import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// DELETE - Delete an attachment
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const attachment = await prisma.visitAttachment.findFirst({
      where: { id },
      include: {
        visit: {
          select: { organizationId: true, id: true },
        },
      },
    });

    if (!attachment || attachment.visit.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    await prisma.visitAttachment.delete({ where: { id } });

    // Log activity
    await prisma.visitActivity.create({
      data: {
        visitId: attachment.visit.id,
        action: 'ATTACHMENT_DELETED',
        details: `Deleted file: ${attachment.name}`,
        performedBy: session.user.name || session.user.email,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return NextResponse.json({ error: 'Failed to delete attachment' }, { status: 500 });
  }
}
