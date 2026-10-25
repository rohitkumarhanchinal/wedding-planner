import type { EventFormData, ValidationErrors } from '../types/event';

export function validateEventForm(data: Partial<EventFormData>): {
  isValid: boolean;
  errors: ValidationErrors;
} {
  const errors: ValidationErrors = {};

  // Event Type
  if (!data.eventType || !['wedding', 'birthday', 'community'].includes(data.eventType)) {
    errors.eventType = 'Please select a valid event type (Wedding, Birthday, or Community Event).';
  }

  // Name
  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Event name is required (e.g., "Maya & Leo’s Garden Wedding").';
  } else if (data.name.trim().length < 3) {
    errors.name = 'Event name should be at least 3 characters long.';
  } else if (data.name.trim().length > 100) {
    errors.name = 'Event name cannot exceed 100 characters.';
  }

  // Date
  if (!data.date) {
    errors.date = 'Event date is required.';
  } else {
    const parsedDate = new Date(data.date);
    if (isNaN(parsedDate.getTime())) {
      errors.date = 'Please enter a valid calendar date (YYYY-MM-DD).';
    }
  }

  // Location
  if (!data.location || data.location.trim().length === 0) {
    errors.location = 'Location or city is required (e.g., "Austin, TX" or "Central Park Pavilion").';
  } else if (data.location.trim().length < 2) {
    errors.location = 'Location must be at least 2 characters.';
  }

  // Guest Count
  if (data.guestCount === undefined || data.guestCount === null || isNaN(Number(data.guestCount))) {
    errors.guestCount = 'Guest count is required.';
  } else {
    const num = Number(data.guestCount);
    if (!Number.isInteger(num)) {
      errors.guestCount = 'Guest count must be a whole number.';
    } else if (num <= 0) {
      errors.guestCount = 'Guest count must be at least 1 person.';
    } else if (num > 50000) {
      errors.guestCount = 'For events exceeding 50,000 attendees, please contact municipal emergency services directly.';
    }
  }

  // Currency
  const validCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY'];
  if (!data.currency || !validCurrencies.includes(data.currency)) {
    errors.currency = 'Please select a valid currency.';
  }

  // Total Budget
  if (data.totalBudget === undefined || data.totalBudget === null || isNaN(Number(data.totalBudget))) {
    errors.totalBudget = 'Total budget is required.';
  } else {
    const budget = Number(data.totalBudget);
    if (budget <= 0) {
      errors.totalBudget = 'Total budget must be greater than zero.';
    } else if (budget > 1000000000) {
      errors.totalBudget = 'Budget cannot exceed 1,000,000,000.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
