const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

const GRID_SIZE = 20;
const CELL = canvas.width / GRID_SIZE;
const BASE_SPEED_MS = 95;
const MIN_SPEED_MS = 68;

const scoreEl = document.getElementById("score");
const highscoreEl = document.getElementById("highscore");
const startOverlay = document.getElementById("startOverlay");
const gameOverOverlay = document.getElementById("gameOverOverlay");
const pauseOverlay = document.getElementById("pauseOverlay");
const finalScoreEl = document.getElementById("finalScore");
const rankNoteEl = document.getElementById("rankNote");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const playerNameInput = document.getElementById("playerName");
const leaderboardList = document.getElementById("leaderboardList");

const LEADERBOARD_API = "api";
playerNameInput.value = localStorage.getItem("hiperroll_snake_name") || "";

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

function renderLeaderboard(entries) {
  leaderboardList.innerHTML = "";
  if (!entries || entries.length === 0) {
    leaderboardList.innerHTML = '<li class="leaderboard-empty">Seja o primeiro a pontuar!</li>';
    return;
  }
  entries.forEach((entry, i) => {
    const li = document.createElement("li");
    if (i < 3) li.classList.add(`rank-${i + 1}`);
    const rankLabel = RANK_MEDALS[i] || `${i + 1}º`;
    li.innerHTML = `
      <span class="leaderboard-rank">${rankLabel}</span>
      <span class="leaderboard-name"></span>
      <span class="leaderboard-score">${entry.score}</span>
    `;
    li.querySelector(".leaderboard-name").textContent = entry.name;
    leaderboardList.appendChild(li);
  });
}

async function fetchLeaderboard() {
  try {
    const res = await fetch(`${LEADERBOARD_API}/leaderboard.php`);
    const data = await res.json();
    if (data.ok) renderLeaderboard(data.leaderboard);
  } catch (err) {
    leaderboardList.innerHTML = '<li class="leaderboard-empty">Placar indisponível</li>';
  }
}

