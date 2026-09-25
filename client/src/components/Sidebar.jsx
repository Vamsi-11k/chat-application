import React, { useState } from 'react';
import {
  Search,
  LogOut,
  UserPlus,
  MessagesSquare,
  Inbox,
  MoreVertical,
  Trash2,
  Users,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { UserItem } from './UserItem';
import { SkeletonItem } from './Loader';
import { RequestsTab } from './RequestsTab';
import { ThemeToggle } from './ThemeToggle';

export const Sidebar = ({
  friends,
  conversations,
  selectedUser,
  onSelectUser,
  loadingFriends,
  searchQuery,
  setSearchQuery,
  onOpenAddFriend,
  onOpenClearAllModal,
  incomingRequests = [],
  outgoingRequests = [],
  onAcceptRequest,
  onRejectRequest,
  onCancelRequest,
  loadingRequests = false,
  requestActionLoading = {}
}) => {
  const { user: currentUser, logout } = useAuth();
  const { isUserOnline } = useSocket();
  const [activeNavTab, setActiveNavTab] = useState('chats'); // 'chats' | 'requests'
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Map conversation unread counts and last message by participant ID
  const conversationMap = new Map();
  conversations.forEach((c) => {
    if (c.otherParticipant?._id) {
      conversationMap.set(c.otherParticipant._id, {
        unreadCount: c.unreadCount || 0,
        lastMessageText: c.lastMessage?.text || '',
        lastMessageTime: c.lastMessage?.createdAt || c.updatedAt
      });
    }
  });

  const pendingIncomingCount = incomingRequests.length;

  // Filter online friends for the horizontal "Recent / Online" row
  const onlineFriends = friends.filter(
    (f) => isUserOnline(f._id) || f.isOnline
  );

  return (
    <div className="h-full flex flex-row flex-shrink-0 select-none">
      
      {/* ===================================================================== */}
      {/* 1. FAR-LEFT ICON RAIL (Column 1 - Slim Vertical Strip)                */}
      {/* ===================================================================== */}
      <nav className="w-16 sm:w-18 h-full flex flex-col items-center justify-between py-5 bg-white/90 dark:bg-[#031512] border-r border-teal-100/80 dark:border-[#092b26] z-20 flex-shrink-0 transition-colors duration-200">
        
        {/* Top: Logo / App Wordmark Icon */}
        <div className="flex flex-col items-center space-y-6">
          <div
            title="PulseChat"
            className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-600/30"
          >
            <MessagesSquare size={20} className="stroke-[2.2]" />
          </div>

          {/* Navigation Items */}
          <div className="flex flex-col items-center space-y-3">
            {/* Chats Navigation Item */}
            <button
              onClick={() => setActiveNavTab('chats')}
              title="All Conversations"
              aria-label="All Conversations"
              className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                activeNavTab === 'chats'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                  : 'text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-[#092a25]'
              }`}
            >
              <MessagesSquare size={20} />
            </button>

            {/* Friend Requests Navigation Item */}
            <button
              onClick={() => setActiveNavTab('requests')}
              title="Friend Requests"
              aria-label="Friend Requests"
              className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                activeNavTab === 'requests'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                  : 'text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-[#092a25]'
              }`}
            >
              <Inbox size={20} />
              {pendingIncomingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-[#031512] animate-pulse shadow-xs">
                  {pendingIncomingCount}
                </span>
              )}
            </button>

            {/* Add Friend Modal Trigger */}
            <button
              onClick={onOpenAddFriend}
              title="Add New Friend / Send Request"
              aria-label="Add New Friend"
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-[#092a25] transition-all duration-200"
            >
              <UserPlus size={20} />
            </button>
          </div>
        </div>

        {/* Bottom Actions: Theme Toggle, User Avatar & Logout */}
        <div className="flex flex-col items-center space-y-3.5 relative">
          <ThemeToggle className="w-10 h-10 rounded-2xl bg-teal-50/80 dark:bg-[#092a25] border border-teal-100 dark:border-[#103a33] text-teal-600 dark:text-teal-300 shadow-xs" />

          {/* Current User Profile Avatar with dropdown options */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              title={currentUser?.username}
              aria-label="User Options Menu"
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ring-2 ring-transparent hover:ring-teal-500 transition-all text-sm"
              style={{ backgroundColor: currentUser?.avatarColor || '#0d9488' }}
            >
              {currentUser?.username?.charAt(0).toUpperCase()}
            </button>

            {showMoreMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMoreMenu(false)}
                />
                <div className="absolute left-full bottom-0 ml-3 w-52 bg-white dark:bg-[#061e1a] border border-teal-100 dark:border-[#0f3d37] rounded-2xl shadow-2xl shadow-black/50 py-2 z-50 animate-fadeIn text-xs">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-[#0f3d37]/80">
                    <p className="font-bold text-slate-800 dark:text-slate-100 truncate">
                      {currentUser?.username}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {currentUser?.email}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      onOpenClearAllModal();
                    }}
                    className="w-full px-4 py-2.5 text-left font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-[#123832] flex items-center space-x-2.5 transition-colors"
                  >
                    <Trash2 size={14} />
                    <span>Clear All Chats</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      logout();
                    }}
                    className="w-full px-4 py-2.5 text-left font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#123832] flex items-center space-x-2.5 transition-colors border-t border-slate-100 dark:border-[#0f3d37]/80"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ===================================================================== */}
      {/* 2. MIDDLE COLUMN (Column 2 - Search + Recent + Conversation List)     */}
      {/* ===================================================================== */}
      <aside className="w-full sm:w-80 md:w-84 lg:w-92 h-full flex flex-col bg-slate-50/95 dark:bg-[#051c18]/95 border-r border-teal-100/80 dark:border-[#0c3530] flex-shrink-0 transition-colors duration-200">
        
        {/* Column Header & Search */}
        <div className="p-4 sm:p-5 border-b border-teal-100/70 dark:border-[#0c3530]/80 space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {activeNavTab === 'chats' ? 'Messages' : 'Chat Requests'}
            </h2>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60">
              {activeNavTab === 'chats' ? `${friends.length} contacts` : `${pendingIncomingCount} pending`}
            </span>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-600/70 dark:text-teal-400/70"
            />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#082420] border border-teal-100 dark:border-[#103a33] rounded-full pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#0a2c27] focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
            />
          </div>
        </div>

        {/* Content Body: Either Chats List or Requests Tab */}
        {activeNavTab === 'chats' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Horizontal "Recent / Online" Row */}
            {onlineFriends.length > 0 && !searchQuery.trim() && (
              <div className="px-4 py-3 border-b border-teal-100/50 dark:border-[#0c3530]/60 flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-400">
                    Online Now
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>

                <div className="flex items-center space-x-3 overflow-x-auto pb-1.5 scrollbar-none">
                  {onlineFriends.map((f) => (
                    <button
                      key={f._id}
                      onClick={() => onSelectUser(f)}
                      title={f.username}
                      className="flex flex-col items-center space-y-1 group flex-shrink-0 focus:outline-none"
                    >
                      <div className="relative">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-sm ring-2 ring-transparent group-hover:ring-teal-500 transition-all"
                          style={{ backgroundColor: f.avatarColor || '#0d9488' }}
                        >
                          {f.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-[#051c18]" />
                      </div>
                      <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 truncate max-w-[48px] group-hover:text-teal-600 dark:group-hover:text-teal-300">
                        {f.username}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Vertical Conversation List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loadingFriends ? (
                <div className="space-y-2 p-2">
                  <SkeletonItem />
                  <SkeletonItem />
                  <SkeletonItem />
                  <SkeletonItem />
                </div>
              ) : friends.length === 0 ? (
                <div className="py-16 px-4 text-center text-slate-400 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-[#092a25] border border-teal-100 dark:border-[#103a33] flex items-center justify-center mx-auto text-teal-600 dark:text-teal-400 shadow-xs">
                    <Users size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      No Contacts Yet
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                      Search and connect with friends to start real-time 1-on-1 messaging.
                    </p>
                  </div>
                  <button
                    onClick={onOpenAddFriend}
                    className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 rounded-full bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md shadow-teal-600/25 transition-all"
                  >
                    <UserPlus size={14} />
                    <span>Find Users</span>
                  </button>
                </div>
              ) : (
                friends.map((f) => {
                  const convData = conversationMap.get(f._id) || {};
                  const isOnline = isUserOnline(f._id) || f.isOnline;

                  return (
                    <UserItem
                      key={f._id}
                      user={f}
                      isSelected={selectedUser?._id === f._id}
                      isOnline={isOnline}
                      unreadCount={convData.unreadCount || 0}
                      lastMessageText={convData.lastMessageText || ''}
                      lastMessageTime={convData.lastMessageTime}
                      onClick={() => onSelectUser(f)}
                    />
                  );
                })
              )}
            </div>

          </div>
        ) : (
          /* Requests Tab Body */
          <div className="flex-1 overflow-y-auto">
            <RequestsTab
              incomingRequests={incomingRequests}
              outgoingRequests={outgoingRequests}
              onAccept={onAcceptRequest}
              onReject={onRejectRequest}
              onCancel={onCancelRequest}
              loading={loadingRequests}
              actionLoading={requestActionLoading}
            />
          </div>
        )}

      </aside>

    </div>
  );
};
