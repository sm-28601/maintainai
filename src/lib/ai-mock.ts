// Mock AI Service — used when no real AI provider is configured
// Produces realistic, structured analysis based on rule results and sensor data
// without making any API calls

import type {
  AIService,
  EquipmentAnalysisInput,
  AIAnalysisResult,
  IssuePriority,
  PossibleCause,
  InspectionStep,
} from '@/types';

function determinePriority(input: EquipmentAnalysisInput): IssuePriority {
  const hasCritical = input.thresholdResults.some(r => r.severity === 'CRITICAL');
  const hasWarning = input.thresholdResults.some(r => r.severity === 'WARNING');
  if (hasCritical && input.issue.isActive) return 'CRITICAL';
  if (hasCritical) return 'HIGH';
  if (hasWarning && input.issue.isActive) return 'HIGH';
  if (hasWarning) return 'MEDIUM';
  return 'MEDIUM';
}

function buildObservations(input: EquipmentAnalysisInput): string[] {
  const obs: string[] = [];

  for (const r of input.sensorReadings) {
    obs.push(`${r.sensorName}: ${r.value} ${r.unit}`);
  }

  const criticalResults = input.thresholdResults.filter(r => r.severity === 'CRITICAL');
  for (const r of criticalResults) {
    obs.push(`${r.sensorName} reading of ${r.value} ${r.unit} exceeds the critical threshold (${r.operator} ${r.threshold} ${r.unit})`);
  }

  for (const e of input.operatingEvents) {
    obs.push(`Recent event: ${e.description} (${new Date(e.eventDate).toLocaleDateString()})`);
  }

  if (input.missingSensors.length > 0) {
    obs.push(`Sensor data not available for: ${input.missingSensors.join(', ')}`);
  }

  if (input.conflictingReadings.length > 0) {
    for (const c of input.conflictingReadings) {
      obs.push(`⚠ Conflicting readings detected for ${c.sensorName} — readings differ by ${c.difference.toFixed(1)} units`);
    }
  }

  if (input.issue.isActive) {
    obs.push('Issue is currently active');
  }

  return obs;
}

function buildPossibleCauses(input: EquipmentAnalysisInput): PossibleCause[] {
  const causes: PossibleCause[] = [];
  const hasCriticalVibration = input.thresholdResults.some(
    r => r.sensorName.toLowerCase().includes('vibration') && r.severity === 'CRITICAL'
  );
  const hasHighTemp = input.thresholdResults.some(
    r => r.sensorName.toLowerCase().includes('temp') && (r.severity === 'CRITICAL' || r.severity === 'WARNING')
  );

  if (hasCriticalVibration) {
    causes.push({
      title: 'Bearing Wear',
      description: 'Excessive vibration is commonly associated with bearing degradation. As bearings wear, they produce characteristic vibration patterns that exceed normal thresholds.',
      confidence: 'SUPPORTED_BY_EVIDENCE',
      evidenceRefs: ['Vibration threshold exceeded'],
    });
    causes.push({
      title: 'Shaft Misalignment',
      description: 'Misalignment between the shaft and coupling causes periodic forces that result in elevated vibration. This can occur after maintenance or component replacement.',
      confidence: 'POSSIBLE',
      evidenceRefs: ['Vibration threshold exceeded', 'Recent filter replacement noted'],
    });
    causes.push({
      title: 'Rotor/Impeller Imbalance',
      description: 'An imbalanced rotating element generates centrifugal forces at running speed, producing vibration. Debris accumulation or damage can cause imbalance.',
      confidence: 'POSSIBLE',
      evidenceRefs: ['Vibration threshold exceeded'],
    });
    causes.push({
      title: 'Loose Mounting Bolts',
      description: 'Loose foundation or mounting bolts can allow structural resonance and amplify vibration. This should be checked as a quick first inspection.',
      confidence: 'POSSIBLE',
      evidenceRefs: ['Vibration threshold exceeded'],
    });
  }

  if (hasHighTemp) {
    causes.push({
      title: 'Cooling System Issue',
      description: 'Elevated temperature may indicate reduced coolant flow, blocked cooling passages, or cooling fan failure.',
      confidence: 'POSSIBLE',
      evidenceRefs: ['Temperature reading elevated'],
    });
    causes.push({
      title: 'Overloading',
      description: 'Operating the equipment beyond rated capacity generates excess heat. Check operating conditions against rated specifications.',
      confidence: 'WEAKLY_SUPPORTED',
      evidenceRefs: ['Temperature threshold triggered'],
    });
  }

  const hasRecentMaintenance = input.operatingEvents.some(e =>
    e.description.toLowerCase().includes('replac') ||
    e.description.toLowerCase().includes('maintenance') ||
    e.description.toLowerCase().includes('inspect')
  );

  if (hasRecentMaintenance && causes.length > 0) {
    causes.push({
      title: 'Improper Reassembly After Maintenance',
      description: 'Equipment issues occurring shortly after maintenance may indicate incorrect reassembly. Check torque specifications and component seating.',
      confidence: 'POSSIBLE',
      evidenceRefs: ['Recent maintenance event recorded'],
    });
  }

  // If no specific causes identified, provide generic ones
  if (causes.length === 0) {
    causes.push({
      title: 'Unknown Root Cause',
      description: 'Insufficient sensor data and rule violations to identify specific possible causes. A thorough physical inspection is recommended.',
      confidence: 'INSUFFICIENT_EVIDENCE',
      evidenceRefs: [],
    });
  }

  return causes;
}

