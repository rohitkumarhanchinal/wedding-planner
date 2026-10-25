import React, { useState } from 'react';
import { Settings, X, ShieldCheck, Key, Cpu, Lock } from 'lucide-react';
import type { AISettings } from '../types/event';
import { DEFAULT_GEMINI_MODEL, SUPPORTED_GEMINI_MODELS } from '../services/aiAdapter';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AISettings;
  onClose: () => void;
  onSaveSettings: (settings: AISettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSaveSettings,
}) => {
  const [useCustomKey, setUseCustomKey] = useState<boolean>(settings.useCustomKey);
  const [apiKey, setApiKey] = useState<string>(settings.apiKey);
  const [model, setModel] = useState<string>(settings.model || DEFAULT_GEMINI_MODEL);
  const dialogRef = useDialogAccessibility<HTMLDivElement>(isOpen, onClose);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      useCustomKey,
      apiKey: apiKey.trim(),
      model,
    });
    onClose();
  };

  const handleResetToOffline = () => {
    setUseCustomKey(false);
    setApiKey('');
    onSaveSettings({
      useCustomKey: false,
      apiKey: '',
      model: DEFAULT_GEMINI_MODEL,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="settings-dialog-title" ref={dialogRef} tabIndex={-1}>
        <div className="modal-header">
          <div className="modal-title-group">
            <Settings size={20} className="text-gold" />
            <h3 className="modal-title" id="settings-dialog-title">Planning Engine & Privacy Settings</h3>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-icon-only"
            onClick={onClose}
            aria-label="Close settings"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave} className="modal-body">
          {/* Default Engine Info Banner */}
          <div className="settings-engine-card">
            <div className="engine-card-top">
              <ShieldCheck size={22} className="text-emerald" />
              <div>
                <h4 className="engine-name">Built-In Deterministic Planning Engine (Default)</h4>
                <p className="engine-desc">
                  Generates mathematically exact budgets, date-aware timelines, tailored vendor checklists,
                  and curated creative ideas directly on your device.
                </p>
              </div>
            </div>
            <div className="engine-features-list">
              <span className="feature-chip">✓ 100% Offline Capable</span>
              <span className="feature-chip">✓ Zero Network Requests</span>
              <span className="feature-chip">✓ Exact Budget Sums</span>
              <span className="feature-chip">✓ Maximum Privacy</span>
            </div>
          </div>

          {/* Optional Gemini API Integration */}
          <div className="settings-toggle-section">
            <label className="toggle-label-row">
              <input
                type="checkbox"
                className="toggle-checkbox"
                checked={useCustomKey}
                onChange={(e) => setUseCustomKey(e.target.checked)}
              />
              <div className="toggle-text-block">
                <span className="toggle-heading">Enable Optional Gemini Model Integration</span>
                <span className="toggle-hint">
                  Allows dynamic AI idea synthesis using your own personal Gemini API key.
                </span>
              </div>
            </label>
          </div>

          {useCustomKey && (
            <div className="custom-key-inputs">
              <div className="form-group">
                <label className="form-label" htmlFor="apiKeyInput">
                  <Key size={14} className="text-gold" />
                  <span>Your Gemini API Key</span>
                </label>
                <input
                  id="apiKeyInput"
                  type="password"
                  className="form-input"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  autoComplete="off"
                />
                <div className="security-notice">
                  <Lock size={12} className="text-muted" aria-hidden="true" />
                  <span>
                    Your API key is kept in memory for this session and is not saved with your settings. When you generate a plan with Gemini, your key and relevant event details are sent to Google for processing. Browser storage does not make an API key secure.
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="modelSelect">
                  <Cpu size={14} className="text-muted" />
                  <span>Model Selection</span>
                </label>
                <select
                  id="modelSelect"
                  className="form-select"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                >
                  {SUPPORTED_GEMINI_MODELS.map((supportedModel) => (
                    <option key={supportedModel} value={supportedModel}>
                      {supportedModel === DEFAULT_GEMINI_MODEL ? 'Gemini 3.8 Flash (Recommended)' : 'Gemini 3.1 Pro (Preview)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleResetToOffline}
            >
              Reset to Pure Offline Mode
            </button>
            <button type="submit" className="btn btn-primary">
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
