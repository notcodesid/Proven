import { Request, Response } from 'express';
import { ChallengeStatus } from '@prisma/client';
import prisma from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { updateAllChallengeStatuses } from '../../services/challengeCompletionService';

interface SettleChallengeRequest {
  challengeId: string;
}

export const settleChallenge = async (req: Request, res: Response): Promise<void> => {
  try {
    const { challengeId } = req.body as SettleChallengeRequest;

    if (!challengeId) {
      res.status(400).json({
        success: false,
        message: 'Challenge ID is required',
      });
      return;
    }

    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        userChallenges: true,
      },
    });

    if (!challenge) {
      res.status(404).json({
        success: false,
        message: 'Challenge not found',
      });
      return;
    }

    const now = new Date();
    if (challenge.endDate > now) {
      res.status(400).json({
        success: false,
        message: 'Challenge has not ended yet',
      });
      return;
    }

    const statusUpdate = await updateAllChallengeStatuses(challengeId);

    const refreshedChallenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        userChallenges: true,
      },
    });

    if (!refreshedChallenge) {
      res.status(404).json({
        success: false,
        message: 'Challenge not found after update',
      });
      return;
    }

    const winners = refreshedChallenge.userChallenges.filter(
      (uc) => uc.status === ChallengeStatus.COMPLETED,
    );
    const losers = refreshedChallenge.userChallenges.filter(
      (uc) => uc.status === ChallengeStatus.FAILED,
    );
    const active = refreshedChallenge.userChallenges.filter(
      (uc) => uc.status === ChallengeStatus.ACTIVE,
    );

    logger.info(`Challenge ${challengeId} settlement summary`, {
      challengeId,
      winners: winners.length,
      losers: losers.length,
      active: active.length,
      updated: statusUpdate,
    });

    res.json({
      success: true,
      message: 'Challenge status summary generated successfully',
      data: {
        challengeId,
        winners: winners.length,
        losers: losers.length,
        active: active.length,
        statusUpdate,
      },
    });

  } catch (error) {
    logger.error('Error settling challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
