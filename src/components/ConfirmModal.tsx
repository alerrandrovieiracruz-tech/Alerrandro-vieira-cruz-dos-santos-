import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger',
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-md bg-[#0F0F0F] border border-neutral-800/80 rounded-2xl overflow-hidden shadow-2xl p-6 z-10"
          >
            {/* Close icon */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header / Icon */}
            <div className="flex items-start gap-4 mt-2">
              <div
                className={`p-3 rounded-xl shrink-0 ${
                  type === 'danger'
                    ? 'bg-red-950/40 text-red-400 border border-red-500/10'
                    : type === 'warning'
                    ? 'bg-amber-950/40 text-amber-400 border border-amber-500/10'
                    : 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/10'
                }`}
              >
                {type === 'danger' ? (
                  <Trash2 className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
                <p className="text-xs text-neutral-400 leading-relaxed font-sans">{message}</p>
              </div>
            </div>

            {/* Actions footer */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-neutral-900">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-400 hover:text-white font-bold text-xs transition-all cursor-pointer"
              >
                {cancelText}
              </button>

              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`py-2.5 px-5 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg hover:scale-[1.01] active:scale-95 ${
                  type === 'danger'
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/20'
                    : type === 'warning'
                    ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-950/20'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-950/20'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
