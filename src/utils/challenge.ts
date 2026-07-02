import { Challenge, Square } from '../types';

export function generateChallengeSquares(
  targetGoal: number,
  count: number,
  minValue: number,
  maxValue: number
): number[] {
  if (count <= 0) return [];

  let min = Math.max(0.01, minValue);
  let max = Math.max(min, maxValue);

  // Safeguards to make sure boundaries are solvable
  if (min * count > targetGoal) {
    min = Number((targetGoal / count).toFixed(2));
    max = min;
  }
  if (max * count < targetGoal) {
    max = Number((targetGoal / count).toFixed(2));
    min = max;
  }

  // Initialize all to min
  let values = Array(count).fill(min);
  let currentSum = min * count;
  let remaining = targetGoal - currentSum;

  if (remaining > 0) {
    // Distribute remaining amount in sensible steps
    const steps = [500, 200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.1, 0.01];

    let attempts = 0;
    while (Math.abs(remaining) > 0.001 && attempts < count * 100) {
      attempts++;
      const idx = Math.floor(Math.random() * count);
      const val = values[idx];
      if (val >= max) continue;

      const maxInc = max - val;
      const allowedInc = Math.min(maxInc, remaining);

      if (allowedInc <= 0) continue;

      let inc = allowedInc;
      for (const step of steps) {
        if (step <= allowedInc && val + step <= max) {
          inc = step;
          break;
        }
      }

      if (remaining < 1 || attempts > count * 30) {
        inc = remaining;
      }

      values[idx] = Number((val + inc).toFixed(2));
      remaining = Number((remaining - inc).toFixed(2));
    }
  }

  // Final adjustment to ensure exact sum matching down to 2 decimals
  const finalSum = values.reduce((s, v) => s + v, 0);
  const diff = Number((targetGoal - finalSum).toFixed(2));
  if (Math.abs(diff) > 0) {
    for (let i = 0; i < count; i++) {
      const newVal = Number((values[i] + diff).toFixed(2));
      if (newVal >= min && newVal <= max) {
        values[i] = newVal;
        break;
      }
    }
  }

  // Shuffle the values
  return values.sort(() => Math.random() - 0.5);
}

export function createNewChallenge(
  title: string,
  targetGoal: number,
  squareCount: number,
  minValue: number,
  maxValue: number,
  category: Challenge['category'] = 'custom',
  deadline?: string,
  manualValues?: number[]
): Challenge {
  let values: number[];

  if (manualValues && manualValues.length === squareCount) {
    values = [...manualValues];
  } else {
    values = generateChallengeSquares(targetGoal, squareCount, minValue, maxValue);
  }

  const squares: Square[] = values.map((val, idx) => ({
    id: `square-${Math.random().toString(36).substr(2, 9)}`,
    value: val,
    saved: 0,
    isCompleted: false,
    position: idx,
  }));

  return {
    id: `challenge-${Math.random().toString(36).substr(2, 9)}`,
    title: title || 'Desafio do Cofre',
    targetGoal,
    createdAt: new Date().toISOString(),
    deadline: deadline || undefined,
    squares,
    isArchived: false,
    category,
  };
}

export const CATEGORIES = [
  { id: 'emergency', name: 'Reserva de Emergência', icon: 'ShieldAlert' },
  { id: 'travel', name: 'Viagem / Férias', icon: 'Plane' },
  { id: 'car', name: 'Carro Novo', icon: 'Car' },
  { id: 'home', name: 'Casa / Apartamento', icon: 'Home' },
  { id: 'education', name: 'Estudos / Faculdade', icon: 'GraduationCap' },
  { id: 'marriage', name: 'Casamento', icon: 'Heart' },
  { id: 'device', name: 'Celular / Tech', icon: 'Smartphone' },
  { id: 'custom', name: 'Objetivo Personalizado', icon: 'Sparkles' },
] as const;

export const PRESETS = [
  { name: 'Bronze', goal: 1000, squares: 50, min: 5, max: 35, category: 'emergency' as const },
  { name: 'Prata', goal: 3000, squares: 100, min: 10, max: 50, category: 'travel' as const },
  { name: 'Ouro', goal: 5000, squares: 100, min: 10, max: 90, category: 'car' as const },
  { name: 'Platina', goal: 10000, squares: 120, min: 20, max: 150, category: 'home' as const },
  { name: 'Diamante', goal: 20000, squares: 150, min: 20, max: 250, category: 'custom' as const },
];
