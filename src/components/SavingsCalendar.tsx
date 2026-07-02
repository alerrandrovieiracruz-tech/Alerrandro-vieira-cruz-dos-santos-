import React, { useState } from 'react';
import { HistoryEntry } from '../types';
import { Calendar as CalendarIcon, Flame, Trophy, ChevronLeft, ChevronRight, Activity } from 'lucide-react';

interface SavingsCalendarProps {
  history: HistoryEntry[];
  currencySymbol: string;
}

export function SavingsCalendar({ history, currencySymbol }: SavingsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Filter history entries that represent actual money added (type !== 'edit')
  const depositEntries = history.filter(
    (h) => (h.type === 'deposit' && h.value > 0) || h.type === 'partial' || h.type === 'manual_add'
  );

  // Group deposits by date string (YYYY-MM-DD)
  const depositsByDate = depositEntries.reduce((acc, entry) => {
    try {
      const dateStr = new Date(entry.date).toISOString().split('T')[0];
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push(entry);
    } catch (e) {
      // Ignore invalid dates
    }
    return acc;
  }, {} as Record<string, HistoryEntry[]>);

  // Calculate Streak
  const getStreak = () => {
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let checkDate = new Date(today);
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (depositsByDate[dateStr] && depositsByDate[dateStr].length > 0) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // If today doesn't have a deposit, check if yesterday had one to maintain streak
        if (currentStreak === 0) {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          if (depositsByDate[yesterdayStr] && depositsByDate[yesterdayStr].length > 0) {
            checkDate = yesterday;
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
          }
        }
        break;
      }
    }
    return currentStreak;
  };

  const streakDays = getStreak();

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday, 1 is Monday...
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blankDays = Array.from({ length: startDayOfWeek }, (_, i) => i);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div id="savings-calendar" className="bg-[#121212] border border-neutral-800/60 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Title & Streak Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-5 border-b border-neutral-800/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-800/30 text-cyan-400">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h3 className="font-sans font-semibold text-lg text-white">Calendário de Atividade</h3>
            <p className="text-xs text-neutral-400">Acompanhe a frequência dos seus depósitos</p>
          </div>
        </div>

        {/* Streak & Peak Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
            <Flame className="text-amber-500 animate-pulse" size={16} />
            <div className="text-left">
              <span className="block font-mono text-xs font-bold text-amber-400">{streakDays} Dias</span>
              <span className="block text-[9px] text-neutral-400 uppercase tracking-wider">Ofensiva Atual</span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
            <Trophy className="text-emerald-400" size={16} />
            <div className="text-left">
              <span className="block font-mono text-xs font-bold text-emerald-400">
                {depositEntries.length}
              </span>
              <span className="block text-[9px] text-neutral-400 uppercase tracking-wider">Depósitos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Controller */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-sans font-medium text-sm text-neutral-200">
          {monthNames[month]} {year}
        </h4>
        <div className="flex items-center gap-1">
          <button
            id="prev-month-btn"
            onClick={prevMonth}
            className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white transition-all cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            id="next-month-btn"
            onClick={nextMonth}
            className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white transition-all cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Week Day Labels */}
      <div className="grid grid-cols-7 gap-1.5 mb-2 text-center">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
          <div key={day} className="text-[10px] font-sans font-medium text-neutral-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {/* Blanks for days of previous month */}
        {blankDays.map((val) => (
          <div key={`blank-${val}`} className="aspect-square rounded-lg bg-transparent" />
        ))}

        {/* Month Days */}
        {daysArray.map((day) => {
          const date = new Date(year, month, day);
          const dateStr = date.toISOString().split('T')[0];
          const dailyDeposits = depositsByDate[dateStr] || [];
          const hasDeposited = dailyDeposits.length > 0;
          const totalDayValue = dailyDeposits.reduce((s, e) => s + e.value, 0);

          // Render styled day square based on deposits
          return (
            <div
              key={`day-${day}`}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center relative group border transition-all cursor-pointer ${
                hasDeposited
                  ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-neutral-900/30 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <span
                className={`font-mono text-xs font-medium ${
                  hasDeposited ? 'text-emerald-400 font-bold' : 'text-neutral-400'
                }`}
              >
                {day}
              </span>

              {hasDeposited && (
                <span className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              )}

              {/* Hover Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max max-w-[200px] bg-neutral-950 border border-neutral-800 text-neutral-200 text-[10px] rounded-lg px-2.5 py-1.5 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-30">
                <p className="font-semibold text-white mb-0.5">{day} de {monthNames[month]}</p>
                {hasDeposited ? (
                  <div>
                    <p className="text-emerald-400 font-bold">
                      +{currencySymbol} {totalDayValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-neutral-400 text-[9px]">{dailyDeposits.length} transações</p>
                  </div>
                ) : (
                  <p className="text-neutral-500">Sem depósitos</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mini contribution layout helper / Legend */}
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-neutral-800/40 text-[11px] text-neutral-400">
        <div className="flex items-center gap-1.5">
          <Activity size={12} className="text-cyan-400" />
          <span>Frequência Mensal</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Menos</span>
          <div className="w-2.5 h-2.5 rounded bg-neutral-900 border border-neutral-800" />
          <div className="w-2.5 h-2.5 rounded bg-emerald-950 border border-emerald-900" />
          <div className="w-2.5 h-2.5 rounded bg-emerald-800/40 border border-emerald-700/40" />
          <div className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/40" />
          <span>Mais</span>
        </div>
      </div>
    </div>
  );
}
