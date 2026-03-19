const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreValue = document.getElementById("scoreValue");
const highScoreValue = document.getElementById("highScoreValue");
const levelValue = document.getElementById("levelValue");
const shieldValue = document.getElementById("shieldValue");
const statusValue = document.getElementById("statusValue");
const restartButton = document.getElementById("restartButton");
const controlButtons = document.querySelectorAll("[data-action]");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const HIGH_SCORE_KEY = "labib_dodge_high_score";

const keyActions = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  a: "left",
  d: "right",
  w: "up",
  s: "down",
};

const activeActions = new Set();

const player = {
  size: 40,
  speed: 5,
  x: WIDTH / 2 - 20,
  y: HEIGHT - 50,
};

const coin = {
  size: 20,
  x: 0,
  y: 0,
};

const shieldPickup = {
  active: false,
  size: 24,
  x: 0,
  y: 0,
  pulse: 0,
};

let enemies = [];
let particles = [];
let score = 0;
let level = 1;
let frameCount = 0;
let shieldTimer = 0;
let shieldSpawnTimer = 0;
let gameOver = false;
let highScore = 0;

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const loadHighScore = () => {
  try {
    return Number(window.localStorage.getItem(HIGH_SCORE_KEY)) || 0;
  } catch {
    return 0;
  }
};
const saveHighScore = () => {
  try {
    window.localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
  } catch {
    // Ignore storage failures.
  }
};

const spawnParticleBurst = (x, y, color, count) => {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 2.8;
    particles.push({
      x,
      y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      radius: 2 + Math.random() * 3,
      life: 24 + Math.random() * 18,
      color,
    });
  }
};

const updateParticles = () => {
  particles = particles
    .map((particle) => ({
      ...particle,
      x: particle.x + particle.dx,
      y: particle.y + particle.dy,
      dy: particle.dy + 0.02,
      radius: Math.max(0, particle.radius - 0.03),
      life: particle.life - 1,
    }))
    .filter((particle) => particle.life > 0 && particle.radius > 0.2);
};

