import { AlertCircle, RefreshCw } from 'lucide-react';
import React from 'react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  description: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'No se pudo cargar la información',
  description,
  retryLabel = 'Reintentar',
  onRetry,
}) => {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50/75 px-6 py-12 text-center dark:border-rose-900/70 dark:bg-rose-950/30"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
        <AlertCircle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h4 className="mt-4 text-sm font-semibold text-rose-950 dark:text-rose-100">{title}</h4>
      <p className="mt-1 max-w-md text-sm text-rose-800 dark:text-rose-200">{description}</p>
      {onRetry && (
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            leftIcon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
          >
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
