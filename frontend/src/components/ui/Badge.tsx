import React from 'react';

export type BadgeVariant =
  | 'emerald'
  | 'blue'
  | 'amber'
  | 'rose'
  | 'teal'
  | 'purple'
  | 'slate';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}

const badgeVariantClasses: Record<BadgeVariant, string> = {
  emerald:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/70',
  blue:
    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/70',
  amber:
    'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70',
  rose:
    'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/70',
  teal:
    'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800/70',
  purple:
    'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/70',
  slate:
    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
};

const dotVariantClasses: Record<BadgeVariant, string> = {
  emerald: 'bg-emerald-500',
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  teal: 'bg-teal-500',
  purple: 'bg-purple-500',
  slate: 'bg-slate-500',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  dot = false,
  className = '',
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-tight ${badgeVariantClasses[variant]} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotVariantClasses[variant]}`} />}
      {children}
    </span>
  );
};

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function resolveStatusVariant(status: string): BadgeVariant {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'disponible' || normalized === 'activo (usuario)' || normalized === 'habilitado') {
    return 'emerald';
  }
  if (normalized === 'prestado' || normalized === 'activo' || normalized === 'prestamo') {
    return 'blue';
  }
  if (normalized === 'mantenimiento' || normalized === 'cambioestado' || normalized === 'pendiente') {
    return 'amber';
  }
  if (
    normalized === 'baja' ||
    normalized === 'deshabilitado' ||
    normalized === 'inactivo' ||
    normalized === 'bajalogica' ||
    normalized === 'vencido'
  ) {
    return 'rose';
  }
  if (normalized === 'devuelto' || normalized === 'devolucion' || normalized === 'altaequipo') {
    return 'teal';
  }
  if (normalized === 'administrador') {
    return 'purple';
  }
  if (normalized === 'responsable de tecnología') {
    return 'blue';
  }
  return 'slate';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  return (
    <Badge variant={resolveStatusVariant(status)} dot className={className}>
      {status}
    </Badge>
  );
};
