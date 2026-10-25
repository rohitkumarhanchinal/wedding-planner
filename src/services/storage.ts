import type { EventPlan, AISettings } from '../types/event';
import { SAMPLE_EVENTS } from '../data/sampleEvents';
import { parseImportedPlan, validateEventPlan } from './eventPlanValidation';
import { DEFAULT_GEMINI_MODEL, SUPPORTED_GEMINI_MODELS } from './aiAdapter';

const STORAGE_KEY_CURRENT = 'event_planner_current_plan';
const STORAGE_KEY_SAVED_PLANS = 'event_planner_saved_plans';
const STORAGE_KEY_SETTINGS = 'event_planner_settings';

export function loadCurrentPlan(): EventPlan | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENT);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (validateEventPlan(parsed)) return parsed;
    localStorage.removeItem(STORAGE_KEY_CURRENT);
    return null;
  } catch {
    try { localStorage.removeItem(STORAGE_KEY_CURRENT); } catch { /* Storage may be unavailable. */ }
    return null;
  }
}

export function saveCurrentPlan(plan: EventPlan): void {
  try {
    const updated = { ...plan, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(updated));

    // Also update or add to saved plans list automatically
    upsertSavedPlan(updated);
  } catch (err) {
    console.error('Error saving current plan to localStorage:', err);
  }
}

export function loadSavedPlans(): EventPlan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_PLANS);
    if (!raw) {
      // Initialize with sample events if completely empty
      localStorage.setItem(STORAGE_KEY_SAVED_PLANS, JSON.stringify(SAMPLE_EVENTS));
      return SAMPLE_EVENTS;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(STORAGE_KEY_SAVED_PLANS, JSON.stringify([]));
      return [];
    }
    const plans = parsed.filter(validateEventPlan);
    if (plans.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY_SAVED_PLANS, JSON.stringify(plans));
    }
    return plans;
  } catch {
    return SAMPLE_EVENTS;
  }
}

export function upsertSavedPlan(plan: EventPlan): void {
  try {
    const plans = loadSavedPlans();
    const existingIndex = plans.findIndex((p) => p.id === plan.id);
    let updatedPlans: EventPlan[];

    if (existingIndex >= 0) {
      updatedPlans = [...plans];
      updatedPlans[existingIndex] = plan;
    } else {
      updatedPlans = [plan, ...plans];
    }

    localStorage.setItem(STORAGE_KEY_SAVED_PLANS, JSON.stringify(updatedPlans));
  } catch (err) {
    console.error('Error upserting saved plan:', err);
  }
}

export function deleteSavedPlan(planId: string): EventPlan[] {
  try {
    const plans = loadSavedPlans().filter((p) => p.id !== planId);
    localStorage.setItem(STORAGE_KEY_SAVED_PLANS, JSON.stringify(plans));

    // If current plan was deleted, clear it or switch
    const current = loadCurrentPlan();
    if (current && current.id === planId) {
      if (plans.length > 0) {
        localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(plans[0]));
      } else {
        localStorage.removeItem(STORAGE_KEY_CURRENT);
      }
    }

    return plans;
  } catch (err) {
    console.error('Error deleting saved plan:', err);
    return loadSavedPlans();
  }
}

export function duplicateSavedPlan(sourcePlan: EventPlan): EventPlan {
  const newPlan: EventPlan = {
    ...JSON.parse(JSON.stringify(sourcePlan)),
    id: `plan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    isSample: false,
    inputs: {
      ...sourcePlan.inputs,
      name: `${sourcePlan.inputs.name} (Copy)`,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  upsertSavedPlan(newPlan);
  saveCurrentPlan(newPlan);
  return newPlan;
}

export function exportPlanToJson(plan: EventPlan): void {
  const safeName = plan.inputs.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const filename = `${safeName}-plan.json`;
  const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importPlanFromJson(file: File): Promise<EventPlan> {
  if (file.size > MAX_PLAN_FILE_SIZE) throw new Error('Plan file is too large. Choose a JSON file smaller than 2 MB.');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (typeof reader.result !== 'string') throw new Error('The selected file could not be read as text.');
        const importedPlan = parseImportedPlan(reader.result);
        upsertSavedPlan(importedPlan);
        saveCurrentPlan(importedPlan);
        resolve(importedPlan);
      } catch (error: unknown) {
        reject(error instanceof Error ? error : new Error('The selected plan could not be imported.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read the selected file. Please try again.'));
    reader.onabort = () => reject(new Error('Reading the selected file was cancelled.'));
    reader.readAsText(file);
  });
}

const MAX_PLAN_FILE_SIZE = 2 * 1024 * 1024;

function isSupportedStoredModel(value: unknown): value is string {
  return typeof value === 'string' && SUPPORTED_GEMINI_MODELS.some((model) => model === value);
}

export function loadSettings(): AISettings {
  const fallback: AISettings = { apiKey: '', useCustomKey: false, model: DEFAULT_GEMINI_MODEL };
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return fallback;
    const stored: unknown = JSON.parse(raw);
    if (typeof stored !== 'object' || stored === null) return fallback;
    const record = stored as Record<string, unknown>;
    // Remove any key written by older versions immediately, and never return it.
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify({ useCustomKey: false, model: isSupportedStoredModel(record.model) ? record.model : fallback.model }));
    return { apiKey: '', useCustomKey: false, model: isSupportedStoredModel(record.model) ? record.model : fallback.model };
  } catch {
    try { localStorage.removeItem(STORAGE_KEY_SETTINGS); } catch { /* Storage may be unavailable. */ }
    return fallback;
  }
}

export function saveSettings(settings: AISettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify({ useCustomKey: false, model: isSupportedStoredModel(settings.model) ? settings.model : DEFAULT_GEMINI_MODEL }));
  } catch {
    // Settings are optional; avoid logging values that may contain credentials.
  }
}
