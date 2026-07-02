import React, { useState, useEffect } from 'react';
import { Square } from '../types';
import { X, Check, Copy, Banknote, Smartphone, Info, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
// @ts-ignore
import pixQrCodeImg from '../assets/images/pix_qr_code_1783031841150.jpg';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  square: Square;
  index: number;
  onConfirmDeposit: (amount: number, method: 'pix' | 'cash') => void;
  currencySymbol: string;
  accentColor: 'emerald' | 'blue' | 'gold' | 'violet' | 'amber';
  initialMethod?: 'pix' | 'cash';
}

export default function DepositModal({
  isOpen,
  onClose,
  square,
  index,
  onConfirmDeposit,
  currencySymbol,
  accentColor,
  initialMethod,
}: DepositModalProps) {
  const [method, setMethod] = useState<'pix' | 'cash'>('pix');
  const remainingValue = square.value - square.saved;
  const [depositAmount, setDepositAmount] = useState<string>(remainingValue.toFixed(2));
  const [customAmountMode, setCustomAmountMode] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedRawKey, setCopiedRawKey] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      const rem = square.value - square.saved;
      setDepositAmount(rem.toFixed(2));
      setCustomAmountMode(false);
      setCopied(false);
      setCopiedRawKey(false);
      setError(null);
      if (initialMethod) {
        setMethod(initialMethod);
      } else {
        setMethod('pix');
      }
    }
  }, [isOpen, square, initialMethod]);

  if (!isOpen) return null;

  // Pix configuration requested by user
  const targetPixKey = "63681991308";
  
  // Simulated PIX copy and paste payload referencing CPF key 63681991308
  const pixKey = `00020101021126430014BR.GOV.BCB.PIX0111636819913085204000053039865405${parseFloat(depositAmount).toFixed(2)}5802BR5925Desafio do Cofre App6009Sao Paulo62070503***6304`;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyRawKey = () => {
    navigator.clipboard.writeText(targetPixKey);
    setCopiedRawKey(true);
    setTimeout(() => setCopiedRawKey(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Por favor, insira um valor válido maior que zero.');
      return;
    }
    if (amount > remainingValue + 0.01) {
      setError(`O valor máximo para este quadrado é ${currencySymbol} ${remainingValue.toFixed(2)}.`);
      return;
    }

    onConfirmDeposit(amount, method);
    onClose();
  };

  // Theme styling configurations
  const themeStyles = {
    emerald: {
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-950/20',
      accent: 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950',
      ring: 'focus:ring-emerald-500/50 focus:border-emerald-500',
      tabActive: 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400',
    },
    blue: {
      text: 'text-cyan-400',
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-950/20',
      accent: 'bg-cyan-500 hover:bg-cyan-400 text-neutral-950',
      ring: 'focus:ring-cyan-500/50 focus:border-cyan-500',
      tabActive: 'bg-cyan-950/40 border-cyan-500/50 text-cyan-400',
    },
    gold: {
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      bg: 'bg-amber-950/20',
      accent: 'bg-amber-500 hover:bg-amber-400 text-neutral-950',
      ring: 'focus:ring-amber-500/50 focus:border-amber-500',
      tabActive: 'bg-amber-950/40 border-amber-500/50 text-amber-400',
    },
    violet: {
      text: 'text-violet-400',
      border: 'border-violet-500/30',
      bg: 'bg-violet-950/20',
      accent: 'bg-violet-500 hover:bg-violet-400 text-neutral-950',
      ring: 'focus:ring-violet-500/50 focus:border-violet-500',
      tabActive: 'bg-violet-950/40 border-violet-500/50 text-violet-400',
    },
    amber: {
      text: 'text-amber-500',
      border: 'border-amber-600/30',
      bg: 'bg-amber-950/15',
      accent: 'bg-amber-500 hover:bg-amber-400 text-neutral-950',
      ring: 'focus:ring-amber-500/50 focus:border-amber-500',
      tabActive: 'bg-amber-950/30 border-amber-500/50 text-amber-500',
    },
  };

  const style = themeStyles[accentColor] || themeStyles.blue;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal body */}
        <motion.div
          initial={{ scale: 0.95, y: 15, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 15, opacity: 0 }}
          className="relative w-full max-w-lg bg-[#0d0d0d] border border-neutral-800/80 rounded-2xl overflow-hidden shadow-2xl p-6 z-10 text-white"
        >
          {/* Close trigger */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="mb-6">
            <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
              📥 Realizar Depósito <span className="text-neutral-500 text-xs font-mono font-normal">Quadrado #{index + 1}</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Escolha a forma de depósito para economizar e marcar este quadrado.
            </p>
          </div>

          {/* Value Summary Card */}
          <div className="bg-[#141414] border border-neutral-800 rounded-xl p-4 mb-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Valor total do quadrado</span>
              <span className="text-lg font-extrabold font-mono tracking-tight text-neutral-200">
                {currencySymbol} {square.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Restante pendente</span>
              <span className={`text-lg font-extrabold font-mono tracking-tight ${style.text}`}>
                {currencySymbol} {remainingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Tab Selection */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#141414] border border-neutral-800 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setMethod('pix');
                setError(null);
              }}
              className={`py-3 px-4 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                method === 'pix'
                  ? style.tabActive
                  : 'bg-transparent border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              <Smartphone size={16} />
              Pix Instantâneo
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod('cash');
                setError(null);
              }}
              className={`py-3 px-4 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                method === 'cash'
                  ? style.tabActive
                  : 'bg-transparent border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              <Banknote size={16} />
              Depósito em Dinheiro
            </button>
          </div>

          {/* Value inputs */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-neutral-400">
                  Quanto deseja depositar neste quadrado?
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setCustomAmountMode(!customAmountMode);
                    if (customAmountMode) {
                      setDepositAmount(remainingValue.toFixed(2));
                    }
                    setError(null);
                  }}
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded transition-all cursor-pointer ${
                    customAmountMode
                      ? 'bg-neutral-800 text-white border border-neutral-700'
                      : 'text-cyan-400 hover:text-cyan-300'
                  }`}
                >
                  {customAmountMode ? 'Depósito Total' : 'Editar Valor (Parcial)'}
                </button>
              </div>

              {customAmountMode ? (
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-mono font-bold text-sm">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={remainingValue}
                    value={depositAmount}
                    onChange={(e) => {
                      setDepositAmount(e.target.value);
                      setError(null);
                    }}
                    autoFocus
                    className="w-full bg-[#181818] border border-neutral-800 rounded-xl pl-12 pr-4 py-3.5 text-base text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
                  />
                </div>
              ) : (
                <div className="bg-[#181818] border border-neutral-800/80 rounded-xl p-3.5 flex items-center justify-between font-mono font-bold">
                  <span className="text-neutral-400 text-xs">Valor completo sugerido:</span>
                  <span className="text-lg text-white">
                    {currencySymbol} {remainingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {error && (
                <p className="text-xs text-red-400 mt-2 font-semibold bg-red-950/20 border border-red-500/10 p-2.5 rounded-lg">
                  {error}
                </p>
              )}
            </div>

            {/* Render Tab Contents */}
            {method === 'pix' ? (
              <div className="space-y-4 pt-2 border-t border-neutral-800/40">
                <div className="bg-[#141414] border border-neutral-800 rounded-xl p-5">
                  {/* PIX instructions */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                      <Smartphone size={18} />
                      <span>Depósito via Pix</span>
                    </div>
                    
                    {/* Centered QR Code Container */}
                    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl w-48 h-48 mx-auto shadow-xl border border-neutral-200 relative group overflow-hidden">
                      <img
                        src={pixQrCodeImg}
                        alt="Pix QR Code"
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                      {/* Green scan line overlay */}
                      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-emerald-500 opacity-60 animate-bounce" />
                    </div>

                    <p className="text-neutral-400 text-[11px] leading-relaxed text-center">
                      Escaneie o QR Code acima usando o app do seu banco ou copie os dados abaixo para fazer o depósito.
                    </p>

                    {/* Pix Key Info block */}
                    <div className="bg-[#1c1c1c] border border-neutral-800 rounded-xl p-3.5 flex items-center justify-between gap-2 shadow-inner">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Chave Pix (CPF)</span>
                        <span className="text-xs font-mono font-bold text-neutral-200">636.819.913-08</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyRawKey}
                        className="py-1.5 px-3 bg-[#262626] hover:bg-[#323232] text-[11px] font-bold rounded-lg border border-neutral-700 text-neutral-200 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        {copiedRawKey ? (
                          <>
                            <Check size={12} className="text-emerald-400" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy size={12} className="text-cyan-400" />
                            Copiar Chave
                          </>
                        )}
                      </button>
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={handleCopyPix}
                        className="w-full py-3 px-4 bg-[#1c1c1c] hover:bg-[#252525] border border-neutral-800 rounded-xl font-bold text-neutral-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-inner"
                      >
                        {copied ? (
                          <>
                            <Check size={16} className="text-emerald-400 font-bold" />
                            Código PIX Copiado com Sucesso!
                          </>
                        ) : (
                          <>
                            <Copy size={16} className="text-cyan-400" />
                            Copiar Código Copia e Cola
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl flex items-start gap-2">
                  <Info size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-neutral-400 leading-normal">
                    Este é um simulador de cofre físico e digital. Nenhum pagamento real de verdade será cobrado. Ao confirmar, o valor será contabilizado de forma lúdica no seu desafio de poupança!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-2 border-t border-neutral-800/40">
                <div className="bg-[#141414] border border-neutral-800 rounded-xl p-5 text-center flex flex-col items-center justify-center gap-3">
                  <div className="p-3.5 bg-amber-950/20 text-amber-500 border border-amber-500/20 rounded-2xl">
                    <Banknote size={36} className="animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-200">Guardando Cédulas de Dinheiro Físico</h4>
                    <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1 leading-relaxed">
                      Utilize esta opção se você está colocando moedas ou cédulas físicas de dinheiro de verdade no seu porquinho, cofre, gaveta ou envelope físico.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-neutral-900/60 border border-neutral-800 rounded-xl flex items-start gap-2">
                  <Wallet size={14} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-neutral-400 leading-normal">
                    Excelente escolha para manter o controle exato do dinheiro físico que você tem guardado em casa! Confirme abaixo para registrar o depósito na sua planilha inteligente.
                  </p>
                </div>
              </div>
            )}

            {/* Form actions */}
            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold text-xs rounded-xl transition-all border border-neutral-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`flex-1 py-3 px-4 ${style.accent} font-bold text-xs rounded-xl shadow-lg shadow-neutral-950/40 transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer`}
              >
                <Check className="w-4 h-4" /> Confirmar Depósito
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
