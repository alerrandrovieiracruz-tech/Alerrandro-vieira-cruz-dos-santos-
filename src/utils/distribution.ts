import { Square, HistoryEntry } from '../types';

interface DistributionResult {
  updatedSquares: Square[];
  addedHistory: Omit<HistoryEntry, 'id' | 'date'>[];
}

/**
 * Distributes an arbitrary savings amount across squares.
 * Priority:
 * 1. Partially completed squares (closest to completion first)
 * 2. Unstarted squares (to complete them or start partial deposits)
 */
export function distributeArbitraryValue(
  squares: Square[],
  depositAmount: number
): DistributionResult {
  // Deep clone squares to avoid mutation
  const updatedSquares: Square[] = squares.map((s) => ({ ...s }));
  const addedHistory: Omit<HistoryEntry, 'id' | 'date'>[] = [];
  
  let remainingAmount = Number(depositAmount.toFixed(2));
  if (remainingAmount <= 0) {
    return { updatedSquares, addedHistory };
  }

  // 1. Target partially completed squares first
  // Sort by remaining value needed to complete (ascending, so we complete fast)
  const partials = updatedSquares
    .filter((s) => s.saved > 0 && s.saved < s.value)
    .sort((a, b) => (a.value - a.saved) - (b.value - b.saved));

  for (const square of partials) {
    if (remainingAmount <= 0) break;

    const needed = Number((square.value - square.saved).toFixed(2));
    const toAdd = Math.min(needed, remainingAmount);

    square.saved = Number((square.saved + toAdd).toFixed(2));
    remainingAmount = Number((remainingAmount - toAdd).toFixed(2));

    if (Math.abs(square.saved - square.value) < 0.01) {
      square.isCompleted = true;
      square.saved = square.value; // lock
      addedHistory.push({
        value: toAdd,
        type: 'completion',
        description: `Quadrado #${square.position + 1} de R$ ${square.value} concluído via depósito inteligente de R$ ${depositAmount}!`,
        squareIndex: square.position + 1,
      });
    } else {
      addedHistory.push({
        value: toAdd,
        type: 'partial',
        description: `Adicionado R$ ${toAdd} ao quadrado #${square.position + 1} (Progresso: R$ ${square.saved}/${square.value})`,
        squareIndex: square.position + 1,
      });
    }
  }

  // 2. Target unstarted squares
  if (remainingAmount > 0) {
    // Sort unstarted squares by value (ascending, so we complete more squares)
    const unstarted = updatedSquares
      .filter((s) => s.saved === 0)
      .sort((a, b) => a.value - b.value);

    for (const square of unstarted) {
      if (remainingAmount <= 0) break;

      const needed = square.value;
      const toAdd = Math.min(needed, remainingAmount);

      square.saved = Number((square.saved + toAdd).toFixed(2));
      remainingAmount = Number((remainingAmount - toAdd).toFixed(2));

      if (Math.abs(square.saved - square.value) < 0.01) {
        square.isCompleted = true;
        square.saved = square.value;
        addedHistory.push({
          value: toAdd,
          type: 'completion',
          description: `Quadrado #${square.position + 1} de R$ ${square.value} concluído via depósito inteligente de R$ ${depositAmount}!`,
          squareIndex: square.position + 1,
        });
      } else {
        addedHistory.push({
          value: toAdd,
          type: 'partial',
          description: `Iniciado depósito de R$ ${toAdd} no quadrado #${square.position + 1} (Meta: R$ ${square.value})`,
          squareIndex: square.position + 1,
        });
      }
    }
  }

  // 3. If there is still remainingAmount (all squares are completed!)
  if (remainingAmount > 0) {
    // We can distribute it as surplus to the first square or save it.
    // Let's log it in history as extra surplus
    addedHistory.push({
      value: remainingAmount,
      type: 'manual_add',
      description: `Depósito extra de R$ ${remainingAmount} adicionado ao cofre (todos os quadrados já estão completos!)`,
    });
  }

  return { updatedSquares, addedHistory };
}
