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
    <div className="sticky bottom-3 sm:bottom-5 inset-x-0 w-full px-3 sm:px-6 pointer-events-none z-30 flex flex-col items-center">
      {/* Quoted-Preview Pill (Floats above iMac Dock) */}
      {replyingTo && (
        <div className="pointer-events-auto mb-2 w-full max-w-2xl px-4 py-2 bg-white/90 dark:bg-[#072520]/90 backdrop-blur-xl border border-teal-200/80 dark:border-[#0f3d37] rounded-2xl shadow-lg flex items-center justify-between animate-fadeIn running-border">
          <div className="flex items-center space-x-2.5 min-w-0 pr-2">
            <div className="w-1 h-6 rounded-full bg-teal-500 shrink-0" />
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
              <p className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-md">
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
            <X size={15} />
          </button>
        </div>
      )}

      {/* iMac-Style Floating Dock Capsule */}
      <form
        onSubmit={handleSend}
        className="pointer-events-auto w-full max-w-2xl bg-white/85 dark:bg-[#061e1a]/85 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-2xl shadow-teal-950/20 dark:shadow-black/70 rounded-full p-1.5 sm:p-2 flex items-center space-x-2 transition-all duration-300 running-border-card"
      >
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={replyingTo ? "Type your reply..." : "Type a message..."}
          disabled={disabled}
          className="flex-1 bg-transparent px-4 sm:px-5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none"
        />

        <button
          type="submit"
          disabled={!text.trim() || disabled}
          aria-label="Send message"
          className="w-10 h-10 sm:w-11 sm:h-11 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:hover:bg-teal-600 text-white rounded-full transition-all duration-150 shadow-lg shadow-teal-600/30 active:scale-95 flex items-center justify-center flex-shrink-0 running-border-btn"
        >
          <Send size={16} className="translate-x-[0.5px]" />
        </button>
      </form>
    </div>
  );
};
