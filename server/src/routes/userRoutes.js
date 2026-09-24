import express from 'express';
import {
  getFriends,
  searchUsers,
  getChatRequests,
  sendChatRequest,
  acceptChatRequest,
  rejectChatRequest,
  cancelChatRequest,
  removeFriend
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getFriends);
router.get('/friends', protect, getFriends);
router.get('/search', protect, searchUsers);
router.get('/requests', protect, getChatRequests);
router.post('/requests', protect, sendChatRequest);
router.patch('/requests/:requestId/accept', protect, acceptChatRequest);
router.patch('/requests/:requestId/reject', protect, rejectChatRequest);
router.delete('/requests/:requestId', protect, cancelChatRequest);
router.delete('/friends/:friendId', protect, removeFriend);

export default router;
