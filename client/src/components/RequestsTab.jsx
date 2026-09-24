import React from 'react';
import { UserCheck, UserX, Clock, Inbox, Send, Check, X } from 'lucide-react';
import { Spinner } from './Loader';

export const RequestsTab = ({
  incomingRequests = [],
  outgoingRequests = [],
  onAccept,
  onReject,
  onCancel,
  loading = false,
  actionLoading = {}
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <Spinner size={24} className="text-indigo-500" />
        <p className="text-xs text-slate-400 font-medium">Loading requests...</p>
      </div>
    );
  }

  const hasRequests = incomingRequests.length > 0 || outgoingRequests.length > 0;

  if (!hasRequests) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-500">
          <Inbox size={26} />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-200">No Chat Requests</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            When someone wants to chat with you, their request will show up here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-2 overflow-y-auto">
      {/* Incoming Requests Section */}
      {incomingRequests.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center space-x-1.5">
              <Inbox size={13} />
              <span>Received Requests ({incomingRequests.length})</span>
            </span>
          </div>

          <div className="space-y-1.5">
            {incomingRequests.map((req) => {
              const sender = req.sender;
              const isAction = !!actionLoading[req._id];

              return (
                <div
                  key={req._id}
                  className="p-3 rounded-2xl bg-slate-800/50 border border-indigo-500/20 hover:border-indigo-500/40 transition-all space-y-2.5"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md flex-shrink-0 text-sm"
                      style={{ backgroundColor: sender?.avatarColor || '#6366F1' }}
                    >
                      {sender?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-100 truncate">
                        {sender?.username}
                      </h4>
                      <p className="text-xs text-slate-400 truncate">{sender?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-1 border-t border-slate-800">
                    <button
                      onClick={() => onAccept(req._id)}
                      disabled={isAction}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
                    >
                      {isAction ? (
                        <Spinner size={14} />
                      ) : (
                        <>
                          <Check size={14} />
                          <span>Accept</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => onReject(req._id)}
                      disabled={isAction}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <X size={14} />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Outgoing Pending Requests Section */}
      {outgoingRequests.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between px-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Send size={13} />
              <span>Sent Requests ({outgoingRequests.length})</span>
            </span>
          </div>

          <div className="space-y-1.5">
            {outgoingRequests.map((req) => {
              const receiver = req.receiver;
              const isAction = !!actionLoading[req._id];

              return (
                <div
                  key={req._id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/30 border border-slate-800"
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1 pr-2">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shadow-md flex-shrink-0 text-xs"
                      style={{ backgroundColor: receiver?.avatarColor || '#6366F1' }}
                    >
                      {receiver?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-200 truncate">
                        {receiver?.username}
                      </h4>
                      <div className="flex items-center space-x-1 text-[10px] text-amber-400 mt-0.5">
                        <Clock size={11} />
                        <span>Pending approval</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onCancel(req._id)}
                    disabled={isAction}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  >
                    {isAction ? <Spinner size={12} /> : 'Cancel'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
