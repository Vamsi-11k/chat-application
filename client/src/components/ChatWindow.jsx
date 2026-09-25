import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft,
  MessagesSquare,
  MoreVertical,
  Eraser,
  Trash2,
  UserX,
  ShieldCheck,
  Search,
  X,
  CornerDownRight
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { ConfirmationModal } from './ConfirmationModal';
import { Spinner } from './Loader';

export const ChatWindow = ({
  selectedUser,
  messages,
  onSendMessage,
  onTyping,
  onStopTyping,
  isTyping,
  onBack,
  loadingMessages,
  loadingMore,
  hasMore,
  onLoadMore,
  onClearChat,
  onDeleteChat,
  onRemoveFriend,
  onEditMessage,
  onDeleteMessage,
  onToggleReaction
}) => {
  const { user: currentUser } = useAuth();
  const { isUserOnline } = useSocket();
  const [showMenu, setShowMenu] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);

  // In-Thread Search States (Feature 4)
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Delete message confirmation modal state
  const [deleteModalConfig, setDeleteModalConfig] = useState({
    isOpen: false,
    messageId: null
  });

  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const prevScrollHeightRef = useRef(0);

  // Auto-scroll to bottom on first load or when new message is received
  useEffect(() => {
    if (!loadingMore && !isSearchOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isSearchOpen]);

  // Maintain scroll position when prepending older messages
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight } = e.currentTarget;
    if (scrollTop === 0 && hasMore && !loadingMore) {
      prevScrollHeightRef.current = scrollHeight;
      onLoadMore();
    }
  };

  useEffect(() => {
    if (containerRef.current && prevScrollHeightRef.current > 0) {
      const newScrollHeight = containerRef.current.scrollHeight;
      containerRef.current.scrollTop = newScrollHeight - prevScrollHeightRef.current;
      prevScrollHeightRef.current = 0;
    }
  }, [messages]);

  // In-thread search API fetch
  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || !selectedUser) return;

    try {
      setSearching(true);
      const res = await api.get(`/messages/${selectedUser._id}/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchResults(res.data?.data?.results || []);
    } catch (err) {
      console.error('Failed to search in thread:', err);
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  // Scroll to and highlight a specific message
  const handleScrollToMessage = useCallback((messageId) => {
    const el = document.getElementById(`message-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMessageId(messageId);
      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 2500);
    } else {
      toast('Message is earlier in history. Scroll up to load older messages.', { icon: '📜' });
    }
  }, []);

  const triggerDeleteMessageConfirm = (messageId) => {
    setDeleteModalConfig({
      isOpen: true,
      messageId
    });
  };

  // Empty state when no contact is selected
  if (!selectedUser) {
    return (
      <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-slate-100/60 dark:bg-[#031714] p-8 text-center select-none transition-colors duration-200">
        <div className="w-20 h-20 rounded-3xl bg-white dark:bg-[#061e1a] border border-teal-100 dark:border-[#0f3d37] flex items-center justify-center text-teal-600 dark:text-teal-400 mb-4 shadow-xl shadow-teal-950/5">
          <MessagesSquare size={36} className="stroke-[2.2]" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Select a Conversation
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1.5 leading-relaxed">
          Choose a contact from the list on the left to start real-time 1-on-1 messaging.
        </p>
      </div>
    );
  }

  const isOnline = isUserOnline(selectedUser._id) || selectedUser.isOnline;

  return (
    <main className="flex-1 flex flex-col h-full bg-slate-100/60 dark:bg-[#031714] min-w-0 transition-colors duration-200 relative">
      
      {/* Active Chat Header */}
      <header className="px-4 sm:px-6 py-3.5 bg-white/95 dark:bg-[#051c18]/95 border-b border-teal-100/80 dark:border-[#0c3530]/80 flex items-center justify-between flex-shrink-0 z-10 backdrop-blur-md">
        <div className="flex items-center space-x-3.5 min-w-0">
          {/* Mobile Back Button */}
          <button
            onClick={onBack}
            aria-label="Back to conversations"
            className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-300 rounded-lg hover:bg-teal-50 dark:hover:bg-[#092a25] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Contact Avatar & Online Status Dot */}
          <div className="relative flex-shrink-0">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-md text-sm"
              style={{ backgroundColor: selectedUser.avatarColor || '#0d9488' }}
            >
              {selectedUser.username.charAt(0).toUpperCase()}
            </div>
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-[#051c18] ${
                isOnline ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-slate-400 dark:bg-slate-500'
              }`}
            />
          </div>

          {/* Contact Username & Live Presence */}
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate flex items-center space-x-1.5">
              <span>{selectedUser.username}</span>
              <ShieldCheck size={14} className="text-teal-600 dark:text-teal-400 inline shrink-0" />
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isOnline ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Online</span>
              ) : (
                'Offline'
              )}
            </p>
          </div>
        </div>

        {/* Header Action Buttons (Search & Options) */}
        <div className="flex items-center space-x-1">
          {/* In-Thread Search Trigger (Feature 4) */}
          <button
            onClick={() => {
              setIsSearchOpen(!isSearchOpen);
              if (!isSearchOpen) setSearchResults([]);
            }}
            title="Search in this conversation"
            aria-label="Search conversation"
            className={`p-2 rounded-xl transition-colors ${
              isSearchOpen
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:text-slate-400 dark:hover:text-teal-300 dark:hover:bg-[#092a25]'
            }`}
          >
            <Search size={18} />
          </button>

          {/* Chat Actions Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              title="Chat Options"
              aria-label="Chat Options"
              className="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:text-slate-400 dark:hover:text-teal-300 dark:hover:bg-[#092a25] rounded-xl transition-colors"
            >
              <MoreVertical size={18} />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-[#061e1a] border border-teal-100 dark:border-[#0f3d37] rounded-2xl shadow-2xl shadow-black/50 py-1.5 z-50 animate-fadeIn">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onClearChat();
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-[#0e2f29] flex items-center space-x-2.5 transition-colors"
                  >
                    <Eraser size={15} />
                    <span>Clear Chat Messages</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDeleteChat();
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-[#0e2f29] flex items-center space-x-2.5 transition-colors"
                  >
                    <Trash2 size={15} />
                    <span>Delete Conversation</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onRemoveFriend();
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-50 dark:hover:bg-[#0e2f29] flex items-center space-x-2.5 transition-colors border-t border-slate-100 dark:border-[#0f3d37]/80 mt-1"
                  >
                    <UserX size={15} />
                    <span>Remove Contact</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* In-Thread Search Panel Bar (Feature 4) */}
      {isSearchOpen && (
        <div className="bg-white dark:bg-[#072420] border-b border-teal-100 dark:border-[#0c3530] p-3 shadow-sm animate-fadeIn">
          <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-600 dark:text-teal-400" />
              <input
                type="text"
                placeholder="Search messages in this thread..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-[#0a2f2a] border border-teal-100 dark:border-[#103a33] rounded-full pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={searching || !searchQuery.trim()}
              className="px-4 py-2 rounded-full bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
            >
              {searching ? <Spinner size={14} /> : 'Search'}
            </button>

            <button
              type="button"
              onClick={() => setIsSearchOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </form>

          {/* Search Results List */}
          {searchResults.length > 0 && (
            <div className="mt-2.5 max-h-48 overflow-y-auto space-y-1.5 pt-2 border-t border-teal-100/60 dark:border-[#0f3d37]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 px-1">
                Found {searchResults.length} {searchResults.length === 1 ? 'match' : 'matches'}
              </p>
              {searchResults.map((result) => (
                <button
                  key={result._id}
                  onClick={() => handleScrollToMessage(result._id)}
                  className="w-full text-left p-2 rounded-xl bg-slate-50 dark:bg-[#092a25]/60 hover:bg-teal-50 dark:hover:bg-[#0c332e] border border-teal-100/60 dark:border-[#103a33] transition-colors flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="text-[11px] font-semibold text-teal-800 dark:text-teal-300">
                      {result.sender?.username || 'User'}:
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-200 truncate mt-0.5">
                      {result.text}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {format(new Date(result.createdAt), 'MMM d, p')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages Scroll Thread Area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-1.5"
      >
        {/* Load More Older Messages Spinner */}
        {loadingMore && (
          <div className="flex justify-center py-2">
            <Spinner size={20} className="text-teal-600 dark:text-teal-400" />
          </div>
        )}

        {loadingMessages ? (
          <div className="flex h-full items-center justify-center">
            <Spinner size={28} className="text-teal-600 dark:text-teal-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-8 select-none">
            <div className="p-4 rounded-3xl bg-white dark:bg-[#061e1a] text-teal-600 dark:text-teal-400 mb-3 border border-teal-100 dark:border-[#0f3d37] shadow-xs">
              <MessagesSquare size={32} />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No messages yet
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Say hello to start the conversation with {selectedUser.username}!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const senderId =
              typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
            const isOwn = senderId === currentUser._id;
            return (
              <MessageBubble
                key={msg._id || `${msg.createdAt}-${msg.text}`}
                message={msg}
                isOwn={isOwn}
                currentUserId={currentUser._id}
                onReply={(m) => setReplyingTo(m)}
                onEdit={onEditMessage}
                onDelete={triggerDeleteMessageConfirm}
                onToggleReaction={onToggleReaction}
                onScrollToMessage={handleScrollToMessage}
                isHighlighted={highlightedMessageId === msg._id}
              />
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Live Typing Indicator */}
      {isTyping && <TypingIndicator username={selectedUser.username} />}

      {/* Message Input Bar with Quote-Reply Banner */}
      <MessageInput
        onSendMessage={onSendMessage}
        onTyping={onTyping}
        onStopTyping={onStopTyping}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        disabled={loadingMessages}
      />

      {/* Confirmation Modal for Message Deletion */}
      <ConfirmationModal
        isOpen={deleteModalConfig.isOpen}
        onClose={() => setDeleteModalConfig({ isOpen: false, messageId: null })}
        onConfirm={() => {
          if (deleteModalConfig.messageId) {
            onDeleteMessage(deleteModalConfig.messageId);
          }
          setDeleteModalConfig({ isOpen: false, messageId: null });
        }}
        title="Delete Message?"
        message="Are you sure you want to delete this message? It will be replaced with a deleted notice in the thread."
        confirmText="Delete Message"
        isDanger={true}
      />
    </main>
  );
};
