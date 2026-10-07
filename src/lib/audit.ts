// Audit logging utility

import { prisma } from './prisma';

// AuditAction values (was enum in PostgreSQL; now String in SQLite)
export type AuditAction =
  | 'ISSUE_CREATED'
  | 'SENSOR_DATA_SUBMITTED'
  | 'RULE_EVALUATION_PERFORMED'
  | 'MANUAL_RETRIEVED'
  | 'AI_ANALYSIS_GENERATED'
  | 'AI_ANALYSIS_REGENERATED'
  | 'WORK_ORDER_CREATED'
  | 'WORK_ORDER_EDITED'
  | 'WORK_ORDER_APPROVED'
  | 'WORK_ORDER_REJECTED'
  | 'WORK_ORDER_COMPLETED'
  | 'FINDING_CONFIRMED'
  | 'FINDING_REJECTED'
  | 'EQUIPMENT_CREATED'
  | 'EQUIPMENT_UPDATED'
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_INDEXED'
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'ISSUE_RESOLVED';

export async function createAuditLog(params: {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  userId?: string;
  details?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        userId: params.userId,
        details: params.details ? JSON.stringify(params.details) : null,
      },
    });
  } catch (error) {
    // Audit logging should never crash the main flow
    console.error('[AuditLog] Failed to create audit log:', error);
  }
}
