
import React, { useState } from 'react';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';
import {
  ClipboardCheck,
  PlusCircle,
  Edit2,
  Trash2,
  X,
  Search,
  Coins,
  Calendar,
} from 'lucide-react';
import type { VendorTask, VendorStatus, PriorityLevel, CurrencyCode } from '../types/event';
import { formatCurrency } from '../services/currency';

interface VendorChecklistViewProps {
  checklist: VendorTask[];
  currency: CurrencyCode;
  onUpdateChecklist: (tasks: VendorTask[]) => void;
}

export const VendorChecklistView: React.FC<VendorChecklistViewProps> = ({
  checklist,
  currency,
  onUpdateChecklist,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const dialogRef = useDialogAccessibility<HTMLDivElement>(showAddModal, () => setShowAddModal(false));

  // New vendor form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newCost, setNewCost] = useState<number>(0);
  const [newDate, setNewDate] = useState('');
  const [newPriority, setNewPriority] = useState<PriorityLevel>('medium');
  const [newNotes, setNewNotes] = useState('');

  const handleStatusChange = (taskId: string, newStatus: VendorStatus) => {
    const updated = checklist.map((item) => {
      if (item.id === taskId) {
        return { ...item, status: newStatus };
      }
      return item;
    });
    onUpdateChecklist(updated);
  };

  const handleStartEditNotes = (task: VendorTask) => {
    setEditingNotesId(task.id);
    setNotesValue(task.notes || '');
  };

  const handleSaveNotes = (taskId: string) => {
    const updated = checklist.map((item) => {
      if (item.id === taskId) {
        return { ...item, notes: notesValue.trim() };
      }
      return item;
    });
    onUpdateChecklist(updated);
    setEditingNotesId(null);
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = checklist.filter((item) => item.id !== taskId);
    onUpdateChecklist(updated);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: VendorTask = {
      id: `custom-vendor-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory.trim() || 'General Vendor',
      estimatedCost: Math.max(0, Math.round(newCost)),
      dueDate: newDate || new Date().toISOString().split('T')[0],
      status: 'pending',
      priority: newPriority,
      notes: newNotes.trim(),
      isCustom: true,
    };

    onUpdateChecklist([...checklist, newTask]);
    setShowAddModal(false);
    setNewTitle('');
    setNewCategory('');
    setNewCost(0);
    setNewDate('');
    setNewNotes('');
  };

  // Filter tasks
  const filteredTasks = checklist.filter((task) => {
    const matchesFilter = filterStatus === 'all' || task.status === filterStatus;
    const matchesSearch =
      !searchQuery.trim() ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.notes && task.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const bookedCount = checklist.filter((t) => t.status === 'booked' || t.status === 'completed').length;
  const totalVendors = checklist.length;

  return (
    <div className="planner-section-card">
      <div className="section-card-header">
        <div>
          <h2 className="section-card-title">
            <ClipboardCheck size={22} className="text-gold" />
            <span>Tailored Vendor Checklist</span>
          </h2>
          <p className="section-card-desc">
            Coordinate quotes, inquiries, and contracts with all essential vendor partners.
          </p>
        </div>
        <div className="section-header-actions no-print">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowAddModal(true)}
          >
            <PlusCircle size={15} />
            <span>Add Custom Vendor</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="vendor-filter-bar no-print">
        <div className="search-input-wrapper">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search vendors, categories, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="btn btn-ghost btn-xs btn-icon-only search-clear"
              onClick={() => setSearchQuery('')}
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="status-pills-row" role="tablist" aria-label="Vendor status filters">
          {[
            { id: 'all', label: `All (${totalVendors})` },
            { id: 'pending', label: 'Pending' },
            { id: 'contacted', label: 'Contacted' },
            { id: 'booked', label: `Booked (${bookedCount})` },
            { id: 'completed', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`filter-pill ${filterStatus === tab.id ? 'active' : ''}`}
              onClick={() => setFilterStatus(tab.id)}
              role="tab"
              aria-selected={filterStatus === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vendor Cards List */}
      <div className="vendor-grid">
        {filteredTasks.length === 0 ? (
          <div className="empty-state-card">
            <ClipboardCheck size={32} className="empty-icon text-muted" />
            <p className="empty-title">No vendors match your search or filter</p>
            <p className="empty-desc">Try clearing the search query or status filter above.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isEditingNotes = editingNotesId === task.id;

            return (
              <div
                key={task.id}
                className={`vendor-item-card status-${task.status} priority-${task.priority}`}
              >
                <div className="vendor-card-top">
                  <div className="vendor-badge-group">
                    <span className="vendor-category-tag">{task.category}</span>
                    <span className={`priority-tag priority-${task.priority}`}>
                      {task.priority.toUpperCase()} PRIORITY
                    </span>
                  </div>

                  <div className="vendor-status-selector no-print">
                    <select
                      className={`status-select select-${task.status}`}
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value as VendorStatus)}
                      aria-label={`Change status for ${task.title}`}
                    >
                      <option value="pending">⏳ Pending</option>
                      <option value="contacted">📞 Contacted</option>
                      <option value="booked">🔒 Booked / Deposit Paid</option>
                      <option value="completed">✅ Completed</option>
                      <option value="declined">❌ Declined</option>
                    </select>
                  </div>
                </div>

                <h3 className="vendor-title">{task.title}</h3>

                <div className="vendor-meta-row">
                  <div className="vendor-meta-item">
                    <Coins size={14} className="text-gold" />
                    <span>Est. Share: {formatCurrency(task.estimatedCost, currency)}</span>
                  </div>
                  <div className="vendor-meta-item">
                    <Calendar size={14} className="text-muted" />
                    <span>Target Due: {task.dueDate}</span>
                  </div>
                </div>

                {/* Notes Section */}
                <div className="vendor-notes-box">
                  {isEditingNotes ? (
                    <div className="notes-editor-inline">
                      <textarea
                        rows={2}
                        className="form-textarea notes-textarea"
                        value={notesValue}
                        onChange={(e) => setNotesValue(e.target.value)}
                        placeholder="Add vendor phone, email, contract terms, or quote notes..."
                        autoFocus
                      />
                      <div className="notes-editor-actions">
                        <button
                          type="button"
                          className="btn btn-primary btn-xs"
                          onClick={() => handleSaveNotes(task.id)}
                        >
                          Save Notes
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-xs"
                          onClick={() => setEditingNotesId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="notes-display">
                      <p className="notes-text">
                        {task.notes || <em className="text-muted">No contact notes added yet.</em>}
                      </p>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs btn-icon-only edit-notes-btn no-print"
                        onClick={() => handleStartEditNotes(task)}
                        title="Edit vendor notes"
                        aria-label={`Edit notes for ${task.title}`}
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer with Delete for Custom */}
                {task.isCustom && (
                  <div className="vendor-card-footer no-print">
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs text-danger"
                      onClick={() => handleDeleteTask(task.id)}
                      title="Delete vendor item"
                    >
                      <Trash2 size={13} />
                      <span>Remove Item</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Custom Vendor Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-dialog" ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="custom-vendor-dialog-title" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" id="custom-vendor-dialog-title">Add Custom Vendor Task</h3>
              <button
                type="button"
                className="btn btn-ghost btn-xs btn-icon-only"
                onClick={() => setShowAddModal(false)}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddTask} className="modal-body">
              <div className="form-group">
                <label className="form-label" htmlFor="newVendorTitle">
                  Vendor Name / Task <span className="required-star">*</span>
                </label>
                <input
                  id="newVendorTitle"
                  type="text"
                  className="form-input"
                  placeholder="e.g., Live Espresso Cart Service or Drone Videographer"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="newVendorCategory">
                    Category
                  </label>
                  <input
                    id="newVendorCategory"
                    type="text"
                    className="form-input"
                    placeholder="e.g., Beverage, Media, Décor"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="newVendorPriority">
                    Priority Level
                  </label>
                  <select
                    id="newVendorPriority"
                    className="form-select"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as PriorityLevel)}
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="newVendorCost">
                    Estimated Cost ({currency})
                  </label>
                  <input
                    id="newVendorCost"
                    type="number"
                    min="0"
                    step="any"
                    className="form-input"
                    placeholder="e.g., 650"
                    value={newCost}
                    onChange={(e) => setNewCost(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="newVendorDate">
                    Target Booking Date
                  </label>
                  <input
                    id="newVendorDate"
                    type="date"
                    className="form-input"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="newVendorNotes">
                  Vendor Notes & Inquiries
                </label>
                <textarea
                  id="newVendorNotes"
                  rows={2}
                  className="form-textarea"
                  placeholder="Contact details, quote options, cancellation policy..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Vendor Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
