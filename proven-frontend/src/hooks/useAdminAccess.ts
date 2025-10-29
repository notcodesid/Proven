import { useMemo } from 'react';

/**
 * Custom hook for checking admin access
 * Relies on server-computed admin flag from the user profile
 */
export function useAdminAccess(isAdminFlag: boolean | null | undefined): boolean {
  return useMemo(() => {
    return !!isAdminFlag;
  }, [isAdminFlag]);
}
