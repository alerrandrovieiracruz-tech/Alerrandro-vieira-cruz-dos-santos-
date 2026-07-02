import React, { useState } from 'react';
import { Shield, Delete, RefreshCw, Lock } from 'lucide-react';
import { motion } from 'motion/react';

interface PINLockScreenProps {
  correctPin: string;
  onUnlock: () => void;
  onResetPin?: () => void;
}

export function PINLockScreen({ correctPin, onUnlock, onResetPin }: PINLockScreenProps) {
  const [enteredPin, setEnteredPin] = useState('');
  const [isError, setIsError] = useState(false);

  const handleKeyPress = (num: string) => {
    if (enteredPin.length < 4) {
      setIsError(false);
      const newPin = enteredPin + num;
      setEnteredPin(newPin);

      if (newPin === correctPin) {
        setTimeout(() => {
          onUnlock();
          setEnteredPin('');
        }, 300);
      } else if (newPin.length === 4) {
        // Wrong PIN
        setTimeout(() => {
          setIsError(true);
          setEnteredPin('');
        }, 200);
      }
    }
  };

  const handleDelete = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setIsError(false);
  };

  const handleClear = () => {
    setEnteredPin('');
    setIsError(false);
  };

  return (
    <div className="fixed inset-0 bg-[#0A0A0A] z-50 flex flex-col items-center justify-center p-6 select-none font-sans">
      <div className="max-w-md w-full flex flex-col items-center">
        {/* Shield Icon or Lock Icon */}
        <motion.div
          animate={isError ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          className={`p-5 rounded-3xl mb-6 border ${
            isError
              ? 'bg-red-500/10 border-red-500/20 text-red-400'
              : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
          }`}
        >
          {isError ? <Shield size={36} className="animate-bounce" /> : <Lock size={36} />}
        </motion.div>

        {/* Title / Info */}
        <h2 className="text-xl font-semibold text-white tracking-tight mb-2">
          Desafio do Cofre Protegido
        </h2>
        <p className="text-sm text-neutral-400 mb-8 text-center">
          {isError ? 'Código PIN incorreto. Tente novamente.' : 'Insira o seu PIN de 4 dígitos para acessar suas finanças.'}
        </p>

        {/* PIN Indicators */}
        <div className="flex gap-4 mb-12">
          {[0, 1, 2, 3].map((index) => {
            const hasValue = enteredPin.length > index;
            return (
              <motion.div
                key={index}
                animate={hasValue ? { scale: [1, 1.2, 1] } : {}}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  hasValue
                    ? isError
                      ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                      : 'bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                    : 'bg-neutral-800 border border-neutral-700'
                }`}
              />
            );
          })}
        </div>

        {/* Keyboard Grid */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-[320px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="aspect-square flex items-center justify-center rounded-2xl bg-neutral-900/60 border border-neutral-800/60 text-white text-xl font-bold font-mono hover:bg-neutral-800 hover:border-neutral-700 transition-all duration-150 cursor-pointer active:scale-95"
            >
              {num}
            </button>
          ))}

          {/* Special Buttons */}
          <button
            onClick={handleClear}
            className="aspect-square flex items-center justify-center rounded-2xl text-xs font-semibold text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/30 transition-all cursor-pointer active:scale-95"
          >
            Limpar
          </button>

          <button
            onClick={() => handleKeyPress('0')}
            className="aspect-square flex items-center justify-center rounded-2xl bg-neutral-900/60 border border-neutral-800/60 text-white text-xl font-bold font-mono hover:bg-neutral-800 hover:border-neutral-700 transition-all duration-150 cursor-pointer active:scale-95"
          >
            0
          </button>

          <button
            onClick={handleDelete}
            className="aspect-square flex items-center justify-center rounded-2xl bg-neutral-900/30 text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-all cursor-pointer active:scale-95"
          >
            <Delete size={20} />
          </button>
        </div>

        {/* Forgot PIN fallback */}
        {onResetPin && (
          <button
            onClick={onResetPin}
            className="mt-8 flex items-center gap-1.5 text-xs text-neutral-500 hover:text-cyan-400 transition-all cursor-pointer"
          >
            <RefreshCw size={12} />
            <span>Redefinir / Esqueci o PIN</span>
          </button>
        )}
      </div>
    </div>
  );
}
