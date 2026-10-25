import React, { useEffect, useRef } from 'react';
import {
  FolderHeart,
  X,
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  Calendar,
  Users,
  Coins,
  Check,
  Sparkles,
} from 'lucide-react';
import type { EventPlan } from '../types/event';
import { formatCurrency } from '../services/currency';

interface SavedPlansDrawerProps {
  isOpen: boolean;
  savedPlans: EventPlan[];
  currentPlanId?: string;
  onClose: () => void;
  onSelectPlan: (plan: EventPlan) => void;
  onNewPlan: () => void;
  onDuplicatePlan: (plan: EventPlan) => void;
  onDeletePlan: (planId: string) => void;
  onExportPlan: (plan: EventPlan) => void;
  onImportPlan: (file: File) => void;
}

export const SavedPlansDrawer: React.FC<SavedPlansDrawerProps> = ({
  isOpen,
  savedPlans,
  currentPlanId,
  onClose,
  onSelectPlan,
  onNewPlan,
  onDuplicatePlan,
  onDeletePlan,
  onExportPlan,
  onImportPlan,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!isOpen) { previousFocusRef.current?.focus(); return; }
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelector<HTMLElement>('button, input, [tabindex]:not([tabindex="-1"])');
    focusable?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { onCloseRef.current(); return; }
      if (event.key !== 'Tab' || !dialog) return;
      const elements = Array.from(dialog.querySelectorAll<HTMLElement>('button, input, [tabindex]:not([tabindex="-1"])')).filter((element) => !element.hasAttribute('disabled') && element.offsetParent !== null);
      if (elements.length === 0) return;
      const first = elements[0]; const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportPlan(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside
        className="drawer-panel"
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="saved-plans-title"
      >
        <div className="drawer-header">
          <div className="drawer-title-group">
            <FolderHeart size={20} className="text-gold" />
            <h2 className="drawer-title" id="saved-plans-title">Saved Celebration Plans</h2>
            <span className="badge-count">{savedPlans.length}</span>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-icon-only"
            onClick={onClose}
            aria-label="Close saved plans drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="drawer-toolbar">
          <button
            type="button"
            className="btn btn-primary btn-sm flex-1"
            onClick={() => {
              onNewPlan();
              onClose();
            }}
          >
            <Plus size={15} />
            <span>Create New Plan</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => fileInputRef.current?.click()}
            title="Import Plan from JSON file"
            aria-label="Import plan from JSON file"
          >
            <Upload size={15} />
            <span>Import</span>
          </button>
        </div>

        {/* Plans List */}
        <div className="drawer-content">
          {savedPlans.length === 0 ? (
            <div className="drawer-empty-state">
              <FolderHeart size={36} className="text-muted" />
              <p className="empty-title">No saved plans found</p>
              <p className="empty-desc">Create your first event plan or explore one of the sample presets.</p>
            </div>
          ) : (
            <div className="drawer-plans-list">
              {savedPlans.map((plan) => {
                const isActive = currentPlanId === plan.id;
                return (
                  <div
                    key={plan.id}
                    className={`saved-plan-card ${isActive ? 'active-plan' : ''}`}
                    onClick={() => {
                      onSelectPlan(plan);
                      onClose();
                    }}
                    role="button"
                    aria-label={`Open ${plan.inputs.name}`}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectPlan(plan);
                        onClose();
                      }
                    }}
                  >
                    <div className="saved-card-header">
                      <div className="saved-plan-tags">
                        <span className="event-type-badge">{plan.inputs.eventType.toUpperCase()}</span>
                        {plan.isSample && (
                          <span className="sample-mini-tag">
                            <Sparkles size={10} />
                            <span>Sample</span>
                          </span>
                        )}
                        {isActive && (
                          <span className="current-active-tag">
                            <Check size={11} />
                            <span>Active</span>
                          </span>
                        )}
                      </div>

                      <div className="saved-card-actions no-print" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs btn-icon-only"
                          onClick={() => onDuplicatePlan(plan)}
                          title="Duplicate plan"
                          aria-label={`Duplicate ${plan.inputs.name}`}
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs btn-icon-only"
                          onClick={() => onExportPlan(plan)}
                          title="Download JSON export"
                          aria-label={`Export ${plan.inputs.name}`}
                        >
                          <Download size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs btn-icon-only text-danger"
                          onClick={() => onDeletePlan(plan.id)}
                          title="Delete plan"
                          aria-label={`Delete ${plan.inputs.name}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <h3 className="saved-plan-name">{plan.inputs.name}</h3>

                    <div className="saved-plan-meta">
                      <div className="meta-item">
                        <Calendar size={13} className="text-muted" />
                        <span>{plan.inputs.date}</span>
                      </div>
                      <div className="meta-item">
                        <Users size={13} className="text-muted" />
                        <span>{plan.inputs.guestCount} guests</span>
                      </div>
                      <div className="meta-item">
                        <Coins size={13} className="text-gold" />
                        <span>{formatCurrency(plan.inputs.totalBudget, plan.inputs.currency)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
