import React from 'react';

export const TypingIndicator = ({ username }) => {
  return (
    <div className="flex items-center space-x-2 px-6 py-2 text-xs text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-[#061e1a]/80 backdrop-blur-sm border-t border-teal-100/60 dark:border-[#0f3d37]/60">
      <div className="flex space-x-1 items-center">
        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce"></span>
      </div>
      <span className="font-medium text-slate-700 dark:text-slate-300">{username || 'Someone'}</span>
      <span>is typing...</span>
    </div>
  );
};
