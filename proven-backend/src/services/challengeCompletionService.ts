import prisma from '../lib/prisma';
import { ChallengeStatus } from '@prisma/client';

/**
 * Service to handle challenge completion logic
 */

interface CompletionCriteria {
  totalDays: number;
  requiredCompletionRate: number; // e.g., 0.8 for 80%
  maxConsecutiveMisses: number; // e.g., 2 = fail if 2+ days missed in a row
}

/**
 * Calculate completion status for a user challenge
 */
export async function calculateCompletionStatus(
  userChallengeId: string
): Promise<{
  isCompleted: boolean;
  isFailure: boolean;
  submittedDays: number;
  totalDays: number;
  completionRate: number;
  consecutiveMisses: number;
}> {
  // Get user challenge with submissions
  const userChallenge = await prisma.userChallenge.findUnique({
    where: { id: userChallengeId },
    include: {
      challenge: true,
      submissions: {
        orderBy: {
          createdAt: 'asc'
        }
      }
    }
  });

  if (!userChallenge) {
    throw new Error('User challenge not found');
  }

  const { challenge, submissions, startDate, endDate } = userChallenge;

  // Calculate total days in challenge
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date(challenge.endDate);
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  // Count submitted days (approved submissions)
  const submittedDays = submissions.filter(s => s.status === 'APPROVED').length;

  // Calculate completion rate
  const completionRate = totalDays > 0 ? submittedDays / totalDays : 0;

  // Calculate consecutive misses
  const consecutiveMisses = calculateConsecutiveMisses(submissions, startDate, end);

  // Default criteria (can be customized per challenge)
  const criteria: CompletionCriteria = {
    totalDays,
    requiredCompletionRate: 0.8, // 80% completion required
    maxConsecutiveMisses: 2 // Fail if 2+ consecutive days missed
  };

  // Determine status
  const isFailure = consecutiveMisses >= criteria.maxConsecutiveMisses;
  const isCompleted = !isFailure && completionRate >= criteria.requiredCompletionRate;

  return {
    isCompleted,
    isFailure,
    submittedDays,
    totalDays,
    completionRate,
    consecutiveMisses
  };
}

/**
 * Calculate maximum consecutive misses
 */
function calculateConsecutiveMisses(
  submissions: any[],
  startDate: Date,
  endDate: Date
): number {
  const submissionDates = new Set(
    submissions
      .filter(s => s.status === 'APPROVED')
      .map(s => new Date(s.createdAt).toDateString())
  );

  let maxConsecutiveMisses = 0;
  let currentMisses = 0;

  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateString = d.toDateString();

    if (submissionDates.has(dateString)) {
      currentMisses = 0; // Reset on successful submission
    } else {
      currentMisses++;
      maxConsecutiveMisses = Math.max(maxConsecutiveMisses, currentMisses);
    }
  }

  return maxConsecutiveMisses;
}

/**
 * Update all user challenge statuses for a completed challenge
 */
export async function updateAllChallengeStatuses(challengeId: string): Promise<{
  completed: number;
  failed: number;
  total: number;
}> {
  // Get all user challenges for this challenge
  const userChallenges = await prisma.userChallenge.findMany({
    where: {
      challengeId,
      status: ChallengeStatus.ACTIVE // Only update active challenges
    }
  });

  let completedCount = 0;
  let failedCount = 0;

  for (const uc of userChallenges) {
    try {
      const status = await calculateCompletionStatus(uc.id);

      let newStatus: ChallengeStatus;
      if (status.isFailure) {
        newStatus = ChallengeStatus.FAILED;
        failedCount++;
      } else if (status.isCompleted) {
        newStatus = ChallengeStatus.COMPLETED;
        completedCount++;
      } else {
        // Still active or incomplete - mark as failed since challenge ended
        newStatus = ChallengeStatus.FAILED;
        failedCount++;
      }

      // Update status
      await prisma.userChallenge.update({
        where: { id: uc.id },
        data: {
          status: newStatus,
          progress: status.completionRate * 100,
          endDate: new Date()
        }
      });
    } catch (error) {
      // Error updating status - continue with other challenges
    }
  }

  return {
    completed: completedCount,
    failed: failedCount,
    total: userChallenges.length
  };
}
