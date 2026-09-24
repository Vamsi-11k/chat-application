import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { ChatRequest } from '../models/ChatRequest.js';
import { Conversation } from '../models/Conversation.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Get accepted friends / contacts for the current user
export const getFriends = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;

  const user = await User.findById(currentUserId).populate(
    'friends',
    '_id username email avatarColor isOnline lastSeen createdAt'
  );

  const friends = user?.friends || [];

  res.status(200).json({
    success: true,
    message: 'Friends retrieved successfully',
    data: {
      friends
    }
  });
});

// Search users and return their connection status with the current user
export const searchUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const currentUserId = req.user._id;

  const searchQuery = q ? q.trim() : '';
  const filter = {
    _id: { $ne: currentUserId }
  };

  if (searchQuery) {
    filter.$or = [
      { username: { $regex: searchQuery, $options: 'i' } },
      { email: { $regex: searchQuery, $options: 'i' } }
    ];
  }

  const users = await User.find(filter)
    .select('_id username email avatarColor isOnline lastSeen')
    .limit(20);

  const currentUser = await User.findById(currentUserId);
  const friendIds = new Set((currentUser?.friends || []).map((id) => id.toString()));

  // Get all active requests involving current user
  const requests = await ChatRequest.find({
    $or: [{ sender: currentUserId }, { receiver: currentUserId }],
    status: 'pending'
  });

  const sentPendingIds = new Set(
    requests
      .filter((r) => r.sender.toString() === currentUserId.toString())
      .map((r) => r.receiver.toString())
  );

  const receivedPendingMap = new Map(
    requests
      .filter((r) => r.receiver.toString() === currentUserId.toString())
      .map((r) => [r.sender.toString(), r._id.toString()])
  );

  const formattedUsers = users.map((u) => {
    const uid = u._id.toString();
    let connectionStatus = 'none'; // 'friends' | 'pending_sent' | 'pending_received' | 'none'
    let requestId = null;

    if (friendIds.has(uid)) {
      connectionStatus = 'friends';
    } else if (sentPendingIds.has(uid)) {
      connectionStatus = 'pending_sent';
    } else if (receivedPendingMap.has(uid)) {
      connectionStatus = 'pending_received';
      requestId = receivedPendingMap.get(uid);
    }

    return {
      _id: u._id,
      username: u.username,
      email: u.email,
      avatarColor: u.avatarColor,
      isOnline: u.isOnline,
      lastSeen: u.lastSeen,
      connectionStatus,
      requestId
    };
  });

  res.status(200).json({
    success: true,
    message: 'Users retrieved successfully',
    data: {
      users: formattedUsers
    }
  });
});

// Get pending incoming and outgoing chat requests
export const getChatRequests = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;

  const incoming = await ChatRequest.find({
    receiver: currentUserId,
    status: 'pending'
  })
    .populate('sender', '_id username email avatarColor isOnline lastSeen')
    .sort({ createdAt: -1 });

  const outgoing = await ChatRequest.find({
    sender: currentUserId,
    status: 'pending'
  })
    .populate('receiver', '_id username email avatarColor isOnline lastSeen')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: 'Chat requests retrieved successfully',
    data: {
      incoming,
      outgoing
    }
  });
});

