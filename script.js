(() => {
  const canvas = document.querySelector(".gc");
  const context = canvas.getContext("2d");
  const game = document.querySelector(".game");
  const overlay = document.querySelector(".gov");
  const overlayTitle = document.querySelector(".gt");
  const overlayDescription = document.querySelector(".gd");
  const startButton = document.querySelector(".gs");
  const prize = document.querySelector(".prize");
  const copyButton = document.querySelector(".kc");
  const keyword = document.querySelector(".kw");

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  const TARGET_SCORE = 20;
  const player = { x: WIDTH / 2, y: HEIGHT - 38, width: 66, height: 28, speed: 8 };
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

  const backgroundImage = loadImage("26262708.png");
  const diamondImage = loadImage("Diamond_JE3_BE3.png");
  const emeraldImage = loadImage("Emerald_JE3_BE3.webp");

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
    context.fillStyle = "#ffffff";
    for (let i = 0; i < 32; i += 1) {
      context.fillRect((i * 83 + 17) % WIDTH, (i * 47 + 13) % 190, 3, 3);
    }
    context.fillStyle = "#302016";
    context.fillRect(0, HEIGHT - 18, WIDTH, 18);
  }

  function drawTnt(x, y) {
    context.fillStyle = "#9e3026";
    context.fillRect(x - 13, y - 11, 26, 22);
    context.fillStyle = "#ed6545";
    context.fillRect(x - 13, y - 11, 26, 5);
    context.fillStyle = "#f6ecd2";
    context.font = "bold 9px Rubik, sans-serif";
    context.textAlign = "center";
    context.fillText("TNT", x, y + 5);
    context.fillStyle = "#d8c49b";
    context.fillRect(x - 4, y - 15, 8, 4);
  }

  function drawItem(item) {
    if (item.type === "tnt") {
      drawTnt(Math.round(item.x), Math.round(item.y));
      return;
    }
    const image = item.type === "emerald" ? emeraldImage : diamondImage;
    if (image.complete && image.naturalWidth > 0) {
      context.drawImage(image, Math.round(item.x - 16), Math.round(item.y - 16), 32, 32);
      return;
    }
    context.fillStyle = item.type === "emerald" ? "#25d879" : "#36e6db";
    context.beginPath();
    context.moveTo(item.x, item.y - 14);
    context.lineTo(item.x + 12, item.y - 4);
    context.lineTo(item.x + 9, item.y + 10);
    context.lineTo(item.x, item.y + 15);
    context.lineTo(item.x - 9, item.y + 10);
    context.lineTo(item.x - 12, item.y - 4);
    context.closePath();
    context.fill();
  }

  function drawPlayer() {
    const x = Math.round(player.x - player.width / 2);
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

  function updateOverlay() {
    overlayTitle.textContent = `SCOR: ${score}`;
    overlayDescription.innerHTML = `Prinde diamantele și smaraldele. Ai <b>${lives}</b> vieți. Ferește-te de TNT!`;
  }

  function endGame(won) {
    running = false;
    cancelAnimationFrame(animationFrame);
    overlay.hidden = false;
    startButton.textContent = "JOACĂ DIN NOU";
    overlayTitle.textContent = won ? "AI REUȘIT!" : "JOC TERMINAT";
    overlayDescription.textContent = won
      ? "Ai strâns destule diamante și smaralde. Cuvântul-cheie este gata!"
      : "Ai rămas fără vieți. Încearcă din nou și ferește-te de TNT!";
    prize.style.display = won ? "block" : "none";
    if (won) {
      keyword.textContent = atob("RWFydGhNQ1JhdG9uaWlCJkM=");
      game.classList.add("won");
    }
  }

  function spawnItem() {
    const roll = Math.random();
    const type = roll < 0.17 ? "tnt" : roll < 0.42 ? "emerald" : "diamond";
    items.push({
      type,
      x: 20 + Math.random() * (WIDTH - 40),
      y: -20,
      speed: 2.4 + Math.random() * 1.5 + score * 0.025,
      size: type === "tnt" ? 24 : 30,
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
    if (spawnTimer > 30) {
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
        if (score >= TARGET_SCORE) {
          drawScene();
          endGame(true);
          return;
        }
        if (lives <= 0) {
          drawScene();
          endGame(false);
          return;
        }
      } else if (item.y > HEIGHT + 24) {
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
    game.classList.remove("won");
    prize.style.display = "none";
    keyword.textContent = "";
    overlay.hidden = true;
    drawScene();
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

  prize.style.display = "none";
  drawScene();
})();
