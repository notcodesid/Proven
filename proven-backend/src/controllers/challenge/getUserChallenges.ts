import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';
import prisma from '../../lib/prisma';

/**
 * Get user's challenges
 * @route GET /api/challenges/user
 * @access Private (requires authentication)
 */
export const getUserChallenges = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }
    
    // Get the authenticated user's ID
    const userId = req.user.id;
    
    // Get status filter from query params if provided
    const { status } = req.query;
    
    // Build where clause
    const whereClause: any = { userId };
    
    // Add status filter if provided
    if (status && typeof status === 'string') {
      whereClause.status = status.toUpperCase();
    }
    
    // Get user challenges with related challenge data
    const userChallenges = await prisma.userChallenge.findMany({
      where: whereClause,
      include: {
        challenge: {
          include: {
            creator: true
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    });
    
    // Transform the data to match the frontend interface
    const transformedUserChallenges = userChallenges.map(userChallenge => {
      const challenge = userChallenge.challenge;
      
      return {
        id: userChallenge.id,
        challengeId: challenge.id,
        userId: userChallenge.userId,
        status: userChallenge.status,
        // Progress is stored as 0-100 percentage in backend
        progress: userChallenge.progress,
        startDate: userChallenge.startDate.toISOString(),
        endDate: userChallenge.endDate ? userChallenge.endDate.toISOString() : null,
        stakeAmount: userChallenge.stakeAmount,
        challenge: {
          id: challenge.id,
          title: challenge.title,
          type: challenge.verificationType,
          sponsor: challenge.creator?.name || 'Unknown',
          duration: `${Math.ceil((challenge.endDate.getTime() - challenge.startDate.getTime()) / (1000 * 60 * 60 * 24))} days`,
          difficulty: challenge.difficulty,
          userStake: userChallenge.stakeAmount,
          totalPrizePool: challenge.stakeAmount * 2,
          participants: 0,
          metrics: challenge.metrics,
          trackingMetrics: challenge.rules || [],
          image: challenge.image || 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77',
          description: challenge.description || '',
          reward: userChallenge.stakeAmount * 2,
          startDate: challenge.startDate.toISOString(),
          endDate: challenge.endDate.toISOString()
        }
      };
    });
    
    res.status(200).json({
      success: true,
      userChallenges: transformedUserChallenges,
      count: transformedUserChallenges.length
    });
    return;
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user challenges',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return;
  }
};