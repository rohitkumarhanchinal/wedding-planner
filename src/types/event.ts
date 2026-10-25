export type EventType = 'wedding' | 'birthday' | 'community';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'INR' | 'JPY';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string;
}

export interface EventFormData {
  eventType: EventType;
  name: string;
  date: string; // YYYY-MM-DD
  location: string;
  guestCount: number;
  currency: CurrencyCode;
  totalBudget: number;
  // Optional preferences
  themeStyle?: string;
  priorities?: string;
  dietaryAccessibility?: string;
  additionalNotes?: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  percentage: number;
  allocatedAmount: number;
  actualSpent?: number;
  description: string;
  tips: string[];
  isCustom?: boolean;
}

export type TaskStatus = 'pending' | 'in-progress' | 'completed';

export interface TimelineMilestone {
  id: string;
  phase: string;
  title: string;
  targetDate: string; // YYYY-MM-DD or relative description
  daysFromNow: number;
  isPastDue: boolean;
  timeframeDescription: string;
  status: TaskStatus;
  isCustom?: boolean;
  tasks: {
    id: string;
    text: string;
    completed: boolean;
  }[];
}

export type VendorStatus = 'pending' | 'contacted' | 'booked' | 'completed' | 'declined';
export type PriorityLevel = 'high' | 'medium' | 'low';

export interface VendorTask {
  id: string;
  category: string;
  title: string;
  estimatedCost: number;
  dueDate: string;
  status: VendorStatus;
  priority: PriorityLevel;
  notes?: string;
  isCustom?: boolean;
}

export interface PersonalizedIdeas {
  themeAndAtmosphere: string[];
  foodAndBeverage: string[];
  activitiesAndMoments: string[];
  decorAndDetails: string[];
  guestExperience: string[];
}

export interface PlanAssumptions {
  assumptions: string[];
  nextSteps: string[];
}

export type EngineMode = 'deterministic' | 'ai';

export interface EventPlan {
  id: string;
  createdAt: string;
  updatedAt: string;
  inputs: EventFormData;
  budgetBreakdown: BudgetCategory[];
  timeline: TimelineMilestone[];
  vendorChecklist: VendorTask[];
  ideas: PersonalizedIdeas;
  assumptions: PlanAssumptions;
  isSample?: boolean;
  engineMode: EngineMode;
}

export interface ValidationErrors {
  eventType?: string;
  name?: string;
  date?: string;
  location?: string;
  guestCount?: string;
  currency?: string;
  totalBudget?: string;
}

export interface AISettings {
  apiKey: string;
  useCustomKey: boolean;
  model: string;
}
