import React, { useState } from 'react';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';
import {
  Coins,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  Trash2,
  Edit2,
  Check,
  X,
  Lightbulb,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import type { BudgetCategory, CurrencyCode } from '../types/event';
import { formatCurrency } from '../services/currency';

interface BudgetPlannerProps {
  categories: BudgetCategory[];
  totalBudget: number;
  currency: CurrencyCode;
  guestCount: number;
  onUpdateCategories: (categories: BudgetCategory[]) => void;
}

export const BudgetPlanner: React.FC<BudgetPlannerProps> = ({
  categories,
  totalBudget,
  currency,
  guestCount,
  onUpdateCategories,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const dialogRef = useDialogAccessibility<HTMLDivElement>(showAddModal, () => setShowAddModal(false));
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatAmount, setNewCatAmount] = useState<number>(0);
  const [newCatDesc, setNewCatDesc] = useState<string>('');
  const [expandedTips, setExpandedTips] = useState<Record<string, boolean>>({});

  // Calculate sum of category allocations
  const allocatedSum = categories.reduce((sum, c) => sum + (c.allocatedAmount || 0), 0);
  const roundedAllocatedSum = Math.round(allocatedSum * 100) / 100;
  const difference = Math.round((totalBudget - roundedAllocatedSum) * 100) / 100;
  const isExactMatch = Math.abs(difference) < 0.01;

  // Cost per guest
  const costPerGuest = guestCount > 0 ? totalBudget / guestCount : 0;

  const toggleTips = (id: string) => {
    setExpandedTips((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStartEdit = (category: BudgetCategory) => {
    setEditingId(category.id);
    setEditAmount(category.allocatedAmount);
  };

  const handleSaveEdit = (categoryId: string) => {
    const updated = categories.map((cat) => {
      if (cat.id === categoryId) {
        const newAlloc = Math.max(0, Math.round(editAmount * 100) / 100);
        const newPercent = totalBudget > 0 ? Math.round((newAlloc / totalBudget) * 1000) / 10 : 0;
        return {
          ...cat,
          allocatedAmount: newAlloc,
          percentage: newPercent,
        };
      }
      return cat;
    });

    onUpdateCategories(updated);
    setEditingId(null);
  };

  const handleDeleteCategory = (categoryId: string) => {
    const filtered = categories.filter((c) => c.id !== categoryId);
    onUpdateCategories(filtered);
  };

  const handleAutoRebalance = () => {
    if (categories.length === 0 || difference === 0) return;

    // Distribute remaining difference onto Contingency or first category
    const contingencyIdx = categories.findIndex((c) =>
      c.name.toLowerCase().includes('contingency') || c.name.toLowerCase().includes('buffer')
    );
    const targetIdx = contingencyIdx >= 0 ? contingencyIdx : 0;

    const updated = [...categories];
    const targetCat = updated[targetIdx];
    const newAlloc = Math.max(0, Math.round((targetCat.allocatedAmount + difference) * 100) / 100);

    updated[targetIdx] = {
      ...targetCat,
      allocatedAmount: newAlloc,
    };

    // Recalculate percentages
    if (totalBudget > 0) {
      updated.forEach((c) => {
        c.percentage = Math.round((c.allocatedAmount / totalBudget) * 1000) / 10;
      });
    }

    onUpdateCategories(updated);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const amount = Math.max(0, Math.round(newCatAmount * 100) / 100);
    const percentage = totalBudget > 0 ? Math.round((amount / totalBudget) * 1000) / 10 : 0;

    const newCategory: BudgetCategory = {
      id: `custom-cat-${Date.now()}`,
      name: newCatName.trim(),
      percentage,
      allocatedAmount: amount,
      actualSpent: 0,
      description: newCatDesc.trim() || 'Custom budget category.',
      tips: ['Track receipts and invoices as contracts are signed.'],
      isCustom: true,
    };

    onUpdateCategories([...categories, newCategory]);
    setShowAddModal(false);
    setNewCatName('');
    setNewCatAmount(0);
    setNewCatDesc('');
  };

  // Color palette for visual breakdown
  const barColors = [
    '#D4A373', // warm gold
    '#CCD5AE', // sage green
    '#E76F51', // coral rose
    '#2A9D8F', // teal
    '#E9C46A', // champagne
    '#9B5DE5', // lavender
    '#F15BB5', // warm pink
    '#83C5BE', // soft aqua
  ];

  return (
    <div className="planner-section-card">
      {/* Section Header */}
      <div className="section-card-header">
        <div>
          <h2 className="section-card-title">
            <Coins size={22} className="text-gold" />
            <span>Budget Allocation Breakdown</span>
          </h2>
          <p className="section-card-desc">
            Mathematically balanced budget across high-priority categories. Every dollar is accounted for.
          </p>
        </div>
        <div className="section-header-actions no-print">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowAddModal(true)}
          >
            <PlusCircle size={15} />
            <span>Add Custom Category</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="budget-kpi-row">
        <div className="budget-kpi-card">
          <span className="kpi-label">Total Event Budget</span>
          <span className="kpi-value">{formatCurrency(totalBudget, currency)}</span>
        </div>
        <div className="budget-kpi-card">
          <span className="kpi-label">Allocated Across Categories</span>
          <span className="kpi-value">{formatCurrency(roundedAllocatedSum, currency)}</span>
        </div>
        <div className="budget-kpi-card">
          <span className="kpi-label">Per-Guest Estimate</span>
          <span className="kpi-value">
            {formatCurrency(costPerGuest, currency)}
            <small className="kpi-sub">/ guest</small>
          </span>
        </div>
      </div>

      {/* Mathematical Exactness Banner */}
      <div
        className={`exact-balance-banner ${isExactMatch ? 'banner-balanced' : 'banner-unbalanced'}`}
        role="status"
      >
        {isExactMatch ? (
          <div className="banner-content">
            <CheckCircle2 size={18} className="text-emerald" />
            <span>
              <strong>Exact Budget Balance Verified:</strong> Category allocations sum to exactly{' '}
              {formatCurrency(totalBudget, currency)} (100.0% of target budget).
            </span>
          </div>
        ) : (
          <div className="banner-content-split">
            <div className="banner-text-group">
              <AlertTriangle size={18} className="text-amber" />
              <span>
                <strong>Budget Variance:</strong> Current allocations differ from your total budget by{' '}
                {formatCurrency(Math.abs(difference), currency)}{' '}
                {difference > 0 ? '(Unallocated)' : '(Over-allocated)'}.
              </span>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-xs auto-rebalance-btn no-print"
              onClick={handleAutoRebalance}
            >
              <RotateCcw size={13} />
              <span>Auto-Rebalance Difference</span>
            </button>
          </div>
        )}
      </div>

      {/* Visual Multi-Bar Stack */}
      <div className="stacked-budget-bar" title="Visual proportion of categories">
        {categories.map((cat, idx) => {
          const pct = totalBudget > 0 ? (cat.allocatedAmount / totalBudget) * 100 : 0;
          if (pct <= 0) return null;
          return (
            <div
              key={cat.id}
              className="stacked-bar-segment"
              style={{
                width: `${pct}%`,
                backgroundColor: barColors[idx % barColors.length],
              }}
              title={`${cat.name}: ${formatCurrency(cat.allocatedAmount, currency)} (${cat.percentage}%)`}
            />
          );
        })}
      </div>

      {/* Category List */}
      <div className="budget-categories-list">
        {categories.map((cat, idx) => {
          const isEditing = editingId === cat.id;
          const hasTips = cat.tips && cat.tips.length > 0;
          const isExpanded = expandedTips[cat.id];
          const color = barColors[idx % barColors.length];

          return (
            <div key={cat.id} className="budget-category-row">
              <div className="cat-color-indicator" style={{ backgroundColor: color }} />

              <div className="cat-main-content">
                <div className="cat-header-line">
                  <div className="cat-name-group">
                    <span className="cat-name">{cat.name}</span>
                    {cat.isCustom && <span className="custom-tag">Custom</span>}
                  </div>

                  <div className="cat-amount-group">
                    {isEditing ? (
                      <div className="cat-edit-inline">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          className="form-input form-input-sm cat-edit-input"
                          value={editAmount}
                          onChange={(e) => setEditAmount(parseFloat(e.target.value) || 0)}
                          autoFocus
                        />
                        <button
                          type="button"
                          className="btn btn-primary btn-xs"
                          onClick={() => handleSaveEdit(cat.id)}
                          title="Save amount"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-xs"
                          onClick={() => setEditingId(null)}
                          title="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="cat-amount">
                          {formatCurrency(cat.allocatedAmount, currency)}
                        </span>
                        <span className="cat-percentage">({cat.percentage}%)</span>
                        <div className="cat-row-actions no-print">
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs btn-icon-only"
                            onClick={() => handleStartEdit(cat)}
                            title="Edit allocated amount"
                            aria-label={`Edit ${cat.name} amount`}
                          >
                            <Edit2 size={13} />
                          </button>
                          {cat.isCustom && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs btn-icon-only text-danger"
                              onClick={() => handleDeleteCategory(cat.id)}
                              title="Delete category"
                              aria-label={`Delete ${cat.name}`}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <p className="cat-description">{cat.description}</p>

                {/* Tips Accordion */}
                {hasTips && (
                  <div className="cat-tips-section">
                    <button
                      type="button"
                      className="cat-tips-toggle"
                      onClick={() => toggleTips(cat.id)}
                      aria-expanded={isExpanded}
                    >
                      <Lightbulb size={13} className="text-gold" />
                      <span>{isExpanded ? 'Hide vendor & cost tips' : 'View vendor & cost tips'}</span>
                      <ChevronDown size={13} className={isExpanded ? 'rotate-180' : ''} />
                    </button>
                    {isExpanded && (
                      <ul className="cat-tips-list">
                        {cat.tips.map((tip, tipIdx) => (
                          <li key={tipIdx}>{tip}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Category Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-dialog" ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="custom-budget-dialog-title" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" id="custom-budget-dialog-title">Add Custom Budget Category</h3>
              <button
                type="button"
                className="btn btn-ghost btn-xs btn-icon-only"
                onClick={() => setShowAddModal(false)}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddCategory} className="modal-body">
              <div className="form-group">
                <label className="form-label" htmlFor="newCatName">
                  Category Name <span className="required-star">*</span>
                </label>
                <input
                  id="newCatName"
                  type="text"
                  className="form-input"
                  placeholder="e.g., Honeymoon Suite or Fireworks"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="newCatAmount">
                  Target Allocation ({currency}) <span className="required-star">*</span>
                </label>
                <input
                  id="newCatAmount"
                  type="number"
                  step="any"
                  min="0"
                  className="form-input"
                  placeholder="e.g., 850"
                  value={newCatAmount}
                  onChange={(e) => setNewCatAmount(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="newCatDesc">
                  Description / Purpose
                </label>
                <textarea
                  id="newCatDesc"
                  rows={2}
                  className="form-textarea"
                  placeholder="Notes on what this category includes..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
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
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
