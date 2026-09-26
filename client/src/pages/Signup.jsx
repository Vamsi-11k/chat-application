import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, User, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/Loader';
import { ThemeToggle } from '../components/ThemeToggle';

const signupSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username cannot exceed 30 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores are allowed'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please provide a valid email address'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters long'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

export const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(signupSchema)
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    const res = await signup(data);
    setIsSubmitting(false);
    if (res.success) {
      navigate('/chat');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-[#f0fdfa] via-[#e6f7f4] to-[#ddf4ef] dark:from-[#031714] dark:via-[#072420] dark:to-[#0f3d37] text-slate-900 dark:text-slate-100 relative transition-colors duration-300 overflow-hidden">
      
      {/* Background Soft Atmospheric Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-teal-200/40 dark:bg-transparent rounded-full blur-3xl" />
        <div className="hidden dark:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-radial from-teal-500/10 via-[#092c27]/30 to-transparent rounded-full blur-3xl" />
        <div className="hidden dark:block absolute -bottom-20 -right-20 w-80 h-80 bg-teal-600/10 rounded-full blur-3xl" />
      </div>

      {/* Floating Theme Toggle (Top Right) */}
      <div className="absolute top-5 right-5 z-30">
        <ThemeToggle className="bg-white/80 dark:bg-[#0b2823]/80 border border-teal-200/70 dark:border-[#14423a] shadow-xs" />
      </div>

      {/* ======================================================================= */}
      {/* AUTH CARD (Centered Vertical Panel with Top-Left Accent Wave)           */}
      {/* ======================================================================= */}
      <div className="w-full max-w-[420px] bg-white/95 dark:bg-[#061e1a]/95 border border-teal-100/90 dark:border-[#0f3d37]/90 rounded-[32px] p-8 sm:p-10 shadow-2xl shadow-teal-950/15 dark:shadow-black/70 relative overflow-hidden transition-all duration-300 running-border-card">
        
        {/* Top-Left Organic Curved Accent Ribbon */}
        <div className="absolute -top-4 -left-4 w-56 h-56 pointer-events-none overflow-hidden z-0">
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full transform -rotate-6 scale-110"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="tealRibbonGrad" x1="0%" y1="0%" x2="80%" y2="80%">
                <stop offset="0%" stopColor="#0d9488" stopOpacity="0.75" />
                <stop offset="45%" stopColor="#14b8a6" stopOpacity="0.4" />
                <stop offset="85%" stopColor="#0f3d37" stopOpacity="0.05" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="tealRibbonSub" x1="0%" y1="20%" x2="70%" y2="90%">
                <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.3" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,0 L180,0 C140,55 160,95 115,135 C70,175 45,145 0,185 Z"
              fill="url(#tealRibbonSub)"
            />
            <path
              d="M0,0 L155,0 C125,45 145,80 100,120 C60,155 35,130 0,165 Z"
              fill="url(#tealRibbonGrad)"
            />
          </svg>
        </div>

        {/* 1. HEADER ROW */}
        <div className="flex items-center justify-between relative z-10 mb-7">
          {/* App Logo */}
          <Link to="/" aria-label="Home" className="flex items-center group">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/30 group-hover:scale-105 transition-transform">
              <MessageSquare size={20} className="stroke-[2.2]" />
            </div>
          </Link>

          {/* Return to Home link */}
          <Link
            to="/"
            title="Back to Home"
            aria-label="Back to Home"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-[#0c2a25] transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
        </div>

        {/* 2. FORM TITLE */}
        <div className="relative z-10 mb-6">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Create an account
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Join the conversation with instant, real-time messaging
          </p>
        </div>

        {/* 3. FORM FIELDS (Underlined Style) */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 relative z-10">
          
          {/* Username Field */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
              <User size={13} className="text-teal-600 dark:text-teal-400" />
              <span>Username</span>
            </label>
            <div className="relative">
              <input
                id="username"
                type="text"
                placeholder="johndoe"
                disabled={isSubmitting}
                {...register('username')}
                className={`w-full bg-transparent border-b-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 py-2 px-0 focus:outline-none transition-colors duration-200 disabled:opacity-50 ${
                  errors.username
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-200 dark:border-slate-700/80 focus:border-teal-500 dark:focus:border-teal-400'
                }`}
              />
            </div>
            {errors.username && (
              <p className="text-xs text-rose-500 dark:text-rose-400 font-medium pt-0.5 animate-fadeIn">
                {errors.username.message}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
              <Mail size={13} className="text-teal-600 dark:text-teal-400" />
              <span>Email</span>
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                disabled={isSubmitting}
                {...register('email')}
                className={`w-full bg-transparent border-b-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 py-2 px-0 focus:outline-none transition-colors duration-200 disabled:opacity-50 ${
                  errors.email
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-200 dark:border-slate-700/80 focus:border-teal-500 dark:focus:border-teal-400'
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-rose-500 dark:text-rose-400 font-medium pt-0.5 animate-fadeIn">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
              <Lock size={13} className="text-teal-600 dark:text-teal-400" />
              <span>Password</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                disabled={isSubmitting}
                {...register('password')}
                className={`w-full bg-transparent border-b-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 py-2 pl-0 pr-8 focus:outline-none transition-colors duration-200 disabled:opacity-50 ${
                  errors.password
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-200 dark:border-slate-700/80 focus:border-teal-500 dark:focus:border-teal-400'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 transition-colors p-1"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-rose-500 dark:text-rose-400 font-medium pt-0.5 animate-fadeIn">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
              <Lock size={13} className="text-teal-600 dark:text-teal-400" />
              <span>Confirm Password</span>
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                disabled={isSubmitting}
                {...register('confirmPassword')}
                className={`w-full bg-transparent border-b-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 py-2 pl-0 pr-8 focus:outline-none transition-colors duration-200 disabled:opacity-50 ${
                  errors.confirmPassword
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-200 dark:border-slate-700/80 focus:border-teal-500 dark:focus:border-teal-400'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 transition-colors p-1"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-rose-500 dark:text-rose-400 font-medium pt-0.5 animate-fadeIn">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* 4. SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-6 py-3.5 px-4 bg-teal-600 hover:bg-teal-500 active:scale-[0.99] disabled:opacity-50 text-white font-bold rounded-full text-xs uppercase tracking-widest transition-all duration-150 shadow-xl shadow-teal-600/30 flex items-center justify-center space-x-2 running-border-btn"
          >
            {isSubmitting ? (
              <>
                <Spinner size={16} />
                <span>CREATING ACCOUNT...</span>
              </>
            ) : (
              <span>SIGN UP</span>
            )}
          </button>
        </form>

        {/* 5. FOOTER LINE */}
        <div className="text-center pt-5 mt-5 border-t border-slate-100 dark:border-[#0e3831] relative z-10">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-teal-600 dark:text-teal-400 hover:underline hover:text-teal-500 dark:hover:text-teal-300 transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>

      </div>

    </div>
  );
};
