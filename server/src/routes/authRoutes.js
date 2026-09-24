import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  signup,
  login,
  logout,
  refresh,
  getMe
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { signupValidator, loginValidator } from '../middleware/validate.js';

const router = express.Router();

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/signup', authLimiter, signupValidator, signup);
router.post('/login', authLimiter, loginValidator, login);
router.post('/logout', protect, logout);
router.post('/refresh', refresh);
router.get('/me', protect, getMe);

export default router;