function buildInspectionSteps(input: EquipmentAnalysisInput): InspectionStep[] {
  const steps: InspectionStep[] = [];
  const hasCriticalVibration = input.thresholdResults.some(
    r => r.sensorName.toLowerCase().includes('vibration') && r.severity === 'CRITICAL'
  );

  if (hasCriticalVibration) {
    steps.push({
      step: 1,
      action: 'Check and tighten all mounting bolts to manufacturer torque specifications',
      reason: 'Loose mounting is the quickest and safest item to rule out as a cause of vibration',
    });
    steps.push({
      step: 2,
      action: 'Measure shaft alignment using a dial indicator or laser alignment tool',
      reason: 'Misalignment is a common cause of elevated vibration and may have occurred after recent maintenance',
    });
    steps.push({
      step: 3,
      action: 'Inspect bearing housing — check for unusual temperature and listen for grinding or rumbling sounds',
      reason: 'Bearing wear is a primary cause of excessive vibration at the observed levels',
    });
    steps.push({
      step: 4,
      action: 'Inspect the coupling for wear, cracks, or misalignment',
      reason: 'Coupling degradation can cause vibration and may be related to recent events',
    });
    steps.push({
      step: 5,
      action: 'Check the impeller or rotor for debris accumulation, damage, or corrosion',
      reason: 'Rotor imbalance from damage or buildup can produce vibration patterns consistent with the observed readings',
    });
  }

  if (steps.length === 0) {
    steps.push({
      step: 1,
      action: 'Perform a visual inspection of the equipment for obvious damage, leaks, or abnormalities',
      reason: 'Initial visual inspection is the safest first step for any reported issue',
    });
    steps.push({
      step: 2,
      action: 'Review the equipment logbook and recent maintenance records',
      reason: 'Historical data may reveal patterns related to the current issue',
    });
    steps.push({
      step: 3,
      action: 'Collect additional sensor readings to establish a baseline',
      reason: 'Additional data will improve the accuracy of the analysis',
    });
  }

  return steps;
}

