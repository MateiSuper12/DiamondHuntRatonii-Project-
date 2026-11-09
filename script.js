(() => {
  const canvas = document.querySelector(".gc");
  const context = canvas.getContext("2d");
  const game = document.querySelector(".game");
  const overlay = document.querySelector(".gov");
  const overlayTitle = document.querySelector(".gt");
  const overlayDescription = document.querySelector(".gd");
  const startButton = document.querySelector(".gs");
  const hud = document.querySelector(".hud");
  const scoreOutput = document.querySelector(".score");
  const livesOutput = document.querySelector(".lives");
  const prize = document.querySelector(".prize");
  const copyButton = document.querySelector(".kc");
  const keyword = document.querySelector(".kw");

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  const TARGET_SCORE = 20;
  const player = { x: WIDTH / 2, y: HEIGHT - 38, width: 86, height: 60, speed: 8, openProgress: 0 };
  const items = [];
  const keys = new Set();
  let score = 0;
  let lives = 3;
  let running = false;
  let lastTime = 0;
  let spawnTimer = 0;
  let animationFrame = 0;

  function loadImage(path) {
    const image = new Image();
    image.src = new URL(path, document.baseURI).href;
    image.addEventListener("load", drawScene);
    image.addEventListener("error", () => console.error(`Nu s-a putut încărca imaginea: ${image.src}`));
    return image;
  }

  const backgroundImage = loadImage("assets/26262708.png");
  const diamondImage = loadImage("assets/Diamond_JE3_BE3.png");
  const emeraldImage = loadImage("assets/Emerald_JE3_BE3.webp");
  const chestClosedImage = loadImage("assets/Chest (1).webp");
  const chestOpeningImage = loadImage("assets/Chest.gif");

  function drawBackground() {
    if (backgroundImage.complete && backgroundImage.naturalWidth > 0) {
      context.drawImage(backgroundImage, 0, 0, WIDTH, HEIGHT);
      return;
    }
    const sky = context.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, "#10243f");
    sky.addColorStop(1, "#1d3a1f");
    context.fillStyle = sky;
    context.fillRect(0, 0, WIDTH, HEIGHT);
    context.fillStyle = "#fff";
    for (let i = 0; i < 32; i += 1) context.fillRect((i * 83 + 17) % WIDTH, (i * 47 + 13) % 190, 3, 3);
    context.fillStyle = "#302016";
    context.fillRect(0, HEIGHT - 18, WIDTH, 18);
  }

  function drawTnt(x, y) {
    context.fillStyle = "#9e3026"; context.fillRect(x - 13, y - 11, 26, 22);
    context.fillStyle = "#ed6545"; context.fillRect(x - 13, y - 11, 26, 5);
    context.fillStyle = "#f6ecd2"; context.font = "bold 9px Rubik, sans-serif"; context.textAlign = "center"; context.fillText("TNT", x, y + 5);
    context.fillStyle = "#d8c49b"; context.fillRect(x - 4, y - 15, 8, 4);
  }

  function drawItem(item) {
    if (item.type === "tnt") { drawTnt(Math.round(item.x), Math.round(item.y)); return; }
    const image = item.type === "emerald" ? emeraldImage : diamondImage;
    if (image.complete && image.naturalWidth > 0) { context.drawImage(image, Math.round(item.x - 16), Math.round(item.y - 16), 32, 32); return; }
    context.fillStyle = item.type === "emerald" ? "#25d879" : "#36e6db";
    context.beginPath(); context.moveTo(item.x, item.y - 14); context.lineTo(item.x + 12, item.y - 4); context.lineTo(item.x + 9, item.y + 10); context.lineTo(item.x, item.y + 15); context.lineTo(item.x - 9, item.y + 10); context.lineTo(item.x - 12, item.y - 4); context.closePath(); context.fill();
  }

  function drawChestImage(image, x, y, width, height, alpha = 1) {
    if (!image || !image.complete || image.naturalWidth <= 0) return false;
    context.save();
    context.globalAlpha = alpha;
    context.drawImage(image, x, y, width, height);
    context.restore();
    return true;
  }

  function drawPlayer() {
    const x = Math.round(player.x - player.width / 2);
    const y = Math.round(player.y - 12);
    const bob = Math.sin((performance.now() || 0) / 150) * 2;
    const chestScale = 1 + player.openProgress * 0.12;
    const chestWidth = Math.round(player.width * chestScale);
    const chestHeight = Math.round(player.height * chestScale);
    const chestX = Math.round(player.x - chestWidth / 2);
    const chestY = Math.round(y + bob);

    const hasOpenGif = chestOpeningImage.complete && chestOpeningImage.naturalWidth > 0;
    const isAnimating = player.openProgress > 0.08;
    const activeImage = isAnimating && hasOpenGif ? chestOpeningImage : chestClosedImage;

    if (drawChestImage(activeImage, chestX, chestY, chestWidth, chestHeight, isAnimating ? 0.9 + player.openProgress * 0.1 : 1)) {
      if (player.openProgress > 0.06) {
        context.save();
        context.globalAlpha = 0.2 + player.openProgress * 0.45;
        context.fillStyle = "#f5d76e";
        context.beginPath();
        context.arc(player.x, player.y - 5, 26 + player.openProgress * 18, 0, Math.PI * 2);
        context.fill();
        context.restore();
      }
      return;
    }

    context.fillStyle = "#553316";
    context.fillRect(x, player.y, player.width, player.height);
    context.fillStyle = "#a96b2d";
    context.fillRect(x + 4, player.y + 4, player.width - 8, player.height - 8);
    context.fillStyle = "#e4b85e";
    context.fillRect(x + 8, player.y + 7, player.width - 16, 3);
    context.fillStyle = "#f5c542";
    context.fillRect(player.x - 5, player.y + 11, 10, 9);
    context.fillStyle = "#3a2600";
    context.fillRect(player.x - 2, player.y + 13, 4, 5);
  }

  function drawScene() {
    context.imageSmoothingEnabled = false;
    drawBackground();
    items.forEach(drawItem);
    drawPlayer();
  }

  function updateHud() {
    scoreOutput.textContent = String(score);
    livesOutput.textContent = String(lives);
  }

  function endGame(won) {
    running = false;
    cancelAnimationFrame(animationFrame);
    overlay.hidden = false;
    hud.hidden = true;
    startButton.textContent = "JOACĂ DIN NOU";
    overlayTitle.textContent = won ? "AI REUȘIT!" : "JOC TERMINAT";
    overlayDescription.textContent = won ? "Ai strâns destule diamante și smaralde. Cuvântul-cheie este gata!" : "Ai rămas fără vieți. Încearcă din nou și ferește-te de TNT!";
    prize.style.display = won ? "block" : "none";
    if (won) { keyword.textContent = atob("RWFydGhNQ1JhdG9uaWlCJkM="); game.classList.add("won"); }
  }

  function spawnItem() {
    const roll = Math.random();
    const type = roll < 0.17 ? "tnt" : roll < 0.42 ? "emerald" : "diamond";
    items.push({ type, x: 20 + Math.random() * (WIDTH - 40), y: -20, speed: 2.4 + Math.random() * 1.5 + score * 0.025, size: type === "tnt" ? 24 : 30 });
  }

  function intersects(item) {
    return Math.abs(item.x - player.x) < (item.size + player.width) / 2 && Math.abs(item.y - (player.y + player.height / 2)) < (item.size + player.height) / 2;
  }

  function tick(time) {
    if (!running) return;
    const delta = Math.min((time - lastTime) / 16.67 || 1, 2);
    lastTime = time;
    if (keys.has("ArrowLeft") || keys.has("a")) player.x -= player.speed * delta;
    if (keys.has("ArrowRight") || keys.has("d")) player.x += player.speed * delta;
    player.x = Math.max(player.width / 2, Math.min(WIDTH - player.width / 2, player.x));
    player.openProgress = Math.max(0, player.openProgress * 0.82 - 0.03);
    spawnTimer += delta;
    if (spawnTimer > 30) { spawnItem(); spawnTimer = 0; }

    for (let i = items.length - 1; i >= 0; i -= 1) {
      const item = items[i]; item.y += item.speed * delta;
      if (intersects(item)) {
        if (item.type === "tnt") {
          lives -= 1;
          player.openProgress = Math.max(player.openProgress, 0.45);
        } else {
          score += item.type === "emerald" ? 3 : 1;
          player.openProgress = Math.min(1, player.openProgress + 0.85);
        }
        items.splice(i, 1);
        updateHud();
        if (score >= TARGET_SCORE) { drawScene(); endGame(true); return; }
        if (lives <= 0) { drawScene(); endGame(false); return; }
      } else if (item.y > HEIGHT + 24) items.splice(i, 1);
    }
    drawScene();
    animationFrame = requestAnimationFrame(tick);
  }

  function startGame() {
    score = 0; lives = 3; player.x = WIDTH / 2; player.openProgress = 0; items.length = 0; spawnTimer = 0; lastTime = performance.now(); running = true;
    game.classList.remove("won"); prize.style.display = "none"; keyword.textContent = "";
    updateHud(); hud.hidden = false; overlay.hidden = true;
    cancelAnimationFrame(animationFrame);
    drawScene(); animationFrame = requestAnimationFrame(tick);
  }

  function movePlayerFromPointer(event) {
    const rect = canvas.getBoundingClientRect();
    player.x = ((event.clientX - rect.left) / rect.width) * WIDTH;
    player.x = Math.max(player.width / 2, Math.min(WIDTH - player.width / 2, player.x));
  }

  startButton.addEventListener("click", startGame);
  canvas.addEventListener("pointermove", (event) => { if (running) movePlayerFromPointer(event); });
  canvas.addEventListener("pointerdown", (event) => { if (running) movePlayerFromPointer(event); });
  document.addEventListener("keydown", (event) => { if (["ArrowLeft", "ArrowRight"].includes(event.key)) event.preventDefault(); keys.add(event.key); });
  document.addEventListener("keyup", (event) => keys.delete(event.key));
  window.addEventListener("blur", () => keys.clear());

  copyButton.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(keyword.textContent); copyButton.textContent = "✅ Copiat!"; }
    catch { window.prompt("Copiază cuvântul-cheie:", keyword.textContent); }
  });

  prize.style.display = "none";
  updateHud();
  drawScene();
})();
