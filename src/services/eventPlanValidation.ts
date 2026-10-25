import type {
  BudgetCategory,
  CurrencyCode,
  EventFormData,
  EventPlan,
  EventType,
  PlanAssumptions,
  PersonalizedIdeas,
  TimelineMilestone,
  VendorTask,
} from '../types/event';

const EVENT_TYPES = ['wedding', 'birthday', 'community'] as const satisfies readonly EventType[];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY'] as const satisfies readonly CurrencyCode[];
const ENGINE_MODES = ['deterministic', 'ai'] as const;
const TASK_STATUSES = ['pending', 'in-progress', 'completed'] as const;
const VENDOR_STATUSES = ['pending', 'contacted', 'booked', 'completed', 'declined'] as const;
const PRIORITIES = ['high', 'medium', 'low'] as const;

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const isOneOf = <T extends string>(value: unknown, choices: readonly T[]): value is T =>
  typeof value === 'string' && choices.includes(value as T);

function hasUniqueIds(values: unknown[]): boolean {
  const ids: string[] = [];
  for (const value of values) {
    if (!isRecord(value) || !isText(value.id)) return false;
    ids.push(value.id);
  }
  return new Set(ids).size === ids.length;
}

function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
    !Number.isNaN(Date.parse(value));
}

function isEventFormData(value: unknown): value is EventFormData {
  if (!isRecord(value) || !isOneOf(value.eventType, EVENT_TYPES) || !isText(value.name) ||
      !isCalendarDate(value.date) || !isText(value.location) ||
      !Number.isSafeInteger(value.guestCount) || (value.guestCount as number) <= 0 ||
      !isOneOf(value.currency, CURRENCIES) || !isNumber(value.totalBudget) || value.totalBudget < 0) {
    return false;
  }
  return ['themeStyle', 'priorities', 'dietaryAccessibility', 'additionalNotes']
    .every((key) => value[key] === undefined || typeof value[key] === 'string');
}

function isBudgetCategory(value: unknown): value is BudgetCategory {
  return isRecord(value) && isText(value.id) && isText(value.name) &&
    isNumber(value.percentage) && value.percentage >= 0 && value.percentage <= 100 &&
    isNumber(value.allocatedAmount) && value.allocatedAmount >= 0 &&
    (value.actualSpent === undefined || (isNumber(value.actualSpent) && value.actualSpent >= 0)) &&
    isText(value.description) && isStringArray(value.tips) &&
    (value.isCustom === undefined || typeof value.isCustom === 'boolean');
}

function isTimelineMilestone(value: unknown): value is TimelineMilestone {
  return isRecord(value) && isText(value.id) && isText(value.phase) && isText(value.title) &&
    isText(value.targetDate) && isNumber(value.daysFromNow) && typeof value.isPastDue === 'boolean' &&
    isText(value.timeframeDescription) && isOneOf(value.status, TASK_STATUSES) &&
    (value.isCustom === undefined || typeof value.isCustom === 'boolean') &&
    Array.isArray(value.tasks) && value.tasks.every((task) =>
      isRecord(task) && isText(task.id) && isText(task.text) && typeof task.completed === 'boolean');
}

function isVendorTask(value: unknown): value is VendorTask {
  return isRecord(value) && isText(value.id) && isText(value.category) && isText(value.title) &&
    isNumber(value.estimatedCost) && value.estimatedCost >= 0 && isText(value.dueDate) &&
    isOneOf(value.status, VENDOR_STATUSES) && isOneOf(value.priority, PRIORITIES) &&
    (value.notes === undefined || typeof value.notes === 'string') &&
    (value.isCustom === undefined || typeof value.isCustom === 'boolean');
}


function isBudgetCategoryList(value: unknown): value is BudgetCategory[] {
  if (!Array.isArray(value) || !value.every(isBudgetCategory) || !hasUniqueIds(value)) return false;
  let allocatedCents = 0;
  for (const category of value) {
    if (!isBudgetCategory(category)) return false;
    allocatedCents += Math.round(category.allocatedAmount * 100);
  }
  return Number.isSafeInteger(allocatedCents);
}

function isTimelineList(value: unknown): value is TimelineMilestone[] {
  if (!Array.isArray(value) || !value.every(isTimelineMilestone) || !hasUniqueIds(value)) return false;
  const milestones: TimelineMilestone[] = [];
  for (const item of value) {
    if (!isTimelineMilestone(item)) return false;
    milestones.push(item);
  }
  return hasUniqueIds(milestones.flatMap((milestone) => milestone.tasks));
}

function isVendorTaskList(value: unknown): value is VendorTask[] {
  return Array.isArray(value) && value.every(isVendorTask) && hasUniqueIds(value);
}

function isPersonalizedIdeas(value: unknown): value is PersonalizedIdeas {
  return isRecord(value) &&
    isStringArray(value.themeAndAtmosphere) && isStringArray(value.foodAndBeverage) &&
    isStringArray(value.activitiesAndMoments) && isStringArray(value.decorAndDetails) &&
    isStringArray(value.guestExperience);
}

function isPlanAssumptions(value: unknown): value is PlanAssumptions {
  return isRecord(value) && isStringArray(value.assumptions) && isStringArray(value.nextSteps);
}

export function validateEventPlan(value: unknown): value is EventPlan {
  if (!isRecord(value) || !isText(value.id) || !isIsoTimestamp(value.createdAt) ||
      !isIsoTimestamp(value.updatedAt) || !isOneOf(value.engineMode, ENGINE_MODES) ||
      (value.isSample !== undefined && typeof value.isSample !== 'boolean') ||
      !isEventFormData(value.inputs) || !isBudgetCategoryList(value.budgetBreakdown) ||
      !isTimelineList(value.timeline) || !isVendorTaskList(value.vendorChecklist) ||
      !isPersonalizedIdeas(value.ideas) || !isPlanAssumptions(value.assumptions)) {
    return false;
  }

  const allocatedCents = value.budgetBreakdown.reduce(
    (sum, category) => sum + Math.round(category.allocatedAmount * 100),
    0,
  );
  const totalBudgetCents = Math.round(value.inputs.totalBudget * 100);
  return Number.isSafeInteger(allocatedCents) && allocatedCents === totalBudgetCents;
}

export function parseImportedPlan(text: string): EventPlan {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('This file is not valid JSON. Check the file and try again.');
  }
  if (!validateEventPlan(parsed)) {
    throw new Error('This file is not a complete event plan or contains invalid fields.');
  }
  return {
    ...parsed,
    id: `plan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    isSample: false,
    updatedAt: new Date().toISOString(),
  };
}
