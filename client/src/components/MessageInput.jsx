import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile } from 'lucide-react';

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
    <form onSubmit={handleSend} className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800">
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={disabled}
          className="flex-1 bg-slate-800 border border-slate-700/80 hover:border-slate-600 focus:border-indigo-500 rounded-full px-5 py-3 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-150"
        />

        <button
          type="submit"
          disabled={!text.trim() || disabled}
          className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-full transition-all duration-150 shadow-md hover:shadow-indigo-500/20 active:scale-95 flex items-center justify-center flex-shrink-0"
        >
          <Send size={18} />
        </button>
      </div>
    </form>
  );
};
