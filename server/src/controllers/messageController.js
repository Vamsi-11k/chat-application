import mongoose from 'mongoose';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { StarredMessage } from '../models/StarredMessage.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Helper function to populate message completely
export const populateMessageQuery = (query) => {
  return query
    .populate('sender', '_id username avatarColor')
    .populate('receiver', '_id username avatarColor')
    .populate('reactions.user', '_id username avatarColor')
    .populate('pinnedBy', '_id username avatarColor')
    .populate('forwardedFrom.originalSender', '_id username avatarColor')
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

// FEATURE 1: Soft-Delete Message (Automatically unpins if pinned)
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

  const wasPinned = message.pinned;

  message.deleted = true;
  message.deletedAt = new Date();
  message.text = '';
  message.pinned = false;
  message.pinnedBy = null;
  message.pinnedAt = null;
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

    if (wasPinned) {
      io.to(message.sender.toString()).emit('message_unpinned', {
        messageId: message._id,
        conversationId: message.conversation
      });
      io.to(message.receiver.toString()).emit('message_unpinned', {
        messageId: message._id,
        conversationId: message.conversation
      });
    }
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
      user: currentUserId,
      reactedAt: new Date()
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

// FEATURE: Message Forwarding
export const forwardMessage = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { id: messageId } = req.params;
  const { targetConversationIds } = req.body;

  if (!mongoose.Types.ObjectId.isValid(messageId)) {
    throw new ApiError(400, 'Invalid source message ID');
  }

  if (!Array.isArray(targetConversationIds) || targetConversationIds.length === 0) {
    throw new ApiError(400, 'Please select at least one target conversation to forward to');
  }

  // Validate original message
  const originalMessage = await Message.findById(messageId).populate('sender', 'username avatarColor');
  if (!originalMessage) {
    throw new ApiError(404, 'Message not found');
  }

  if (originalMessage.deleted) {
    throw new ApiError(400, 'Cannot forward a deleted message');
  }

  // Verify the requesting user is a participant in the original message's conversation
  const sourceConversation = await Conversation.findById(originalMessage.conversation);
  if (
    !sourceConversation ||
    !sourceConversation.participants.some((pId) => pId.toString() === currentUserId.toString())
  ) {
    throw new ApiError(403, 'Forbidden: You are not a participant in the original message conversation');
  }

  // Original sender attribution details (preserve root attribution if already forwarded)
  const origSenderId =
    originalMessage.forwardedFrom?.originalSender || originalMessage.sender?._id || originalMessage.sender;
  const origSenderName =
    originalMessage.forwardedFrom?.originalSenderName || originalMessage.sender?.username || 'Unknown';

  const io = req.app.get('io');
  const createdMessages = [];

  for (const targetConvId of targetConversationIds) {
    if (!mongoose.Types.ObjectId.isValid(targetConvId)) continue;

    const targetConv = await Conversation.findById(targetConvId);
    if (
      !targetConv ||
      !targetConv.participants.some((pId) => pId.toString() === currentUserId.toString())
    ) {
      // Skip conversations user is not a participant in (enforce friend gating)
      continue;
    }

    const receiverId = targetConv.participants.find(
      (pId) => pId.toString() !== currentUserId.toString()
    );
    if (!receiverId) continue;

    // Create fresh message copy with forwardedFrom attribution (no reactions, no replyTo, fresh read status)
    const newMsg = await Message.create({
      conversation: targetConv._id,
      sender: currentUserId,
      receiver: receiverId,
      text: originalMessage.text,
      forwardedFrom: {
        originalSender: origSenderId,
        originalSenderName: origSenderName,
        originalConversationId: sourceConversation._id
      }
    });

    // Update target conversation metadata
    targetConv.lastMessage = newMsg._id;
    if (!targetConv.unreadCounts) targetConv.unreadCounts = new Map();
    const currentUnread = targetConv.unreadCounts.get(receiverId.toString()) || 0;
    targetConv.unreadCounts.set(receiverId.toString(), currentUnread + 1);
    await targetConv.save();

    const populatedMsg = await populateMessageQuery(Message.findById(newMsg._id));
    createdMessages.push(populatedMsg);

    // Emit standard new_message event for both participants so thread and sidebar update live
    if (io) {
      io.to(receiverId.toString()).emit('new_message', {
        message: populatedMsg,
        conversationId: targetConv._id
      });
      io.to(currentUserId.toString()).emit('new_message', {
        message: populatedMsg,
        conversationId: targetConv._id
      });
    }
  }

  res.status(201).json({
    success: true,
    message: `Message forwarded to ${createdMessages.length} conversation(s)`,
    data: {
      forwardedMessages: createdMessages
    }
  });
});