async function submitScore(name, finalScore) {
  try {
    const res = await fetch(`${LEADERBOARD_API}/submit_score.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, score: finalScore }),
    });
    const data = await res.json();
    if (data.ok) {
      renderLeaderboard(data.leaderboard);
      const madeTop5 = data.leaderboard.some(
        (e) => e.name.toLowerCase() === name.toLowerCase() && e.score === finalScore
      );
      if (madeTop5 && finalScore > 0) {
        rankNoteEl.textContent = "🏆 Você entrou no Top 5!";
        rankNoteEl.classList.remove("hidden");
      }
    }
  } catch (err) {
    // sem conexão com o placar — segue o jogo normalmente
  }
}

fetchLeaderboard();

const logo = new Image();
let logoLoaded = false;
logo.onload = () => { logoLoaded = true; };
logo.src = "assets/Novo-Logotipo-HiperRoll.png";

const boardWrap = document.querySelector(".board-wrap");
const BOB_ROLL_PROBE_COUNT = 12;
const BOB_ROLL_MAX_SIZE = 480;
const BOB_ROLL_WHITE_THRESHOLD = 232;
const bobRollSprites = [];

function cutOutWhiteBackground(img) {
  const scale = Math.min(1, BOB_ROLL_MAX_SIZE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const octx = off.getContext("2d");
  octx.drawImage(img, 0, 0, w, h);

  let imgData;
  try {
    imgData = octx.getImageData(0, 0, w, h);
  } catch (err) {
    console.warn("Não foi possível recortar o fundo (provável restrição de segurança ao abrir via file://). Sirva o jogo por um servidor local ou hospedado para o recorte automático funcionar. Usando a foto original.", err);
    return off;
  }
  const data = imgData.data;
  const visited = new Uint8Array(w * h);
  const stack = [];

  const isWhite = (p) => {
    const i = p * 4;
    return data[i] >= BOB_ROLL_WHITE_THRESHOLD && data[i + 1] >= BOB_ROLL_WHITE_THRESHOLD && data[i + 2] >= BOB_ROLL_WHITE_THRESHOLD;
  };
  const seed = (p) => {
    if (!visited[p] && isWhite(p)) {
      visited[p] = 1;
      stack.push(p);
    }
  };

  for (let x = 0; x < w; x++) {
    seed(x);
    seed((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    seed(y * w);
    seed(y * w + (w - 1));
  }

  while (stack.length) {
    const p = stack.pop();
    data[p * 4 + 3] = 0;
    const x = p % w;
    const y = (p / w) | 0;
    if (x > 0) seed(p - 1);
    if (x < w - 1) seed(p + 1);
    if (y > 0) seed(p - w);
    if (y < h - 1) seed(p + w);
  }

  octx.putImageData(imgData, 0, 0);
  return off;
}

for (let i = 1; i <= BOB_ROLL_PROBE_COUNT; i++) {
  const img = new Image();
  img.onload = () => { bobRollSprites.push(cutOutWhiteBackground(img)); };
  img.onerror = () => {};
  img.src = `assets/bob-roll/bob-roll-${i}.jpg`;
}

const muteBtn = document.getElementById("muteBtn");
let muted = localStorage.getItem("hiperroll_snake_muted") === "1";
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playTone(freq, duration, type, delay, gainValue) {
  if (muted) return;
  const ac = getAudioCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(ac.destination);
  const t = ac.currentTime + delay;
  gain.gain.setValueAtTime(gainValue, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.start(t);
  osc.stop(t + duration);
}

function playEatSound() {
  playTone(660, 0.07, "square", 0, 0.14);
  playTone(990, 0.09, "square", 0.06, 0.14);
}

function playGameOverSound() {
  playTone(220, 0.15, "sawtooth", 0, 0.15);
  playTone(180, 0.15, "sawtooth", 0.13, 0.15);
  playTone(110, 0.3, "sawtooth", 0.26, 0.15);
}

function playStartSound() {
  playTone(440, 0.07, "square", 0, 0.1);
  playTone(660, 0.09, "square", 0.07, 0.1);
}

function playBobRollSound() {
  playTone(523, 0.09, "triangle", 0, 0.16);
  playTone(659, 0.09, "triangle", 0.08, 0.16);
  playTone(784, 0.09, "triangle", 0.16, 0.16);
  playTone(1046, 0.18, "triangle", 0.24, 0.18);
}

function updateMuteBtn() {
  muteBtn.textContent = muted ? "🔇" : "🔊";
}

muteBtn.addEventListener("click", () => {
  muted = !muted;
  localStorage.setItem("hiperroll_snake_muted", muted ? "1" : "0");
  updateMuteBtn();
  if (!muted) getAudioCtx();
});

updateMuteBtn();

const BOB_ROLL_SCORE_INTERVAL = 50;
const BOOST_DURATION_MS = 4000;
const BOOST_SPEED_FACTOR = 0.87;
const FLASH_DURATION_MS = 500;
const POPUP_DURATION_MS = 900;
const BONUS_LOGO_COUNT = 13;
const POINTS_PER_FOOD = 10;

let snake, direction, directionQueue, foods, score, highScore, running, paused, stepMs, lastStepTime, pulseT;
let boostActive, boostEndTime, flashStartTime, popup;
let bobRollCatches, scoreMultiplier, nextBobRollScore, progressScore;

highScore = Number(localStorage.getItem("hiperroll_snake_highscore") || 0);
highscoreEl.textContent = highScore;

function resetState() {
  const mid = Math.floor(GRID_SIZE / 2);
  snake = [
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid },
    { x: mid - 3, y: mid },
  ];
  direction = { x: 1, y: 0 };
  directionQueue = [];
  score = 0;
  stepMs = BASE_SPEED_MS;
  pulseT = 0;
  boostActive = false;
  boostEndTime = 0;
  flashStartTime = 0;
  popup = null;
  bobRollCatches = 0;
  scoreMultiplier = 1;
  progressScore = 0;
  nextBobRollScore = BOB_ROLL_SCORE_INTERVAL;
  boardWrap.classList.remove("boost");
  scoreEl.textContent = "0";
  placeFood(false);
}

function occupiedCells() {
  const cells = new Set(snake.map((s) => `${s.x},${s.y}`));
  foods.forEach((f) => cells.add(`${f.x},${f.y}`));
  return cells;
}

function randomFreeCell(occupied) {
  let pos;
  let attempts = 0;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    attempts++;
  } while (occupied.has(`${pos.x},${pos.y}`) && attempts < 200);
  return pos;
}

function placeFood(special) {
  foods = [];
  const pos = randomFreeCell(occupiedCells());
  if (special && bobRollSprites.length > 0) {
    pos.type = "bobroll";
    pos.sprite = bobRollSprites[Math.floor(Math.random() * bobRollSprites.length)];
  } else {
    pos.type = "logo";
  }
  foods.push(pos);
}

function spawnBonusLogos(count) {
  foods = [];
  const occupied = occupiedCells();
  for (let i = 0; i < count; i++) {
    const pos = randomFreeCell(occupied);
    occupied.add(`${pos.x},${pos.y}`);
    pos.type = "logo";
    pos.bonus = true;
    foods.push(pos);
  }
}

function startGoldenMode() {
  boostActive = true;
  boostEndTime = performance.now() + BOOST_DURATION_MS;
  flashStartTime = performance.now();
  popup = { text: `BOB ROLL! PONTOS x${scoreMultiplier}`, startTime: performance.now() };
  boardWrap.classList.add("boost");
  spawnBonusLogos(BONUS_LOGO_COUNT);
}

function endGoldenMode() {
  boostActive = false;
  scoreMultiplier = 1;
  boardWrap.classList.remove("boost");
  let special = false;
  while (progressScore >= nextBobRollScore) {
    special = true;
    nextBobRollScore += BOB_ROLL_SCORE_INTERVAL;
  }
  placeFood(special);
}

function setDirection(x, y) {
  const last = directionQueue.length > 0 ? directionQueue[directionQueue.length - 1] : direction;
  if (x === last.x && y === last.y) return;
  if (x === -last.x && y === -last.y) return;
  if (directionQueue.length >= 2) return;
  directionQueue.push({ x, y });
}

const keyMap = {
  ArrowUp: [0, -1], KeyW: [0, -1],
  ArrowDown: [0, 1], KeyS: [0, 1],
  ArrowLeft: [-1, 0], KeyA: [-1, 0],
  ArrowRight: [1, 0], KeyD: [1, 0],
};

window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && document.activeElement !== playerNameInput) {
    e.preventDefault();
    if (running) {
      togglePause();
    } else if (!gameOverOverlay.classList.contains("hidden")) {
      startGame();
    } else if (!startOverlay.classList.contains("hidden")) {
      attemptStart();
    }
    return;
  }
  const dir = keyMap[e.code];
  if (dir && running && !paused) {
    e.preventDefault();
    setDirection(dir[0], dir[1]);
  }
});

document.querySelectorAll(".touch-controls button").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (!running || paused) return;
    const dirs = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    const d = dirs[btn.dataset.dir];
    setDirection(d[0], d[1]);
  });
});

let touchStart = null;
canvas.addEventListener("touchstart", (e) => {
  const t = e.changedTouches[0];
  touchStart = { x: t.clientX, y: t.clientY };
}, { passive: true });

canvas.addEventListener("touchend", (e) => {
  if (!touchStart || !running || paused) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStart.x;
  const dy = t.clientY - touchStart.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (Math.abs(dx) > 20) setDirection(dx > 0 ? 1 : -1, 0);
  } else {
    if (Math.abs(dy) > 20) setDirection(0, dy > 0 ? 1 : -1);
  }
  touchStart = null;
}, { passive: true });

function togglePause() {
  paused = !paused;
  pauseOverlay.classList.toggle("hidden", !paused);
  if (!paused) requestAnimationFrame(loop);
}

let currentPlayerName = "";

function attemptStart() {
  const name = playerNameInput.value.trim();
  if (!name) {
    playerNameInput.classList.remove("input-error");
    void playerNameInput.offsetWidth;
    playerNameInput.classList.add("input-error");
    playerNameInput.focus();
    return;
  }
  currentPlayerName = name;
  localStorage.setItem("hiperroll_snake_name", name);
  startGame();
}

function startGame() {
  getAudioCtx();
  playStartSound();
  resetState();
  running = true;
  paused = false;
  startOverlay.classList.add("hidden");
  gameOverOverlay.classList.add("hidden");
  pauseOverlay.classList.add("hidden");
  rankNoteEl.classList.add("hidden");
  rankNoteEl.textContent = "";
  lastStepTime = performance.now();
  requestAnimationFrame(loop);
}

function endGame() {
  running = false;
  playGameOverSound();
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("hiperroll_snake_highscore", String(highScore));
    highscoreEl.textContent = highScore;
  }
  if (score > 0) submitScore(currentPlayerName, score);
  finalScoreEl.textContent = `Você fez ${score} ponto${score === 1 ? "" : "s"}`;
  gameOverOverlay.classList.remove("hidden");
}

function step() {
  if (directionQueue.length > 0) {
    direction = directionQueue.shift();
  }
  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  if (
    head.x < 0 || head.x >= GRID_SIZE ||
    head.y < 0 || head.y >= GRID_SIZE ||
    snake.some((s) => s.x === head.x && s.y === head.y)
  ) {
    endGame();
    return;
  }

  snake.unshift(head);

  const eatenIndex = foods.findIndex((f) => f.x === head.x && f.y === head.y);
  if (eatenIndex === -1) {
    snake.pop();
    return;
  }

  const eaten = foods[eatenIndex];
  foods.splice(eatenIndex, 1);

  if (eaten.type === "bobroll") {
    score += POINTS_PER_FOOD;
    progressScore += POINTS_PER_FOOD;
    bobRollCatches += 1;
    scoreMultiplier = bobRollCatches * 2;
    playBobRollSound();
    startGoldenMode();
  } else if (eaten.bonus) {
    score += POINTS_PER_FOOD * scoreMultiplier;
    playEatSound();
    if (foods.length === 0) endGoldenMode();
  } else {
    score += POINTS_PER_FOOD;
    progressScore += POINTS_PER_FOOD;
    playEatSound();
    let special = false;
    while (progressScore >= nextBobRollScore) {
      special = true;
      nextBobRollScore += BOB_ROLL_SCORE_INTERVAL;
    }
    placeFood(special);
  }

  scoreEl.textContent = String(score);
  stepMs = Math.max(MIN_SPEED_MS, BASE_SPEED_MS - Math.floor(score / 120) * 3);
}

function roundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawGrid() {
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? "#0d1230" : "#0a0e26";
      ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
    }
  }
}

function drawSnake() {
  snake.forEach((seg, i) => {
    const isHead = i === 0;
    const pad = isHead ? 1 : 2;
    const x = seg.x * CELL + pad;
    const y = seg.y * CELL + pad;
    const size = CELL - pad * 2;

    if (boostActive) {
      ctx.save();
      ctx.shadowColor = "rgba(255, 200, 40, 0.85)";
      ctx.shadowBlur = 14;
    }

    if (isHead) {
      const grad = ctx.createLinearGradient(x, y, x + size, y + size);
      if (boostActive) {
        grad.addColorStop(0, "#ffe066");
        grad.addColorStop(1, "#ffb020");
      } else {
        grad.addColorStop(0, "#ff4d5e");
        grad.addColorStop(1, "#e4102b");
      }
      ctx.fillStyle = grad;
    } else {
      const t = i / snake.length;
      const grad = ctx.createLinearGradient(x, y, x + size, y + size);
      if (boostActive) {
        grad.addColorStop(0, `rgba(255, 214, 91, ${1 - t * 0.35})`);
        grad.addColorStop(1, `rgba(255, 165, 32, ${1 - t * 0.35})`);
      } else {
        grad.addColorStop(0, `rgba(27, 37, 96, ${1 - t * 0.35})`);
        grad.addColorStop(1, `rgba(45, 60, 150, ${1 - t * 0.35})`);
      }
      ctx.fillStyle = grad;
    }
    roundedRect(x, y, size, size, isHead ? 8 : 6);
    ctx.fill();

    if (boostActive) ctx.restore();

    if (isHead) {
      ctx.fillStyle = "#fff";
      const eyeSize = CELL * 0.11;
      const ex1 = x + size * 0.28;
      const ex2 = x + size * 0.72;
      const ey = y + size * 0.32;
      ctx.beginPath();
      ctx.arc(ex1, ey, eyeSize, 0, Math.PI * 2);
      ctx.arc(ex2, ey, eyeSize, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawSingleFood(f) {
  const cx = f.x * CELL + CELL / 2;
  const cy = f.y * CELL + CELL / 2;

  if (f.type === "bobroll" && f.sprite) {
    const pulse = 1 + Math.sin(pulseT * 1.6) * 0.1;
    const size = CELL * 1.9 * pulse;
    ctx.save();
    ctx.shadowColor = "rgba(255, 200, 40, 0.85)";
    ctx.shadowBlur = 22;
    const ratio = f.sprite.width / f.sprite.height;
    let w = size, h = size / ratio;
    if (h > size) { h = size; w = size * ratio; }
    ctx.drawImage(f.sprite, cx - w / 2, cy - h / 2, w, h);
    ctx.restore();
    return;
  }

  const pulseSpeed = f.bonus ? 2.2 : 1;
  const pulse = 1 + Math.sin(pulseT * pulseSpeed) * 0.06;
  const size = CELL * (f.bonus ? 1.3 : 1.5) * pulse;

  ctx.save();
  ctx.shadowColor = f.bonus ? "rgba(255, 200, 40, 0.75)" : "rgba(228, 16, 43, 0.65)";
  ctx.shadowBlur = f.bonus ? 14 : 16;

  if (logoLoaded) {
    const ratio = logo.width / logo.height;
    let w = size, h = size / ratio;
    if (h > size) { h = size; w = size * ratio; }
    ctx.drawImage(logo, cx - w / 2, cy - h / 2, w, h);
  } else {
    ctx.fillStyle = "#e4102b";
    ctx.beginPath();
    ctx.arc(cx, cy, size / 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${CELL * 0.6}px Segoe UI`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("HR", cx, cy + 1);
  }
  ctx.restore();
}

function drawFood() {
  foods.forEach(drawSingleFood);
}

function drawGoldenBadge() {
  if (!boostActive) return;
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 15px Segoe UI";
  ctx.fillStyle = "#ffb020";
  ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
  ctx.shadowBlur = 5;
  ctx.fillText(`x${scoreMultiplier} · ${foods.length} restantes`, canvas.width / 2, canvas.height - 16);
  ctx.restore();
}

function drawFlash(now) {
  const elapsed = now - flashStartTime;
  if (elapsed < 0 || elapsed > FLASH_DURATION_MS) return;
  const alpha = 0.5 * (1 - elapsed / FLASH_DURATION_MS);
  ctx.save();
  const grad = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 0,
    canvas.width / 2, canvas.height / 2, canvas.width / 1.3
  );
  grad.addColorStop(0, `rgba(255, 220, 120, ${alpha})`);
  grad.addColorStop(1, "rgba(255, 220, 120, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

function drawPopup(now) {
  if (!popup) return;
  const elapsed = now - popup.startTime;
  if (elapsed > POPUP_DURATION_MS) { popup = null; return; }
  const t = elapsed / POPUP_DURATION_MS;
  const alpha = 1 - t;
  const y = canvas.height * 0.16 - t * 18;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 30px Segoe UI";
  ctx.fillStyle = "#ffb020";
  ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
  ctx.shadowBlur = 6;
  ctx.fillText(popup.text, canvas.width / 2, y);
  ctx.restore();
}

function render() {
  const now = performance.now();
  drawGrid();
  drawFood();
  drawSnake();
  drawFlash(now);
  drawPopup(now);
  drawGoldenBadge();
}

function loop(now) {
  if (!running || paused) return;
  pulseT += 0.12;

  if (boostActive && now >= boostEndTime) {
    endGoldenMode();
  }

  const effectiveStepMs = boostActive ? stepMs * BOOST_SPEED_FACTOR : stepMs;
  if (now - lastStepTime >= effectiveStepMs) {
    step();
    lastStepTime = now;
  }
  render();
  if (running) requestAnimationFrame(loop);
}

startBtn.addEventListener("click", attemptStart);
restartBtn.addEventListener("click", startGame);
playerNameInput.addEventListener("keydown", (e) => {
  if (e.code === "Enter") {
    e.preventDefault();
    attemptStart();
  }
});
playerNameInput.addEventListener("input", () => {
  playerNameInput.classList.remove("input-error");
});

resetState();
render();
