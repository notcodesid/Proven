import { z } from 'zod';

export const SubmitProofSchema = z.object({
  userChallengeId: z.string().uuid(),
  imageUrl: z.string().min(1),
  imagePath: z.string().optional(),
  description: z.string().max(500).optional(),
});

export const ReviewSubmissionSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewComments: z.string().max(500).optional(),
});

export const CreateSignedUploadSchema = z.object({
  challengeId: z.string().uuid(),
  contentType: z.string().min(1), // e.g. image/png
});


