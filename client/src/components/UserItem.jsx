import React from 'react';

export const UserItem = ({
  user,
  isSelected,
  onClick,
  isOnline,
  unreadCount = 0,
  lastMessageText = ''
}) => {
  const initial = user?.username ? user.username.charAt(0).toUpperCase() : '?';
  const bgColor = user?.avatarColor || '#6366F1';

  return (
    <div
      onClick={onClick}
      className={`group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all duration-150 select-none ${
        isSelected
          ? 'bg-indigo-50 dark:bg-indigo-600/15 border border-indigo-200 dark:border-indigo-500/30 shadow-xs'
          : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60 border border-transparent'
      }`}
    >
      <div className="flex items-center space-x-3.5 min-w-0 flex-1">
        {/* Avatar with Status Indicator */}
        <div className="relative flex-shrink-0">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white shadow-inner text-base"
            style={{ backgroundColor: bgColor }}
          >
            {initial}
          </div>
          <span
            className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
              isOnline ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-slate-400 dark:bg-slate-500'
            }`}
          />
        </div>

        {/* User Details & Last Message Preview */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4
              className={`text-sm font-semibold truncate ${
                isSelected
                  ? 'text-indigo-600 dark:text-indigo-300'
                  : 'text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-white'
              }`}
            >
              {user?.username}
            </h4>
          </div>
          {lastMessageText ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 max-w-[180px]">
              {lastMessageText}
            </p>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {isOnline ? 'Online' : 'Offline'}
            </p>
          )}
        </div>
      </div>

      {/* Unread Count Badge */}
      {unreadCount > 0 && (
        <div className="ml-2 flex-shrink-0">
          <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-indigo-600 rounded-full animate-pulse shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        </div>
      )}
    </div>
  );
};
