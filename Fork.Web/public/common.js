const SVG_NS = 'http://www.w3.org/2000/svg';

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
      }
      poly.setAttribute('class', classes.join(' '));
      boardSvg.appendChild(poly);
    }
  }

  for (const p of placements) {
    const { x, y } = cellToPixel(p.row, p.col);
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', HEX_SIZE * 0.7);
    circle.setAttribute('class', `placement-marker p${p.player}`);
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
  }
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
    phase = 'done';
  } else if (picksLeft > 0) {
    phase = 'drafting';
  } else {
    turnIndex++;
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    picksLeft = turnIndex === 1 ? 2 : 1;
    phase = 'drafting';
  }

  updateStatus();
  renderBoard();
}

function updateStatus() {
  document.body.dataset.phase = phase;
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
let currentPlayer = 1;
let picksLeft = 1;
let pickedCount = 0;
let pendingKnight = null; // { a, b, player, card }
const tally = { 1: 0, 2: 0 };
const placements = []; // { a, b, player, row, col }
const usedStarts = new Set();
