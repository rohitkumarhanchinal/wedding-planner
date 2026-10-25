import type { BudgetCategory, EventFormData, EventPlan, TimelineMilestone, VendorTask } from '../types/event';

function scaleBudget(categories: BudgetCategory[], totalBudget: number): BudgetCategory[] {
  if (categories.length === 0) return [];
  const totalCents = Math.max(0, Math.round(totalBudget * 100));
  const weights = categories.map((category) => Math.max(0, Math.round(category.allocatedAmount * 100)));
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  const effectiveWeights = weightTotal > 0 ? weights : categories.map(() => 1);
  const effectiveTotal = effectiveWeights.reduce((sum, weight) => sum + weight, 0);
  const shares = effectiveWeights.map((weight, index) => {
    const exact = totalCents * weight / effectiveTotal;
    const cents = Math.floor(exact);
    return { index, cents, remainder: exact - cents };
  });
  let centsRemaining = totalCents - shares.reduce((sum, share) => sum + share.cents, 0);
  const remainderOrder = [...shares].sort((left, right) => right.remainder - left.remainder);
  for (let index = 0; centsRemaining > 0; index += 1, centsRemaining -= 1) {
    remainderOrder[index % remainderOrder.length].cents += 1;
  }
  const allocations = new Map(shares.map((share) => [share.index, share.cents]));

  return categories.map((category, index) => {
    const allocatedCents = allocations.get(index) ?? 0;
    const allocatedAmount = allocatedCents / 100;
    return {
      ...category,
      allocatedAmount,
      percentage: totalCents > 0 ? Math.round((allocatedCents / totalCents) * 1000) / 10 : 0,
    };
  });
}

function mergeTimeline(previous: TimelineMilestone[], generated: TimelineMilestone[], preserveProgress: boolean): TimelineMilestone[] {
  const oldById = new Map(previous.map((milestone) => [milestone.id, milestone]));
  const merged = generated.map((milestone) => {
    const oldMilestone = preserveProgress ? oldById.get(milestone.id) : undefined;
    if (!oldMilestone) return milestone;
    const oldTaskCompletion = new Map(oldMilestone.tasks.map((task) => [task.id, task.completed]));
    const tasks = milestone.tasks.map((task) => ({
      ...task,
      completed: oldTaskCompletion.get(task.id) ?? task.completed,
    }));
    const allDone = tasks.length > 0 && tasks.every((task) => task.completed);
    const someDone = tasks.some((task) => task.completed);
    return {
      ...milestone,
      tasks,
      status: allDone ? 'completed' as const : someDone ? 'in-progress' as const : 'pending' as const,
    };
  });
  const generatedIds = new Set(generated.map((milestone) => milestone.id));
  const customMilestones = previous.filter((milestone) =>
    (milestone.isCustom || milestone.id.startsWith('custom-milestone-')) && !generatedIds.has(milestone.id),
  );
  return [...merged, ...customMilestones];
}

function mergeVendors(previous: VendorTask[], generated: VendorTask[], preserveProgress: boolean): VendorTask[] {
  const oldById = new Map(previous.map((vendor) => [vendor.id, vendor]));
  const merged = generated.map((vendor) => {
    const oldVendor = preserveProgress ? oldById.get(vendor.id) : undefined;
    return oldVendor ? { ...vendor, status: oldVendor.status, notes: oldVendor.notes } : vendor;
  });
  const generatedIds = new Set(generated.map((vendor) => vendor.id));
  const customVendors = previous.filter((vendor) =>
    vendor.isCustom && !generatedIds.has(vendor.id),
  );
  return [...merged, ...customVendors];
}

function sameCreativePreferences(previous: EventFormData, next: EventFormData): boolean {
  return previous.eventType === next.eventType &&
    previous.themeStyle === next.themeStyle &&
    previous.priorities === next.priorities &&
    previous.dietaryAccessibility === next.dietaryAccessibility &&
    previous.additionalNotes === next.additionalNotes;
}

export function mergeEditedPlan(previous: EventPlan, generated: EventPlan): EventPlan {
  const sameEventType = previous.inputs.eventType === generated.inputs.eventType;
  const categories = sameEventType
    ? previous.budgetBreakdown
    : [...generated.budgetBreakdown, ...previous.budgetBreakdown.filter((category) => category.isCustom)];
  const customIdeasStillApply = previous.engineMode === generated.engineMode &&
    sameCreativePreferences(previous.inputs, generated.inputs);

  return {
    ...generated,
    id: previous.id,
    createdAt: previous.createdAt,
    budgetBreakdown: scaleBudget(categories.length > 0 ? categories : generated.budgetBreakdown, generated.inputs.totalBudget),
    timeline: mergeTimeline(previous.timeline, generated.timeline, sameEventType),
    vendorChecklist: mergeVendors(previous.vendorChecklist, generated.vendorChecklist, sameEventType),
    ideas: customIdeasStillApply ? structuredClone(previous.ideas) : generated.ideas,
  };
}
