import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';
import prisma from '../../lib/prisma';

/**
 * Review a submission (approve or reject)
 * @route PUT /api/submissions/:submissionId/review
 * @access Private (requires authentication - admin only for now)
 */
export const reviewSubmission = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submissionId } = req.params;
    const { status, reviewComments } = req.body;
    
    if (!submissionId) {
      res.status(400).json({
        success: false,
        message: 'Submission ID is required'
      });
      return;
    }
    
    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Status is required and must be either APPROVED or REJECTED'
      });
      return;
    }
    
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }
    
    const reviewerId = req.user.id;
    
    // Find the submission
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        challenge: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true
          }
        },
        userChallenge: {
          select: {
            id: true,
            progress: true,
            startDate: true
          }
        }
      }
    });
    
    if (!submission) {
      res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
      return;
    }
    
    if (submission.status !== 'PENDING') {
      res.status(400).json({
        success: false,
        message: `Submission has already been ${submission.status.toLowerCase()}`,
        data: {
          currentStatus: submission.status,
          reviewedBy: submission.reviewedBy,
          reviewedAt: submission.reviewedAt
        }
      });
      return;
    }
    
    // Calculate progress update if approved
    let newProgress = submission.userChallenge.progress;
    if (status === 'APPROVED') {
      // Calculate how many days have passed since challenge started
      const challengeStart = new Date(submission.userChallenge.startDate);
      const challengeEnd = new Date(submission.challenge.endDate);
      const totalDays = Math.ceil((challengeEnd.getTime() - challengeStart.getTime()) / (1000 * 60 * 60 * 24));
      
      // Get approved submissions count for this user challenge
      const approvedSubmissions = await prisma.submission.count({
        where: {
          userChallengeId: submission.userChallengeId,
          status: 'APPROVED'
        }
      });
      
      // Calculate new progress (including this approval)
      newProgress = Math.min(((approvedSubmissions + 1) / totalDays) * 100, 100);
    }
    
    // Update submission and user challenge progress in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the submission
      const updatedSubmission = await tx.submission.update({
        where: { id: submissionId },
        data: {
          status: status as 'APPROVED' | 'REJECTED',
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          reviewComments: reviewComments || null
        },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          },
          challenge: {
            select: {
              title: true
            }
          }
        }
      });
      
      // Update user challenge progress if approved
      let updatedUserChallenge = null;
      if (status === 'APPROVED') {
        updatedUserChallenge = await tx.userChallenge.update({
          where: { id: submission.userChallengeId },
          data: {
            progress: newProgress
          }
        });
      }
      
      return { updatedSubmission, updatedUserChallenge };
    });

    res.json({
      success: true,
      message: `Submission ${status.toLowerCase()} successfully`,
      data: {
        submission: {
          id: result.updatedSubmission.id,
          status: result.updatedSubmission.status,
          reviewedBy: result.updatedSubmission.reviewedBy,
          reviewedAt: result.updatedSubmission.reviewedAt,
          reviewComments: result.updatedSubmission.reviewComments
        },
        userProgress: newProgress,
        challengeTitle: result.updatedSubmission.challenge.title,
        userName: result.updatedSubmission.user.name
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to review submission',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}; 