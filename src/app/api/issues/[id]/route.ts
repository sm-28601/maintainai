import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        equipment: true,
        assignedUser: { select: { id: true, name: true, email: true, role: true } },
        sensorReadings: { orderBy: { timestamp: 'desc' } },
        thresholdResults: true,
        operatingEvents: { orderBy: { eventDate: 'desc' } },
        aiAnalyses: {
          include: {
            evidence: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        workOrders: {
          include: {
            approvedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        findings: {
          include: {
            confirmedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        evidence: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    const parseJSON = (str: any, fallback: any = []) => {
      if (typeof str !== 'string') return str || fallback;
      try { return JSON.parse(str); } catch { return fallback; }
    };

    const parsedIssue = {
      ...issue,
      aiAnalyses: issue.aiAnalyses.map(a => ({
        ...a,
        observations: parseJSON(a.observations, []),
        possibleCauses: parseJSON(a.possibleCauses, []),
        confirmedFindings: parseJSON(a.confirmedFindings, []),
        followUpQuestions: parseJSON(a.followUpQuestions, []),
        inspectionSteps: parseJSON(a.inspectionSteps, []),
        workOrderDraft: parseJSON(a.workOrderDraft, {}),
      })),
      workOrders: issue.workOrders.map(w => ({
        ...w,
        inspectionSteps: parseJSON(w.inspectionSteps, []),
        possibleCauses: parseJSON(w.possibleCauses, []),
        aiDraftJson: parseJSON(w.aiDraftJson, {}),
        editHistory: parseJSON(w.editHistory, []),
      }))
    };

    return NextResponse.json({ success: true, data: parsedIssue });
  } catch (error) {
    console.error('[Issue/:id GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
