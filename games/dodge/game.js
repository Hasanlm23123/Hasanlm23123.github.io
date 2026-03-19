const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreValue = document.getElementById("scoreValue");
const statusValue = document.getElementById("statusValue");
const restartButton = document.getElementById("restartButton");
const controlButtons = document.querySelectorAll("[data-action]");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

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
  x: WIDTH / 2,
  y: HEIGHT - 50,
};

const coin = {
  size: 20,
  x: 0,
  y: 0,
};

const enemySize = 30;
const enemyCount = 5;
let enemies = [];
let score = 0;
let gameOver = false;

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomSpeed = () => 2 + Math.random() * 3;

const resetCoin = () => {
  coin.x = randomInt(0, WIDTH - coin.size);
  coin.y = randomInt(50, HEIGHT - 100);
};

const resetEnemy = (enemy) => {
  enemy.x = randomInt(0, WIDTH - enemySize);
  enemy.y = randomInt(-100, -20);
  enemy.speed = randomSpeed();
};

const resetGame = () => {
  player.x = WIDTH / 2 - player.size / 2;
  player.y = HEIGHT - player.size - 10;
  score = 0;
  gameOver = false;
  enemies = Array.from({ length: enemyCount }, () => ({
    x: randomInt(0, WIDTH - enemySize),
    y: randomInt(-100, -20),
    speed: randomSpeed(),
  }));
  resetCoin();
  scoreValue.textContent = "0";
  statusValue.textContent = "Running";
};

const clampPlayer = () => {
  player.x = Math.max(0, Math.min(WIDTH - player.size, player.x));
  player.y = Math.max(0, Math.min(HEIGHT - player.size, player.y));
};

const collides = (a, b, aSize, bSize) =>
  Math.abs(a.x - b.x) < Math.max(aSize, bSize) - 5 &&
  Math.abs(a.y - b.y) < Math.max(aSize, bSize) - 5;

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

const drawEnemies = () => {
  enemies.forEach((enemy) => {
    ctx.fillStyle = "#d64f4f";
    ctx.fillRect(enemy.x, enemy.y, enemySize, enemySize);
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(enemy.x + 6, enemy.y + 6, enemySize - 12, 6);
  });
};

const drawOverlay = () => {
  if (!gameOver) {
    return;
  }

  ctx.fillStyle = "rgba(7, 16, 24, 0.7)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "#eef7fb";
  ctx.textAlign = "center";
  ctx.font = "700 34px Space Grotesk";
  ctx.fillText("Game Over", WIDTH / 2, HEIGHT / 2 - 10);
  ctx.font = "600 18px Manrope";
  ctx.fillText(`Final Score: ${score}`, WIDTH / 2, HEIGHT / 2 + 22);
  ctx.fillText("Press Enter or Restart to play again", WIDTH / 2, HEIGHT / 2 + 56);
};

const update = () => {
  if (gameOver) {
    return;
  }

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

  enemies.forEach((enemy) => {
    enemy.y += enemy.speed;
    if (enemy.y > HEIGHT) {
      resetEnemy(enemy);
    }

    if (collides(player, enemy, player.size, enemySize)) {
      gameOver = true;
      statusValue.textContent = "Game Over";
    }
  });

  if (
    Math.abs(player.x - coin.x) < player.size &&
    Math.abs(player.y - coin.y) < player.size
  ) {
    score += 1;
    scoreValue.textContent = String(score);
    resetCoin();
  }
};

const draw = () => {
  drawBackground();
  drawCoin();
  drawEnemies();
  drawPlayer();
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

resetGame();
loop();
