import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import type { WorkOrderStatus } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        equipment: true,
        issue: {
          include: { aiAnalyses: { orderBy: { createdAt: 'desc' }, take: 1 } },
        },
        approvedBy: { select: { name: true, role: true } },
      },
    });

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

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
    console.error('[WorkOrder GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { title, description, priority, inspectionSteps, possibleCauses, notes, status } = body;

    const existing = await prisma.workOrder.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Track edit history
    const parseJSON = (str: any, fallback: any = []) => {
      if (typeof str !== 'string') return str || fallback;
      try { return JSON.parse(str); } catch { return fallback; }
    };
    const editHistory = parseJSON(existing.editHistory, []);
    editHistory.push({
      editedAt: new Date().toISOString(),
      editedBy: session.id,
      changes: body,
    });

    const workOrder = await prisma.workOrder.update({
      where: { id },
      data: {
        title,
        description,
        priority,
        inspectionSteps: inspectionSteps ? JSON.stringify(inspectionSteps) : existing.inspectionSteps,
        possibleCauses: possibleCauses ? JSON.stringify(possibleCauses) : existing.possibleCauses,
        notes,
        status: status || (existing.status === 'DRAFT' ? 'EDITED' : existing.status),
        editHistory: JSON.stringify(editHistory),
      },
      include: {
        equipment: true,
        issue: true,
        approvedBy: { select: { name: true, role: true } },
      }
    });

    const parsedWorkOrder = {
      ...workOrder,
      inspectionSteps: parseJSON(workOrder.inspectionSteps, []),
      possibleCauses: parseJSON(workOrder.possibleCauses, []),
      aiDraftJson: parseJSON(workOrder.aiDraftJson, {}),
      editHistory: parseJSON(workOrder.editHistory, []),
    };

    await createAuditLog({
      action: 'WORK_ORDER_EDITED',
      entityType: 'WorkOrder',
      entityId: id,
      userId: session.id,
      details: { woId: workOrder.woId },
    });

    return NextResponse.json({ success: true, data: parsedWorkOrder });
  } catch (error) {
    console.error('[WorkOrder PATCH]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
