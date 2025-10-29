import express from 'express';
import { saveUser, getCurrentUser, verifyToken } from '../controllers/auth/authController';
import { authenticate } from '../middleware/authMiddleware'; // Re-imported

const router = express.Router();
router.post('/save-user', saveUser);

router.post('/verify-token', verifyToken);

router.get('/me', authenticate, getCurrentUser);

export default router;