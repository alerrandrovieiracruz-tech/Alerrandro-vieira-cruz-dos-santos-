import React, { useState } from 'react';
import { Challenge } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Share2, Facebook, Twitter, ShieldCheck } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: Challenge;
  currencySymbol: string;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function ShareModal({ isOpen, onClose, challenge, currencySymbol, onToast }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const saved = challenge.squares.reduce((sum, s) => sum + s.saved, 0);
  const progressPercent = challenge.targetGoal > 0 
    ? Math.round((saved / challenge.targetGoal) * 100) 
    : 0;

  // Generate share link
  const currentUrl = window.location.origin;
  const shareUrl = `${currentUrl}/challenge?id=${challenge.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    onToast('Link de compartilhamento copiado!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = `Estou poupando para minha meta "${challenge.title}" no Desafio do Cofre Premium! Já completei ${progressPercent}% da minha meta de ${currencySymbol} ${challenge.targetGoal}!`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

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
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-sans">Compartilhar Progresso</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Mostre sua conquista e motive seus amigos!</p>
              </div>
            </div>

            {/* Sharing Preview Card */}
            <div className="bg-[#171717] border border-neutral-800/70 p-5 rounded-2xl mb-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
              
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950/20 border border-cyan-500/10 px-2 py-0.5 rounded">
                  {challenge.category}
                </span>
                <span className="text-[10px] text-neutral-500">Cofre Premium</span>
              </div>

              <h4 className="text-base font-extrabold text-white mb-4">{challenge.title}</h4>

              {/* Progress representation */}
              <div className="space-y-2 mb-2">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-neutral-400">Progresso</span>
                  <span className="font-extrabold text-white font-mono">{progressPercent}%</span>
                </div>
                <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                  <span>Já marcado: {currencySymbol}{saved.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                  <span>Meta: {currencySymbol}{challenge.targetGoal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-2">
                  Link de Compartilhamento do Desafio
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 bg-[#181818] border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-neutral-300 font-mono focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>

              {/* Quick social share buttons */}
              <div className="flex gap-2 pt-1">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 bg-[#1da1f2]/10 hover:bg-[#1da1f2]/20 border border-[#1da1f2]/20 text-[#1da1f2] font-bold text-xs rounded-xl text-center flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Twitter className="w-4 h-4 fill-current" /> Twitter
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 bg-[#1877f2]/10 hover:bg-[#1877f2]/20 border border-[#1877f2]/20 text-[#1877f2] font-bold text-xs rounded-xl text-center flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Facebook className="w-4 h-4 fill-current" /> Facebook
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
