import { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';

/**
 * Get current user's profile
 * @route GET /api/users/me
 * @access Private (requires authentication)
 * @description Retrieves the authenticated user's profile information including their stats
 */
export const getUserProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // The authenticate middleware ensures req.user exists
    const userId = req.user!.id;
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
    const userEmail = req.user?.email?.toLowerCase().trim();
    const isAdmin =
      !!req.user?.isAdmin ||
      (!!userEmail && adminEmails.length > 0 && adminEmails.includes(userEmail));
    await fetchAndReturnUserProfile(userId, isAdmin, res);
    return;
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
    return;
  }
};

/**
 * Helper function to fetch and return a user's profile
 * @private
 */
async function fetchAndReturnUserProfile(userId: string, isAdmin: boolean, res: Response) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        bio: true,
        email: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        // Count for active and completed challenges
        userChallenges: {
          select: {
            status: true
          }
        }
      }
    });
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    // Count active and completed challenges
    const stats = {
      active: 0,
      completed: 0
    };
    
    user.userChallenges.forEach(challenge => {
      if (challenge.status === 'ACTIVE') {
        stats.active++;
      } else if (challenge.status === 'COMPLETED') {
        stats.completed++;
      }
    });
    
    // Remove the raw userChallenges from the response
    const { userChallenges, ...userData } = user;
    
    res.json({
      ...userData,
      stats,
      isAdmin,
    });
    return;
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
    return;
  }
}
