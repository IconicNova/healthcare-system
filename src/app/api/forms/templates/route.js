import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ensureOrganizationChartingTemplates } from '@/lib/charting-templates';
import { normalizeFormSchema } from '@/lib/form-review';

export const dynamic = 'force-dynamic';

// GET - Fetch all form templates for the organization
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureOrganizationChartingTemplates(prisma, session.user.organizationId);

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';

    const where = {
      organizationId: session.user.organizationId,
      status: true,
    };

    if (category) {
      where.category = category;
    }

    const templates = await prisma.formTemplate.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        schema: true,
        category: true,
        isRequired: true,
        status: true,
        createdAt: true,
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });

    const normalizedTemplates = templates.map((template) => ({
      ...template,
      schema: normalizeFormSchema(template.schema),
    }));

    // Group templates by category
    const grouped = normalizedTemplates.reduce((acc, template) => {
      const cat = template.category || 'Other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(template);
      return acc;
    }, {});

    return NextResponse.json({
      templates: normalizedTemplates,
      grouped,
    });
  } catch (error) {
    console.error('Error fetching form templates:', error);
    return NextResponse.json({ error: 'Failed to fetch form templates' }, { status: 500 });
  }
}
