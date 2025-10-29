import { Router } from 'express';
import { 
  getUserProfile, 
  updateUserProfile, 
  signOutUser
} from '../controllers/user';
import { authenticate } from '../middleware/authMiddleware'; // Re-imported

const router = Router();

// Get user's profile (requires authentication)
router.get('/me', authenticate, getUserProfile);

// Update user's profile (requires authentication)
router.put('/me', authenticate, updateUserProfile);

// Sign out (requires authentication)
router.post('/signout', authenticate, signOutUser);

export default router; 