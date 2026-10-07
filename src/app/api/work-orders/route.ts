import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const equipmentId = searchParams.get('equipmentId');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (equipmentId) where.equipmentId = equipmentId;

    const workOrders = await prisma.workOrder.findMany({
      where,
      include: {
        equipment: { select: { equipmentId: true, type: true, model: true } },
        issue: { select: { title: true, status: true } },
        approvedBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, data: workOrders });
  } catch (error) {
    console.error('[WorkOrders GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