// FEATURE: Pinned Messages (Shared per-conversation, Max 5 Limit with Block)
export const pinMessage = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { id: messageId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(messageId)) {
    throw new ApiError(400, 'Invalid message ID');
  }

  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, 'Message not found');
  }

  if (message.deleted) {
    throw new ApiError(400, 'Cannot pin a deleted message');
  }

  const conversation = await Conversation.findById(message.conversation);
  if (
    !conversation ||
    !conversation.participants.some((pId) => pId.toString() === currentUserId.toString())
  ) {
    throw new ApiError(403, 'Forbidden: You are not a participant in this conversation');
  }

  if (message.pinned) {
    const populated = await populateMessageQuery(Message.findById(message._id));
    return res.status(200).json({
      success: true,
      message: 'Message is already pinned',
      data: { message: populated }
    });
  }

  // Enforce Max 5 Pins per conversation: Block new pins if limit reached
  const activePinsCount = await Message.countDocuments({
    conversation: message.conversation,
    pinned: true,
    deleted: false
  });

  if (activePinsCount >= 5) {
    throw new ApiError(400, 'Maximum 5 pinned messages reached. Unpin a message to pin another.');
  }

  message.pinned = true;
  message.pinnedBy = currentUserId;
  message.pinnedAt = new Date();
  await message.save();

  const populatedMessage = await populateMessageQuery(Message.findById(message._id));

  // Emit message_pinned event to both participants
  const io = req.app.get('io');
  if (io) {
    io.to(message.sender.toString()).emit('message_pinned', {
      message: populatedMessage,
      conversationId: message.conversation
    });
    io.to(message.receiver.toString()).emit('message_pinned', {
      message: populatedMessage,
      conversationId: message.conversation
    });
  }

  res.status(200).json({
    success: true,
    message: 'Message pinned successfully',
    data: {
      message: populatedMessage
    }
  });
});

export const unpinMessage = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { id: messageId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(messageId)) {
    throw new ApiError(400, 'Invalid message ID');
  }

  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, 'Message not found');
  }

  const conversation = await Conversation.findById(message.conversation);
  if (
    !conversation ||
    !conversation.participants.some((pId) => pId.toString() === currentUserId.toString())
  ) {
    throw new ApiError(403, 'Forbidden: You are not a participant in this conversation');
  }

  message.pinned = false;
  message.pinnedBy = null;
  message.pinnedAt = null;
  await message.save();

  const populatedMessage = await populateMessageQuery(Message.findById(message._id));

  // Emit message_unpinned event to both participants
  const io = req.app.get('io');
  if (io) {
    io.to(message.sender.toString()).emit('message_unpinned', {
      messageId: message._id,
      conversationId: message.conversation
    });
    io.to(message.receiver.toString()).emit('message_unpinned', {
      messageId: message._id,
      conversationId: message.conversation
    });
  }

  res.status(200).json({
    success: true,
    message: 'Message unpinned successfully',
    data: {
      message: populatedMessage
    }
  });
});

