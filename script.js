(() => {
  const canvas = document.querySelector("#game-canvas");
  const context = canvas.getContext("2d");
  const overlay = document.querySelector("#overlay");
  const overlayTitle = document.querySelector("#overlay-title");
  const overlayDescription = document.querySelector("#overlay-description");
  const startButton = document.querySelector("#start-button");
  const scoreOutput = document.querySelector("#score");
  const livesOutput = document.querySelector("#lives");
  const prize = document.querySelector("#prize");
  const copyButton = document.querySelector("#copy-button");
  const keyword = document.querySelector("#keyword");

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  const TARGET_SCORE = 20;
  const player = { x: WIDTH / 2, y: HEIGHT - 34, width: 58, height: 24, speed: 6 };
  const items = [];
  let score = 0;
  let lives = 3;
  let running = false;
  let lastTime = 0;
  let spawnTimer = 0;
  let animationFrame = 0;
  const keys = new Set();

  function drawBackground() {
    const sky = context.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, "#10243f");
    sky.addColorStop(1, "#1d3a1f");
    context.fillStyle = sky;
    context.fillRect(0, 0, WIDTH, HEIGHT);

    context.fillStyle = "#ffffff";
    for (let i = 0; i < 28; i += 1) {
      const x = (i * 83 + 17) % WIDTH;
      const y = (i * 47 + 13) % 170;
      context.fillRect(x, y, 2, 2);
    }

    context.fillStyle = "#18281d";
    context.fillRect(0, HEIGHT - 14, WIDTH, 14);
    context.fillStyle = "#35502b";
    context.fillRect(0, HEIGHT - 14, WIDTH, 4);
  }

  function drawItem(item) {
    context.save();
    context.translate(Math.round(item.x), Math.round(item.y));
    if (item.type === "tnt") {
      context.fillStyle = "#a72f25";
      context.fillRect(-12, -10, 24, 20);
      context.fillStyle = "#e45a3f";
      context.fillRect(-12, -10, 24, 4);
      context.fillStyle = "#f6ecd2";
      context.font = "bold 9px Rubik, sans-serif";
      context.textAlign = "center";
      context.fillText("TNT", 0, 4);
      context.fillStyle = "#d8c49b";
      context.fillRect(-4, -14, 8, 4);
    } else {
      context.fillStyle = item.type === "emerald" ? "#18a968" : "#1fb5a6";
      context.beginPath();
      context.moveTo(0, -13);
      context.lineTo(11, -4);
      context.lineTo(8, 10);
      context.lineTo(0, 14);
      context.lineTo(-8, 10);
      context.lineTo(-11, -4);
      context.closePath();
      context.fill();
      context.fillStyle = item.type === "emerald" ? "#8affbd" : "#b6fff1";
      context.beginPath();
      context.moveTo(-2, -8);
      context.lineTo(3, -5);
      context.lineTo(1, 4);
      context.lineTo(-4, 1);
      context.closePath();
      context.fill();
    }
    context.restore();
  }

  function drawPlayer() {
    const x = Math.round(player.x - player.width / 2);
    context.fillStyle = "#6e421e";
    context.fillRect(x, player.y, player.width, player.height);
    context.fillStyle = "#a96b2d";
    context.fillRect(x + 4, player.y + 4, player.width - 8, player.height - 8);
    context.fillStyle = "#d3a456";
    context.fillRect(x + 8, player.y + 7, player.width - 16, 3);
    context.fillStyle = "#f5c542";
    context.fillRect(player.x - 5, player.y + 10, 10, 8);
    context.fillStyle = "#3a2600";
    context.fillRect(player.x - 2, player.y + 12, 4, 4);
  }

  function drawScene() {
    drawBackground();
    items.forEach(drawItem);
    drawPlayer();
  }

  function updateHud() {
    scoreOutput.textContent = String(score);
    livesOutput.textContent = String(lives);
  }

  function showEndScreen(won) {
    running = false;
    cancelAnimationFrame(animationFrame);
    overlay.hidden = false;
    startButton.textContent = "JOACĂ DIN NOU";
    overlayTitle.textContent = won ? "AI REUȘIT!" : "JOC TERMINAT";
    overlayDescription.textContent = won
      ? "Ai strâns destule diamante și smaralde. Cuvântul-cheie este gata!"
      : "Ai rămas fără vieți. Încearcă din nou și ferește-te de TNT!";
    prize.hidden = !won;
  }

  function spawnItem() {
    const roll = Math.random();
    const type = roll < 0.17 ? "tnt" : roll < 0.42 ? "emerald" : "diamond";
    items.push({
      type,
      x: 16 + Math.random() * (WIDTH - 32),
      y: -16,
      speed: 2.1 + Math.random() * 1.5 + score * 0.025,
      size: type === "tnt" ? 22 : 24,
    });
  }

  function intersects(item) {
    return Math.abs(item.x - player.x) < (item.size + player.width) / 2
      && Math.abs(item.y - (player.y + player.height / 2)) < (item.size + player.height) / 2;
  }

  function tick(time) {
    if (!running) return;
    const delta = Math.min((time - lastTime) / 16.67 || 1, 2);
    lastTime = time;

    if (keys.has("ArrowLeft") || keys.has("a")) player.x -= player.speed * delta;
    if (keys.has("ArrowRight") || keys.has("d")) player.x += player.speed * delta;
    player.x = Math.max(player.width / 2, Math.min(WIDTH - player.width / 2, player.x));

    spawnTimer += delta;
    if (spawnTimer > 34) {
      spawnItem();
      spawnTimer = 0;
    }

    for (let i = items.length - 1; i >= 0; i -= 1) {
      const item = items[i];
      item.y += item.speed * delta;
      if (intersects(item)) {
        if (item.type === "tnt") lives -= 1;
        else score += item.type === "emerald" ? 3 : 1;
        items.splice(i, 1);
        updateHud();
        if (score >= TARGET_SCORE) {
          drawScene();
          showEndScreen(true);
          return;
        }
        if (lives <= 0) {
          drawScene();
          showEndScreen(false);
          return;
        }
      } else if (item.y > HEIGHT + 20) {
        items.splice(i, 1);
      }
    }

    drawScene();
    animationFrame = requestAnimationFrame(tick);
  }

  function startGame() {
    score = 0;
    lives = 3;
    player.x = WIDTH / 2;
    items.length = 0;
    spawnTimer = 0;
    lastTime = performance.now();
    running = true;
    prize.hidden = true;
    overlay.hidden = true;
    updateHud();
    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(tick);
  }

  function movePlayerFromPointer(event) {
    const rect = canvas.getBoundingClientRect();
    player.x = ((event.clientX - rect.left) / rect.width) * WIDTH;
    player.x = Math.max(player.width / 2, Math.min(WIDTH - player.width / 2, player.x));
  }

  startButton.addEventListener("click", startGame);
  canvas.addEventListener("pointermove", (event) => {
    if (running) movePlayerFromPointer(event);
  });
  canvas.addEventListener("pointerdown", (event) => {
    if (running) movePlayerFromPointer(event);
  });

  document.addEventListener("keydown", (event) => {
    if (["ArrowLeft", "ArrowRight"].includes(event.key)) event.preventDefault();
    keys.add(event.key);
  });
  document.addEventListener("keyup", (event) => keys.delete(event.key));
  window.addEventListener("blur", () => keys.clear());

  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(keyword.textContent);
      copyButton.textContent = "✅ Copiat!";
    } catch {
      window.prompt("Copiază cuvântul-cheie:", keyword.textContent);
    }
  });

  updateHud();
  drawScene();
})();
