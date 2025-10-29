import { useState, useMemo, useCallback } from 'react';
import { Challenge } from '../types/challenge';
import { SortOption, CategoryValue, FilterState } from '../types/dashboard';

interface UseChallengeFiltersReturn extends FilterState {
  filteredChallenges: Challenge[];
  setSearchValue: (value: string) => void;
  setCategory: (value: CategoryValue) => void;
  setSortBy: (value: SortOption) => void;
  setFilterActive: (active: boolean) => void;
  toggleFilter: () => void;
}

/**
 * Custom hook for managing challenge filters and sorting
 */
export function useChallengeFilters(
  challenges: Challenge[]
): UseChallengeFiltersReturn {
  const [searchValue, setSearchValue] = useState('');
  const [category, setCategory] = useState<CategoryValue>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterActive, setFilterActive] = useState(false);

  const toggleFilter = useCallback(() => {
    setFilterActive((prev) => !prev);
  }, []);

  const filteredChallenges = useMemo(() => {
    const text = searchValue.trim().toLowerCase();
    let list = [...challenges];

    // Apply search filter
    if (text) {
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(text) ||
          (c.description || '').toLowerCase().includes(text) ||
          (c.metrics || '').toLowerCase().includes(text)
      );
    }

    // Apply category filter
    if (category !== 'all') {
      list = list.filter(
        (c) =>
          (c.category || c.metrics || '').toLowerCase() === category.toLowerCase()
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'popular':
        list.sort((a, b) => (b.participants || 0) - (a.participants || 0));
        break;
      case 'stake':
        list.sort((a, b) => (b.userStake || 0) - (a.userStake || 0));
        break;
      case 'duration': {
        const toDays = (d?: string) =>
          parseInt((d || '0').split(' ')[0] || '0', 10);
        list.sort((a, b) => toDays(b.duration) - toDays(a.duration));
        break;
      }
      case 'recent':
      default:
        // Keep server order (assumed to be recent)
        break;
    }

    return list;
  }, [challenges, searchValue, category, sortBy]);

  return {
    searchValue,
    category,
    sortBy,
    filterActive,
    filteredChallenges,
    setSearchValue,
    setCategory,
    setSortBy,
    setFilterActive,
    toggleFilter,
  };
}
