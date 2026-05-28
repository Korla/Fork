const SVG_NS = 'http://www.w3.org/2000/svg';

function knightTargets(a, b) {
  const c = -(a + b);
  const triple = [a, b, c];
  const permIdx = [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
  const set = new Set();
  for (const sign of [1, -1]) {
    for (const [i, j, k] of permIdx) {
      const q = sign * triple[i];
      const r = sign * triple[j];
      const s = sign * triple[k];
      if (q + r + s !== 0) continue;
      if (q === 0 && r === 0 && s === 0) continue;
      set.add(`${q},${r}`);
    }
  }
  return Array.from(set).map(s => s.split(',').map(Number));
}

function hexPoints(cx, cy, size) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI / 180 * (60 * i - 30);
    pts.push(`${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`);
  }
  return pts.join(' ');
}

function isValidCell(row, col) {
  if ((row + col) % 2 === 0) return false;
  const dr = row - HEX_CENTER_ROW;
  const dc = col - HEX_CENTER_COL;
  return Math.max(Math.abs(dr), (Math.abs(dr) + Math.abs(dc)) / 2) <= HEX_RADIUS;
}

function cellToPixel(row, col) {
  return {
    x: col * HEX_SIZE * Math.sqrt(3) / 2,
    y: row * HEX_SIZE * 1.5,
  };
}

function isStartingPosition(row, col, player) {
  const list = player === 1 ? P1_STARTS : P2_STARTS;
  return list.some(([r, c]) => r === row && c === col);
}

function offsetToCube(row, col) {
  const r = row - HEX_CENTER_ROW;
  const q = (col - HEX_CENTER_COL - r) / 2;
  return { q, r, s: -(q + r) };
}

function cubeToOffset(q, r) {
  const row = r + HEX_CENTER_ROW;
  const col = 2 * q + r + HEX_CENTER_COL;
  return { row, col };
}

function getLegalMoves(knight) {
  const targets = knightTargets(knight.a, knight.b);
  const moves = [];
  const startCube = offsetToCube(knight.row, knight.col);

  for (const [dq, dr] of targets) {
    const targetQ = startCube.q + dq;
    const targetR = startCube.r + dr;
    const { row: r, col: c } = cubeToOffset(targetQ, targetR);

    if (isValidCell(r, c)) {
      // Check if occupied by friendly knight
      const occupant = placements.find(p => p.row === r && p.col === c);
      if (!occupant || occupant.player !== knight.player) {
        moves.push([r, c]);
      }
    }
  }
  return moves;
}

function renderBoard() {
  const boardSvg = document.getElementById('board');
  if (!boardSvg) return;
  boardSvg.innerHTML = '';

  for (let r = 1; r <= ROWS; r++) {
    for (let c = COL_MIN; c <= COL_MAX; c++) {
      if (!isValidCell(r, c)) continue;
      const { x, y } = cellToPixel(r, c);
      const poly = document.createElementNS(SVG_NS, 'polygon');
      poly.setAttribute('points', hexPoints(x, y, HEX_SIZE));
      const classes = ['cell'];
      if (phase === 'placing' && pendingKnight
          && isStartingPosition(r, c, pendingKnight.player)
          && !usedStarts.has(`${r},${c}`)) {
        classes.push('available', `p${pendingKnight.player}-target`);
        poly.addEventListener('click', () => onCellClick(r, c));
      } else if (phase === 'playing' && selectedKnight !== null) {
        const knight = placements[selectedKnight];
        const moves = getLegalMoves(knight);
        if (moves.some(([mr, mc]) => mr === r && mc === c)) {
          classes.push('available', `p${knight.player}-target`);
          poly.addEventListener('click', () => onMoveClick(r, c));
        }
      }
      poly.setAttribute('class', classes.join(' '));
      boardSvg.appendChild(poly);
    }
  }

  placements.forEach((p, idx) => {
    const { x, y } = cellToPixel(p.row, p.col);
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', HEX_SIZE * 0.7);
    const classes = ['placement-marker', `p${p.player}`];
    if (phase === 'playing' && currentPlayer === p.player) {
      classes.push('selectable');
      if (selectedKnight === idx) classes.push('selected');
      circle.addEventListener('click', (e) => {
        e.stopPropagation();
        onKnightClick(idx);
      });
    }
    circle.setAttribute('class', classes.join(' '));
    boardSvg.appendChild(circle);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', x);
    text.setAttribute('y', y);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'central');
    text.setAttribute('font-size', HEX_SIZE * 0.5);
    text.setAttribute('class', 'placement-label');
    text.textContent = `${p.a},${p.b}`;
    boardSvg.appendChild(text);
  });
}

