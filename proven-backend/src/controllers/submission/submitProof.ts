import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';
import prisma from '../../lib/prisma';
import { supabase, SUPABASE_URL_VALUE } from '../../lib/supabase';

/**
 * Submit daily proof for a challenge
 * @route POST /api/submissions/submit
 * @access Private (requires authentication)
 */
export const submitProof = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userChallengeId, imageUrl, imagePath, description, walletAddress } = req.body;
    
    if (!userChallengeId || (!imageUrl && !imagePath)) {
      res.status(400).json({
        success: false,
        message: 'User challe3hnge ID and image URL are required'
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
    
    const userId = req.user.id;
    
    // Verify the user challenge exists and belongs to the authenticated user
    const userChallenge = await prisma.userChallenge.findFirst({
      where: {
        id: userChallengeId,
        userId: userId
      },
      include: {
        challenge: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true
          }
        }
      }
    });
    
    if (!userChallenge) {
      res.status(404).json({
        success: false,
        message: 'Challenge not found or you are not enrolled in this challenge'
      });
      return;
    }
    
    // Determine user's active window (start/end) using per-user join period in local time
    const chStart = new Date(userChallenge.challenge.startDate);
    const chEnd = new Date(userChallenge.challenge.endDate);
    const chStartLocal = new Date(chStart.getFullYear(), chStart.getMonth(), chStart.getDate());
    const chEndLocal = new Date(chEnd.getFullYear(), chEnd.getMonth(), chEnd.getDate());
    const DAY_MS = 24 * 60 * 60 * 1000;
    const durationDays = Math.max(1, Math.floor((chEndLocal.getTime() - chStartLocal.getTime()) / DAY_MS) + 1);

    const ucStart = new Date(userChallenge.startDate);
    const startLocal = new Date(ucStart.getFullYear(), ucStart.getMonth(), ucStart.getDate());
    const ucEnd = userChallenge.endDate ? new Date(userChallenge.endDate) : new Date(startLocal.getTime() + (durationDays - 1) * DAY_MS);
    const endLocal = new Date(ucEnd.getFullYear(), ucEnd.getMonth(), ucEnd.getDate());
    
    // Normalize today to local midnight and ensure submission is within user's active period
    const today = new Date();
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (todayLocal.getTime() < startLocal.getTime()) {
      res.status(400).json({
        success: false,
        message: 'Your challenge has not started yet'
      });
      return;
    }
    if (todayLocal.getTime() > endLocal.getTime()) {
      res.status(400).json({
        success: false,
        message: 'Your challenge period has ended'
      });
      return;
    }

    // Check if user already submitted proof for today (local day)
    const tomorrow = new Date(todayLocal);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        userId: userId,
        userChallengeId: userChallengeId,
        submissionDate: {
          gte: todayLocal,
          lt: tomorrow
        }
      }
    });
    
    if (existingSubmission) {
      res.status(400).json({
        success: false,
        message: 'You have already submitted proof for today',
        data: {
          existingSubmission: {
            id: existingSubmission.id,
            status: existingSubmission.status,
            submissionDate: existingSubmission.submissionDate
          }
        }
      });
      return;
    }
    
    // Prefer storage path; if not provided, try to extract from URL
    let storedPath: string = imagePath;
    if (!storedPath && typeof imageUrl === 'string') {
      // Try to derive storage path from a public/signed URL
      const match = imageUrl.match(/\/object\/(?:sign|public)\/proof-submission\/(.*)$/);
      storedPath = match?.[1] || imageUrl; // fallback to original
    }

    // Create the submission
    const submission = await prisma.submission.create({
      data: {
        userId: userId,
        challengeId: userChallenge.challengeId,
        userChallengeId: userChallengeId,
        imageUrl: storedPath,
        description: description || null,
        metadata: {
          userAgent: req.headers['user-agent'],
          ip: req.ip,
          submissionTimestamp: new Date().toISOString()
        }
      },
      include: {
        challenge: {
          select: {
            title: true,
            blockchainId: true
          }
        }
      }
    });
    
    // DESIGN DECISION: Off-chain proof storage for V1
    // Rationale:
    // - Financial transactions (stakes/payouts) are on-chain ✅
    // - Proof verification is manual review (admin approval)
    // - On-chain recording would add: complexity, latency, cost per submission
    // - Current DB storage provides sufficient audit trail (timestamp, IP, metadata)
    //
    // V2 Enhancement Options:
    // 1. Merkle tree batching (daily root hash on-chain)
    // 2. Event logging for proof submissions
    // 3. Full on-chain proof recording via Solana program
    //
    // For now: Database storage is sufficient and appropriate

    // Since bucket is public, generate public URL directly
    let previewUrl: string | undefined;
    if (supabase && submission.imageUrl && /^\w|\//.test(submission.imageUrl)) {
      const { data: { publicUrl } } = supabase.storage
        .from('proof-submission')
        .getPublicUrl(submission.imageUrl);
      previewUrl = publicUrl;
    }

    res.status(201).json({
      success: true,
      message: 'Proof submitted successfully and is pending review',
      data: {
        submission: {
          id: submission.id,
          imageUrl: previewUrl || submission.imageUrl,
          description: submission.description,
          status: submission.status,
          submissionDate: submission.submissionDate,
          challengeTitle: submission.challenge.title
        }
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit proof',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}; 