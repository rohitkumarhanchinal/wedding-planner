import { describe, expect, it } from 'vitest';
import { SAMPLE_WEDDING } from '../data/sampleEvents';
import { generateEventPlan } from '../services/plannerEngine';
import { mergeEditedPlan } from '../services/planMerge';

describe('editing existing plans', () => {
  it('keeps IDs and progress, preserves custom tasks, and rebalances budget exactly', () => {
    const previous = structuredClone(SAMPLE_WEDDING);
    previous.budgetBreakdown[0].allocatedAmount += 500;
    previous.budgetBreakdown[1].allocatedAmount -= 500;
    previous.vendorChecklist[0].status = 'booked';
    previous.vendorChecklist.push({
      id: 'custom-vendor-1', category: 'Music', title: 'Live harpist', estimatedCost: 900,
      dueDate: previous.inputs.date, status: 'contacted', priority: 'medium', isCustom: true,
    });
    previous.timeline[0].tasks[0].completed = true;
    previous.ideas.themeAndAtmosphere.push('User-selected idea');

    const nextInputs = { ...previous.inputs, date: '2028-07-11', totalBudget: 42000 };
    const generated = generateEventPlan(nextInputs);
    const merged = mergeEditedPlan(previous, generated);

    expect(merged.id).toBe(previous.id);
    expect(merged.createdAt).toBe(previous.createdAt);
    expect(merged.vendorChecklist.find((vendor) => vendor.id === 'vendor-1')?.status).toBe('booked');
    expect(merged.vendorChecklist.some((vendor) => vendor.id === 'custom-vendor-1')).toBe(true);
    expect(merged.timeline[0].tasks[0].completed).toBe(true);
    expect(merged.ideas.themeAndAtmosphere).toContain('User-selected idea');
    expect(Math.round(merged.budgetBreakdown.reduce((sum, category) => sum + category.allocatedAmount, 0) * 100)).toBe(4_200_000);
  });

  it('regenerates creative ideas after relevant preferences change', () => {
    const previous = structuredClone(SAMPLE_WEDDING);
    const changedInputs = { ...previous.inputs, themeStyle: 'Modern minimal' };
    const generated = generateEventPlan(changedInputs);
    const merged = mergeEditedPlan(previous, generated);

    expect(merged.ideas).toEqual(generated.ideas);
  });
});
