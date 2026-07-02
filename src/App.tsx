import React, { useState, useEffect, useRef } from 'react';
import { Challenge, Square, HistoryEntry, AppSettings, Achievement } from './types';
import ChallengeCreator from './components/ChallengeCreator';
import StatsPanel from './components/StatsPanel';
import HistoryPanel from './components/HistoryPanel';
import QuickAddModal from './components/QuickAddModal';
import SquareCard from './components/SquareCard';
import ConfettiCanvas from './components/ConfettiCanvas';
import { SavingsCalendar } from './components/SavingsCalendar';
import { PINLockScreen } from './components/PINLockScreen';

// Auth and Firebase Cloud Persistence Sync
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';

// Premium Visual Modules
import AuthModal from './components/AuthModal';
import DashboardOverview from './components/DashboardOverview';
import ShareModal from './components/ShareModal';
import ToastContainer, { ToastMessage } from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import DepositModal from './components/DepositModal';
import RedeemModal from './components/RedeemModal';
import AdminPanel from './components/AdminPanel';

import {
  playTickSound,
  playToggleOffSound,
  playSuccessSound,
  playVictorySound,
} from './utils/audio';
import { generateChallengeSquares, createNewChallenge } from './utils/challenge';
import { exportToJSON, exportToCSV, exportToExcel, exportToPNG } from './utils/export';

