import type { EventPlan } from '../types/event';

const EVENT_TYPES = ['wedding', 'birthday', 'community'] as const;
const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY'] as const;
const ENGINE_MODES = ['deterministic', 'ai'] as const;
const TASK_STATUSES = ['pending', 'in-progress', 'completed'] as const;
const VENDOR_STATUSES = ['pending', 'contacted', 'booked', 'completed', 'declined'] as const;
const PRIORITIES = ['high', 'medium', 'low'] as const;

type UnknownRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is UnknownRecord => typeof value === 'object' && value !== null && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === 'string');
const isOneOf = <T extends string>(value: unknown, choices: readonly T[]): value is T => typeof value === 'string' && choices.includes(value as T);

export function validateEventPlan(value: unknown): value is EventPlan {
  if (!isRecord(value) || !isText(value.id) || !isValidTimestamp(value.createdAt) || !isValidTimestamp(value.updatedAt)) return false;
  if (!isOneOf(value.engineMode, ENGINE_MODES) || (value.isSample !== undefined && typeof value.isSample !== 'boolean')) return false;
  const inputs = value.inputs;
  if (!isRecord(inputs) || !isOneOf(inputs.eventType, EVENT_TYPES) || !isText(inputs.name) || !isValidCalendarDate(inputs.date) || !isText(inputs.location)) return false;
  if (!Number.isSafeInteger(inputs.guestCount) || (inputs.guestCount as number) <= 0 || !isOneOf(inputs.currency, CURRENCIES)) return false;
  if (typeof inputs.totalBudget !== 'number' || !Number.isFinite(inputs.totalBudget) || inputs.totalBudget < 0) return false;
  for (const key of ['themeStyle', 'priorities', 'dietaryAccessibility', 'additionalNotes']) {
    if (inputs[key] !== undefined && typeof inputs[key] !== 'string') return false;
  }
  if (!Array.isArray(value.budgetBreakdown) || !value.budgetBreakdown.every((item) => isRecord(item) && isText(item.id) && isText(item.name) && isNumber(item.percentage) && item.percentage >= 0 && item.percentage <= 100 && isNumber(item.allocatedAmount) && item.allocatedAmount >= 0 && (item.actualSpent === undefined || (isNumber(item.actualSpent) && item.actualSpent >= 0)) && isText(item.description) && isStringArray(item.tips) && (item.isCustom === undefined || typeof item.isCustom === 'boolean'))) return false;
  const totalBudget = inputs.totalBudget;
  if (!isNumber(totalBudget)) return false;
  let allocatedCents = 0;
  for (const item of value.budgetBreakdown) {
    if (!isRecord(item) || !isNumber(item.allocatedAmount)) return false;
    allocatedCents += Math.round(item.allocatedAmount * 100);
  }
  if (!Number.isSafeInteger(allocatedCents) || allocatedCents !== Math.round(totalBudget * 100)) return false;
  if (!Array.isArray(value.timeline) || !value.timeline.every((item) => isRecord(item) && isText(item.id) && isText(item.phase) && isText(item.title) && isText(item.targetDate) && isNumber(item.daysFromNow) && typeof item.isPastDue === 'boolean' && isText(item.timeframeDescription) && isOneOf(item.status, TASK_STATUSES) && Array.isArray(item.tasks) && item.tasks.every((task) => isRecord(task) && isText(task.id) && isText(task.text) && typeof task.completed === 'boolean'))) return false;
  if (!Array.isArray(value.vendorChecklist) || !value.vendorChecklist.every((item) => isRecord(item) && isText(item.id) && isText(item.category) && isText(item.title) && isNumber(item.estimatedCost) && item.estimatedCost >= 0 && isText(item.dueDate) && isOneOf(item.status, VENDOR_STATUSES) && isOneOf(item.priority, PRIORITIES) && (item.notes === undefined || typeof item.notes === 'string') && (item.isCustom === undefined || typeof item.isCustom === 'boolean'))) return false;
  const ideas = value.ideas;
  if (!isRecord(ideas) || !['themeAndAtmosphere', 'foodAndBeverage', 'activitiesAndMoments', 'decorAndDetails', 'guestExperience'].every((key) => isStringArray(ideas[key]))) return false;
  const assumptions = value.assumptions;
  return isRecord(assumptions) && isStringArray(assumptions.assumptions) && isStringArray(assumptions.nextSteps);
}

function isNumber(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value); }
function isValidTimestamp(value: unknown): value is string { return isText(value) && !Number.isNaN(Date.parse(value)); }
function isValidCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function parseImportedPlan(text: string): EventPlan {
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new Error('This file is not valid JSON. Check the file and try again.'); }
  if (!validateEventPlan(parsed)) throw new Error('This file is not a complete event plan or contains invalid fields.');
  return { ...parsed, id: `plan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, isSample: false, updatedAt: new Date().toISOString() };
}
