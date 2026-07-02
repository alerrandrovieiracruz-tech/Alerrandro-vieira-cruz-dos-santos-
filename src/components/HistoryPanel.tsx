import React, { useState } from 'react';
import { HistoryEntry } from '../types';
import { History, Search, PlusCircle, Calendar, Tag, CheckCircle2, DollarSign, MessageSquare } from 'lucide-react';

interface HistoryPanelProps {
  history: HistoryEntry[];
  onClearHistory?: () => void;
  currencySymbol: string;
}

export default function HistoryPanel({ history, onClearHistory, currencySymbol }: HistoryPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');

  const filteredHistory = history
    .filter((item) => {
      const matchesSearch = 
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.value.toString().includes(searchTerm) ||
        (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.challengeTitle.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || item.type === filterType;
      return matchesSearch && matchesFilter;
    })
    // Sort chronological descending (most recent first)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getIconForType = (type: HistoryEntry['type']) => {
    switch (type) {
      case 'completion':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'deposit':
        return <DollarSign className="w-4 h-4 text-emerald-400" />;
      case 'partial':
        return <PlusCircle className="w-4 h-4 text-cyan-400" />;
      case 'manual_add':
        return <PlusCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <History className="w-4 h-4 text-neutral-400" />;
    }
  };

  const getColorForType = (type: HistoryEntry['type']) => {
    switch (type) {
      case 'completion':
        return 'border-emerald-500/20 bg-emerald-950/20 text-emerald-400';
      case 'deposit':
        return 'border-emerald-500/10 bg-emerald-950/10 text-emerald-300';
      case 'partial':
        return 'border-cyan-500/10 bg-cyan-950/10 text-cyan-400';
      case 'manual_add':
        return 'border-yellow-500/10 bg-yellow-950/10 text-yellow-500';
      default:
        return 'border-neutral-800 bg-neutral-900 text-neutral-400';
    }
  };

  const handleSaveNote = (itemId: string) => {
    const entry = history.find(h => h.id === itemId);
    if (entry) {
      entry.notes = tempNote;
      // Trigger a force re-render via state update or local storage update
      setEditingNoteId(null);
      // Persist the note
      const allHistory = JSON.parse(localStorage.getItem('vault_history') || '[]');
      const updatedHistory = allHistory.map((h: HistoryEntry) => {
        if (h.id === itemId) {
          return { ...h, notes: tempNote };
        }
        return h;
      });
      localStorage.setItem('vault_history', JSON.stringify(updatedHistory));
    }
  };

  return (
    <div className="bg-[#121212] border border-neutral-800/60 rounded-2xl p-6" id="history-logs-panel">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-neutral-800/40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-xl">
            <History className="w-5 h-5 text-neutral-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-sans">Histórico de Atividades</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Acompanhe as movimentações consolidadas de todas as contas.</p>
          </div>
        </div>

        {onClearHistory && history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="text-xs text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
          >
            Limpar Histórico
          </button>
        )}
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Pesquisar por descrição, valor ou observações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#171717] border border-neutral-800/60 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Filter */}
        <div className="flex gap-1 bg-[#171717] border border-neutral-800/60 rounded-xl p-1 overflow-x-auto">
          {['all', 'deposit', 'partial', 'completion', 'manual_add'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 text-[10px] font-medium rounded-lg transition-all capitalize whitespace-nowrap cursor-pointer ${
                filterType === type
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {type === 'all'
                ? 'Todos'
                : type === 'deposit'
                ? 'Depósitos'
                : type === 'partial'
                ? 'Parciais'
                : type === 'completion'
                ? 'Conclusões'
                : 'Manual'}
            </button>
          ))}
        </div>
      </div>

      {/* History Ledger List */}
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 text-xs">
            Nenhum registro encontrado para a busca ou filtro selecionado.
          </div>
        ) : (
          filteredHistory.map((item) => {
            const itemDate = new Date(item.date);
            const timeStr = itemDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const dateStr = itemDate.toLocaleDateString('pt-BR');

            return (
              <div
                key={item.id}
                className="flex flex-col p-3 bg-neutral-900/30 border border-neutral-800/60 rounded-xl hover:bg-neutral-900/60 transition-all gap-2"
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg border mt-0.5 ${getColorForType(item.type)}`}>
                      {getIconForType(item.type)}
                    </div>
                    <div>
                      <p className="text-xs text-neutral-200 font-medium leading-relaxed">
                        {item.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {dateStr} às {timeStr}
                        </span>
                        <span className="bg-neutral-900 text-neutral-400 px-1.5 py-0.5 rounded border border-neutral-800">
                          {item.challengeTitle}
                        </span>
                        {item.squareIndex && (
                          <span className="flex items-center gap-1 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800 font-mono text-cyan-400">
                            <Tag className="w-2.5 h-2.5" /> Q#{item.squareIndex}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {item.value > 0 && (
                    <div className="text-right pl-3">
                      <span className="text-xs font-bold font-mono text-cyan-400">
                        + {currencySymbol} {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Optional Note View / Edit */}
                <div className="pl-11 border-t border-neutral-800/40 pt-2 flex flex-col gap-1.5">
                  {editingNoteId === item.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tempNote}
                        onChange={(e) => setTempNote(e.target.value)}
                        className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-cyan-500"
                        placeholder="Adicione uma observação para este depósito..."
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveNote(item.id)}
                        className="px-2 py-1 bg-cyan-950 border border-cyan-500/30 text-cyan-400 rounded text-[10px] hover:bg-cyan-900 cursor-pointer"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => setEditingNoteId(null)}
                        className="text-[10px] text-neutral-500 hover:text-neutral-300 cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[11px]">
                      {item.notes ? (
                        <div className="flex items-start gap-1.5 text-neutral-400 italic">
                          <MessageSquare size={11} className="mt-0.5 text-neutral-500 shrink-0" />
                          <span>Obs: {item.notes}</span>
                        </div>
                      ) : (
                        <span className="text-neutral-600">Nenhuma observação anotada</span>
                      )}
                      <button
                        onClick={() => {
                          setEditingNoteId(item.id);
                          setTempNote(item.notes || '');
                        }}
                        className="text-[10px] text-neutral-500 hover:text-cyan-400 transition-colors cursor-pointer ml-auto"
                      >
                        {item.notes ? 'Editar' : '+ Nota'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
