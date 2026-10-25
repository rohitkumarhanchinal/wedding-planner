import React, { useState } from 'react';
import {
  HeartHandshake,
  Cake,
  Users2,
  Calendar,
  MapPin,
  Users,
  Coins,
  Palette,
  Target,
  Sparkles,
  ArrowRight,
  Info,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import type { EventFormData, EventType, CurrencyCode, ValidationErrors, EventPlan } from '../types/event';
import { validateEventForm } from '../services/validation';
import { CURRENCIES } from '../services/currency';
import { SAMPLE_WEDDING, SAMPLE_BIRTHDAY, SAMPLE_COMMUNITY } from '../data/sampleEvents';

interface EventCreationFormProps {
  initialData?: EventFormData | null;
  isLoading: boolean;
  onSubmit: (data: EventFormData) => void;
  onLoadSample: (sample: EventPlan) => void;
}

export const EventCreationForm: React.FC<EventCreationFormProps> = ({
  initialData,
  isLoading,
  onSubmit,
  onLoadSample,
}) => {
  const [formData, setFormData] = useState<EventFormData>({
    eventType: initialData?.eventType || 'wedding',
    name: initialData?.name || '',
    date: initialData?.date || '',
    location: initialData?.location || '',
    guestCount: initialData?.guestCount ?? 100,
    currency: initialData?.currency || 'USD',
    totalBudget: initialData?.totalBudget ?? 25000,
    themeStyle: initialData?.themeStyle || '',
    priorities: initialData?.priorities || '',
    dietaryAccessibility: initialData?.dietaryAccessibility || '',
    additionalNotes: initialData?.additionalNotes || '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = (field: keyof EventFormData, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (touched[field]) {
      const validation = validateEventForm({ ...formData, [field]: value });
      setErrors((prev) => ({
        ...prev,
        [field]: validation.errors[field as keyof ValidationErrors],
      }));
    }
  };

  const handleBlur = (field: keyof EventFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const validation = validateEventForm(formData);
    setErrors(validation.errors);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateEventForm(formData);
    setErrors(validation.errors);
    setTouched({
      eventType: true,
      name: true,
      date: true,
      location: true,
      guestCount: true,
      currency: true,
      totalBudget: true,
    });

    if (validation.isValid) {
      onSubmit(formData);
    }
  };

  const eventTypes: { type: EventType; title: string; subtitle: string; icon: React.ReactNode }[] = [
    {
      type: 'wedding',
      title: 'Wedding',
      subtitle: 'Ceremony, reception, vows & dinner',
      icon: <HeartHandshake className="event-type-icon" size={24} />,
    },
    {
      type: 'birthday',
      title: 'Birthday',
      subtitle: 'Milestone celebrations, parties & cake',
      icon: <Cake className="event-type-icon" size={24} />,
    },
    {
      type: 'community',
      title: 'Community Event',
      subtitle: 'Block parties, festivals & fundraisers',
      icon: <Users2 className="event-type-icon" size={24} />,
    },
  ];

  return (
    <div className="creation-flow-container">
      {/* Hero Intro */}
      <div className="flow-hero">
        <div className="hero-pill">
          <Sparkles size={14} className="text-gold" />
          <span>Intelligent Celebration Architecture</span>
        </div>
        <h1 className="flow-title">Bring Your Celebration to Life</h1>
        <p className="flow-description">
          Tell us about your celebration. We will generate a balanced budget, date-aware timeline,
          custom vendor checklist, and personalized creative ideas.
        </p>

        {/* Quick Sample Presets */}
        <div className="sample-quickload-bar">
          <span className="sample-quickload-label">Quick sample exploration:</span>
          <div className="sample-buttons">
            <button
              type="button"
              className="btn btn-outline btn-xs"
              onClick={() => onLoadSample(SAMPLE_WEDDING)}
            >
              💍 Tuscan Wedding ($34k)
            </button>
            <button
              type="button"
              className="btn btn-outline btn-xs"
              onClick={() => onLoadSample(SAMPLE_BIRTHDAY)}
            >
              🎉 Neon 30th Birthday (£4.2k)
            </button>
            <button
              type="button"
              className="btn btn-outline btn-xs"
              onClick={() => onLoadSample(SAMPLE_COMMUNITY)}
            >
              🌳 Block Festival (€7.8k)
            </button>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="form-card" noValidate>
        {/* Step 1: Event Type */}
        <div className="form-section">
          <label className="section-label" id="eventTypeGroupLabel">
            <span className="step-badge">1</span>
            <span>Choose Your Event Type</span>
          </label>
          <div
            className="event-type-grid"
            role="radiogroup"
            aria-labelledby="eventTypeGroupLabel"
          >
            {eventTypes.map((et) => {
              const isSelected = formData.eventType === et.type;
              return (
                <div
                  key={et.type}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  className={`event-type-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleChange('eventType', et.type)}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      handleChange('eventType', et.type);
                    }
                  }}
                >
                  <div className="type-card-header">
                    <span className="type-icon-box">{et.icon}</span>
                    {isSelected && <CheckCircle2 size={18} className="text-gold selected-check" />}
                  </div>
                  <h3 className="type-title">{et.title}</h3>
                  <p className="type-subtitle">{et.subtitle}</p>
                </div>
              );
            })}
          </div>
          {errors.eventType && <span className="field-error">{errors.eventType}</span>}
        </div>

        {/* Step 2: Core Logistics */}
        <div className="form-section">
          <label className="section-label">
            <span className="step-badge">2</span>
            <span>Key Event Details</span>
          </label>

          <div className="form-grid-2">
            {/* Event Name */}
            <div className="form-group span-2">
              <label htmlFor="eventName" className="form-label">
                Event Name <span className="required-star">*</span>
              </label>
              <input
                id="eventName"
                type="text"
                className={`form-input ${errors.name && touched.name ? 'input-error' : ''}`}
                placeholder="e.g., Maya & Julian’s Botanical Wedding"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                required
              />
              {errors.name && touched.name && <span className="field-error">{errors.name}</span>}
            </div>

            {/* Date */}
            <div className="form-group">
              <label htmlFor="eventDate" className="form-label">
                <Calendar size={15} />
                <span>Event Date</span> <span className="required-star">*</span>
              </label>
              <input
                id="eventDate"
                type="date"
                className={`form-input ${errors.date && touched.date ? 'input-error' : ''}`}
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                onBlur={() => handleBlur('date')}
                required
              />
              {errors.date && touched.date ? (
                <span className="field-error">{errors.date}</span>
              ) : (
                <span className="field-hint">Used to calculate your milestone planning deadlines</span>
              )}
            </div>

            {/* Location */}
            <div className="form-group">
              <label htmlFor="eventLocation" className="form-label">
                <MapPin size={15} />
                <span>Location / City</span> <span className="required-star">*</span>
              </label>
              <input
                id="eventLocation"
                type="text"
                className={`form-input ${errors.location && touched.location ? 'input-error' : ''}`}
                placeholder="e.g., Napa Valley, CA or City Park"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                onBlur={() => handleBlur('location')}
                required
              />
              {errors.location && touched.location && (
                <span className="field-error">{errors.location}</span>
              )}
            </div>

            {/* Guest Count */}
            <div className="form-group">
              <label htmlFor="guestCount" className="form-label">
                <Users size={15} />
                <span>Estimated Guests</span> <span className="required-star">*</span>
              </label>
              <input
                id="guestCount"
                type="number"
                min="1"
                step="1"
                className={`form-input ${errors.guestCount && touched.guestCount ? 'input-error' : ''}`}
                value={formData.guestCount}
                onChange={(e) => handleChange('guestCount', parseInt(e.target.value, 10) || '')}
                onBlur={() => handleBlur('guestCount')}
                required
              />
              {errors.guestCount && touched.guestCount ? (
                <span className="field-error">{errors.guestCount}</span>
              ) : (
                <span className="field-hint">Used for catering and space capacity recommendations</span>
              )}
            </div>

            {/* Budget & Currency */}
            <div className="form-group">
              <label htmlFor="totalBudget" className="form-label">
                <Coins size={15} />
                <span>Total Target Budget</span> <span className="required-star">*</span>
              </label>
              <div className="budget-input-wrapper">
                <select
                  id="eventCurrency"
                  className="currency-select"
                  value={formData.currency}
                  onChange={(e) => handleChange('currency', e.target.value as CurrencyCode)}
                  aria-label="Select currency"
                >
                  {Object.values(CURRENCIES).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol})
                    </option>
                  ))}
                </select>
                <input
                  id="totalBudget"
                  type="number"
                  min="1"
                  step="any"
                  className={`form-input budget-amount-input ${
                    errors.totalBudget && touched.totalBudget ? 'input-error' : ''
                  }`}
                  value={formData.totalBudget}
                  onChange={(e) => handleChange('totalBudget', parseFloat(e.target.value) || '')}
                  onBlur={() => handleBlur('totalBudget')}
                  required
                />
              </div>
              {errors.totalBudget && touched.totalBudget && (
                <span className="field-error">{errors.totalBudget}</span>
              )}
            </div>
          </div>
        </div>

        {/* Step 3: Optional Personalization */}
        <div className="form-section">
          <label className="section-label">
            <span className="step-badge">3</span>
            <span>Personal Preferences & Vision</span>
            <span className="optional-tag">Optional</span>
          </label>

          <div className="form-grid-2">
            {/* Theme & Style */}
            <div className="form-group">
              <label htmlFor="themeStyle" className="form-label">
                <Palette size={15} />
                <span>Theme & Visual Style</span>
              </label>
              <input
                id="themeStyle"
                type="text"
                className="form-input"
                placeholder="e.g., Rustic Tuscan, Retro Neon, Black-Tie Elegance"
                value={formData.themeStyle}
                onChange={(e) => handleChange('themeStyle', e.target.value)}
              />
              <span className="field-hint">Colors, mood, motifs or dress code</span>
            </div>

            {/* Top Priorities */}
            <div className="form-group">
              <label htmlFor="priorities" className="form-label">
                <Target size={15} />
                <span>Must-Have Priorities</span>
              </label>
              <input
                id="priorities"
                type="text"
                className="form-input"
                placeholder="e.g., Amazing live music, memorable wine pairings"
                value={formData.priorities}
                onChange={(e) => handleChange('priorities', e.target.value)}
              />
              <span className="field-hint">Where you want the biggest impact</span>
            </div>

            {/* Dietary & Accessibility Needs */}
            <div className="form-group span-2">
              <label htmlFor="dietaryAccessibility" className="form-label">
                <Info size={15} />
                <span>Dietary & Accessibility Considerations</span>
              </label>
              <input
                id="dietaryAccessibility"
                type="text"
                className="form-input"
                placeholder="e.g., 5 gluten-free guests, wheelchair ramp needed, quiet sensory corner"
                value={formData.dietaryAccessibility}
                onChange={(e) => handleChange('dietaryAccessibility', e.target.value)}
              />
              <span className="field-hint">Allergies, mobility access, or sensory accommodations</span>
            </div>

            {/* Additional Notes */}
            <div className="form-group span-2">
              <label htmlFor="additionalNotes" className="form-label">
                <span>Additional Notes & Context</span>
              </label>
              <textarea
                id="additionalNotes"
                rows={3}
                className="form-textarea"
                placeholder="Any special family traditions, curfew rules, or specific vendors you've already shortlisted..."
                value={formData.additionalNotes}
                onChange={(e) => handleChange('additionalNotes', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary btn-lg submit-plan-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="spinner" />
                <span>Synthesizing Plan...</span>
              </>
            ) : (
              <>
                <span>Generate Complete Event Plan</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
