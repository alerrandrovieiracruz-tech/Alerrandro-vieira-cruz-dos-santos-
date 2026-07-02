import React, { useState } from 'react';
import { distributeArbitraryValue } from '../utils/distribution';
import { Square, HistoryEntry } from '../types';
import { Sparkles, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  squares: Square[];
  onDepositComplete: (updatedSquares: Square[], addedHistory: HistoryEntry[]) => void;
  currencySymbol: string;
}

export default function QuickAddModal({ isOpen, onClose, squares, onDepositComplete, currencySymbol }: QuickAddModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Por favor, insira um valor válido maior que zero.');
      return;
    }

    const { updatedSquares, addedHistory } = distributeArbitraryValue(squares, parsedAmount);
    
    if (addedHistory.length === 0) {
      setError('Todos os quadrados já estão completos ou não foi possível distribuir o valor.');
      return;
    }

    // Add random IDs and dates to history
    const historyWithMeta: HistoryEntry[] = addedHistory.map((h) => ({
      ...h,
      id: `hist-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
    }));

    onDepositComplete(updatedSquares, historyWithMeta);
    setAmount('');
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            className="relative w-full max-w-md bg-[#121212] border border-neutral-800/60 rounded-2xl overflow-hidden shadow-2xl p-6 z-10"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-cyan-950/40 border border-cyan-800/30 rounded-xl text-cyan-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-sans">Adicionar Qualquer Valor</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Distribuição inteligente automática</p>
              </div>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-2">
                  Qual valor você quer economizar hoje?
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-mono font-bold text-sm">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setError(null);
                    }}
                    autoFocus
                    placeholder="Ex: 50.00"
                    className="w-full bg-[#181818] border border-neutral-800 rounded-xl pl-12 pr-4 py-3.5 text-base text-white font-mono font-bold focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  />
                </div>
                {error && (
                  <p className="text-xs text-red-400 mt-2 font-medium bg-red-950/20 border border-red-500/10 p-2 rounded-lg">
                    {error}
                  </p>
                )}
              </div>

              {/* Smart Distribution Explanation */}
              <div className="bg-[#171717]/60 border border-neutral-800/60 rounded-xl p-3 text-xs text-neutral-400 leading-relaxed">
                💡 <span className="font-semibold text-neutral-200">Como funciona:</span> O cofre distribuirá este valor automaticamente para os seus quadrados. Primeiro completando os quadrados que já possuem depósitos parciais e depois preenchendo os quadrados vazios (menores primeiro).
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold text-xs rounded-xl transition-all border border-neutral-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-cyan-500 hover:bg-cyan-400 text-[#0d0d0d] font-bold text-xs rounded-xl shadow-lg shadow-cyan-950/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Confirmar Depósito
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