export const getPinnedMessages = asyncHandler(async (req, res) => {
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
      message: 'No pinned messages found',
      data: { pinnedMessages: [] }
    });
  }

  const pinnedQuery = Message.find({
    conversation: conversation._id,
    pinned: true,
    deleted: false
  }).sort({ pinnedAt: -1 });

  const pinnedMessages = await populateMessageQuery(pinnedQuery);

  res.status(200).json({
    success: true,
    message: 'Pinned messages retrieved',
    data: {
      conversationId: conversation._id,
      pinnedMessages
    }
  });
});

// FEATURE: Starred Messages (Personal, Private, Multi-tab synced)
export const starMessage = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { id: messageId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(messageId)) {
    throw new ApiError(400, 'Invalid message ID');
  }

  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, 'Message not found');
  }

  const conversation = await Conversation.findById(message.conversation);
  if (
    !conversation ||
    !conversation.participants.some((pId) => pId.toString() === currentUserId.toString())
  ) {
    throw new ApiError(403, 'Forbidden: You are not a participant in this conversation');
  }

  const starred = await StarredMessage.findOneAndUpdate(
    { user: currentUserId, message: messageId },
    {
      user: currentUserId,
      message: messageId,
      conversation: message.conversation,
      starredAt: new Date()
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Sync to the user's own sockets across all their devices/tabs
  const io = req.app.get('io');
  if (io) {
    io.to(currentUserId.toString()).emit('message_starred', {
      messageId: message._id,
      conversationId: message.conversation
    });
  }

  res.status(200).json({
    success: true,
    message: 'Message starred successfully',
    data: {
      starredId: starred._id,
      messageId: message._id
    }
  });
});

export const unstarMessage = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { id: messageId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(messageId)) {
    throw new ApiError(400, 'Invalid message ID');
  }

  await StarredMessage.findOneAndDelete({
    user: currentUserId,
    message: messageId
  });

  // Sync to user's personal socket room
  const io = req.app.get('io');
  if (io) {
    io.to(currentUserId.toString()).emit('message_unstarred', {
      messageId
    });
  }

  res.status(200).json({
    success: true,
    message: 'Message unstarred successfully',
    data: { messageId }
  });
});

export const getStarredMessages = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;

  const starredDocs = await StarredMessage.find({ user: currentUserId })
    .populate({
      path: 'message',
      populate: [
        { path: 'sender', select: '_id username avatarColor' },
        { path: 'receiver', select: '_id username avatarColor' },
        { path: 'forwardedFrom.originalSender', select: '_id username' }
      ]
    })
    .populate({
      path: 'conversation',
      populate: {
        path: 'participants',
        select: '_id username avatarColor isOnline'
      }
    })
    .sort({ createdAt: -1 });

  // Format list with otherParticipant info for consolidated view
  const formatted = starredDocs
    .filter((doc) => doc.message) // Filter out any completely vanished messages
    .map((doc) => {
      const otherParticipant = doc.conversation?.participants?.find(
        (p) => p._id.toString() !== currentUserId.toString()
      );

      return {
        _id: doc._id,
        message: doc.message,
        conversationId: doc.conversation?._id,
        otherParticipant,
        starredAt: doc.starredAt || doc.createdAt
      };
    });

  res.status(200).json({
    success: true,
    message: 'Starred messages retrieved',
    data: {
      starredMessages: formatted
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
  // Also clean up any starred messages in this conversation
  await StarredMessage.deleteMany({ conversation: conversation._id });

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
    // Delete all messages and stars
    await Message.deleteMany({ conversation: conversation._id });
    await StarredMessage.deleteMany({ conversation: conversation._id });
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
    await StarredMessage.deleteMany({ conversation: { $in: conversationIds } });
    // Delete the conversations
    await Conversation.deleteMany({ _id: { $in: conversationIds } });
  }

  res.status(200).json({
    success: true,
    message: 'All conversations and chat histories cleared successfully',
    data: null
  });
});
