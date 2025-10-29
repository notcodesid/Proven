import React from 'react';
import { SearchIcon } from './customicons';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  placeholder = "Search Challenges...", 
  value,
  onChange,
  onSearch
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange?.(newValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch?.(value || '');
    }
  };

  return (
    <div className="relative flex-1 max-w-md rounded-lg">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <SearchIcon />
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        className="w-full h-[48px] pl-10 pr-4 py-2 bg-[#27272A] rounded-lg text-[#A1A1AA] placeholder-gray-400 focus:outline-none"
      />
    </div>
  );
};

export default SearchBar; 