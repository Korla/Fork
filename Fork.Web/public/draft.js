function knightTargets(a, b) {
  const c = -(a + b);
  const triple = [a, b, c];
  const permIdx = [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
  const set = new Set();
  for (const sign of [1, -1]) {
    for (const [i, j, k] of permIdx) {
      const x = sign * triple[i];
      const y = sign * triple[j];
      const z = sign * triple[k];
      if (x === 0 && y === 0 && z === 0) continue;
      set.add(`${x},${z}`);
    }
  }
  return Array.from(set).map(s => s.split(',').map(Number));
}

function buildMiniSvg(a, b) {
  const svgEl = document.createElementNS(SVG_NS, 'svg');
  svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  const n = 8;
  const targets = knightTargets(a, b);
  const knightSet = new Set(targets.map(([q, r]) => `${q},${r}`));
  const sz = 10;
  const xs = [], ys = [];
  for (let q = -n; q <= n; q++) {
    for (let r = -n; r <= n; r++) {
      if (Math.abs(q + r) > n) continue;
      const x = sz * Math.sqrt(3) * (q + r / 2);
      const y = sz * 1.5 * r;
      xs.push(x); ys.push(y);
      const poly = document.createElementNS(SVG_NS, 'polygon');
      poly.setAttribute('points', hexPoints(x, y, sz));
      const key = `${q},${r}`;
      if (key === '0,0') poly.setAttribute('class', 'center');
      else if (knightSet.has(key)) poly.setAttribute('class', 'knight');
      svgEl.appendChild(poly);
    }
  }
  const dot = document.createElementNS(SVG_NS, 'circle');
  dot.setAttribute('cx', 0);
  dot.setAttribute('cy', 0);
  dot.setAttribute('r', sz * 0.5);
  dot.setAttribute('class', 'marker');
  svgEl.appendChild(dot);
  const minX = Math.min(...xs) - sz;
  const minY = Math.min(...ys) - sz;
  const w = Math.max(...xs) - minX + sz;
  const h = Math.max(...ys) - minY + sz;
  svgEl.setAttribute('viewBox', `${minX} ${minY} ${w} ${h}`);
  return svgEl;
}

function generateMoves(count) {
  const seen = new Set();
  const moves = [];
  let safety = 500;
  while (moves.length < count && safety-- > 0) {
    const a = 1 + Math.floor(Math.random() * 4);
    const b = 1 + Math.floor(Math.random() * 4);
    const key = [Math.min(a, b), Math.max(a, b)].join(',');
    if (seen.has(key)) continue;
    seen.add(key);
    moves.push({ a, b });
  }
  return moves;
}

function onCardClick(card, m) {
  if (phase !== 'drafting') return;
  if (card.classList.contains('p1') || card.classList.contains('p2')) return;

  card.classList.add(`p${currentPlayer}`);
  pendingKnight = { a: m.a, b: m.b, player: currentPlayer, card };
  phase = 'placing';
  updateStatus();
  renderBoard();
}

// ---- Init Cards ----
const cardsEl = document.getElementById('cards');
if (cardsEl) {
  const moves = generateMoves(TOTAL);

  moves.forEach(m => {
    const card = document.createElement('div');
    card.className = 'card';
    card.appendChild(buildMiniSvg(m.a, m.b));
    const label = document.createElement('div');
    label.className = 'label';
    label.textContent = `a=${m.a}, b=${m.b}`;
    card.appendChild(label);
    card.addEventListener('click', () => onCardClick(card, m));
    cardsEl.appendChild(card);
  });
}
