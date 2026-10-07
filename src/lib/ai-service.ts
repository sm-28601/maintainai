// Gemini AI Service
// Wraps Google Generative AI with proper error handling
// Falls back gracefully if the API is unavailable

import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  AIService,
  EquipmentAnalysisInput,
  AIAnalysisResult,
  IssuePriority,
} from '@/types';
import { MockAIService } from './ai-mock';

const SYSTEM_PROMPT = `You are an AI assistant helping maintenance technicians investigate equipment problems.

CRITICAL RULES — You MUST follow these at all times:

1. NEVER claim a finding is confirmed without explicit technician verification.
2. ALWAYS distinguish between: Observations (what sensors/data shows), Possible Causes (what might explain it), and Confirmed Findings (only set by technicians — always return [] for confirmedFindings).
3. NEVER invent sensor values. If a sensor reading is missing, state it is not available.
4. NEVER fabricate manual citations. Only cite evidence that was explicitly provided to you.
5. NEVER suggest remote control of equipment, automatic equipment shutdown, or automatic maintenance approval.
6. ALWAYS support recommendations with specific evidence.
7. Use confidence labels: "POSSIBLE", "SUPPORTED_BY_EVIDENCE", "WEAKLY_SUPPORTED", "INSUFFICIENT_EVIDENCE" — never numeric percentages.
8. The priority is a RECOMMENDATION only — always note that the technician must confirm priority.

Return ONLY a valid JSON object matching the schema. No markdown, no explanation outside JSON.`;

function buildPrompt(input: EquipmentAnalysisInput): string {
  return `Analyze the following equipment issue and return a JSON analysis.

EQUIPMENT:
- ID: ${input.equipment.equipmentId}
- Type: ${input.equipment.type}
- Model: ${input.equipment.model}
- Location: ${input.equipment.location}

ISSUE:
- Title: ${input.issue.title}
- Description: ${input.issue.description}
- Started: ${input.issue.startedAt}
- Currently Active: ${input.issue.isActive}

SENSOR READINGS:
${input.sensorReadings.length > 0
  ? input.sensorReadings.map(r => `- ${r.sensorName}: ${r.value} ${r.unit} at ${r.timestamp}`).join('\n')
  : '- No sensor readings provided'}

MISSING SENSOR DATA (DO NOT invent values for these):
${input.missingSensors.length > 0 ? input.missingSensors.map(s => `- ${s}: NOT AVAILABLE`).join('\n') : '- None'}

CONFLICTING SENSOR READINGS (readings differ significantly — do not choose one as correct):
${input.conflictingReadings.length > 0
  ? input.conflictingReadings.map(c => `- ${c.sensorName}: ${c.readings.map(r => r.value + ' ' + r.unit).join(' vs ')} (difference: ${c.difference.toFixed(1)})`).join('\n')
  : '- None'}

DETERMINISTIC RULE ENGINE RESULTS (these are factual threshold violations, not AI opinion):
${input.thresholdResults.length > 0
  ? input.thresholdResults.map(r => `- ${r.sensorName}: ${r.value} ${r.unit} → ${r.severity} (Rule: ${r.operator} ${r.threshold} ${r.unit})`).join('\n')
  : '- No rule violations triggered'}

RECENT OPERATING EVENTS:
${input.operatingEvents.length > 0
  ? input.operatingEvents.map(e => `- ${e.description} (${e.eventDate})`).join('\n')
  : '- None recorded'}

MAINTENANCE HISTORY:
${input.maintenanceHistory.length > 0
  ? input.maintenanceHistory.map(h => `- ${h.performedAt}: ${h.type} — ${h.title}`).join('\n')
  : '- No prior maintenance records'}

RETRIEVED MANUAL SECTIONS (only cite these — do not invent sources):
${input.retrievedChunks.length > 0
  ? input.retrievedChunks.map((c, i) => `[${i + 1}] ${c.documentName}${c.pageNumber ? ` Page ${c.pageNumber}` : ''}${c.section ? ` — ${c.section}` : ''}\n"${c.text.slice(0, 400)}"`).join('\n\n')
  : '- No manual sections were retrieved. State this in the analysis — do not invent citations.'}

Return a JSON object with this exact schema:
{
  "summary": "string — brief summary of the situation",
  "observations": ["array of factual observations from sensor data and events"],
  "possibleCauses": [
    {
      "title": "string",
      "description": "string — explain the reasoning",
      "confidence": "POSSIBLE | SUPPORTED_BY_EVIDENCE | WEAKLY_SUPPORTED | INSUFFICIENT_EVIDENCE",
      "evidenceRefs": ["list of evidence descriptions supporting this cause"]
    }
  ],
  "confirmedFindings": [],
  "followUpQuestions": ["array of targeted questions for the technician"],
  "inspectionSteps": [
    {
      "step": 1,
      "action": "string",
      "reason": "string",
      "evidenceRef": "optional string"
    }
  ],
  "priorityRecommendation": {
    "level": "CRITICAL | HIGH | MEDIUM | LOW",
    "reason": "string"
  },
  "workOrderDraft": {
    "title": "string",
    "description": "string",
    "inspectionSteps": ["array of strings"],
    "notes": "string — note this is AI-generated and requires technician review"
  },
  "evidence": [
    {
      "type": "MANUAL | SENSOR | EVENT | HISTORY | RULE",
      "title": "string",
      "excerpt": "optional string",
      "pageNumber": null,
      "section": null,
      "documentId": null
    }
  ]
}`;
}

export class GeminiAIService implements AIService {
  private genAI: GoogleGenerativeAI;
  private modelName = 'gemini-2.0-flash';
  private fallback: MockAIService;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.fallback = new MockAIService();
  }

  async isAvailable(): Promise<boolean> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      await model.generateContent('ping');
      return true;
    } catch {
      return false;
    }
  }

  async analyzeEquipmentIssue(input: EquipmentAnalysisInput): Promise<AIAnalysisResult> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      });

      const prompt = buildPrompt(input);
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      // Parse and validate response
      const parsed = JSON.parse(text) as AIAnalysisResult;

      // Enforce safety: confirmedFindings must always be empty from AI
      parsed.confirmedFindings = [];

      // Ensure all required fields exist
      if (!parsed.summary) throw new Error('Missing summary in AI response');
      if (!Array.isArray(parsed.observations)) parsed.observations = [];
      if (!Array.isArray(parsed.possibleCauses)) parsed.possibleCauses = [];
      if (!Array.isArray(parsed.followUpQuestions)) parsed.followUpQuestions = [];
      if (!Array.isArray(parsed.inspectionSteps)) parsed.inspectionSteps = [];
      if (!parsed.priorityRecommendation?.level) {
        parsed.priorityRecommendation = { level: 'MEDIUM' as IssuePriority, reason: 'Default priority — review manually' };
      }

      return parsed;
    } catch (error) {
      console.error('[GeminiAIService] Error calling Gemini API, falling back to mock:', error);
      // Fall back to mock service on error
      return this.fallback.analyzeEquipmentIssue(input);
    }
  }
}

// Factory function — returns Gemini if key available, otherwise mock
export function createAIService(): AIService {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (apiKey && apiKey.trim() && apiKey !== 'your-gemini-api-key-here') {
    console.log('[AIService] Using Gemini AI');
    return new GeminiAIService(apiKey);
  }
  console.log('[AIService] Using Mock AI (no API key configured)');
  return new MockAIService();
}
