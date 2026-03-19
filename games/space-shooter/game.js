const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreValue = document.getElementById("scoreValue");
const highScoreValue = document.getElementById("highScoreValue");
const levelValue = document.getElementById("levelValue");
const hullValue = document.getElementById("hullValue");
const weaponValue = document.getElementById("weaponValue");
const statusValue = document.getElementById("statusValue");
const restartButton = document.getElementById("restartButton");
const controlButtons = document.querySelectorAll("[data-action]");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const HIGH_SCORE_KEY = "labib_space_shooter_high_score";

const shipImage = new Image();
shipImage.src = "../assets/spaceship.png";

const asteroidImage = new Image();
asteroidImage.src = "../assets/asteroid.png";

const keyActions = {
  ArrowLeft: "left",
  ArrowRight: "right",
  a: "left",
  d: "right",
};

const activeActions = new Set();

const player = {
  size: 52,
  speed: 5.2,
  hullMax: 3,
  hull: 3,
  x: 0,
  y: HEIGHT - 74,
};

const bulletWidth = 5;
const bulletHeight = 14;
const baseBulletSpeed = 8.2;
const baseShootCooldownMs = 180;
const rapidShootCooldownMs = 90;

const rapidFirePickup = {
  active: false,
  size: 28,
  x: 0,
  y: 0,
  speed: 0,
  pulse: 0,
};

const stars = Array.from({ length: 80 }, () => ({
  x: Math.random() * WIDTH,
  y: Math.random() * HEIGHT,
  size: 1 + Math.random() * 2.2,
  speed: 0.35 + Math.random() * 1.1,
  alpha: 0.25 + Math.random() * 0.55,
}));

let bullets = [];
let asteroids = [];
let particles = [];
let score = 0;
let level = 1;
let gameOver = false;
let lastShotAt = 0;
let highScore = 0;
let rapidFireTimer = 0;
let invulnerabilityTimer = 0;
let pickupSpawnTimer = 0;

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const asteroidSpeedBonus = () => (level - 1) * 0.28;
const desiredAsteroidCount = () => Math.min(9, 5 + Math.floor((level - 1) / 2));
const currentShootCooldown = () => (rapidFireTimer > 0 ? rapidShootCooldownMs : baseShootCooldownMs);

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

const resetAsteroid = (asteroid) => {
  asteroid.size = randomInt(34, 54);
  asteroid.x = randomInt(0, WIDTH - asteroid.size);
  asteroid.y = randomInt(-260, -40);
  asteroid.speed = 1.8 + Math.random() * 2.1 + asteroidSpeedBonus();
  asteroid.rotation = Math.random() * Math.PI * 2;
  asteroid.spin = (0.01 + Math.random() * 0.04) * (Math.random() < 0.5 ? -1 : 1);
};

const makeAsteroid = () => {
  const asteroid = {
    x: 0,
    y: 0,
    size: 44,
    speed: 0,
    rotation: 0,
    spin: 0,
  };
  resetAsteroid(asteroid);
  return asteroid;
};

const syncAsteroids = () => {
  const needed = desiredAsteroidCount();
  while (asteroids.length < needed) {
    asteroids.push(makeAsteroid());
  }
  while (asteroids.length > needed) {
    asteroids.pop();
  }
};

const spawnParticleBurst = (x, y, color, count) => {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.1 + Math.random() * 2.8;
    particles.push({
      x,
      y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      radius: 1.8 + Math.random() * 2.8,
      life: 18 + Math.random() * 16,
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
      dy: particle.dy + 0.015,
      radius: Math.max(0, particle.radius - 0.02),
      life: particle.life - 1,
    }))
    .filter((particle) => particle.life > 0 && particle.radius > 0.2);
};

