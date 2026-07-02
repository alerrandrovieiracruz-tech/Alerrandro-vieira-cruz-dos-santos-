import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Challenge, HistoryEntry } from '../types';
import { 
  Lock, 
  ShieldAlert, 
  LogOut, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Users, 
  CreditCard, 
  CircleAlert 
} from 'lucide-react';

interface AdminPanelProps {
  challenges: Challenge[];
  history: HistoryEntry[];
  activeChallengeId: string;
  onSelectChallenge: (id: string) => void;
  saveAllData: (
    updatedChallenges: Challenge[],
    updatedHistory?: HistoryEntry[]
  ) => void;
  currencySymbol: string;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function AdminPanel({
  addToast,
  currencySymbol
}: AdminPanelProps) {
  // Authentication states
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('admin_authenticated') === 'true';
  });
  const [loginError, setLoginError] = useState(false);

  // Administrative views/controls
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const isInitialMount = useRef(true);
  const prevUsersRef = useRef<any[]>([]);

  // Sound generator helper using Web Audio API
  const playAdminSound = (type: 'new_user' | 'deposit' | 'withdrawal') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'new_user') {
        // High, cheerful ascending chime
        const playTone = (freq: number, start: number, duration: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.12, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + duration);
        };
        playTone(523.25, ctx.currentTime, 0.15); // C5
        playTone(659.25, ctx.currentTime + 0.08, 0.15); // E5
        playTone(783.99, ctx.currentTime + 0.16, 0.22); // G5
      } else if (type === 'deposit') {
        // Cheerful double-tone coin sound (triangle wave for coin)
        const playTone = (freq: number, start: number, duration: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.15, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + duration);
        };
        playTone(880, ctx.currentTime, 0.08); // A5
        playTone(1318.51, ctx.currentTime + 0.08, 0.18); // E6
      } else if (type === 'withdrawal') {
        // Noticeable warning descending sweep
        const playTone = (freq1: number, freq2: number, start: number, duration: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq1, start);
          osc.frequency.exponentialRampToValueAtTime(freq2, start + duration);
          gain.gain.setValueAtTime(0.12, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + duration);
        };
        playTone(440, 220, ctx.currentTime, 0.25); // A4 to A3 slide
      }
    } catch (e) {
      console.warn('Could not play synthesized admin notification sound:', e);
    }
  };

  // Set up real-time listener for users collection
  useEffect(() => {
    if (!isAuthenticated) return;

    setLoadingUsers(true);
    const usersCol = collection(db, 'users');

    const unsubscribe = onSnapshot(usersCol, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });

      // Sort users by lastActive or displayName
      list.sort((a, b) => {
        const dateA = a.lastActive ? new Date(a.lastActive).getTime() : 0;
        const dateB = b.lastActive ? new Date(b.lastActive).getTime() : 0;
        return dateB - dateA;
      });

      if (isInitialMount.current) {
        // Populate current state initially without firing notifications
        prevUsersRef.current = list;
        isInitialMount.current = false;
      } else {
        // Compare new snapshot with previous state
        list.forEach((newUser) => {
          const prevUser = prevUsersRef.current.find(u => u.id === newUser.id);

          if (!prevUser) {
            // New user registration detected!
            const userName = newUser.displayName || newUser.fullName || 'Poupador';
            addToast(`👤 Novo usuário cadastrado: ${userName}!`, 'success');
            playAdminSound('new_user');
          } else {
            // User existed, check if their lastTransaction has been updated
            const newTx = newUser.lastTransaction;
            const prevTx = prevUser.lastTransaction;

            if (newTx && (!prevTx || prevTx.id !== newTx.id)) {
              const userName = newUser.displayName || newUser.fullName || 'Poupador';
              const isWithdrawal = newTx.value < 0 || newTx.type === 'withdrawal';

              if (isWithdrawal) {
                const cleanValue = Math.abs(newTx.value);
                addToast(`💸 Novo saque Pix: ${currencySymbol} ${cleanValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} por ${userName}!`, 'info');
                playAdminSound('withdrawal');
              } else {
                addToast(`💰 Novo depósito: ${currencySymbol} ${newTx.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} por ${userName}!`, 'success');
                playAdminSound('deposit');
              }
            }
          }
        });

        // Always update ref to match the latest list
        prevUsersRef.current = list;
      }

      setUsers(list);
      setLoadingUsers(false);
    }, (err) => {
      console.error('Error in real-time user listener:', err);
      setLoadingUsers(false);
    });

    return () => {
      unsubscribe();
      isInitialMount.current = true;
      prevUsersRef.current = [];
    };
  }, [isAuthenticated, addToast, currencySymbol]);

  // Manual update handler (also triggers onSnapshot refresh seamlessly)
  const fetchUsers = () => {
    addToast('Atualizando informações em tempo real...', 'info');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Ale#2011') {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
      setLoginError(false);
      setPassword('');
      addToast('Acesso administrativo concedido!', 'success');
    } else {
      setLoginError(true);
      addToast('Senha administrativa incorreta!', 'error');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
    addToast('Sessão administrativa encerrada.', 'info');
  };

  // Render Lock Screen if not logged in
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-[#0D0D0D] border border-neutral-800 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
        {/* Neon light accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500/10 via-red-500 to-red-500/10" />

        <div className="flex flex-col items-center text-center space-y-6">
          <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-2xl text-red-400">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-white uppercase tracking-wider">Painel Admin Protegido</h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              O acesso a esta página é restrito a administradores. Digite a credencial para continuar.
            </p>
          </div>

          <form onSubmit={handleLogin} className="w-full space-y-4">
            <div className="space-y-2">
              <label className="block text-left text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                Senha do Administrador
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (loginError) setLoginError(false);
                  }}
                  placeholder="••••••••••••"
                  autoFocus
                  className={`w-full py-3.5 px-4 bg-neutral-950 border ${
                    loginError ? 'border-red-500 text-red-300' : 'border-neutral-800 focus:border-red-500'
                  } rounded-xl text-sm font-mono text-white focus:outline-none transition-all pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-red-950/30"
            >
              Acessar Painel Admin
            </button>
          </form>

          {loginError && (
            <div className="flex items-center gap-1.5 text-red-500 text-[10px] font-bold uppercase tracking-wider">
              <CircleAlert size={12} /> Senha incorreta. Tente novamente!
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render Admin Console
  return (
    <div className="space-y-8">
      {/* Admin Title Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 rounded-2xl p-5 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-neutral-800 text-white rounded-xl">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              PAINEL DE ADMINISTRAÇÃO
            </h2>
            <p className="text-xs text-neutral-400">Consulte dados dos poupadores cadastrados e chaves Pix para faturamento.</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="py-2 px-4 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <LogOut size={14} className="text-red-500" /> Sair do Painel Admin
        </button>
      </div>

      {/* Main Admin Section */}
      <div className="bg-[#111111] border border-neutral-800/60 p-6 rounded-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Users className="text-emerald-400 w-4 h-4" /> Centro de Informações de Usuários
            </h3>
            <p className="text-xs text-neutral-400 mt-1">Sincronização em tempo real de nomes completos e chaves Pix dos poupadores cadastrados.</p>
          </div>
          
          <button
            onClick={fetchUsers}
            disabled={loadingUsers}
            className="p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl transition-all flex items-center gap-2 text-xs font-bold cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={loadingUsers ? 'animate-spin' : ''} />
            {loadingUsers ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-neutral-800/80 bg-neutral-950">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-850 bg-neutral-900/50">
                <th className="p-4 font-bold text-neutral-400 uppercase tracking-wider text-[10px]">Usuário</th>
                <th className="p-4 font-bold text-neutral-400 uppercase tracking-wider text-[10px]">Nome Completo</th>
                <th className="p-4 font-bold text-neutral-400 uppercase tracking-wider text-[10px]">E-mail</th>
                <th className="p-4 font-bold text-neutral-400 uppercase tracking-wider text-[10px]">Chave Pix</th>
                <th className="p-4 font-bold text-neutral-400 uppercase tracking-wider text-[10px] text-right">Último Acesso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-850">
              {users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-900/30 transition-all">
                    <td className="p-4 font-semibold text-white flex items-center gap-2">
                      <span className="text-base">👤</span>
                      <div>
                        <p>{u.displayName || 'Poupador'}</p>
                        <p className="text-[9px] text-neutral-500 font-mono">UID: {u.id.substring(0, 8)}...</p>
                      </div>
                    </td>
                    <td className="p-4 text-neutral-300">
                      {u.fullName || (
                        <span className="text-neutral-600 italic">Não preenchido</span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-neutral-400">
                      {u.email || <span className="text-neutral-600 italic">-</span>}
                    </td>
                    <td className="p-4">
                      {u.pixKey ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 rounded-lg font-mono text-[11px]">
                          <CreditCard size={11} /> {u.pixKey}
                        </div>
                      ) : (
                        <span className="text-neutral-600 italic">Nenhum Pix cadastrado</span>
                      )}
                    </td>
                    <td className="p-4 text-right font-mono text-neutral-500">
                      {u.lastActive ? new Date(u.lastActive).toLocaleString('pt-BR') : 'Sem registro'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-neutral-500 italic">
                    Nenhum usuário sincronizado na nuvem encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
