import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';

// Admin emails loaded from environment variable (ADMIN_EMAILS)
// Format: ADMIN_EMAILS=admin1@domain.com,admin2@domain.com
const getAdminEmails = (): string[] => {
  const adminEmailsEnv = process.env.ADMIN_EMAILS || '';
  if (!adminEmailsEnv) {
    console.warn('WARNING: ADMIN_EMAILS environment variable is not set. No email-based admin access configured.');
    return [];
  }
  return adminEmailsEnv.split(',').map(email => email.trim().toLowerCase()).filter(Boolean);
};

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  // Normalize email for comparison (case-insensitive, trimmed)
  const userEmail = req.user.email?.toLowerCase().trim();

  // Check if user is admin via role flag
  if (req.user.isAdmin) {
    next();
    return;
  }

  // Check if user email is in admin list from environment
  const adminEmails = getAdminEmails();
  if (userEmail && adminEmails.length > 0 && adminEmails.includes(userEmail)) {
    next();
    return;
  }

  res.status(403).json({ success: false, message: 'Admin access required' });
}




