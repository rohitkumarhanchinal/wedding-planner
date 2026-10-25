import type { EventFormData, EventPlan, AISettings } from '../types/event';
import { generateEventPlan } from './plannerEngine';

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
    // Simulate natural async processing for smooth UI loading state
    await new Promise((resolve) => setTimeout(resolve, 350));
    return generateEventPlan(inputs, 'deterministic');
  }
}

export class GeminiAIAdapter implements PlanningEngineAdapter {
  name = 'Gemini AI Assistant (Configured)';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-1.5-flash') {
    this.apiKey = apiKey.trim();
    this.model = model;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 10);
  }

  async generatePlan(inputs: EventFormData): Promise<EventPlan> {
    if (!this.isAvailable()) {
      return generateEventPlan(inputs, 'deterministic');
    }

    // Call Gemini API if user configured their own key
    try {
      const prompt = `You are an expert celebration and event planner. 
Generate a comprehensive, tailored event plan in valid JSON format matching this schema:
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

Return ONLY a raw JSON object with keys:
{
  "themeAndAtmosphere": [3-4 descriptive ideas],
  "foodAndBeverage": [3-4 descriptive ideas],
  "activitiesAndMoments": [3-4 descriptive ideas],
  "decorAndDetails": [3-4 descriptive ideas],
  "guestExperience": [3-4 descriptive ideas],
  "assumptions": [3-4 realistic assumptions],
  "nextSteps": [3-4 concrete next steps]
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Gemini request failed.');
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('Empty response received from Gemini API');
      }

      const parsed = JSON.parse(rawText);

      // Start with strict deterministic budget and timeline math (ensuring exact mathematical balance)
      const basePlan = generateEventPlan(inputs, 'ai');

      // Enhance with the model's creative ideas and assumptions
      if (parsed.themeAndAtmosphere && Array.isArray(parsed.themeAndAtmosphere)) {
        basePlan.ideas.themeAndAtmosphere = parsed.themeAndAtmosphere;
      }
      if (parsed.foodAndBeverage && Array.isArray(parsed.foodAndBeverage)) {
        basePlan.ideas.foodAndBeverage = parsed.foodAndBeverage;
      }
      if (parsed.activitiesAndMoments && Array.isArray(parsed.activitiesAndMoments)) {
        basePlan.ideas.activitiesAndMoments = parsed.activitiesAndMoments;
      }
      if (parsed.decorAndDetails && Array.isArray(parsed.decorAndDetails)) {
        basePlan.ideas.decorAndDetails = parsed.decorAndDetails;
      }
      if (parsed.guestExperience && Array.isArray(parsed.guestExperience)) {
        basePlan.ideas.guestExperience = parsed.guestExperience;
      }
      if (parsed.assumptions && Array.isArray(parsed.assumptions)) {
        basePlan.assumptions.assumptions = parsed.assumptions;
      }
      if (parsed.nextSteps && Array.isArray(parsed.nextSteps)) {
        basePlan.assumptions.nextSteps = parsed.nextSteps;
      }

      return basePlan;
    } catch {
      // Fallback cleanly to high-quality deterministic plan
      const fallbackPlan = generateEventPlan(inputs, 'deterministic');
      return fallbackPlan;
    }
  }
}

export function getPlanningAdapter(settings?: AISettings): PlanningEngineAdapter {
  if (settings?.useCustomKey && settings.apiKey) {
    return new GeminiAIAdapter(settings.apiKey, settings.model || 'gemini-1.5-flash');
  }
  return new DeterministicPlanningAdapter();
}
