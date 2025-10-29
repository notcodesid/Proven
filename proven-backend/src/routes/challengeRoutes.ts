import express from 'express';
import {
  getAllChallenges,
  getChallengeById,
  joinChallenge,
  getUserChallenges,
  createChallenge,
  checkUserChallenge,
  completeChallenge,
  getChallengeResults,
  getStakeQuote,
} from '../controllers/challenge';
import { completeChallengePayouts } from '../controllers/challenge/completeChallengePayouts';
import { CreateChallengeSchema, JoinChallengeSchema } from '../schemas/challenge';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/adminGuard';

const router = express.Router();

// Public routes
router.get('/', getAllChallenges);

// User routes (require authentication)
router.get('/user', authenticate, getUserChallenges);
router.post('/join', authenticate, validateRequest(JoinChallengeSchema), joinChallenge);
router.get('/:id/stake-quote', authenticate, getStakeQuote);
router.get('/:challengeId/check', authenticate, checkUserChallenge);
router.get('/:challengeId/results', authenticate, getChallengeResults);
// Temporarily disabled for debugging
// router.post('/:challengeId/claim-rewards', authenticate, claimRewards);

// Admin routes (require authentication - can add admin middleware later)
router.post('/create', authenticate, requireAdmin, validateRequest(CreateChallengeSchema), createChallenge);
router.post('/:challengeId/complete', authenticate, completeChallenge);
router.post('/:challengeId/complete-payouts', authenticate, requireAdmin, completeChallengePayouts);
// Temporarily disabled for debugging
// router.post('/:challengeId/settle', authenticate, requireAdmin, settleChallenge);

// Public dynamic route (must be last to avoid conflicts)
router.get('/:id', getChallengeById);

export default router; 