import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import React, { createContext, useCallback, useContext, useState } from 'react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  codigoRegla?: string;
}

export interface ToastContextValue {
  showToast: (options: {
    title: string;
    description?: string;
    variant?: ToastVariant;
    codigoRegla?: string;
    durationMs?: number;
  }) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({
      title,
      description,
      variant = 'info',
      codigoRegla,
      durationMs = 5000,
    }: {
      title: string;
      description?: string;
      variant?: ToastVariant;
      codigoRegla?: string;
      durationMs?: number;
    }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, title, description, variant, codigoRegla }]);

      if (durationMs > 0) {
        window.setTimeout(() => {
          dismissToast(id);
        }, durationMs);
      }
    },
    [dismissToast],
  );

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div
        aria-live="polite"
        className="no-print pointer-events-none fixed right-4 bottom-4 z-50 flex w-full max-w-sm flex-col gap-2.5"
      >
        {toasts.map((t) => {
          const styles: Record<ToastVariant, { border: string; icon: React.ReactNode }> = {
            success: {
              border: 'border-l-4 border-l-emerald-500',
              icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
            },
            error: {
              border: 'border-l-4 border-l-rose-600',
              icon: <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />,
            },
            warning: {
              border: 'border-l-4 border-l-amber-500',
              icon: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
            },
            info: {
              border: 'border-l-4 border-l-blue-600',
              icon: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
            },
          };

          const current = styles[t.variant];

          return (
            <div
              key={t.id}
              role="alert"
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg transition-all dark:border-slate-800 dark:bg-slate-900 ${current.border}`}
            >
              <div className="mt-0.5 shrink-0">{current.icon}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t.title}
                </p>
                {t.description && (
                  <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {t.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                className="cursor-pointer rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label="Cerrar notificación"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast debe utilizarse dentro de un ToastProvider.');
  }
  return ctx;
}
