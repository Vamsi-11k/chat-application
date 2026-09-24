import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
      <h1 className="text-8xl font-black text-indigo-500/30">404</h1>
      <h2 className="text-2xl font-bold text-slate-100 -mt-6 mb-2">Page Not Found</h2>
      <p className="text-sm text-slate-400 max-w-sm mb-6">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg transition-all"
      >
        <Home size={18} />
        <span>Back to Home</span>
      </Link>
    </div>
  );
};
