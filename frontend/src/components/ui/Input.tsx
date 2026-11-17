import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  prefixIcon?: React.ReactNode;
  suffixElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ hasError = false, prefixIcon, suffixElement, className = '', ...rest }, ref) => {
    return (
      <div className="relative flex w-full items-center">
        {prefixIcon && (
          <span className="pointer-events-none absolute left-3 flex items-center text-slate-400 dark:text-slate-500">
            {prefixIcon}
          </span>
        )}
        <input
          ref={ref}
          aria-invalid={hasError}
          className={`w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:bg-slate-800 ${
            prefixIcon ? 'pl-10' : ''
          } ${suffixElement ? 'pr-10' : ''} ${
            hasError
              ? 'border-rose-500 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20 dark:border-rose-500'
              : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-slate-700 dark:focus:border-blue-500'
          } ${className}`}
          {...rest}
        />
        {suffixElement && (
          <div className="absolute right-2.5 flex items-center text-slate-400 dark:text-slate-500">
            {suffixElement}
          </div>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
