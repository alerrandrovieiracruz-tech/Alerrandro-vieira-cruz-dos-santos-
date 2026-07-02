import React, { useState } from 'react';
import { Challenge } from '../types';
import { X, Check, ArrowDownLeft, Smartphone, Info, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RedeemModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeChallenge: Challenge;
  totalSaved: number;
  onConfirmRedeem: (amount: number, pixKey: string, keyType: string) => void;
  currencySymbol: string;
  accentColor: 'emerald' | 'blue' | 'gold' | 'violet' | 'amber';
}

export default function RedeemModal({
  isOpen,
  onClose,
  activeChallenge,
  totalSaved,
  onConfirmRedeem,
  currencySymbol,
  accentColor,
}: RedeemModalProps) {
  const [pixKey, setPixKey] = useState<string>('');
  const [keyType, setKeyType] = useState<string>('cpf');
  const [redeemAmount, setRedeemAmount] = useState<string>(totalSaved.toFixed(2));
  const [customAmountMode, setCustomAmountMode] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleKeyTypeChange = (type: string) => {
    setKeyType(type);
    setPixKey('');
    setError(null);
  };

  const validatePixKey = (): boolean => {
    if (!pixKey.trim()) {
      setError('Por favor, insira a sua chave Pix.');
      return false;
    }

    if (keyType === 'cpf' && pixKey.replace(/\D/g, '').length !== 11) {
      setError('O CPF informado deve conter exatamente 11 dígitos.');
      return false;
    }

    if (keyType === 'email' && !pixKey.includes('@')) {
      setError('Insira um endereço de e-mail válido para a chave Pix.');
      return false;
    }

    if (keyType === 'phone' && pixKey.replace(/\D/g, '').length < 10) {
      setError('Por favor, insira um telefone celular com DDD válido.');
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amount = parseFloat(redeemAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Por favor, insira um valor de resgate válido maior que zero.');
      return;
    }

    if (amount > totalSaved + 0.01) {
      setError(`Você não possui saldo suficiente para resgatar este valor. Saldo disponível: ${currencySymbol} ${totalSaved.toFixed(2)}.`);
      return;
    }

    if (!validatePixKey()) {
      return;
    }

    // Simulate Pix transfer processing
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setSuccess(true);
      setTimeout(() => {
        onConfirmRedeem(amount, pixKey, keyType);
        setSuccess(false);
        onClose();
      }, 2500);
    }, 2000);
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
          className="relative w-full max-w-lg bg-[#0d0d0d] border border-neutral-800/80 rounded-2xl overflow-hidden shadow-2xl p-6 z-10 text-white animate-fade-in"
        >
          {/* Close trigger */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-all cursor-pointer"
            disabled={isProcessing}
          >
            <X className="w-4 h-4" />
          </button>

          {isProcessing ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-cyan-500/10 rounded-full" />
                <div className="absolute inset-0 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                <Smartphone className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h4 className="font-bold text-neutral-200">Processando Resgate Pix</h4>
                <p className="text-xs text-neutral-400 mt-1 max-w-xs leading-relaxed">
                  Conectando ao sistema Pix para transferir seu saldo acumulado com total segurança...
                </p>
              </div>
            </div>
          ) : success ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-950/30 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 animate-pulse">
                <Check className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-black text-emerald-400">Resgate Pix Concluído!</h4>
                <p className="text-xs text-neutral-300 mt-1 max-w-xs leading-relaxed">
                  O valor de <strong>{currencySymbol} {parseFloat(redeemAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> foi transferido com sucesso para a chave informada!
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-6">
                <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                  <ArrowDownLeft className="text-cyan-400" /> Resgatar Saldo via Pix
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Transfira suas economias salvas nesta tabela de volta para sua conta bancária instantaneamente.
                </p>
              </div>

              {/* Balance Summary */}
              <div className="bg-[#141414] border border-neutral-800 rounded-xl p-4 mb-5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Tabela Ativa</span>
                  <span className="text-xs font-bold text-neutral-300 line-clamp-1">
                    {activeChallenge.title}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Saldo Disponível</span>
                  <span className="text-lg font-extrabold font-mono tracking-tight text-emerald-400">
                    {currencySymbol} {totalSaved.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {totalSaved <= 0 ? (
                <div className="text-center py-6 border border-neutral-800/80 rounded-xl bg-neutral-900/10 space-y-3">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                  <div>
                    <h4 className="text-sm font-bold text-neutral-300">Nenhum saldo para resgate</h4>
                    <p className="text-xs text-neutral-500 max-w-xs mx-auto mt-1">
                      Marque ou complete alguns quadrados desta tabela para acumular saldo e poder resgatar via Pix.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Select Key Type */}
                  <div>
                    <label className="text-xs font-bold text-neutral-400 block mb-2">
                      Selecione o Tipo de Chave Pix
                    </label>
                    <div className="grid grid-cols-4 gap-1.5 p-1 bg-[#141414] border border-neutral-800 rounded-xl">
                      {[
                        { id: 'cpf', label: 'CPF' },
                        { id: 'email', label: 'E-mail' },
                        { id: 'phone', label: 'Celular' },
                        { id: 'random', label: 'Chave Ev.' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleKeyTypeChange(item.id)}
                          className={`py-2 text-[10px] font-bold rounded-lg transition-all text-center border cursor-pointer ${
                            keyType === item.id
                              ? style.tabActive
                              : 'bg-transparent border-transparent text-neutral-400 hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Input Pix Key */}
                  <div>
                    <label className="text-xs font-bold text-neutral-400 block mb-1.5">
                      Sua Chave Pix
                    </label>
                    <input
                      type="text"
                      value={pixKey}
                      onChange={(e) => {
                        setPixKey(e.target.value);
                        setError(null);
                      }}
                      placeholder={
                        keyType === 'cpf'
                          ? '000.000.000-00'
                          : keyType === 'email'
                          ? 'seuemail@provedor.com'
                          : keyType === 'phone'
                          ? '(11) 99999-9999'
                          : 'Chave aleatória de 36 caracteres'
                      }
                      className="w-full bg-[#181818] border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                    />
                  </div>

                  {/* Redeem Amount */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-neutral-400">
                        Valor do Resgate
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomAmountMode(!customAmountMode);
                          if (customAmountMode) {
                            setRedeemAmount(totalSaved.toFixed(2));
                          }
                          setError(null);
                        }}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded transition-all cursor-pointer ${
                          customAmountMode
                            ? 'bg-neutral-800 text-white border border-neutral-700'
                            : 'text-cyan-400 hover:text-cyan-300'
                        }`}
                      >
                        {customAmountMode ? 'Resgatar Tudo' : 'Resgatar Parcial'}
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
                          max={totalSaved}
                          value={redeemAmount}
                          onChange={(e) => {
                            setRedeemAmount(e.target.value);
                            setError(null);
                          }}
                          className="w-full bg-[#181818] border border-neutral-800 rounded-xl pl-12 pr-4 py-3 text-sm text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
                        />
                      </div>
                    ) : (
                      <div className="bg-[#181818] border border-neutral-800/80 rounded-xl p-3 flex items-center justify-between font-mono font-bold">
                        <span className="text-neutral-400 text-xs">Valor completo:</span>
                        <span className="text-sm text-emerald-400">
                          {currencySymbol} {totalSaved.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>

                  {error && (
                    <p className="text-xs text-red-400 mt-2 font-semibold bg-red-950/20 border border-red-500/10 p-2.5 rounded-lg">
                      {error}
                    </p>
                  )}

                  <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl flex items-start gap-2">
                    <ShieldCheck size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-neutral-400 leading-normal">
                      Ambiente de simulação criptografado. Nenhuma transferência real de verdade será enviada, mas o saldo da sua planilha lúdica será atualizado instantaneamente refletindo a retirada!
                    </p>
                  </div>

                  {/* Actions */}
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
                      className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Solicitar Resgate Pix
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
