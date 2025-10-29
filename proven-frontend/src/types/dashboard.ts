/**
 * Type definitions for dashboard components
 */

export const SORT_OPTIONS = ['recent', 'popular', 'stake', 'duration'] as const;
export type SortOption = typeof SORT_OPTIONS[number];

export const CATEGORY_VALUES = ['all', 'fitness', 'education', 'lifestyle'] as const;
export type CategoryValue = typeof CATEGORY_VALUES[number];

export interface ChallengeFilters {
  searchValue: string;
  category: CategoryValue;
  sortBy: SortOption;
}

export interface FilterState extends ChallengeFilters {
  filterActive: boolean;
}
