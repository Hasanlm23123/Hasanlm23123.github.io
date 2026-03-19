const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreValue = document.getElementById("scoreValue");
const statusValue = document.getElementById("statusValue");
const restartButton = document.getElementById("restartButton");
const controlButtons = document.querySelectorAll("[data-action]");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

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
  size: 50,
  speed: 5,
  x: 0,
  y: HEIGHT - 70,
};

const bulletWidth = 5;
const bulletHeight = 10;
const bulletSpeed = 7;
const asteroidSize = 40;
const asteroidCount = 5;
const shootCooldownMs = 180;

let bullets = [];
let asteroids = [];
let score = 0;
let gameOver = false;
let lastShotAt = 0;

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomSpeed = () => 2 + Math.random() * 3;

const resetAsteroid = (asteroid) => {
  asteroid.x = randomInt(0, WIDTH - asteroidSize);
  asteroid.y = randomInt(-200, -50);
  asteroid.speed = randomSpeed();
};

const resetGame = () => {
  player.x = WIDTH / 2 - player.size / 2;
  bullets = [];
  asteroids = Array.from({ length: asteroidCount }, () => ({
    x: randomInt(0, WIDTH - asteroidSize),
    y: randomInt(-200, -50),
    speed: randomSpeed(),
  }));
  score = 0;
  gameOver = false;
  lastShotAt = 0;
  scoreValue.textContent = "0";
  statusValue.textContent = "Running";
};

const tryShoot = () => {
  if (gameOver) {
    return;
  }

  const now = performance.now();
  if (now - lastShotAt < shootCooldownMs) {
    return;
  }

  lastShotAt = now;
  bullets.push({
    x: player.x + player.size / 2 - bulletWidth / 2,
    y: player.y,
  });
};

const collides = (ax, ay, aw, ah, bx, by, bw, bh) =>
  ax < bx + bw &&
  ax + aw > bx &&
  ay < by + bh &&
  ay + ah > by;

const drawBackground = () => {
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, "#050d18");
  gradient.addColorStop(1, "#091824");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  for (let i = 0; i < 65; i += 1) {
    const x = (i * 73) % WIDTH;
    const y = (i * 131) % HEIGHT;
    ctx.fillRect(x, y, 2, 2);
  }
};

const drawPlayer = () => {
  if (shipImage.complete && shipImage.naturalWidth > 0) {
    ctx.drawImage(shipImage, player.x, player.y, player.size, player.size);
    return;
  }

  ctx.fillStyle = "#54c8ff";
  ctx.beginPath();
  ctx.moveTo(player.x + player.size / 2, player.y);
  ctx.lineTo(player.x, player.y + player.size);
  ctx.lineTo(player.x + player.size, player.y + player.size);
  ctx.closePath();
  ctx.fill();
};

const drawBullets = () => {
  ctx.fillStyle = "#ffd857";
  bullets.forEach((bullet) => {
    ctx.fillRect(bullet.x, bullet.y, bulletWidth, bulletHeight);
  });
};

const drawAsteroids = () => {
  asteroids.forEach((asteroid) => {
    if (asteroidImage.complete && asteroidImage.naturalWidth > 0) {
      ctx.drawImage(asteroidImage, asteroid.x, asteroid.y, asteroidSize, asteroidSize);
      return;
    }

    ctx.fillStyle = "#dd5d5d";
    ctx.fillRect(asteroid.x, asteroid.y, asteroidSize, asteroidSize);
  });
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
  ctx.fillText("Press Enter or Restart to play again", WIDTH / 2, HEIGHT / 2 + 48);
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
  player.x = Math.max(0, Math.min(WIDTH - player.size, player.x));

  bullets = bullets
    .map((bullet) => ({ ...bullet, y: bullet.y - bulletSpeed }))
    .filter((bullet) => bullet.y + bulletHeight > 0);

  asteroids.forEach((asteroid) => {
    asteroid.y += asteroid.speed;
    if (asteroid.y > HEIGHT) {
      resetAsteroid(asteroid);
    }

    if (
      collides(
        player.x,
        player.y,
        player.size,
        player.size,
        asteroid.x,
        asteroid.y,
        asteroidSize,
        asteroidSize
      )
    ) {
      gameOver = true;
      statusValue.textContent = "Game Over";
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
          asteroidSize,
          asteroidSize
        )
      ) {
        hitTarget = true;
        resetAsteroid(asteroid);
        score += 1;
        scoreValue.textContent = String(score);
      }
    });

    if (!hitTarget) {
      remainingBullets.push(bullet);
    }
  });

  bullets = remainingBullets;
};

const draw = () => {
  drawBackground();
  drawPlayer();
  drawBullets();
  drawAsteroids();
  drawOverlay();
};

const loop = () => {
  update();
  draw();
  window.requestAnimationFrame(loop);
};

const setActionState = (action, pressed) => {
  if (action === "shoot") {
    controlButtons.forEach((button) => {
      if (button.dataset.action === action) {
        button.classList.toggle("active", pressed);
      }
    });
    return;
  }

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
    tryShoot();
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
    if (action === "shoot") {
      button.classList.add("active");
      tryShoot();
      return;
    }
    setActionState(action, true);
  };
  const release = (event) => {
    event.preventDefault();
    if (action === "shoot") {
      button.classList.remove("active");
      return;
    }
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