const drawParticles = () => {
  particles.forEach((particle) => {
    ctx.globalAlpha = Math.min(1, particle.life / 24);
    ctx.beginPath();
    ctx.fillStyle = particle.color;
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
};

const spawnRapidFirePickup = () => {
  rapidFirePickup.active = true;
  rapidFirePickup.x = randomInt(40, WIDTH - rapidFirePickup.size - 40);
  rapidFirePickup.y = randomInt(-180, -60);
  rapidFirePickup.speed = 1.8 + Math.random() * 0.8;
  rapidFirePickup.pulse = 0;
};

const updateStars = () => {
  stars.forEach((star) => {
    star.y += star.speed + level * 0.08;
    if (star.y > HEIGHT + star.size) {
      star.y = -star.size;
      star.x = Math.random() * WIDTH;
    }
  });
};

const resetGame = () => {
  player.x = WIDTH / 2 - player.size / 2;
  player.y = HEIGHT - player.size - 14;
  player.hull = player.hullMax;
  bullets = [];
  particles = [];
  asteroids = Array.from({ length: 5 }, makeAsteroid);
  rapidFirePickup.active = false;
  score = 0;
  level = 1;
  gameOver = false;
  lastShotAt = 0;
  rapidFireTimer = 0;
  invulnerabilityTimer = 0;
  pickupSpawnTimer = 420;
  updateHud();
};

const tryShoot = () => {
  if (gameOver) {
    return;
  }

  const now = performance.now();
  if (now - lastShotAt < currentShootCooldown()) {
    return;
  }

  lastShotAt = now;
  if (rapidFireTimer > 0) {
    bullets.push({
      x: player.x + 12,
      y: player.y - 4,
      dx: -0.18,
      speed: baseBulletSpeed + 0.8,
    });
    bullets.push({
      x: player.x + player.size - 12,
      y: player.y - 4,
      dx: 0.18,
      speed: baseBulletSpeed + 0.8,
    });
    return;
  }

  bullets.push({
    x: player.x + player.size / 2 - bulletWidth / 2,
    y: player.y - 4,
    dx: 0,
    speed: baseBulletSpeed,
  });
};

const collides = (ax, ay, aw, ah, bx, by, bw, bh) =>
  ax < bx + bw &&
  ax + aw > bx &&
  ay < by + bh &&
  ay + ah > by;

const updateHud = () => {
  scoreValue.textContent = String(score);
  highScoreValue.textContent = String(highScore);
  levelValue.textContent = String(level);
  hullValue.textContent = `${player.hull} / ${player.hullMax}`;
  weaponValue.textContent = rapidFireTimer > 0 ? `Rapid ${(rapidFireTimer / 60).toFixed(1)}s` : "Standard";

  if (gameOver) {
    statusValue.textContent = "Destroyed";
  } else if (invulnerabilityTimer > 0) {
    statusValue.textContent = "Recovering";
  } else if (rapidFireTimer > 0) {
    statusValue.textContent = "Powered Up";
  } else {
    statusValue.textContent = "Running";
  }
};

const drawBackground = () => {
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, "#050d18");
  gradient.addColorStop(0.55, "#081925");
  gradient.addColorStop(1, "#0b2231");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  stars.forEach((star) => {
    ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
    ctx.fillRect(star.x, star.y, star.size, star.size);
  });
};

const drawPlayer = () => {
  if (invulnerabilityTimer > 0 && Math.floor(invulnerabilityTimer / 6) % 2 === 0) {
    ctx.globalAlpha = 0.45;
  }

  ctx.fillStyle = "rgba(84, 200, 255, 0.25)";
  ctx.beginPath();
  ctx.ellipse(player.x + player.size / 2, player.y + player.size + 6, 12, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  if (shipImage.complete && shipImage.naturalWidth > 0) {
    ctx.drawImage(shipImage, player.x, player.y, player.size, player.size);
    ctx.globalAlpha = 1;
    return;
  }

  ctx.fillStyle = "#54c8ff";
  ctx.beginPath();
  ctx.moveTo(player.x + player.size / 2, player.y);
  ctx.lineTo(player.x, player.y + player.size);
  ctx.lineTo(player.x + player.size, player.y + player.size);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
};

const drawBullets = () => {
  bullets.forEach((bullet) => {
    ctx.fillStyle = rapidFireTimer > 0 ? "#6af2e8" : "#ffd857";
    ctx.shadowColor = rapidFireTimer > 0 ? "rgba(106, 242, 232, 0.8)" : "rgba(255, 216, 87, 0.8)";
    ctx.shadowBlur = 10;
    ctx.fillRect(bullet.x, bullet.y, bulletWidth, bulletHeight);
  });
  ctx.shadowBlur = 0;
};

const drawAsteroids = () => {
  asteroids.forEach((asteroid) => {
    ctx.save();
    ctx.translate(asteroid.x + asteroid.size / 2, asteroid.y + asteroid.size / 2);
    ctx.rotate(asteroid.rotation);

    if (asteroidImage.complete && asteroidImage.naturalWidth > 0) {
      ctx.drawImage(
        asteroidImage,
        -asteroid.size / 2,
        -asteroid.size / 2,
        asteroid.size,
        asteroid.size
      );
      ctx.restore();
      return;
    }

    ctx.fillStyle = "#dd5d5d";
    ctx.fillRect(-asteroid.size / 2, -asteroid.size / 2, asteroid.size, asteroid.size);
    ctx.restore();
  });
};

const drawPickup = () => {
  if (!rapidFirePickup.active) {
    return;
  }

  rapidFirePickup.pulse += 0.08;
  const centerX = rapidFirePickup.x + rapidFirePickup.size / 2;
  const centerY = rapidFirePickup.y + rapidFirePickup.size / 2;
  const sizeOffset = Math.sin(rapidFirePickup.pulse) * 2;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = "#6af2e8";
  ctx.fillRect(
    -(rapidFirePickup.size / 2 + sizeOffset),
    -(rapidFirePickup.size / 2 + sizeOffset),
    rapidFirePickup.size + sizeOffset * 2,
    rapidFirePickup.size + sizeOffset * 2
  );
  ctx.restore();

  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, rapidFirePickup.size / 2 + 8 + sizeOffset, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#0b2231";
  ctx.font = "800 14px Space Grotesk";
  ctx.textAlign = "center";
  ctx.fillText("RF", centerX, centerY + 5);
};

const drawOverlay = () => {
  if (!gameOver) {
    return;
  }

  ctx.fillStyle = "rgba(3, 10, 15, 0.72)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "#eef7fb";
  ctx.textAlign = "center";
  ctx.font = "700 34px Space Grotesk";
  ctx.fillText("Game Over", WIDTH / 2, HEIGHT / 2 - 20);
  ctx.font = "600 18px Manrope";
  ctx.fillText(`Final Score: ${score}`, WIDTH / 2, HEIGHT / 2 + 14);
  ctx.fillText(`High Score: ${highScore}`, WIDTH / 2, HEIGHT / 2 + 42);
  ctx.fillText("Press Enter or Restart to play again", WIDTH / 2, HEIGHT / 2 + 74);
};

const update = () => {
  updateStars();
  updateParticles();

  if (gameOver) {
    updateHud();
    return;
  }

  level = 1 + Math.floor(score / 5);
  syncAsteroids();

  if (activeActions.has("left")) {
    player.x -= player.speed;
  }
  if (activeActions.has("right")) {
    player.x += player.speed;
  }
  if (activeActions.has("shoot")) {
    tryShoot();
  }
  player.x = Math.max(0, Math.min(WIDTH - player.size, player.x));

  if (rapidFireTimer > 0) {
    rapidFireTimer -= 1;
  } else {
    pickupSpawnTimer -= 1;
    if (!rapidFirePickup.active && pickupSpawnTimer <= 0 && score >= 4) {
      spawnRapidFirePickup();
      pickupSpawnTimer = Math.max(320, 700 - level * 35);
    }
  }

  if (invulnerabilityTimer > 0) {
    invulnerabilityTimer -= 1;
  }

  bullets = bullets
    .map((bullet) => ({
      ...bullet,
      x: bullet.x + bullet.dx,
      y: bullet.y - bullet.speed,
    }))
    .filter((bullet) => bullet.y + bulletHeight > 0 && bullet.x + bulletWidth > 0 && bullet.x < WIDTH);

  if (rapidFirePickup.active) {
    rapidFirePickup.y += rapidFirePickup.speed;
    if (rapidFirePickup.y > HEIGHT + rapidFirePickup.size) {
      rapidFirePickup.active = false;
    }

    if (
      collides(
        player.x,
        player.y,
        player.size,
        player.size,
        rapidFirePickup.x,
        rapidFirePickup.y,
        rapidFirePickup.size,
        rapidFirePickup.size
      )
    ) {
      rapidFirePickup.active = false;
      rapidFireTimer = 360;
      spawnParticleBurst(
        rapidFirePickup.x + rapidFirePickup.size / 2,
        rapidFirePickup.y + rapidFirePickup.size / 2,
        "#6af2e8",
        18
      );
    }
  }

  asteroids.forEach((asteroid) => {
    asteroid.y += asteroid.speed;
    asteroid.rotation += asteroid.spin;
    if (asteroid.y > HEIGHT + asteroid.size) {
      resetAsteroid(asteroid);
    }
  });

  const remainingBullets = [];
  bullets.forEach((bullet) => {
    let hitTarget = false;

    asteroids.forEach((asteroid) => {
      if (hitTarget) {
        return;
      }

      if (
        collides(
          bullet.x,
          bullet.y,
          bulletWidth,
          bulletHeight,
          asteroid.x,
          asteroid.y,
          asteroid.size,
          asteroid.size
        )
      ) {
        hitTarget = true;
        resetAsteroid(asteroid);
        score += 1;
        highScore = Math.max(highScore, score);
        saveHighScore();
        spawnParticleBurst(
          asteroid.x + asteroid.size / 2,
          asteroid.y + asteroid.size / 2,
          "#ffae61",
          16
        );
      }
    });

    if (!hitTarget) {
      remainingBullets.push(bullet);
    }
  });

  bullets = remainingBullets;

  asteroids.forEach((asteroid) => {
    if (
      invulnerabilityTimer === 0 &&
      collides(
        player.x,
        player.y,
        player.size,
        player.size,
        asteroid.x,
        asteroid.y,
        asteroid.size,
        asteroid.size
      )
    ) {
      player.hull -= 1;
      resetAsteroid(asteroid);
      spawnParticleBurst(
        player.x + player.size / 2,
        player.y + player.size / 2,
        "#ff6f7a",
        22
      );

      if (player.hull <= 0) {
        player.hull = 0;
        gameOver = true;
        highScore = Math.max(highScore, score);
        saveHighScore();
      } else {
        invulnerabilityTimer = 90;
      }
    }
  });

  updateHud();
};

const draw = () => {
  drawBackground();
  drawPlayer();
  drawBullets();
  drawAsteroids();
  drawPickup();
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

  if (event.code === "Space") {
    event.preventDefault();
    setActionState("shoot", true);
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

  if (event.code === "Space") {
    setActionState("shoot", false);
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

window.addEventListener("blur", () => {
  activeActions.clear();
  controlButtons.forEach((button) => button.classList.remove("active"));
});

highScore = loadHighScore();
resetGame();
loop();
