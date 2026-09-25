import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Check,
  CheckCheck,
  Smile,
  Reply,
  Pencil,
  Trash2,
  CornerDownRight
} from 'lucide-react';

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export const MessageBubble = ({
  message,
  isOwn,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onToggleReaction,
  onScrollToMessage,
  isHighlighted = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text || '');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const formattedTime = message.createdAt
    ? format(new Date(message.createdAt), 'h:mm a')
    : '';

  const isRead = !!message.readAt;
  const isDeleted = !!message.deleted;
  const isEdited = !!message.edited && !isDeleted;

  // Group reactions: Map of emoji -> { emoji, count, hasReacted, usernames: [] }
  const reactionGroups = (message.reactions || []).reduce((acc, r) => {
    if (!acc[r.emoji]) {
      acc[r.emoji] = {
        emoji: r.emoji,
        count: 0,
        hasReacted: false,
        usernames: []
      };
    }
    acc[r.emoji].count += 1;
    const rUserId = typeof r.user === 'object' ? r.user._id?.toString() : r.user?.toString();
    if (rUserId === currentUserId?.toString()) {
      acc[r.emoji].hasReacted = true;
    }
    const username = typeof r.user === 'object' ? r.user.username : null;
    if (username) {
      acc[r.emoji].usernames.push(username);
    }
    return acc;
  }, {});

  const reactionList = Object.values(reactionGroups);
  const hasReactions = reactionList.length > 0 && !isDeleted;

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editText.trim() || editText.trim() === message.text) {
      setIsEditing(false);
      return;
    }
    onEdit(message._id, editText.trim());
    setIsEditing(false);
  };

  return (
    <div
      id={`message-${message._id}`}
      className={`group relative flex w-full ${
        isOwn ? 'justify-end' : 'justify-start'
      } ${hasReactions ? 'mb-4 mt-1' : 'my-1'} transition-all duration-300 ${
        isHighlighted ? 'ring-2 ring-teal-400 dark:ring-teal-300 rounded-2xl bg-teal-500/10 dark:bg-teal-500/20 p-1' : ''
      }`}
    >
      <div className={`relative max-w-[85%] sm:max-w-[70%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        
        {/* Floating Action Menu Bar (Appears on Hover for BOTH Sent & Received Messages) */}
        {!isDeleted && !isEditing && (
          <div
            className={`absolute -top-7 ${
              isOwn ? 'right-2' : 'left-2'
            } hidden group-hover:flex items-center space-x-1 bg-white/95 dark:bg-[#061e1a]/95 border border-teal-100 dark:border-[#0f3d37] px-1.5 py-0.5 rounded-full shadow-lg z-20 backdrop-blur-md animate-fadeIn`}
          >
            {/* Reaction Trigger Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                title="React to message"
                aria-label="React to message"
                className="p-1 text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 rounded-full hover:bg-teal-50 dark:hover:bg-[#0c2a25] transition-colors"
              >
                <Smile size={14} />
              </button>

              {/* Compact Floating Emoji Palette (WhatsApp Style 6 Emojis) */}
              {showEmojiPicker && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowEmojiPicker(false)} />
                  <div
                    className={`absolute bottom-full mb-1.5 ${
                      isOwn ? 'right-0' : 'left-0'
                    } flex items-center space-x-1 bg-white/95 dark:bg-[#061e1a]/95 border border-teal-100 dark:border-[#0f3d37] p-1.5 rounded-full shadow-2xl z-40 backdrop-blur-md animate-scaleUp`}
                  >
                    {COMMON_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          onToggleReaction(message._id, emoji);
                          setShowEmojiPicker(false);
                        }}
                        className="w-7 h-7 flex items-center justify-center hover:scale-130 transition-transform text-base active:scale-95"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Reply Action (Available for Both Sent & Received) */}
            <button
              type="button"
              onClick={() => onReply(message)}
              title="Reply to message"
              aria-label="Reply to message"
              className="p-1 text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 rounded-full hover:bg-teal-50 dark:hover:bg-[#0c2a25] transition-colors"
            >
              <Reply size={14} />
            </button>

            {/* Edit Action (Sender Only) */}
            {isOwn && (
              <button
                type="button"
                onClick={() => {
                  setEditText(message.text);
                  setIsEditing(true);
                }}
                title="Edit message"
                aria-label="Edit message"
                className="p-1 text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 rounded-full hover:bg-teal-50 dark:hover:bg-[#0c2a25] transition-colors"
              >
                <Pencil size={13} />
              </button>
            )}

            {/* Delete Action (Sender Only) */}
            {isOwn && (
              <button
                type="button"
                onClick={() => onDelete(message._id)}
                title="Delete message"
                aria-label="Delete message"
                className="p-1 text-slate-400 hover:text-rose-500 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        )}

        {/* Message Bubble Body */}
        <div
          className={`relative px-4 py-2.5 rounded-2xl shadow-xs text-sm break-words transition-all duration-150 ${
            isDeleted
              ? 'bg-slate-100 dark:bg-[#071d19]/80 text-slate-400 dark:text-slate-500 border border-slate-200/60 dark:border-[#0e352f]/60 italic rounded-2xl'
              : isOwn
              ? 'bg-teal-600 text-white rounded-br-xs shadow-teal-600/20 shadow-md'
              : 'bg-white dark:bg-[#0c2a25] text-slate-800 dark:text-slate-100 border border-teal-100/80 dark:border-[#14423a] rounded-bl-xs shadow-xs'
          }`}
        >
          {/* Quote-Reply Header Banner */}
          {message.replyTo && !isDeleted && (
            <div
              onClick={() => {
                if (onScrollToMessage && message.replyTo?._id) {
                  onScrollToMessage(message.replyTo._id);
                }
              }}
              className={`mb-2 p-2 rounded-xl text-xs cursor-pointer border-l-3 transition-opacity hover:opacity-85 ${
                isOwn
                  ? 'bg-teal-700/60 border-teal-300 text-teal-100'
                  : 'bg-teal-50 dark:bg-[#07201c] border-teal-500 text-slate-600 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center space-x-1 font-semibold text-[11px] text-teal-300 dark:text-teal-400">
                <CornerDownRight size={11} />
                <span>
                  {typeof message.replyTo.sender === 'object'
                    ? message.replyTo.sender.username
                    : 'Replying to message'}
                </span>
              </div>
              <p className="truncate mt-0.5 text-[11px] opacity-90">
                {message.replyTo.deleted
                  ? 'Original message was deleted'
                  : message.replyTo.text}
              </p>
            </div>
          )}

          {/* Inline Edit Mode */}
          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="space-y-2 min-w-[220px]">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={2}
                className="w-full p-2 bg-white dark:bg-[#051c18] border border-teal-200 dark:border-teal-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
                autoFocus
              />
              <div className="flex items-center justify-end space-x-1.5">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:opacity-80 transition-opacity"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editText.trim()}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-teal-500 text-white font-medium hover:bg-teal-400 transition-colors disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </form>
          ) : isDeleted ? (
            /* Deleted notice */
            <p className="select-none flex items-center space-x-1 text-xs">
              <span>This message was deleted</span>
            </p>
          ) : (
            /* Standard text message */
            <p className="whitespace-pre-wrap leading-relaxed selection:bg-teal-500/30 dark:selection:bg-white/20">
              {message.text}
            </p>
          )}

          {/* Timestamp, Edited Flag & Read Status */}
          <div
            className={`flex items-center justify-end space-x-1.5 mt-1 text-[10px] select-none ${
              isOwn ? 'text-teal-100' : 'text-slate-400 dark:text-slate-400'
            }`}
          >
            {isEdited && <span className="opacity-80 font-normal italic">(edited)</span>}
            <span>{formattedTime}</span>
            {isOwn && !isDeleted && (
              <span title={isRead ? `Read at ${format(new Date(message.readAt), 'p')}` : 'Delivered'}>
                {isRead ? (
                  <CheckCheck size={13} className="text-teal-200 inline stroke-[2.5]" />
                ) : (
                  <Check size={13} className="text-teal-200 inline" />
                )}
              </span>
            )}
          </div>

          {/* Overlapping WhatsApp-Style Reaction Pill Badge (Bottom-Right on Bubble) */}
          {hasReactions && (
            <div
              className={`absolute -bottom-2.5 ${
                isOwn ? 'right-2' : 'left-2'
              } flex items-center space-x-1 bg-white dark:bg-[#061e1a] border border-teal-100 dark:border-[#0f3d37] px-1.5 py-0.5 rounded-full shadow-md z-10`}
            >
              {reactionList.map((r) => {
                const tooltipText =
                  r.usernames.length > 0
                    ? `${r.usernames.join(', ')} reacted with ${r.emoji}`
                    : `Reacted with ${r.emoji}`;

                return (
                  <button
                    key={r.emoji}
                    type="button"
                    onClick={() => onToggleReaction(message._id, r.emoji)}
                    title={tooltipText}
                    aria-label={tooltipText}
                    className={`inline-flex items-center space-x-0.5 px-1 py-0.2 rounded-full text-xs font-medium transition-all active:scale-90 ${
                      r.hasReacted
                        ? 'text-teal-700 dark:text-teal-300 font-bold'
                        : 'text-slate-700 dark:text-slate-300 opacity-90'
                    }`}
                  >
                    <span className="text-[13px]">{r.emoji}</span>
                    {r.count > 1 && (
                      <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 pl-0.5">
                        {r.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
