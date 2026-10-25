import type { EventFormData, EventPlan, AISettings, PersonalizedIdeas, PlanAssumptions } from '../types/event';
import { generateEventPlan } from './plannerEngine';

export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';
export const SUPPORTED_GEMINI_MODELS = [
  DEFAULT_GEMINI_MODEL,
  'gemini-3.1-pro-preview',
] as const;

export interface PlanningEngineAdapter {
  name: string;
  isAvailable(): boolean;
  generatePlan(inputs: EventFormData): Promise<EventPlan>;
}

export class DeterministicPlanningAdapter implements PlanningEngineAdapter {
  name = 'Deterministic Rule-Based Assistant (Offline)';

  isAvailable(): boolean {
    return true;
  }

  async generatePlan(inputs: EventFormData): Promise<EventPlan> {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return generateEventPlan(inputs, 'deterministic');
  }
}

interface GeminiResponseData {
  ideas: PersonalizedIdeas;
  assumptions: PlanAssumptions;
}

type UnknownRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function isSuggestionList(value: unknown): value is string[] {
  return Array.isArray(value) && value.length >= 3 && value.length <= 4 && value.every(
    (item) => typeof item === 'string' && item.trim().length > 0 && item.length <= 500,
  );
}

function parseGeminiResponse(value: unknown): GeminiResponseData | null {
  if (!isRecord(value)) return null;
  const ideaKeys = [
    'themeAndAtmosphere',
    'foodAndBeverage',
    'activitiesAndMoments',
    'decorAndDetails',
    'guestExperience',
  ] as const;
  const ideaLists = ideaKeys.map((key) => value[key]);
  if (!ideaLists.every(isSuggestionList) || !isSuggestionList(value.assumptions) || !isSuggestionList(value.nextSteps)) {
    return null;
  }
  return {
    ideas: {
      themeAndAtmosphere: ideaLists[0],
      foodAndBeverage: ideaLists[1],
      activitiesAndMoments: ideaLists[2],
      decorAndDetails: ideaLists[3],
      guestExperience: ideaLists[4],
    },
    assumptions: {
      assumptions: value.assumptions,
      nextSteps: value.nextSteps,
    },
  };
}

function extractGeneratedText(value: unknown): string | null {
  if (!isRecord(value) || !Array.isArray(value.candidates) || !isRecord(value.candidates[0])) return null;
  const content = value.candidates[0].content;
  if (!isRecord(content) || !Array.isArray(content.parts) || !isRecord(content.parts[0])) return null;
  return typeof content.parts[0].text === 'string' ? content.parts[0].text : null;
}

function selectModel(model: string): string {
  return SUPPORTED_GEMINI_MODELS.some((supportedModel) => supportedModel === model)
    ? model
    : DEFAULT_GEMINI_MODEL;
}

export class GeminiAIAdapter implements PlanningEngineAdapter {
  name = 'Gemini AI Assistant (Configured)';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = DEFAULT_GEMINI_MODEL) {
    this.apiKey = apiKey.trim();
    this.model = selectModel(model);
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 10);
  }

  async generatePlan(inputs: EventFormData): Promise<EventPlan> {
    if (!this.isAvailable()) return generateEventPlan(inputs, 'deterministic');

    const prompt = `You are an expert celebration and event planner. Generate tailored creative ideas, assumptions, and next steps as valid JSON. Return exactly 3-4 concise strings in each array.

Event Details:
- Type: ${inputs.eventType}
- Name: ${inputs.name}
- Date: ${inputs.date}
- Location: ${inputs.location}
- Guests: ${inputs.guestCount}
- Currency: ${inputs.currency}
- Total Budget: ${inputs.totalBudget}
- Theme: ${inputs.themeStyle || 'None specified'}
- Priorities: ${inputs.priorities || 'None specified'}
- Dietary/Accessibility: ${inputs.dietaryAccessibility || 'None specified'}
- Notes: ${inputs.additionalNotes || 'None'}

Return a JSON object with string-array keys: themeAndAtmosphere, foodAndBeverage, activitiesAndMoments, decorAndDetails, guestExperience, assumptions, nextSteps.`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20_000);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, responseMimeType: 'application/json' },
          }),
          signal: controller.signal,
        },
      );
      if (!response.ok) return generateEventPlan(inputs, 'deterministic');

      const responseData: unknown = await response.json();
      const generatedText = extractGeneratedText(responseData);
      if (!generatedText || generatedText.length > 20_000) return generateEventPlan(inputs, 'deterministic');

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(generatedText);
      } catch {
        return generateEventPlan(inputs, 'deterministic');
      }
      const generatedContent = parseGeminiResponse(parsedJson);
      if (!generatedContent) return generateEventPlan(inputs, 'deterministic');

      const plan = generateEventPlan(inputs, 'ai');
      plan.ideas = generatedContent.ideas;
      plan.assumptions = generatedContent.assumptions;
      return plan;
    } catch {
      return generateEventPlan(inputs, 'deterministic');
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export function getPlanningAdapter(settings?: AISettings): PlanningEngineAdapter {
  if (settings?.useCustomKey && settings.apiKey) {
    return new GeminiAIAdapter(settings.apiKey, settings.model || DEFAULT_GEMINI_MODEL);
  }
  return new DeterministicPlanningAdapter();
}
