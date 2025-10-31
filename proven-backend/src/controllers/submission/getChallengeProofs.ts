import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';
import prisma from '../../lib/prisma';
import { supabase, SUPABASE_URL_VALUE } from '../../lib/supabase';
import { cache } from '../../lib/cache';

/**
 * Get daily proof calendar data for a specific challenge
 * @route GET /api/submissions/challenge/:challengeId/calendar
 * @access Private (requires authentication)
 */
export const getChallengeProofs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }
    
    const { challengeId } = req.params;
    const userId = req.user.id;
    
    if (!challengeId) {
      res.status(400).json({
        success: false,
        message: 'Challenge ID is required'
      });
      return;
    }
    
    // First, check if user has joined this challenge
    const userChallenge = await prisma.userChallenge.findFirst({
      where: {
        userId: userId,
        challengeId: challengeId
      }
    });
    
    if (!userChallenge) {
      res.status(403).json({
        success: false,
        message: 'You have not joined this challenge'
      });
      return;
    }
    
    // Get challenge details to determine date range
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true
      }
    });
    
    if (!challenge) {
      res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
      return;
    }
    
    // Get all user's submissions for this challenge
    const submissions = await prisma.submission.findMany({
      where: {
        userId: userId,
        challengeId: challengeId
      },
      select: {
        id: true,
        imageUrl: true,
        description: true,
        submissionDate: true,
        status: true,
        reviewComments: true,
        reviewedAt: true
      },
      orderBy: {
        submissionDate: 'asc'
      }
    });

    // Ensure image URLs are accessible. If we stored a storage path, create a signed URL
    const submissionsWithUrls = await Promise.all(
      submissions.map(async (s) => {
        const key = `signed:${s.imageUrl}`;
        const cachedUrl = cache.get<string>(key);
        if (cachedUrl) {
          return { ...s, imageUrl: cachedUrl };
        }

        let url = s.imageUrl;
        if (typeof url === 'string' && !/^https?:\/\//i.test(url)) {
          if (supabase) {
            try {
              const { data: signed } = await supabase.storage
                .from('proof-submission')
                .createSignedUrl(url, 60 * 60);
              url = signed?.signedUrl || url;
            } catch (_) {
              // ignore; fall back to stored value
            }
          }
          if (!/^https?:\/\//i.test(url)) {
            // As a final fallback, construct public URL
            url = `${SUPABASE_URL_VALUE}/storage/v1/object/public/proof-submission/${url}`;
          }

          // Cache signed/public URL for 55 minutes to avoid per-item signing on every request
          cache.set(key, url, 55 * 60 * 1000);
        }

        return { ...s, imageUrl: url };
      })
    );
    
    // Create a map of submissions by date (YYYY-MM-DD format)
    const submissionsByDate = new Map();
    
    // Helper to format a Date as local YYYY-MM-DD (no UTC shifting)
    const toLocalDateStr = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    submissionsWithUrls.forEach(submission => {
      const date = toLocalDateStr(new Date(submission.submissionDate));
      submissionsByDate.set(date, submission);
    });
    
    // Generate calendar data for the user's challenge period
    const currentDate = new Date();
    const chStart = new Date(challenge.startDate);
    const chEnd = new Date(challenge.endDate);
    const chStartLocal = new Date(chStart.getFullYear(), chStart.getMonth(), chStart.getDate());
    const chEndLocal = new Date(chEnd.getFullYear(), chEnd.getMonth(), chEnd.getDate());
    const DAY_MS = 24 * 60 * 60 * 1000;
    const durationDays = Math.max(1, Math.floor((chEndLocal.getTime() - chStartLocal.getTime()) / DAY_MS) + 1);

    const ucStart = new Date(userChallenge.startDate);
    const startLocal = new Date(ucStart.getFullYear(), ucStart.getMonth(), ucStart.getDate());
    const ucEnd = userChallenge.endDate ? new Date(userChallenge.endDate) : new Date(startLocal.getTime() + (durationDays - 1) * DAY_MS);
    const endLocal = new Date(ucEnd.getFullYear(), ucEnd.getMonth(), ucEnd.getDate());

    // Clamp calendar window to the official challenge bounds
    const calendarStart = new Date(Math.max(startLocal.getTime(), chStartLocal.getTime()));
    const calendarEnd = new Date(Math.min(endLocal.getTime(), chEndLocal.getTime()));

    if (calendarStart.getTime() > calendarEnd.getTime()) {
      res.status(400).json({
        success: false,
        message: 'Challenge participation window is invalid for this user.'
      });
      return;
    }

    const todayLocal = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const calendar = [] as any[];
    
    for (let date = new Date(calendarStart); date <= calendarEnd; date.setDate(date.getDate() + 1)) {
      const dateStr = toLocalDateStr(date);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const isToday = date.getTime() === todayLocal.getTime();
      const isPast = date.getTime() < todayLocal.getTime();
      const isFuture = date.getTime() > todayLocal.getTime();
      
      const submission = submissionsByDate.get(dateStr);
      
      let status: 'not_submitted' | 'submitted' | 'approved' | 'rejected' | 'locked' = 'not_submitted';
      if (isFuture) {
        status = 'locked';
      } else if (submission) {
        const submissionStatus = submission.status.toLowerCase();
        if (submissionStatus === 'pending') {
          status = 'submitted'; // Rename PENDING to submitted for frontend
        } else {
          status = submissionStatus as 'submitted' | 'approved' | 'rejected';
        }
      }
      
      calendar.push({
        date: dateStr,
        dayOfWeek,
        isToday,
        isPast,
        isFuture,
        status,
        submission: submission ? {
          id: submission.id,
          imageUrl: submission.imageUrl,
          description: submission.description,
          submissionDate: submission.submissionDate,
          reviewComments: submission.reviewComments,
          reviewedAt: submission.reviewedAt
        } : null,
        canSubmit:
          isToday &&
          !submission &&
          date.getTime() >= chStartLocal.getTime() &&
          date.getTime() <= chEndLocal.getTime()
      });
    }
    
    // Calculate statistics
    const totalDays = calendar.length;
    const submittedDays = calendar.filter(day => day.submission).length;
    const approvedDays = calendar.filter(day => day.status === 'approved').length;
    const rejectedDays = calendar.filter(day => day.status === 'rejected').length;
    const missedDays = calendar.filter(day => day.status === 'not_submitted' && day.isPast).length;

    res.json({
      success: true,
      data: {
        challenge: {
          id: challenge.id,
          title: challenge.title,
          startDate: chStartLocal,
          endDate: chEndLocal,
          duration: durationDays + ' days'
        },
        userChallenge: {
          id: userChallenge.id,
          progress: userChallenge.progress,
          stakeAmount: userChallenge.stakeAmount
        },
        calendar,
        statistics: {
          totalDays,
          submittedDays,
          approvedDays,
          rejectedDays,
          missedDays,
          completionRate: totalDays > 0 ? Math.round((approvedDays / totalDays) * 100) : 0
        }
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch challenge calendar',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}; 
