import React from 'react';

interface FilterButtonProps {
  onClick?: () => void;
  isActive?: boolean;
}

export const FilterButton: React.FC<FilterButtonProps> = ({ 
  onClick, 
  isActive = false 
}) => {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-lg transition-colors ${
        isActive 
          ? 'bg-[#27272A] text-white' 
          : 'bg-[#27272A] text-gray-400 hover:bg-gray-700 hover:text-white'
      }`}
    >
      <svg 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5"
      >
        <path 
          d="M3 7h18M6 12h12m-7 5h2" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};

export default FilterButton; 