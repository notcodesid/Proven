import React from 'react';
import { COLORS, Z_INDEX } from '../../constants/dashboard';

interface AdminFloatingButtonProps {
  onClick: () => void;
}

/**
 * Floating action button for creating challenges (admin only)
 */
export const AdminFloatingButton: React.FC<AdminFloatingButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`absolute bottom-24 right-6 w-16 h-16 bg-[${COLORS.accent.primary}] text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center justify-center active:scale-95`}
      style={{ zIndex: Z_INDEX.floatingButton }}
      aria-label="Create new challenge"
    >
      <svg
        className="w-7 h-7"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2.5}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    </button>
  );
};
