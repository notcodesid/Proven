// import required modules
import { Response } from 'express';
import prisma from '../../lib/prisma';
import { CreateChallengeInput } from '../../schemas/challenge';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';
import { escrowService } from '../../services/escrowService';

/**
 * Create a new challenge
 * @route POST /api/challenges/create
 * @access Private (requires authentication + admin)
 */
export const createChallenge = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
      return;
    }

    // Admin access control
    const adminEmailsEnv = process.env.ADMIN_EMAILS || '';
    const adminEmails = adminEmailsEnv.split(',').map(email => email.trim().toLowerCase()).filter(Boolean);
    const userEmail = req.user.email?.toLowerCase().trim();

    // Check if user is admin (via role or email list)
    const isAdmin = req.user.isAdmin || (userEmail && adminEmails.includes(userEmail));

    if (!isAdmin) {
      res.status(403).json({
        success: false,
        error: 'Admin access required. Only platform admins can create challenges.',
      });
      return;
    }

    const input: CreateChallengeInput = req.body;
    const userId = req.user.id;

    // Calculate duration in days from the duration string (e.g., "30 days")
    const durationMatch = input.duration?.match(/(\d+)/);
    const totalDays = durationMatch ? parseInt(durationMatch[1], 10) : 30;

    // Calculate stake amount (10% of prize pool)
    const stakeAmountUsdc = input.userStake || (input.totalPrizePool / 10);

    const challenge = await prisma.challenge.create({
      data: {
        title: input.title,
        description: input.description,
        stakeAmount: input.userStake,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        verificationType: input.verificationType || input.type,
        difficulty: input.difficulty,
        metrics: input.metrics,
        creatorId: userId,
        image: input.image,
        rules: input.rules,
        totalPrizePool: input.totalPrizePool || input.userStake * 2,
        participants: input.participants || 0,
        hostType: input.hostType || 'PERSONAL',
        sponsor: input.sponsor,
        trackingMetrics: input.trackingMetrics || [],
      },
      include: {
        creator: true,
      },
    });

    // Create escrow wallet using the actual challenge ID and update the record
    const escrowWallet = await escrowService.createEscrowWallet(challenge.id);

    const challengeWithEscrow = await prisma.challenge.findUnique({
      where: { id: challenge.id },
      include: {
        creator: true,
      },
    });

    if (!challengeWithEscrow) {
      throw new Error('Challenge not found after escrow creation');
    }

    res.json({
      success: true,
      challenge: {
        id: challengeWithEscrow.id,
        title: input.title,
        type: input.type,
        sponsor: input.sponsor,
        duration: input.duration,
        userStake: input.userStake,
        totalPrizePool: input.totalPrizePool,
        participants: input.participants,
        metrics: input.metrics,
        trackingMetrics: input.trackingMetrics,
        image: input.image,
        description: input.description,
        rules: input.rules,
        startDate: input.startDate,
        endDate: input.endDate,
        creatorId: userId,
        creator: challengeWithEscrow.creator,
        escrowAddress: challengeWithEscrow.escrowAddress,
      },
    });
    return;
  } catch (error: any) {
    const errorMessage = error.message || 'Failed to create challenge';

    res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.code ? { code: error.code, meta: error.meta } : undefined
    });
    return;
  }
};
