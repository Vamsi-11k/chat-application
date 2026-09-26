import React, { useState, useMemo } from 'react';
import { X, Search, Forward, Check, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { Spinner } from './Loader';

export const ForwardModal = ({
  isOpen,
  onClose,
  message,
  friends = [],
  conversations = [],
  onForwardSuccess
}) => {
  const [selectedConversations, setSelectedConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [forwarding, setForwarding] = useState(false);

  // Build selectable recipient list combining conversations and friends
  const recipientList = useMemo(() => {
    const list = [];
    const addedUserIds = new Set();

    // 1. Existing conversations with an active conversation ID
    conversations.forEach((c) => {
      if (c.otherParticipant?._id && !addedUserIds.has(c.otherParticipant._id)) {
        addedUserIds.add(c.otherParticipant._id);
        list.push({
          conversationId: c._id,
          user: c.otherParticipant
        });
      }
    });

    // 2. Friends without an existing conversation object in state
    friends.forEach((f) => {
      if (f._id && !addedUserIds.has(f._id)) {
        addedUserIds.add(f._id);
        list.push({
          conversationId: null, // Will be resolved if needed
          user: f
        });
      }
    });

    return list;
  }, [conversations, friends]);

  // Filtered by search query
  const filteredRecipients = useMemo(() => {
    if (!searchQuery.trim()) return recipientList;
    const q = searchQuery.toLowerCase().trim();
    return recipientList.filter(
      (r) =>
        r.user.username?.toLowerCase().includes(q) ||
        r.user.email?.toLowerCase().includes(q)
    );
  }, [recipientList, searchQuery]);

  if (!isOpen || !message) return null;

  const toggleSelect = (convId, user) => {
    // We store either the conversationId or we find it
    const id = convId || user._id;
    setSelectedConversations((prev) => {
      const exists = prev.some((item) => item.user._id === user._id);
      if (exists) {
        return prev.filter((item) => item.user._id !== user._id);
      } else {
        return [...prev, { conversationId: convId, user }];
      }
    });
  };

  const handleForward = async () => {
    if (selectedConversations.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }

    try {
      setForwarding(true);

      // Collect target conversation IDs. If a friend doesn't have conversation ID yet, fetch/create it
      const targetIds = [];

      for (const target of selectedConversations) {
        if (target.conversationId) {
          targetIds.push(target.conversationId);
        } else {
          // Send request or resolve conversation via messages endpoint
          const res = await api.get(`/messages/${target.user._id}?page=1&limit=1`);
          if (res.data?.data?.conversationId) {
            targetIds.push(res.data.data.conversationId);
          }
        }
      }

      if (targetIds.length === 0) {
        toast.error('Could not resolve target conversations');
        return;
      }

      const res = await api.post(`/messages/${message._id}/forward`, {
        targetConversationIds: targetIds
      });

      toast.success(`Message forwarded to ${targetIds.length} conversation(s)`);
      if (onForwardSuccess) {
        onForwardSuccess(res.data?.data?.forwardedMessages || []);
      }
      onClose();
    } catch (err) {
      console.error('Failed to forward message:', err);
      toast.error(err.response?.data?.message || 'Failed to forward message');
    } finally {
      setForwarding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-[#071e19] rounded-3xl border border-teal-100 dark:border-[#0f3d37] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scaleUp running-border-card">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#0c3530] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-[#092a25] text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Forward size={18} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Forward Message
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#0d2e28] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Message Snippet Preview */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-[#031512] border-b border-slate-100 dark:border-[#0c3530]">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-teal-400/70 block mb-0.5">
            Message Preview
          </span>
          <p className="text-xs text-slate-700 dark:text-slate-200 line-clamp-2 italic font-normal">
            "{message.text}"
          </p>
        </div>

        {/* Search filter input */}
        <div className="p-3 border-b border-slate-100 dark:border-[#0c3530]">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-teal-400/60"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              className="w-full bg-slate-100/70 dark:bg-[#0a2722] border border-slate-200 dark:border-[#103a33] rounded-full pl-9 pr-4 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
            />
          </div>
        </div>

        {/* Contacts List with Multi-Select */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-[180px] max-h-[300px]">
          {filteredRecipients.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              No contacts found matching your search.
            </div>
          ) : (
            filteredRecipients.map(({ conversationId, user }) => {
              const isSelected = selectedConversations.some(
                (item) => item.user._id === user._id
              );
              return (
                <button
                  key={user._id}
                  type="button"
                  onClick={() => toggleSelect(conversationId, user)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-all ${
                    isSelected
                      ? 'bg-teal-50 dark:bg-[#0f3d37] border border-teal-200 dark:border-teal-700/60'
                      : 'hover:bg-slate-100/80 dark:hover:bg-[#0b2823] border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs text-xs"
                      style={{ backgroundColor: user.avatarColor || '#0d9488' }}
                    >
                      {user.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">
                        {user.username}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Checkbox indicator */}
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'border border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {isSelected && <Check size={13} className="stroke-[3]" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50/80 dark:bg-[#041613] border-t border-slate-100 dark:border-[#0c3530] flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {selectedConversations.length} selected
          </span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-[#0b2823] rounded-full transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedConversations.length === 0 || forwarding}
              onClick={handleForward}
              className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 active:scale-95 disabled:opacity-50 rounded-full shadow-md shadow-teal-600/30 transition-all flex items-center space-x-1.5 running-border-btn"
            >
              {forwarding ? (
                <>
                  <Spinner size={13} className="border-white" />
                  <span>Forwarding...</span>
                </>
              ) : (
                <>
                  <Forward size={14} />
                  <span>Forward ({selectedConversations.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
