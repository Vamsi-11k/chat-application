import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

export const MessageInput = ({ onSendMessage, onTyping, onStopTyping, disabled = false }) => {
  const [text, setText] = useState('');
  const typingTimeoutRef = useRef(null);

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

    onSendMessage(text.trim());
    setText('');
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
    <form onSubmit={handleSend} className="p-3 sm:p-4 bg-white/95 dark:bg-[#051c18]/95 border-t border-teal-100/80 dark:border-[#0c3530]/80">
      <div className="flex items-center space-x-2.5 max-w-5xl mx-auto">
        <input
          type="text"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
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
  );
};
