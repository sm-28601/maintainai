import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { runRuleEngine } from '@/lib/rule-engine';
import { retrieveRelevantChunks } from '@/lib/retrieval';
import { createAIService } from '@/lib/ai-service';
import { generateWoId } from '@/lib/utils';
import type { SensorReadingInput, OperatingEventInput, SensorRule, IssuePriority } from '@/types';

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const equipmentId = searchParams.get('equipmentId');
    const assignedUserId = searchParams.get('assignedUserId');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (equipmentId) where.equipment = { OR: [{ id: equipmentId }, { equipmentId }] };
    if (assignedUserId) where.assignedUserId = assignedUserId;

    const [items, total] = await Promise.all([
      prisma.issue.findMany({
        where,
        include: {
          equipment: { select: { equipmentId: true, type: true, model: true, location: true } },
          assignedUser: { select: { id: true, name: true, email: true } },
          _count: { select: { workOrders: true, aiAnalyses: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.issue.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('[Issues GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const {
      equipmentId: eqIdOrInternalId,
      equipmentType,
      equipmentModel,
      location: newLocation,
      title,
      description,
      startedAt,
      isActive,
      operatingEvents = [],
      sensorReadings = [],
    } = body;

    if (!eqIdOrInternalId || !title || !description || !startedAt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find or create equipment
    let equipment = await prisma.equipment.findFirst({
      where: { OR: [{ id: eqIdOrInternalId }, { equipmentId: eqIdOrInternalId }] },
    });

    if (!equipment) {
      // Auto-create equipment from form data
      if (!equipmentType || !equipmentModel || !newLocation) {
        return NextResponse.json({ error: 'Equipment not found and insufficient data to create it' }, { status: 404 });
      }
      equipment = await prisma.equipment.create({
        data: {
          equipmentId: eqIdOrInternalId,
          type: equipmentType,
          model: equipmentModel,
          location: newLocation,
          status: 'UNDER_INVESTIGATION',
        },
      });
    }

    // Create the issue
    const issue = await prisma.issue.create({
      data: {
        equipmentId: equipment.id,
        title,
        description,
        startedAt: new Date(startedAt),
        isActive: Boolean(isActive),
        status: 'OPEN',
        priority: 'MEDIUM',
        assignedUserId: session.id,
      },
    });

    // Save operating events
    if (operatingEvents.length > 0) {
      await prisma.issueOperatingEvent.createMany({
        data: (operatingEvents as OperatingEventInput[]).map(e => ({
          issueId: issue.id,
          description: e.description,
          eventDate: new Date(e.eventDate),
        })),
      });
    }

    // Save sensor readings
    if (sensorReadings.length > 0) {
      await prisma.issueSensorReading.createMany({
        data: (sensorReadings as SensorReadingInput[]).map(r => ({
          issueId: issue.id,
          sensorName: r.sensorName,
          value: parseFloat(String(r.value)),
          unit: r.unit,
          timestamp: new Date(r.timestamp),
        })),
      });
    }

    await createAuditLog({
      action: 'ISSUE_CREATED',
      entityType: 'Issue',
      entityId: issue.id,
      userId: session.id,
      details: { equipmentId: equipment.equipmentId, title },
    });

    // Update equipment status
    await prisma.equipment.update({
      where: { id: equipment.id },
      data: { status: 'UNDER_INVESTIGATION' },
    });

    // ─── Run Rule Engine ──────────────────────────────────────────────────────

    const dbRules = await prisma.sensorRule.findMany({
      where: { equipmentType: equipment.type },
    });

    const typedReadings: SensorReadingInput[] = (sensorReadings as SensorReadingInput[]).map(r => ({
      ...r,
      value: parseFloat(String(r.value)),
    }));

    const ruleResult = runRuleEngine(typedReadings, dbRules as SensorRule[]);

    // Save threshold results
    if (ruleResult.results.length > 0) {
      await prisma.thresholdResult.createMany({
        data: ruleResult.results.map(r => ({
          issueId: issue.id,
          sensorName: r.sensorName,
          value: r.value,
          unit: r.unit,
          threshold: r.threshold,
          operator: r.operator,
          severity: r.severity,
          ruleId: r.ruleId,
          description: r.description,
        })),
      });
    }

    await createAuditLog({
      action: 'RULE_EVALUATION_PERFORMED',
      entityType: 'Issue',
      entityId: issue.id,
      details: {
        criticalCount: ruleResult.results.filter(r => r.severity === 'CRITICAL').length,
        warningCount: ruleResult.results.filter(r => r.severity === 'WARNING').length,
        missingCount: ruleResult.missingReadings.length,
      },
    });

    // ─── Retrieval ─────────────────────────────────────────────────────────────

    const queryText = [
      title,
      description,
      ...ruleResult.results.filter(r => r.severity !== 'NORMAL').map(r => `${r.sensorName} ${r.severity}`),
    ].join(' ');

    const retrievalResult = await retrieveRelevantChunks({
      equipmentType: equipment.type,
      query: queryText,
      topK: 6,
    });

    if (retrievalResult.success && retrievalResult.chunks.length > 0) {
      await createAuditLog({
        action: 'MANUAL_RETRIEVED',
        entityType: 'Issue',
        entityId: issue.id,
        details: { chunkCount: retrievalResult.chunks.length },
      });
    }

    // ─── AI Analysis ───────────────────────────────────────────────────────────

    const maintenanceHistory = await prisma.maintenanceRecord.findMany({
      where: { equipmentId: equipment.id },
      orderBy: { performedAt: 'desc' },
      take: 10,
    });

    const aiService = createAIService();

    let analysis = null;
    let aiError: string | null = null;

    try {
      const aiInput = {
        equipment: {
          equipmentId: equipment.equipmentId,
          type: equipment.type,
          model: equipment.model,
          location: equipment.location,
        },
        issue: { title, description, startedAt, isActive },
        operatingEvents: operatingEvents as OperatingEventInput[],
        sensorReadings: typedReadings,
        missingSensors: ruleResult.missingReadings,
        conflictingReadings: ruleResult.conflictingReadings,
        thresholdResults: ruleResult.results,
        maintenanceHistory: maintenanceHistory.map(h => ({
          type: h.type,
          title: h.title,
          performedAt: h.performedAt.toISOString(),
          notes: h.notes ?? undefined,
        })),
        retrievedChunks: retrievalResult.chunks,
      };

      const aiResult = await aiService.analyzeEquipmentIssue(aiInput);

      // Determine priority from AI result
      const priority: IssuePriority = aiResult.priorityRecommendation.level;

      // Save analysis
      analysis = await prisma.aIAnalysis.create({
        data: {
          issueId: issue.id,
          summary: aiResult.summary,
          observations: JSON.stringify(aiResult.observations),
          possibleCauses: JSON.stringify(aiResult.possibleCauses),
          confirmedFindings: JSON.stringify([]),
          followUpQuestions: JSON.stringify(aiResult.followUpQuestions),
          inspectionSteps: JSON.stringify(aiResult.inspectionSteps),
          priorityLevel: priority,
          priorityReason: aiResult.priorityRecommendation.reason,
          workOrderDraft: JSON.stringify(aiResult.workOrderDraft),
          status: 'COMPLETED',
          modelUsed: process.env.GOOGLE_AI_API_KEY ? 'gemini' : 'mock',
          retrievedChunkIds: JSON.stringify(retrievalResult.chunks.map(c => c.id)),
        },
      });

      // Save evidence
      if (aiResult.evidence.length > 0) {
        await prisma.evidence.createMany({
          data: aiResult.evidence.map(ev => ({
            issueId: issue.id,
            analysisId: analysis!.id,
            type: ev.type,
            title: ev.title,
            excerpt: ev.excerpt,
            pageNumber: ev.pageNumber,
            section: ev.section,
            documentId: ev.documentId,
          })),
        });
      }

      // Save findings
      await prisma.finding.createMany({
        data: aiResult.possibleCauses.map(cause => ({
          issueId: issue.id,
          analysisId: analysis!.id,
          description: cause.title,
          status: 'POSSIBLE',
        })),
      });

      // Update issue priority and status
      await prisma.issue.update({
        where: { id: issue.id },
        data: { priority, status: 'UNDER_INVESTIGATION' },
      });

      // Create draft work order
      const workOrder = await prisma.workOrder.create({
        data: {
          woId: generateWoId(),
          issueId: issue.id,
          equipmentId: equipment.id,
          title: aiResult.workOrderDraft.title,
          description: aiResult.workOrderDraft.description,
          priority,
          status: 'DRAFT',
          inspectionSteps: JSON.stringify(aiResult.workOrderDraft.inspectionSteps),
          possibleCauses: JSON.stringify(aiResult.possibleCauses.map(c => `${c.title} — ${c.confidence}`)),
          notes: aiResult.workOrderDraft.notes,
          aiDraftJson: JSON.stringify(aiResult.workOrderDraft),
        },
      });

      await createAuditLog({
        action: 'AI_ANALYSIS_GENERATED',
        entityType: 'AIAnalysis',
        entityId: analysis.id,
        userId: session.id,
        details: { issueId: issue.id, priority },
      });

      await createAuditLog({
        action: 'WORK_ORDER_CREATED',
        entityType: 'WorkOrder',
        entityId: workOrder.id,
        userId: session.id,
        details: { woId: workOrder.woId, priority },
      });

      return NextResponse.json({
        success: true,
        data: { issue, analysisId: analysis.id, workOrderId: workOrder.id },
      }, { status: 201 });

    } catch (aiErr) {
      console.error('[Issues POST] AI analysis failed:', aiErr);
      aiError = aiErr instanceof Error ? aiErr.message : 'AI analysis failed';

      // Save failed analysis record
      await prisma.aIAnalysis.create({
        data: {
          issueId: issue.id,
          summary: 'AI analysis could not be completed',
          status: 'FAILED',
          errorMessage: aiError,
          priorityLevel: 'MEDIUM',
          priorityReason: 'Default — AI analysis unavailable',
        },
      });

      return NextResponse.json({
        success: true,
        data: { issue, analysisId: null, aiError },
        message: 'Issue saved but AI analysis failed',
      }, { status: 201 });
    }

  } catch (error) {
    console.error('[Issues POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
