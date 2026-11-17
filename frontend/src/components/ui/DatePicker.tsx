import { Calendar } from 'lucide-react';
import React from 'react';

export interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  hasError?: boolean;
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ hasError = false, className = '', ...rest }, ref) => {
    return (
      <div className="relative flex w-full items-center">
        <span className="pointer-events-none absolute left-3 text-slate-400 dark:text-slate-500">
          <Calendar className="h-4 w-4" />
        </span>
        <input
          ref={ref}
          type="date"
          aria-invalid={hasError}
          className={`w-full rounded-lg border bg-white py-2 pr-3.5 pl-9 text-sm text-slate-900 transition-colors focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-800 ${
            hasError
              ? 'border-rose-500 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20 dark:border-rose-500'
              : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-slate-700 dark:focus:border-blue-500'
          } ${className}`}
          {...rest}
        />
      </div>
    );
  },
);

DatePicker.displayName = 'DatePicker';
