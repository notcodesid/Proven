import { Response } from 'express';
import { ChallengeStatus, TransactionType, TransactionStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';
import prisma from '../../lib/prisma';
import { escrowService } from '../../services/escrowService';
import { updateAllChallengeStatuses } from '../../services/challengeCompletionService';

/**
 * Process challenge completion and distribute payouts
 * @route POST /api/challenges/:challengeId/complete-payouts
 * @access Private (requires authentication + admin)
 */
export const completeChallengePayouts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { challengeId } = req.params;

    // Admin access control
    const adminEmailsEnv = process.env.ADMIN_EMAILS || '';
    const adminEmails = adminEmailsEnv.split(',').map(email => email.trim().toLowerCase()).filter(Boolean);
    const userEmail = req.user?.email?.toLowerCase().trim();

    // Check if user is admin (via role or email list)
    const isAdmin = req.user?.isAdmin || (userEmail && adminEmails.includes(userEmail));

    if (!isAdmin) {
      res.status(403).json({
        success: false,
        error: 'Admin access required. Only platform admins can process payouts.',
      });
      return;
    }

    // Get challenge details
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        userChallenges: {
          include: {
            user: true
          }
        }
      }
    });

    if (!challenge) {
      res.status(404).json({
        success: false,
        error: 'Challenge not found'
      });
      return;
    }

    // Check if challenge has ended
    if (!challenge.endDate || new Date() < new Date(challenge.endDate)) {
      res.status(400).json({
        success: false,
        error: 'Challenge has not ended yet'
      });
      return;
    }

    // Check if challenge has escrow address
    if (!challenge.escrowAddress) {
      res.status(400).json({
        success: false,
        error: 'Challenge does not have an escrow address configured'
      });
      return;
    }

    // First, update all user challenge statuses based on their submissions
    const statusUpdateResults = await updateAllChallengeStatuses(challengeId);

    // Refresh challenge data with updated statuses
    const updatedChallenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        userChallenges: {
          include: {
            user: true
          }
        }
      }
    });

    if (!updatedChallenge) {
      res.status(404).json({
        success: false,
        error: 'Challenge not found after status update'
      });
      return;
    }

    // Get all participants
    const allParticipants = updatedChallenge.userChallenges;

    // Separate winners and losers
    const winners = allParticipants.filter(uc => uc.status === ChallengeStatus.COMPLETED);
    const losers = allParticipants.filter(uc => uc.status === ChallengeStatus.FAILED);

    // CASE 1: No winners → Refund everyone their stake
    if (winners.length === 0) {
      const refundResults = [];
      const failedRefunds = [];

      for (const participant of allParticipants) {
        try {
          // Get wallet address from stake transaction
          const stakeTransaction = await prisma.transaction.findFirst({
            where: {
              userId: participant.userId,
              challengeId: challengeId,
              transactionType: TransactionType.STAKE
            }
          });

          if (!stakeTransaction || !stakeTransaction.metadata) {
            failedRefunds.push({
              userId: participant.userId,
              userName: participant.user.name,
              reason: 'Stake transaction not found'
            });
            continue;
          }

          const metadata = stakeTransaction.metadata as any;
          const walletAddress = metadata.userWalletAddress;

          if (!walletAddress) {
            failedRefunds.push({
              userId: participant.userId,
              userName: participant.user.name,
              reason: 'No wallet address found'
            });
            continue;
          }

          // Send refund from escrow
          const txSignature = await escrowService.sendPayout(
            challengeId,
            walletAddress,
            participant.stakeAmount
          );

          // Record refund transaction
          await prisma.transaction.create({
            data: {
              userId: participant.userId,
              challengeId: challengeId,
              transactionType: TransactionType.REFUND,
              amount: participant.stakeAmount,
              description: `Challenge completed with no winners - Full stake refund (${participant.stakeAmount} USDC)`,
              status: TransactionStatus.COMPLETED,
              transactionSignature: txSignature,
              timestamp: new Date(),
              metadata: {
                challengeTitle: challenge.title,
                refundAmount: participant.stakeAmount,
                reason: 'No winners',
                escrowAddress: challenge.escrowAddress
              }
            }
          });

          refundResults.push({
            userId: participant.userId,
            userName: participant.user.name,
            walletAddress: walletAddress,
            refundAmount: participant.stakeAmount,
            transactionSignature: txSignature
          });

        } catch (error: any) {
          failedRefunds.push({
            userId: participant.userId,
            userName: participant.user.name,
            reason: error.message || 'Unknown error'
          });
        }
      }

      const hasFailures = failedRefunds.length > 0;
      const responseBody = {
        success: !hasFailures,
        message: hasFailures
          ? `⚠️ Refunds partially processed: ${refundResults.length} succeeded, ${failedRefunds.length} failed`
          : 'No winners found - All participants refunded',
        data: {
          challenge: {
            id: challenge.id,
            title: challenge.title,
            escrowAddress: challenge.escrowAddress
          },
          summary: {
            totalParticipants: allParticipants.length,
            winners: 0,
            losers: losers.length,
            totalRefunded: refundResults.length,
            failedRefunds: failedRefunds.length
          },
          refunds: refundResults,
          failed: failedRefunds.length > 0 ? failedRefunds : undefined
        },
        errors: hasFailures ? failedRefunds : undefined
      };

      res.status(hasFailures ? 207 : 200).json(responseBody);
      return;
    }

    // CASE 2: Everyone wins → Just return stakes (no prize pool)
    if (winners.length === allParticipants.length) {
      const stakeReturnResults = [];
      const failedReturns = [];

      for (const winner of winners) {
        try {
          // Get wallet address from stake transaction
          const stakeTransaction = await prisma.transaction.findFirst({
            where: {
              userId: winner.userId,
              challengeId: challengeId,
              transactionType: TransactionType.STAKE
            }
          });

          if (!stakeTransaction || !stakeTransaction.metadata) {
            failedReturns.push({
              userId: winner.userId,
              userName: winner.user.name,
              reason: 'Stake transaction not found'
            });
            continue;
          }

          const metadata = stakeTransaction.metadata as any;
          const walletAddress = metadata.userWalletAddress;

          if (!walletAddress) {
            failedReturns.push({
              userId: winner.userId,
              userName: winner.user.name,
              reason: 'No wallet address found'
            });
            continue;
          }

          // Send stake back (no prize pool since everyone won)
          const txSignature = await escrowService.sendPayout(
            challengeId,
            walletAddress,
            winner.stakeAmount
          );

          // Record transaction
          await prisma.transaction.create({
            data: {
              userId: winner.userId,
              challengeId: challengeId,
              transactionType: TransactionType.REWARD,
              amount: winner.stakeAmount,
              description: `Challenge completed - All participants won! Stake returned (${winner.stakeAmount} USDC)`,
              status: TransactionStatus.COMPLETED,
              transactionSignature: txSignature,
              timestamp: new Date(),
              metadata: {
                challengeTitle: challenge.title,
                stakeRefund: winner.stakeAmount,
                prizeAmount: 0,
                totalPayout: winner.stakeAmount,
                reason: 'All participants won',
                escrowAddress: challenge.escrowAddress
              }
            }
          });

          stakeReturnResults.push({
            userId: winner.userId,
            userName: winner.user.name,
            walletAddress: walletAddress,
            stakeReturned: winner.stakeAmount,
            prizeAmount: 0,
            totalPayout: winner.stakeAmount,
            transactionSignature: txSignature
          });

        } catch (error: any) {
          failedReturns.push({
            userId: winner.userId,
            userName: winner.user.name,
            reason: error.message || 'Unknown error'
          });
        }
      }

      const hasFailures = failedReturns.length > 0;
      const responseBody = {
        success: !hasFailures,
        message: hasFailures
          ? `⚠️ Payouts partially processed: ${stakeReturnResults.length} succeeded, ${failedReturns.length} failed`
          : '🎉 Everyone completed the challenge! Stakes returned to all participants.',
        data: {
          challenge: {
            id: challenge.id,
            title: challenge.title,
            escrowAddress: challenge.escrowAddress
          },
          summary: {
            totalParticipants: allParticipants.length,
            winners: winners.length,
            losers: 0,
            prizePool: 0,
            totalPayoutsSent: stakeReturnResults.length,
            failedPayouts: failedReturns.length
          },
          payouts: stakeReturnResults,
          failed: failedReturns.length > 0 ? failedReturns : undefined
        },
        errors: hasFailures ? failedReturns : undefined
      };

      res.status(hasFailures ? 207 : 200).json(responseBody);
      return;
    }

    // CASE 3: Normal case → Winners split losers' stakes
    // Calculate prize pool from losers' stakes
    const totalLoserStakes = losers.reduce((sum, uc) => sum + uc.stakeAmount, 0);
    const totalWinnerStakes = winners.reduce((sum, uc) => sum + uc.stakeAmount, 0);

    // Prize pool = all loser stakes (distributed among winners)
    const prizePool = totalLoserStakes;
    const prizePerWinner = prizePool / winners.length;

    // Check escrow balance
    const escrowBalance = await escrowService.getEscrowBalance(challenge.escrowAddress);
    const totalPayoutNeeded = totalWinnerStakes + prizePool;

    if (escrowBalance < totalPayoutNeeded) {
      res.status(400).json({
        success: false,
        error: 'Insufficient escrow balance to process payouts',
        data: {
          escrowBalance,
          totalPayoutNeeded,
          deficit: totalPayoutNeeded - escrowBalance
        }
      });
      return;
    }

    // Process payouts to winners
    const payoutResults = [];
    const failedPayouts = [];

    for (const winner of winners) {
      try {
        // Each winner gets their stake back + share of prize pool
        const totalPayout = winner.stakeAmount + prizePerWinner;

        // Get wallet address from the stake transaction metadata
        const stakeTransaction = await prisma.transaction.findFirst({
          where: {
            userId: winner.userId,
            challengeId: challengeId,
            transactionType: TransactionType.STAKE
          }
        });

        if (!stakeTransaction || !stakeTransaction.metadata) {
          failedPayouts.push({
            userId: winner.userId,
            userName: winner.user.name,
            reason: 'Stake transaction not found'
          });
          continue;
        }

        const metadata = stakeTransaction.metadata as any;
        const walletAddress = metadata.userWalletAddress;

        if (!walletAddress) {
          failedPayouts.push({
            userId: winner.userId,
            userName: winner.user.name,
            reason: 'No wallet address found in transaction metadata'
          });
          continue;
        }

        // Send payout from escrow
        const txSignature = await escrowService.sendPayout(
          challengeId,
          walletAddress,
          totalPayout
        );

        // Record transaction in database
        await prisma.transaction.create({
          data: {
            userId: winner.userId,
            challengeId: challengeId,
            transactionType: TransactionType.REWARD,
            amount: totalPayout,
            description: `Challenge completed - Stake refund (${winner.stakeAmount} USDC) + Reward (${prizePerWinner.toFixed(2)} USDC)`,
            status: TransactionStatus.COMPLETED,
            transactionSignature: txSignature,
            timestamp: new Date(),
            metadata: {
              challengeTitle: challenge.title,
              stakeRefund: winner.stakeAmount,
              prizeAmount: prizePerWinner,
              totalPayout,
              escrowAddress: challenge.escrowAddress
            }
          }
        });

        payoutResults.push({
          userId: winner.userId,
          userName: winner.user.name,
          walletAddress: walletAddress,
          stakeRefund: winner.stakeAmount,
          prizeAmount: prizePerWinner,
          totalPayout,
          transactionSignature: txSignature
        });

      } catch (error: any) {
        failedPayouts.push({
          userId: winner.userId,
          userName: winner.user.name,
          reason: error.message || 'Unknown error'
        });
      }
    }

    const hasFailures = failedPayouts.length > 0;
    const responseBody = {
      success: !hasFailures,
      message: hasFailures
        ? `⚠️ Payouts partially processed: ${payoutResults.length} succeeded, ${failedPayouts.length} failed`
        : `🎉 Payouts processed: ${winners.length} winners share ${prizePool} USDC prize pool from ${losers.length} losers`,
      data: {
        challenge: {
          id: challenge.id,
          title: challenge.title,
          escrowAddress: challenge.escrowAddress
        },
        summary: {
          totalParticipants: allParticipants.length,
          winners: winners.length,
          losers: losers.length,
          prizePool,
          prizePerWinner: parseFloat(prizePerWinner.toFixed(2)),
          totalPayoutsSent: payoutResults.length,
          failedPayouts: failedPayouts.length
        },
        payouts: payoutResults,
        failed: failedPayouts.length > 0 ? failedPayouts : undefined
      },
      errors: hasFailures ? failedPayouts : undefined
    };

    res.status(hasFailures ? 207 : 200).json(responseBody);
    return;

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process payouts',
    });
    return;
  }
};
