import express from 'express';
import {
  getConversations,
  getMessages,
  markMessagesAsRead,
  clearConversation,
  deleteConversation,
  clearAllConversations
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  userIdParamValidator,
  paginationValidator
} from '../middleware/validate.js';

const router = express.Router();

router.get('/conversations', protect, getConversations);
router.delete('/clear-all', protect, clearAllConversations);
router.get('/:userId', protect, userIdParamValidator, paginationValidator, getMessages);
router.patch('/:userId/read', protect, userIdParamValidator, markMessagesAsRead);
router.delete('/:userId/clear', protect, userIdParamValidator, clearConversation);
router.delete('/:userId', protect, userIdParamValidator, deleteConversation);

export default router;
