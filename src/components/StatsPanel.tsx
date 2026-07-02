import React from 'react';
import { Challenge, HistoryEntry } from '../types';
import { TrendingUp, Target, Shield, Calendar, Sparkles, Flame, Percent, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface StatsPanelProps {
  challenge: Challenge;
  history: HistoryEntry[];
  currencySymbol: string;
  accentColor: 'emerald' | 'blue' | 'gold' | 'violet' | 'amber';
  onRedeemPix?: () => void;
}

export default function StatsPanel({ challenge, history, currencySymbol, accentColor, onRedeemPix }: StatsPanelProps) {
  const squares = challenge.squares;
  const totalSaved = squares.reduce((sum, s) => sum + s.saved, 0);
  const remainingValue = Math.max(0, challenge.targetGoal - totalSaved);
  const totalSquares = squares.length;
  const completedSquares = squares.filter((s) => s.isCompleted).length;
  const remainingSquares = totalSquares - completedSquares;
  const percentage = challenge.targetGoal > 0 ? (totalSaved / challenge.targetGoal) * 100 : 0;

  // Calculate days elapsed from createdAt
  const startDate = new Date(challenge.createdAt);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; // minimum 1 day

  // Filter history entries related to this challenge
  const challengeHistory = history.filter((h) => h.challengeId === challenge.id);
  const depositEntries = challengeHistory.filter((h) => h.value > 0);
  const totalDeposits = depositEntries.length;

  // Average deposits
  const dailyAverage = totalSaved / diffDays;
  const weeklyAverage = dailyAverage * 7;
  const monthlyAverage = dailyAverage * 30.4;

  // Projected time to goal
  const projectedDaysLeft = dailyAverage > 0 ? Math.ceil(remainingValue / dailyAverage) : null;

  // Deadline logic
  let daysToDeadline = null;
  let isOverdue = false;
  if (challenge.deadline) {
    const deadlineDate = new Date(challenge.deadline);
    const timeDiff = deadlineDate.getTime() - today.getTime();
    daysToDeadline = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    isOverdue = daysToDeadline < 0;
  }

  // Accent color mapping
  const colorMap = {
    emerald: 'from-emerald-600 via-emerald-400 to-cyan-400',
    blue: 'from-cyan-600 via-cyan-400 to-indigo-500',
    gold: 'from-amber-600 via-amber-400 to-yellow-300',
    violet: 'from-violet-600 via-violet-400 to-fuchsia-400',
    amber: 'from-amber-600 via-amber-500 to-red-400',
  };

  const gradientClass = colorMap[accentColor] || colorMap.blue;

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in" id="stats-dashboard-panel">
      {/* Primary Goal Card (Left side) */}
      <div className="md:col-span-2 bg-[#121212] border border-neutral-800/60 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
        {/* Background glow decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Progresso Geral</span>
            <span className="text-xs text-cyan-400 font-semibold font-mono bg-cyan-950/20 border border-cyan-500/10 px-2 py-0.5 rounded-full">
              {percentage === 100 ? '⭐ Desafio Concluído!' : 'Desafio Ativo'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl md:text-4xl font-extrabold font-mono text-cyan-400">
                  {currencySymbol} {totalSaved.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-neutral-500">economizados</span>
              </div>
              <div className="text-neutral-400 text-sm sm:ml-4">
                meta de <span className="font-bold text-white font-mono">{currencySymbol} {challenge.targetGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            {onRedeemPix && (
              totalSaved >= challenge.targetGoal && challenge.targetGoal > 0 ? (
                <button
                  onClick={onRedeemPix}
                  className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:scale-[1.02] active:scale-95 cursor-pointer self-start sm:self-center"
                >
                  💸 Sacar Dinheiro via Pix
                </button>
              ) : (
                <div className="flex flex-col items-start sm:items-end gap-1">
                  <button
                    disabled
                    className="py-2.5 px-4 bg-emerald-950/25 border border-emerald-500/15 text-emerald-500/50 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-not-allowed self-start sm:self-center opacity-85"
                    title="O resgate de dinheiro via Pix só estará disponível após concluir 100% da meta do cofre."
                  >
                    🔒 Sacar via Pix (Bloqueado)
                  </button>
                  <span className="text-[10px] text-emerald-500/60 font-medium">Libera ao atingir 100% da meta</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-neutral-400">Status de Conclusão</span>
            <span className="text-sm font-bold font-mono text-cyan-400">{percentage.toFixed(1)}%</span>
          </div>
          
          <div className="h-4 w-full bg-[#171717] rounded-full border border-neutral-800/60 p-[2px] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full bg-gradient-to-r ${gradientClass} rounded-full`}
            />
          </div>

          {/* Quick Stats list under bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-neutral-800/40">
            <div>
              <span className="text-[10px] text-neutral-500 block uppercase font-semibold">Restante</span>
              <span className="text-sm font-bold text-white font-mono">
                {currencySymbol} {remainingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 block uppercase font-semibold">Iniciou em</span>
              <span className="text-sm font-bold text-neutral-300">{startDate.toLocaleDateString('pt-BR')}</span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 block uppercase font-semibold">Completados</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                {completedSquares} <span className="text-xs text-neutral-500">/ {totalSquares}</span>
              </span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 block uppercase font-semibold">Não Preenchidos</span>
              <span className="text-sm font-bold text-neutral-300 font-mono">{remainingSquares}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Speed & Analytics Box */}
      <div className="bg-[#121212] border border-neutral-800/60 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
        {/* Background glow decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-500" /> Estatísticas e Projeções
          </h3>

          <div className="space-y-4">
            {/* Average Info */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-emerald-400">
                <Target size={16} />
              </div>
              <div>
                <span className="text-neutral-500 text-[10px] block uppercase">Média Diária</span>
                <span className="text-sm font-bold text-white font-mono">
                  {currencySymbol} {dailyAverage.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Projected Finish */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-cyan-400">
                <Clock size={16} />
              </div>
              <div>
                <span className="text-neutral-500 text-[10px] block uppercase">Meta estimada em</span>
                <span className="text-sm font-bold text-white font-sans">
                  {projectedDaysLeft !== null && projectedDaysLeft !== Infinity
                    ? `~ ${projectedDaysLeft} dias restantes`
                    : 'Fazer o primeiro depósito'}
                </span>
              </div>
            </div>

            {/* Deadline status if set */}
            {challenge.deadline && (
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg border ${isOverdue ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'}`}>
                  <Calendar size={16} />
                </div>
                <div>
                  <span className="text-neutral-500 text-[10px] block uppercase">Prazo final</span>
                  <span className={`text-sm font-bold ${isOverdue ? 'text-red-400' : 'text-neutral-200'}`}>
                    {isOverdue ? 'Vencido!' : `Faltam ${daysToDeadline} dias`}
                  </span>
                </div>
              </div>
            )}

            {/* Medals & Level badges */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-yellow-500">
                <Shield size={16} />
              </div>
              <div>
                <span className="text-neutral-500 text-[10px] block uppercase">Nível do Poupador</span>
                <span className="text-xs font-bold text-yellow-500 bg-yellow-950/20 border border-yellow-500/15 px-2 py-0.5 rounded-full inline-block">
                  {percentage >= 100
                    ? '🏆 Diamante'
                    : percentage >= 75
                    ? '🥇 Ouro'
                    : percentage >= 50
                    ? '🥈 Prata'
                    : percentage >= 25
                    ? '🥉 Bronze'
                    : '🌱 Iniciante'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Projections footer */}
        <div className="text-[11px] text-neutral-500 italic mt-6 border-t border-neutral-800/40 pt-3 flex flex-col gap-1">
          <div className="flex justify-between">
            <span>Ritmo semanal:</span>
            <span className="font-mono font-semibold text-neutral-300">
              {currencySymbol} {weeklyAverage.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Ritmo mensal:</span>
            <span className="font-mono font-semibold text-neutral-300">
              {currencySymbol} {monthlyAverage.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
