/**
 * Dashboard constants and configuration
 *
 * UI-specific constants for the dashboard.
 * For admin configuration, see src/config/admin.ts
 */

// Theme colors
export const COLORS = {
  background: {
    primary: '#121214',
    secondary: '#1C1C1E',
    tertiary: '#252329',
    input: '#1f1f22',
  },
  border: {
    default: '#2a2a2a',
    focus: '#FF5757',
  },
  accent: {
    primary: '#FF5757',
  },
  text: {
    primary: '#ffffff',
    secondary: '#9ca3af',
  },
} as const;

// Challenge categories
export const CHALLENGE_CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'education', label: 'Education' },
  { value: 'lifestyle', label: 'Lifestyle' },
] as const;

// Z-index layers
export const Z_INDEX = {
  overlay: 30,
  filterPanel: 40,
  floatingButton: 50,
  modal: 60,
  readMoreButton: 20,
} as const;

// Animation durations (in ms)
export const ANIMATION = {
  filterPanel: 300,
  cardSelect: 200,
} as const;
