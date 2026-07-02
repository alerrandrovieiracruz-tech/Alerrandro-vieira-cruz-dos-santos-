import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
  deleteUser,
  signInWithPopup,
  User
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { X, Mail, Lock, User as UserIcon, LogIn, Sparkles, LogOut, Trash2, Key, Check, HelpCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onSyncLocalData: () => void;
  isGated?: boolean;
}

const PRESET_AVATARS = [
  { id: 'av-1', emoji: '💰', name: 'Poupador Pro', bg: 'from-cyan-500 to-blue-600' },
  { id: 'av-2', emoji: '🚀', name: 'Investidor', bg: 'from-emerald-500 to-teal-600' },
  { id: 'av-3', emoji: '👑', name: 'Vencedor', bg: 'from-violet-500 to-purple-600' },
  { id: 'av-4', emoji: '🏆', name: 'Conquistador', bg: 'from-amber-500 to-orange-600' },
  { id: 'av-5', emoji: '💎', name: 'Diamante', bg: 'from-fuchsia-500 to-pink-600' },
  { id: 'av-6', emoji: '🎯', name: 'Focado', bg: 'from-rose-500 to-red-600' },
  { id: 'av-7', emoji: '⚡', name: 'Rápido', bg: 'from-sky-400 to-indigo-600' },
  { id: 'av-8', emoji: '🛡️', name: 'Protegido', bg: 'from-slate-600 to-neutral-800' },
];

