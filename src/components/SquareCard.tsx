import React, { useState } from 'react';
import { Square } from '../types';
import { Check, Edit2, ChevronRight, PlusCircle, Trash2, Smartphone, Banknote } from 'lucide-react';
import { motion } from 'motion/react';

interface SquareCardProps {
  key?: string;
  square: Square;
  index: number;
  onToggleComplete: (squareId: string, initialMethod?: 'pix' | 'cash') => void;
  onPartialDeposit?: (squareId: string, amount: number) => void;
  isEditorMode: boolean;
  onEditValue?: (squareId: string, newValue: number) => void;
  onDeleteSquare?: (squareId: string) => void;
  currencySymbol: string;
  accentColor: 'emerald' | 'blue' | 'gold' | 'violet' | 'amber';
  roundness: 'none' | 'md' | 'xl' | 'full';
  // Extra Premium Styling Props
  squareSize?: 'sm' | 'md' | 'lg';
  squareFormat?: 'square' | 'circle' | 'rounded';
  borderStyle?: 'none' | 'thin' | 'thick';
  fontFamily?: 'inter' | 'grotesk' | 'mono' | 'playfair';
}

export default function SquareCard({
  square,
  index,
  onToggleComplete,
  onPartialDeposit,
  isEditorMode,
  onEditValue,
  onDeleteSquare,
  currencySymbol,
  accentColor,
  roundness,
  squareSize = 'md',
  squareFormat = 'rounded',
  borderStyle = 'thin',
  fontFamily = 'inter',
}: SquareCardProps) {
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [editedValue, setEditedValue] = useState(square.value.toString());

  const handleEditValueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newValue = parseFloat(editedValue);
    if (!isNaN(newValue) && newValue > 0 && onEditValue) {
      onEditValue(square.id, newValue);
      setIsEditingValue(false);
    }
  };

  // Get CSS classes for format & roundness
  const getFormatClass = () => {
    if (squareFormat === 'circle') return 'rounded-full';
    if (squareFormat === 'square') return 'rounded-none';
    
    switch (roundness) {
      case 'none': return 'rounded-none';
      case 'md': return 'rounded-lg';
      case 'xl': return 'rounded-2xl';
      case 'full': return 'rounded-[2rem]';
      default: return 'rounded-2xl';
    }
  };

  // Get Border size class
  const getBorderClass = () => {
    if (borderStyle === 'none') return 'border-0';
    if (borderStyle === 'thick') return 'border-2';
    return 'border';
  };

  // Get Font style class
  const getFontClass = () => {
    switch (fontFamily) {
      case 'mono': return 'font-mono';
      case 'playfair': return 'font-serif';
      case 'grotesk': return 'font-sans tracking-wide font-semibold';
      default: return 'font-sans';
    }
  };

  // Get Size styling
  const getSizeClass = () => {
    switch (squareSize) {
      case 'sm': return 'p-2 text-xs min-h-[6rem] pb-2.5';
      case 'lg': return 'p-4 text-base min-h-[8rem] pb-4';
      default: return 'p-3 text-sm min-h-[7.2rem] pb-3.5';
    }
  };

  // Color mappings
  const colorMap = {
    emerald: {
      text: 'text-emerald-400',
      border: 'border-emerald-500/80',
      bg: 'bg-emerald-950/20',
      shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]',
      progress: 'bg-emerald-400',
      lightBg: 'bg-emerald-950/50'
    },
    blue: {
      text: 'text-cyan-400',
      border: 'border-cyan-500/80',
      bg: 'bg-cyan-950/20',
      shadow: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]',
      progress: 'bg-cyan-400',
      lightBg: 'bg-cyan-950/50'
    },
    gold: {
      text: 'text-amber-400',
      border: 'border-amber-500/80',
      bg: 'bg-amber-950/20',
      shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]',
      progress: 'bg-amber-400',
      lightBg: 'bg-amber-950/50'
    },
    violet: {
      text: 'text-violet-400',
      border: 'border-violet-500/80',
      bg: 'bg-violet-950/20',
      shadow: 'shadow-[0_0_15px_rgba(139,92,246,0.15)]',
      progress: 'bg-violet-400',
      lightBg: 'bg-violet-950/50'
    },
    amber: {
      text: 'text-amber-500',
      border: 'border-amber-600/85',
      bg: 'bg-amber-950/15',
      shadow: 'shadow-[0_0_15px_rgba(217,119,6,0.15)]',
      progress: 'bg-amber-500',
      lightBg: 'bg-amber-950/30'
    },
  };

  const selectedColor = colorMap[accentColor] || colorMap.blue;

  // Progress percentage for this individual square if partial
  const partialPercent = square.value > 0 ? (square.saved / square.value) * 100 : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={`relative group flex flex-col justify-between transition-all duration-300 overflow-hidden ${getFormatClass()} ${getBorderClass()} ${getSizeClass()} ${getFontClass()} ${
        square.isCompleted || square.saved >= square.value
          ? `${selectedColor.bg} ${selectedColor.border} ${selectedColor.shadow} ${selectedColor.text}`
          : square.saved > 0
          ? 'bg-neutral-900 border-neutral-700 text-cyan-400 animate-pulse'
          : 'bg-[#151515] border-neutral-800 text-neutral-300 hover:border-neutral-700'
      }`}
    >
      {/* 1. Editor Mode: Absolute deletion / action triggers */}
      {isEditorMode && (
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          <button
            onClick={() => {
              setIsEditingValue(!isEditingValue);
              setEditedValue(square.value.toString());
            }}
            className="p-1 bg-neutral-900 border border-neutral-800 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Editar valor"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          {onDeleteSquare && (
            <button
              onClick={() => onDeleteSquare(square.id)}
              className="p-1 bg-red-950/40 border border-red-500/20 rounded text-red-400 hover:text-red-300 transition-colors cursor-pointer"
              title="Excluir quadrado"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Main click zone for normal completion toggle */}
      <div
        className={`flex-1 flex flex-col justify-between ${isEditorMode ? 'pointer-events-none' : 'cursor-pointer'}`}
        onClick={() => {
          if (!isEditorMode) {
            onToggleComplete(square.id);
          }
        }}
      >
        {/* Top bar (Index Label) */}
        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 font-semibold mb-1">
          <span>#{index + 1}</span>
          {square.isCompleted && (
            <span className={`${selectedColor.text} animate-bounce`}>
              <Check className="w-3 h-3 stroke-[3]" />
            </span>
          )}
        </div>

        {/* Middle Value / Inputs */}
        <div className="my-auto text-center">
          {isEditingValue ? (
            <form onSubmit={handleEditValueSubmit} className="pointer-events-auto" onClick={(e) => e.stopPropagation()}>
              <input
                type="number"
                value={editedValue}
                onChange={(e) => setEditedValue(e.target.value)}
                onBlur={handleEditValueSubmit}
                className="w-full bg-neutral-900 border border-neutral-700 rounded px-1 py-0.5 text-xs text-white text-center font-mono font-bold focus:outline-none focus:border-cyan-500"
                autoFocus
              />
            </form>
          ) : (
            <div className="text-sm sm:text-base font-extrabold font-mono tracking-tight text-white">
              {currencySymbol} {square.value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </div>
          )}

          {/* Savings progress description */}
          {!isEditingValue && (
            <div className="mt-2 text-center">
              {square.isCompleted ? (
                <div className="text-[10px] text-neutral-400">
                  <span className={`${selectedColor.text} font-black font-sans bg-neutral-900/60 px-2.5 py-1 rounded-full border border-neutral-800/40`}>
                    Pago
                  </span>
                </div>
              ) : (
                <div className="flex gap-1.5 justify-center mt-1 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onToggleComplete(square.id, 'pix')}
                    className="flex-1 py-1 px-1 bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-500/20 hover:border-cyan-500/50 rounded text-[9px] font-extrabold text-cyan-400 transition-all flex items-center justify-center gap-1 cursor-pointer"
                    title="Pagar com Pix"
                  >
                    <Smartphone size={10} className="shrink-0" />
                    Pix
                  </button>
                  <button
                    onClick={() => onToggleComplete(square.id, 'cash')}
                    className="flex-1 py-1 px-1 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/20 hover:border-emerald-500/50 rounded text-[9px] font-extrabold text-emerald-400 transition-all flex items-center justify-center gap-1 cursor-pointer"
                    title="Depositar em Dinheiro"
                  >
                    <Banknote size={10} className="shrink-0" />
                    Depósito
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
