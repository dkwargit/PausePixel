import React from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 pointer-events-none">
      {toasts.map((t) => {
        const isError = t.type === 'error';
        const isSuccess = t.type === 'success';

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl text-sm font-medium animate-fadeIn transition-all ${
              isError
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                : isSuccess
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                : 'bg-slate-900/90 border-white/10 text-slate-200'
            }`}
          >
            {isError ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : isSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            )}
            <span>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
};
