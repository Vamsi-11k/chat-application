import React from 'react';
import { Loader2 } from 'lucide-react';

export const FullPageLoader = () => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-slate-200">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
        <div className="absolute w-8 h-8 rounded-full bg-indigo-600/30 blur-md"></div>
      </div>
      <p className="mt-4 text-sm font-medium text-slate-400 tracking-wide animate-pulse">
        Connecting to Chat...
      </p>
    </div>
  );
};

export const Spinner = ({ size = 20, className = '' }) => {
  return <Loader2 size={size} className={`animate-spin ${className}`} />;
};

export const SkeletonItem = () => {
  return (
    <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-800/40 animate-pulse">
      <div className="w-12 h-12 rounded-full bg-slate-700/60 flex-shrink-0"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-700/60 rounded w-1/3"></div>
        <div className="h-3 bg-slate-700/40 rounded w-3/4"></div>
      </div>
    </div>
  );
};
