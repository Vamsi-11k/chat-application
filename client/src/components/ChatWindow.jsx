import React, { useRef, useEffect, useState } from 'react';
import {
  ArrowLeft,
  MessagesSquare,
  MoreVertical,
  Eraser,
  Trash2,
  UserX,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
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
  onRemoveFriend
}) => {
  const { user: currentUser } = useAuth();
  const { isUserOnline } = useSocket();
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const prevScrollHeightRef = useRef(0);

  // Auto-scroll to bottom on first load or when new message is received
  useEffect(() => {
    if (!loadingMore) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

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
    <main className="flex-1 flex flex-col h-full bg-slate-100/60 dark:bg-[#031714] min-w-0 transition-colors duration-200">
      
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
      </header>

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
              />
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Live Typing Indicator */}
      {isTyping && <TypingIndicator username={selectedUser.username} />}

      {/* Message Input Bar */}
      <MessageInput
        onSendMessage={onSendMessage}
        onTyping={onTyping}
        onStopTyping={onStopTyping}
        disabled={loadingMessages}
      />
    </main>
  );
};
