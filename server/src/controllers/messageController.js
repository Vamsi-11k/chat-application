import mongoose from 'mongoose';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Helper function to populate message completely
export const populateMessageQuery = (query) => {
  return query
    .populate('sender', '_id username avatarColor')
    .populate('receiver', '_id username avatarColor')
    .populate('reactions.user', '_id username avatarColor')
    .populate({
      path: 'replyTo',
      select: '_id sender text deleted',
      populate: {
        path: 'sender',
        select: '_id username avatarColor'
      }
    });
};

export const getConversations = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;

  const conversations = await Conversation.find({
    participants: currentUserId
  })
    .populate('participants', '_id username email avatarColor isOnline lastSeen')
    .populate({
      path: 'lastMessage',
      populate: {
        path: 'sender receiver',
        select: '_id username avatarColor'
      }
    })
    .sort({ updatedAt: -1 });

  const formattedConversations = conversations.map((conv) => {
    const unreadCount = conv.unreadCounts?.get(currentUserId.toString()) || 0;
    const otherParticipant = conv.participants.find(
      (p) => p._id.toString() !== currentUserId.toString()
    );

    return {
      _id: conv._id,
      participants: conv.participants,
      otherParticipant,
      lastMessage: conv.lastMessage,
      unreadCount,
      updatedAt: conv.updatedAt,
      createdAt: conv.createdAt
    };
  });

  res.status(200).json({
    success: true,
    message: 'Conversations retrieved successfully',
    data: {
      conversations: formattedConversations
    }
  });
});

export const getMessages = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { userId: otherUserId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
    throw new ApiError(400, 'Invalid participant user ID');
  }

  const otherUser = await User.findById(otherUserId);
  if (!otherUser) {
    throw new ApiError(404, 'User not found');
  }

  const conversation = await Conversation.findOne({
    participants: { $all: [currentUserId, otherUserId] }
  });

  if (!conversation) {
    return res.status(200).json({
      success: true,
      message: 'No message history found',
      data: {
        messages: [],
        pagination: {
          page: 1,
          limit: 30,
          totalMessages: 0,
          totalPages: 0,
          hasMore: false
        }
      }
    });
  }

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));
  const skip = (page - 1) * limit;

  const totalMessages = await Message.countDocuments({ conversation: conversation._id });
  const totalPages = Math.ceil(totalMessages / limit);
  const hasMore = page < totalPages;

  // Retrieve descending to get the newest chunk, then reverse for chronological display
  const messagesQuery = Message.find({ conversation: conversation._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const messages = await populateMessageQuery(messagesQuery);
  const chronologicalMessages = messages.reverse();

  res.status(200).json({
    success: true,
    message: 'Messages retrieved successfully',
    data: {
      conversationId: conversation._id,
      messages: chronologicalMessages,
      pagination: {
        page,
        limit,
        totalMessages,
        totalPages,
        hasMore
      }
    }
  });
});

export const markMessagesAsRead = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { userId: senderId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(senderId)) {
    throw new ApiError(400, 'Invalid sender user ID');
  }

  const conversation = await Conversation.findOne({
    participants: { $all: [currentUserId, senderId] }
  });

  if (!conversation) {
    return res.status(200).json({
      success: true,
      message: 'Conversation not found, no messages to mark as read',
      data: null
    });
  }

  const readDate = new Date();

  await Message.updateMany(
    {
      conversation: conversation._id,
      sender: senderId,
      receiver: currentUserId,
      readAt: null
    },
    {
      $set: { readAt: readDate }
    }
  );

  // Reset unread count for current user
  if (conversation.unreadCounts) {
    conversation.unreadCounts.set(currentUserId.toString(), 0);
    await conversation.save();
  }

  res.status(200).json({
    success: true,
    message: 'Messages marked as read',
    data: {
      conversationId: conversation._id,
      readAt: readDate
    }
  });
});

// FEATURE 1: Edit Message
export const editMessage = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { id: messageId } = req.params;
  const { text } = req.body;

  if (!mongoose.Types.ObjectId.isValid(messageId)) {
    throw new ApiError(400, 'Invalid message ID');
  }

  if (!text || text.trim() === '') {
    throw new ApiError(400, 'Message text cannot be empty');
  }

  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, 'Message not found');
  }

  if (message.sender.toString() !== currentUserId.toString()) {
    throw new ApiError(403, 'Forbidden: You can only edit your own messages');
  }

  if (message.deleted) {
    throw new ApiError(400, 'Cannot edit a deleted message');
  }

  message.text = text.trim();
  message.edited = true;
  message.editedAt = new Date();
  await message.save();

  const populatedMessage = await populateMessageQuery(Message.findById(message._id));

  // Broadcast through socket
  const io = req.app.get('io');
  if (io) {
    io.to(message.sender.toString()).emit('message_edited', { message: populatedMessage });
    io.to(message.receiver.toString()).emit('message_edited', { message: populatedMessage });
  }

  res.status(200).json({
    success: true,
    message: 'Message edited successfully',
    data: {
      message: populatedMessage
    }
  });
});

