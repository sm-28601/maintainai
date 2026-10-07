import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    const workOrder = await prisma.workOrder.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason || null,
        rejectedAt: new Date(),
      },
      include: {
        equipment: true,
        issue: true,
        approvedBy: { select: { name: true, role: true } },
      }
    });

    await createAuditLog({
      action: 'WORK_ORDER_REJECTED',
      entityType: 'WorkOrder',
      entityId: id,
      userId: session.id,
      details: { woId: workOrder.woId, reason },
    });

    const parseJSON = (str: any, fallback: any = []) => {
      if (typeof str !== 'string') return str || fallback;
      try { return JSON.parse(str); } catch { return fallback; }
    };

    const parsedWorkOrder = {
      ...workOrder,
      inspectionSteps: parseJSON(workOrder.inspectionSteps, []),
      possibleCauses: parseJSON(workOrder.possibleCauses, []),
      aiDraftJson: parseJSON(workOrder.aiDraftJson, {}),
      editHistory: parseJSON(workOrder.editHistory, []),
    };

    return NextResponse.json({ success: true, data: parsedWorkOrder });
  } catch (error) {
    console.error('[WorkOrder REJECT]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
