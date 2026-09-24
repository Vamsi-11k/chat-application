import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';

// Map of userId -> Set of active socket IDs
const onlineUsers = new Map();

// Helper to parse cookies from handshake headers
const parseCookies = (cookieHeader) => {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    if (parts.length === 2) {
      cookies[parts[0].trim()] = decodeURIComponent(parts[1].trim());
    }
  });
  return cookies;
};

export const initSocket = (io) => {
  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      if (!token && socket.handshake.headers.cookie) {
        const cookies = parseCookies(socket.handshake.headers.cookie);
        token = cookies.accessToken;
      }

      if (!token) {
        return next(new Error('Authentication error: Token not provided'));
      }

      const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'access_default_secret_key_123';
      const decoded = jwt.verify(token, secret);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();

    // Register user socket
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Join a personal room named after the userId for targeted messaging
    socket.join(userId);

    // Update user online status in database & broadcast to others
    await User.findByIdAndUpdate(userId, { isOnline: true });
    io.emit('user_online', { userId });

    // 1. Send Message Event
    socket.on('send_message', async (data, callback) => {
      try {
        const { receiverId, text } = data;

        if (!receiverId || !text || text.trim() === '') {
          if (callback) callback({ success: false, error: 'Receiver and text are required' });
          return;
        }

        // Check if users are connected/friends
        const senderDoc = await User.findById(userId);
        const isFriend = senderDoc?.friends?.some((fId) => fId.toString() === receiverId.toString());

        if (!isFriend) {
          if (callback) callback({ success: false, error: 'You must send a chat request and be accepted before messaging this user.' });
          return;
        }

        // Find or create conversation
        let conversation = await Conversation.findOne({
          participants: { $all: [userId, receiverId] }
        });

        if (!conversation) {
          conversation = await Conversation.create({
            participants: [userId, receiverId],
            unreadCounts: {
              [userId]: 0,
              [receiverId]: 0
            }
          });
        }

        // Save Message to DB
        const newMessage = await Message.create({
          conversation: conversation._id,
          sender: userId,
          receiver: receiverId,
          text: text.trim()
        });

        // Update unread count for receiver
        const currentUnread = conversation.unreadCounts?.get(receiverId) || 0;
        if (!conversation.unreadCounts) {
          conversation.unreadCounts = new Map();
        }
        conversation.unreadCounts.set(receiverId, currentUnread + 1);
        conversation.lastMessage = newMessage._id;
        await conversation.save();

        const populatedMessage = await Message.findById(newMessage._id)
          .populate('sender', '_id username avatarColor')
          .populate('receiver', '_id username avatarColor');

        // Emit to receiver's room and sender's room (to sync across all tabs)
        io.to(receiverId).emit('receive_message', {
          message: populatedMessage,
          conversationId: conversation._id
        });

        io.to(userId).emit('message_sent', {
          message: populatedMessage,
          conversationId: conversation._id
        });

        if (callback) {
          callback({ success: true, message: populatedMessage });
        }
      } catch (error) {
        console.error('Socket send_message error:', error);
        if (callback) callback({ success: false, error: error.message });
      }
    });

    // 2. Chat Request Events
    socket.on('send_chat_request', ({ receiverId, request }) => {
      if (receiverId) {
        io.to(receiverId).emit('receive_chat_request', {
          request,
          sender: socket.user
        });
      }
    });

    socket.on('accept_chat_request', ({ senderId, request, friend }) => {
      if (senderId) {
        io.to(senderId).emit('chat_request_accepted', {
          friend: socket.user,
          acceptedBy: socket.user
        });
      }
    });

    socket.on('reject_chat_request', ({ senderId, requestId }) => {
      if (senderId) {
        io.to(senderId).emit('chat_request_rejected', {
          requestId,
          rejectedBy: socket.user._id
        });
      }
    });

    // 3. Clear Chat Event
    socket.on('clear_chat', ({ receiverId }) => {
      if (receiverId) {
        io.to(receiverId).emit('chat_cleared', { clearedBy: userId });
        io.to(userId).emit('chat_cleared', { clearedBy: userId });
      }
    });

    // 4. Delete Chat Event
    socket.on('delete_chat', ({ receiverId }) => {
      if (receiverId) {
        io.to(receiverId).emit('chat_deleted', { deletedBy: userId });
        io.to(userId).emit('chat_deleted', { deletedBy: userId });
      }
    });

    // 5. Clear All Chats Event
    socket.on('clear_all_chats', () => {
      io.to(userId).emit('all_chats_cleared');
    });

    // 6. Typing Indicator
    socket.on('typing', ({ receiverId }) => {
      if (receiverId) {
        io.to(receiverId).emit('typing', {
          senderId: userId,
          username: socket.user.username
        });
      }
    });

    // 7. Stop Typing Indicator
    socket.on('stop_typing', ({ receiverId }) => {
      if (receiverId) {
        io.to(receiverId).emit('stop_typing', {
          senderId: userId
        });
      }
    });

    // 8. Message Read Acknowledgement
    socket.on('message_read', async ({ senderId }) => {
      try {
        if (!senderId) return;

        const conversation = await Conversation.findOne({
          participants: { $all: [userId, senderId] }
        });

        if (!conversation) return;

        const readDate = new Date();
        await Message.updateMany(
          {
            conversation: conversation._id,
            sender: senderId,
            receiver: userId,
            readAt: null
          },
          {
            $set: { readAt: readDate }
          }
        );

        if (conversation.unreadCounts) {
          conversation.unreadCounts.set(userId, 0);
          await conversation.save();
        }

        // Notify sender that their sent messages were read
        io.to(senderId).emit('message_read', {
          readBy: userId,
          conversationId: conversation._id,
          readAt: readDate
        });
      } catch (error) {
        console.error('Socket message_read error:', error);
      }
    });

    // 5. Disconnect Event
    socket.on('disconnect', async () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          const lastSeen = new Date();
          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen
          });
          io.emit('user_offline', { userId, lastSeen });
        }
      }
    });
  });
};