import {
  Vault, Volume2, VolumeX, Maximize2, Minimize2, Sparkles, Plus, RefreshCw, Shuffle,
  Grid, TrendingUp, FileDown, Printer, ChevronLeft, Trash2, CheckCircle, HelpCircle,
  Undo2, FileJson, Settings, Lock, Unlock, Calendar, Trophy, UploadCloud, Flame,
  ShieldCheck, Archive, FolderOpen, X, Smartphone, Heart, Home as HomeIcon, GraduationCap,
  Car, Plane, ShieldAlert, Star, Copy, Share2, LogIn, Award, Sliders, LogOut, Info, CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const PRESET_AVATARS = [
  { id: 'av-1', emoji: '💰', bg: 'from-cyan-500 to-blue-600' },
  { id: 'av-2', emoji: '🚀', bg: 'from-emerald-500 to-teal-600' },
  { id: 'av-3', emoji: '👑', bg: 'from-violet-500 to-purple-600' },
  { id: 'av-4', emoji: '🏆', bg: 'from-amber-500 to-orange-600' },
  { id: 'av-5', emoji: '💎', bg: 'from-fuchsia-500 to-pink-600' },
  { id: 'av-6', emoji: '🎯', bg: 'from-rose-500 to-red-600' },
  { id: 'av-7', emoji: '⚡', bg: 'from-sky-400 to-indigo-600' },
  { id: 'av-8', emoji: '🛡️', bg: 'from-slate-600 to-neutral-800' },
];

export function getUserAvatar(photoURL: string | null | undefined) {
  const found = PRESET_AVATARS.find((a) => a.id === photoURL);
  return found || PRESET_AVATARS[0];
}

export default function App() {
  // --- NAVIGATION STATE ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tabela' | 'historico' | 'estilo' | 'admin'>('dashboard');

  // --- CORE STATE DECLARATIONS ---
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [activeChallengeId, setActiveChallengeId] = useState<string>('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  
  // Custom Toasts State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Overlay & Modals controls
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [selectedSquareForDeposit, setSelectedSquareForDeposit] = useState<{ square: Square; index: number; initialMethod?: 'pix' | 'cash' } | null>(null);
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [viewFilter, setViewFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [showConfetti, setShowConfetti] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isCreatingNewChallenge, setIsCreatingNewChallenge] = useState(false);

  // User auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Custom confirmation modal state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // App customization settings
  const [settings, setSettings] = useState<AppSettings>({
    soundEnabled: true,
    language: 'pt',
    currency: 'BRL',
    accentColor: 'emerald',
    roundness: 'xl',
    pinLockEnabled: false,
    pinCode: '',
    isLocked: false,
    reminderFrequency: 'none',
    // Custom Premium style fields
    fullName: '',
    pixKey: '',
    themeBg: 'matte-black',
    squareSize: 'md',
    squareFormat: 'rounded',
    borderStyle: 'thin',
    fontFamily: 'inter',
    sortOrder: 'original'
  });

  // PIN controls state
  const [pinSetupValue, setPinSetupValue] = useState('');
  const [pinSetupError, setPinSetupError] = useState('');

  // Achievements
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: 'first_step',
      title: 'Primeiro Passo',
      description: 'Crie seu primeiro desafio do cofre',
      icon: '🌱',
      requirementType: 'completed_challenges',
      requirementValue: 0,
    },
    {
      id: 'saver_bronze',
      title: 'Poupador Bronze',
      description: 'Economize um total acumulado de R$ 1.000',
      icon: '🥉',
      requirementType: 'total_saved',
      requirementValue: 1000,
    },
    {
      id: 'saver_silver',
      title: 'Poupador Prata',
      description: 'Economize um total acumulado de R$ 5.000',
      icon: '🥈',
      requirementType: 'total_saved',
      requirementValue: 5000,
    },
    {
      id: 'saver_gold',
      title: 'Poupador Ouro',
      description: 'Economize um total acumulado de R$ 15.000',
      icon: '🥇',
      requirementType: 'total_saved',
      requirementValue: 15000,
    },
    {
      id: 'vault_conqueror',
      title: 'Conquistador do Cofre',
      description: 'Conclua totalmente pelo menos 1 desafio do cofre',
      icon: '🏆',
      requirementType: 'completed_challenges',
      requirementValue: 1,
    },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- NOTIFICATION HANDLER ---
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const handleToastClose = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Get active challenge object
  const activeChallenge = challenges.find((c) => c.id === activeChallengeId) || null;

  // --- INITIAL DATA OR AUTH LOAD ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (user) {
        addToast(`Sincronizado na Nuvem como: ${user.displayName || 'Poupador'}`, 'success');
        await loadUserDataFromCloud(user.uid);
      } else {
        // Fallback offline guest mode
        loadFromLocalStorage();
      }
    });
    return unsubscribe;
  }, []);

  const loadFromLocalStorage = () => {
    // Settings load
    const savedSettings = localStorage.getItem('vault_app_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings((prev) => ({
          ...prev,
          ...parsed,
          isLocked: parsed.pinLockEnabled && parsed.pinCode.length === 4,
        }));
      } catch (e) {
        console.error(e);
      }
    }

    // Challenges load
    const savedChallenges = localStorage.getItem('vault_challenges');
    let loaded: Challenge[] = [];
    if (savedChallenges) {
      try {
        loaded = JSON.parse(savedChallenges);
      } catch (e) {
        console.error(e);
      }
    }
    setChallenges(loaded);

    // Active challenge select
    const savedActiveId = localStorage.getItem('vault_active_challenge_id');
    if (savedActiveId && loaded.some((c) => c.id === savedActiveId)) {
      setActiveChallengeId(savedActiveId);
    } else if (loaded.length > 0) {
      setActiveChallengeId(loaded[0].id);
    }

    // History load
    const savedHistory = localStorage.getItem('vault_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const loadUserDataFromCloud = async (userId: string) => {
    try {
      // 1. Fetch settings
      const { getDoc } = await import('firebase/firestore');
      const userDocRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.settings) {
          setSettings((prev) => ({
            ...prev,
            ...data.settings,
            isLocked: data.settings.pinLockEnabled && data.settings.pinCode.length === 4,
          }));
        }
      }

      // 2. Fetch challenges
      const chalColRef = collection(db, 'users', userId, 'challenges');
      const chalSnap = await getDocs(chalColRef);
      const cloudChallenges: Challenge[] = [];
      chalSnap.forEach((docSnap) => {
        cloudChallenges.push(docSnap.data() as Challenge);
      });
      cloudChallenges.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setChallenges(cloudChallenges);

      // 3. Fetch active challenge id
      const savedActiveId = localStorage.getItem('vault_active_challenge_id');
      if (savedActiveId && cloudChallenges.some((c) => c.id === savedActiveId)) {
        setActiveChallengeId(savedActiveId);
      } else if (cloudChallenges.length > 0) {
        setActiveChallengeId(cloudChallenges[0].id);
      } else {
        setActiveChallengeId('');
      }

      // 4. Fetch history
      const histColRef = collection(db, 'users', userId, 'history');
      const histSnap = await getDocs(histColRef);
      const cloudHistory: HistoryEntry[] = [];
      histSnap.forEach((docSnap) => {
        cloudHistory.push(docSnap.data() as HistoryEntry);
      });
      cloudHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setHistory(cloudHistory);

    } catch (err) {
      console.error(err);
      addToast('Conexão instável. Usando modo offline local.', 'info');
      loadFromLocalStorage();
    }
  };

  // --- SAVE CORE ATOMIC OR FULL SYNCHRONIZER ---
  const saveAllData = async (
    updatedChallenges: Challenge[],
    updatedHistory?: HistoryEntry[],
    updatedSettings?: AppSettings
  ) => {
    // 1. Local UI/State update
    setChallenges(updatedChallenges);
    if (updatedHistory) setHistory(updatedHistory);
    if (updatedSettings) setSettings(updatedSettings);

    // 2. Local cache fallback
    localStorage.setItem('vault_challenges', JSON.stringify(updatedChallenges));
    if (updatedHistory) {
      localStorage.setItem('vault_history', JSON.stringify(updatedHistory));
    }
    if (updatedSettings) {
      localStorage.setItem('vault_app_settings', JSON.stringify(updatedSettings));
    }

    // 3. Firestore Cloud Sync
    if (currentUser) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const activeSettings = updatedSettings || settings;
        const latestTx = updatedHistory && updatedHistory.length > 0 
          ? updatedHistory[0] 
          : (history && history.length > 0 ? history[0] : null);

        const docData: any = {
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || '',
          fullName: activeSettings.fullName || '',
          pixKey: activeSettings.pixKey || '',
          lastActive: new Date().toISOString(),
          settings: activeSettings
        };

        if (latestTx) {
          docData.lastTransaction = {
            id: latestTx.id,
            date: latestTx.date,
            value: latestTx.value,
            type: latestTx.type,
            description: latestTx.description,
            challengeId: latestTx.challengeId || '',
            challengeTitle: latestTx.challengeTitle || ''
          };
        }

        await setDoc(userDocRef, docData, { merge: true });

        // Parallel atomic write challenges & history
        const chalPromises = updatedChallenges.map((challenge) => {
          const chalRef = doc(db, 'users', currentUser.uid, 'challenges', challenge.id);
          return setDoc(chalRef, challenge);
        });

        const histToSync = updatedHistory || history;
        const histPromises = histToSync.map((entry) => {
          const histRef = doc(db, 'users', currentUser.uid, 'history', entry.id);
          return setDoc(histRef, entry);
        });

        await Promise.all([...chalPromises, ...histPromises]);
      } catch (err) {
        console.error('Cloud synchronization failed:', err);
      }
    }
  };

  // Atomic cloud saving helpers to reduce write counts
  const syncChallengeToCloud = async (challenge: Challenge) => {
    if (currentUser) {
      try {
        const chalRef = doc(db, 'users', currentUser.uid, 'challenges', challenge.id);
        await setDoc(chalRef, challenge);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const syncHistoryEntryToCloud = async (entry: HistoryEntry) => {
    if (currentUser) {
      try {
        const histRef = doc(db, 'users', currentUser.uid, 'history', entry.id);
        await setDoc(histRef, entry);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const deleteChallengeFromCloud = async (id: string) => {
    if (currentUser) {
      try {
        const chalRef = doc(db, 'users', currentUser.uid, 'challenges', id);
        await deleteDoc(chalRef);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Onboarding: merge Guest data to newly authenticated Cloud profile
  const handleOnboardingSync = async () => {
    if (!currentUser) return;
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, {
        uid: currentUser.uid,
        email: currentUser.email || '',
        displayName: currentUser.displayName || '',
        fullName: settings.fullName || '',
        pixKey: settings.pixKey || '',
        lastActive: new Date().toISOString(),
        settings: settings
      }, { merge: true });

      const chalPromises = challenges.map((challenge) => {
        const chalRef = doc(db, 'users', currentUser.uid, 'challenges', challenge.id);
        return setDoc(chalRef, challenge);
      });

      const histPromises = history.map((entry) => {
        const histRef = doc(db, 'users', currentUser.uid, 'history', entry.id);
        return setDoc(histRef, entry);
      });

      await Promise.all([...chalPromises, ...histPromises]);
      addToast('Sua conta local foi sincronizada com a Nuvem!', 'success');
      await loadUserDataFromCloud(currentUser.uid);
    } catch (err) {
      console.error(err);
      addToast('Erro ao sincronizar dados locais com a nuvem.', 'error');
    }
  };

  // Select a challenge
  const handleSelectChallenge = (id: string) => {
    setActiveChallengeId(id);
    localStorage.setItem('vault_active_challenge_id', id);
    setActiveTab('tabela');
    if (settings.soundEnabled) playTickSound();
  };

  // Create Challenge callback
  const handleChallengeCreated = (newChallenge: Challenge) => {
    const updatedChallenges = [newChallenge, ...challenges];
    
    // Add transaction history log
    const startHistoryEntry: HistoryEntry = {
      id: `hist-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      value: 0,
      type: 'deposit',
      description: `Desafio "${newChallenge.title}" iniciado! Meta: ${getCurrencySymbol()} ${newChallenge.targetGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
      challengeId: newChallenge.id,
      challengeTitle: newChallenge.title,
    };

    const updatedHistory = [startHistoryEntry, ...history];

    saveAllData(updatedChallenges, updatedHistory);
    setActiveChallengeId(newChallenge.id);
    localStorage.setItem('vault_active_challenge_id', newChallenge.id);
    setIsCreatingNewChallenge(false);
    setActiveTab('tabela');
    
    addToast(`Desafio "${newChallenge.title}" criado com sucesso!`, 'success');
    if (settings.soundEnabled) playSuccessSound();
  };

  // Currency helper
  const getCurrencySymbol = () => {
    switch (settings.currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      default: return 'R$';
    }
  };

  // Fullscreen helper
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error(err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Completion triggers
  const checkCompletionStatus = (squares: Square[], oldSaved: number, target: number, challengeTitle: string) => {
    const currentSaved = squares.reduce((sum, s) => sum + s.saved, 0);
    if (currentSaved >= target && oldSaved < target) {
      setShowConfetti(true);
      addToast(`🎉 Parabéns! Você concluiu a meta "${challengeTitle}"!`, 'success');
      if (settings.soundEnabled) {
        playVictorySound();
      }
      setTimeout(() => setShowConfetti(false), 8000);
    }
  };

  // --- DEPOSIT WITH PIX OR CASH ---
  const handleSquareClick = (squareId: string, initialMethod?: 'pix' | 'cash') => {
    if (!activeChallenge) return;
    const square = activeChallenge.squares.find((s) => s.id === squareId);
    if (!square) return;

    if (square.isCompleted) {
      // If it is completed, allow untoggling like normal
      handleToggleComplete(squareId);
    } else {
      // If pending, open DepositModal
      setSelectedSquareForDeposit({ square, index: square.position, initialMethod });
    }
  };

  const handleConfirmDeposit = (amount: number, method: 'pix' | 'cash') => {
    if (!activeChallenge || !selectedSquareForDeposit) return;
    const { square } = selectedSquareForDeposit;

    const oldSaved = activeChallenge.squares.reduce((sum, s) => sum + s.saved, 0);
    const newSaved = Number(Math.min(square.value, square.saved + amount).toFixed(2));
    const isNowCompleted = Math.abs(newSaved - square.value) < 0.01;

    if (settings.soundEnabled) {
      if (isNowCompleted) playSuccessSound();
      else playTickSound();
    }

    const updatedSquares = activeChallenge.squares.map((s) => {
      if (s.id === square.id) {
        return { ...s, saved: newSaved, isCompleted: isNowCompleted };
      }
      return s;
    });

    const methodName = method === 'pix' ? 'PIX' : 'Dinheiro';
    const typeLabel = isNowCompleted ? 'completion' : 'partial';

    const newHistoryEntry: HistoryEntry = {
      id: `hist-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      value: amount,
      type: typeLabel,
      description: isNowCompleted
        ? `Quadrado #${square.position + 1} de ${getCurrencySymbol()} ${square.value} concluído via depósito em ${methodName}!`
        : `Depósito parcial de ${getCurrencySymbol()} ${amount} adicionado ao quadrado #${square.position + 1} via ${methodName}.`,
      squareIndex: square.position + 1,
      challengeId: activeChallenge.id,
      challengeTitle: activeChallenge.title,
    };

    const updatedChallenges = challenges.map((c) => {
      if (c.id === activeChallenge.id) {
        return { ...c, squares: updatedSquares };
      }
      return c;
    });

    const updatedHistory = [newHistoryEntry, ...history];
    saveAllData(updatedChallenges, updatedHistory);
    
    addToast(
      isNowCompleted
        ? `Quadrado #${square.position + 1} marcado como concluído!`
        : `Depósito de ${getCurrencySymbol()} ${amount} via ${methodName} adicionado!`,
      'success'
    );

    checkCompletionStatus(updatedSquares, oldSaved, activeChallenge.targetGoal, activeChallenge.title);
    setSelectedSquareForDeposit(null);
  };

  // --- REDEEM VIA PIX LOGIC ---
  const handleConfirmRedeem = (amount: number, pixKey: string, keyType: string) => {
    if (!activeChallenge) return;

    let amountToDeduct = amount;
    // Iterate in reverse to deduct from completed/partially saved squares first
    const updatedSquares = [...activeChallenge.squares].reverse().map((square) => {
      if (amountToDeduct <= 0) return square;

      if (square.saved > 0) {
        const toDeductFromSquare = Math.min(square.saved, amountToDeduct);
        const newSaved = Number((square.saved - toDeductFromSquare).toFixed(2));
        amountToDeduct = Number((amountToDeduct - toDeductFromSquare).toFixed(2));
        const isCompleted = Math.abs(newSaved - square.value) < 0.01;
        return { ...square, saved: newSaved, isCompleted };
      }
      return square;
    }).reverse();

    if (settings.soundEnabled) {
      playToggleOffSound();
    }

    const keyLabel = keyType.toUpperCase();

    const newHistoryEntry: HistoryEntry = {
      id: `hist-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      value: -amount, // Negative value to denote withdrawal
      type: 'withdrawal',
      description: `Resgate de ${getCurrencySymbol()} ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} via Pix para a chave (${keyLabel}) realizado com sucesso!`,
      challengeId: activeChallenge.id,
      challengeTitle: activeChallenge.title,
    };

    const updatedChallenges = challenges.map((c) => {
      if (c.id === activeChallenge.id) {
        return { ...c, squares: updatedSquares };
      }
      return c;
    });

    const updatedHistory = [newHistoryEntry, ...history];
    saveAllData(updatedChallenges, updatedHistory);

    addToast(
      `Resgate de ${getCurrencySymbol()} ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} via Pix concluído com sucesso!`,
      'success'
    );
  };

  // --- INTERACTIVE SQUARE TOGGLES ---
  const handleToggleComplete = (squareId: string) => {
    if (!activeChallenge) return;

    const oldSaved = activeChallenge.squares.reduce((sum, s) => sum + s.saved, 0);
    const updatedSquares = activeChallenge.squares.map((s) => {
      if (s.id === squareId) {
        const newCompleted = !s.isCompleted;
        return {
          ...s,
          isCompleted: newCompleted,
          saved: newCompleted ? s.value : 0,
        };
      }
      return s;
    });

    const toggledSquare = activeChallenge.squares.find((s) => s.id === squareId);
    if (!toggledSquare) return;

    const isNowCompleted = !toggledSquare.isCompleted;

    if (settings.soundEnabled) {
      if (isNowCompleted) {
        playSuccessSound();
      } else {
        playToggleOffSound();
      }
    }

    const newHistoryEntry: HistoryEntry = {
      id: `hist-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      value: isNowCompleted ? toggledSquare.value - toggledSquare.saved : -toggledSquare.saved,
      type: isNowCompleted ? 'completion' : 'edit',
      description: isNowCompleted
        ? `Quadrado #${toggledSquare.position + 1} de ${getCurrencySymbol()} ${toggledSquare.value} marcado como Concluído!`
        : `Removido a marcação do quadrado #${toggledSquare.position + 1}.`,
      squareIndex: toggledSquare.position + 1,
      challengeId: activeChallenge.id,
      challengeTitle: activeChallenge.title,
    };

    const updatedChallenges = challenges.map((c) => {
      if (c.id === activeChallenge.id) {
        return { ...c, squares: updatedSquares };
      }
      return c;
    });

    const updatedHistory = [newHistoryEntry, ...history];
    saveAllData(updatedChallenges, updatedHistory);
    
    addToast(
      isNowCompleted 
        ? `Quadrado #${toggledSquare.position + 1} marcado!` 
        : `Quadrado #${toggledSquare.position + 1} desmarcado.`, 
      isNowCompleted ? 'success' : 'info'
    );

    checkCompletionStatus(updatedSquares, oldSaved, activeChallenge.targetGoal, activeChallenge.title);
  };

  const handlePartialDeposit = (squareId: string, amount: number) => {
    if (!activeChallenge) return;

    const oldSaved = activeChallenge.squares.reduce((sum, s) => sum + s.saved, 0);
    const toggledSquare = activeChallenge.squares.find((s) => s.id === squareId);
    if (!toggledSquare) return;

    const newSaved = Number(Math.min(toggledSquare.value, toggledSquare.saved + amount).toFixed(2));
    const isNowCompleted = Math.abs(newSaved - toggledSquare.value) < 0.01;

    if (settings.soundEnabled) {
      if (isNowCompleted) playSuccessSound();
      else playTickSound();
    }

    const updatedSquares = activeChallenge.squares.map((s) => {
      if (s.id === squareId) {
        return { ...s, saved: newSaved, isCompleted: isNowCompleted };
      }
      return s;
    });

    const newHistoryEntry: HistoryEntry = {
      id: `hist-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      value: amount,
      type: isNowCompleted ? 'completion' : 'partial',
      description: isNowCompleted
        ? `Quadrado #${toggledSquare.position + 1} de ${getCurrencySymbol()} ${toggledSquare.value} preenchido automaticamente com depósito de ${getCurrencySymbol()} ${amount}!`
        : `Depósito parcial de ${getCurrencySymbol()} ${amount} adicionado ao quadrado #${toggledSquare.position + 1}.`,
      squareIndex: toggledSquare.position + 1,
      challengeId: activeChallenge.id,
      challengeTitle: activeChallenge.title,
    };

    const updatedChallenges = challenges.map((c) => {
      if (c.id === activeChallenge.id) {
        return { ...c, squares: updatedSquares };
      }
      return c;
    });

    const updatedHistory = [newHistoryEntry, ...history];
    saveAllData(updatedChallenges, updatedHistory);
    addToast(`Poupado parcialmente: ${getCurrencySymbol()} ${amount}`, 'success');
    checkCompletionStatus(updatedSquares, oldSaved, activeChallenge.targetGoal, activeChallenge.title);
  };

  const handleQuickAddComplete = (updatedSquares: Square[], addedHistory: HistoryEntry[]) => {
    if (!activeChallenge) return;

    const oldSaved = activeChallenge.squares.reduce((sum, s) => sum + s.saved, 0);
    const anyCompleted = addedHistory.some((h) => h.type === 'completion');

    if (settings.soundEnabled && anyCompleted) {
      playSuccessSound();
    } else if (settings.soundEnabled) {
      playTickSound();
    }

    const finalAddedHistory = addedHistory.map((h) => ({
      ...h,
      challengeId: activeChallenge.id,
      challengeTitle: activeChallenge.title,
    }));

    const updatedChallenges = challenges.map((c) => {
      if (c.id === activeChallenge.id) {
        return { ...c, squares: updatedSquares };
      }
      return c;
    });

    const updatedHistory = [...finalAddedHistory, ...history];
    saveAllData(updatedChallenges, updatedHistory);
    addToast('Depósitos adicionados com sucesso!', 'success');
    checkCompletionStatus(updatedSquares, oldSaved, activeChallenge.targetGoal, activeChallenge.title);
  };

  // --- EDITOR / TABLE MANIPULATION ---
  const handleEditSquareValue = (squareId: string, newValue: number) => {
    if (!activeChallenge) return;

    const targetSquare = activeChallenge.squares.find((s) => s.id === squareId);
    if (!targetSquare) return;

    const diff = newValue - targetSquare.value;

    const updatedSquares = activeChallenge.squares.map((s) => {
      if (s.id === squareId) {
        return {
          ...s,
          value: newValue,
          saved: s.isCompleted ? newValue : s.saved > newValue ? newValue : s.saved,
          isCompleted: s.isCompleted ? true : s.saved >= newValue,
        };
      }
      return s;
    });

    const newHistoryEntry: HistoryEntry = {
      id: `hist-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      value: 0,
      type: 'edit',
      description: `Valor do quadrado #${targetSquare.position + 1} alterado de ${getCurrencySymbol()} ${targetSquare.value} para ${getCurrencySymbol()} ${newValue}.`,
      squareIndex: targetSquare.position + 1,
      challengeId: activeChallenge.id,
      challengeTitle: activeChallenge.title,
    };

    const updatedChallenges = challenges.map((c) => {
      if (c.id === activeChallenge.id) {
        return {
          ...c,
          targetGoal: Number((c.targetGoal + diff).toFixed(2)),
          squares: updatedSquares,
        };
      }
      return c;
    });

    const updatedHistory = [newHistoryEntry, ...history];
    saveAllData(updatedChallenges, updatedHistory);
    addToast(`Quadrado #${targetSquare.position + 1} alterado para ${getCurrencySymbol()} ${newValue}`, 'info');
  };

  const handleDeleteSquare = (squareId: string) => {
    if (!activeChallenge) return;

    const targetSquare = activeChallenge.squares.find((s) => s.id === squareId);
    if (!targetSquare) return;

    const remainingSquares = activeChallenge.squares.filter((s) => s.id !== squareId);
    const updatedSquares = remainingSquares.map((s, idx) => ({ ...s, position: idx }));

    const newHistoryEntry: HistoryEntry = {
      id: `hist-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      value: 0,
      type: 'edit',
      description: `Quadrado #${targetSquare.position + 1} de ${getCurrencySymbol()} ${targetSquare.value} excluído permanentemente.`,
      challengeId: activeChallenge.id,
      challengeTitle: activeChallenge.title,
    };

    const updatedChallenges = challenges.map((c) => {
      if (c.id === activeChallenge.id) {
        return {
          ...c,
          targetGoal: Number((c.targetGoal - targetSquare.value).toFixed(2)),
          squares: updatedSquares,
        };
      }
      return c;
    });

    const updatedHistory = [newHistoryEntry, ...history];
    saveAllData(updatedChallenges, updatedHistory);
    addToast('Quadrado excluído.', 'info');
  };

  const handleAddSquare = () => {
    if (!activeChallenge) return;

    const avg = activeChallenge.squares.length > 0
      ? Math.round(activeChallenge.targetGoal / activeChallenge.squares.length)
      : 50;

    const newSquare: Square = {
      id: `square-${Math.random().toString(36).substr(2, 9)}`,
      value: avg,
      saved: 0,
      isCompleted: false,
      position: activeChallenge.squares.length,
    };

    const updatedSquares = [...activeChallenge.squares, newSquare];

    const newHistoryEntry: HistoryEntry = {
      id: `hist-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      value: 0,
      type: 'edit',
      description: `Novo quadrado #${updatedSquares.length} de ${getCurrencySymbol()} ${avg} adicionado ao cofre.`,
      challengeId: activeChallenge.id,
      challengeTitle: activeChallenge.title,
    };

    const updatedChallenges = challenges.map((c) => {
      if (c.id === activeChallenge.id) {
        return {
          ...c,
          targetGoal: Number((c.targetGoal + avg).toFixed(2)),
          squares: updatedSquares,
        };
      }
      return c;
    });

    const updatedHistory = [newHistoryEntry, ...history];
    saveAllData(updatedChallenges, updatedHistory);
    addToast(`Novo quadrado de ${getCurrencySymbol()} ${avg} adicionado!`, 'success');
  };

  const handleShuffleSquares = () => {
    if (!activeChallenge) return;

    const shuffled = [...activeChallenge.squares].sort(() => Math.random() - 0.5);
    const updatedSquares = shuffled.map((s, idx) => ({ ...s, position: idx }));

    const newHistoryEntry: HistoryEntry = {
      id: `hist-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      value: 0,
      type: 'edit',
      description: 'Ordem dos quadrados da tabela embaralhada para dinamizar o desafio!',
      challengeId: activeChallenge.id,
      challengeTitle: activeChallenge.title,
    };

    const updatedChallenges = challenges.map((c) => {
      if (c.id === activeChallenge.id) {
        return { ...c, squares: updatedSquares };
      }
      return c;
    });

    const updatedHistory = [newHistoryEntry, ...history];
    saveAllData(updatedChallenges, updatedHistory);
    addToast('Quadrados embaralhados!', 'info');
    if (settings.soundEnabled) playTickSound();
  };

  const handleRegenerateTable = () => {
    if (!activeChallenge) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Regenerar Tabela Inteligente',
      message: 'Tem certeza de que deseja gerar uma nova tabela? Todo o progresso e depósitos parciais deste desafio serão redefinidos de forma permanente!',
      confirmText: 'Regenerar',
      cancelText: 'Cancelar',
      type: 'warning',
      onConfirm: () => {
        const currentCount = activeChallenge.squares.length;
        const values = activeChallenge.squares.map((s) => s.value);
        const currentMin = Math.min(...values) || 10;
        const currentMax = Math.max(...values) || 100;

        const newValues = generateChallengeSquares(activeChallenge.targetGoal, currentCount, currentMin, currentMax);
        const squares: Square[] = newValues.map((val, idx) => ({
          id: `square-${Math.random().toString(36).substr(2, 9)}`,
          value: val,
          saved: 0,
          isCompleted: false,
          position: idx,
        }));

        const newHistoryEntry: HistoryEntry = {
          id: `hist-${Math.random().toString(36).substr(2, 9)}`,
          date: new Date().toISOString(),
          value: 0,
          type: 'edit',
          description: `Tabela inteligente regenerada para ${currentCount} partes com meta final mantida.`,
          challengeId: activeChallenge.id,
          challengeTitle: activeChallenge.title,
        };

        const updatedChallenges = challenges.map((c) => {
          if (c.id === activeChallenge.id) {
            return { ...c, squares };
          }
          return c;
        });

        const updatedHistory = [newHistoryEntry, ...history];
        saveAllData(updatedChallenges, updatedHistory);
        addToast('Tabela inteligente regenerada!', 'success');
        if (settings.soundEnabled) playSuccessSound();
      }
    });
  };

  // --- ACTIONS: ARCHIVE, FAVORITE, DUPLICATE, EXCLUDE ---
  const handleToggleFavorite = (id: string) => {
    const updated = challenges.map((c) => {
      if (c.id === id) {
        return { ...c, isFavorite: !c.isFavorite };
      }
      return c;
    });
    saveAllData(updated);
    addToast('Favorito atualizado!', 'success');
  };

  const handleDuplicateChallenge = (challengeToDuplicate: Challenge) => {
    const newId = `chal-${Math.random().toString(36).substr(2, 9)}`;
    const clonedChallenge: Challenge = {
      ...challengeToDuplicate,
      id: newId,
      title: `${challengeToDuplicate.title} (Cópia)`,
      createdAt: new Date().toISOString(),
      squares: challengeToDuplicate.squares.map((s) => ({
        ...s,
        id: `square-${Math.random().toString(36).substr(2, 9)}`,
        saved: 0,
        isCompleted: false
      })),
      isArchived: false,
      isFavorite: false
    };

    const updatedChallenges = [clonedChallenge, ...challenges];
    
    const duplicateHistory: HistoryEntry = {
      id: `hist-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      value: 0,
      type: 'deposit',
      description: `Desafio duplicado! "${clonedChallenge.title}" iniciado.`,
      challengeId: newId,
      challengeTitle: clonedChallenge.title
    };

    saveAllData(updatedChallenges, [duplicateHistory, ...history]);
    setActiveChallengeId(newId);
    setActiveTab('tabela');
    addToast('Desafio duplicado com sucesso!', 'success');
  };

  const handleArchiveChallenge = (id: string) => {
    const updated = challenges.map((c) => {
      if (c.id === id) {
        const nextArchived = !c.isArchived;
        addToast(nextArchived ? 'Desafio arquivado.' : 'Desafio desarquivado.', 'info');
        return { ...c, isArchived: nextArchived };
      }
      return c;
    });
    saveAllData(updated);
  };

  const handleDeleteChallenge = (id: string) => {
    const challengeToDelete = challenges.find((c) => c.id === id);
    const title = challengeToDelete ? `"${challengeToDelete.title}"` : 'este desafio';

    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Desafio',
      message: `Tem certeza de que deseja excluir ${title} permanentemente? Todos os depósitos e histórico relacionados a este desafio serão perdidos de forma irreversível.`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      type: 'danger',
      onConfirm: async () => {
        const remaining = challenges.filter((c) => c.id !== id);
        let nextActiveId = activeChallengeId;
        
        if (activeChallengeId === id) {
          nextActiveId = remaining.length > 0 ? remaining[0].id : '';
        }

        setChallenges(remaining);
        setActiveChallengeId(nextActiveId);
        localStorage.setItem('vault_challenges', JSON.stringify(remaining));
        localStorage.setItem('vault_active_challenge_id', nextActiveId);

        // Sync cloud removal
        await deleteChallengeFromCloud(id);

        const remainingHistory = history.filter((h) => h.challengeId !== id);
        setHistory(remainingHistory);
        localStorage.setItem('vault_history', JSON.stringify(remainingHistory));

        addToast('Desafio excluído permanentemente.', 'info');
        if (settings.soundEnabled) playToggleOffSound();
      }
    });
  };

  // --- PIN LOCK SYSTEM SECURITY ---
  const handleSavePinSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinSetupValue.length !== 4 || isNaN(parseInt(pinSetupValue))) {
      setPinSetupError('O PIN deve conter exatamente 4 números.');
      return;
    }

    const nextSettings: AppSettings = {
      ...settings,
      pinLockEnabled: true,
      pinCode: pinSetupValue,
    };
    saveAllData(challenges, history, nextSettings);
    setPinSetupValue('');
    setPinSetupError('');
    addToast('PIN de segurança configurado com sucesso!', 'success');
  };

  const handleDisablePin = () => {
    const nextSettings: AppSettings = {
      ...settings,
      pinLockEnabled: false,
      pinCode: '',
    };
    saveAllData(challenges, history, nextSettings);
    addToast('Bloqueio por PIN desativado.', 'info');
  };

  // --- BACKUP / RESTORE HANDLERS ---
  const handleBackupExport = () => {
    const fullBackup = { challenges, history, settings };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `backup-desafio-cofre-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('Backup exportado com sucesso!', 'success');
  };

  const handleBackupImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (Array.isArray(parsed.challenges) && Array.isArray(parsed.history)) {
          saveAllData(parsed.challenges, parsed.history, parsed.settings || settings);
          if (parsed.challenges.length > 0) {
            setActiveChallengeId(parsed.challenges[0].id);
          }
          addToast('Backup importado com sucesso!', 'success');
          setTimeout(() => window.location.reload(), 1500);
        } else {
          addToast('Formato de backup inválido.', 'error');
        }
      } catch (err) {
        addToast('Erro ao processar o arquivo de backup.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleClearDatabase = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'APAGAR TODOS OS DADOS',
      message: 'AVISO CRÍTICO: Tem certeza de que deseja apagar ABSOLUTAMENTE TODOS os dados do aplicativo? Isso inclui todos os desafios, observações, histórico e preferências locais de forma irreversível!',
      confirmText: 'Limpar Tudo',
      cancelText: 'Cancelar',
      type: 'danger',
      onConfirm: () => {
        localStorage.clear();
        addToast('Todos os dados foram resetados.', 'info');
        setTimeout(() => window.location.reload(), 1000);
      }
    });
  };

  // --- RENDERING SORTING ORDER OF SQUARE GRID VALUES ---
  const getSortedSquares = (squares: Square[]) => {
    const sorted = [...squares];
    if (settings.sortOrder === 'asc') {
      return sorted.sort((a, b) => a.value - b.value);
    }
    if (settings.sortOrder === 'desc') {
      return sorted.sort((a, b) => b.value - a.value);
    }
    if (settings.sortOrder === 'random') {
      return sorted.sort((a, b) => a.id.localeCompare(b.id)); // stables sorted randomized
    }
    return sorted; // original order sorted by position index
  };

  // --- STATS LEDGERS METRICS ---
  const totalSavedAllTime = history
    .filter((h) => h.type === 'deposit' || h.type === 'partial' || h.type === 'manual_add')
    .reduce((sum, h) => sum + h.value, 0);

  const completedChallengesCount = challenges.filter((c) => {
    const total = c.squares.reduce((sum, s) => sum + s.saved, 0);
    return total >= c.targetGoal;
  }).length;

  const renderedSquares = activeChallenge
    ? getSortedSquares(
        activeChallenge.squares.filter((s) => {
          if (viewFilter === 'pending') return !s.isCompleted && s.saved < s.value;
          if (viewFilter === 'completed') return s.isCompleted || s.saved >= s.value;
          return true;
        })
      )
    : [];

  // Theme Accent Mapping styles
  const colorMapTheme = {
    emerald: {
      accent: 'text-emerald-400',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/10 hover:bg-emerald-500/20',
      fill: 'bg-emerald-500 hover:bg-emerald-400',
      btnAccent: 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20',
      badge: 'bg-emerald-950/20 border border-emerald-500/10 text-emerald-400',
      progress: 'from-emerald-500 to-cyan-500',
      outlineGlow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]',
    },
    blue: {
      accent: 'text-cyan-400',
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-500/10 hover:bg-cyan-500/20',
      fill: 'bg-cyan-500 hover:bg-cyan-400',
      btnAccent: 'border-cyan-500/30 text-cyan-400 bg-cyan-950/20',
      badge: 'bg-cyan-950/20 border border-cyan-500/10 text-cyan-400',
      progress: 'from-cyan-500 to-indigo-500',
      outlineGlow: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]',
    },
    gold: {
      accent: 'text-amber-400',
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/10 hover:bg-amber-500/20',
      fill: 'bg-amber-500 hover:bg-amber-400',
      btnAccent: 'border-amber-500/30 text-amber-400 bg-amber-950/20',
      badge: 'bg-amber-950/20 border border-amber-500/10 text-amber-400',
      progress: 'from-amber-500 to-yellow-300',
      outlineGlow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]',
    },
    violet: {
      accent: 'text-violet-400',
      border: 'border-violet-500/30',
      bg: 'bg-violet-500/10 hover:bg-violet-500/20',
      fill: 'bg-violet-500 hover:bg-violet-400',
      btnAccent: 'border-violet-500/30 text-violet-400 bg-violet-950/20',
      badge: 'bg-violet-950/20 border border-violet-500/10 text-violet-400',
      progress: 'from-violet-500 to-fuchsia-400',
      outlineGlow: 'shadow-[0_0_15px_rgba(139,92,246,0.15)]',
    },
    amber: {
      accent: 'text-amber-500',
      border: 'border-amber-600/30',
      bg: 'bg-amber-500/10 hover:bg-amber-500/20',
      fill: 'bg-amber-500 hover:bg-amber-400',
      btnAccent: 'border-amber-500/30 text-amber-500 bg-amber-950/15',
      badge: 'bg-amber-950/20 border border-amber-500/10 text-amber-500',
      progress: 'from-amber-500 to-red-400',
      outlineGlow: 'shadow-[0_0_15px_rgba(217,119,6,0.15)]',
    },
  };

  const activeTheme = colorMapTheme[settings.accentColor] || colorMapTheme.emerald;

  // Background Theme colors mappings
  const bgThemeMap = {
    'matte-black': 'bg-[#050505]',
    'soft-obsidian': 'bg-[#0E0E10]',
    'deep-navy': 'bg-[#060810]',
    'space-dark': 'bg-[#09070F]',
    'forest-slate': 'bg-[#070A08]'
  };
  const activeBg = settings.themeBg ? bgThemeMap[settings.themeBg] : 'bg-[#0A0A0A]';

  // Fonts Family Mappings
  const fontClassMap = {
    'inter': 'font-sans',
    'grotesk': 'font-display',
    'mono': 'font-mono',
    'playfair': 'font-serif'
  };
  const activeFont = fontClassMap[settings.fontFamily || 'inter'];

  // Render PIN Lock Overlay Screen
  if (settings.isLocked && settings.pinLockEnabled) {
    return (
      <PINLockScreen
        correctPin={settings.pinCode}
        onUnlock={() => {
          setSettings((prev) => ({ ...prev, isLocked: false }));
          if (settings.soundEnabled) playSuccessSound();
        }}
        onResetPin={() => {
          const confirmReset = window.confirm('Se esquecer o seu PIN, para recuperar o acesso você precisará redefinir todos os dados locais. Deseja redefinir tudo?');
          if (confirmReset) {
            localStorage.clear();
            window.location.reload();
          }
        }}
      />
    );
  }

  // Show loading screen while checking auth status
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500 mb-4"></div>
        <p className="text-sm text-neutral-400 font-mono">Carregando...</p>
      </div>
    );
  }

  // Enforce authentication gate: users must sign in or register to view the app interface
  if (!currentUser) {
    return (
      <div className={`min-h-screen bg-[#060606] text-[#E5E7EB] ${activeFont} antialiased flex flex-col items-center justify-center p-4 relative overflow-hidden`}>
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Brand Welcome Header */}
        <div className="text-center mb-6 z-10">
          <div className="inline-flex p-4 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-2xl shadow-[0_0_25px_rgba(6,182,212,0.25)] text-black mb-4">
            <Vault className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h1 className="font-display font-black text-3xl tracking-wider text-white uppercase">
            COFRE <span className="text-cyan-400 font-light">Desafio</span>
          </h1>
          <p className="text-xs text-neutral-400 tracking-wider font-semibold uppercase mt-1">Premium Financial Tracker</p>
        </div>

        <AuthModal
          isOpen={true}
          onClose={() => {}}
          onToast={addToast}
          onSyncLocalData={handleOnboardingSync}
          isGated={true}
        />
        
        <ToastContainer toasts={toasts} onClose={handleToastClose} />

        <ConfirmModal
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          type={confirmDialog.type}
          onConfirm={confirmDialog.onConfirm}
          onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        />
      </div>
    );
  }

  // Predefined avatar values
  const userAvatar = getUserAvatar(currentUser?.photoURL);

  return (
    <div className={`min-h-screen ${activeBg} text-[#E5E7EB] ${activeFont} antialiased pb-12 selection:bg-cyan-500 selection:text-black transition-colors duration-500`}>
      <ConfettiCanvas active={showConfetti} />
      
      {/* Dynamic Toast System Container */}
      <ToastContainer toasts={toasts} onClose={handleToastClose} />

      {/* --- PREMIUM COMPREHENSIVE HEADER --- */}
      <header className="border-b border-neutral-800/60 bg-[#0A0A0A]/90 backdrop-blur sticky top-0 z-40 print:hidden px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.25)] text-black">
                <Vault className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-display font-black text-lg tracking-wider text-white uppercase flex items-center gap-1">
                  COFRE <span className="text-cyan-400 font-light">Desafio</span>
                </span>
                <p className="text-[10px] text-neutral-500 tracking-wider font-semibold uppercase">Premium Financial Tracker</p>
              </div>
            </div>

            {/* Quick user avatar trigger on small screen */}
            <button
              onClick={() => setShowAuthModal(true)}
              className="md:hidden flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-xl"
            >
              {currentUser ? (
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${userAvatar.bg} flex items-center justify-center text-lg shadow-inner`}>
                  {userAvatar.emoji}
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-neutral-950 flex items-center justify-center text-xs text-neutral-400">
                  <LogIn className="w-4 h-4" />
                </div>
              )}
            </button>
          </div>

          {/* Unified Navigation Tabs */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800/80 rounded-xl p-1 gap-1">
            <button
              onClick={() => { setActiveTab('dashboard'); setIsCreatingNewChallenge(false); }}
              className={`py-2 px-3.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'dashboard' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <FolderOpen size={14} /> Dashboard
            </button>

            {challenges.length > 0 && (
              <button
                onClick={() => { setActiveTab('tabela'); setIsCreatingNewChallenge(false); }}
                className={`py-2 px-3.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'tabela' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Grid size={14} /> Tabela Ativa
              </button>
            )}

            <button
              onClick={() => { setActiveTab('historico'); setIsCreatingNewChallenge(false); }}
              className={`py-2 px-3.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'historico' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Calendar size={14} /> Histórico
            </button>

            <button
              onClick={() => { setActiveTab('estilo'); setIsCreatingNewChallenge(false); }}
              className={`py-2 px-3.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'estilo' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Sliders size={14} /> Estilo & Conta
            </button>

            <button
              onClick={() => { setActiveTab('admin'); setIsCreatingNewChallenge(false); }}
              className={`py-2 px-3.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'admin' ? 'bg-red-950/20 text-red-400 shadow' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Lock size={14} /> Admin
            </button>
          </div>

          {/* Controls Trigger Toolbar */}
          <div className="hidden md:flex items-center gap-3">
            
            {/* Quick Profile Sync Button */}
            <button
              onClick={() => setShowAuthModal(true)}
              className="py-1.5 px-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white flex items-center gap-2 cursor-pointer shadow"
            >
              {currentUser ? (
                <>
                  <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${userAvatar.bg} flex items-center justify-center text-xs shadow-inner`}>
                    {userAvatar.emoji}
                  </div>
                  <span className="truncate max-w-[100px]">{currentUser.displayName || 'Poupador'}</span>
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5 text-cyan-400" />
                  Conectar Conta
                </>
              )}
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-400 hover:text-white transition-all cursor-pointer"
              title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Audio Toggle */}
            <button
              onClick={() => {
                const nextSound = !settings.soundEnabled;
                setSettings({ ...settings, soundEnabled: nextSound });
                localStorage.setItem('vault_app_settings', JSON.stringify({ ...settings, soundEnabled: nextSound }));
              }}
              className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-400 hover:text-white transition-all cursor-pointer"
            >
              {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
            </button>
          </div>

        </div>
      </header>

      {/* --- MAIN ROOT CORE LAYOUT --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        
        {/* State A: Creator Mode */}
        {isCreatingNewChallenge || challenges.length === 0 ? (
          <div className="space-y-6">
            {challenges.length > 0 && (
              <button
                onClick={() => setIsCreatingNewChallenge(false)}
                className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft size={14} /> Voltar para o Dashboard
              </button>
            )}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center"
            >
              <ChallengeCreator
                onChallengeCreated={handleChallengeCreated}
                currencySymbol={getCurrencySymbol()}
              />
            </motion.div>
          </div>
        ) : (
          /* State B: Navigated Sections Layouts */
          <div className="space-y-8 animate-fade-in">
            
            {/* 1. VIEW TAB: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <DashboardOverview
                challenges={challenges}
                history={history}
                currencySymbol={getCurrencySymbol()}
                onSelectChallenge={handleSelectChallenge}
                onDuplicateChallenge={handleDuplicateChallenge}
                onArchiveChallenge={handleArchiveChallenge}
                onDeleteChallenge={handleDeleteChallenge}
                onToggleFavorite={handleToggleFavorite}
                onCreateNewChallenge={() => setIsCreatingNewChallenge(true)}
                activeChallengeId={activeChallengeId}
                accentColor={settings.accentColor}
              />
            )}

            {/* 2. VIEW TAB: MARCAÇÃO TABLE */}
            {activeTab === 'tabela' && activeChallenge && (
              <div className="space-y-8">
                {/* Active Challenge Header banner */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800/40 pb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-cyan-400 tracking-wider uppercase bg-cyan-950/20 px-2 py-0.5 border border-cyan-800/30 rounded-md">
                        {activeChallenge.category}
                      </span>
                      {activeChallenge.deadline && (
                        <span className="text-[10px] text-amber-400 font-mono">
                          📅 Prazo: {new Date(activeChallenge.deadline).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
                      {activeChallenge.title}
                      {activeChallenge.isFavorite && <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />}
                    </h1>
                  </div>

                  {/* Toolbar triggers */}
                  <div className="flex items-center gap-2 flex-wrap print:hidden">
                    <button
                      onClick={() => exportToPNG(activeChallenge)}
                      className="py-2.5 px-3.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-300 hover:text-white font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg"
                    >
                      <FileDown className="w-4 h-4 text-emerald-400" /> PNG
                    </button>

                    <button
                      onClick={() => window.print()}
                      className="py-2.5 px-3.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-300 hover:text-white font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg"
                    >
                      <Printer className="w-4 h-4 text-cyan-400" /> Imprimir / PDF
                    </button>

                    <button
                      onClick={() => setShowShareModal(true)}
                      className="py-2.5 px-3.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-300 hover:text-white font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg"
                    >
                      <Share2 className="w-4 h-4 text-amber-400" /> Compartilhar
                    </button>

                    <button
                      onClick={() => handleArchiveChallenge(activeChallenge.id)}
                      className="p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-400 hover:text-white transition-all cursor-pointer"
                      title={activeChallenge.isArchived ? 'Desarquivar' : 'Arquivar desafio'}
                    >
                      <Archive size={16} className={activeChallenge.isArchived ? 'text-amber-400' : ''} />
                    </button>

                    <button
                      onClick={() => handleDeleteChallenge(activeChallenge.id)}
                      className="p-2.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 rounded-xl text-red-400 transition-all cursor-pointer"
                      title="Excluir desafio permanentemente"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Stats Dashboard */}
                <StatsPanel
                  challenge={activeChallenge}
                  history={history}
                  currencySymbol={getCurrencySymbol()}
                  accentColor={settings.accentColor}
                  onRedeemPix={() => setIsRedeemOpen(true)}
                />

                {/* Interactive bar for Action (Select Desired Goal & Toggle Editor) */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#121212] border border-neutral-800/60 rounded-2xl p-5 print:hidden">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider hidden md:inline">
                      Escolher Meta Desejada:
                    </span>
                    <select
                      id="goal-select"
                      value={activeChallengeId}
                      onChange={(e) => handleSelectChallenge(e.target.value)}
                      className="flex-1 sm:flex-none py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-cyan-500 transition-all cursor-pointer min-w-[220px]"
                    >
                      {challenges.filter(c => !c.isArchived).map((c) => (
                        <option key={c.id} value={c.id} className="bg-[#151515] text-white">
                          🎯 {c.title} ({getCurrencySymbol()} {c.targetGoal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Editor console switcher trigger */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => setIsEditorMode(!isEditorMode)}
                      className={`py-2 px-4 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        isEditorMode
                          ? 'bg-amber-950/20 border-amber-500 text-amber-400 shadow-lg'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {isEditorMode ? 'Sair do Modo Editor' : '⚙️ Editar Tabela Inteligente'}
                    </button>
                  </div>
                </div>

                {/* Editor drawer / panel */}
                <AnimatePresence>
                  {isEditorMode && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden print:hidden"
                    >
                      <div className="bg-neutral-900/20 border border-neutral-800/60 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <button
                          onClick={handleAddSquare}
                          className="py-3 px-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Plus className="w-4 h-4 text-emerald-400" /> Adicionar Quadrado
                        </button>
                        <button
                          onClick={handleShuffleSquares}
                          className="py-3 px-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Shuffle className="w-4 h-4 text-cyan-400" /> Embaralhar Valores
                        </button>
                        <button
                          onClick={handleRegenerateTable}
                          className="py-3 px-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <RefreshCw className="w-4 h-4 text-yellow-500" /> Regenerar Tabela (Meta Mantida)
                        </button>
                        <div className="flex items-center justify-center bg-amber-950/10 border border-amber-500/10 rounded-xl p-3 text-center">
                          <p className="text-[10px] text-amber-500 leading-normal font-medium">
                            Modo Editor Ativo! Edite valores ou remova partes do desafio.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Smart Squares Grid section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-800/40 pb-3">
                    <div className="flex items-center gap-2">
                      <Grid className="w-4 h-4 text-neutral-400" />
                      <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Tabela de Quadrados</span>
                    </div>

                    <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-1 gap-1">
                      {(['all', 'pending', 'completed'] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setViewFilter(filter)}
                          className={`py-1.5 px-3 text-[10px] font-bold rounded-lg transition-all capitalize cursor-pointer ${
                            viewFilter === filter
                              ? 'bg-neutral-800 text-white'
                              : 'text-neutral-500 hover:text-neutral-300'
                          }`}
                        >
                          {filter === 'all' ? 'Ver Todos' : filter === 'pending' ? 'Pendentes' : 'Concluídos'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Squares list */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                    {renderedSquares.length === 0 ? (
                      <div className="col-span-full py-16 text-center text-neutral-500 text-sm">
                        Nenhum quadrado encontrado neste filtro.
                      </div>
                    ) : (
                      renderedSquares.map((square, idx) => (
                        <SquareCard
                          key={square.id}
                          square={square}
                          index={square.position}
                          onToggleComplete={handleSquareClick}
                          onPartialDeposit={handlePartialDeposit}
                          isEditorMode={isEditorMode}
                          onEditValue={handleEditSquareValue}
                          onDeleteSquare={handleDeleteSquare}
                          currencySymbol={getCurrencySymbol()}
                          accentColor={settings.accentColor}
                          roundness={settings.roundness}
                          squareSize={settings.squareSize}
                          squareFormat={settings.squareFormat}
                          borderStyle={settings.borderStyle}
                          fontFamily={settings.fontFamily}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 3. VIEW TAB: HISTÓRICO */}
            {activeTab === 'historico' && (
              <div className="space-y-8">
                {/* Contribution visual grid */}
                <SavingsCalendar history={history} currencySymbol={getCurrencySymbol()} />

                {/* Ledger lists */}
                <HistoryPanel
                  history={history}
                  currencySymbol={getCurrencySymbol()}
                  onClearHistory={() => {
                    setConfirmDialog({
                      isOpen: true,
                      title: 'Limpar Histórico',
                      message: 'Tem certeza de que deseja limpar todos os registros de histórico? Essa ação apagará a linha do tempo de depósitos e estatísticas detalhadas.',
                      confirmText: 'Limpar Histórico',
                      cancelText: 'Cancelar',
                      type: 'danger',
                      onConfirm: () => {
                        setHistory([]);
                        localStorage.setItem('vault_history', '[]');
                        addToast('Histórico limpo.', 'info');
                      }
                    });
                  }}
                />
              </div>
            )}

            {/* 4. VIEW TAB: ESTILO & CONTA */}
            {activeTab === 'estilo' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: Sync & Billing/Pix Info */}
                <div className="space-y-6 lg:col-span-1">
                  
                  {/* Section A: Account Sync Module */}
                  <div className="bg-[#111111] border border-neutral-800/60 p-6 rounded-2xl space-y-5">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                      <ShieldCheck className="text-cyan-400 w-4 h-4" /> 1. Sincronização Cloud
                    </h3>

                    {currentUser ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-neutral-900/50 border border-neutral-800 rounded-xl">
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${userAvatar.bg} flex items-center justify-center text-xl shadow-inner`}>
                            {userAvatar.emoji}
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold text-white">{currentUser.displayName || 'Poupador Premium'}</p>
                            <p className="text-[10px] text-neutral-500 truncate">{currentUser.email}</p>
                          </div>
                        </div>

                        <div className="p-3 bg-emerald-950/10 border border-emerald-500/10 text-emerald-400 text-[11px] rounded-lg">
                          🟢 Seus desafios e histórico estão salvos na nuvem de forma automática e segura.
                        </div>

                        <button
                          onClick={() => setShowAuthModal(true)}
                          className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-cyan-400 font-bold rounded-xl transition-all cursor-pointer"
                        >
                          Gerenciar Perfil / Sair
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          Seus desafios estão salvos neste navegador. Conecte sua conta para acessar em qualquer dispositivo sem perder nada!
                        </p>

                        <button
                          onClick={() => setShowAuthModal(true)}
                          className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-950/20"
                        >
                          <LogIn size={14} className="stroke-[2.5]" /> Criar Conta / Entrar
                        </button>
                      </div>
                    )}

                    {/* Backup export options */}
                    <div className="pt-4 border-t border-neutral-800/40 space-y-2">
                      <h4 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">Backup Manual</h4>
                      <button
                        onClick={handleBackupExport}
                        className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <FileJson size={14} className="text-yellow-500" /> Exportar Backup JSON
                      </button>
                      
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <UploadCloud size={14} className="text-cyan-400" /> Importar Backup JSON
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleBackupImport}
                        accept=".json"
                        className="hidden"
                      />
                    </div>

                    {/* Reset app completely */}
                    <div className="pt-3 border-t border-neutral-800/40">
                      <button
                        onClick={handleClearDatabase}
                        className="w-full py-2 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Resetar Aplicativo (Limpar Tudo)
                      </button>
                    </div>
                  </div>

                  {/* Section C: Pix & Billing Information */}
                  <div className="bg-[#111111] border border-neutral-800/60 p-6 rounded-2xl space-y-5">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                      <CreditCard className="text-emerald-400 w-4 h-4" /> 2. Dados de Faturamento & Pix
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                          Nome Completo do Titular
                        </label>
                        <input
                          type="text"
                          value={settings.fullName || ''}
                          onChange={(e) => {
                            const next = { ...settings, fullName: e.target.value };
                            saveAllData(challenges, history, next);
                          }}
                          placeholder="Digite seu nome completo"
                          className="w-full bg-[#151515] border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                          Chave Pix de Recebimento
                        </label>
                        <input
                          type="text"
                          value={settings.pixKey || ''}
                          onChange={(e) => {
                            const next = { ...settings, pixKey: e.target.value };
                            saveAllData(challenges, history, next);
                          }}
                          placeholder="CPF, E-mail, Celular ou Aleatória"
                          className="w-full bg-[#151515] border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                        />
                        <span className="text-[9px] text-neutral-500 mt-1 block leading-relaxed">
                          Sua chave Pix cadastrada será mostrada no painel de saques do administrador para processamento dos seus prêmios de resgate.
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Section B: Visual Premium Customizer */}
                <div className="bg-[#111111] border border-neutral-800/60 p-6 rounded-2xl space-y-6 lg:col-span-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <Sliders className="text-cyan-400 w-4 h-4" /> 2. Personalização Visual Premium
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Accent colors */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1.5">Cor Principal de Destaque</label>
                      <select
                        value={settings.accentColor}
                        onChange={(e) => {
                          const next = { ...settings, accentColor: e.target.value as any };
                          saveAllData(challenges, history, next);
                          addToast('Cor de destaque alterada!', 'success');
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="emerald">Verde Esmeralda</option>
                        <option value="blue">Neon Blue</option>
                        <option value="gold">Dourado Premium</option>
                        <option value="violet">Fuchsia Real</option>
                        <option value="amber">Laranja Âmbar</option>
                      </select>
                    </div>

                    {/* Background canvas themes */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1.5">Cor do Fundo (Background)</label>
                      <select
                        value={settings.themeBg || 'matte-black'}
                        onChange={(e) => {
                          const next = { ...settings, themeBg: e.target.value as any };
                          saveAllData(challenges, history, next);
                          addToast('Tema de fundo alterado!', 'success');
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="matte-black">Matte Black (Preto Fosco)</option>
                        <option value="soft-obsidian">Obsidian Gray (Cinza Escuro)</option>
                        <option value="deep-navy">Deep Navy Blue (Marinho)</option>
                        <option value="space-dark">Deep Space (Cósmico)</option>
                        <option value="forest-slate">Forest Slate (Selva Escura)</option>
                      </select>
                    </div>

                    {/* Square size */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1.5">Tamanho dos Quadrados</label>
                      <select
                        value={settings.squareSize || 'md'}
                        onChange={(e) => {
                          const next = { ...settings, squareSize: e.target.value as any };
                          saveAllData(challenges, history, next);
                          addToast('Tamanho dos quadrados alterado!', 'success');
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="sm">Pequeno</option>
                        <option value="md">Médio</option>
                        <option value="lg">Grande</option>
                      </select>
                    </div>

                    {/* Square Format */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1.5">Formato dos Quadrados</label>
                      <select
                        value={settings.squareFormat || 'rounded'}
                        onChange={(e) => {
                          const next = { ...settings, squareFormat: e.target.value as any };
                          saveAllData(challenges, history, next);
                          addToast('Formato dos quadrados alterado!', 'success');
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="rounded">Cantos Arredondados</option>
                        <option value="circle">Círculo Perfeito</option>
                        <option value="square">Quadrado Sem Bordas</option>
                      </select>
                    </div>

                    {/* Borders */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1.5">Bordas dos Quadrados</label>
                      <select
                        value={settings.borderStyle || 'thin'}
                        onChange={(e) => {
                          const next = { ...settings, borderStyle: e.target.value as any };
                          saveAllData(challenges, history, next);
                          addToast('Borda dos quadrados alterada!', 'success');
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="thin">Borda Fina</option>
                        <option value="thick">Borda Espessa</option>
                        <option value="none">Nenhuma Borda</option>
                      </select>
                    </div>

                    {/* Font Family selection */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1.5">Fonte da Interface (Typography)</label>
                      <select
                        value={settings.fontFamily || 'inter'}
                        onChange={(e) => {
                          const next = { ...settings, fontFamily: e.target.value as any };
                          saveAllData(challenges, history, next);
                          addToast('Fonte alterada!', 'success');
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="inter">Inter (Modern Sans-Serif)</option>
                        <option value="grotesk">Space Grotesk (Tech Heading)</option>
                        <option value="mono">JetBrains Mono (Developer Code)</option>
                        <option value="playfair">Playfair Display (Serif Elegante)</option>
                      </select>
                    </div>

                    {/* Currency selection */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1.5">Símbolo da Moeda</label>
                      <select
                        value={settings.currency}
                        onChange={(e) => {
                          const next = { ...settings, currency: e.target.value as any };
                          saveAllData(challenges, history, next);
                          addToast('Moeda alterada!', 'success');
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none"
                      >
                        <option value="BRL">Real Brasileiro (R$)</option>
                        <option value="USD">Dólar Americano ($)</option>
                        <option value="EUR">Euro (€)</option>
                      </select>
                    </div>

                    {/* Ordering of values */}
                    <div>
                      <label className="block text-xs font-medium text-[#A3A3A3] mb-1.5">Ordem de Exibição dos Valores</label>
                      <select
                        value={settings.sortOrder || 'original'}
                        onChange={(e) => {
                          const next = { ...settings, sortOrder: e.target.value as any };
                          saveAllData(challenges, history, next);
                          addToast('Ordenação dos valores alterada!', 'success');
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="original">Ordem Original de Criação</option>
                        <option value="asc">Ordem Crescente (Menor ➔ Maior)</option>
                        <option value="desc">Ordem Decrescente (Maior ➔ Menor)</option>
                        <option value="random">Ordem Embaralhada Estável</option>
                      </select>
                    </div>

                    {/* Language Selection */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1.5">Idioma do Sistema</label>
                      <select
                        value={settings.language}
                        onChange={(e) => {
                          const next = { ...settings, language: e.target.value as any };
                          saveAllData(challenges, history, next);
                          addToast('Idioma alterado!', 'success');
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none"
                      >
                        <option value="pt">Português (BR)</option>
                        <option value="en">English (US)</option>
                      </select>
                    </div>

                    {/* Security lock PIN config */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1.5">PIN Lock de Segurança</label>
                      {settings.pinLockEnabled ? (
                        <div className="flex gap-2">
                          <span className="text-[11px] text-emerald-400 font-bold bg-[#171717] border border-neutral-800 rounded-xl px-3 py-2 flex-1">
                            🔒 Ativo
                          </span>
                          <button
                            type="button"
                            onClick={handleDisablePin}
                            className="text-xs font-bold text-red-400 hover:text-red-300 bg-red-950/20 border border-red-900/40 px-3 py-2 rounded-xl"
                          >
                            Desativar
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleSavePinSetup} className="flex gap-2">
                          <input
                            type="password"
                            maxLength={4}
                            placeholder="Definir 4 digitos"
                            value={pinSetupValue}
                            onChange={(e) => setPinSetupValue(e.target.value.replace(/\D/g, ''))}
                            className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none flex-1 placeholder-neutral-700"
                          />
                          <button
                            type="submit"
                            className="px-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs rounded-xl"
                          >
                            Ativar
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* 5. VIEW TAB: ADMIN PANEL */}
            {activeTab === 'admin' && (
              <AdminPanel
                challenges={challenges}
                history={history}
                activeChallengeId={activeChallengeId}
                onSelectChallenge={(id) => {
                  setActiveChallengeId(id);
                  localStorage.setItem('vault_active_challenge_id', id);
                }}
                saveAllData={saveAllData}
                currencySymbol={getCurrencySymbol()}
                addToast={addToast}
              />
            )}

          </div>
        )}

        {/* Floating Share Progress Modal Overlay */}
        {activeChallenge && (
          <ShareModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            challenge={activeChallenge}
            currencySymbol={getCurrencySymbol()}
            onToast={addToast}
          />
        )}

        {/* Authentication Setup Modal Overlay */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onToast={addToast}
          onSyncLocalData={handleOnboardingSync}
        />

        {/* Interactive PIX & Cash Deposit Modal */}
        {selectedSquareForDeposit && (
          <DepositModal
            isOpen={selectedSquareForDeposit !== null}
            onClose={() => setSelectedSquareForDeposit(null)}
            square={selectedSquareForDeposit.square}
            index={selectedSquareForDeposit.index}
            onConfirmDeposit={handleConfirmDeposit}
            currencySymbol={getCurrencySymbol()}
            accentColor={settings.accentColor}
            initialMethod={selectedSquareForDeposit.initialMethod}
          />
        )}

        {/* Interactive Pix Withdrawal / Redemption Modal */}
        {isRedeemOpen && activeChallenge && (
          <RedeemModal
            isOpen={isRedeemOpen}
            onClose={() => setIsRedeemOpen(false)}
            activeChallenge={activeChallenge}
            totalSaved={activeChallenge.squares.reduce((sum, s) => sum + s.saved, 0)}
            onConfirmRedeem={handleConfirmRedeem}
            currencySymbol={getCurrencySymbol()}
            accentColor={settings.accentColor}
          />
        )}
      </main>

      {/* Styled Printable rules */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          header, footer, nav, button {
            display: none !important;
          }
          main {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .grid {
            gap: 6px !important;
            display: grid !important;
            grid-template-columns: repeat(8, minmax(0, 1fr)) !important;
          }
          .relative.group {
            background-color: #f5f5f5 !important;
            border: 1px solid #ccc !important;
            color: black !important;
            aspect-ratio: 1 !important;
          }
        }
      `}</style>
      {/* Main App Confirm Dialog */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
