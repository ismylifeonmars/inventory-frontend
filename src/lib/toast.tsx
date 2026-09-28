'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (options: { title: string; message?: string; type?: ToastType; duration?: number }) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback(({
    title,
    message,
    type = 'info',
    duration = 4000,
  }: {
    title: string;
    message?: string;
    type?: ToastType;
    duration?: number;
  }) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, title, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((title: string, message?: string) => toast({ title, message, type: 'success' }), [toast]);
  const error = useCallback((title: string, message?: string) => toast({ title, message, type: 'error' }), [toast]);
  const warning = useCallback((title: string, message?: string) => toast({ title, message, type: 'warning' }), [toast]);
  const info = useCallback((title: string, message?: string) => toast({ title, message, type: 'info' }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast-card toast-${t.type}`}>
            <div className="toast-icon">
              {t.type === 'success' && <CheckCircle2 size={20} />}
              {t.type === 'error' && <XCircle size={20} />}
              {t.type === 'warning' && <AlertTriangle size={20} />}
              {t.type === 'info' && <Info size={20} />}
            </div>
            <div className="toast-content">
              <h4 className="toast-title">{t.title}</h4>
              {t.message && <p className="toast-message">{t.message}</p>}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="toast-close"
              aria-label="Close notification"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
