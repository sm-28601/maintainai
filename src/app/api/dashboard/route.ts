import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const stats = {
      openIssues: await prisma.issue.count({ where: { status: 'OPEN' } }),
      criticalIssues: await prisma.issue.count({ where: { priority: 'CRITICAL', status: { notIn: ['CLOSED', 'RESOLVED'] } } }),
      highPriority: await prisma.issue.count({ where: { priority: 'HIGH', status: { notIn: ['CLOSED', 'RESOLVED'] } } }),
      draftWorkOrders: await prisma.workOrder.count({ where: { status: 'DRAFT' } }),
      pendingApproval: await prisma.issue.count({ where: { status: 'PENDING_APPROVAL' } }),
      underInvestigation: await prisma.equipment.count({ where: { status: 'UNDER_INVESTIGATION' } }),
    };

    const recentIssues = await prisma.issue.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        equipment: { select: { equipmentId: true, type: true } },
        assignedUser: { select: { name: true } },
      },
    });

    const timeline = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: { user: { select: { name: true } } },
    });

    return NextResponse.json({
      success: true,
      data: { stats, recentIssues, timeline },
    });
  } catch (error) {
    console.error('[Dashboard GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
