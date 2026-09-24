import React, { useState } from 'react';
import {
  Search,
  LogOut,
  UserPlus,
  MessagesSquare,
  Inbox,
  MoreVertical,
  Trash2,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { UserItem } from './UserItem';
import { SkeletonItem } from './Loader';
import { RequestsTab } from './RequestsTab';

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
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'requests'
  const [showMenu, setShowMenu] = useState(false);

  // Map conversation unread counts and last message by participant ID
  const conversationMap = new Map();
  conversations.forEach((c) => {
    if (c.otherParticipant?._id) {
      conversationMap.set(c.otherParticipant._id, {
        unreadCount: c.unreadCount || 0,
        lastMessageText: c.lastMessage?.text || ''
      });
    }
  });

  const pendingIncomingCount = incomingRequests.length;

  return (
    <aside className="w-full md:w-80 lg:w-96 h-full flex flex-col bg-slate-900 border-r border-slate-800 flex-shrink-0">
      {/* Current User Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-md flex-shrink-0"
            style={{ backgroundColor: currentUser?.avatarColor || '#6366F1' }}
          >
            {currentUser?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-100 truncate">
              {currentUser?.username}
            </h3>
            <p className="text-xs text-slate-400 truncate">{currentUser?.email}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1 relative">
          <button
            onClick={onOpenAddFriend}
            title="Add Contact / Send Request"
            className="p-2 text-slate-300 hover:text-indigo-400 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <UserPlus size={18} />
          </button>

          {/* More options menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              title="Options"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <MoreVertical size={18} />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-slate-800 border border-slate-700 rounded-2xl shadow-xl py-1.5 z-50 animate-fadeIn">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenClearAllModal();
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-rose-400 hover:bg-slate-700/60 flex items-center space-x-2.5 transition-colors"
                  >
                    <Trash2 size={14} />
                    <span>Clear All Chats</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      logout();
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-slate-300 hover:bg-slate-700/60 flex items-center space-x-2.5 transition-colors"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="px-3 pt-3 pb-1">
        <div className="grid grid-cols-2 gap-1 bg-slate-950/60 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'chats'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <MessagesSquare size={15} />
            <span>Chats ({friends.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`relative flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'requests'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Inbox size={15} />
            <span>Requests</span>
            {pendingIncomingCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full animate-pulse">
                {pendingIncomingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'chats' ? (
        <>
          {/* Search Bar */}
          <div className="p-3 border-b border-slate-800/80">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Filter chats & friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700/70 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Friends / Chats List Container */}
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
            {loadingFriends ? (
              <div className="space-y-2 p-2">
                <SkeletonItem />
                <SkeletonItem />
                <SkeletonItem />
                <SkeletonItem />
              </div>
            ) : friends.length === 0 ? (
              <div className="py-16 px-4 text-center text-slate-400 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                  <Users size={26} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">No Contacts Yet</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Search and send chat requests to start real-time messaging with your friends.
                  </p>
                </div>
                <button
                  onClick={onOpenAddFriend}
                  className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all"
                >
                  <UserPlus size={14} />
                  <span>Find & Add Users</span>
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
                    onClick={() => onSelectUser(f)}
                  />
                );
              })
            )}
          </div>
        </>
      ) : (
        /* Requests Tab */
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
  );
};
