import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDanger = true,
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-md bg-white/95 dark:bg-[#061e1a]/95 border border-teal-100/90 dark:border-[#0f3d37]/90 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-teal-950/20 dark:shadow-black/80 space-y-5 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${
                isDanger
                  ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/25'
                  : 'bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 border border-teal-200/80 dark:border-teal-800/80'
              }`}
            >
              {isDanger ? <Trash2 size={22} /> : <AlertTriangle size={22} />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{message}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-teal-50 dark:hover:bg-[#0c2a25] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0c2a25] hover:text-slate-900 dark:hover:text-white border border-teal-100/60 dark:border-[#14423a] transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-full text-xs font-semibold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25'
                : 'bg-teal-600 hover:bg-teal-500 shadow-teal-600/25'
            }`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
