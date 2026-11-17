import { AlertCircle } from 'lucide-react';
import React from 'react';

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  ruleBadge?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  required = false,
  error,
  helperText,
  ruleBadge,
  children,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={htmlFor}
          className="text-xs font-semibold tracking-wide text-slate-700 uppercase dark:text-slate-300"
        >
          {label}
          {required && <span className="ml-1 text-rose-600 dark:text-rose-400">*</span>}
        </label>
        {ruleBadge && (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            {ruleBadge}
          </span>
        )}
      </div>

      {children}

      {error ? (
        <p
          role="alert"
          className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : (
        helperText && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
        )
      )}
    </div>
  );
};
