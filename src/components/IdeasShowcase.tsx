import React, { useState } from 'react';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';
import {
  Sparkles,
  Palette,
  Utensils,
  PartyPopper,
  Flame,
  Heart,
  Star,
  PlusCircle,
  Copy,
  X,
} from 'lucide-react';
import type { PersonalizedIdeas } from '../types/event';

interface IdeasShowcaseProps {
  ideas: PersonalizedIdeas;
  onUpdateIdeas: (ideas: PersonalizedIdeas) => void;
  onShowToast: (msg: string) => void;
}

export const IdeasShowcase: React.FC<IdeasShowcaseProps> = ({
  ideas,
  onUpdateIdeas,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<keyof PersonalizedIdeas>('themeAndAtmosphere');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const dialogRef = useDialogAccessibility<HTMLDivElement>(showAddModal, () => setShowAddModal(false));
  const [newIdeaText, setNewIdeaText] = useState<string>('');

  const toggleFavorite = (ideaKey: string) => {
    setFavorites((prev) => ({ ...prev, [ideaKey]: !prev[ideaKey] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    onShowToast('Idea copied to clipboard!');
  };

  const handleAddIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdeaText.trim()) return;

    const currentList = ideas[activeTab] || [];
    const updated = {
      ...ideas,
      [activeTab]: [...currentList, newIdeaText.trim()],
    };

    onUpdateIdeas(updated);
    setShowAddModal(false);
    setNewIdeaText('');
    onShowToast('Custom idea added to collection!');
  };

  const handleDeleteIdea = (tabKey: keyof PersonalizedIdeas, index: number) => {
    const currentList = [...ideas[tabKey]];
    currentList.splice(index, 1);
    onUpdateIdeas({
      ...ideas,
      [tabKey]: currentList,
    });
  };

  const categories: {
    key: keyof PersonalizedIdeas;
    label: string;
    icon: React.ReactNode;
    subtitle: string;
  }[] = [
    {
      key: 'themeAndAtmosphere',
      label: 'Theme & Atmosphere',
      icon: <Palette size={16} />,
      subtitle: 'Color schemes, ambient lighting & music moods',
    },
    {
      key: 'foodAndBeverage',
      label: 'Food & Beverage',
      icon: <Utensils size={16} />,
      subtitle: 'Signature drinks, menu concepts & late-night bites',
    },
    {
      key: 'activitiesAndMoments',
      label: 'Activities & Moments',
      icon: <PartyPopper size={16} />,
      subtitle: 'Interactive icebreakers, surprise reveals & rituals',
    },
    {
      key: 'decorAndDetails',
      label: 'Décor & Details',
      icon: <Flame size={16} />,
      subtitle: 'Centerpieces, photo backdrops & memorable accents',
    },
    {
      key: 'guestExperience',
      label: 'Guest Experience',
      icon: <Heart size={16} />,
      subtitle: 'Welcome hospitality, accessibility & keepsake favors',
    },
  ];

  const currentIdeaList = ideas[activeTab] || [];

  return (
    <div className="planner-section-card">
      <div className="section-card-header">
        <div>
          <h2 className="section-card-title">
            <Sparkles size={22} className="text-gold" />
            <span>Personalized Celebration Ideas</span>
          </h2>
          <p className="section-card-desc">
            Curated inspirations calibrated to your guest count, aesthetic style, and priorities.
          </p>
        </div>
        <div className="section-header-actions no-print">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowAddModal(true)}
          >
            <PlusCircle size={15} />
            <span>Add Custom Idea</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="ideas-tab-row" role="tablist" aria-label="Idea categories">
        {categories.map((cat) => {
          const isActive = activeTab === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              className={`idea-category-tab ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(cat.key)}
              role="tab"
              aria-selected={isActive}
            >
              <span className="tab-icon">{cat.icon}</span>
              <span className="tab-label">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Description */}
      <div className="tab-active-header">
        <h3 className="tab-active-title">
          {categories.find((c) => c.key === activeTab)?.label}
        </h3>
        <p className="tab-active-sub">
          {categories.find((c) => c.key === activeTab)?.subtitle}
        </p>
      </div>

      {/* Ideas Grid */}
      <div className="ideas-grid">
        {currentIdeaList.length === 0 ? (
          <div className="empty-state-card">
            <Sparkles size={28} className="empty-icon text-muted" />
            <p className="empty-title">No ideas listed in this category yet</p>
            <p className="empty-desc">Click "Add Custom Idea" above to add your own inspirations.</p>
          </div>
        ) : (
          currentIdeaList.map((ideaText, idx) => {
            const ideaKey = `${activeTab}-${idx}`;
            const isFav = favorites[ideaKey];

            return (
              <div key={idx} className={`idea-card ${isFav ? 'idea-card-fav' : ''}`}>
                <div className="idea-card-top">
                  <span className="idea-number">0{idx + 1}</span>
                  <div className="idea-actions no-print">
                    <button
                      type="button"
                      className={`btn btn-ghost btn-xs btn-icon-only ${isFav ? 'text-gold' : ''}`}
                      onClick={() => toggleFavorite(ideaKey)}
                      title={isFav ? 'Unstar idea' : 'Star idea as favorite'}
                      aria-label="Star idea"
                    >
                      <Star size={14} className={isFav ? 'fill-gold' : ''} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs btn-icon-only"
                      onClick={() => copyToClipboard(ideaText)}
                      title="Copy idea text"
                      aria-label="Copy idea"
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs btn-icon-only text-danger"
                      onClick={() => handleDeleteIdea(activeTab, idx)}
                      title="Remove idea"
                      aria-label="Remove idea"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>

                <p className="idea-body-text">{ideaText}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Add Custom Idea Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-dialog" ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="custom-idea-dialog-title" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" id="custom-idea-dialog-title">
                Add Idea to "{categories.find((c) => c.key === activeTab)?.label}"
              </h3>
              <button
                type="button"
                className="btn btn-ghost btn-xs btn-icon-only"
                onClick={() => setShowAddModal(false)}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddIdea} className="modal-body">
              <div className="form-group">
                <label className="form-label" htmlFor="newIdeaContent">
                  Your Creative Idea or Recommendation
                </label>
                <textarea
                  id="newIdeaContent"
                  rows={4}
                  className="form-textarea"
                  placeholder="Describe the moment, cocktail recipe, lighting setup, or guest experience concept..."
                  value={newIdeaText}
                  onChange={(e) => setNewIdeaText(e.target.value)}
                  required
                  autoFocus
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
                  Save Idea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