function buildFollowUpQuestions(input: EquipmentAnalysisInput): string[] {
  const questions: string[] = [];

  const hasCriticalVibration = input.thresholdResults.some(
    r => r.sensorName.toLowerCase().includes('vibration') && r.severity === 'CRITICAL'
  );

  const hasRecentEvent = input.operatingEvents.some(e =>
    e.description.toLowerCase().includes('replac')
  );

  if (hasCriticalVibration) {
    if (hasRecentEvent) {
      questions.push('Did the vibration begin immediately after the recent maintenance/replacement, or was there a delay?');
    }
    questions.push('Is the vibration uniform at all operating speeds, or does it increase/decrease with RPM?');
    questions.push('Has the shaft alignment been verified since the last maintenance event?');
    questions.push('Is the vibration accompanied by any unusual noise (grinding, knocking, or squealing)?');
    questions.push('When was the last bearing inspection performed and what was the result?');
  }

  questions.push('Has this issue occurred previously on this equipment? If so, what was the root cause?');
  questions.push('Are there any observed changes in output performance (flow, pressure, speed) correlated with the issue?');

  if (input.missingSensors.length > 0) {
    questions.push(`Can additional readings be obtained for: ${input.missingSensors.join(', ')}?`);
  }

  return questions;
}

export class MockAIService implements AIService {
  async isAvailable(): Promise<boolean> {
    return true; // Mock is always available
  }

  async analyzeEquipmentIssue(input: EquipmentAnalysisInput): Promise<AIAnalysisResult> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const priority = determinePriority(input);
    const observations = buildObservations(input);
    const possibleCauses = buildPossibleCauses(input);
    const inspectionSteps = buildInspectionSteps(input);
    const followUpQuestions = buildFollowUpQuestions(input);

    const hasCritical = input.thresholdResults.some(r => r.severity === 'CRITICAL');

    const summary = `Analysis of ${input.equipment.equipmentId} (${input.equipment.type}, ${input.equipment.model}): ${input.issue.title}. ${
      hasCritical
        ? 'One or more sensor readings have exceeded critical thresholds. '
        : ''
    }${possibleCauses.length} possible cause(s) identified based on available sensor data, operating history, and threshold rule results. These are possibilities that require technician verification — no findings have been confirmed.`;

    const priorityReason = [
      ...(hasCritical ? ['One or more sensor readings exceeded critical thresholds'] : []),
      ...(input.issue.isActive ? ['The issue is currently active'] : []),
      ...(input.operatingEvents.length > 0 ? ['Recent operating events may be relevant to the issue'] : []),
      'Technician should assess equipment in person to determine actual priority',
    ].join('. ');

    const evidence = [
      ...input.thresholdResults.filter(r => r.severity !== 'NORMAL').map(r => ({
        type: 'RULE' as const,
        title: `${r.sensorName} Threshold ${r.severity}`,
        excerpt: `${r.sensorName} = ${r.value} ${r.unit} — Rule: ${r.operator} ${r.threshold} ${r.unit} → ${r.severity}`,
      })),
      ...input.sensorReadings.map(r => ({
        type: 'SENSOR' as const,
        title: `${r.sensorName} Reading`,
        excerpt: `${r.value} ${r.unit} at ${new Date(r.timestamp).toLocaleTimeString()}`,
      })),
      ...input.retrievedChunks.slice(0, 3).map(c => ({
        type: 'MANUAL' as const,
        title: c.documentName,
        excerpt: c.text.slice(0, 200),
        pageNumber: c.pageNumber,
        section: c.section,
        documentId: c.documentId,
      })),
    ];

    return {
      summary,
      observations,
      possibleCauses,
      confirmedFindings: [], // AI never confirms — only technicians can
      followUpQuestions,
      inspectionSteps,
      priorityRecommendation: {
        level: priority,
        reason: priorityReason,
      },
      workOrderDraft: {
        title: input.issue.title,
        description: `Work order for ${input.equipment.equipmentId}: ${input.issue.description}\n\nNote: This draft was generated by AI based on available evidence. The technician should review and edit as appropriate before approval.`,
        inspectionSteps: inspectionSteps.map(s => s.action),
        notes: `AI-generated draft. Possible causes: ${possibleCauses.map(c => c.title).join(', ')}. All causes are unconfirmed and require technician verification.`,
      },
      evidence,
    };
  }
}
