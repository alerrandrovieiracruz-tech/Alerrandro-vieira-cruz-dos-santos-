import React, { useState, useEffect } from 'react';
import { PRESETS, CATEGORIES, generateChallengeSquares, createNewChallenge } from '../utils/challenge';
import { Challenge } from '../types';
import { Sparkles, Trophy, Flame, CheckCircle, ShieldAlert, Plane, Car, Home, GraduationCap, Heart, Smartphone, Coins } from 'lucide-react';

// Map icon string to Lucide component
const categoryIcons: Record<string, React.ComponentType<any>> = {
  ShieldAlert,
  Plane,
  Car,
  Home,
  GraduationCap,
  Heart,
  Smartphone,
  Sparkles,
};

interface ChallengeCreatorProps {
  onChallengeCreated: (challenge: Challenge) => void;
  currencySymbol: string;
}

export default function ChallengeCreator({ onChallengeCreated, currencySymbol }: ChallengeCreatorProps) {
  const [title, setTitle] = useState('Reserva de Emergência');
  const [targetGoal, setTargetGoal] = useState<number>(3000);
  const [squareCount, setSquareCount] = useState<number>(100);
  const [minValue, setMinValue] = useState<number>(10);
  const [maxValue, setMaxValue] = useState<number>(50);
  const [category, setCategory] = useState<Challenge['category']>('emergency');
  const [deadline, setDeadline] = useState<string>('');

  // Custom manual input option
  const [generationMode, setGenerationMode] = useState<'auto' | 'manual'>('auto');
  const [manualInput, setManualInput] = useState<string>('10, 20, 30, 40');
  const [manualError, setManualError] = useState<string | null>(null);

  const [simulation, setSimulation] = useState<number[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Update title automatically when category changes (unless customized by user)
  const handleCategorySelect = (catId: Challenge['category'], defaultName: string) => {
    setCategory(catId);
    setTitle(defaultName);
  };

  // Run simulation of distribution when values change
  useEffect(() => {
    if (generationMode === 'auto') {
      if (squareCount <= 0) {
        setValidationError('A quantidade de quadrados deve ser maior que 0.');
        setSimulation([]);
        return;
      }
      if (minValue <= 0 || maxValue <= 0) {
        setValidationError('Os valores mínimos e máximos devem ser maiores que 0.');
        setSimulation([]);
        return;
      }
      if (minValue > maxValue) {
        setValidationError('O valor mínimo não pode ser maior que o valor máximo.');
        setSimulation([]);
        return;
      }

      const minPossibleSum = minValue * squareCount;
      const maxPossibleSum = maxValue * squareCount;

      if (targetGoal < minPossibleSum) {
        setValidationError(
          `A meta (${currencySymbol} ${targetGoal}) é menor que a soma mínima possível (${currencySymbol} ${minPossibleSum}) para ${squareCount} quadrados de ${currencySymbol} ${minValue}.`
        );
        setSimulation([]);
        return;
      }

      if (targetGoal > maxPossibleSum) {
        setValidationError(
          `A meta (${currencySymbol} ${targetGoal}) é maior que a soma máxima possível (${currencySymbol} ${maxPossibleSum}) para ${squareCount} quadrados de ${currencySymbol} ${maxValue}.`
        );
        setSimulation([]);
        return;
      }

      setValidationError(null);
      try {
        const preview = generateChallengeSquares(targetGoal, squareCount, minValue, maxValue);
        setSimulation(preview);
      } catch (err) {
        setSimulation([]);
      }
    } else {
      // Manual validation
      try {
        const parsed = manualInput
          .split(/[\s,;]+/)
          .map((v) => parseFloat(v))
          .filter((v) => !isNaN(v));
        
        const sum = parsed.reduce((acc, curr) => acc + curr, 0);
        if (parsed.length === 0) {
          setManualError('Insira pelo menos um valor.');
          setSimulation([]);
        } else if (Math.abs(sum - targetGoal) > 0.01) {
          setManualError(
            `A soma dos valores inseridos (${currencySymbol} ${sum.toFixed(2)}) deve ser exatamente igual à meta (${currencySymbol} ${targetGoal.toFixed(2)}). Diferença: ${currencySymbol} ${(targetGoal - sum).toFixed(2)}.`
          );
          setSimulation(parsed);
        } else {
          setManualError(null);
          setValidationError(null);
          setSimulation(parsed);
        }
      } catch (err) {
        setManualError('Erro ao processar os valores manuais.');
        setSimulation([]);
      }
    }
  }, [targetGoal, squareCount, minValue, maxValue, generationMode, manualInput, currencySymbol]);

  const selectPreset = (preset: typeof PRESETS[0]) => {
    const selectedCat = CATEGORIES.find(c => c.id === preset.category);
    setTitle(selectedCat ? selectedCat.name : `Desafio ${preset.name}`);
    setTargetGoal(preset.goal);
    setSquareCount(preset.squares);
    setMinValue(preset.min);
    setMaxValue(preset.max);
    setCategory(preset.category);
    setGenerationMode('auto');
  };

  const handleLaunch = () => {
    if (validationError || (generationMode === 'manual' && manualError)) return;

    if (generationMode === 'auto') {
      const challenge = createNewChallenge(title, targetGoal, squareCount, minValue, maxValue, category, deadline);
      onChallengeCreated(challenge);
    } else {
      const parsed = manualInput
        .split(/[\s,;]+/)
        .map((v) => parseFloat(v))
        .filter((v) => !isNaN(v));
      
      const challenge = createNewChallenge(title, targetGoal, parsed.length, 0, 0, category, deadline, parsed);
      onChallengeCreated(challenge);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-[#121212] border border-neutral-800/60 rounded-2xl overflow-hidden shadow-2xl p-6 md:p-8" id="challenge-creator-panel">
      
      {/* Title section */}
      <div className="flex items-center gap-3 mb-8 border-b border-neutral-800/40 pb-6">
        <div className="p-3 bg-cyan-950/40 border border-cyan-800/30 rounded-xl text-cyan-400">
          <Trophy className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-sans">
            Novo Desafio Financeiro
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Escolha uma meta de economia, selecione uma categoria e personalize sua tabela inteligente.
          </p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="mb-8">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4 flex items-center gap-2">
          <Coins className="w-4 h-4 text-cyan-400" /> 1. Escolha a Categoria / Destino do Dinheiro
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CATEGORIES.map((cat) => {
            const IconComponent = categoryIcons[cat.icon] || Sparkles;
            const isSelected = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.id, cat.name)}
                className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-950/20 border-cyan-500 text-cyan-400 shadow-lg shadow-cyan-950/20'
                    : 'bg-neutral-900/40 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-cyan-500/20 text-cyan-400' : 'bg-neutral-800 text-neutral-400'}`}>
                  <IconComponent size={16} />
                </div>
                <span className="text-xs font-medium tracking-tight">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preset section */}
      <div className="mb-8">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" /> Presets de Metas Premium
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => selectPreset(preset)}
              className={`flex flex-col items-center justify-between p-3 rounded-xl border text-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ${
                targetGoal === preset.goal && squareCount === preset.squares && generationMode === 'auto'
                  ? 'bg-amber-950/20 border-amber-500 text-amber-400 shadow-lg shadow-amber-950/30'
                  : 'bg-[#171717] border-[#262626] text-neutral-300 hover:border-neutral-700'
              }`}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">{preset.name}</span>
              <span className="text-base font-bold font-mono mt-1 text-white">{currencySymbol} {preset.goal}</span>
              <span className="text-[11px] text-neutral-500 mt-0.5">{preset.squares} quadrados</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Configurations Form */}
        <div className="space-y-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
            2. Detalhes do Desafio
          </h3>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Título Personalizado</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#181818] border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-sans"
              placeholder="Ex: Minha Nova Viagem, Minha Reserva, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Meta de Economia ({currencySymbol})</label>
              <input
                type="number"
                value={targetGoal}
                onChange={(e) => setTargetGoal(Math.max(1, parseFloat(e.target.value) || 0))}
                className="w-full bg-[#181818] border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
              />
            </div>
            {generationMode === 'auto' && (
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Nº de Quadrados</label>
                <input
                  type="number"
                  value={squareCount}
                  onChange={(e) => setSquareCount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#181818] border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Prazo Estimado (Opcional)</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-[#181818] border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
            />
          </div>

          {/* Generation Mode Selectors */}
          <div className="flex gap-4 border-t border-neutral-800/40 pt-4">
            <button
              type="button"
              onClick={() => setGenerationMode('auto')}
              className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                generationMode === 'auto'
                  ? 'bg-cyan-950/30 border-cyan-500/50 text-cyan-400'
                  : 'bg-transparent border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              Geração Automática
            </button>
            <button
              type="button"
              onClick={() => setGenerationMode('manual')}
              className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                generationMode === 'manual'
                  ? 'bg-cyan-950/30 border-cyan-500/50 text-cyan-400'
                  : 'bg-transparent border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              Valores Manuais
            </button>
          </div>

          {generationMode === 'auto' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Valor Mínimo por quadrado</label>
                <input
                  type="number"
                  value={minValue}
                  onChange={(e) => setMinValue(Math.max(0.01, parseFloat(e.target.value) || 0))}
                  className="w-full bg-[#181818] border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Valor Máximo por quadrado</label>
                <input
                  type="number"
                  value={maxValue}
                  onChange={(e) => setMaxValue(Math.max(minValue, parseFloat(e.target.value) || 0))}
                  className="w-full bg-[#181818] border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Valores Separados por Vírgula ou Espaço
              </label>
              <textarea
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                rows={3}
                className="w-full bg-[#181818] border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                placeholder="Ex: 50, 100, 150, 200, 500"
              />
              <span className="text-[10px] text-neutral-500 mt-1 block">
                Insira os valores que somados darão exatamente {currencySymbol} {targetGoal.toLocaleString('pt-BR')}.
              </span>
            </div>
          )}
        </div>

        {/* Live Preview / Simulation */}
        <div className="flex flex-col bg-[#171717] border border-neutral-800/60 rounded-xl p-5 justify-between">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-cyan-400" /> Resumo e Distribuição Inteligente
            </h4>

            {validationError && (
              <div className="bg-red-950/20 border border-red-500/20 rounded-lg p-3 text-xs text-red-400 mb-4">
                {validationError}
              </div>
            )}

            {generationMode === 'manual' && manualError && (
              <div className="bg-amber-950/20 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-400 mb-4">
                {manualError}
              </div>
            )}

            {!validationError && (!manualError || generationMode === 'auto') && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs border-b border-neutral-800/40 pb-3">
                  <div>
                    <span className="text-neutral-500 block">Soma Total</span>
                    <span className="text-white font-bold font-mono text-base">
                      {currencySymbol} {targetGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Nº de Parcelas</span>
                    <span className="text-white font-bold font-mono text-base">
                      {simulation.length} quadrados
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-neutral-500 text-[11px] uppercase tracking-wider block mb-2">
                    Prévia da Distribuição de Valores
                  </span>
                  
                  {/* Miniature Grid Preview */}
                  <div className="grid grid-cols-5 gap-1.5 max-h-36 overflow-y-auto pr-2">
                    {simulation.slice(0, 25).map((val, idx) => (
                      <div
                        key={idx}
                        className="bg-[#212121] border border-neutral-800 rounded p-1.5 text-center text-[10px] font-mono text-cyan-400 font-semibold"
                      >
                        {currencySymbol} {val.toFixed(0)}
                      </div>
                    ))}
                    {simulation.length > 25 && (
                      <div className="col-span-5 text-center text-[10px] text-neutral-500 py-1 bg-[#1a1a1a] rounded border border-neutral-800">
                        + {simulation.length - 25} outros valores...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-neutral-800/40 pt-4">
            <button
              type="button"
              onClick={handleLaunch}
              disabled={!!validationError || (generationMode === 'manual' && !!manualError)}
              className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 disabled:hover:bg-cyan-500 text-[#0d0d0d] font-bold text-sm py-3 px-4 rounded-xl cursor-pointer transition-all duration-300 shadow-lg shadow-cyan-950/20 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
            >
              <Flame className="w-4 h-4 fill-current" /> Iniciar Desafio do Cofre
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
