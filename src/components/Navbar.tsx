import React, { useState } from 'react';
import { Sparkles, FolderHeart, PlusCircle, Printer, Settings, ChevronDown, Check, ShieldCheck, Cpu } from 'lucide-react';
import type { EventPlan } from '../types/event';
import { SAMPLE_EVENTS } from '../data/sampleEvents';

interface NavbarProps {
  currentPlan: EventPlan | null;
  savedPlansCount: number;
  engineMode: 'deterministic' | 'ai';
  onNewEvent: () => void;
  onOpenSavedPlans: () => void;
  onOpenSettings: () => void;
  onLoadSample: (sample: EventPlan) => void;
  onPrint: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPlan,
  savedPlansCount,
  engineMode,
  onNewEvent,
  onOpenSavedPlans,
  onOpenSettings,
  onLoadSample,
  onPrint,
}) => {
  const [samplesOpen, setSamplesOpen] = useState(false);

  return (
    <header className="navbar no-print">
      <div className="navbar-container">
        {/* Brand */}
        <button type="button" className="brand-group" onClick={onNewEvent} aria-label="Create a new event plan">
          <div className="brand-logo">
            <Sparkles size={22} className="brand-sparkle" />
          </div>
          <div className="brand-text">
            <span className="brand-title">Festiva</span>
            <span className="brand-subtitle">Celebration Planner</span>
          </div>
        </button>

        {/* Engine status indicator */}
        <button type="button" className="engine-status-badge" onClick={onOpenSettings} title="View planning engine settings" aria-label="Open planning engine settings">
          {engineMode === 'ai' ? (
            <>
              <Cpu size={14} className="text-accent" />
              <span className="engine-label">Gemini AI Active</span>
            </>
          ) : (
            <>
              <ShieldCheck size={14} className="text-emerald" />
              <span className="engine-label">Offline Engine (100% Private)</span>
            </>
          )}
        </button>

        {/* Action controls */}
        <nav className="nav-actions" aria-label="Main Navigation">
          {/* Sample Presets Dropdown */}
          <div className="dropdown-container">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setSamplesOpen(!samplesOpen)}
              aria-expanded={samplesOpen}
              aria-haspopup="true"
            >
              <Sparkles size={15} />
              <span>Explore Samples</span>
              <ChevronDown size={14} className={samplesOpen ? 'rotate-180' : ''} />
            </button>

            {samplesOpen && (
              <div className="dropdown-menu" role="menu">
                <div className="dropdown-header">Preset Demonstration Events</div>
                {SAMPLE_EVENTS.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    className="dropdown-item"
                    role="menuitem"
                    onClick={() => {
                      onLoadSample(sample);
                      setSamplesOpen(false);
                    }}
                  >
                    <div className="sample-item-info">
                      <span className="sample-item-title">{sample.inputs.name}</span>
                      <span className="sample-item-meta">
                        {sample.inputs.eventType.toUpperCase()} • {sample.inputs.guestCount} guests
                      </span>
                    </div>
                    {currentPlan?.id === sample.id && <Check size={14} className="text-gold" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Saved Plans Drawer Button */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onOpenSavedPlans}
            aria-label={`View saved events (${savedPlansCount})`}
          >
            <FolderHeart size={16} />
            <span>Saved Plans</span>
            <span className="badge-count">{savedPlansCount}</span>
          </button>

          {/* Print Button (only when plan is loaded) */}
          {currentPlan && (
            <button
              type="button"
              className="btn btn-secondary btn-sm btn-icon-only"
              onClick={onPrint}
              title="Print or Save Plan to PDF"
              aria-label="Print or Save Plan to PDF"
            >
              <Printer size={16} />
            </button>
          )}

          {/* Settings Button */}
          <button
            type="button"
            className="btn btn-secondary btn-sm btn-icon-only"
            onClick={onOpenSettings}
            title="Planning Engine Settings"
            aria-label="Planning Engine Settings"
          >
            <Settings size={16} />
          </button>

          {/* Create New Event Button */}
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onNewEvent}
          >
            <PlusCircle size={16} />
            <span>Plan New Event</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
