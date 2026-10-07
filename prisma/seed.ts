// Prisma seed script — creates realistic demo data for MaintainAI

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Users ─────────────────────────────────────────────────────────────────

  const adminHash = await bcrypt.hash('admin123', 12);
  const techHash = await bcrypt.hash('tech123', 12);
  const viewerHash = await bcrypt.hash('viewer123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@maintainai.com' },
    update: {},
    create: {
      email: 'admin@maintainai.com',
      name: 'Admin User',
      role: 'ADMIN',
      passwordHash: adminHash,
    },
  });

  const technician = await prisma.user.upsert({
    where: { email: 'sahil@maintainai.com' },
    update: {},
    create: {
      email: 'sahil@maintainai.com',
      name: 'Sahil Maurya',
      role: 'TECHNICIAN',
      passwordHash: techHash,
    },
  });

  const marcus = await prisma.user.upsert({
    where: { email: 'marcus@maintainai.com' },
    update: {},
    create: {
      email: 'marcus@maintainai.com',
      name: 'Marcus Vance',
      role: 'TECHNICIAN',
      passwordHash: techHash,
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@maintainai.com' },
    update: {},
    create: {
      email: 'viewer@maintainai.com',
      name: 'View Only',
      role: 'VIEWER',
      passwordHash: viewerHash,
    },
  });

  console.log('✅ Users created');

  // ─── Equipment ─────────────────────────────────────────────────────────────

  const pump = await prisma.equipment.upsert({
    where: { equipmentId: 'PUMP-204' },
    update: {},
    create: {
      equipmentId: 'PUMP-204',
      type: 'PUMP',
      model: 'PX-200',
      location: 'Production Floor A',
      status: 'UNDER_INVESTIGATION',
      manufacturer: 'FlowTech Industrial',
      description: 'Industrial centrifugal pump for primary coolant circulation',
      installedAt: new Date('2022-03-15'),
    },
  });

  const compressor = await prisma.equipment.upsert({
    where: { equipmentId: 'COMP-101' },
    update: {},
    create: {
      equipmentId: 'COMP-101',
      type: 'COMPRESSOR',
      model: 'AC-500',
      location: 'Compressor Room B',
      status: 'OPERATIONAL',
      manufacturer: 'AirTech Systems',
      description: 'Air compressor for pneumatic tools and actuators',
      installedAt: new Date('2021-06-01'),
    },
  });

  const cnc = await prisma.equipment.upsert({
    where: { equipmentId: 'CNC-102' },
    update: {},
    create: {
      equipmentId: 'CNC-102',
      type: 'CNC_MACHINE',
      model: 'CNC-X2',
      location: 'Machining Bay 3',
      status: 'OPERATIONAL',
      manufacturer: 'PrecisionTech',
      description: '5-axis CNC milling machine for precision parts',
      installedAt: new Date('2023-01-10'),
    },
  });

  const generator = await prisma.equipment.upsert({
    where: { equipmentId: 'GEN-301' },
    update: {},
    create: {
      equipmentId: 'GEN-301',
      type: 'GENERATOR',
      model: 'DG-400',
      location: 'Emergency Power Bay',
      status: 'ACTION_REQUIRED',
      manufacturer: 'PowerGen Corp',
      description: 'Emergency diesel generator — backup power for critical systems',
      installedAt: new Date('2020-09-20'),
    },
  });

  const turbine = await prisma.equipment.upsert({
    where: { equipmentId: 'TURB-09' },
    update: {},
    create: {
      equipmentId: 'TURB-09',
      type: 'TURBINE',
      model: 'TX-900',
      location: 'Power Plant North',
      status: 'ACTION_REQUIRED',
      manufacturer: 'TurboMech Industries',
      description: 'Steam turbine for primary power generation',
      installedAt: new Date('2019-04-12'),
    },
  });

  console.log('✅ Equipment created');

  // ─── Sensor Rules ──────────────────────────────────────────────────────────

  const rules = [
    // Pump
    { equipmentType: 'PUMP', sensorName: 'Vibration', operator: '>', threshold: 7, unit: 'mm/s', severity: 'CRITICAL', description: 'Critical vibration — possible misalignment, bearing wear, or imbalance' },
    { equipmentType: 'PUMP', sensorName: 'Vibration', operator: '>=', threshold: 4, unit: 'mm/s', severity: 'WARNING', description: 'Elevated vibration — monitor closely' },
    { equipmentType: 'PUMP', sensorName: 'Temperature', operator: '>', threshold: 90, unit: '°C', severity: 'CRITICAL', description: 'Critical temperature — risk of thermal damage' },
    { equipmentType: 'PUMP', sensorName: 'Temperature', operator: '>=', threshold: 75, unit: '°C', severity: 'WARNING', description: 'Elevated temperature' },
    { equipmentType: 'PUMP', sensorName: 'Pressure', operator: '>', threshold: 8, unit: 'bar', severity: 'CRITICAL', description: 'Overpressure — risk of seal failure' },
    { equipmentType: 'PUMP', sensorName: 'Pressure', operator: '<', threshold: 1, unit: 'bar', severity: 'WARNING', description: 'Low pressure — possible blockage or leak' },
    { equipmentType: 'PUMP', sensorName: 'RPM', operator: '>', threshold: 3600, unit: 'rpm', severity: 'WARNING', description: 'Overspeed detected' },
    // Compressor
    { equipmentType: 'COMPRESSOR', sensorName: 'Vibration', operator: '>', threshold: 10, unit: 'mm/s', severity: 'CRITICAL', description: 'Critical vibration on compressor' },
    { equipmentType: 'COMPRESSOR', sensorName: 'Temperature', operator: '>', threshold: 110, unit: '°C', severity: 'CRITICAL', description: 'Critical temperature on compressor' },
    { equipmentType: 'COMPRESSOR', sensorName: 'Pressure', operator: '>', threshold: 15, unit: 'bar', severity: 'CRITICAL', description: 'Overpressure on compressor' },
    { equipmentType: 'COMPRESSOR', sensorName: 'Oil Pressure', operator: '<', threshold: 2, unit: 'bar', severity: 'CRITICAL', description: 'Low oil pressure — risk of seizure' },
    // Generator
    { equipmentType: 'GENERATOR', sensorName: 'Temperature', operator: '>', threshold: 95, unit: '°C', severity: 'CRITICAL', description: 'Generator overheating' },
    { equipmentType: 'GENERATOR', sensorName: 'Vibration', operator: '>', threshold: 8, unit: 'mm/s', severity: 'CRITICAL', description: 'Critical vibration on generator' },
    { equipmentType: 'GENERATOR', sensorName: 'Voltage', operator: '<', threshold: 200, unit: 'V', severity: 'WARNING', description: 'Low voltage output' },
    { equipmentType: 'GENERATOR', sensorName: 'Frequency', operator: '>', threshold: 52, unit: 'Hz', severity: 'WARNING', description: 'Frequency out of range' },
    // Motor
    { equipmentType: 'MOTOR', sensorName: 'Temperature', operator: '>', threshold: 85, unit: '°C', severity: 'CRITICAL', description: 'Motor overheating' },
    { equipmentType: 'MOTOR', sensorName: 'Current', operator: '>', threshold: 15, unit: 'A', severity: 'WARNING', description: 'High current draw' },
    { equipmentType: 'MOTOR', sensorName: 'Vibration', operator: '>', threshold: 6, unit: 'mm/s', severity: 'CRITICAL', description: 'Critical motor vibration' },
    // CNC
    { equipmentType: 'CNC_MACHINE', sensorName: 'Spindle Temp', operator: '>', threshold: 80, unit: '°C', severity: 'WARNING', description: 'Spindle temperature elevated' },
    { equipmentType: 'CNC_MACHINE', sensorName: 'Vibration', operator: '>', threshold: 5, unit: 'mm/s', severity: 'WARNING', description: 'Elevated vibration on CNC' },
    // Turbine
    { equipmentType: 'TURBINE', sensorName: 'Bearing Temperature', operator: '>', threshold: 100, unit: '°C', severity: 'CRITICAL', description: 'Bearing overheating on turbine' },
    { equipmentType: 'TURBINE', sensorName: 'Vibration', operator: '>', threshold: 9, unit: 'mm/s', severity: 'CRITICAL', description: 'Critical vibration on turbine' },
    // Boiler
    { equipmentType: 'BOILER', sensorName: 'Steam Pressure', operator: '>', threshold: 12, unit: 'bar', severity: 'CRITICAL', description: 'Boiler overpressure' },
    { equipmentType: 'BOILER', sensorName: 'Water Level', operator: '<', threshold: 20, unit: '%', severity: 'CRITICAL', description: 'Low water level — safety critical' },
  ];

  await prisma.sensorRule.deleteMany();
  for (const rule of rules) {
    await prisma.sensorRule.create({
      data: rule as Parameters<typeof prisma.sensorRule.create>[0]['data'],
    });
  }

  console.log('✅ Sensor rules created');

  // ─── Maintenance Records ───────────────────────────────────────────────────

  const pumpMaintenance = [
    { title: 'Routine Inspection', type: 'Inspection', description: 'Quarterly routine inspection performed. All parameters within normal range.', status: 'COMPLETED', performedAt: new Date('2026-09-10'), performedBy: 'Sahil Maurya' },
    { title: 'Filter Replacement', type: 'Replacement', description: 'Replaced primary filter element — original was 85% occluded.', status: 'COMPLETED', performedAt: new Date('2026-10-05'), performedBy: 'Sahil Maurya' },
  ];

  for (const record of pumpMaintenance) {
    await prisma.maintenanceRecord.create({
      data: { equipmentId: pump.id, ...record },
    });
  }

  // Generator maintenance
  await prisma.maintenanceRecord.create({
    data: {
      equipmentId: generator.id,
      title: 'Annual Service',
      type: 'Inspection',
      description: 'Annual service completed. Load test performed — passed. Oil change completed.',
      status: 'COMPLETED',
      performedAt: new Date('2026-08-20'),
      performedBy: 'Marcus Vance',
    },
  });

  // Turbine maintenance
  await prisma.maintenanceRecord.create({
    data: {
      equipmentId: turbine.id,
      title: 'Bearing Inspection',
      type: 'Inspection',
      description: 'Bearings inspected. Bearing #3 showing early signs of wear. Scheduled for replacement.',
      status: 'COMPLETED',
      performedAt: new Date('2026-09-18'),
      performedBy: 'Marcus Vance',
      notes: 'Monitor bearing temperature closely until replacement is performed',
    },
  });

  console.log('✅ Maintenance records created');

  // ─── Knowledge Base Documents ──────────────────────────────────────────────

  const pumpManual = await prisma.knowledgeDocument.upsert({
    where: { id: 'pump-manual-001' },
    update: {},
    create: {
      id: 'pump-manual-001',
      name: 'Pump Maintenance Manual — PX Series',
      equipmentType: 'PUMP',
      docType: 'MANUAL',
      filename: 'pump-px-series-manual.pdf',
      fileSize: 2048000,
      status: 'INDEXED',
      pageCount: 120,
    },
  });

  const pumpFaultGuide = await prisma.knowledgeDocument.upsert({
    where: { id: 'pump-fault-001' },
    update: {},
    create: {
      id: 'pump-fault-001',
      name: 'Pump Fault Diagnosis Guide',
      equipmentType: 'PUMP',
      docType: 'FAULT_GUIDE',
      filename: 'pump-fault-guide.pdf',
      fileSize: 512000,
      status: 'INDEXED',
      pageCount: 45,
    },
  });

  const safetyDoc = await prisma.knowledgeDocument.upsert({
    where: { id: 'safety-001' },
    update: {},
    create: {
      id: 'safety-001',
      name: 'Industrial Safety Procedures',
      equipmentType: null,
      docType: 'SAFETY',
      filename: 'safety-procedures.pdf',
      fileSize: 1024000,
      status: 'INDEXED',
      pageCount: 80,
    },
  });

  console.log('✅ Knowledge documents created');

  // ─── Knowledge Chunks (sample manual content) ──────────────────────────────

  await prisma.knowledgeChunk.deleteMany({ where: { documentId: pumpManual.id } });
  await prisma.knowledgeChunk.deleteMany({ where: { documentId: pumpFaultGuide.id } });
  await prisma.knowledgeChunk.deleteMany({ where: { documentId: safetyDoc.id } });

  const pumpManualChunks = [
    {
      text: 'EXCESSIVE VIBRATION\n\nExcessive vibration may be associated with misalignment, imbalance, loose mounting, or bearing wear. Vibration levels above 7 mm/s (peak) indicate a critical condition requiring immediate investigation. Vibration between 4–7 mm/s indicates a warning condition that should be investigated within 24 hours.',
      pageNumber: 42,
      section: 'Excessive Vibration',
    },
    {
      text: 'SHAFT ALIGNMENT\n\nShaft misalignment is one of the most common causes of elevated vibration in centrifugal pumps. Misalignment introduces periodic forces that are transmitted through the bearings to the pump casing. Both angular and parallel misalignment should be checked using a dial indicator or laser alignment tool. Alignment must be verified after any maintenance, coupling replacement, or mounting adjustment.',
      pageNumber: 44,
      section: 'Shaft Alignment',
    },
    {
      text: 'BEARING INSPECTION AND REPLACEMENT\n\nBearing wear produces vibration at characteristic frequencies related to bearing geometry and rotational speed. As bearings degrade, vibration amplitude increases progressively. Signs of bearing wear include: elevated housing temperature (more than 10°C above ambient baseline), audible grinding or rumbling at operating speed, and vibration levels exceeding threshold values. Bearings should be replaced when vibration exceeds 7 mm/s or bearing temperature exceeds 80°C above ambient.',
      pageNumber: 56,
      section: 'Bearing Inspection',
    },
    {
      text: 'ROTOR IMBALANCE\n\nImbalance in the pump impeller or rotor generates centrifugal forces at rotational frequency (1×). Causes of imbalance include: debris accumulation on impeller vanes, corrosion or erosion causing uneven mass loss, mechanical damage, and deposits. Imbalance can be confirmed by vibration analysis showing dominant 1× frequency component. Correction requires cleaning, repair, or replacement of the impeller and rebalancing.',
      pageNumber: 48,
      section: 'Rotor Imbalance',
    },
    {
      text: 'PUMP STARTUP AND SHUTDOWN PROCEDURES\n\nBefore starting the pump: verify all isolation valves are in the correct position, check bearing lubrication level, ensure coupling guard is in place. During startup: open suction valve fully, crack discharge valve slightly, start motor, gradually open discharge valve to rated flow. Shutdown: reduce flow gradually, close discharge valve, stop motor, close suction valve.',
      pageNumber: 15,
      section: 'Startup and Shutdown',
    },
    {
      text: 'REDUCED FLOW TROUBLESHOOTING\n\nReduced pump output flow may indicate: clogged suction filter or strainer, air entrainment in suction line, impeller wear or damage, reduced pump speed, increased system resistance, or internal recirculation due to worn wear rings. Check suction pressure and compare to design specification. A blocked filter will show low suction pressure and reduced flow.',
      pageNumber: 63,
      section: 'Reduced Flow',
    },
    {
      text: 'FILTER MAINTENANCE\n\nSuction filters should be inspected monthly and replaced when differential pressure exceeds 0.5 bar or during scheduled maintenance. A recently replaced filter can temporarily affect pump priming and flow characteristics. After filter replacement, verify that suction pressure returns to normal within 10 minutes of operation.',
      pageNumber: 35,
      section: 'Filter Maintenance',
    },
    {
      text: 'COUPLING INSPECTION\n\nCouplings should be inspected every 6 months or when vibration exceeds warning thresholds. Check for: element wear or cracking (flexible couplings), hub corrosion, spider deterioration, set screw security, and proper engagement depth. A worn or cracked coupling element can introduce vibration that mimics misalignment.',
      pageNumber: 51,
      section: 'Coupling Inspection',
    },
  ];

  for (let i = 0; i < pumpManualChunks.length; i++) {
    await prisma.knowledgeChunk.create({
      data: {
        documentId: pumpManual.id,
        ...pumpManualChunks[i],
        chunkIndex: i,
      },
    });
  }

  const pumpFaultChunks = [
    {
      text: 'FAULT CODE V-001: EXCESSIVE VIBRATION\nSymptoms: Vibration above 7 mm/s. Possible causes: (1) Bearing failure — inspect bearing housing temperature and sound; (2) Shaft misalignment — verify with laser alignment tool; (3) Impeller imbalance — check for deposits or damage; (4) Loose foundation bolts — check and torque to specification. Priority: High. Maintenance action required within 24 hours.',
      pageNumber: 8,
      section: 'Vibration Fault Codes',
    },
    {
      text: 'FAULT CODE T-001: HIGH TEMPERATURE\nSymptoms: Temperature above 90°C. Possible causes: (1) Inadequate cooling — check cooling water flow; (2) Overloading — verify operating point against pump curve; (3) Bearing failure generating heat — check bearing temperature separately; (4) Blocked recirculation — check recirculation line. Priority: Critical. Reduce load immediately if temperature exceeds 95°C.',
      pageNumber: 12,
      section: 'Temperature Fault Codes',
    },
  ];

  for (let i = 0; i < pumpFaultChunks.length; i++) {
    await prisma.knowledgeChunk.create({
      data: {
        documentId: pumpFaultGuide.id,
        ...pumpFaultChunks[i],
        chunkIndex: i,
      },
    });
  }

  const safetyChunks = [
    {
      text: 'LOCKOUT/TAGOUT PROCEDURES\n\nBefore performing any maintenance on rotating equipment: (1) Notify operations and obtain work permit; (2) Shut down equipment through normal stop procedure; (3) Isolate all energy sources (electrical, pneumatic, hydraulic); (4) Apply lockout device to each energy isolation point; (5) Apply your personal lock and tag; (6) Verify equipment is de-energized by attempting startup; (7) Release stored energy (bleed pressure, release springs, etc.).',
      pageNumber: 12,
      section: 'Lockout/Tagout',
    },
    {
      text: 'WORKING ON PRESSURIZED SYSTEMS\n\nNever open pressurized connections without first: verifying pressure has been relieved, isolating the section to be worked on, wearing appropriate PPE (face shield, gloves). Residual pressure can remain in pump casings and piping after shutdown. Allow 5 minutes after shutdown before opening drain valves.',
      pageNumber: 24,
      section: 'Pressurized Systems',
    },
  ];

  for (let i = 0; i < safetyChunks.length; i++) {
    await prisma.knowledgeChunk.create({
      data: {
        documentId: safetyDoc.id,
        ...safetyChunks[i],
        chunkIndex: i,
      },
    });
  }

  console.log('✅ Knowledge chunks created');

  // ─── Sample Issue: PUMP-204 Complete Scenario ──────────────────────────────

  const pumpIssue = await prisma.issue.create({
    data: {
      equipmentId: pump.id,
      title: 'Abnormal vibration and reduced flow',
      description: 'The pump is producing unusual vibration and the output flow has decreased compared to normal operation. Vibration is felt on the casing and is audible from the motor end. Flow rate is estimated at 70% of normal.',
      startedAt: new Date('2026-10-06T05:00:00Z'),
      isActive: true,
      status: 'UNDER_INVESTIGATION',
      priority: 'HIGH',
      assignedUserId: technician.id,
    },
  });

  // Operating events for the pump issue
  await prisma.issueOperatingEvent.createMany({
    data: [
      { issueId: pumpIssue.id, description: 'Filter replaced (primary suction strainer)', eventDate: new Date('2026-10-05') },
      { issueId: pumpIssue.id, description: 'Pump operated continuously for 10 hours', eventDate: new Date('2026-10-05') },
      { issueId: pumpIssue.id, description: 'Routine maintenance inspection performed', eventDate: new Date('2026-09-10') },
    ],
  });

  // Sensor readings
  const sensorTime = new Date('2026-10-06T05:35:00Z');
  await prisma.issueSensorReading.createMany({
    data: [
      { issueId: pumpIssue.id, sensorName: 'Temperature', value: 85, unit: '°C', timestamp: sensorTime },
      { issueId: pumpIssue.id, sensorName: 'Pressure', value: 4.2, unit: 'bar', timestamp: sensorTime },
      { issueId: pumpIssue.id, sensorName: 'Vibration', value: 7.8, unit: 'mm/s', timestamp: sensorTime },
      { issueId: pumpIssue.id, sensorName: 'RPM', value: 3000, unit: 'rpm', timestamp: sensorTime },
    ],
  });

  // Threshold results
  await prisma.thresholdResult.createMany({
    data: [
      { issueId: pumpIssue.id, sensorName: 'Vibration', value: 7.8, unit: 'mm/s', threshold: 7, operator: '>', severity: 'CRITICAL', description: 'Critical vibration — possible misalignment, bearing wear, or imbalance' },
      { issueId: pumpIssue.id, sensorName: 'Temperature', value: 85, unit: '°C', threshold: 90, operator: '>', severity: 'NORMAL', description: 'Temperature within normal range' },
      { issueId: pumpIssue.id, sensorName: 'Pressure', value: 4.2, unit: 'bar', threshold: 8, operator: '>', severity: 'NORMAL', description: 'Pressure within normal range' },
      { issueId: pumpIssue.id, sensorName: 'RPM', value: 3000, unit: 'rpm', threshold: 3600, operator: '>', severity: 'NORMAL', description: 'Speed within normal range' },
    ],
  });

  // AI Analysis
  const analysis = await prisma.aIAnalysis.create({
    data: {
      issueId: pumpIssue.id,
      summary: 'Analysis of PUMP-204 (PX-200): Abnormal vibration and reduced flow. One sensor reading has exceeded the critical threshold (Vibration: 7.8 mm/s). Three possible causes have been identified based on available sensor data, operating history, and threshold rule results. These are possibilities that require technician verification — no findings have been confirmed.',
      observations: JSON.stringify([
        'Vibration: 7.8 mm/s — exceeds critical threshold (> 7 mm/s)',
        'Temperature: 85°C — within normal range (< 90°C)',
        'Pressure: 4.2 bar — within normal range',
        'RPM: 3000 rpm — at nominal operating speed',
        'Filter was replaced on 2026-10-05 — one day prior to issue onset',
        'Pump operated continuously for 10 hours on 2026-10-05',
        'Flow reduction reported by operator (estimated 70% of normal)',
        'Issue is currently active',
      ]),
      possibleCauses: JSON.stringify([
        {
          title: 'Bearing Wear',
          description: 'Excessive vibration at 7.8 mm/s is characteristic of progressive bearing degradation. The vibration level exceeds the critical threshold and may indicate one or more bearings are failing. Bearing wear produces vibration at characteristic frequencies related to bearing geometry.',
          confidence: 'SUPPORTED_BY_EVIDENCE',
          evidenceRefs: ['Vibration = 7.8 mm/s (Critical threshold exceeded)', 'Pump Maintenance Manual — Page 56'],
        },
        {
          title: 'Shaft Misalignment',
          description: 'Misalignment between the shaft and coupling causes periodic forces resulting in elevated vibration. The timing of the issue (shortly after filter replacement maintenance) raises the possibility that alignment was disturbed during the maintenance activity.',
          confidence: 'POSSIBLE',
          evidenceRefs: ['Vibration = 7.8 mm/s (Critical)', 'Filter replacement performed 2026-10-05', 'Pump Maintenance Manual — Page 44'],
        },
        {
          title: 'Rotor/Impeller Imbalance',
          description: 'An imbalanced rotating element generates centrifugal forces producing vibration at running speed (1×). Debris accumulation or damage to the impeller can cause imbalance. The reduced flow may indicate partial blockage or impeller damage.',
          confidence: 'POSSIBLE',
          evidenceRefs: ['Vibration = 7.8 mm/s (Critical)', 'Reduced flow reported (70% of normal)', 'Pump Maintenance Manual — Page 48'],
        },
        {
          title: 'Loose Mounting Bolts',
          description: 'Loose foundation or mounting bolts allow structural resonance and amplify vibration. This is a quick first check that should be performed before more invasive inspection.',
          confidence: 'POSSIBLE',
          evidenceRefs: ['Vibration = 7.8 mm/s (Critical)', 'Pump Maintenance Manual — Page 42'],
        },
      ]),
      confirmedFindings: JSON.stringify([]),
      followUpQuestions: JSON.stringify([
        'Did the vibration begin immediately after the filter replacement, or was there a delay before onset?',
        'Is the vibration uniform at all operating speeds, or does it change with RPM?',
        'Has the shaft alignment been verified since the filter replacement on 2026-10-05?',
        'Is the vibration accompanied by any unusual noise (grinding, knocking, or squealing)?',
        'When was the last bearing inspection performed, and what was the result?',
        'Is the flow reduction gradual or sudden?',
      ]),
      inspectionSteps: JSON.stringify([
        { step: 1, action: 'Check and tighten all mounting bolts to manufacturer torque specifications', reason: 'Loose mounting is the quickest and safest item to rule out as a cause of vibration', evidenceRef: 'Pump Maintenance Manual — Page 42' },
        { step: 2, action: 'Measure shaft alignment using a dial indicator or laser alignment tool', reason: 'Misalignment is a common cause of elevated vibration and may have occurred during filter replacement maintenance', evidenceRef: 'Pump Maintenance Manual — Page 44' },
        { step: 3, action: 'Inspect bearing housing — check for elevated temperature and listen for grinding or rumbling sounds', reason: 'Bearing wear is a primary cause of excessive vibration at the observed levels', evidenceRef: 'Pump Maintenance Manual — Page 56' },
        { step: 4, action: 'Inspect the coupling for wear, cracks, or misalignment', reason: 'Coupling degradation can cause vibration that mimics misalignment', evidenceRef: 'Pump Maintenance Manual — Page 51' },
        { step: 5, action: 'Inspect the impeller for debris accumulation, damage, or corrosion', reason: 'Rotor imbalance from damage or buildup can produce vibration consistent with observed readings', evidenceRef: 'Pump Maintenance Manual — Page 48' },
      ]),
      priorityLevel: 'HIGH',
      priorityReason: 'Vibration reading of 7.8 mm/s exceeds the critical threshold. The issue is currently active. Continued operation at this vibration level may accelerate bearing and seal degradation. Technician assessment in person is required to confirm actual priority.',
      workOrderDraft: JSON.stringify({
        title: 'Abnormal vibration and reduced flow — PUMP-204',
        description: 'Work order for PUMP-204: Investigate and resolve abnormal vibration (7.8 mm/s — critical threshold exceeded) and reduced flow. Recent filter replacement may be related. Check alignment, bearings, coupling, and mounting.\n\nNote: This draft was generated by AI based on available evidence. The technician should review and edit before approval.',
        inspectionSteps: [
          'Check and tighten all mounting bolts to manufacturer torque specifications',
          'Measure shaft alignment using a dial indicator or laser alignment tool',
          'Inspect bearing housing for elevated temperature and unusual sounds',
          'Inspect the coupling for wear, cracks, or misalignment',
          'Inspect impeller for debris, damage, or corrosion',
        ],
        notes: 'AI-generated draft — all possible causes are unconfirmed and require technician verification. Possible causes: Bearing Wear (Supported by Evidence), Shaft Misalignment (Possible), Rotor Imbalance (Possible), Loose Mounting (Possible).',
      }),
      status: 'COMPLETED',
      modelUsed: 'mock',
    },
  });

  // Evidence
  await prisma.evidence.createMany({
    data: [
      { issueId: pumpIssue.id, analysisId: analysis.id, type: 'SENSOR', title: 'Vibration Reading', excerpt: '7.8 mm/s at 10:35 — exceeds critical threshold of 7 mm/s', sensorName: 'Vibration', sensorValue: 7.8, sensorUnit: 'mm/s' },
      { issueId: pumpIssue.id, analysisId: analysis.id, type: 'RULE', title: 'Vibration Critical Threshold', excerpt: 'Rule: Vibration > 7 mm/s → CRITICAL', ruleDesc: 'Vibration > 7 mm/s triggers CRITICAL alert' },
      { issueId: pumpIssue.id, analysisId: analysis.id, type: 'MANUAL', title: 'Pump Maintenance Manual — Excessive Vibration', excerpt: 'Excessive vibration may be associated with misalignment, imbalance, loose mounting, or bearing wear.', pageNumber: 42, section: 'Excessive Vibration', documentId: pumpManual.id },
      { issueId: pumpIssue.id, analysisId: analysis.id, type: 'MANUAL', title: 'Pump Maintenance Manual — Bearing Inspection', excerpt: 'Bearing wear produces vibration at characteristic frequencies. Replace when vibration exceeds 7 mm/s.', pageNumber: 56, section: 'Bearing Inspection', documentId: pumpManual.id },
      { issueId: pumpIssue.id, analysisId: analysis.id, type: 'EVENT', title: 'Recent Filter Replacement', excerpt: 'Filter replaced on 2026-10-05 — one day before issue onset' },
    ],
  });

  // Findings
  await prisma.finding.createMany({
    data: [
      { issueId: pumpIssue.id, analysisId: analysis.id, description: 'Bearing Wear', status: 'POSSIBLE' },
      { issueId: pumpIssue.id, analysisId: analysis.id, description: 'Shaft Misalignment', status: 'POSSIBLE' },
      { issueId: pumpIssue.id, analysisId: analysis.id, description: 'Rotor/Impeller Imbalance', status: 'POSSIBLE' },
    ],
  });

  // Work Order
  const workOrder = await prisma.workOrder.create({
    data: {
      woId: 'WO-1042',
      issueId: pumpIssue.id,
      equipmentId: pump.id,
      title: 'Abnormal vibration and reduced flow — PUMP-204',
      description: 'Investigate and resolve abnormal vibration (7.8 mm/s — critical threshold exceeded) and reduced flow reported on PUMP-204. Recent filter replacement may be related to issue onset. Check alignment, bearings, coupling, and mounting.',
      priority: 'HIGH',
      status: 'DRAFT',
      inspectionSteps: JSON.stringify([
        'Check and tighten all mounting bolts to manufacturer torque specifications',
        'Measure shaft alignment using a dial indicator or laser alignment tool',
        'Inspect bearing housing for elevated temperature and unusual sounds',
        'Inspect the coupling for wear, cracks, or misalignment',
        'Inspect impeller for debris, damage, or corrosion',
      ]),
      possibleCauses: JSON.stringify([
        'Bearing Wear — Supported by Evidence',
        'Shaft Misalignment — Possible',
        'Rotor/Impeller Imbalance — Possible',
        'Loose Mounting Bolts — Possible',
      ]),
      notes: 'AI-generated draft. All possible causes are unconfirmed and require technician verification.',
      aiDraftJson: JSON.stringify({
        generatedAt: new Date().toISOString(),
        modelUsed: 'mock',
        originalDraft: {
          title: 'Abnormal vibration and reduced flow — PUMP-204',
          priority: 'HIGH',
        },
      }),
    },
  });

  console.log('✅ Sample issue, analysis, evidence, and work order created');

  // ─── Turbine Issue ──────────────────────────────────────────────────────────

  const turbineIssue = await prisma.issue.create({
    data: {
      equipmentId: turbine.id,
      title: 'Bearing temperature spike — Bearing #3',
      description: 'Bearing #3 on the turbine shaft has shown a sudden temperature increase. Temperature spike from 68°C to 112°C over 30 minutes. Vibration also elevated.',
      startedAt: new Date('2026-10-06T04:08:00Z'),
      isActive: true,
      status: 'UNDER_INVESTIGATION',
      priority: 'CRITICAL',
      assignedUserId: marcus.id,
    },
  });

  await prisma.issueSensorReading.createMany({
    data: [
      { issueId: turbineIssue.id, sensorName: 'Bearing Temperature', value: 112, unit: '°C', timestamp: new Date('2026-10-06T04:40:00Z') },
      { issueId: turbineIssue.id, sensorName: 'Vibration', value: 11.2, unit: 'mm/s', timestamp: new Date('2026-10-06T04:40:00Z') },
      { issueId: turbineIssue.id, sensorName: 'RPM', value: 3000, unit: 'rpm', timestamp: new Date('2026-10-06T04:40:00Z') },
    ],
  });

  await prisma.thresholdResult.createMany({
    data: [
      { issueId: turbineIssue.id, sensorName: 'Bearing Temperature', value: 112, unit: '°C', threshold: 100, operator: '>', severity: 'CRITICAL', description: 'Bearing overheating on turbine' },
      { issueId: turbineIssue.id, sensorName: 'Vibration', value: 11.2, unit: 'mm/s', threshold: 9, operator: '>', severity: 'CRITICAL', description: 'Critical vibration on turbine' },
    ],
  });

  // Generator Issue
  const genIssue = await prisma.issue.create({
    data: {
      equipmentId: generator.id,
      title: 'Voltage fluctuation on Phase B',
      description: 'Phase B voltage is fluctuating between 195V and 215V during load. Phase A and C are stable at 230V. Issue appears intermittent.',
      startedAt: new Date('2026-10-06T03:00:00Z'),
      isActive: true,
      status: 'PENDING_APPROVAL',
      priority: 'MEDIUM',
      assignedUserId: marcus.id,
    },
  });

  await prisma.workOrder.create({
    data: {
      woId: 'WO-1041',
      issueId: genIssue.id,
      equipmentId: generator.id,
      title: 'Voltage fluctuation on Phase B — GEN-301',
      description: 'Investigate Phase B voltage fluctuation. Check connections, AVR, and load balance.',
      priority: 'MEDIUM',
      status: 'DRAFT',
      inspectionSteps: JSON.stringify([
        'Check Phase B connections and terminal torque',
        'Inspect AVR (Automatic Voltage Regulator) settings',
        'Measure load balance across all three phases',
        'Check for loose busbars or connections in the distribution panel',
      ]),
      possibleCauses: JSON.stringify(['Loose Phase B connection', 'AVR fault', 'Load imbalance']),
      notes: 'AI-generated draft.',
    },
  });

  // ─── Audit Logs ─────────────────────────────────────────────────────────────

  await prisma.auditLog.createMany({
    data: [
      { action: 'ISSUE_CREATED', entityType: 'Issue', entityId: pumpIssue.id, userId: technician.id, details: JSON.stringify({ equipmentId: 'PUMP-204', title: 'Abnormal vibration and reduced flow' }), timestamp: new Date('2026-10-06T05:42:00Z') },
      { action: 'SENSOR_DATA_SUBMITTED', entityType: 'Issue', entityId: pumpIssue.id, userId: technician.id, details: JSON.stringify({ sensorCount: 4 }), timestamp: new Date('2026-10-06T05:42:30Z') },
      { action: 'RULE_EVALUATION_PERFORMED', entityType: 'Issue', entityId: pumpIssue.id, details: JSON.stringify({ criticalCount: 1, warningCount: 0 }), timestamp: new Date('2026-10-06T05:45:00Z') },
      { action: 'MANUAL_RETRIEVED', entityType: 'Issue', entityId: pumpIssue.id, details: JSON.stringify({ documentCount: 2, chunkCount: 4 }), timestamp: new Date('2026-10-06T05:46:00Z') },
      { action: 'AI_ANALYSIS_GENERATED', entityType: 'AIAnalysis', entityId: analysis.id, details: JSON.stringify({ model: 'mock', issueId: pumpIssue.id }), timestamp: new Date('2026-10-06T05:47:00Z') },
      { action: 'WORK_ORDER_CREATED', entityType: 'WorkOrder', entityId: workOrder.id, details: JSON.stringify({ woId: 'WO-1042', priority: 'HIGH' }), timestamp: new Date('2026-10-06T05:52:00Z') },
    ],
  });

  console.log('✅ Audit logs created');

  console.log('\n✨ Seed complete!');
  console.log('\nDemo credentials:');
  console.log('  Admin:      admin@maintainai.com / admin123');
  console.log('  Technician: sahil@maintainai.com / tech123');
  console.log('  Technician: marcus@maintainai.com / tech123');
  console.log('  Viewer:     viewer@maintainai.com / viewer123');
}

main()
  .catch(e => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
