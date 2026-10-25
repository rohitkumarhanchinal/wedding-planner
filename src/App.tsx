import { useState, type KeyboardEvent } from 'react';
import {
  Coins,
  Calendar,
  ClipboardCheck,
  Sparkles,
  HelpCircle,
  PlusCircle,
  ArrowLeft,
} from 'lucide-react';
import type {
  EventPlan,
  EventFormData,
  AISettings,
  BudgetCategory,
  TimelineMilestone,
  VendorTask,
  PersonalizedIdeas,
} from './types/event';
import { Navbar } from './components/Navbar';
import { EventCreationForm } from './components/EventCreationForm';
import { PlanHeader } from './components/PlanHeader';
import { BudgetPlanner } from './components/BudgetPlanner';
import { TimelineView } from './components/TimelineView';
import { VendorChecklistView } from './components/VendorChecklistView';
import { IdeasShowcase } from './components/IdeasShowcase';
import { AssumptionsPanel } from './components/AssumptionsPanel';
import { SavedPlansDrawer } from './components/SavedPlansDrawer';
import { SettingsModal } from './components/SettingsModal';
import { ToastContainer } from './components/Toast';
import type { ToastMessage } from './components/Toast';
import {
  loadCurrentPlan,
  saveCurrentPlan,
  loadSavedPlans,
  deleteSavedPlan,
  duplicateSavedPlan,
  exportPlanToJson,
  importPlanFromJson,
  loadSettings,
  saveSettings,
} from './services/storage';
import { getPlanningAdapter } from './services/aiAdapter';
import { mergeEditedPlan } from './services/planMerge';
import { SAMPLE_WEDDING } from './data/sampleEvents';

type ActiveTab = 'budget' | 'timeline' | 'vendors' | 'ideas' | 'assumptions';

const PLAN_TABS: ActiveTab[] = ['budget', 'timeline', 'vendors', 'ideas', 'assumptions'];

