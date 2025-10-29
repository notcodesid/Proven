import React from 'react';
import { COLORS, Z_INDEX, ANIMATION, CHALLENGE_CATEGORIES } from '../../constants/dashboard';
import { SortOption, CategoryValue } from '../../types/dashboard';

interface FilterPanelProps {
  isOpen: boolean;
  category: CategoryValue;
  sortBy: SortOption;
  onCategoryChange: (value: CategoryValue) => void;
  onSortChange: (value: SortOption) => void;
  onClose: () => void;
}

/**
 * Slide-in filter panel component
 */
export const FilterPanel: React.FC<FilterPanelProps> = ({
  isOpen,
  category,
  sortBy,
  onCategoryChange,
  onSortChange,
  onClose,
}) => {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="absolute inset-0 bg-black/40"
          style={{ zIndex: Z_INDEX.overlay }}
          aria-hidden="true"
        />
      )}

      {/* Slide-in panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Filter challenges"
        aria-hidden={!isOpen}
        className={`absolute top-0 bottom-0 right-0 w-72 bg-[${COLORS.background.primary}] border-l border-[${COLORS.border.default}] transform transition-transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          zIndex: Z_INDEX.filterPanel,
          transitionDuration: `${ANIMATION.filterPanel}ms`,
        }}
      >
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Filters</h3>
            <button
              onClick={onClose}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  onClose();
                }
              }}
              className="text-sm text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF5757] rounded px-2 py-1"
              aria-label="Close filters"
            >
              Close
            </button>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label htmlFor="category-filter" className="text-xs text-gray-400">
              Category
            </label>
            <select
              id="category-filter"
              value={category}
              onChange={(e) => onCategoryChange(e.target.value as CategoryValue)}
              className={`w-full px-3 py-2 rounded bg-[${COLORS.background.input}] border border-[${COLORS.border.default}] text-sm focus:outline-none focus:ring-2 focus:ring-[${COLORS.accent.primary}]`}
            >
              {CHALLENGE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Filter */}
          <div className="space-y-2">
            <label htmlFor="sort-filter" className="text-xs text-gray-400">
              Sort by
            </label>
            <select
              id="sort-filter"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className={`w-full px-3 py-2 rounded bg-[${COLORS.background.input}] border border-[${COLORS.border.default}] text-sm focus:outline-none focus:ring-2 focus:ring-[${COLORS.accent.primary}]`}
            >
              <option value="recent">Recent</option>
              <option value="popular">Most Participants</option>
              <option value="stake">Highest Stake</option>
              <option value="duration">Longest Duration</option>
            </select>
          </div>

          {/* Apply Button */}
          <button
            onClick={onClose}
            className={`w-full px-3 py-2 bg-[${COLORS.accent.primary}] rounded hover:opacity-90 transition-opacity`}
          >
            Apply
          </button>
        </div>
      </aside>
    </>
  );
};
