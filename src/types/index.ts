// Central type definitions for MaintainAI

export type Role = 'ADMIN' | 'TECHNICIAN' | 'VIEWER';

export type EquipmentStatus =
  | 'OPERATIONAL'
  | 'UNDER_INVESTIGATION'
  | 'ACTION_REQUIRED'
  | 'MAINTENANCE'
  | 'OFFLINE';

export type EquipmentType =
  | 'PUMP'
  | 'COMPRESSOR'
  | 'CNC_MACHINE'
  | 'GENERATOR'
  | 'CONVEYOR'
  | 'MOTOR'
  | 'BOILER'
  | 'TURBINE'
  | 'VALVE'
  | 'OTHER';

export type IssuePriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type IssueStatus =
  | 'OPEN'
  | 'UNDER_INVESTIGATION'
  | 'PENDING_APPROVAL'
  | 'RESOLVED'
  | 'CLOSED';

export type WorkOrderStatus = 'DRAFT' | 'EDITED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
export type ThresholdSeverity = 'NORMAL' | 'WARNING' | 'CRITICAL';
export type EvidenceType = 'MANUAL' | 'SENSOR' | 'EVENT' | 'HISTORY' | 'RULE';
export type DocumentType =
  | 'MANUAL'
  | 'FAULT_GUIDE'
  | 'MAINTENANCE_GUIDE'
  | 'SAFETY'
  | 'SPECIFICATION'
  | 'OTHER';
export type DocumentStatus = 'UPLOADING' | 'PROCESSING' | 'INDEXED' | 'FAILED';
export type FindingStatus = 'POSSIBLE' | 'CONFIRMED' | 'REJECTED';

// ─── Issue Reporting ─────────────────────────────────────────────────────────

export interface SensorReadingInput {
  sensorName: string;
  value: number;
  unit: string;
  timestamp: string; // ISO string
}

export interface OperatingEventInput {
  description: string;
  eventDate: string; // ISO date
}

export interface ReportIssueInput {
  equipmentType: EquipmentType;
  equipmentId: string;      // e.g. PUMP-204
  equipmentModel: string;
  location: string;
  title: string;
  description: string;
  startedAt: string;        // ISO date
  isActive: boolean;
  operatingEvents: OperatingEventInput[];
  sensorReadings: SensorReadingInput[];
}

// ─── Rule Engine ──────────────────────────────────────────────────────────────

export interface SensorRule {
  id: string;
  equipmentType: EquipmentType;
  sensorName: string;
  operator: '>' | '>=' | '<' | '<=' | '==' | '!=';
  threshold: number;
  unit: string;
  severity: ThresholdSeverity;
  description?: string;
}

export interface ThresholdResult {
  sensorName: string;
  value: number;
  unit: string;
  threshold: number;
  operator: string;
  severity: ThresholdSeverity;
  ruleId?: string;
  description?: string;
}

export interface RuleEngineResult {
  results: ThresholdResult[];
  missingReadings: string[];    // sensor names with no data
  conflictingReadings: ConflictingReading[];
}

export interface ConflictingReading {
  sensorName: string;
  readings: Array<{ value: number; unit: string; timestamp: string }>;
  difference: number;
}

// ─── Knowledge Base / Retrieval ───────────────────────────────────────────────

export interface RetrievedChunk {
  id: string;
  documentId: string;
  documentName: string;
  equipmentType?: EquipmentType;
  text: string;
  pageNumber?: number;
  section?: string;
  relevance: number;
}

export interface RetrievalResult {
  chunks: RetrievedChunk[];
  success: boolean;
  error?: string;
}

// ─── AI Service ───────────────────────────────────────────────────────────────

export interface EquipmentAnalysisInput {
  equipment: {
    equipmentId: string;
    type: EquipmentType;
    model: string;
    location: string;
  };
  issue: {
    title: string;
    description: string;
    startedAt: string;
    isActive: boolean;
  };
  operatingEvents: OperatingEventInput[];
  sensorReadings: SensorReadingInput[];
  missingSensors: string[];
  conflictingReadings: ConflictingReading[];
  thresholdResults: ThresholdResult[];
  maintenanceHistory: Array<{
    type: string;
    title: string;
    performedAt: string;
    notes?: string;
  }>;
  retrievedChunks: RetrievedChunk[];
}

export interface PossibleCause {
  title: string;
  description: string;
  confidence: 'POSSIBLE' | 'SUPPORTED_BY_EVIDENCE' | 'WEAKLY_SUPPORTED' | 'INSUFFICIENT_EVIDENCE';
  evidenceRefs: string[]; // chunk IDs or descriptions
}

export interface InspectionStep {
  step: number;
  action: string;
  reason: string;
  evidenceRef?: string;
}

export interface AIAnalysisResult {
  summary: string;
  observations: string[];
  possibleCauses: PossibleCause[];
  confirmedFindings: string[]; // empty from AI — only technicians can confirm
  followUpQuestions: string[];
  inspectionSteps: InspectionStep[];
  priorityRecommendation: {
    level: IssuePriority;
    reason: string;
  };
  workOrderDraft: {
    title: string;
    description: string;
    inspectionSteps: string[];
    notes: string;
  };
  evidence: Array<{
    type: EvidenceType;
    title: string;
    excerpt?: string;
    pageNumber?: number;
    section?: string;
    documentId?: string;
  }>;
}

export interface AIService {
  analyzeEquipmentIssue(input: EquipmentAnalysisInput): Promise<AIAnalysisResult>;
  isAvailable(): Promise<boolean>;
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardStats {
  openIssues: number;
  criticalIssues: number;
  highPriority: number;
  draftWorkOrders: number;
  pendingApproval: number;
  underInvestigation: number;
}

export interface ActivityTimelineItem {
  id: string;
  timestamp: string;
  action: string;
  entityId?: string;
  entityType?: string;
  severity?: 'info' | 'warning' | 'critical';
}

// ─── API Responses ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type PaginatedResponse<T> = ApiResponse<{
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}>;
