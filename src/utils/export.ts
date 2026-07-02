import { Challenge, HistoryEntry } from '../types';

/**
 * Downloads a text/JSON file to the user's device
 */
export function exportToJSON(challenge: Challenge) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(challenge, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  
  const dateStr = new Date(challenge.createdAt).toISOString().split('T')[0];
  downloadAnchor.setAttribute('download', `desafio-cofre-${challenge.targetGoal}-${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Exports challenge data (squares & simple status) to CSV
 */
export function exportToCSV(challenge: Challenge) {
  let csvContent = '\uFEFF'; // Add BOM for Excel UTF-8 display
  csvContent += 'Quadrado;Valor Alvo (R$);Valor Economizado (R$);Status;Porcentagem\n';
  
  challenge.squares.forEach((square, idx) => {
    const percent = ((square.saved / square.value) * 100).toFixed(1);
    const status = square.isCompleted ? 'Concluído' : square.saved > 0 ? 'Parcial' : 'Pendente';
    csvContent += `#${idx + 1};${square.value.toFixed(2)};${square.saved.toFixed(2)};${status};${percent}%\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', url);
  downloadAnchor.setAttribute('download', `desafio-${challenge.title.toLowerCase().replace(/\s+/g, '-')}-squares.csv`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Exports complete challenge and transaction ledger to Excel format (custom styled CSV)
 */
export function exportToExcel(challenge: Challenge, history: HistoryEntry[]) {
  let csvContent = '\uFEFF'; // UTF-8 BOM
  csvContent += `RELATÓRIO DE ECONOMIA PREMIUM - ${challenge.title.toUpperCase()}\n`;
  csvContent += `Meta Total;R$ ${challenge.targetGoal.toFixed(2)}\n`;
  csvContent += `Iniciado em;${new Date(challenge.createdAt).toLocaleDateString('pt-BR')}\n`;
  csvContent += `Progresso;${((challenge.squares.reduce((sum, s) => sum + s.saved, 0) / challenge.targetGoal) * 100).toFixed(1)}%\n\n`;
  
  csvContent += '--- RESUMO DOS QUADRADOS ---\n';
  csvContent += 'Quadrado;Valor Alvo;Valor Economizado;Status;Progresso\n';
  challenge.squares.forEach((square, idx) => {
    const status = square.isCompleted ? 'CONCLUÍDO' : square.saved > 0 ? 'PARCIAL' : 'PENDENTE';
    csvContent += `Quadrado #${idx + 1};R$ ${square.value.toFixed(2)};R$ ${square.saved.toFixed(2)};${status};${((square.saved / square.value) * 100).toFixed(0)}%\n`;
  });

  csvContent += '\n--- HISTÓRICO DE MOVIMENTAÇÕES ---\n';
  csvContent += 'Data;Hora;Tipo;Descrição;Valor Adicionado\n';
  
  const relatedHistory = history.filter(h => h.challengeId === challenge.id);
  relatedHistory.forEach((h) => {
    const date = new Date(h.date);
    const typeLabel = h.type === 'completion' ? 'Conclusão' : h.type === 'partial' ? 'Depósito Parcial' : h.type === 'manual_add' ? 'Adição Manual' : 'Ajuste';
    csvContent += `${date.toLocaleDateString('pt-BR')};${date.toLocaleTimeString('pt-BR')};${typeLabel};"${h.description.replace(/"/g, '""')}";R$ ${h.value.toFixed(2)}\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', url);
  downloadAnchor.setAttribute('download', `relatorio-${challenge.title.toLowerCase().replace(/\s+/g, '-')}.csv`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Renders the challenge to a canvas and triggers a PNG download
 */
export function exportToPNG(challenge: Challenge) {
  const squares = challenge.squares;
  const totalSaved = squares.reduce((sum, s) => sum + s.saved, 0);
  const percentage = challenge.targetGoal > 0 ? (totalSaved / challenge.targetGoal) * 100 : 0;
  
  // Grid layout config
  const cols = Math.min(10, Math.ceil(Math.sqrt(squares.length)));
  const rows = Math.ceil(squares.length / cols);
  
  const squareSize = 75;
  const padding = 12;
  const topHeaderHeight = 220;
  const bottomFooterHeight = 60;
  
  const width = cols * (squareSize + padding) + padding * 2;
  const height = topHeaderHeight + rows * (squareSize + padding) + padding * 2 + bottomFooterHeight;
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // 1. Draw Background
  ctx.fillStyle = '#0D0D0D';
  ctx.fillRect(0, 0, width, height);
  
  // 2. Draw Decorative Accent Lines (Petrol / Emerald)
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, '#047857'); // emerald
  gradient.addColorStop(0.5, '#06b6d4'); // cyan
  gradient.addColorStop(1, '#d97706'); // golden
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, 6);
  
  // 3. Draw Header
  // Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 26px "Space Grotesk", Arial, sans-serif';
  ctx.fillText('DESAFIO DO COFRE', padding * 2, 45);
  
  // Subtitle
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '14px "Inter", Arial, sans-serif';
  ctx.fillText(`Desafio iniciado em: ${new Date(challenge.createdAt).toLocaleDateString('pt-BR')}`, padding * 2, 68);
  
  // Statistics Panel
  ctx.fillStyle = '#171717';
  ctx.strokeStyle = '#262626';
  ctx.lineWidth = 1;
  
  const statBoxY = 85;
  const statBoxWidth = width - padding * 4;
  const statBoxHeight = 80;
  
  // Draw stat box background
  ctx.beginPath();
  ctx.roundRect?.(padding * 2, statBoxY, statBoxWidth, statBoxHeight, 8);
  ctx.fill();
  ctx.stroke();
  
  // Stat values
  ctx.fillStyle = '#10B981'; // Emerald
  ctx.font = 'bold 18px "JetBrains Mono", monospace';
  ctx.fillText(`R$ ${totalSaved.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, padding * 3, statBoxY + 35);
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '11px "Inter", sans-serif';
  ctx.fillText('ECONOMIZADO', padding * 3, statBoxY + 55);
  
  ctx.fillStyle = '#E5E7EB';
  ctx.font = 'bold 18px "JetBrains Mono", monospace';
  ctx.fillText(`R$ ${challenge.targetGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, padding * 3 + statBoxWidth / 3, statBoxY + 35);
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '11px "Inter", sans-serif';
  ctx.fillText('META TOTAL', padding * 3 + statBoxWidth / 3, statBoxY + 55);
  
  ctx.fillStyle = '#F59E0B'; // Golden
  ctx.font = 'bold 18px "JetBrains Mono", monospace';
  ctx.fillText(`${percentage.toFixed(1)}%`, padding * 3 + (statBoxWidth / 3) * 2, statBoxY + 35);
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '11px "Inter", sans-serif';
  ctx.fillText('CONCLUÍDO', padding * 3 + (statBoxWidth / 3) * 2, statBoxY + 55);
  
  // Progress Bar inside stat box
  const pBarY = statBoxY + 65;
  const pBarW = statBoxWidth - padding * 2;
  const pBarH = 6;
  ctx.fillStyle = '#262626';
  ctx.beginPath();
  ctx.roundRect?.(padding * 3, pBarY, pBarW, pBarH, 3);
  ctx.fill();
  
  ctx.fillStyle = '#10B981';
  ctx.beginPath();
  ctx.roundRect?.(padding * 3, pBarY, Math.max(0, pBarW * (percentage / 100)), pBarH, 3);
  ctx.fill();
  
  // 4. Draw Squares Grid
  squares.forEach((square, index) => {
    const colIdx = index % cols;
    const rowIdx = Math.floor(index / cols);
    
    const sX = padding * 2 + colIdx * (squareSize + padding);
    const sY = topHeaderHeight + rowIdx * (squareSize + padding);
    
    // Draw square card
    if (square.isCompleted || square.saved >= square.value) {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.15)'; // Emerald transparent
      ctx.strokeStyle = '#10B981'; // Emerald solid
    } else if (square.saved > 0) {
      ctx.fillStyle = 'rgba(6, 182, 212, 0.1)'; // Cyan transparent
      ctx.strokeStyle = '#06B6D4'; // Cyan solid
    } else {
      ctx.fillStyle = '#171717'; // Neutral dark
      ctx.strokeStyle = '#262626'; // Border gray
    }
    
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect?.(sX, sY, squareSize, squareSize, 8);
    ctx.fill();
    ctx.stroke();
    
    // Square label index (top-left tiny)
    ctx.fillStyle = '#525252';
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.fillText(`#${index + 1}`, sX + 6, sY + 14);
    
    // Square value text (middle)
    ctx.fillStyle = square.isCompleted ? '#10B981' : square.saved > 0 ? '#06B6D4' : '#E5E7EB';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    
    const displayVal = `R$ ${square.value.toFixed(0)}`;
    ctx.fillText(displayVal, sX + squareSize / 2, sY + squareSize / 2 + 3);
    
    // Square status text or checkmark (bottom)
    ctx.textAlign = 'center';
    if (square.isCompleted) {
      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 10px "Inter", sans-serif';
      ctx.fillText('✔ CONCLUÍDO', sX + squareSize / 2, sY + squareSize - 10);
    } else if (square.saved > 0) {
      ctx.fillStyle = '#06B6D4';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText(`${square.saved.toFixed(0)}/${square.value.toFixed(0)}`, sX + squareSize / 2, sY + squareSize - 10);
    } else {
      ctx.fillStyle = '#737373';
      ctx.font = '9px "Inter", sans-serif';
      ctx.fillText('Pendente', sX + squareSize / 2, sY + squareSize - 10);
    }
    
    ctx.textAlign = 'left'; // Reset alignment
  });
  
  // 5. Draw Footer
  ctx.fillStyle = '#525252';
  ctx.font = '11px "Inter", sans-serif';
  ctx.fillText('Desafio do Cofre Premium - Organize suas finanças de forma elegante', padding * 2, height - bottomFooterHeight / 2 + 5);
  
  // Trigger download
  try {
    const pngUrl = canvas.toDataURL('image/png');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', pngUrl);
    downloadAnchor.setAttribute('download', `desafio-cofre-${challenge.targetGoal}.png`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  } catch (error) {
    console.error('Error generating image:', error);
  }
}
