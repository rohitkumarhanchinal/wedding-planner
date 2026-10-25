import type { EventPlan } from '../types/event';
import { generateEventPlan } from '../services/plannerEngine';

// Compute sample dates relative to today so they never look stale
function getRelativeDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

export const SAMPLE_WEDDING: EventPlan = {
  ...generateEventPlan({
    eventType: 'wedding',
    name: 'Maya & Julian’s Botanical Garden Wedding',
    date: getRelativeDate(210), // ~7 months out
    location: 'Meadowood Conservatory, Sonoma County, CA',
    guestCount: 125,
    currency: 'USD',
    totalBudget: 34000,
    themeStyle: 'Warm Tuscan Rustic with olive branch garlands, terracotta ceramics, and amber candlelight',
    priorities: 'Unforgettable food & wine pairing, live acoustic sunset ceremony, and documentary photography',
    dietaryAccessibility: '12 vegetarian guests, 4 gluten-free meals, wheelchair ramp needed for conservatory terrace',
    additionalNotes: 'Ceremony begins at 4:30 PM followed by outdoor cocktail lawn games before ballroom dinner.',
  }),
  id: 'sample-wedding-plan',
  isSample: true,
};

export const SAMPLE_BIRTHDAY: EventPlan = {
  ...generateEventPlan({
    eventType: 'birthday',
    name: 'Leo’s Retro Neon 30th Birthday Bash',
    date: getRelativeDate(35), // ~5 weeks out
    location: 'The Velvet Loft, Shoreditch, London, UK',
    guestCount: 45,
    currency: 'GBP',
    totalBudget: 4200,
    themeStyle: 'Late 80s Cyber-Retro with electric purple neon, metallic accents, and vaporwave synth vibes',
    priorities: 'Killer DJ set with 80s/90s dance floor anthems, custom themed cocktail bar, and instant polaroids',
    dietaryAccessibility: 'Heavy vegan finger food options, non-alcoholic craft mocktails for designated drivers',
    additionalNotes: 'Surprise toast at 10 PM. Friends are bringing a custom arcade tournament machine.',
  }),
  id: 'sample-birthday-plan',
  isSample: true,
};

export const SAMPLE_COMMUNITY: EventPlan = {
  ...generateEventPlan({
    eventType: 'community',
    name: 'Oakridge Summer Neighborhood Block Fair',
    date: getRelativeDate(75), // ~2.5 months out
    location: 'Oakridge Community Park & Elm Street Commons',
    guestCount: 300,
    currency: 'EUR',
    totalBudget: 7800,
    themeStyle: 'Vibrant local harvest festival with multicultural craft stalls and open-air acoustic jam',
    priorities: 'Safe family-friendly street closure, eco-friendly zero-waste stations, and local food truck variety',
    dietaryAccessibility: 'Halal, kosher-friendly, nut-free children’s snack boxes, fully step-free park pathways',
    additionalNotes: 'Volunteer committee shift roster needs 25 neighborhood marshals. City park permit filed.',
  }),
  id: 'sample-community-plan',
  isSample: true,
};

export const SAMPLE_EVENTS: EventPlan[] = [
  SAMPLE_WEDDING,
  SAMPLE_BIRTHDAY,
  SAMPLE_COMMUNITY,
];
