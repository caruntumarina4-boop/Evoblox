const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const bigMapCanvas = document.getElementById('bigMapCanvas');
const bigCtx = bigMapCanvas.getContext('2d');

// Dimensiuni Lume EvoWorld (Cer, Pământ, Subsol)
const WORLD = {
  width: 3500,
  height: 2200,
  skyY: 0,
  groundY: 1200,
  undergroundY: 1800
};

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (bigMapCanvas) {
    bigMapCanvas.width = Math.min(window.innerWidth * 0.8, 700);
    bigMapCanvas.height = Math.min(window.innerHeight * 0.6, 420);
  }
}
window.addEventListener('resize', resize);
resize();

// Jucătorul (Musca)
const player = {
  x: WORLD.width / 2,
  y: WORLD.groundY - 100,
  radius: 20,
  vx: 0,
  vy: 0,
  accelX: 0.85,
  maxSpeedX: 6.5,
  flyImpulse: -0.92,
  gravity: 0.35,
  frictionX: 0.91,
  frictionY: 0.97,
  facingRight: true
};

const keys = { left: false, right: false, up: false };

// Tastatură
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') { keys.left = true; player.facingRight = false; }
  if (e.code === 'KeyD' || e.code === 'ArrowRight') { keys.right = true; player.facingRight = true; }
  if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = true;
  if (e.code === 'KeyM') toggleBigMap();
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
  if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = false;
});

// Zbor cu Click pe PC
window.addEventListener('mousedown', (e) => {
  if (e.target.tagName !== 'BUTTON' && !e.target.classList.contains('touch-btn')) {
    keys.up = true;
  }
});
window.addEventListener('mouseup', () => { keys.up = false; });

// Harta Mare (Tasta M)
const bigMapModal = document.getElementById('big-map-modal');
let isBigMapOpen = false;

function toggleBigMap() {
  isBigMapOpen = !isBigMapOpen;
  if (bigMapModal) {
    bigMapModal.style.display = isBigMapOpen ? 'flex' : 'none';
  }
}

if (bigMapModal) {
  bigMapModal.addEventListener('click', () => toggleBigMap());
}

// Bucle principale
function gameLoop() {
  // Fizică mișcare
  if (keys.left) player.vx -= player.accelX;
  if (keys.right) player.vx += player.accelX;

  if (player.vx > player.maxSpeedX) player.vx = player.maxSpeedX;
  if (player.vx < -player.maxSpeedX) player.vx = -player.maxSpeedX;

  if (keys.up) player.vy += player.flyImpulse;

  player.vy += player.gravity;
  player.vx *= player.frictionX;
  player.vy *= player.frictionY;

  player.x += player.vx;
  player.y += player.vy;

  // Limite Lume
  if (player.y + player.radius > WORLD.height) {
    player.y = WORLD.height - player.radius;
    player.vy = 0;
  }
  if (player.y - player.radius < 0) {
    player.y = player.radius;
    player.vy = 0;
  }
  if (player.x - player.radius < 0) {
    player.x = player.radius;
    player.vx = 0;
  }
  if (player.x + player.radius > WORLD.width) {
    player.x = WORLD.width - player.radius;
    player.vx = 0;
  }

  // Urmărire Cameră
  const cameraX = player.x - canvas.width / 2;
  const cameraY = player.y - canvas.height / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(-cameraX, -cameraY);

  // --- DESENARE FUNDAL STIL EVOWORLD ---

  // 1. Cerul (Sus)
  ctx.fillStyle = '#4fa3e3';
  ctx.fillRect(0, 0, WORLD.width, WORLD.groundY);

  // 2. Iarbă și Suprafață
  ctx.fillStyle = '#55A630';
  ctx.fillRect(0, WORLD.groundY, WORLD.width, 40);

  // 3. Pământ (Subsol)
  ctx.fillStyle = '#5c4033';
  ctx.fillRect(0, WORLD.groundY + 40, WORLD.width, WORLD.undergroundY - (WORLD.groundY + 40));

  // 4. Zona de Lavă / Vulcan (Miezul Lumii)
  ctx.fillStyle = '#d63031';
  ctx.fillRect(0, WORLD.undergroundY, WORLD.width, WORLD.height - WORLD.undergroundY);

  // --- DESENARE JUCĂTOR (MUSCĂ) ---
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#2d3436';
  ctx.fill();

  // Aripă
  ctx.beginPath();
  ctx.ellipse(player.x + (player.facingRight ? -6 : 6), player.y - 10, 6, keys.up ? 14 : 8, Math.PI / 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fill();

  // Ochi
  const eyeOffset = player.facingRight ? 8 : -8;
  ctx.beginPath();
  ctx.arc(player.x + eyeOffset, player.y - 4, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(player.x + eyeOffset + (player.facingRight ? 2 : -2), player.y - 4, 2, 0, Math.PI * 2);
  ctx.fillStyle = '#000000';
  ctx.fill();

  ctx.restore();

  // Render Harta Mare la tasta M
  if (isBigMapOpen) drawBigMap();

  requestAnimationFrame(gameLoop);
}

// Render Harta Mare (Modal M)
function drawBigMap() {
  if (!bigCtx) return;
  
  bigCtx.clearRect(0, 0, bigMapCanvas.width, bigMapCanvas.height);

  const scaleX = bigMapCanvas.width / WORLD.width;
  const scaleY = bigMapCanvas.height / WORLD.height;

  // Cer pe Hartă
  bigCtx.fillStyle = '#4fa3e3';
  bigCtx.fillRect(0, 0, bigMapCanvas.width, WORLD.groundY * scaleY);

  // Pământ pe Hartă
  bigCtx.fillStyle = '#55A630';
  bigCtx.fillRect(0, WORLD.groundY * scaleY, bigMapCanvas.width, (WORLD.undergroundY - WORLD.groundY) * scaleY);

  // Lavă pe Hartă
  bigCtx.fillStyle = '#d63031';
  bigCtx.fillRect(0, WORLD.undergroundY * scaleY, bigMapCanvas.width, (WORLD.height - WORLD.undergroundY) * scaleY);

  // Punct Jucător pe Hartă
  bigCtx.beginPath();
  bigCtx.arc(player.x * scaleX, player.y * scaleY, 6, 0, Math.PI * 2);
  bigCtx.fillStyle = '#00ff00';
  bigCtx.fill();
  bigCtx.strokeStyle = '#ffffff';
  bigCtx.lineWidth = 2;
  bigCtx.stroke();
}

gameLoop();