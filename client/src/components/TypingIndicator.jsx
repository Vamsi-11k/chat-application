import React from 'react';

export const TypingIndicator = ({ username }) => {
  return (
    <div className="flex items-center space-x-2 px-4 py-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100/90 dark:bg-slate-900/60 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800/80">
      <div className="flex space-x-1 items-center">
        <span className="w-1.5 h-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
        <span className="w-1.5 h-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
        <span className="w-1.5 h-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce"></span>
      </div>
      <span className="font-medium text-slate-700 dark:text-slate-300">{username || 'Someone'}</span>
      <span>is typing...</span>
    </div>
  );
};
