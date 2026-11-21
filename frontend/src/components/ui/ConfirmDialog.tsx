import { AlertTriangle, ShieldAlert } from 'lucide-react';
import React from 'react';
import { Button, type ButtonVariant } from './Button';
import { Modal } from './Modal';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  ruleCode?: string;
  ruleExplanation?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ButtonVariant;
  loading?: boolean;
  children?: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  ruleExplanation,
  confirmLabel = 'Confirmar acción',
  cancelLabel = 'Cancelar',
  confirmVariant = 'danger',
  loading = false,
  children,
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              confirmVariant === 'danger'
                ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400'
                : 'bg-amber-100 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400'
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {description}
          </p>
        </div>

        {ruleExplanation && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 dark:border-amber-800/70 dark:bg-amber-950/40">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-300">
              <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Información importante</span>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-amber-800 dark:text-amber-200/90">
              {ruleExplanation}
            </p>
          </div>
        )}

        {children}
      </div>
    </Modal>
  );
};
