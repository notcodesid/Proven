import { useMemo } from 'react';
import { isAdminEmail } from '../config/admin';

/**
 * Custom hook for checking admin access
 * Uses centralized admin configuration from src/config/admin.ts
 */
export function useAdminAccess(userEmail: string | null | undefined): boolean {
  return useMemo(() => {
    return isAdminEmail(userEmail);
  }, [userEmail]);
}