export function App() {
  const [savedPlans, setSavedPlans] = useState<EventPlan[]>(() => loadSavedPlans());
  const [currentPlan, setCurrentPlan] = useState<EventPlan | null>(() => {
    const current = loadCurrentPlan();
    if (current) return current;
    const saved = loadSavedPlans();
    if (saved.length > 0) return saved[0];
    saveCurrentPlan(SAMPLE_WEDDING);
    return SAMPLE_WEDDING;
  });
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [editingInputs, setEditingInputs] = useState<EventFormData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('budget');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settings, setSettings] = useState<AISettings>(() => loadSettings());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, text, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handlePlanTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, tab: ActiveTab) => {
    const currentIndex = PLAN_TABS.indexOf(tab);
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % PLAN_TABS.length;
    if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + PLAN_TABS.length) % PLAN_TABS.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = PLAN_TABS.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    const nextTab = PLAN_TABS[nextIndex];
    setActiveTab(nextTab);
    document.getElementById(`plan-tab-${nextTab}`)?.focus();
  };

  // Create new or edit plan submission
  const handleSubmitForm = async (formData: EventFormData) => {
    setIsLoading(true);
    try {
      const requestedGemini = settings.useCustomKey && Boolean(settings.apiKey);
      const adapter = getPlanningAdapter(settings);
      const generated = await adapter.generatePlan(formData);

      const plan = editingInputs && currentPlan
        ? mergeEditedPlan(currentPlan, generated)
        : generated;

      setCurrentPlan(plan);
      saveCurrentPlan(plan);
      setSavedPlans(loadSavedPlans());
      setIsCreating(false);
      setEditingInputs(null);
      setActiveTab('budget');

      const message = editingInputs
        ? 'Event plan updated successfully!'
        : `Complete plan generated for "${formData.name}"!`;
      addToast(
        requestedGemini && generated.engineMode === 'deterministic'
          ? `Gemini was unavailable. Offline planning was used. ${message}`
          : message,
        requestedGemini && generated.engineMode === 'deterministic' ? 'info' : 'success'
      );
    } catch {
      addToast('Plan generation failed. Please check your details and try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNewEvent = () => {
    setEditingInputs(null);
    setIsCreating(true);
  };

  const handleEditDetails = () => {
    if (currentPlan) {
      setEditingInputs(currentPlan.inputs);
      setIsCreating(true);
    }
  };

  const handleLoadSample = (sample: EventPlan) => {
    setCurrentPlan(sample);
    saveCurrentPlan(sample);
    setSavedPlans(loadSavedPlans());
    setIsCreating(false);
    setActiveTab('budget');
    addToast(`Loaded demonstration plan: "${sample.inputs.name}"`, 'info');
  };

  const handleDuplicate = (plan: EventPlan) => {
    const copy = duplicateSavedPlan(plan);
    setCurrentPlan(copy);
    setSavedPlans(loadSavedPlans());
    addToast(`Plan duplicated as "${copy.inputs.name}"`, 'success');
  };

  const handleDeletePlan = (planId: string) => {
    const updated = deleteSavedPlan(planId);
    setSavedPlans(updated);
    if (currentPlan?.id === planId) {
      if (updated.length > 0) {
        setCurrentPlan(updated[0]);
      } else {
        setCurrentPlan(null);
        setIsCreating(true);
      }
    }
    addToast('Plan deleted from local storage', 'info');
  };

  const handleUpdateCategories = (categories: BudgetCategory[]) => {
    if (!currentPlan) return;
    const updated: EventPlan = { ...currentPlan, budgetBreakdown: categories };
    setCurrentPlan(updated);
    saveCurrentPlan(updated);
    addToast('Budget allocations updated and saved', 'success');
  };

  const handleUpdateTimeline = (timeline: TimelineMilestone[]) => {
    if (!currentPlan) return;
    const updated: EventPlan = { ...currentPlan, timeline };
    setCurrentPlan(updated);
    saveCurrentPlan(updated);
  };

  const handleUpdateChecklist = (vendorChecklist: VendorTask[]) => {
    if (!currentPlan) return;
    const updated: EventPlan = { ...currentPlan, vendorChecklist };
    setCurrentPlan(updated);
    saveCurrentPlan(updated);
  };

  const handleUpdateIdeas = (ideas: PersonalizedIdeas) => {
    if (!currentPlan) return;
    const updated: EventPlan = { ...currentPlan, ideas };
    setCurrentPlan(updated);
    saveCurrentPlan(updated);
  };

  const handleSaveSettings = (newSettings: AISettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    addToast(
      newSettings.useCustomKey
        ? 'Settings saved. Gemini sends your API key and event details to Google for processing when a plan is generated.'
        : 'Settings saved. Plans will be generated offline on this device.',
      'info'
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleImportPlan = async (file: File) => {
    try {
      const imported = await importPlanFromJson(file);
      setCurrentPlan(imported);
      setSavedPlans(loadSavedPlans());
      setIsCreating(false);
      addToast(`Successfully imported plan: "${imported.inputs.name}"`, 'success');
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Failed to import JSON plan.', 'error');
    }
  };

  return (
    <div className="app-layout">
      {/* Top Navigation */}
      <Navbar
        currentPlan={currentPlan}
        savedPlansCount={savedPlans.length}
        engineMode={currentPlan?.engineMode ?? 'deterministic'}
        onNewEvent={handleStartNewEvent}
        onOpenSavedPlans={() => setIsDrawerOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLoadSample={handleLoadSample}
        onPrint={handlePrint}
      />

      {/* Main App Content */}
      <main className="main-content" id="main-content">
        {isCreating ? (
          <div className="form-page-container">
            {currentPlan && (
              <button
                type="button"
                className="btn btn-ghost btn-sm back-to-plan-btn no-print"
                onClick={() => setIsCreating(false)}
              >
                <ArrowLeft size={16} />
                <span>Return to Current Plan ({currentPlan.inputs.name})</span>
              </button>
            )}
            <EventCreationForm
              initialData={editingInputs}
              isLoading={isLoading}
              onSubmit={handleSubmitForm}
              onLoadSample={handleLoadSample}
            />
          </div>
        ) : currentPlan ? (
          <div className="plan-view-container">
            {/* Plan Header Summary Card */}
            <PlanHeader
              plan={currentPlan}
              onEditDetails={handleEditDetails}
              onDuplicate={() => handleDuplicate(currentPlan)}
              onExport={() => exportPlanToJson(currentPlan)}
            />

            {/* Navigation Tabs */}
            <div className="plan-tabs-bar no-print" role="tablist" aria-label="Event Plan Sections">
              <button
                type="button"
                className={`plan-tab-btn ${activeTab === 'budget' ? 'active' : ''}`}
                onClick={() => setActiveTab('budget')}
                role="tab"
                aria-selected={activeTab === 'budget'}
                aria-controls="event-plan-tabpanel"
                id="plan-tab-budget"
                tabIndex={activeTab === 'budget' ? 0 : -1}
                onKeyDown={(event) => handlePlanTabKeyDown(event, 'budget')}
              >
                <Coins size={16} />
                <span>Budget Breakdown</span>
              </button>
              <button
                type="button"
                className={`plan-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
                onClick={() => setActiveTab('timeline')}
                role="tab"
                aria-selected={activeTab === 'timeline'}
                aria-controls="event-plan-tabpanel"
                id="plan-tab-timeline"
                tabIndex={activeTab === 'timeline' ? 0 : -1}
                onKeyDown={(event) => handlePlanTabKeyDown(event, 'timeline')}
              >
                <Calendar size={16} />
                <span>Planning Timeline</span>
              </button>
              <button
                type="button"
                className={`plan-tab-btn ${activeTab === 'vendors' ? 'active' : ''}`}
                onClick={() => setActiveTab('vendors')}
                role="tab"
                aria-selected={activeTab === 'vendors'}
                aria-controls="event-plan-tabpanel"
                id="plan-tab-vendors"
                tabIndex={activeTab === 'vendors' ? 0 : -1}
                onKeyDown={(event) => handlePlanTabKeyDown(event, 'vendors')}
              >
                <ClipboardCheck size={16} />
                <span>Vendor Checklist</span>
              </button>
              <button
                type="button"
                className={`plan-tab-btn ${activeTab === 'ideas' ? 'active' : ''}`}
                onClick={() => setActiveTab('ideas')}
                role="tab"
                aria-selected={activeTab === 'ideas'}
                aria-controls="event-plan-tabpanel"
                id="plan-tab-ideas"
                tabIndex={activeTab === 'ideas' ? 0 : -1}
                onKeyDown={(event) => handlePlanTabKeyDown(event, 'ideas')}
              >
                <Sparkles size={16} />
                <span>Personalized Ideas</span>
              </button>
              <button
                type="button"
                className={`plan-tab-btn ${activeTab === 'assumptions' ? 'active' : ''}`}
                onClick={() => setActiveTab('assumptions')}
                role="tab"
                aria-selected={activeTab === 'assumptions'}
                aria-controls="event-plan-tabpanel"
                id="plan-tab-assumptions"
                tabIndex={activeTab === 'assumptions' ? 0 : -1}
                onKeyDown={(event) => handlePlanTabKeyDown(event, 'assumptions')}
              >
                <HelpCircle size={16} />
                <span>Assumptions & Steps</span>
              </button>
            </div>

            {/* Active Section Content */}
            <div className="tab-panel-container" id="event-plan-tabpanel" role="tabpanel" aria-labelledby={`plan-tab-${activeTab}`} tabIndex={0}>
              {activeTab === 'budget' && (
                <BudgetPlanner
                  categories={currentPlan.budgetBreakdown}
                  totalBudget={currentPlan.inputs.totalBudget}
                  currency={currentPlan.inputs.currency}
                  guestCount={currentPlan.inputs.guestCount}
                  onUpdateCategories={handleUpdateCategories}
                />
              )}

              {activeTab === 'timeline' && (
                <TimelineView
                  timeline={currentPlan.timeline}
                  eventDate={currentPlan.inputs.date}
                  onUpdateTimeline={handleUpdateTimeline}
                />
              )}

              {activeTab === 'vendors' && (
                <VendorChecklistView
                  checklist={currentPlan.vendorChecklist}
                  currency={currentPlan.inputs.currency}
                  onUpdateChecklist={handleUpdateChecklist}
                />
              )}

              {activeTab === 'ideas' && (
                <IdeasShowcase
                  ideas={currentPlan.ideas}
                  onUpdateIdeas={handleUpdateIdeas}
                  onShowToast={(msg) => addToast(msg, 'info')}
                />
              )}

              {activeTab === 'assumptions' && (
                <AssumptionsPanel assumptions={currentPlan.assumptions} />
              )}
            </div>
          </div>
        ) : (
          <div className="empty-home-container">
            <Sparkles size={48} className="text-gold" />
            <h2 className="empty-home-title">Ready to Plan Your Next Celebration?</h2>
            <p className="empty-home-desc">
              Create a customized event with an exact budget breakdown, date-aware timeline, and vendor checklist.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={handleStartNewEvent}
            >
              <PlusCircle size={18} />
              <span>Start Planning an Event</span>
            </button>
          </div>
        )}
      </main>

      {/* Slide-over Saved Plans Drawer */}
      <SavedPlansDrawer
        isOpen={isDrawerOpen}
        savedPlans={savedPlans}
        currentPlanId={currentPlan?.id}
        onClose={() => setIsDrawerOpen(false)}
        onSelectPlan={(plan) => {
          setCurrentPlan(plan);
          saveCurrentPlan(plan);
          setIsCreating(false);
          setActiveTab('budget');
          addToast(`Switched to "${plan.inputs.name}"`, 'info');
        }}
        onNewPlan={handleStartNewEvent}
        onDuplicatePlan={handleDuplicate}
        onDeletePlan={handleDeletePlan}
        onExportPlan={exportPlanToJson}
        onImportPlan={handleImportPlan}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onSaveSettings={handleSaveSettings}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default App;