const drawParticles = () => {
  particles.forEach((particle) => {
    ctx.globalAlpha = Math.min(1, particle.life / 28);
    ctx.beginPath();
    ctx.fillStyle = particle.color;
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
};

const desiredEnemyCount = () => Math.min(9, 5 + Math.floor((level - 1) / 2));
const difficultySpeedBonus = () => (level - 1) * 0.35;

const resetCoin = () => {
  coin.x = randomInt(20, WIDTH - coin.size - 20);
  coin.y = randomInt(60, HEIGHT - 100);
};

const resetEnemy = (enemy, startAbove = true) => {
  enemy.size = 28 + randomInt(0, 8);
  enemy.x = randomInt(0, WIDTH - enemy.size);
  enemy.y = startAbove ? randomInt(-180, -20) : randomInt(-80, -20);
  enemy.speed = 2 + Math.random() * 2.2 + difficultySpeedBonus();
};

const makeEnemy = () => {
  const enemy = { x: 0, y: 0, size: 30, speed: 0 };
  resetEnemy(enemy);
  return enemy;
};

const syncEnemyCount = () => {
  const needed = desiredEnemyCount();
  while (enemies.length < needed) {
    enemies.push(makeEnemy());
  }
  while (enemies.length > needed) {
    enemies.pop();
  }
};

const spawnShieldPickup = () => {
  shieldPickup.active = true;
  shieldPickup.x = randomInt(30, WIDTH - shieldPickup.size - 30);
  shieldPickup.y = randomInt(70, HEIGHT - 120);
  shieldPickup.pulse = 0;
};

const resetGame = () => {
  player.x = WIDTH / 2 - player.size / 2;
  player.y = HEIGHT - player.size - 10;
  score = 0;
  level = 1;
  frameCount = 0;
  shieldTimer = 0;
  shieldSpawnTimer = 360;
  particles = [];
  shieldPickup.active = false;
  gameOver = false;
  enemies = Array.from({ length: 5 }, makeEnemy);
  resetCoin();
  updateHud();
};

const updateHud = () => {
  scoreValue.textContent = String(score);
  highScoreValue.textContent = String(highScore);
  levelValue.textContent = String(level);
  shieldValue.textContent = shieldTimer > 0 ? `${(shieldTimer / 60).toFixed(1)}s` : "Offline";

  if (gameOver) {
    statusValue.textContent = "Game Over";
  } else if (shieldTimer > 0) {
    statusValue.textContent = "Shielded";
  } else {
    statusValue.textContent = "Running";
  }
};

const clampPlayer = () => {
  player.x = Math.max(0, Math.min(WIDTH - player.size, player.x));
  player.y = Math.max(0, Math.min(HEIGHT - player.size, player.y));
};

const collides = (ax, ay, aw, ah, bx, by, bw, bh) =>
  ax < bx + bw &&
  ax + aw > bx &&
  ay < by + bh &&
  ay + ah > by;

const drawBackground = () => {
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, "#f8fbfd");
  gradient.addColorStop(1, "#dfeef4");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.strokeStyle = "rgba(18, 38, 58, 0.06)";
  for (let x = 0; x < WIDTH; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y < HEIGHT; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }
};

const drawPlayer = () => {
  ctx.fillStyle = "#1f6aa5";
  ctx.fillRect(player.x, player.y, player.size, player.size);
  ctx.fillStyle = "#dcefff";
  ctx.fillRect(player.x + 10, player.y + 10, 8, 8);
  ctx.fillRect(player.x + 22, player.y + 10, 8, 8);

  if (shieldTimer > 0) {
    ctx.beginPath();
    ctx.strokeStyle = "rgba(49, 199, 255, 0.85)";
    ctx.lineWidth = 4;
    ctx.arc(
      player.x + player.size / 2,
      player.y + player.size / 2,
      player.size * 0.72 + Math.sin(frameCount / 8) * 2,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }
};

const drawCoin = () => {
  ctx.beginPath();
  ctx.fillStyle = "#f3c64e";
  ctx.arc(coin.x + coin.size / 2, coin.y + coin.size / 2, coin.size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#c08f19";
  ctx.lineWidth = 3;
  ctx.stroke();
};

const drawShieldPickup = () => {
  if (!shieldPickup.active) {
    return;
  }

  shieldPickup.pulse += 0.08;
  const radius = shieldPickup.size / 2 + Math.sin(shieldPickup.pulse) * 2;
  const centerX = shieldPickup.x + shieldPickup.size / 2;
  const centerY = shieldPickup.y + shieldPickup.size / 2;

  ctx.beginPath();
  ctx.fillStyle = "#35c6ff";
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ecfbff";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 2;
  ctx.arc(centerX, centerY, radius + 5, 0, Math.PI * 2);
  ctx.stroke();
};

const drawEnemies = () => {
  enemies.forEach((enemy) => {
    ctx.fillStyle = "#d64f4f";
    ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(enemy.x + 6, enemy.y + 6, enemy.size - 12, 6);
  });
};

const drawOverlay = () => {
  if (!gameOver) {
    return;
  }

  ctx.fillStyle = "rgba(7, 16, 24, 0.72)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "#eef7fb";
  ctx.textAlign = "center";
  ctx.font = "700 34px Space Grotesk";
  ctx.fillText("Game Over", WIDTH / 2, HEIGHT / 2 - 20);
  ctx.font = "600 18px Manrope";
  ctx.fillText(`Final Score: ${score}`, WIDTH / 2, HEIGHT / 2 + 16);
  ctx.fillText(`High Score: ${highScore}`, WIDTH / 2, HEIGHT / 2 + 44);
  ctx.fillText("Press Enter or Restart to play again", WIDTH / 2, HEIGHT / 2 + 76);
};

const update = () => {
  if (gameOver) {
    updateParticles();
    updateHud();
    return;
  }

  frameCount += 1;
  level = 1 + Math.floor(score / 4);
  syncEnemyCount();

  if (activeActions.has("left")) {
    player.x -= player.speed;
  }
  if (activeActions.has("right")) {
    player.x += player.speed;
  }
  if (activeActions.has("up")) {
    player.y -= player.speed;
  }
  if (activeActions.has("down")) {
    player.y += player.speed;
  }

  clampPlayer();

  if (shieldTimer > 0) {
    shieldTimer -= 1;
  } else {
    shieldSpawnTimer -= 1;
    if (!shieldPickup.active && shieldSpawnTimer <= 0 && score >= 3) {
      spawnShieldPickup();
      shieldSpawnTimer = 600;
    }
  }

  enemies.forEach((enemy) => {
    enemy.y += enemy.speed + difficultySpeedBonus() * 0.2;
    if (enemy.y > HEIGHT) {
      resetEnemy(enemy, false);
    }

    if (
      collides(
        player.x,
        player.y,
        player.size,
        player.size,
        enemy.x,
        enemy.y,
        enemy.size,
        enemy.size
      )
    ) {
      if (shieldTimer > 0) {
        shieldTimer = 0;
        resetEnemy(enemy);
        spawnParticleBurst(
          enemy.x + enemy.size / 2,
          enemy.y + enemy.size / 2,
          "#38c8ff",
          18
        );
      } else {
        gameOver = true;
        highScore = Math.max(highScore, score);
        saveHighScore();
      }
    }
  });

  if (
    collides(
      player.x,
      player.y,
      player.size,
      player.size,
      coin.x,
      coin.y,
      coin.size,
      coin.size
    )
  ) {
    score += 1;
    highScore = Math.max(highScore, score);
    saveHighScore();
    spawnParticleBurst(coin.x + coin.size / 2, coin.y + coin.size / 2, "#f3c64e", 12);
    resetCoin();
  }

  if (
    shieldPickup.active &&
    collides(
      player.x,
      player.y,
      player.size,
      player.size,
      shieldPickup.x,
      shieldPickup.y,
      shieldPickup.size,
      shieldPickup.size
    )
  ) {
    shieldPickup.active = false;
    shieldTimer = 300;
    spawnParticleBurst(
      shieldPickup.x + shieldPickup.size / 2,
      shieldPickup.y + shieldPickup.size / 2,
      "#35c6ff",
      18
    );
  }

  updateParticles();
  updateHud();
};

const draw = () => {
  drawBackground();
  drawCoin();
  drawShieldPickup();
  drawEnemies();
  drawPlayer();
  drawParticles();
  drawOverlay();
};

const loop = () => {
  update();
  draw();
  window.requestAnimationFrame(loop);
};

const setActionState = (action, pressed) => {
  if (pressed) {
    activeActions.add(action);
  } else {
    activeActions.delete(action);
  }

  controlButtons.forEach((button) => {
    if (button.dataset.action === action) {
      button.classList.toggle("active", pressed);
    }
  });
};

document.addEventListener("keydown", (event) => {
  const action = keyActions[event.key];
  if (action) {
    event.preventDefault();
    setActionState(action, true);
  }

  if (event.key === "Enter" && gameOver) {
    resetGame();
  }
});

document.addEventListener("keyup", (event) => {
  const action = keyActions[event.key];
  if (action) {
    setActionState(action, false);
  }
});

controlButtons.forEach((button) => {
  const action = button.dataset.action;
  const press = (event) => {
    event.preventDefault();
    setActionState(action, true);
  };
  const release = (event) => {
    event.preventDefault();
    setActionState(action, false);
  };

  button.addEventListener("pointerdown", press);
  button.addEventListener("pointerup", release);
  button.addEventListener("pointerleave", release);
  button.addEventListener("pointercancel", release);
});

restartButton.addEventListener("click", resetGame);

highScore = loadHighScore();
resetGame();
loop();
