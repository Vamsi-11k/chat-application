import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Sidebar } from '../components/Sidebar';
import { ChatWindow } from '../components/ChatWindow';
import { AddFriendModal } from '../components/AddFriendModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { ForwardModal } from '../components/ForwardModal';

export const Chat = () => {
  const { user: currentUser } = useAuth();
  const { socket } = useSocket();

  const [friends, setFriends] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [starredMessages, setStarredMessages] = useState([]);
  const [loadingStarred, setLoadingStarred] = useState(false);
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
  const [forwardModalState, setForwardModalState] = useState({
    isOpen: false,
    message: null
  });
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    isDanger: true,
    action: null
  });
  const [modalLoading, setModalLoading] = useState(false);

  // Set of starred message IDs for O(1) lookups
  const starredMessageIds = useMemo(() => {
    const set = new Set();
    starredMessages.forEach((s) => {
      if (s.message?._id) set.add(s.message._id);
    });
    return set;
  }, [starredMessages]);

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

  // 4. Fetch Personal Starred Messages
  const fetchStarredMessages = useCallback(async () => {
    try {
      setLoadingStarred(true);
      const res = await api.get('/messages/starred');
      setStarredMessages(res.data?.data?.starredMessages || []);
    } catch (err) {
      console.error('Failed to fetch starred messages:', err);
    } finally {
      setLoadingStarred(false);
    }
  }, []);

  // 5. Fetch Pinned Messages in Active Conversation
  const fetchPinnedMessages = useCallback(async (userId) => {
    if (!userId) {
      setPinnedMessages([]);
      return;
    }
    try {
      const res = await api.get(`/messages/${userId}/pins`);
      setPinnedMessages(res.data?.data?.pinnedMessages || []);
    } catch (err) {
      console.error('Failed to fetch pinned messages:', err);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
    fetchRequests();
    fetchConversations();
    fetchStarredMessages();
  }, [fetchFriends, fetchRequests, fetchConversations, fetchStarredMessages]);

  // 6. Fetch Messages for Selected User
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

  // 7. Mark Messages as Read
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
    fetchPinnedMessages(user._id);
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

  // 8. Send Message Action (Supports replyTo)
  const handleSendMessage = (text, replyToId = null) => {
    if (!socket || !selectedUser) return;

    socket.emit('send_message', {
      receiverId: selectedUser._id,
      text,
      replyTo: replyToId
    }, (response) => {
      if (response && !response.success) {
        toast.error(response.error || 'Failed to send message');
      }
    });
  };

  // 9. Edit Message Action
  const handleEditMessage = (messageId, newText) => {
    if (!socket || !messageId || !newText.trim()) return;

    socket.emit('edit_message', {
      messageId,
      text: newText.trim()
    }, (response) => {
      if (response && !response.success) {
        toast.error(response.error || 'Failed to edit message');
      } else {
        toast.success('Message updated');
      }
    });
  };

  // 10. Delete Message Action (Soft-Delete)
  const handleDeleteMessage = (messageId) => {
    if (!socket || !messageId) return;

    socket.emit('delete_message', {
      messageId
    }, (response) => {
      if (response && !response.success) {
        toast.error(response.error || 'Failed to delete message');
      } else {
        toast.success('Message deleted');
      }
    });
  };

  // 11. Toggle Reaction Action
  const handleToggleReaction = (messageId, emoji) => {
    if (!socket || !messageId || !emoji) return;

    socket.emit('toggle_reaction', {
      messageId,
      emoji
    }, (response) => {
      if (response && !response.success) {
        toast.error(response.error || 'Failed to update reaction');
      }
    });
  };

  // 12. Message Forwarding
  const handleOpenForwardModal = (message) => {
    setForwardModalState({
      isOpen: true,
      message
    });
  };

  // 13. Pin / Unpin Actions
  const handlePinMessage = async (messageId) => {
    try {
      const res = await api.post(`/messages/${messageId}/pin`);
      const pinnedMsg = res.data?.data?.message;
      toast.success('Message pinned');
      if (pinnedMsg) {
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? { ...m, pinned: true, pinnedBy: pinnedMsg.pinnedBy } : m))
        );
        if (selectedUser) fetchPinnedMessages(selectedUser._id);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to pin message');
    }
  };

  const handleUnpinMessage = async (messageId) => {
    try {
      await api.post(`/messages/${messageId}/unpin`);
      toast.success('Message unpinned');
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, pinned: false, pinnedBy: null } : m))
      );
      if (selectedUser) fetchPinnedMessages(selectedUser._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unpin message');
    }
  };

  // 14. Star / Unstar Actions
  const handleStarMessage = async (messageId) => {
    try {
      await api.post(`/messages/${messageId}/star`);
      toast.success('Message starred');
      fetchStarredMessages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to star message');
    }
  };

  const handleUnstarMessage = async (messageId) => {
    try {
      await api.delete(`/messages/${messageId}/star`);
      toast.success('Message unstarred');
      fetchStarredMessages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unstar message');
    }
  };

  // 15. Navigate to Starred Message in Context
  const handleSelectStarredMessage = async ({ otherParticipant, messageId, conversationId }) => {
    if (!otherParticipant) return;

    // Switch selected user if not active
    if (!selectedUser || selectedUser._id !== otherParticipant._id) {
      setSelectedUser(otherParticipant);
      await fetchMessages(otherParticipant._id, 1, false);
      await fetchPinnedMessages(otherParticipant._id);
      markAsRead(otherParticipant._id);
    }

    // Scroll to message in thread
    setTimeout(() => {
      const el = document.getElementById(`message-${messageId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200);
  };

  // 16. Typing Indicators
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

  // 17. Request Management Handlers
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

  // 18. Clear and Delete Chat Handlers
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
          setPinnedMessages([]);
          toast.success('Chat messages cleared');
          if (socket) {
            socket.emit('clear_chat', { receiverId: selectedUser._id });
          }
          fetchConversations();
          fetchStarredMessages();
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
      message: `Are you sure you want to delete your conversation with ${selectedUser.username}? All messages and records will be removed.`,
      confirmText: 'Delete Conversation',
      isDanger: true,
      action: async () => {
        try {
          setModalLoading(true);
          await api.delete(`/messages/${selectedUser._id}`);
          setMessages([]);
          setPinnedMessages([]);
          setSelectedUser(null);
          toast.success('Conversation deleted');
          if (socket) {
            socket.emit('delete_chat', { receiverId: selectedUser._id });
          }
          fetchConversations();
          fetchStarredMessages();
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
          setPinnedMessages([]);
          setConversations([]);
          setStarredMessages([]);
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
          setPinnedMessages([]);
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

  // 19. Socket Event Listeners
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
            <span className="font-semibold text-teal-400">
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

    // Real-Time Message Pinned
    const handleMessagePinned = ({ message, conversationId }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === message._id ? { ...m, pinned: true, pinnedBy: message.pinnedBy } : m))
      );
      if (selectedUser) {
        fetchPinnedMessages(selectedUser._id);
      }
    };

    // Real-Time Message Unpinned
    const handleMessageUnpinned = ({ messageId, conversationId }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, pinned: false, pinnedBy: null } : m))
      );
      if (selectedUser) {
        fetchPinnedMessages(selectedUser._id);
      }
    };

    // Real-Time Message Starred (User's private socket)
    const handleMessageStarred = () => {
      fetchStarredMessages();
    };

    // Real-Time Message Unstarred
    const handleMessageUnstarred = () => {
      fetchStarredMessages();
    };

    // Real-Time Message Edited
    const handleMessageEdited = ({ message }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === message._id ? { ...m, ...message } : m))
      );
      if (selectedUser) fetchPinnedMessages(selectedUser._id);
      fetchConversations();
      fetchStarredMessages();
    };

    // Real-Time Message Deleted
    const handleMessageDeleted = ({ messageId, message }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, deleted: true, text: '', deletedAt: new Date(), pinned: false } : m
        )
      );
      if (selectedUser) fetchPinnedMessages(selectedUser._id);
      fetchConversations();
      fetchStarredMessages();
    };

    // Real-Time Reaction Updated
    const handleReactionUpdated = ({ messageId, reactions, message }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? { ...m, reactions: reactions || message?.reactions || [] }
            : m
        )
      );
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
        setPinnedMessages([]);
      }
      fetchConversations();
      fetchStarredMessages();
    };

    // Chat Deleted
    const handleChatDeleted = ({ deletedBy }) => {
      if (selectedUser && (selectedUser._id === deletedBy || currentUser._id === deletedBy)) {
        setSelectedUser(null);
        setMessages([]);
        setPinnedMessages([]);
      }
      fetchConversations();
      fetchStarredMessages();
    };

    // All Chats Cleared
    const handleAllChatsCleared = () => {
      setSelectedUser(null);
      setMessages([]);
      setPinnedMessages([]);
      setConversations([]);
      setStarredMessages([]);
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('new_message', handleReceiveMessage);
    socket.on('message_sent', handleMessageSent);
    socket.on('message_pinned', handleMessagePinned);
    socket.on('message_unpinned', handleMessageUnpinned);
    socket.on('message_starred', handleMessageStarred);
    socket.on('message_unstarred', handleMessageUnstarred);
    socket.on('message_edited', handleMessageEdited);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('message_reaction_updated', handleReactionUpdated);
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
      socket.off('new_message', handleReceiveMessage);
      socket.off('message_sent', handleMessageSent);
      socket.off('message_pinned', handleMessagePinned);
      socket.off('message_unpinned', handleMessageUnpinned);
      socket.off('message_starred', handleMessageStarred);
      socket.off('message_unstarred', handleMessageUnstarred);
      socket.off('message_edited', handleMessageEdited);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('message_reaction_updated', handleReactionUpdated);
      socket.off('typing', handleUserTyping);
      socket.off('stop_typing', handleUserStopTyping);
      socket.off('message_read', handleMessageRead);
      socket.off('receive_chat_request', handleReceiveChatRequest);
      socket.off('chat_request_accepted', handleChatRequestAccepted);
      socket.off('chat_cleared', handleChatCleared);
      socket.off('delete_chat', handleChatDeleted);
      socket.off('all_chats_cleared', handleAllChatsCleared);
    };
  }, [socket, selectedUser, currentUser._id, friends, markAsRead, fetchConversations, fetchFriends, fetchRequests, fetchPinnedMessages, fetchStarredMessages]);

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-transparent transition-colors duration-200 relative">
      {/* Sidebar: Columns 1 & 2 (visible on desktop or mobile when no chat is open) */}
      <div
        className={`${
          selectedUser ? 'hidden md:flex' : 'flex'
        } w-full md:w-auto h-full flex-shrink-0 z-20`}
      >
        <Sidebar
          friends={friends}
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
          starredMessages={starredMessages}
          loadingStarred={loadingStarred}
          onUnstarMessage={handleUnstarMessage}
          onSelectStarredMessage={handleSelectStarredMessage}
        />
      </div>

      {/* Chat Window: Column 3 (visible on desktop or mobile when chat is open) */}
      <div
        className={`${
          !selectedUser ? 'hidden md:flex' : 'flex'
        } flex-1 h-full min-w-0 relative z-10`}
      >
        <ChatWindow
          selectedUser={selectedUser}
          messages={messages}
          pinnedMessages={pinnedMessages}
          starredMessageIds={starredMessageIds}
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
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
          onToggleReaction={handleToggleReaction}
          onForwardMessage={handleOpenForwardModal}
          onPinMessage={handlePinMessage}
          onUnpinMessage={handleUnpinMessage}
          onStarMessage={handleStarMessage}
          onUnstarMessage={handleUnstarMessage}
        />
      </div>

      {/* Message Forwarding Modal */}
      <ForwardModal
        isOpen={forwardModalState.isOpen}
        onClose={() => setForwardModalState({ isOpen: false, message: null })}
        message={forwardModalState.message}
        friends={friends}
        conversations={conversations}
        onForwardSuccess={() => {
          fetchConversations();
          if (selectedUser) fetchMessages(selectedUser._id, 1, false);
        }}
      />

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
