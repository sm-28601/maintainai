// Deterministic Rule Engine
// The AI must NOT determine threshold violations — this engine does it.

import type { SensorRule, SensorReadingInput, ThresholdResult, RuleEngineResult, ConflictingReading, ThresholdSeverity } from '@/types';

type Operator = '>' | '>=' | '<' | '<=' | '==' | '!=';

function evaluate(value: number, operator: Operator, threshold: number): boolean {
  switch (operator) {
    case '>':  return value > threshold;
    case '>=': return value >= threshold;
    case '<':  return value < threshold;
    case '<=': return value <= threshold;
    case '==': return value === threshold;
    case '!=': return value !== threshold;
    default:   return false;
  }
}

function detectConflicts(readings: SensorReadingInput[]): ConflictingReading[] {
  const conflicts: ConflictingReading[] = [];
  
  // Group by sensor name
  const grouped = new Map<string, SensorReadingInput[]>();
  for (const r of readings) {
    const key = r.sensorName.toLowerCase();
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  }

  for (const [, group] of grouped) {
    if (group.length < 2) continue;
    const values = group.map(r => r.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const diff = max - min;
    const pctDiff = min !== 0 ? (diff / Math.abs(min)) * 100 : diff;

    // Flag if difference exceeds 20% or absolute 10 units
    if (pctDiff > 20 || diff > 10) {
      conflicts.push({
        sensorName: group[0].sensorName,
        readings: group.map(r => ({ value: r.value, unit: r.unit, timestamp: r.timestamp })),
        difference: diff,
      });
    }
  }
  return conflicts;
}

export function runRuleEngine(
  readings: SensorReadingInput[],
  rules: SensorRule[],
): RuleEngineResult {
  const results: ThresholdResult[] = [];
  const missingReadings: string[] = [];
  
  // Detect conflicts first
  const conflictingReadings = detectConflicts(readings);
  const conflictSensorNames = new Set(conflictingReadings.map(c => c.sensorName.toLowerCase()));

  // Build a map of available readings (use first non-conflicted reading)
  const readingMap = new Map<string, SensorReadingInput>();
  for (const r of readings) {
    const key = r.sensorName.toLowerCase();
    if (!readingMap.has(key)) {
      readingMap.set(key, r);
    }
  }

  // Evaluate each rule
  for (const rule of rules) {
    const key = rule.sensorName.toLowerCase();
    const reading = readingMap.get(key);

    if (!reading) {
      // Only track as missing if there's no reading at all
      missingReadings.push(rule.sensorName);
      continue;
    }

    // Skip evaluation on conflicting readings — report special status
    if (conflictSensorNames.has(key)) {
      // We still add a result but note it's conflicting
      results.push({
        sensorName: rule.sensorName,
        value: reading.value,
        unit: reading.unit,
        threshold: rule.threshold,
        operator: rule.operator,
        severity: 'WARNING' as ThresholdSeverity,
        ruleId: rule.id,
        description: `⚠ Conflicting readings detected — threshold analysis may be unreliable`,
      });
      continue;
    }

    const triggered = evaluate(reading.value, rule.operator as Operator, rule.threshold);
    if (triggered) {
      results.push({
        sensorName: rule.sensorName,
        value: reading.value,
        unit: reading.unit,
        threshold: rule.threshold,
        operator: rule.operator,
        severity: rule.severity,
        ruleId: rule.id,
        description: rule.description,
      });
    } else {
      // Add NORMAL result
      results.push({
        sensorName: rule.sensorName,
        value: reading.value,
        unit: reading.unit,
        threshold: rule.threshold,
        operator: rule.operator,
        severity: 'NORMAL',
        ruleId: rule.id,
        description: rule.description,
      });
    }
  }

  // Remove duplicate sensor results — keep highest severity
  const dedupedResults = deduplicateResults(results);

  return {
    results: dedupedResults,
    missingReadings: [...new Set(missingReadings)],
    conflictingReadings,
  };
}

function severityRank(s: ThresholdSeverity): number {
  return s === 'CRITICAL' ? 3 : s === 'WARNING' ? 2 : 1;
}

function deduplicateResults(results: ThresholdResult[]): ThresholdResult[] {
  const map = new Map<string, ThresholdResult>();
  for (const r of results) {
    const existing = map.get(r.sensorName.toLowerCase());
    if (!existing || severityRank(r.severity) > severityRank(existing.severity)) {
      map.set(r.sensorName.toLowerCase(), r);
    }
  }
  return [...map.values()];
}

// Default rules for prototype
export const DEFAULT_SENSOR_RULES: Omit<SensorRule, 'id'>[] = [
  // Pump rules
  { equipmentType: 'PUMP', sensorName: 'Vibration', operator: '>', threshold: 7, unit: 'mm/s', severity: 'CRITICAL', description: 'Critical vibration — possible misalignment, bearing wear, or imbalance' },
  { equipmentType: 'PUMP', sensorName: 'Vibration', operator: '>=', threshold: 4, unit: 'mm/s', severity: 'WARNING', description: 'Elevated vibration — monitor closely' },
  { equipmentType: 'PUMP', sensorName: 'Temperature', operator: '>', threshold: 90, unit: '°C', severity: 'CRITICAL', description: 'Critical temperature — risk of thermal damage' },
  { equipmentType: 'PUMP', sensorName: 'Temperature', operator: '>=', threshold: 75, unit: '°C', severity: 'WARNING', description: 'Elevated temperature — monitor closely' },
  { equipmentType: 'PUMP', sensorName: 'Pressure', operator: '>', threshold: 8, unit: 'bar', severity: 'CRITICAL', description: 'Overpressure — risk of seal or pipe failure' },
  { equipmentType: 'PUMP', sensorName: 'Pressure', operator: '<', threshold: 1, unit: 'bar', severity: 'WARNING', description: 'Low pressure — possible blockage or leak' },
  { equipmentType: 'PUMP', sensorName: 'RPM', operator: '>', threshold: 3600, unit: 'rpm', severity: 'WARNING', description: 'Overspeed detected' },
  { equipmentType: 'PUMP', sensorName: 'RPM', operator: '<', threshold: 1000, unit: 'rpm', severity: 'WARNING', description: 'Underspeed — possible load or drive issue' },

  // Compressor rules
  { equipmentType: 'COMPRESSOR', sensorName: 'Vibration', operator: '>', threshold: 10, unit: 'mm/s', severity: 'CRITICAL', description: 'Critical vibration on compressor' },
  { equipmentType: 'COMPRESSOR', sensorName: 'Temperature', operator: '>', threshold: 110, unit: '°C', severity: 'CRITICAL', description: 'Critical temperature on compressor' },
  { equipmentType: 'COMPRESSOR', sensorName: 'Pressure', operator: '>', threshold: 15, unit: 'bar', severity: 'CRITICAL', description: 'Overpressure on compressor' },
  { equipmentType: 'COMPRESSOR', sensorName: 'Oil Pressure', operator: '<', threshold: 2, unit: 'bar', severity: 'CRITICAL', description: 'Low oil pressure — risk of seizure' },

  // Generator rules
  { equipmentType: 'GENERATOR', sensorName: 'Temperature', operator: '>', threshold: 95, unit: '°C', severity: 'CRITICAL', description: 'Generator overheating' },
  { equipmentType: 'GENERATOR', sensorName: 'Vibration', operator: '>', threshold: 8, unit: 'mm/s', severity: 'CRITICAL', description: 'Critical vibration on generator' },
  { equipmentType: 'GENERATOR', sensorName: 'Voltage', operator: '<', threshold: 200, unit: 'V', severity: 'WARNING', description: 'Low voltage output' },
  { equipmentType: 'GENERATOR', sensorName: 'Frequency', operator: '>', threshold: 52, unit: 'Hz', severity: 'WARNING', description: 'Frequency out of range' },

  // Motor rules
  { equipmentType: 'MOTOR', sensorName: 'Temperature', operator: '>', threshold: 85, unit: '°C', severity: 'CRITICAL', description: 'Motor overheating — check cooling' },
  { equipmentType: 'MOTOR', sensorName: 'Current', operator: '>', threshold: 15, unit: 'A', severity: 'WARNING', description: 'High current draw' },
  { equipmentType: 'MOTOR', sensorName: 'Vibration', operator: '>', threshold: 6, unit: 'mm/s', severity: 'CRITICAL', description: 'Critical motor vibration' },

  // CNC Machine rules
  { equipmentType: 'CNC_MACHINE', sensorName: 'Spindle Temp', operator: '>', threshold: 80, unit: '°C', severity: 'WARNING', description: 'Spindle temperature elevated' },
  { equipmentType: 'CNC_MACHINE', sensorName: 'Vibration', operator: '>', threshold: 5, unit: 'mm/s', severity: 'WARNING', description: 'Elevated vibration on CNC' },

  // Boiler rules
  { equipmentType: 'BOILER', sensorName: 'Steam Pressure', operator: '>', threshold: 12, unit: 'bar', severity: 'CRITICAL', description: 'Boiler overpressure — safety critical' },
  { equipmentType: 'BOILER', sensorName: 'Water Level', operator: '<', threshold: 20, unit: '%', severity: 'CRITICAL', description: 'Low water level — safety critical' },
  { equipmentType: 'BOILER', sensorName: 'Temperature', operator: '>', threshold: 200, unit: '°C', severity: 'WARNING', description: 'High boiler temperature' },
];
