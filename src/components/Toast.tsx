import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export default function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed bottom-5 right-5 z-55 space-y-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastItemProps {
  key?: string;
  toast: ToastMessage;
  onClose: (id: string) => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const icons = {
    success: <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-cyan-400 shrink-0" />,
  };

  const borderColors = {
    success: 'border-emerald-500/20 bg-emerald-950/20',
    error: 'border-red-500/20 bg-red-950/20',
    info: 'border-cyan-500/20 bg-cyan-950/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-xl border ${borderColors[toast.type]} backdrop-blur-md shadow-lg`}
    >
      <div className="flex items-center gap-2.5">
        {icons[toast.type]}
        <p className="text-xs font-medium text-neutral-200">{toast.message}</p>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="text-neutral-500 hover:text-white transition-colors cursor-pointer"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
}
