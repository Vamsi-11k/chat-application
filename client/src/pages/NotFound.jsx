import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

export const NotFound = () => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center relative transition-colors duration-200">
      <div className="absolute top-5 right-5">
        <ThemeToggle className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm" />
      </div>

      <h1 className="text-8xl font-black text-indigo-500/20 dark:text-indigo-500/30">404</h1>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 -mt-6 mb-2">Page Not Found</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition-all"
      >
        <Home size={18} />
        <span>Back to Home</span>
      </Link>
    </div>
  );
};
