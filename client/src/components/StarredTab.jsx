import React, { useState } from 'react';
import { Star, Search, Trash2, ArrowRight, CornerDownRight, Forward, MessagesSquare } from 'lucide-react';
import { format } from 'date-fns';
import { Spinner } from './Loader';

export const StarredTab = ({
  starredMessages = [],
  loading = false,
  onUnstarMessage,
  onSelectStarredMessage,
  searchQuery = '',
  setSearchQuery
}) => {
  const [localSearch, setLocalSearch] = useState('');

  const filteredStarred = starredMessages.filter((item) => {
    const q = (searchQuery || localSearch).toLowerCase().trim();
    if (!q) return true;
    const text = item.message?.text?.toLowerCase() || '';
    const username = item.otherParticipant?.username?.toLowerCase() || '';
    const sender = item.message?.sender?.username?.toLowerCase() || '';
    return text.includes(q) || username.includes(q) || sender.includes(q);
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Search Bar for Starred Messages */}
      <div className="p-4 sm:p-5 border-b border-teal-100/70 dark:border-[#0c3530]/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
              <Star size={17} className="fill-amber-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Starred Messages
              </h2>
              <p className="text-[10px] text-slate-400">
                {starredMessages.length} saved {starredMessages.length === 1 ? 'message' : 'messages'}
              </p>
            </div>
          </div>
        </div>

        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-teal-400/60"
          />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search starred messages..."
            className="w-full bg-white dark:bg-[#082420] border border-teal-100 dark:border-[#103a33] rounded-full pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
          />
        </div>
      </div>

      {/* Starred Messages List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Spinner size={24} className="text-teal-600 dark:text-teal-400 mb-3" />
            <span className="text-xs text-slate-400">Loading starred messages...</span>
          </div>
        ) : filteredStarred.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 text-center select-none mt-10">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-400/80 flex items-center justify-center mb-3">
              <Star size={28} />
            </div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
              No Starred Messages
            </h4>
            <p className="text-[11px] text-slate-400 max-w-[200px] mt-1 leading-relaxed">
              Hover over any message and click the star icon to save important notes here.
            </p>
          </div>
        ) : (
          filteredStarred.map((item) => {
            const msg = item.message;
            const isDeleted = !msg || msg.deleted;
            const otherUser = item.otherParticipant;
            const formattedDate = item.starredAt
              ? format(new Date(item.starredAt), 'MMM d, h:mm a')
              : '';

            return (
              <div
                key={item._id}
                className="group relative p-3 rounded-2xl bg-white dark:bg-[#071f1a] border border-teal-100/80 dark:border-[#0e352f] hover:border-teal-300 dark:hover:border-teal-600/60 shadow-xs hover:shadow-md transition-all cursor-pointer"
                onClick={() => {
                  if (onSelectStarredMessage && otherUser) {
                    onSelectStarredMessage({
                      otherParticipant: otherUser,
                      messageId: msg?._id,
                      conversationId: item.conversationId
                    });
                  }
                }}
              >
                {/* Header info */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                      style={{ backgroundColor: otherUser?.avatarColor || '#0d9488' }}
                    >
                      {otherUser?.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {otherUser?.username || 'Direct Message'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <span className="text-[10px] text-slate-400">{formattedDate}</span>
                    <button
                      type="button"
                      title="Unstar message"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (msg?._id) onUnstarMessage(msg._id);
                      }}
                      className="p-1 rounded-full text-amber-500 hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#0c2a25] transition-colors"
                    >
                      <Star size={13} className="fill-amber-500" />
                    </button>
                  </div>
                </div>

                {/* Forwarded Tag if truly forwarded */}
                {!isDeleted && Boolean(msg?.forwardedFrom?.originalSender || msg?.forwardedFrom?.originalSenderName || msg?.forwardedFrom?.originalConversationId) && (
                  <div className="flex items-center space-x-1 text-[10px] text-teal-600 dark:text-teal-400 mb-1 font-medium">
                    <Forward size={11} />
                    <span>
                      Forwarded
                      {msg.forwardedFrom.originalSenderName
                        ? ` from ${msg.forwardedFrom.originalSenderName}`
                        : ''}
                    </span>
                  </div>
                )}

                {/* Message preview snippet */}
                <p
                  className={`text-xs leading-relaxed line-clamp-3 ${
                    isDeleted
                      ? 'italic text-slate-400 dark:text-slate-500'
                      : 'text-slate-700 dark:text-slate-200 font-normal'
                  }`}
                >
                  {isDeleted ? 'Original message was deleted' : msg.text}
                </p>

                {/* Action footer */}
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-[#0d2e28] flex items-center justify-end text-[10px] text-teal-600 dark:text-teal-400 group-hover:underline font-semibold space-x-1">
                  <span>Jump to message</span>
                  <ArrowRight size={11} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
