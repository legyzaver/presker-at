(function () {
  // ---------- Setup ----------
  const COLS = 20, ROWS = 16, CELL = 32;
  const START_DELAY_MS = 2000;
  const DATA = window.SL_WORDS || { words: [], weights: {}, gloss: {} };
  const WORD_SET = new Set(DATA.words);
  const GLOSS = DATA.gloss || {};

  const letterChars = Object.keys(DATA.weights || {});
  const letterWeights = letterChars.map((c) => DATA.weights[c]);
  const totalWeight = letterWeights.reduce((a, b) => a + b, 0) || 1;

  function randomLetter() {
    if (!letterChars.length) return "a";
    let r = Math.random() * totalWeight;
    for (let i = 0; i < letterChars.length; i++) {
      r -= letterWeights[i];
      if (r <= 0) return letterChars[i];
    }
    return letterChars[letterChars.length - 1];
  }

  function uiLang() {
    try { return (window.PreskerI18n && window.PreskerI18n.getResolved()) || "en"; }
    catch (e) { return "en"; }
  }
  function t(key) {
    const table = window.PRESKER_I18N || {};
    const dict = table[uiLang()] || {};
    const fallback = table.en || {};
    return dict[key] != null ? dict[key] : (fallback[key] || "");
  }

  const OFFSETS = [
    { r: 1, c: 0 },  // 0: vertical, B below A
    { r: 0, c: 1 },  // 1: horizontal, B right of A
    { r: -1, c: 0 }, // 2: vertical, B above A
    { r: 0, c: -1 }, // 3: horizontal, B left of A
  ];

  const canvas = document.getElementById("board-canvas");
  const ctx = canvas.getContext("2d");
  const nextCanvas = document.getElementById("next-canvas");
  const nextCtx = nextCanvas.getContext("2d");

  const scoreEl = document.getElementById("score-value");
  const levelEl = document.getElementById("level-value");
  const wordLogEl = document.getElementById("word-log");
  const toastLayer = document.getElementById("toast-layer");

  const startOverlay = document.getElementById("start-overlay");
  const pauseOverlay = document.getElementById("pause-overlay");
  const gameoverOverlay = document.getElementById("gameover-overlay");
  const finalScoreEl = document.getElementById("final-score");

  // ---------- Theme-aware colors (re-read each frame; cheap, always correct) ----------
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  // ---------- Game state ----------
  let board, piece, nextLetters, score, level, dropInterval, chainMult;
  let phase = "idle"; // idle | falling | resolving | over
  let paused = false;
  let dropTimerId = null;
  let gameId = 0;

  function newBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  function resetGame() {
    gameId++;
    board = newBoard();
    score = 0;
    level = 1;
    dropInterval = 1800;
    chainMult = 1;
    paused = false;
    nextLetters = [randomLetter(), randomLetter()];
    wordLogEl.innerHTML = "";
    updateHud();
    phase = "falling";
    spawnPiece();
    // Give the player a moment to look at the board before gravity starts -
    // this is a word puzzle, not a reflex game.
    const myGameId = gameId;
    setTimeout(() => {
      if (gameId === myGameId && phase === "falling") startDropTimer();
    }, START_DELAY_MS);
  }

  function updateHud() {
    scoreEl.textContent = score.toLocaleString();
    levelEl.textContent = String(level);
  }

  // ---------- Piece control ----------
  function spawnPiece() {
    const ac = Math.floor(COLS / 2) - 1;
    piece = {
      ar: 0,
      ac,
      orientation: 0,
      ach: nextLetters[0],
      bch: nextLetters[1],
    };
    nextLetters = [randomLetter(), randomLetter()];
    drawNextPreview();

    if (!canPlace(piece.ar, piece.ac, piece.orientation)) {
      gameOver();
    }
  }

  function cellsOfPiece(p) {
    const off = OFFSETS[p.orientation];
    return [
      { r: p.ar, c: p.ac, ch: p.ach },
      { r: p.ar + off.r, c: p.ac + off.c, ch: p.bch },
    ];
  }

  function inBounds(r, c) {
    return r >= 0 && r < ROWS && c >= 0 && c < COLS;
  }

  function canPlace(ar, ac, orientation) {
    const off = OFFSETS[orientation];
    const br = ar + off.r, bc = ac + off.c;
    if (!inBounds(ar, ac) || !inBounds(br, bc)) return false;
    if (board[ar][ac] || board[br][bc]) return false;
    return true;
  }

  function movePiece(dr, dc) {
    if (phase !== "falling" || paused) return;
    const nar = piece.ar + dr, nac = piece.ac + dc;
    if (canPlace(nar, nac, piece.orientation)) {
      piece.ar = nar;
      piece.ac = nac;
      return true;
    }
    if (dr > 0) {
      lockPiece();
    }
    return false;
  }

  function rotatePiece() {
    if (phase !== "falling" || paused) return;
    const newOrientation = (piece.orientation + 1) % 4;
    const kicks = [0, -1, 1, -1, 1]; // try in place, then small horizontal kicks
    for (const dc of kicks) {
      if (canPlace(piece.ar, piece.ac + dc, newOrientation)) {
        piece.ac += dc;
        piece.orientation = newOrientation;
        return;
      }
    }
  }

  function hardDrop() {
    if (phase !== "falling" || paused) return;
    while (canPlace(piece.ar + 1, piece.ac, piece.orientation)) {
      piece.ar += 1;
    }
    lockPiece();
  }

  function lockPiece() {
    stopDropTimer();
    for (const cell of cellsOfPiece(piece)) {
      board[cell.r][cell.c] = cell.ch;
    }
    phase = "resolving";
    chainMult = 1;
    const myGameId = gameId;
    setTimeout(() => resolveStep(myGameId), 80);
  }

  // ---------- Matching ----------
  function findMatchesInLine(cells) {
    const candidates = [];
    let i = 0;
    while (i < cells.length) {
      if (!cells[i].ch) { i++; continue; }
      let j = i;
      while (j < cells.length && cells[j].ch) j++;
      const runLen = j - i;
      if (runLen >= 3) {
        let str = "";
        for (let k = i; k < j; k++) str += cells[k].ch;
        for (let start = 0; start < runLen; start++) {
          for (let end = start + 2; end < runLen; end++) {
            const len = end - start + 1;
            const sub = str.slice(start, end + 1);
            if (WORD_SET.has(sub)) {
              candidates.push({ start: i + start, end: i + end, len, word: sub });
            }
          }
        }
      }
      i = j;
    }
    candidates.sort((a, b) => b.len - a.len);
    const used = new Array(cells.length).fill(false);
    const accepted = [];
    for (const cand of candidates) {
      let ok = true;
      for (let k = cand.start; k <= cand.end; k++) if (used[k]) { ok = false; break; }
      if (!ok) continue;
      for (let k = cand.start; k <= cand.end; k++) used[k] = true;
      accepted.push(cand);
    }
    return accepted.map((cand) => ({
      cells: cells.slice(cand.start, cand.end + 1).map((c) => ({ r: c.r, c: c.c })),
      word: cand.word,
      score: cand.len * (cand.len - 1) * 10,
    }));
  }

  function findAllMatches() {
    const matches = [];
    for (let r = 0; r < ROWS; r++) {
      const cells = [];
      for (let c = 0; c < COLS; c++) cells.push({ r, c, ch: board[r][c] });
      matches.push(...findMatchesInLine(cells));
    }
    for (let c = 0; c < COLS; c++) {
      const cells = [];
      for (let r = 0; r < ROWS; r++) cells.push({ r, c, ch: board[r][c] });
      matches.push(...findMatchesInLine(cells));
    }
    return matches;
  }

  let highlightCells = [];

  function resolveStep(myGameId) {
    if (myGameId !== gameId) return;
    const matches = findAllMatches();
    if (matches.length === 0) {
      highlightCells = [];
      phase = "falling";
      spawnPiece();
      if (phase !== "over") startDropTimer();
      return;
    }

    highlightCells = matches.flatMap((m) => m.cells);
    let gained = 0;
    for (const m of matches) {
      gained += m.score * chainMult;
      logWord(m.word, m.score * chainMult);
      showToast(m.word, m.score * chainMult);
    }
    score += gained;
    updateHud();

    setTimeout(() => {
      if (myGameId !== gameId) return;
      for (const m of matches) {
        for (const cell of m.cells) board[cell.r][cell.c] = null;
      }
      highlightCells = [];
      applyGravity();
      chainMult += 1;
      maybeLevelUp();
      setTimeout(() => resolveStep(myGameId), 120);
    }, 320);
  }

  function applyGravity() {
    for (let c = 0; c < COLS; c++) {
      const stack = [];
      for (let r = 0; r < ROWS; r++) {
        if (board[r][c]) stack.push(board[r][c]);
      }
      for (let r = ROWS - 1, k = stack.length - 1; r >= 0; r--, k--) {
        board[r][c] = k >= 0 ? stack[k] : null;
      }
    }
  }

  function maybeLevelUp() {
    const targetLevel = 1 + Math.floor(score / 500);
    if (targetLevel > level) {
      level = targetLevel;
      dropInterval = Math.max(500, 1800 - (level - 1) * 80);
      updateHud();
    }
  }

  function logWord(word, pts) {
    const gloss = GLOSS[word] || "?";
    const entry = document.createElement("div");
    entry.className = "entry";
    entry.innerHTML = `<span class="w">${word}</span> <span class="g">(${gloss})</span><span class="pts">+${pts}</span>`;
    wordLogEl.prepend(entry);
    while (wordLogEl.children.length > 30) wordLogEl.removeChild(wordLogEl.lastChild);
  }

  function showToast(word, pts) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = `${word.toUpperCase()} +${pts}`;
    toastLayer.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }

  // ---------- Drop timer ----------
  function startDropTimer() {
    stopDropTimer();
    dropTimerId = setInterval(() => {
      if (paused || phase !== "falling") return;
      movePiece(1, 0);
    }, dropInterval);
  }
  function stopDropTimer() {
    if (dropTimerId) clearInterval(dropTimerId);
    dropTimerId = null;
  }

  function gameOver() {
    phase = "over";
    stopDropTimer();
    finalScoreEl.textContent = t("bsFinalScore") + score.toLocaleString();
    gameoverOverlay.classList.remove("hidden");
  }

  // ---------- Rendering ----------
  function drawTile(c2d, x, y, size, ch, fill, textColor) {
    const pad = 2;
    c2d.fillStyle = fill;
    roundRect(c2d, x + pad, y + pad, size - pad * 2, size - pad * 2, 6);
    c2d.fill();
    c2d.fillStyle = textColor;
    c2d.font = `bold ${Math.floor(size * 0.5)}px ui-sans-serif, Segoe UI, Arial, sans-serif`;
    c2d.textAlign = "center";
    c2d.textBaseline = "middle";
    c2d.fillText(ch.toUpperCase(), x + size / 2, y + size / 2 + 1);
  }

  function roundRect(c2d, x, y, w, h, r) {
    c2d.beginPath();
    c2d.moveTo(x + r, y);
    c2d.arcTo(x + w, y, x + w, y + h, r);
    c2d.arcTo(x + w, y + h, x, y + h, r);
    c2d.arcTo(x, y + h, x, y, r);
    c2d.arcTo(x, y, x + w, y, r);
    c2d.closePath();
  }

  function render() {
    const tileBg = cssVar("--tile-bg") || "#1c1c1c";
    const tileActive = cssVar("--tile-active") || "#b8f57a";
    const tileActiveInk = cssVar("--tile-active-ink") || "#0e0e0e";
    const tileHighlight = cssVar("--tile-highlight") || "#f5c84a";
    const tileText = cssVar("--tile-text") || "#e8e8e8";
    const tileBorder = cssVar("--tile-border") || "rgba(255,255,255,0.08)";

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = tileBorder;
    ctx.globalAlpha = 0.5;
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * CELL);
      ctx.lineTo(COLS * CELL, r * CELL);
      ctx.stroke();
    }
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * CELL, 0);
      ctx.lineTo(c * CELL, ROWS * CELL);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    const highlightSet = new Set(highlightCells.map((c) => c.r + "," + c.c));

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const ch = board[r][c];
        if (!ch) continue;
        const isHighlight = highlightSet.has(r + "," + c);
        drawTile(ctx, c * CELL, r * CELL, CELL, ch, isHighlight ? tileHighlight : tileBg, isHighlight ? "#1c1b18" : tileText);
      }
    }

    if (phase === "falling" && piece) {
      for (const cell of cellsOfPiece(piece)) {
        drawTile(ctx, cell.c * CELL, cell.r * CELL, CELL, cell.ch, tileActive, tileActiveInk);
      }
    }

    requestAnimationFrame(render);
  }

  function drawNextPreview() {
    const tileActive = cssVar("--tile-active") || "#b8f57a";
    const tileActiveInk = cssVar("--tile-active-ink") || "#0e0e0e";
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    const size = 32;
    const x = (nextCanvas.width - size) / 2;
    const y1 = (nextCanvas.height - size * 2) / 2;
    drawTile(nextCtx, x, y1, size, nextLetters[0], tileActive, tileActiveInk);
    drawTile(nextCtx, x, y1 + size, size, nextLetters[1], tileActive, tileActiveInk);
  }

  // ---------- Input ----------
  document.addEventListener("keydown", (e) => {
    if (phase === "idle" || phase === "over") return;
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        movePiece(0, -1);
        break;
      case "ArrowRight":
        e.preventDefault();
        movePiece(0, 1);
        break;
      case "ArrowDown":
        e.preventDefault();
        movePiece(1, 0);
        break;
      case "ArrowUp":
      case "x":
      case "X":
        e.preventDefault();
        rotatePiece();
        break;
      case " ":
        e.preventDefault();
        hardDrop();
        break;
      case "p":
      case "P":
        e.preventDefault();
        togglePause();
        break;
    }
  });

  // ---------- Touch controls (swipe) ----------
  // Only the canvas itself gets these listeners: the start/pause/game-over
  // overlays sit on top of it in the DOM and intercept taps whenever they're
  // visible, so a swipe here only ever happens mid-game.
  (function setupTouch() {
    const SWIPE_THRESHOLD = 24; // px - shorter than this is a tap, not a swipe
    let touchStartX = 0;
    let touchStartY = 0;
    let tracking = false;

    canvas.addEventListener("touchstart", (e) => {
      if (phase !== "falling" || paused) return;
      const t = e.changedTouches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
      tracking = true;
    }, { passive: true });

    canvas.addEventListener("touchend", (e) => {
      if (!tracking) return;
      tracking = false;
      if (phase !== "falling" || paused) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);
      if (Math.max(adx, ady) < SWIPE_THRESHOLD) return; // too short - ignore

      if (adx > ady) {
        movePiece(0, dx > 0 ? 1 : -1); // swipe right / left
      } else if (dy < 0) {
        rotatePiece(); // swipe up
      } else {
        movePiece(1, 0); // swipe down - soft drop
      }
    }, { passive: true });

    canvas.addEventListener("touchcancel", () => { tracking = false; }, { passive: true });
  })();

  function togglePause() {
    if (phase === "idle" || phase === "over") return;
    paused = !paused;
    pauseOverlay.classList.toggle("hidden", !paused);
  }

  // ---------- Buttons ----------
  document.getElementById("start-btn").addEventListener("click", () => {
    startOverlay.classList.add("hidden");
    gameoverOverlay.classList.add("hidden");
    resetGame();
  });
  document.getElementById("resume-btn").addEventListener("click", togglePause);
  document.getElementById("pause-btn").addEventListener("click", togglePause);
  document.getElementById("restart-btn").addEventListener("click", () => {
    gameoverOverlay.classList.add("hidden");
    resetGame();
  });
  document.getElementById("restart-btn-2").addEventListener("click", () => {
    if (phase === "idle") return;
    gameoverOverlay.classList.add("hidden");
    pauseOverlay.classList.add("hidden");
    resetGame();
  });

  board = newBoard();
  requestAnimationFrame(render);
})();
