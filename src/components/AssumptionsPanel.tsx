import React from 'react';
import { HelpCircle, ArrowRightCircle, ShieldAlert } from 'lucide-react';
import type { PlanAssumptions } from '../types/event';

interface AssumptionsPanelProps {
  assumptions: PlanAssumptions;
}

export const AssumptionsPanel: React.FC<AssumptionsPanelProps> = ({ assumptions }) => {
  return (
    <div className="planner-section-card">
      <div className="section-card-header">
        <div>
          <h2 className="section-card-title">
            <HelpCircle size={22} className="text-gold" />
            <span>Assumptions & Next Recommended Steps</span>
          </h2>
          <p className="section-card-desc">
            Transparent assumptions made by the planning engine based on provided inputs, plus immediate priorities.
          </p>
        </div>
      </div>

      <div className="assumptions-split-grid">
        {/* Left Column: Planning Assumptions */}
        <div className="assumptions-card">
          <div className="assumptions-card-header">
            <ShieldAlert size={18} className="text-amber" />
            <h3 className="assumptions-card-title">Model Assumptions</h3>
          </div>
          <p className="assumptions-card-sub">
            The calculations in your budget and timeline are grounded in these working assumptions:
          </p>
          <ul className="assumptions-list">
            {assumptions.assumptions.map((item, idx) => (
              <li key={idx} className="assumption-item">
                <span className="assumption-bullet">•</span>
                <span className="assumption-text">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Column: Immediate Actionable Next Steps */}
        <div className="assumptions-card next-steps-card">
          <div className="assumptions-card-header">
            <ArrowRightCircle size={18} className="text-emerald" />
            <h3 className="assumptions-card-title">Immediate Action Items</h3>
          </div>
          <p className="assumptions-card-sub">
            Prioritized milestones to lock in first to protect your date, budget, and peace of mind:
          </p>
          <ul className="next-steps-list">
            {assumptions.nextSteps.map((step, idx) => (
              <li key={idx} className="next-step-item">
                <div className="step-num-badge">{idx + 1}</div>
                <span className="next-step-text">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
