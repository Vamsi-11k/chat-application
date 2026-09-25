import express from 'express';
import {
  getConversations,
  getMessages,
  markMessagesAsRead,
  editMessage,
  deleteMessage,
  toggleReaction,
  searchInConversation,
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

// Feature 4: Search messages in thread
router.get('/:userId/search', protect, userIdParamValidator, searchInConversation);

// Feature 1: Edit & Soft Delete Messages
router.patch('/:id/edit', protect, editMessage);
router.delete('/:id/delete', protect, deleteMessage);

// Feature 2: Toggle Emoji Reaction
router.post('/:id/reactions', protect, toggleReaction);

// Core Conversation Endpoints
router.get('/:userId', protect, userIdParamValidator, paginationValidator, getMessages);
router.patch('/:userId/read', protect, userIdParamValidator, markMessagesAsRead);
router.delete('/:userId/clear', protect, userIdParamValidator, clearConversation);
router.delete('/:userId', protect, userIdParamValidator, deleteConversation);

export default router;
