import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import type { FindingStatus } from '@/types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id: issueId } = await params;
    const { findingId, status, notes } = await request.json();

    if (!findingId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const finding = await prisma.finding.findUnique({ where: { id: findingId } });
    if (!finding || finding.issueId !== issueId) {
      return NextResponse.json({ error: 'Finding not found' }, { status: 404 });
    }

    // AI cannot confirm, only technician/admin
    const updated = await prisma.finding.update({
      where: { id: findingId },
      data: {
        status: status as FindingStatus,
        notes,
        confirmedByUserId: status === 'CONFIRMED' || status === 'REJECTED' ? session.id : null,
        confirmedAt: status === 'CONFIRMED' || status === 'REJECTED' ? new Date() : null,
      },
    });

    await createAuditLog({
      action: status === 'CONFIRMED' ? 'FINDING_CONFIRMED' : 'FINDING_REJECTED',
      entityType: 'Finding',
      entityId: finding.id,
      userId: session.id,
      details: { issueId, description: finding.description },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[Findings POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
