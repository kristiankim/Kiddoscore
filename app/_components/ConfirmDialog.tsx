'use client';

import { useEffect } from 'react';
import { useFocusTrap } from '../_lib/useFocusTrap';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}: ConfirmDialogProps) {
  const trapRef = useFocusTrap(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    // Focus the cancel button (safe default for destructive confirms)
    const cancel = trapRef.current?.querySelector<HTMLButtonElement>('[data-cancel]');
    cancel?.focus();

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={e => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div ref={trapRef} className="card max-w-sm w-full p-6">
        <h2 id="dialog-title" className="text-lg font-semibold text-gray-900 mb-3">
          {title}
        </h2>

        <p className="text-gray-600 mb-6">{message}</p>

        <div className="flex gap-3 justify-end">
          <button
            data-cancel
            onClick={onClose}
            className="btn-secondary"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="btn-primary"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
