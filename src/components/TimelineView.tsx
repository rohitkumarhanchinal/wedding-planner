import React, { useState } from 'react';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';
import {
  Calendar,
  Clock,
  PlusCircle,
  ChevronDown,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import type { TimelineMilestone } from '../types/event';

interface TimelineViewProps {
  timeline: TimelineMilestone[];
  eventDate?: string;
  onUpdateTimeline: (timeline: TimelineMilestone[]) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  timeline,
  onUpdateTimeline,
}) => {
  const [collapsedPhases, setCollapsedPhases] = useState<Record<string, boolean>>({});
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const dialogRef = useDialogAccessibility<HTMLDivElement>(showAddMilestone, () => setShowAddMilestone(false));
  const [newTitle, setNewTitle] = useState('');
  const [newPhase, setNewPhase] = useState('Planning Phase');
  const [newDate, setNewDate] = useState('');
  const [newTasksText, setNewTasksText] = useState('');

  const togglePhase = (id: string) => {
    setCollapsedPhases((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleTask = (milestoneId: string, taskId: string) => {
    const updated = timeline.map((m) => {
      if (m.id === milestoneId) {
        const updatedTasks = m.tasks.map((t) => {
          if (t.id === taskId) {
            return { ...t, completed: !t.completed };
          }
          return t;
        });

        const allDone = updatedTasks.every((t) => t.completed);
        const someDone = updatedTasks.some((t) => t.completed);

        return {
          ...m,
          tasks: updatedTasks,
          status: allDone ? ('completed' as const) : someDone ? ('in-progress' as const) : ('pending' as const),
        };
      }
      return m;
    });

    onUpdateTimeline(updated);
  };

  const handleAddCustomMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const tasksList = newTasksText
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t, idx) => ({
        id: `custom-task-${Date.now()}-${idx}`,
        text: t,
        completed: false,
      }));

    const targetDateObj = newDate ? new Date(newDate) : new Date();
    const now = new Date();
    const diffDays = Math.ceil((targetDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const newMilestone: TimelineMilestone = {
      id: `custom-milestone-${Date.now()}`,
      phase: newPhase.trim() || 'Custom Phase',
      title: newTitle.trim(),
      targetDate: newDate || new Date().toISOString().split('T')[0],
      daysFromNow: diffDays,
      isPastDue: diffDays < 0,
      timeframeDescription: diffDays > 0 ? `In ${diffDays} days` : 'Immediate',
      status: 'pending',
      isCustom: true,
      tasks:
        tasksList.length > 0
          ? tasksList
          : [{ id: `custom-task-${Date.now()}-0`, text: 'Complete milestone objectives', completed: false }],
    };

    onUpdateTimeline([...timeline, newMilestone]);
    setShowAddMilestone(false);
    setNewTitle('');
    setNewDate('');
    setNewTasksText('');
  };

  const handleDeleteMilestone = (id: string) => {
    const filtered = timeline.filter((m) => m.id !== id);
    onUpdateTimeline(filtered);
  };

  return (
    <div className="planner-section-card">
      <div className="section-card-header">
        <div>
          <h2 className="section-card-title">
            <Calendar size={22} className="text-gold" />
            <span>Date-Aware Planning Timeline</span>
          </h2>
          <p className="section-card-desc">
            Organized chronologically backwards from your celebration date. Check off milestones as you make progress.
          </p>
        </div>
        <div className="section-header-actions no-print">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowAddMilestone(true)}
          >
            <PlusCircle size={15} />
            <span>Add Custom Milestone</span>
          </button>
        </div>
      </div>

      {/* Timeline Items */}
      <div className="timeline-track">
        {timeline.map((m, idx) => {
          const isCollapsed = collapsedPhases[m.id];
          const completedCount = m.tasks.filter((t) => t.completed).length;
          const totalCount = m.tasks.length;
          const isFullyDone = totalCount > 0 && completedCount === totalCount;

          return (
            <div
              key={m.id}
              className={`timeline-node ${isFullyDone ? 'node-completed' : ''} ${
                m.isPastDue ? 'node-urgent' : ''
              }`}
            >
              {/* Timeline Connector Dot */}
              <div className="timeline-dot-wrapper">
                <div className={`timeline-dot ${isFullyDone ? 'dot-done' : ''}`}>
                  {isFullyDone ? <Check size={12} /> : idx + 1}
                </div>
                {idx < timeline.length - 1 && <div className="timeline-line" />}
              </div>

              {/* Milestone Card */}
              <div className="timeline-card">
                <div
                  className="timeline-card-header"
                  onClick={() => togglePhase(m.id)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={!collapsedPhases[m.id]}
                  aria-controls={`timeline-tasks-${encodeURIComponent(m.id)}`}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      togglePhase(m.id);
                    }
                  }}
                >
                  <div className="milestone-title-group">
                    <span className="milestone-phase-badge">{m.phase}</span>
                    <span className="milestone-timeframe">
                      <Clock size={12} />
                      <span>{m.timeframeDescription}</span>
                      <span className="milestone-date-str">({m.targetDate})</span>
                    </span>
                    <h3 className="milestone-title">{m.title}</h3>
                  </div>

                  <div className="milestone-status-group">
                    <span
                      className={`task-counter-pill ${
                        isFullyDone ? 'pill-done' : completedCount > 0 ? 'pill-active' : ''
                      }`}
                    >
                      {completedCount}/{totalCount} tasks
                    </span>
                    <ChevronDown
                      size={16}
                      className={`collapse-chevron ${isCollapsed ? '' : 'rotate-180'}`}
                    />
                  </div>
                </div>

                {/* Subtask Checkboxes */}
                {!isCollapsed && (
                  <div className="milestone-tasks-container">
                    <ul className="milestone-task-list">
                      {m.tasks.map((task) => (
                        <li key={task.id} className="milestone-task-item">
                          <label className="task-checkbox-label">
                            <input
                              type="checkbox"
                              className="task-checkbox"
                              checked={task.completed}
                              onChange={() => handleToggleTask(m.id, task.id)}
                            />
                            <span className={`task-text ${task.completed ? 'task-done' : ''}`}>
                              {task.text}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>

                    {/* Delete milestone action if custom or empty */}
                    <div className="milestone-card-footer no-print">
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs text-danger"
                        onClick={() => handleDeleteMilestone(m.id)}
                        title="Remove milestone"
                      >
                        <Trash2 size={13} />
                        <span>Remove Phase</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Milestone Modal */}
      {showAddMilestone && (
        <div className="modal-backdrop" onClick={() => setShowAddMilestone(false)}>
          <div className="modal-dialog" ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="custom-timeline-dialog-title" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" id="custom-timeline-dialog-title">Add Custom Milestone Phase</h3>
              <button
                type="button"
                className="btn btn-ghost btn-xs btn-icon-only"
                onClick={() => setShowAddMilestone(false)}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddCustomMilestone} className="modal-body">
              <div className="form-group">
                <label className="form-label" htmlFor="newPhaseName">
                  Phase Category
                </label>
                <input
                  id="newPhaseName"
                  type="text"
                  className="form-input"
                  placeholder="e.g., Wardrobe & Styling or Rehearsal"
                  value={newPhase}
                  onChange={(e) => setNewPhase(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="newMilestoneTitle">
                  Milestone Goal <span className="required-star">*</span>
                </label>
                <input
                  id="newMilestoneTitle"
                  type="text"
                  className="form-input"
                  placeholder="e.g., Finalize Dress Alterations & Groomsmen Suits"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="newMilestoneDate">
                  Target Deadline Date
                </label>
                <input
                  id="newMilestoneDate"
                  type="date"
                  className="form-input"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="newMilestoneTasks">
                  Actionable Checkbox Tasks (One per line)
                </label>
                <textarea
                  id="newMilestoneTasks"
                  rows={3}
                  className="form-textarea"
                  placeholder="Second fitting session&#10;Pick up shoes & accessories&#10;Steam garments"
                  value={newTasksText}
                  onChange={(e) => setNewTasksText(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddMilestone(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
