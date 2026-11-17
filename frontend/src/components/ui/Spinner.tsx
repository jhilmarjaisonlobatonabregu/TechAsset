import React from 'react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  fullSection?: boolean;
  className?: string;
}

const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-3',
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  label,
  fullSection = false,
  className = '',
}) => {
  const spinnerEl = (
    <div className={`inline-flex items-center gap-2.5 ${className}`} role="status" aria-live="polite">
      <span
        className={`inline-block animate-spin rounded-full border-current border-t-transparent text-blue-600 dark:text-blue-400 ${sizeClasses[size]}`}
      />
      {label ? (
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</span>
      ) : (
        <span className="sr-only">Cargando...</span>
      )}
    </div>
  );

  if (fullSection) {
    return (
      <div className="flex min-h-[240px] w-full flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-white/60 p-8 dark:border-slate-800 dark:bg-slate-900/50">
        {spinnerEl}
      </div>
    );
  }

  return spinnerEl;
};
