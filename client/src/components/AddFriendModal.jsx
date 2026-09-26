import React, { useState, useEffect, useCallback } from 'react';
import { Search, UserPlus, Check, Clock, X, UserCheck, Sparkles } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Spinner } from './Loader';

export const AddFriendModal = ({
  isOpen,
  onClose,
  onRequestSent,
  onFriendAdded
}) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const searchUsers = useCallback(async (searchTerm = '') => {
    try {
      setLoading(true);
      const res = await api.get(`/users/search${searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : ''}`);
      setUsers(res.data?.data?.users || []);
    } catch (err) {
      console.error('Failed to search users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      searchUsers(query);
    }
  }, [isOpen, query, searchUsers]);

  const handleSendRequest = async (targetUserId) => {
    setActionLoading((prev) => ({ ...prev, [targetUserId]: true }));
    try {
      const res = await api.post('/users/requests', { targetUserId });
      if (res.data?.data?.autoAccepted) {
        toast.success('You are now connected as mutual friends!');
        if (onFriendAdded) onFriendAdded();
      } else {
        toast.success('Chat request sent!');
        if (onRequestSent) onRequestSent(res.data?.data?.request);
      }
      searchUsers(query);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send chat request');
    } finally {
      setActionLoading((prev) => ({ ...prev, [targetUserId]: false }));
    }
  };

  const handleAcceptRequest = async (requestId, targetUserId) => {
    setActionLoading((prev) => ({ ...prev, [targetUserId]: true }));
    try {
      await api.patch(`/users/requests/${requestId}/accept`);
      toast.success('Chat request accepted!');
      if (onFriendAdded) onFriendAdded();
      searchUsers(query);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept request');
    } finally {
      setActionLoading((prev) => ({ ...prev, [targetUserId]: false }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-lg bg-white/95 dark:bg-[#061e1a]/95 border border-teal-100/90 dark:border-[#0f3d37]/90 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-teal-950/20 dark:shadow-black/80 space-y-5 flex flex-col max-h-[85vh] animate-scaleUp running-border-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 border border-teal-200/80 dark:border-teal-800/80 flex items-center justify-center shadow-inner">
              <UserPlus size={20} className="stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Find & Connect
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Search users and send chat requests to connect
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-teal-50 dark:hover:bg-[#0c2a25] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-600/70 dark:text-teal-400/70"
          />
          <input
            type="text"
            placeholder="Search by username or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-100 dark:bg-[#082420] border border-teal-100 dark:border-[#103a33] rounded-full pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#0a2c27] focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
            autoFocus
          />
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Spinner size={24} className="text-teal-600 dark:text-teal-400" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Searching users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 space-y-2">
              <Sparkles size={28} className="text-teal-500/40 dark:text-teal-400/30" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No users found</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs">
                Try searching for a different username or invite your friends to register.
              </p>
            </div>
          ) : (
            users.map((u) => {
              const isActionLoading = !!actionLoading[u._id];

              return (
                <div
                  key={u._id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-[#082420]/80 border border-teal-100/60 dark:border-[#0f3832] hover:border-teal-300 dark:hover:border-teal-600/40 transition-all"
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1 pr-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 text-sm shadow-md"
                      style={{ backgroundColor: u.avatarColor || '#0d9488' }}
                    >
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {u.username}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.email}</p>
                    </div>
                  </div>

                  {/* Status Action Buttons */}
                  <div>
                    {u.connectionStatus === 'friends' ? (
                      <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-xs font-medium">
                        <UserCheck size={14} />
                        <span>Connected</span>
                      </span>
                    ) : u.connectionStatus === 'pending_sent' ? (
                      <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 text-xs font-medium">
                        <Clock size={14} />
                        <span>Pending</span>
                      </span>
                    ) : u.connectionStatus === 'pending_received' ? (
                      <button
                        onClick={() => handleAcceptRequest(u.requestId, u._id)}
                        disabled={isActionLoading}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-all shadow-md shadow-teal-600/25 active:scale-95 disabled:opacity-50 running-border-btn"
                      >
                        {isActionLoading ? (
                          <Spinner size={14} />
                        ) : (
                          <>
                            <Check size={14} />
                            <span>Accept</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSendRequest(u._id)}
                        disabled={isActionLoading}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-all shadow-md shadow-teal-600/25 active:scale-95 disabled:opacity-50 running-border-btn"
                      >
                        {isActionLoading ? (
                          <Spinner size={14} />
                        ) : (
                          <>
                            <UserPlus size={14} />
                            <span>Add Friend</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-teal-100/70 dark:border-[#0f3d37]/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-[#0c2a25] dark:hover:bg-[#103a33] dark:text-slate-200 border border-teal-100 dark:border-[#14423a] text-xs font-semibold transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
