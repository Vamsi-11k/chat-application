import mongoose from 'mongoose';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

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
  const messages = await Message.find({ conversation: conversation._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', '_id username avatarColor')
    .populate('receiver', '_id username avatarColor');

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

