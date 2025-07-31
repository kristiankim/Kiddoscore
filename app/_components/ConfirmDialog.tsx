'use client';

import { useEffect, useRef } from 'react';

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
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      cancelButtonRef.current?.focus();
      
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={e => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6"
        role="document"
      >
        <h2 id="dialog-title" className="text-lg font-semibold text-gray-900 mb-3">
          {title}
        </h2>
        
        <p className="text-gray-600 mb-6">{message}</p>
        
        <div className="flex gap-3 justify-end">
          <button
            ref={cancelButtonRef}
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