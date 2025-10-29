import React from 'react';

interface DashboardEmptyStateProps {
  hasFilters: boolean;
  onReset?: () => void;
}

/**
 * Empty state component for dashboard when no challenges are found
 */
export const DashboardEmptyState: React.FC<DashboardEmptyStateProps> = ({
  hasFilters,
  onReset,
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="text-6xl mb-4" aria-hidden="true">
        🔍
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">
        {hasFilters ? 'No challenges found' : 'No challenges available'}
      </h3>
      <p className="text-gray-400 mb-6 max-w-md">
        {hasFilters
          ? 'Try adjusting your filters or search terms to find what you\'re looking for.'
          : 'There are no challenges available at the moment. Check back later!'}
      </p>
      {hasFilters && onReset && (
        <button
          onClick={onReset}
          className="px-6 py-2 bg-[#FF5757] text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
};
