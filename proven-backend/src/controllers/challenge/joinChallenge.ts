import { Response } from 'express';
import { ChallengeStatus, TransactionType, TransactionStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';
import prisma from '../../lib/prisma';
import { escrowService } from '../../services/escrowService';

/**
 * Join a challenge
 * @route POST /api/challenges/join
 * @access Private (requires authentication)
 */
export const joinChallenge = async (req: AuthenticatedRequest, res: Response) => {
  try {

    const { challengeId, stakeAmount, userWalletAddress, transactionSignature } = req.body;

    if (!challengeId) {
      res.status(400).json({
        success: false,
        message: 'Challenge ID is required'
      });
      return;
    }

    if (!userWalletAddress) {
      res.status(400).json({
        success: false,
        message: 'User wallet address is required for staking'
      });
      return;
    }

    if (!transactionSignature) {
      res.status(400).json({
        success: false,
        message: 'Transaction signature is required. Stake must be completed on-chain first.'
      });
      return;
    }

    // Authentication is already handled by middleware, but double-check
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    // Get the authenticated user's ID
    const userId = req.user.id;
    
    // Check if challenge exists
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });
    
    if (!challenge) {
      res.status(404).json({ 
        success: false,
        message: 'Challenge not found' 
      });
      return;
    }
    
    // Prevent joining once the challenge has started
    const now = new Date();
    if (challenge.startDate <= now) {
      res.status(400).json({
        success: false,
        message: 'Challenge has already started. Joining is closed.',
        data: {
          startedAt: challenge.startDate,
        },
      });
      return;
    }

    // Check if user already joined this challenge
    const existingUserChallenge = await prisma.userChallenge.findFirst({
      where: {
        userId: userId,
        challengeId: challengeId,
      },
    });

    if (existingUserChallenge) {
      res.status(400).json({
        success: false,
        message: 'You have already joined this challenge'
      });
      return;
    }

    // Determine final stake amount
    const finalStakeAmount = stakeAmount || challenge.stakeAmount;

    // Check if challenge has escrow address configured
    if (!challenge.escrowAddress) {
      res.status(400).json({
        success: false,
        message: 'Challenge escrow not configured. Please contact support.'
      });
      return;
    }

    // Verify the USDC transfer on-chain
    let isVerified = false;
    try {
      isVerified = await escrowService.verifyTransfer(
        transactionSignature,
        userWalletAddress,
        challenge.escrowAddress,
        finalStakeAmount
      );

      if (!isVerified) {
        res.status(400).json({
          success: false,
          message: 'Transfer verification failed. Please ensure you sent the correct amount to the escrow address.'
        });
        return;
      }
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: `Transfer verification failed: ${error.message}`
      });
      return;
    }


    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create user challenge record
      const userChallenge = await tx.userChallenge.create({
        data: {
          userId: userId,
          challengeId: challengeId,
          stakeAmount: finalStakeAmount,
          status: ChallengeStatus.ACTIVE,
          progress: 0,
          startDate: new Date(),
        },
      });
      
      // Create transaction record for the REAL on-chain stake
      const transaction = await tx.transaction.create({
        data: {
          userId: userId,
          challengeId: challengeId,
          transactionType: TransactionType.STAKE,
          amount: finalStakeAmount,
          description: `Staked for challenge: ${challenge.title}`,
          status: TransactionStatus.COMPLETED,
          transactionSignature: transactionSignature,
          timestamp: new Date(),
          metadata: {
            challengeTitle: challenge.title,
            userWalletAddress,
            escrowAddress: challenge.escrowAddress,
            verifiedOnChain: true,
            tokenType: 'USDC'
          }
        },
      });
      
      // Update challenge participant count
      const updatedChallenge = await tx.challenge.update({
        where: { id: challengeId },
        data: {
          participants: {
            increment: 1
          }
        }
      });
      
      return { userChallenge, transaction, updatedChallenge };
    });

    res.status(201).json({
      success: true,
      message: 'Successfully joined the challenge',
      data: {
        userChallenge: result.userChallenge,
        transaction: result.transaction,
        stakeAmount: finalStakeAmount,
        challengeTitle: challenge.title,
        transactionSignature
      }
    });
    return;
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to join challenge',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
    return;
  }
};
