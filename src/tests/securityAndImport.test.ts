import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SAMPLE_WEDDING } from '../data/sampleEvents';
import { parseImportedPlan, validateEventPlan } from '../services/eventPlanValidation';
import { importPlanFromJson, loadCurrentPlan, loadSavedPlans, loadSettings, saveSettings } from '../services/storage';
import { GeminiAIAdapter } from '../services/aiAdapter';

const validPlan = structuredClone(SAMPLE_WEDDING);

describe('event plan import validation', () => {
  it('accepts a complete plan and normalizes imported identity', () => {
    expect(validateEventPlan(validPlan)).toBe(true);
    const imported = parseImportedPlan(JSON.stringify(validPlan));
    expect(imported.id).not.toBe(validPlan.id);
    expect(imported.isSample).toBe(false);
  });

  it('rejects malformed JSON', () => {
    expect(() => parseImportedPlan('{')).toThrow(/not valid JSON/i);
  });

  it('rejects missing nested fields and invalid nested values', () => {
    const missing = structuredClone(validPlan) as unknown as Record<string, unknown>;
    delete missing.ideas;
    expect(validateEventPlan(missing)).toBe(false);
    const badTask = structuredClone(validPlan);
    badTask.timeline[0].tasks[0].completed = 'no' as unknown as boolean;
    expect(validateEventPlan(badTask)).toBe(false);
    const badVendor = structuredClone(validPlan);
    badVendor.vendorChecklist[0].priority = 'urgent' as 'high';
    expect(validateEventPlan(badVendor)).toBe(false);
    const duplicateIds = structuredClone(validPlan);
    duplicateIds.vendorChecklist[1].id = duplicateIds.vendorChecklist[0].id;
    expect(validateEventPlan(duplicateIds)).toBe(false);
    const unbalancedBudget = structuredClone(validPlan);
    unbalancedBudget.budgetBreakdown[0].allocatedAmount += 1;
    expect(validateEventPlan(unbalancedBudget)).toBe(false);
  });

  it('rejects unsupported event types, invalid dates, and invalid budgets', () => {
    const unsupported = structuredClone(validPlan);
    (unsupported.inputs as { eventType: string }).eventType = 'conference';
    expect(validateEventPlan(unsupported)).toBe(false);
    const invalidDate = structuredClone(validPlan);
    invalidDate.inputs.date = '2027-02-30';
    expect(validateEventPlan(invalidDate)).toBe(false);
    const invalidBudget = structuredClone(validPlan);
    invalidBudget.inputs.totalBudget = Number.POSITIVE_INFINITY;
    expect(validateEventPlan(invalidBudget)).toBe(false);
  });

  it('rejects files over the 2 MB limit before reading', async () => {
    const file = { size: 2 * 1024 * 1024 + 1 } as File;
    await expect(importPlanFromJson(file)).rejects.toThrow(/too large/i);
  });
});

describe('settings credential handling', () => {
  const store = new Map<string, string>();
  beforeEach(() => {
    store.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
      clear: () => store.clear(),
    });
  });


  it('removes malformed current plans and filters invalid saved plans', () => {
    localStorage.setItem('event_planner_current_plan', JSON.stringify({ inputs: { name: 'broken' } }));
    expect(loadCurrentPlan()).toBeNull();
    expect(localStorage.getItem('event_planner_current_plan')).toBeNull();

    const invalidSavedPlan = { ...validPlan, timeline: [{ id: 'bad' }] };
    localStorage.setItem('event_planner_saved_plans', JSON.stringify([validPlan, invalidSavedPlan]));
    expect(loadSavedPlans()).toEqual([validPlan]);
    expect(JSON.parse(localStorage.getItem('event_planner_saved_plans') ?? '[]')).toHaveLength(1);
  });

  it('never saves or returns an API key and removes a legacy stored key', () => {
    saveSettings({ apiKey: 'secret-key-value', useCustomKey: true, model: 'gemini-3.8-flash' });
    expect(localStorage.getItem('event_planner_settings')).not.toContain('secret-key-value');
    localStorage.setItem('event_planner_settings', JSON.stringify({ apiKey: 'old-secret', useCustomKey: true, model: 'gemini-3.1-pro-preview' }));
    expect(loadSettings().apiKey).toBe('');
    expect(loadSettings().useCustomKey).toBe(false);
    expect(localStorage.getItem('event_planner_settings')).not.toContain('old-secret');
  });
});

describe('Gemini safe offline fallback', () => {
  it('falls back without exposing raw provider text or the key in the plan', async () => {
    const apiKey = 'sensitive-api-key-123';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 403, text: async () => `denied: ${apiKey}` }));
    const adapter = new GeminiAIAdapter(apiKey);
    const result = await adapter.generatePlan(validPlan.inputs);
    expect(result.engineMode).toBe('deterministic');
    expect(JSON.stringify(result)).not.toContain(apiKey);
    expect(JSON.stringify(result)).not.toContain('denied');
    vi.unstubAllGlobals();
  });

  it('accepts correctly shaped creative output', async () => {
    const suggestions = ['Idea one', 'Idea two', 'Idea three'];
    const generated = {
      themeAndAtmosphere: suggestions,
      foodAndBeverage: suggestions,
      activitiesAndMoments: suggestions,
      decorAndDetails: suggestions,
      guestExperience: suggestions,
      assumptions: suggestions,
      nextSteps: suggestions,
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(generated) }] } }] }),
    }));
    try {
      const result = await new GeminiAIAdapter('valid-test-key-123').generatePlan(validPlan.inputs);
      expect(result.engineMode).toBe('ai');
      expect(result.ideas.themeAndAtmosphere).toEqual(suggestions);
      expect(result.assumptions.nextSteps).toEqual(suggestions);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('falls back when the Gemini request times out', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    })));
    try {
      const pending = new GeminiAIAdapter('valid-test-key-123').generatePlan(validPlan.inputs);
      await vi.advanceTimersByTimeAsync(20_000);
      const result = await pending;
      expect(result.engineMode).toBe('deterministic');
    } finally {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    }
  });

  it('falls back when Gemini returns malformed nested content', async () => {
    const generated = {
      themeAndAtmosphere: [{ unsafe: 'not a string' }],
      foodAndBeverage: ['a', 'b', 'c'],
      activitiesAndMoments: ['a', 'b', 'c'],
      decorAndDetails: ['a', 'b', 'c'],
      guestExperience: ['a', 'b', 'c'],
      assumptions: ['a', 'b', 'c'],
      nextSteps: ['a', 'b', 'c'],
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(generated) }] } }] }),
    }));
    try {
      const result = await new GeminiAIAdapter('valid-test-key-123').generatePlan(validPlan.inputs);
      expect(result.engineMode).toBe('deterministic');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
