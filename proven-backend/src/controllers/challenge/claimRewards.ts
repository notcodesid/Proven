import { Response } from 'express';
import { ChallengeStatus, TransactionStatus, TransactionType } from '@prisma/client';
import prisma from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';

interface ClaimRewardsRequest {
  challengeId: string;
}

export const claimRewards = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { challengeId } = req.body as ClaimRewardsRequest;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    if (!challengeId) {
      res.status(400).json({
        success: false,
        message: 'Challenge ID is required',
      });
      return;
    }

    const userChallenge = await prisma.userChallenge.findFirst({
      where: {
        challengeId,
        userId,
      },
      include: {
        challenge: true,
      },
    });

    if (!userChallenge) {
      res.status(404).json({
        success: false,
        message: 'Challenge participation not found',
      });
      return;
    }

    if (!userChallenge.challenge) {
      res.status(400).json({
        success: false,
        message: 'Challenge data unavailable',
      });
      return;
    }

    if (userChallenge.status !== ChallengeStatus.COMPLETED) {
      res.status(400).json({
        success: false,
        message: 'Challenge rewards not available for this user',
      });
      return;
    }

    const rewardTransaction = await prisma.transaction.findFirst({
      where: {
        challengeId,
        userId,
        transactionType: TransactionType.REWARD,
        status: TransactionStatus.COMPLETED,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    if (!rewardTransaction) {
      res.status(404).json({
        success: false,
        message: 'No reward transaction found. Please contact support.',
      });
      return;
    }

    const totalPayout = rewardTransaction.amount;

    logger.info(`User ${userId} viewed reward for challenge ${challengeId}`, {
      challengeId,
      userId,
      totalPayout,
      transactionId: rewardTransaction.id,
    });

    res.json({
      success: true,
      message: 'Reward details retrieved successfully',
      data: {
        challengeId,
        totalPayout,
        transactionId: rewardTransaction.id,
        transactionSignature: rewardTransaction.transactionSignature,
        processedAt: rewardTransaction.timestamp,
      },
    });

  } catch (error) {
    logger.error('Error claiming rewards:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
