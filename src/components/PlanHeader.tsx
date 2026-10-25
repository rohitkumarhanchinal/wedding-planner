import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  Coins,
  Sparkles,
  Edit3,
  Copy,
  Download,
  Clock,
  CheckCircle,
  Tag,
} from 'lucide-react';
import type { EventPlan } from '../types/event';
import { formatCurrency } from '../services/currency';

interface PlanHeaderProps {
  plan: EventPlan;
  onEditDetails: () => void;
  onDuplicate: () => void;
  onExport: () => void;
}

export const PlanHeader: React.FC<PlanHeaderProps> = ({
  plan,
  onEditDetails,
  onDuplicate,
  onExport,
}) => {
  const { inputs, isSample, vendorChecklist, timeline } = plan;
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => setCurrentTime(Date.now()), 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  // Memoize countdown calculation
  const { countdownText, countdownClass } = useMemo(() => {
    const parts = inputs.date.split('-').map(Number);
    const eventDate = parts.length === 3
      ? new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0)
      : new Date(inputs.date);
    eventDate.setHours(0, 0, 0, 0);

    const eventTime = eventDate.getTime();
    const diffDays = Math.ceil((eventTime - currentTime) / (1000 * 60 * 60 * 24));

    if (diffDays > 1) {
      return { countdownText: `${diffDays} Days to go`, countdownClass: 'badge-future' };
    } else if (diffDays === 1) {
      return { countdownText: 'Tomorrow!', countdownClass: 'badge-urgent' };
    } else if (diffDays === 0) {
      return { countdownText: 'Today is the Day! 🎉', countdownClass: 'badge-today' };
    } else {
      return { countdownText: `Occurred ${Math.abs(diffDays)} days ago`, countdownClass: 'badge-past' };
    }
  }, [inputs.date, currentTime]);

  // Calculate overall task completion
  const vendorCompleted = vendorChecklist.filter(
    (v) => v.status === 'booked' || v.status === 'completed'
  ).length;
  const vendorTotal = vendorChecklist.length;

  let milestoneCompleted = 0;
  let milestoneTotal = 0;
  timeline.forEach((m) => {
    m.tasks.forEach((t) => {
      milestoneTotal += 1;
      if (t.completed) milestoneCompleted += 1;
    });
  });

  const totalTasks = vendorTotal + milestoneTotal;
  const completedTasks = vendorCompleted + milestoneCompleted;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const eventTypeLabel =
    inputs.eventType === 'wedding'
      ? 'Wedding Celebration'
      : inputs.eventType === 'birthday'
      ? 'Birthday Gathering'
      : 'Community Event';

  return (
    <div className="plan-header-card">
      {/* Top Banner if Sample */}
      {isSample && (
        <div className="sample-banner" role="status">
          <Sparkles size={16} className="text-gold" />
          <span>
            <strong>Demonstration Plan</strong> — Loaded with realistic sample data for quick evaluation. You can edit any field or customize line items freely.
          </span>
        </div>
      )}

      <div className="header-main-row">
        <div className="header-title-block">
          <div className="header-meta-pills">
            <span className="event-type-pill">
              <Tag size={12} />
              <span>{eventTypeLabel}</span>
            </span>
            <span className={`countdown-badge ${countdownClass}`}>
              <Clock size={12} />
              <span>{countdownText}</span>
            </span>
            {inputs.themeStyle && (
              <span className="theme-pill">
                <Sparkles size={12} />
                <span>Theme: {inputs.themeStyle}</span>
              </span>
            )}
          </div>
          <h1 className="plan-title">{inputs.name}</h1>
        </div>

        {/* Action Buttons */}
        <div className="header-actions no-print">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onEditDetails}
            title="Edit event parameters and preferences"
          >
            <Edit3 size={15} />
            <span>Edit Details</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onDuplicate}
            title="Duplicate this plan as a new copy"
          >
            <Copy size={15} />
            <span>Duplicate</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onExport}
            title="Export full plan as JSON"
          >
            <Download size={15} />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Snapshot Cards */}
      <div className="snapshot-grid">
        <div className="snapshot-card">
          <div className="snapshot-icon-box">
            <Calendar size={18} />
          </div>
          <div className="snapshot-content">
            <span className="snapshot-label">Date</span>
            <span className="snapshot-value">
              {new Date(inputs.date).toLocaleDateString(undefined, {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>

        <div className="snapshot-card">
          <div className="snapshot-icon-box">
            <MapPin size={18} />
          </div>
          <div className="snapshot-content">
            <span className="snapshot-label">Location</span>
            <span className="snapshot-value" title={inputs.location}>
              {inputs.location}
            </span>
          </div>
        </div>

        <div className="snapshot-card">
          <div className="snapshot-icon-box">
            <Users size={18} />
          </div>
          <div className="snapshot-content">
            <span className="snapshot-label">Guest Count</span>
            <span className="snapshot-value">{inputs.guestCount.toLocaleString()} Attendees</span>
          </div>
        </div>

        <div className="snapshot-card">
          <div className="snapshot-icon-box">
            <Coins size={18} />
          </div>
          <div className="snapshot-content">
            <span className="snapshot-label">Target Budget</span>
            <span className="snapshot-value">
              {formatCurrency(inputs.totalBudget, inputs.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="plan-progress-bar-container">
        <div className="progress-info-row">
          <span className="progress-label">
            <CheckCircle size={14} className="text-gold" />
            <span>Overall Readiness: {completedTasks} of {totalTasks} milestones & vendors ready</span>
          </span>
          <span className="progress-percentage">{progressPercent}%</span>
        </div>
        <div className="progress-track" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>
    </div>
  );
};
