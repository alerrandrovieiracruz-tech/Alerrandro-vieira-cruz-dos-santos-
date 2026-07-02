import React, { useState } from 'react';
import { Challenge, HistoryEntry } from '../types';
import { motion } from 'motion/react';
import {
  TrendingUp,
  Award,
  Calendar,
  Sparkles,
  Search,
  CheckCircle2,
  Lock,
  Globe,
  Star,
  Copy,
  Archive,
  Trash2,
  FolderOpen,
  ArrowUpRight,
  ShieldCheck,
  Eye,
  Plus
} from 'lucide-react';

interface DashboardOverviewProps {
  challenges: Challenge[];
  history: HistoryEntry[];
  currencySymbol: string;
  onSelectChallenge: (id: string) => void;
  onDuplicateChallenge: (challenge: Challenge) => void;
  onArchiveChallenge: (id: string) => void;
  onDeleteChallenge: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onCreateNewChallenge: () => void;
  activeChallengeId: string;
  accentColor: string;
}

export default function DashboardOverview({
  challenges,
  history,
  currencySymbol,
  onSelectChallenge,
  onDuplicateChallenge,
  onArchiveChallenge,
  onDeleteChallenge,
  onToggleFavorite,
  onCreateNewChallenge,
  activeChallengeId,
  accentColor
}: DashboardOverviewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [tabFilter, setTabFilter] = useState<'all' | 'favorites' | 'active' | 'completed' | 'archived'>('all');

  // Aggregated Stats
  const totalChallenges = challenges.length;
  const activeChallenges = challenges.filter(c => !c.isArchived).length;
  const completedChallenges = challenges.filter(c => {
    const saved = c.squares.reduce((sum, s) => sum + s.saved, 0);
    return saved >= c.targetGoal;
  });
  const completedCount = completedChallenges.length;

  // Total saved across all challenges
  const totalSavedAllChallenges = challenges.reduce((sum, c) => {
    return sum + c.squares.reduce((sSum, s) => sSum + s.saved, 0);
  }, 0);

  // Total goal sum of all active challenges
  const totalGoalAllChallenges = challenges.filter(c => !c.isArchived).reduce((sum, c) => sum + c.targetGoal, 0);

  // Overall combined progress percent
  const overallProgressPercent = totalGoalAllChallenges > 0 
    ? Math.round((totalSavedAllChallenges / totalGoalAllChallenges) * 100) 
    : 0;

  // Filter challenges
  const filteredChallenges = challenges.filter((c) => {
    // 1. Search Query
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 2. Category
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;

    // 3. Status tab
    const isCompleted = c.squares.reduce((sum, s) => sum + s.saved, 0) >= c.targetGoal;
    let matchesTab = true;
    if (tabFilter === 'favorites') matchesTab = !!c.isFavorite;
    else if (tabFilter === 'active') matchesTab = !c.isArchived && !isCompleted;
    else if (tabFilter === 'completed') matchesTab = isCompleted;
    else if (tabFilter === 'archived') matchesTab = !!c.isArchived;
    else matchesTab = !c.isArchived; // default all is non-archived

    return matchesSearch && matchesCategory && matchesTab;
  });

  const getCategoryEmoji = (cat: string) => {
    switch (cat) {
      case 'emergency': return '🛡️';
      case 'travel': return '✈️';
      case 'car': return '🚗';
      case 'home': return '🏠';
      case 'education': return '🎓';
      case 'marriage': return '❤️';
      case 'device': return '📱';
      default: return '✨';
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'emergency': return 'Fundo Reserva';
      case 'travel': return 'Viagem';
      case 'car': return 'Automóvel';
      case 'home': return 'Imóvel / Reforma';
      case 'education': return 'Educação';
      case 'marriage': return 'Casamento / Festa';
      case 'device': return 'Dispositivos';
      default: return 'Personalizado';
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. AGGREGATED METRICS HUD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Metric A: Total Accumulado */}
        <div className="bg-[#111111] border border-neutral-800/60 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-xl">
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Total Economizado</span>
            <div className="p-1.5 bg-emerald-950/20 text-emerald-400 border border-emerald-500/15 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-white font-mono">{currencySymbol} {totalSavedAllChallenges.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            <span className="text-[10px] text-emerald-400 font-bold block mt-1.5 uppercase">✓ Registrado nas Tabelas</span>
          </div>
        </div>

        {/* Metric B: Progresso Geral */}
        <div className="bg-[#111111] border border-neutral-800/60 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-xl">
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Progresso Geral</span>
            <div className="p-1.5 bg-cyan-950/20 text-cyan-400 border border-cyan-500/15 rounded-lg">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-black text-white font-mono">{overallProgressPercent}%</span>
              <span className="text-[10px] text-neutral-500 font-mono">de {currencySymbol}{totalGoalAllChallenges.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(100, overallProgressPercent)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Metric C: Metas Ativas */}
        <div className="bg-[#111111] border border-neutral-800/60 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Desafios Ativos</span>
            <span className="text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-300 px-2.5 py-1 rounded-md font-mono">
              {activeChallenges}
            </span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-white font-mono">{activeChallenges} / {totalChallenges}</span>
            <span className="text-[10px] text-neutral-500 block mt-1.5">Organização visual ilimitada</span>
          </div>
        </div>

        {/* Metric D: Metas Concluídas */}
        <div className="bg-[#111111] border border-neutral-800/60 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-xl">
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-yellow-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Metas Concluídas</span>
            <div className="p-1.5 bg-yellow-950/20 text-yellow-400 border border-yellow-500/15 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-white font-mono">{completedCount}</span>
            <span className="text-[10px] text-yellow-500 font-bold block mt-1.5 uppercase">🏆 Conquistas Desbloqueadas</span>
          </div>
        </div>

      </div>

      {/* 2. MAIN DASHBOARD CONTENT AREA */}
      <div className="bg-[#121212] border border-neutral-800/50 rounded-2xl p-6">
        
        {/* Challenge Controls and Search Headers */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-neutral-800/40 pb-5">
          
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FolderOpen className="text-cyan-400 w-5 h-5" /> Seus Desafios Financeiros
            </h2>
            <p className="text-xs text-neutral-400">Gerencie e selecione qual tabela você deseja marcar no momento.</p>
          </div>

          <button
            onClick={onCreateNewChallenge}
            className="self-start md:self-auto py-2 px-4 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-cyan-950/20"
          >
            <Plus size={14} className="stroke-[2.5]" /> Criar Novo Desafio
          </button>

        </div>

        {/* Filters bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
          
          {/* Tabs Filter */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 p-1 rounded-xl w-full sm:w-auto overflow-x-auto gap-1">
            {(['all', 'favorites', 'active', 'completed', 'archived'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setTabFilter(tab)}
                className={`py-2 px-3.5 text-xs font-bold rounded-lg transition-all capitalize cursor-pointer shrink-0 ${
                  tabFilter === tab
                    ? 'bg-neutral-800 text-white shadow'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {tab === 'all' ? 'Tudo' : tab === 'favorites' ? '★ Favoritos' : tab === 'active' ? 'Em Andamento' : tab === 'completed' ? 'Concluídos' : 'Arquivados'}
              </button>
            ))}
          </div>

          {/* Search Inputs & Category selector */}
          <div className="flex gap-2 w-full sm:w-auto">
            
            {/* Search Input */}
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 w-3.5 h-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar..."
                className="bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500 w-full sm:w-44 transition-all"
              />
            </div>

            {/* Category selection dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="all">Todas Categorias</option>
              <option value="emergency">Emergency Fund</option>
              <option value="travel">Viagem</option>
              <option value="car">Carro Novo</option>
              <option value="home">Casa Própria</option>
              <option value="education">Educação</option>
              <option value="marriage">Casamento</option>
              <option value="device">Smartphone/PC</option>
              <option value="custom">Outros</option>
            </select>

          </div>

        </div>

        {/* 3. CHALLENGES GRID LIST */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChallenges.length === 0 ? (
            <div className="col-span-full py-16 text-center text-neutral-500 border border-dashed border-neutral-800/80 rounded-2xl bg-neutral-950/20">
              <p className="text-sm font-semibold mb-2">Nenhum desafio encontrado</p>
              <p className="text-xs text-neutral-600 max-w-xs mx-auto">Tente ajustar seus filtros de busca ou crie um novo desafio para começar!</p>
            </div>
          ) : (
            filteredChallenges.map((challenge) => {
              const saved = challenge.squares.reduce((sum, s) => sum + s.saved, 0);
              const progressPercent = challenge.targetGoal > 0 
                ? Math.round((saved / challenge.targetGoal) * 100) 
                : 0;
              const isChallengeCompleted = saved >= challenge.targetGoal;
              const completedSquares = challenge.squares.filter(s => s.isCompleted).length;
              const totalSquares = challenge.squares.length;

              const isSelected = challenge.id === activeChallengeId;

              return (
                <motion.div
                  key={challenge.id}
                  layoutId={`challenge-card-${challenge.id}`}
                  className={`border rounded-2xl p-5 flex flex-col justify-between transition-all group relative overflow-hidden ${
                    isSelected
                      ? 'bg-neutral-900/40 border-cyan-500/40 shadow-xl shadow-cyan-950/5'
                      : 'bg-[#161616]/30 border-neutral-800/70 hover:bg-[#161616]/70 hover:border-neutral-700/80'
                  }`}
                >
                  {/* Selected indicator line */}
                  {isSelected && (
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 to-emerald-500" />
                  )}

                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl shrink-0">
                          {getCategoryEmoji(challenge.category)}
                        </span>
                        <div>
                          <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block">
                            {getCategoryLabel(challenge.category)}
                          </span>
                          <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors tracking-tight line-clamp-1">
                            {challenge.title}
                          </h4>
                        </div>
                      </div>

                      {/* Favorite star */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(challenge.id);
                        }}
                        className="text-neutral-500 hover:text-yellow-400 p-1 rounded-lg hover:bg-neutral-900 transition-all cursor-pointer shrink-0"
                        title={challenge.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                      >
                        <Star 
                          className={`w-4 h-4 ${challenge.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} 
                        />
                      </button>
                    </div>

                    {/* Deadline helper */}
                    {challenge.deadline && (
                      <p className="text-[10px] text-neutral-500 flex items-center gap-1 mb-4 font-medium">
                        <Calendar className="w-3 h-3 text-neutral-600" /> Prazo:{' '}
                        <span className="font-semibold text-neutral-400">
                          {new Date(challenge.deadline).toLocaleDateString('pt-BR')}
                        </span>
                      </p>
                    )}

                    {/* Progress representation */}
                    <div className="space-y-2 mb-5">
                      <div className="flex justify-between items-baseline text-xs">
                        <span className="text-neutral-400 font-medium">Progresso</span>
                        <span className="font-extrabold text-white font-mono">{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-300"
                          style={{ width: `${Math.min(100, progressPercent)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                        <span>{currencySymbol}{saved.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                        <span>{completedSquares}/{totalSquares} partes</span>
                        <span>{currencySymbol}{challenge.targetGoal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between gap-2 border-t border-neutral-800/40 pt-3.5 mt-2.5">
                    
                    <button
                      onClick={() => onSelectChallenge(challenge.id)}
                      className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Ver Tabela
                    </button>

                    <div className="flex items-center gap-1.5">
                      {/* Duplicate */}
                      <button
                        onClick={() => onDuplicateChallenge(challenge)}
                        className="p-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800/80 rounded-lg text-neutral-400 hover:text-white transition-all cursor-pointer"
                        title="Duplicar Desafio"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Archive */}
                      <button
                        onClick={() => onArchiveChallenge(challenge.id)}
                        className={`p-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800/80 rounded-lg text-neutral-400 hover:text-white transition-all cursor-pointer ${
                          challenge.isArchived ? 'text-amber-500 border-amber-500/20' : ''
                        }`}
                        title={challenge.isArchived ? 'Desarquivar Desafio' : 'Arquivar Desafio'}
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>

                      {/* Exclude */}
                      <button
                        onClick={() => onDeleteChallenge(challenge.id)}
                        className="p-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-950 text-red-400 rounded-lg transition-all cursor-pointer"
                        title="Excluir Desafio"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                    </div>

                  </div>

                </motion.div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
}