// FEATURE 1: Soft-Delete Message
export const deleteMessage = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { id: messageId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(messageId)) {
    throw new ApiError(400, 'Invalid message ID');
  }

  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, 'Message not found');
  }

  if (message.sender.toString() !== currentUserId.toString()) {
    throw new ApiError(403, 'Forbidden: You can only delete your own messages');
  }

  message.deleted = true;
  message.deletedAt = new Date();
  message.text = '';
  await message.save();

  const populatedMessage = await populateMessageQuery(Message.findById(message._id));

  // Broadcast through socket
  const io = req.app.get('io');
  if (io) {
    io.to(message.sender.toString()).emit('message_deleted', {
      messageId: message._id,
      conversationId: message.conversation,
      message: populatedMessage
    });
    io.to(message.receiver.toString()).emit('message_deleted', {
      messageId: message._id,
      conversationId: message.conversation,
      message: populatedMessage
    });
  }

  res.status(200).json({
    success: true,
    message: 'Message deleted successfully',
    data: {
      message: populatedMessage
    }
  });
});

// FEATURE 2: Toggle Emoji Reaction
export const toggleReaction = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { id: messageId } = req.params;
  const { emoji } = req.body;

  if (!mongoose.Types.ObjectId.isValid(messageId)) {
    throw new ApiError(400, 'Invalid message ID');
  }

  if (!emoji || typeof emoji !== 'string') {
    throw new ApiError(400, 'Valid emoji is required');
  }

  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, 'Message not found');
  }

  if (message.deleted) {
    throw new ApiError(400, 'Cannot react to a deleted message');
  }

  // Verify user is a conversation participant
  const conversation = await Conversation.findById(message.conversation);
  if (!conversation || !conversation.participants.some((pId) => pId.toString() === currentUserId.toString())) {
    throw new ApiError(403, 'Forbidden: You are not a participant in this conversation');
  }

  // Check if user already reacted with this exact emoji
  const existingReactionIndex = message.reactions.findIndex(
    (r) => r.emoji === emoji && r.user.toString() === currentUserId.toString()
  );

  if (existingReactionIndex > -1) {
    // Remove (toggle off)
    message.reactions.splice(existingReactionIndex, 1);
  } else {
    // Add reaction
    message.reactions.push({
      emoji,
      user: currentUserId
    });
  }

  await message.save();

  const populatedMessage = await populateMessageQuery(Message.findById(message._id));

  // Broadcast reaction update
  const io = req.app.get('io');
  if (io) {
    io.to(message.sender.toString()).emit('message_reaction_updated', {
      messageId: message._id,
      conversationId: message.conversation,
      reactions: populatedMessage.reactions,
      message: populatedMessage
    });
    io.to(message.receiver.toString()).emit('message_reaction_updated', {
      messageId: message._id,
      conversationId: message.conversation,
      reactions: populatedMessage.reactions,
      message: populatedMessage
    });
  }

  res.status(200).json({
    success: true,
    message: 'Reaction updated successfully',
    data: {
      message: populatedMessage
    }
  });
});

// FEATURE 4: In-Thread Message Search
export const searchInConversation = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { userId: otherUserId } = req.params;
  const { q } = req.query;

  if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
    throw new ApiError(400, 'Invalid participant user ID');
  }

  if (!q || !q.trim()) {
    return res.status(200).json({
      success: true,
      message: 'Search query empty',
      data: {
        results: []
      }
    });
  }

  const conversation = await Conversation.findOne({
    participants: { $all: [currentUserId, otherUserId] }
  });

  if (!conversation) {
    return res.status(200).json({
      success: true,
      message: 'Conversation not found',
      data: {
        results: []
      }
    });
  }

  // Search non-deleted messages matching query string
  const searchQuery = q.trim();
  const searchRegex = new RegExp(searchQuery.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');

  const messages = await Message.find({
    conversation: conversation._id,
    deleted: false,
    text: { $regex: searchRegex }
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('sender', '_id username avatarColor');

  res.status(200).json({
    success: true,
    message: 'Search results retrieved',
    data: {
      conversationId: conversation._id,
      totalResults: messages.length,
      results: messages
    }
  });
});

// Clear all messages in a specific conversation
export const clearConversation = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { userId: otherUserId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
    throw new ApiError(400, 'Invalid participant user ID');
  }

  const conversation = await Conversation.findOne({
    participants: { $all: [currentUserId, otherUserId] }
  });

  if (!conversation) {
    return res.status(200).json({
      success: true,
      message: 'No conversation found to clear',
      data: null
    });
  }

  // Delete all messages belonging to this conversation
  await Message.deleteMany({ conversation: conversation._id });

  // Reset conversation last message and unread counts
  conversation.lastMessage = null;
  conversation.unreadCounts = new Map();
  await conversation.save();

  res.status(200).json({
    success: true,
    message: 'Chat history cleared successfully',
    data: {
      conversationId: conversation._id
    }
  });
});

// Delete a conversation completely
export const deleteConversation = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { userId: otherUserId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
    throw new ApiError(400, 'Invalid participant user ID');
  }

  const conversation = await Conversation.findOne({
    participants: { $all: [currentUserId, otherUserId] }
  });

  if (conversation) {
    // Delete all messages
    await Message.deleteMany({ conversation: conversation._id });
    // Delete conversation
    await Conversation.findByIdAndDelete(conversation._id);
  }

  res.status(200).json({
    success: true,
    message: 'Conversation deleted successfully',
    data: null
  });
});

// Clear all chats and conversations for current user
export const clearAllConversations = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;

  const conversations = await Conversation.find({
    participants: currentUserId
  });

  const conversationIds = conversations.map((c) => c._id);

  if (conversationIds.length > 0) {
    // Delete all messages for these conversations
    await Message.deleteMany({ conversation: { $in: conversationIds } });
    // Delete the conversations
    await Conversation.deleteMany({ _id: { $in: conversationIds } });
  }

  res.status(200).json({
    success: true,
    message: 'All conversations and chat histories cleared successfully',
    data: null
  });
});
