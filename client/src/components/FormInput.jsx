import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const FormInput = ({
  id,
  label,
  type = 'text',
  placeholder,
  register,
  error,
  icon: Icon,
  disabled = false
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          {label}
        </label>
      )}
      <div className="relative rounded-xl shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Icon size={18} />
          </div>
        )}

        <input
          id={id}
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          placeholder={placeholder}
          disabled={disabled}
          {...register}
          className={`w-full rounded-xl bg-slate-50 dark:bg-slate-800/80 border text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            Icon ? 'pl-10' : 'pl-4'
          } ${isPassword ? 'pr-11' : 'pr-4'} py-3 ${
            error
              ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 focus:border-indigo-500 focus:ring-indigo-500/20'
          }`}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-rose-500 dark:text-rose-400 font-medium pl-1 animate-fadeIn">
          {error.message}
        </p>
      )}
    </div>
  );
};
