import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  headerRight,
  className = '',
  bodyClassName = 'p-5',
}) => {
  return (
    <div
      className={`rounded-xl border border-slate-200/90 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      {(title || subtitle || headerRight) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
            )}
          </div>
          {headerRight && <div className="flex items-center gap-2">{headerRight}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
};

export type StatAccentColor = 'blue' | 'emerald' | 'amber' | 'rose' | 'purple' | 'teal';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  accent?: StatAccentColor;
  badgeText?: string;
  onClick?: () => void;
}

const accentStyles: Record<
  StatAccentColor,
  { border: string; iconBg: string; badge: string }
> = {
  blue: {
    border: 'border-l-4 border-l-blue-600',
    iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-400',
    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300',
  },
  emerald: {
    border: 'border-l-4 border-l-emerald-500',
    iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300',
  },
  amber: {
    border: 'border-l-4 border-l-amber-500',
    iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400',
    badge: 'bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300',
  },
  rose: {
    border: 'border-l-4 border-l-rose-500',
    iconBg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400',
    badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300',
  },
  purple: {
    border: 'border-l-4 border-l-purple-600',
    iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-950/70 dark:text-purple-400',
    badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300',
  },
  teal: {
    border: 'border-l-4 border-l-teal-500',
    iconBg: 'bg-teal-50 text-teal-600 dark:bg-teal-950/70 dark:text-teal-400',
    badge: 'bg-teal-50 text-teal-700 dark:bg-teal-950/80 dark:text-teal-300',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  accent = 'blue',
  badgeText,
  onClick,
}) => {
  const style = accentStyles[accent];

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all dark:border-slate-800 dark:bg-slate-900 ${
        style.border
      } ${onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
              {title}
            </p>
            {badgeText && (
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${style.badge}`}>
                {badgeText}
              </span>
            )}
          </div>
          <p className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.iconBg}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
