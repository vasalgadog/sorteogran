import { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { motion } from 'framer-motion';

export type ToastType = 'error' | 'success' | 'info' | 'warning';

export interface ToastData {
  message: string;
  type: ToastType;
}

const ICONS = {
  error: AlertTriangle,
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
};

const STYLES: Record<ToastType, string> = {
  error: 'border-rose-500/40 bg-rose-950/85 text-rose-100 shadow-rose-950/50',
  success: 'border-emerald-500/40 bg-emerald-950/85 text-emerald-100 shadow-emerald-950/50',
  info: 'border-sky-500/40 bg-sky-950/85 text-sky-100 shadow-sky-950/50',
  warning: 'border-amber-500/40 bg-amber-950/85 text-amber-100 shadow-amber-950/50',
};

interface ToastProps {
  toast: ToastData;
  onClose: () => void;
}

export function Toast({ toast, onClose }: ToastProps) {
  const Icon = ICONS[toast.type];

  useEffect(() => {
    const timer = window.setTimeout(onClose, 5000);
    return () => window.clearTimeout(timer);
  }, [toast, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12 }}
      className={`fixed inset-x-4 bottom-5 z-50 mx-auto flex max-w-md items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:left-6 sm:mx-0 ${STYLES[toast.type]}`}
      role="status"
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="flex-1 text-sm font-medium leading-relaxed">{toast.message}</p>
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-1 transition hover:bg-white/10"
        aria-label="Cerrar aviso"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
