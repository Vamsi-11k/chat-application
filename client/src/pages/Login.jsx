import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FormInput } from '../components/FormInput';
import { Spinner } from '../components/Loader';
import { ThemeToggle } from '../components/ThemeToggle';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please provide a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
});

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    const res = await login(data);
    setIsSubmitting(false);
    if (res.success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-950 relative transition-colors duration-200">
      {/* Floating Theme Toggle */}
      <div className="absolute top-5 right-5">
        <ThemeToggle className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm" />
      </div>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 shadow-inner">
            <MessageSquare size={28} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            Welcome back
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sign in to continue your real-time conversations
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormInput
            id="email"
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            icon={Mail}
            register={register('email')}
            error={errors.email}
            disabled={isSubmitting}
          />

          <FormInput
            id="password"
            label="Password"
            type="password"
            placeholder="••••••••"
            icon={Lock}
            register={register('password')}
            error={errors.password}
            disabled={isSubmitting}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all duration-150 shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <Spinner size={18} />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
