import { describe, it, expect } from 'vitest';
import {
  generateBudgetBreakdown,
  generateTimeline,
  generateVendorChecklist,
} from '../services/plannerEngine';
import { validateEventForm } from '../services/validation';
import type { EventFormData } from '../types/event';

describe('Planner Engine: Exact Budget Balancing', () => {
  it('balances wedding budget breakdown with 100% exact mathematical sum', () => {
    const totalBudget = 28000;
    const categories = generateBudgetBreakdown('wedding', totalBudget);
    const sum = Math.round(categories.reduce((acc, c) => acc + c.allocatedAmount, 0) * 100) / 100;

    expect(sum).toBe(totalBudget);
    expect(categories.length).toBeGreaterThan(0);
    // Every category must be non-negative
    categories.forEach((cat) => {
      expect(cat.allocatedAmount).toBeGreaterThanOrEqual(0);
    });
  });

  it('handles tricky odd numbers and fractional cents without discrepancy', () => {
    const trickyBudgets = [12345.67, 999.99, 1337.0, 7777.77, 4200.5];
    for (const budget of trickyBudgets) {
      const categories = generateBudgetBreakdown('birthday', budget);
      const sum = Math.round(categories.reduce((acc, c) => acc + c.allocatedAmount, 0) * 100) / 100;
      expect(sum).toBe(budget);
    }
  });

  it('handles very small budgets and zero budgets safely', () => {
    const categoriesZero = generateBudgetBreakdown('community', 0);
    const sumZero = categoriesZero.reduce((acc, c) => acc + c.allocatedAmount, 0);
    expect(sumZero).toBe(0);

    const categoriesSmall = generateBudgetBreakdown('community', 150);
    const sumSmall = Math.round(categoriesSmall.reduce((acc, c) => acc + c.allocatedAmount, 0) * 100) / 100;
    expect(sumSmall).toBe(150);
  });
});

describe('Planner Engine: Date-Aware Timeline', () => {
  it('generates chronological milestone phases for future wedding', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 240); // 8 months ahead
    const dateStr = futureDate.toISOString().split('T')[0];

    const timeline = generateTimeline(dateStr, 'wedding');
    expect(timeline.length).toBeGreaterThan(3);

    // Final phase should be Event Day with targetDate matching eventDate
    const lastMilestone = timeline[timeline.length - 1];
    expect(lastMilestone.targetDate).toBe(dateStr);
    expect(lastMilestone.tasks.length).toBeGreaterThan(0);
  });

  it('adapts timeframe for short-notice event (25 days out)', () => {
    const nearDate = new Date();
    nearDate.setDate(nearDate.getDate() + 25);
    const dateStr = nearDate.toISOString().split('T')[0];

    const timeline = generateTimeline(dateStr, 'birthday');
    expect(timeline.length).toBeGreaterThan(0);
    timeline.forEach((m) => {
      expect(m.daysFromNow).toBeDefined();
    });
  });
});

describe('Planner Engine: Event-Type Specific Vendor Checklist', () => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 100);
  const dateStr = futureDate.toISOString().split('T')[0];

  it('generates wedding-specific vendors', () => {
    const checklist = generateVendorChecklist('wedding', 30000, dateStr);
    const titles = checklist.map((v) => v.title.toLowerCase());
    const hasVenue = titles.some((t) => t.includes('venue'));
    const hasPhoto = titles.some((t) => t.includes('photographer'));
    const hasStylist = titles.some((t) => t.includes('hair') || t.includes('makeup'));

    expect(hasVenue).toBe(true);
    expect(hasPhoto).toBe(true);
    expect(hasStylist).toBe(true);
  });

  it('generates birthday-specific vendors', () => {
    const checklist = generateVendorChecklist('birthday', 3000, dateStr);
    const titles = checklist.map((v) => v.title.toLowerCase());
    const hasCake = titles.some((t) => t.includes('cake'));
    const hasBalloon = titles.some((t) => t.includes('balloon') || t.includes('photo wall'));

    expect(hasCake).toBe(true);
    expect(hasBalloon).toBe(true);
  });

  it('generates community-specific vendors', () => {
    const checklist = generateVendorChecklist('community', 8000, dateStr);
    const titles = checklist.map((v) => v.title.toLowerCase());
    const hasPermit = titles.some((t) => t.includes('permit'));
    const hasSanitation = titles.some((t) => t.includes('restroom') || t.includes('sanitation'));
    const hasAudio = titles.some((t) => t.includes('sound') || t.includes('stage'));

    expect(hasPermit).toBe(true);
    expect(hasSanitation).toBe(true);
    expect(hasAudio).toBe(true);
  });
});

describe('Validation Logic', () => {
  it('identifies valid event form data', () => {
    const validData: EventFormData = {
      eventType: 'wedding',
      name: 'Elena & Lucas Wedding',
      date: '2027-06-15',
      location: 'Florence, Italy',
      guestCount: 80,
      currency: 'EUR',
      totalBudget: 22000,
    };

    const res = validateEventForm(validData);
    expect(res.isValid).toBe(true);
    expect(Object.keys(res.errors).length).toBe(0);
  });

  it('rejects missing name, negative guest count, and zero budget with helpful messages', () => {
    const invalidData: Partial<EventFormData> = {
      eventType: 'birthday',
      name: '',
      date: 'invalid-date',
      location: '',
      guestCount: -5,
      currency: 'USD',
      totalBudget: 0,
    };

    const res = validateEventForm(invalidData);
    expect(res.isValid).toBe(false);
    expect(res.errors.name).toBeDefined();
    expect(res.errors.date).toBeDefined();
    expect(res.errors.location).toBeDefined();
    expect(res.errors.guestCount).toBeDefined();
    expect(res.errors.totalBudget).toBeDefined();
  });
});