function onKnightClick(idx) {
  if (phase !== 'playing') return;
  if (placements[idx].player !== currentPlayer) return;
  selectedKnight = (selectedKnight === idx) ? null : idx;
  renderBoard();
}

function onMoveClick(row, col) {
  if (phase !== 'playing' || selectedKnight === null) return;
  const knight = placements[selectedKnight];
  const moves = getLegalMoves(knight);
  if (!moves.some(([mr, mc]) => mr === row && mc === col)) return;

  const opponentIdx = placements.findIndex(p => p.row === row && p.col === col);
  if (opponentIdx !== -1) {
    // Capture!
    placements.splice(opponentIdx, 1);
    phase = 'done';
    updateStatus();
  } else {
    knight.row = row;
    knight.col = col;
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    selectedKnight = null;
    updateStatus();
  }
  renderBoard();
}

function onCellClick(row, col) {
  if (phase !== 'placing' || !pendingKnight) return;
  if (!isStartingPosition(row, col, pendingKnight.player)) return;
  if (usedStarts.has(`${row},${col}`)) return;

  placements.push({
    a: pendingKnight.a,
    b: pendingKnight.b,
    player: pendingKnight.player,
    row, col,
  });
  usedStarts.add(`${row},${col}`);
  tally[pendingKnight.player]++;
  pickedCount++;
  picksLeft--;
  pendingKnight = null;

  if (pickedCount >= TOTAL) {
    phase = 'playing';
    currentPlayer = (firstPicker === 1) ? 2 : 1;
    selectedKnight = null;
  } else if (picksLeft > 0) {
    phase = 'drafting';
  } else {
    turnIndex++;
    if (turnIndex === 1) firstPicker = currentPlayer;
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    picksLeft = turnIndex === 1 ? 2 : 1;
    phase = 'drafting';
  }

  updateStatus();
  renderBoard();
}

function updateStatus() {
  document.body.dataset.phase = phase;
  const statusEl = document.getElementById('status-msg');
  if (statusEl) {
    if (phase === 'drafting') {
      statusEl.textContent = `Player ${currentPlayer}'s Draft (${picksLeft} left)`;
    } else if (phase === 'placing') {
      statusEl.textContent = `Player ${pendingKnight.player}, place your knight!`;
    } else if (phase === 'playing') {
      statusEl.textContent = `Player ${currentPlayer}'s Turn`;
    } else if (phase === 'done') {
      statusEl.textContent = `Game Over!`;
    }
  }
  const statusBar = document.getElementById('status-bar');
  if (statusBar) {
    statusBar.className = `status p${phase === 'placing' ? pendingKnight.player : currentPlayer}`;
    if (phase === 'done') statusBar.classList.add('done');
  }
  const p1Tally = document.getElementById('p1-tally');
  const p2Tally = document.getElementById('p2-tally');
  if (p1Tally) p1Tally.textContent = tally[1];
  if (p2Tally) p2Tally.textContent = tally[2];
}

// ---- Board geometry ----
const ROWS = 21;
const HEX_CENTER_ROW = 11;
const HEX_CENTER_COL = 7;
const HEX_RADIUS = 10;
const COL_MIN = HEX_CENTER_COL - 2 * HEX_RADIUS;
const COL_MAX = HEX_CENTER_COL + 2 * HEX_RADIUS;
const HEX_SIZE = 12;
const P1_STARTS = [[2,-1],[2,3],[2,7],[2,11],[2,15]];
const P2_STARTS = [[20,-1],[20,3],[20,7],[20,11],[20,15]];

// Shared State
const TOTAL = 10;
let phase = 'drafting'; // 'drafting' | 'placing' | 'done'
let turnIndex = 0;
let firstPicker = 1;
let currentPlayer = 1;
let picksLeft = 1;
let pickedCount = 0;
let pendingKnight = null; // { a, b, player, card }
let selectedKnight = null; // index into placements
const tally = { 1: 0, 2: 0 };
const placements = []; // { a, b, player, row, col }
const usedStarts = new Set();
