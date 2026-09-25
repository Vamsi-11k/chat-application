import React from 'react';
import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';

export const MessageBubble = ({ message, isOwn }) => {
  const formattedTime = message.createdAt
    ? format(new Date(message.createdAt), 'h:mm a')
    : '';

  const isRead = !!message.readAt;

  return (
    <div className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} my-1`}>
      <div
        className={`relative max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl shadow-xs text-sm break-words transition-all duration-150 ${
          isOwn
            ? 'bg-teal-600 text-white rounded-br-xs shadow-teal-600/20 shadow-md'
            : 'bg-white dark:bg-[#0c2a25] text-slate-800 dark:text-slate-100 border border-teal-100/80 dark:border-[#14423a] rounded-bl-xs shadow-xs'
        }`}
      >
        <p className="whitespace-pre-wrap leading-relaxed selection:bg-teal-500/30 dark:selection:bg-white/20">
          {message.text}
        </p>

        <div
          className={`flex items-center justify-end space-x-1 mt-1 text-[10px] select-none ${
            isOwn ? 'text-teal-100' : 'text-slate-400 dark:text-slate-400'
          }`}
        >
          <span>{formattedTime}</span>
          {isOwn && (
            <span title={isRead ? `Read at ${format(new Date(message.readAt), 'p')}` : 'Delivered'}>
              {isRead ? (
                <CheckCheck size={13} className="text-teal-200 inline stroke-[2.5]" />
              ) : (
                <Check size={13} className="text-teal-200 inline" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
