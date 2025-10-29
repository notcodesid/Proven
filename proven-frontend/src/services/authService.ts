/**
 * Admin access utilities
 */

const ADMIN_EMAILS = [
  'hellolockin@gmail.com',
  'admin@lockin.com',
  'siddharth@lockin.com'
];

export const isAdminUser = (email: string | null | undefined): boolean => {
  return email ? ADMIN_EMAILS.includes(email) : false;
};

export const requireAdminAccess = (email: string | null | undefined): void => {
  if (!isAdminUser(email)) {
    throw new Error('Admin access required');
  }
};

export const getAdminEmails = (): string[] => {
  return [...ADMIN_EMAILS];
}; 