export default function AuthModal({ isOpen, onClose, onToast, onSyncLocalData, isGated = false }: AuthModalProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'profile'>('login');
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  // Profile Edit State
  const [newDisplayName, setNewDisplayName] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user) {
        setMode('profile');
        setNewDisplayName(user.displayName || '');
        // Extract avatar id from photoURL if matched
        const found = PRESET_AVATARS.find((a) => a.id === user.photoURL);
        if (found) setSelectedAvatarId(found.id);
      } else {
        setMode('login');
      }
    });
    return unsubscribe;
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      onToast('Conectado com sucesso via Google!', 'success');
      onSyncLocalData();
      onClose();
    } catch (err: any) {
      console.error(err);
      onToast(err.message || 'Erro ao conectar com Google.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      onToast('Preencha todos os campos.', 'error');
      return;
    }
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!username) {
          onToast('Preencha o nome de usuário.', 'error');
          setLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Set display name & default random avatar
        const defaultAvatar = PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)];
        await updateProfile(userCredential.user, {
          displayName: username,
          photoURL: defaultAvatar.id
        });
        onToast('Conta criada com sucesso!', 'success');
        onSyncLocalData();
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        onToast('Bem-vindo de volta!', 'success');
        onSyncLocalData();
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      let errorMsg = 'Ocorreu um erro na autenticação.';
      if (err.code === 'auth/email-already-in-use') errorMsg = 'Este e-mail já está em uso.';
      if (err.code === 'auth/wrong-password') errorMsg = 'Senha incorreta.';
      if (err.code === 'auth/invalid-credential') errorMsg = 'Credenciais inválidas.';
      if (err.code === 'auth/user-not-found') errorMsg = 'Usuário não encontrado.';
      onToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      onToast('Digite seu e-mail de cadastro.', 'error');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      onToast('E-mail de recuperação enviado!', 'success');
      setMode('login');
    } catch (err: any) {
      onToast('E-mail não encontrado ou inválido.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);
    try {
      await updateProfile(currentUser, {
        displayName: newDisplayName,
        photoURL: selectedAvatarId
      });
      onToast('Perfil atualizado com sucesso!', 'success');
    } catch (err: any) {
      onToast('Erro ao atualizar perfil.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newPassword) return;
    if (newPassword.length < 6) {
      onToast('A nova senha deve ter no mínimo 6 caracteres.', 'error');
      return;
    }
    setLoading(true);
    try {
      await updatePassword(currentUser, newPassword);
      onToast('Senha alterada com sucesso!', 'success');
      setNewPassword('');
    } catch (err: any) {
      console.error(err);
      onToast('Erro ao alterar senha. Recomenda-se fazer login novamente para reautenticar.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      await deleteUser(currentUser);
      onToast('Sua conta foi excluída com sucesso.', 'info');
      onClose();
    } catch (err: any) {
      console.error(err);
      onToast('Erro ao excluir conta. Por favor, faça login novamente para reautenticar antes de excluir.', 'error');
    } finally {
      setLoading(false);
      setConfirmDelete(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onToast('Logout realizado com sucesso!', 'info');
      onClose();
    } catch (err) {
      onToast('Erro ao deslogar.', 'error');
    }
  };

  const activeAvatar = PRESET_AVATARS.find((a) => a.id === selectedAvatarId) || PRESET_AVATARS[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isGated ? undefined : onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            className="relative w-full max-w-lg bg-[#0E0E0E] border border-neutral-800/80 rounded-2xl overflow-hidden shadow-2xl p-6 md:p-8 z-10"
          >
            {/* Close Button */}
            {!isGated && (
              <button
                onClick={onClose}
                className="absolute top-5 right-5 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* HEADER LOGO */}
            <div className="flex items-center gap-2.5 mb-6">
              <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-xl text-black shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-wide text-white uppercase font-sans">
                  Sincronização Nuvem <span className="text-cyan-400">Premium</span>
                </h3>
                <p className="text-[10px] text-neutral-500 font-medium">Seus desafios de cofre seguros em qualquer lugar</p>
              </div>
            </div>

            {/* VIEW MANAGER */}
            {mode === 'login' || mode === 'register' ? (
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    {mode === 'login' ? 'Bem-vindo ao Cofre Premium' : 'Criar Conta Premium'}
                  </h2>
                  <p className="text-xs text-neutral-400">
                    {mode === 'login'
                      ? 'Faça login para salvar e sincronizar todos os seus dados.'
                      : 'Crie uma conta gratuita para acompanhar suas metas em tempo real.'}
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  {mode === 'register' && (
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-400 mb-1.5">Nome de Usuário</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500">
                          <UserIcon className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Como quer ser chamado"
                          className="w-full bg-[#141414] border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500 transition-all"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1.5">Endereço de E-mail</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seuemail@exemplo.com"
                        className="w-full bg-[#141414] border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[11px] font-medium text-neutral-400">Senha de Acesso</label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => setMode('forgot')}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          Esqueceu a senha?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#141414] border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs rounded-xl transition-all shadow-md shadow-cyan-950/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      'Carregando...'
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 stroke-[2.5]" />
                        {mode === 'login' ? 'Entrar na Conta' : 'Criar Conta Premium'}
                      </>
                    )}
                  </button>

                  {/* Google Login Trigger */}
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                    </svg>
                    Entrar com o Google
                  </button>
                </div>

                <div className="text-center text-[11px] text-neutral-500 pt-3">
                  {mode === 'login' ? (
                    <>
                      Não possui uma conta?{' '}
                      <button
                        type="button"
                        onClick={() => setMode('register')}
                        className="text-cyan-400 hover:text-cyan-300 font-bold"
                      >
                        Cadastre-se grátis
                      </button>
                    </>
                  ) : (
                    <>
                      Já possui uma conta?{' '}
                      <button
                        type="button"
                        onClick={() => setMode('login')}
                        className="text-cyan-400 hover:text-cyan-300 font-bold"
                      >
                        Fazer login
                      </button>
                    </>
                  )}
                </div>
              </form>
            ) : mode === 'forgot' ? (
              <form onSubmit={handlePasswordRecovery} className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Recuperar Senha</h2>
                  <p className="text-xs text-neutral-400">
                    Insira seu endereço de e-mail abaixo. Enviaremos um link de recuperação.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1.5">Endereço de E-mail</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      className="w-full bg-[#141414] border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500 transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-bold text-xs rounded-xl"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs rounded-xl transition-all"
                  >
                    {loading ? 'Enviando...' : 'Enviar Link'}
                  </button>
                </div>
              </form>
            ) : (
              /* Profile Edit / Dashboard mode (when user logged in) */
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-neutral-950/40 border border-neutral-800/80 rounded-2xl">
                  {/* Avatar Icon */}
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${activeAvatar.bg} flex items-center justify-center text-3xl shadow-lg border border-neutral-800/80 shrink-0`}>
                    {activeAvatar.emoji}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      {currentUser?.displayName || 'Usuário Premium'}{' '}
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                        ✓ Verificado
                      </span>
                    </h4>
                    <p className="text-xs text-neutral-500">{currentUser?.email}</p>
                    <p className="text-[10px] text-neutral-600 mt-1">
                      Membro desde: {currentUser?.metadata.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString('pt-BR') : 'Hoje'}
                    </p>
                  </div>
                </div>

                {/* Profile update form */}
                <form onSubmit={handleUpdateProfile} className="space-y-4 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Personalizar Perfil</h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-medium text-neutral-500 mb-1.5">Nome de Exibição</label>
                      <input
                        type="text"
                        value={newDisplayName}
                        onChange={(e) => setNewDisplayName(e.target.value)}
                        className="w-full bg-[#141414] border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                        placeholder="Seu nome"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[11px] font-medium text-neutral-500 mb-2">Escolha seu Avatar Premium</label>
                      <div className="grid grid-cols-4 gap-2">
                        {PRESET_AVATARS.map((av) => (
                          <button
                            type="button"
                            key={av.id}
                            onClick={() => setSelectedAvatarId(av.id)}
                            className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                              selectedAvatarId === av.id
                                ? 'bg-cyan-950/20 border-cyan-500 text-white shadow-lg shadow-cyan-950/10 scale-105'
                                : 'bg-neutral-900/30 border-neutral-800/80 hover:bg-neutral-900/60 text-neutral-400 hover:text-neutral-200'
                            }`}
                          >
                            <span className="text-2xl">{av.emoji}</span>
                            <span className="text-[9px] font-bold tracking-tight text-center">{av.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-bold text-cyan-400 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> Salvar Alterações de Perfil
                  </button>
                </form>

                {/* Change password / security */}
                <form onSubmit={handleChangePassword} className="space-y-3 pt-4 border-t border-neutral-800/40">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-cyan-400" /> Alterar Senha de Acesso
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="Digite a nova senha (mínimo 6 chars)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="flex-1 bg-[#141414] border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="submit"
                      disabled={loading || !newPassword}
                      className="px-4 py-2 bg-[#141414] hover:bg-neutral-800 border border-neutral-800 hover:border-cyan-500 text-cyan-400 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Alterar
                    </button>
                  </div>
                </form>

                {/* Dangerous section (Delete / Logout) */}
                <div className="pt-6 border-t border-neutral-800/40 flex flex-col gap-2.5">
                  <button
                    onClick={handleLogout}
                    className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" /> Sair da Conta
                  </button>

                  {confirmDelete ? (
                    <div className="p-3.5 bg-red-950/20 border border-red-500/20 rounded-xl space-y-3">
                      <p className="text-[11px] text-red-200 leading-normal flex items-start gap-1.5 font-medium">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                        Aviso Crítico: Isso excluirá permanentemente sua conta e removerá todos os seus desafios sincronizados na nuvem. Esta operação é irreversível!
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmDelete(false)}
                          className="flex-1 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-[10px] font-bold text-neutral-300 cursor-pointer"
                        >
                          Cancelar Exclusão
                        </button>
                        <button
                          onClick={handleDeleteAccount}
                          className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-[#0d0d0d] rounded-lg text-[10px] font-black cursor-pointer"
                        >
                          Sim, Excluir Agora
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="w-full py-2.5 bg-red-950/10 hover:bg-red-950/20 border border-red-900/30 rounded-xl text-red-400 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" /> Excluir Minha Conta Permanentemente
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
