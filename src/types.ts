export interface Square {
  id: string;
  value: number; // Target amount for this square
  saved: number; // Amount saved so far (0 <= saved <= value)
  isCompleted: boolean; // true if saved === value
  position: number; // For drag and drop / ordering
}

export interface HistoryEntry {
  id: string;
  date: string; // ISO String
  value: number; // The amount deposited
  type: 'deposit' | 'partial' | 'manual_add' | 'edit' | 'completion' | 'withdrawal';
  description: string; // Message to display in history
  squareIndex?: number; // 1-based index of the square
  challengeId?: string; // Reference to the challenge
  challengeTitle?: string; // Title for history display
  notes?: string; // Optional user notes
}

export interface Challenge {
  id: string;
  title: string;
  targetGoal: number;
  createdAt: string; // ISO String
  deadline?: string; // Optional target date ISO String
  squares: Square[];
  isArchived: boolean;
  category: 'emergency' | 'travel' | 'car' | 'home' | 'education' | 'marriage' | 'device' | 'custom';
  isFavorite?: boolean;
  cols?: number;
  rows?: number;
}

export interface AppSettings {
  soundEnabled: boolean;
  language: 'pt' | 'en';
  currency: 'BRL' | 'USD' | 'EUR';
  accentColor: 'emerald' | 'blue' | 'gold' | 'violet' | 'amber';
  roundness: 'none' | 'md' | 'xl' | 'full';
  pinLockEnabled: boolean;
  pinCode: string; // 4-digit PIN
  isLocked: boolean;
  reminderFrequency: 'none' | 'daily' | 'weekly';
  // Extra Premium customization properties
  fullName?: string;
  pixKey?: string;
  themeBg?: 'matte-black' | 'soft-obsidian' | 'deep-navy' | 'space-dark' | 'forest-slate';
  squareSize?: 'sm' | 'md' | 'lg';
  squareFormat?: 'square' | 'circle' | 'rounded';
  borderStyle?: 'none' | 'thin' | 'thick';
  fontFamily?: 'inter' | 'grotesk' | 'mono' | 'playfair';
  sortOrder?: 'original' | 'asc' | 'desc' | 'random';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string; // ISO string if unlocked
  requirementType: 'total_saved' | 'completed_challenges' | 'streak_days' | 'deposit_count';
  requirementValue: number;
}

