import React from 'react';
import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';

export const MessageBubble = ({ message, isOwn }) => {
  const formattedTime = message.createdAt
    ? format(new Date(message.createdAt), 'h:mm a')
    : '';

  const isRead = !!message.readAt;

  return (
    <div className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} my-1.5`}>
      <div
        className={`relative max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl shadow-sm text-sm break-words transition-all duration-150 ${
          isOwn
            ? 'bg-indigo-600 text-white rounded-br-xs'
            : 'bg-slate-800/90 text-slate-100 border border-slate-700/50 rounded-bl-xs'
        }`}
      >
        <p className="whitespace-pre-wrap leading-relaxed selection:bg-white/20">
          {message.text}
        </p>

        <div
          className={`flex items-center justify-end space-x-1 mt-1 text-[10px] select-none ${
            isOwn ? 'text-indigo-200' : 'text-slate-400'
          }`}
        >
          <span>{formattedTime}</span>
          {isOwn && (
            <span title={isRead ? `Read at ${format(new Date(message.readAt), 'p')}` : 'Delivered'}>
              {isRead ? (
                <CheckCheck size={14} className="text-sky-300 inline" />
              ) : (
                <Check size={14} className="text-indigo-300 inline" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
