import React, { useState, useRef, useEffect } from 'react';
import { Send, X, CornerDownRight } from 'lucide-react';

export const MessageInput = ({
  onSendMessage,
  onTyping,
  onStopTyping,
  replyingTo = null,
  onCancelReply,
  disabled = false
}) => {
  const [text, setText] = useState('');
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Focus input when replyingTo changes
  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);

  const handleChange = (e) => {
    const val = e.target.value;
    setText(val);

    if (val.trim()) {
      if (onTyping) onTyping();

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (onStopTyping) onStopTyping();
      }, 2000);
    } else {
      if (onStopTyping) onStopTyping();
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (onStopTyping) onStopTyping();

    onSendMessage(text.trim(), replyingTo?._id || null);
    setText('');
    if (onCancelReply) onCancelReply();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-white/95 dark:bg-[#051c18]/95 border-t border-teal-100/80 dark:border-[#0c3530]/80">
      
      {/* Quoted-Preview Bar (Feature 3) */}
      {replyingTo && (
        <div className="px-4 py-2 bg-teal-50/80 dark:bg-[#072520] border-b border-teal-100/60 dark:border-[#0f3d37]/60 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2 min-w-0 pr-2">
            <div className="w-1 h-7 rounded-full bg-teal-500 shrink-0" />
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 flex items-center space-x-1">
                <CornerDownRight size={11} />
                <span>
                  Replying to{' '}
                  {typeof replyingTo.sender === 'object'
                    ? replyingTo.sender.username
                    : 'User'}
                </span>
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
                {replyingTo.deleted
                  ? 'Original message was deleted'
                  : replyingTo.text}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancelReply}
            title="Cancel reply"
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-teal-100 dark:hover:bg-[#0c312a] transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Input Form */}
      <form onSubmit={handleSend} className="p-3 sm:p-4">
        <div className="flex items-center space-x-2.5 max-w-5xl mx-auto">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={replyingTo ? "Type your reply..." : "Type a message..."}
            disabled={disabled}
            className="flex-1 bg-slate-100 dark:bg-[#082420] border border-teal-100 dark:border-[#103a33] hover:border-teal-200 dark:hover:border-teal-800 focus:border-teal-500 dark:focus:border-teal-400 rounded-full px-5 py-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all duration-150"
          />

          <button
            type="submit"
            disabled={!text.trim() || disabled}
            aria-label="Send message"
            className="p-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:hover:bg-teal-600 text-white rounded-full transition-all duration-150 shadow-md shadow-teal-600/30 active:scale-95 flex items-center justify-center flex-shrink-0"
          >
            <Send size={16} className="translate-x-[0.5px]" />
          </button>
        </div>
      </form>
    </div>
  );
};