// Send a chat request to a user
export const sendChatRequest = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { targetUserId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    throw new ApiError(400, 'Invalid target user ID');
  }

  if (currentUserId.toString() === targetUserId.toString()) {
    throw new ApiError(400, 'You cannot send a chat request to yourself');
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw new ApiError(404, 'User not found');
  }

  const currentUser = await User.findById(currentUserId);
  if (currentUser.friends?.includes(targetUserId)) {
    throw new ApiError(400, 'You are already connected with this user');
  }

  // Check if there is already an existing request in either direction
  let existingRequest = await ChatRequest.findOne({
    $or: [
      { sender: currentUserId, receiver: targetUserId },
      { sender: targetUserId, receiver: currentUserId }
    ]
  });

  if (existingRequest) {
    if (existingRequest.status === 'pending') {
      if (existingRequest.sender.toString() === currentUserId.toString()) {
        throw new ApiError(400, 'You have already sent a request to this user');
      } else {
        // Automatically accept if the other person already requested
        existingRequest.status = 'accepted';
        await existingRequest.save();

        await User.findByIdAndUpdate(currentUserId, { $addToSet: { friends: targetUserId } });
        await User.findByIdAndUpdate(targetUserId, { $addToSet: { friends: currentUserId } });

        return res.status(200).json({
          success: true,
          message: 'Chat request accepted mutually',
          data: { request: existingRequest, autoAccepted: true }
        });
      }
    } else if (existingRequest.status === 'rejected') {
      // Re-send request if previously rejected
      existingRequest.sender = currentUserId;
      existingRequest.receiver = targetUserId;
      existingRequest.status = 'pending';
      await existingRequest.save();

      const populated = await ChatRequest.findById(existingRequest._id)
        .populate('sender', '_id username email avatarColor')
        .populate('receiver', '_id username email avatarColor');

      return res.status(201).json({
        success: true,
        message: 'Chat request sent successfully',
        data: { request: populated }
      });
    }
  }

  const newRequest = await ChatRequest.create({
    sender: currentUserId,
    receiver: targetUserId,
    status: 'pending'
  });

  const populated = await ChatRequest.findById(newRequest._id)
    .populate('sender', '_id username email avatarColor')
    .populate('receiver', '_id username email avatarColor');

  res.status(201).json({
    success: true,
    message: 'Chat request sent successfully',
    data: {
      request: populated
    }
  });
});

// Accept a chat request
export const acceptChatRequest = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { requestId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    throw new ApiError(400, 'Invalid request ID');
  }

  const request = await ChatRequest.findOne({
    _id: requestId,
    receiver: currentUserId,
    status: 'pending'
  });

  if (!request) {
    throw new ApiError(404, 'Chat request not found or already processed');
  }

  request.status = 'accepted';
  await request.save();

  // Add each user to the other's friends array
  await User.findByIdAndUpdate(currentUserId, { $addToSet: { friends: request.sender } });
  await User.findByIdAndUpdate(request.sender, { $addToSet: { friends: currentUserId } });

  // Ensure a conversation is created or ready
  let conversation = await Conversation.findOne({
    participants: { $all: [currentUserId, request.sender] }
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [currentUserId, request.sender],
      unreadCounts: {
        [currentUserId.toString()]: 0,
        [request.sender.toString()]: 0
      }
    });
  }

  const senderUser = await User.findById(request.sender).select(
    '_id username email avatarColor isOnline lastSeen'
  );

  res.status(200).json({
    success: true,
    message: 'Chat request accepted',
    data: {
      friend: senderUser,
      conversationId: conversation._id
    }
  });
});

// Reject a chat request
export const rejectChatRequest = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { requestId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    throw new ApiError(400, 'Invalid request ID');
  }

  const request = await ChatRequest.findOneAndDelete({
    _id: requestId,
    receiver: currentUserId
  });

  if (!request) {
    throw new ApiError(404, 'Chat request not found');
  }

  res.status(200).json({
    success: true,
    message: 'Chat request rejected',
    data: null
  });
});

// Cancel a sent chat request
export const cancelChatRequest = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { requestId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    throw new ApiError(400, 'Invalid request ID');
  }

  const request = await ChatRequest.findOneAndDelete({
    _id: requestId,
    sender: currentUserId
  });

  if (!request) {
    throw new ApiError(404, 'Chat request not found');
  }

  res.status(200).json({
    success: true,
    message: 'Chat request cancelled',
    data: null
  });
});

// Remove a friend
export const removeFriend = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { friendId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(friendId)) {
    throw new ApiError(400, 'Invalid friend ID');
  }

  await User.findByIdAndUpdate(currentUserId, { $pull: { friends: friendId } });
  await User.findByIdAndUpdate(friendId, { $pull: { friends: currentUserId } });

  // Delete chat request record
  await ChatRequest.deleteMany({
    $or: [
      { sender: currentUserId, receiver: friendId },
      { sender: friendId, receiver: currentUserId }
    ]
  });

  res.status(200).json({
    success: true,
    message: 'Friend removed successfully',
    data: null
  });
});

// Legacy backward-compatibility getUsers (now returns friends)
export const getUsers = getFriends;

