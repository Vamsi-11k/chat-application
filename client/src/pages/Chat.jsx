import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Sidebar } from '../components/Sidebar';
import { ChatWindow } from '../components/ChatWindow';
import { AddFriendModal } from '../components/AddFriendModal';
import { ConfirmationModal } from '../components/ConfirmationModal';

export const Chat = () => {
  const { user: currentUser } = useAuth();
  const { socket } = useSocket();

  const [friends, setFriends] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Requests state
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestActionLoading, setRequestActionLoading] = useState({});

  // Modals state
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    isDanger: true,
    action: null
  });
  const [modalLoading, setModalLoading] = useState(false);

  // 1. Fetch Friends (Accepted Contacts)
  const fetchFriends = useCallback(async () => {
    try {
      setLoadingFriends(true);
      const res = await api.get('/users/friends');
      setFriends(res.data?.data?.friends || []);
    } catch (err) {
      console.error('Failed to fetch friends:', err);
    } finally {
      setLoadingFriends(false);
    }
  }, []);

  // 2. Fetch Chat Requests
  const fetchRequests = useCallback(async () => {
    try {
      setLoadingRequests(true);
      const res = await api.get('/users/requests');
      setIncomingRequests(res.data?.data?.incoming || []);
      setOutgoingRequests(res.data?.data?.outgoing || []);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  // 3. Fetch Conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/messages/conversations');
      setConversations(res.data?.data?.conversations || []);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
    fetchRequests();
    fetchConversations();
  }, [fetchFriends, fetchRequests, fetchConversations]);

  // 4. Fetch Messages for Selected User
  const fetchMessages = useCallback(async (userId, pageNumber = 1, append = false) => {
    try {
      if (pageNumber === 1) setLoadingMessages(true);
      else setLoadingMore(true);

      const res = await api.get(`/messages/${userId}?page=${pageNumber}&limit=30`);
      const data = res.data?.data;
      const newMessages = data?.messages || [];

      if (append) {
        setMessages((prev) => [...newMessages, ...prev]);
      } else {
        setMessages(newMessages);
      }

      setHasMore(data?.pagination?.hasMore || false);
      setPage(pageNumber);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoadingMessages(false);
      setLoadingMore(false);
    }
  }, []);

  // 5. Mark Messages as Read
  const markAsRead = useCallback(async (userId) => {
    try {
      await api.patch(`/messages/${userId}/read`);
      if (socket) {
        socket.emit('message_read', { senderId: userId });
      }
      setConversations((prev) =>
        prev.map((c) =>
          c.otherParticipant?._id === userId ? { ...c, unreadCount: 0 } : c
        )
      );
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  }, [socket]);

  // When a user is selected
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setIsTyping(false);
    fetchMessages(user._id, 1, false);
    markAsRead(user._id);
  };

  const handleBackToSidebar = () => {
    setSelectedUser(null);
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore && selectedUser) {
      fetchMessages(selectedUser._id, page + 1, true);
    }
  };

  // 6. Send Message Action
  const handleSendMessage = (text) => {
    if (!socket || !selectedUser) return;

    socket.emit('send_message', {
      receiverId: selectedUser._id,
      text
    }, (response) => {
      if (response && !response.success) {
        toast.error(response.error || 'Failed to send message');
      }
    });
  };

  // 7. Typing Indicators
  const handleTyping = () => {
    if (socket && selectedUser) {
      socket.emit('typing', { receiverId: selectedUser._id });
    }
  };

  const handleStopTyping = () => {
    if (socket && selectedUser) {
      socket.emit('stop_typing', { receiverId: selectedUser._id });
    }
  };

  // 8. Request Management Handlers
  const handleAcceptRequest = async (requestId) => {
    setRequestActionLoading((prev) => ({ ...prev, [requestId]: true }));
    try {
      const res = await api.patch(`/users/requests/${requestId}/accept`);
      toast.success('Chat request accepted!');

      const friend = res.data?.data?.friend;
      if (socket && friend) {
        socket.emit('accept_chat_request', { senderId: friend._id, friend });
      }

      fetchFriends();
      fetchRequests();
      fetchConversations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept request');
    } finally {
      setRequestActionLoading((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const handleRejectRequest = async (requestId) => {
    setRequestActionLoading((prev) => ({ ...prev, [requestId]: true }));
    try {
      await api.patch(`/users/requests/${requestId}/reject`);
      toast.success('Chat request declined');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to decline request');
    } finally {
      setRequestActionLoading((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const handleCancelRequest = async (requestId) => {
    setRequestActionLoading((prev) => ({ ...prev, [requestId]: true }));
    try {
      await api.delete(`/users/requests/${requestId}`);
      toast.success('Chat request cancelled');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel request');
    } finally {
      setRequestActionLoading((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  // 9. Clear and Delete Chat Handlers
  const triggerClearChatModal = () => {
    if (!selectedUser) return;
    setModalConfig({
      isOpen: true,
      title: 'Clear Chat Messages?',
      message: `Are you sure you want to delete all messages with ${selectedUser.username}? This cannot be undone.`,
      confirmText: 'Clear Messages',
      isDanger: true,
      action: async () => {
        try {
          setModalLoading(true);
          await api.delete(`/messages/${selectedUser._id}/clear`);
          setMessages([]);
          toast.success('Chat messages cleared');
          if (socket) {
            socket.emit('clear_chat', { receiverId: selectedUser._id });
          }
          fetchConversations();
          setModalConfig((prev) => ({ ...prev, isOpen: false }));
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to clear chat');
        } finally {
          setModalLoading(false);
        }
      }
    });
  };

  const triggerDeleteChatModal = () => {
    if (!selectedUser) return;
    setModalConfig({
      isOpen: true,
      title: 'Delete Conversation?',
      message: `Are you sure you want to delete your conversation with ${selectedUser.username}? All messages and conversation records will be removed.`,
      confirmText: 'Delete Conversation',
      isDanger: true,
      action: async () => {
        try {
          setModalLoading(true);
          await api.delete(`/messages/${selectedUser._id}`);
          setMessages([]);
          setSelectedUser(null);
          toast.success('Conversation deleted');
          if (socket) {
            socket.emit('delete_chat', { receiverId: selectedUser._id });
          }
          fetchConversations();
          setModalConfig((prev) => ({ ...prev, isOpen: false }));
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to delete conversation');
        } finally {
          setModalLoading(false);
        }
      }
    });
  };

  const triggerClearAllModal = () => {
    setModalConfig({
      isOpen: true,
      title: 'Clear All Chats & Histories?',
      message: 'Are you sure you want to clear all conversation histories across all contacts? This action is permanent.',
      confirmText: 'Clear All Chats',
      isDanger: true,
      action: async () => {
        try {
          setModalLoading(true);
          await api.delete('/messages/clear-all');
          setMessages([]);
          setConversations([]);
          setSelectedUser(null);
          toast.success('All conversations cleared');
          if (socket) {
            socket.emit('clear_all_chats');
          }
          setModalConfig((prev) => ({ ...prev, isOpen: false }));
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to clear all chats');
        } finally {
          setModalLoading(false);
        }
      }
    });
  };

  const triggerRemoveFriendModal = () => {
    if (!selectedUser) return;
    setModalConfig({
      isOpen: true,
      title: `Remove ${selectedUser.username}?`,
      message: `Are you sure you want to remove ${selectedUser.username} from your contacts? You will need to send a new chat request to message each other again.`,
      confirmText: 'Remove Contact',
      isDanger: true,
      action: async () => {
        try {
          setModalLoading(true);
          await api.delete(`/users/friends/${selectedUser._id}`);
          toast.success(`Removed ${selectedUser.username} from contacts`);
          setSelectedUser(null);
          setMessages([]);
          fetchFriends();
          fetchConversations();
          setModalConfig((prev) => ({ ...prev, isOpen: false }));
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to remove friend');
        } finally {
          setModalLoading(false);
        }
      }
    });
  };

  // 10. Socket Event Listeners
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = ({ message, conversationId }) => {
      const senderId =
        typeof message.sender === 'object' ? message.sender._id : message.sender;

      // If open with this sender, append message and mark as read
      if (selectedUser && selectedUser._id === senderId) {
        setMessages((prev) => [...prev, message]);
        markAsRead(senderId);
      } else {
        toast((t) => (
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => {
              toast.dismiss(t.id);
              const senderObj =
                typeof message.sender === 'object'
                  ? message.sender
                  : friends.find((f) => f._id === senderId);
              if (senderObj) handleSelectUser(senderObj);
            }}
          >
            <span className="font-semibold text-indigo-400">
              {message.sender?.username || 'New message'}:
            </span>
            <span className="truncate max-w-[180px]">{message.text}</span>
          </div>
        ));
      }

      fetchConversations();
    };

    const handleMessageSent = ({ message }) => {
      const receiverId =
        typeof message.receiver === 'object' ? message.receiver._id : message.receiver;

      if (selectedUser && selectedUser._id === receiverId) {
        setMessages((prev) => [...prev, message]);
      }

      fetchConversations();
    };

    const handleUserTyping = ({ senderId }) => {
      if (selectedUser && selectedUser._id === senderId) {
        setIsTyping(true);
      }
    };

    const handleUserStopTyping = ({ senderId }) => {
      if (selectedUser && selectedUser._id === senderId) {
        setIsTyping(false);
      }
    };

    const handleMessageRead = ({ readBy, readAt }) => {
      if (selectedUser && selectedUser._id === readBy) {
        setMessages((prev) =>
          prev.map((msg) => (!msg.readAt ? { ...msg, readAt } : msg))
        );
      }
    };

    // Chat Request received
    const handleReceiveChatRequest = ({ sender }) => {
      toast.success(`New chat request from ${sender?.username || 'a user'}!`);
      fetchRequests();
    };

    // Chat Request accepted
    const handleChatRequestAccepted = ({ friend, acceptedBy }) => {
      toast.success(`${acceptedBy?.username || 'User'} accepted your chat request!`);
      fetchFriends();
      fetchRequests();
      fetchConversations();
    };

    // Chat Cleared
    const handleChatCleared = ({ clearedBy }) => {
      if (selectedUser && (selectedUser._id === clearedBy || currentUser._id === clearedBy)) {
        setMessages([]);
      }
      fetchConversations();
    };

    // Chat Deleted
    const handleChatDeleted = ({ deletedBy }) => {
      if (selectedUser && (selectedUser._id === deletedBy || currentUser._id === deletedBy)) {
        setSelectedUser(null);
        setMessages([]);
      }
      fetchConversations();
    };

    // All Chats Cleared
    const handleAllChatsCleared = () => {
      setSelectedUser(null);
      setMessages([]);
      setConversations([]);
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('message_sent', handleMessageSent);
    socket.on('typing', handleUserTyping);
    socket.on('stop_typing', handleUserStopTyping);
    socket.on('message_read', handleMessageRead);
    socket.on('receive_chat_request', handleReceiveChatRequest);
    socket.on('chat_request_accepted', handleChatRequestAccepted);
    socket.on('chat_cleared', handleChatCleared);
    socket.on('delete_chat', handleChatDeleted);
    socket.on('all_chats_cleared', handleAllChatsCleared);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('message_sent', handleMessageSent);
      socket.off('typing', handleUserTyping);
      socket.off('stop_typing', handleUserStopTyping);
      socket.off('message_read', handleMessageRead);
      socket.off('receive_chat_request', handleReceiveChatRequest);
      socket.off('chat_request_accepted', handleChatRequestAccepted);
      socket.off('chat_cleared', handleChatCleared);
      socket.off('delete_chat', handleChatDeleted);
      socket.off('all_chats_cleared', handleAllChatsCleared);
    };
  }, [socket, selectedUser, currentUser._id, friends, markAsRead, fetchConversations, fetchFriends, fetchRequests]);

  // Filter friends based on search query
  const filteredFriends = friends.filter((f) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      f.username.toLowerCase().includes(query) ||
      f.email?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-slate-950">
      {/* Sidebar: visible on desktop, or mobile when no chat is selected */}
      <div
        className={`${
          selectedUser ? 'hidden md:flex' : 'flex'
        } w-full md:w-auto h-full flex-shrink-0`}
      >
        <Sidebar
          friends={filteredFriends}
          conversations={conversations}
          selectedUser={selectedUser}
          onSelectUser={handleSelectUser}
          loadingFriends={loadingFriends}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenAddFriend={() => setIsAddFriendOpen(true)}
          onOpenClearAllModal={triggerClearAllModal}
          incomingRequests={incomingRequests}
          outgoingRequests={outgoingRequests}
          onAcceptRequest={handleAcceptRequest}
          onRejectRequest={handleRejectRequest}
          onCancelRequest={handleCancelRequest}
          loadingRequests={loadingRequests}
          requestActionLoading={requestActionLoading}
        />
      </div>

      {/* Chat Window: visible on desktop, or mobile when chat is selected */}
      <div
        className={`${
          !selectedUser ? 'hidden md:flex' : 'flex'
        } flex-1 h-full min-w-0`}
      >
        <ChatWindow
          selectedUser={selectedUser}
          messages={messages}
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          onStopTyping={handleStopTyping}
          isTyping={isTyping}
          onBack={handleBackToSidebar}
          loadingMessages={loadingMessages}
          loadingMore={loadingMore}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onClearChat={triggerClearChatModal}
          onDeleteChat={triggerDeleteChatModal}
          onRemoveFriend={triggerRemoveFriendModal}
        />
      </div>

      {/* Add Friend / Search Users Modal */}
      <AddFriendModal
        isOpen={isAddFriendOpen}
        onClose={() => setIsAddFriendOpen(false)}
        onRequestSent={() => {
          fetchRequests();
          if (socket) {
            socket.emit('send_chat_request', {});
          }
        }}
        onFriendAdded={() => {
          fetchFriends();
          fetchRequests();
          fetchConversations();
        }}
      />

      {/* Reusable Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.action}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        isDanger={modalConfig.isDanger}
        isLoading={modalLoading}
      />
    </div>
  );
};
