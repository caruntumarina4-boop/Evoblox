const gameArea = document.getElementById("game-area");
const statusText = document.getElementById("match-status");
const messageText = document.getElementById("game-message");
const startButton = document.getElementById("start-button");
const nicknameInput = document.getElementById("nickname");
const bonusCodeInput = document.getElementById("bonus-code");
const applyCodeButton = document.getElementById("apply-code");
const serverSelect = document.getElementById("server-select");
const btnSettings = document.getElementById("btn-settings");

const players = {
  player1: { x: 60, y: 240, color: "player-1", label: "1", keys: { left: false, right: false, up: false, down: false }, sprite: null },
  player2: { x: 180, y: 240, color: "player-2", label: "2", keys: { left: false, right: false, up: false, down: false }, sprite: null, active: true }
};

let gameStarted = false;

function createPlayerSprite(player) {
  const div = document.createElement("div");
  div.classList.add("player-sprite", player.color);
  div.textContent = player.label;
  gameArea.appendChild(div);
  player.sprite = div;
  updatePlayerSprite(player);
}

function updatePlayerSprite(player) {
  if (!player.sprite) return;
  player.sprite.style.left = `${player.x}px`;
  player.sprite.style.top = `${player.y}px`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function updateGame() {
  if (!gameStarted) return;
  const speed = 3;

  const p1 = players.player1;
  if (p1.keys.left) p1.x -= speed;
  if (p1.keys.right) p1.x += speed;
  if (p1.keys.up) p1.y -= speed;
  if (p1.keys.down) p1.y += speed;
  p1.x = clamp(p1.x, 0, gameArea.clientWidth - 40);
  p1.y = clamp(p1.y, 0, gameArea.clientHeight - 40);
  updatePlayerSprite(p1);

  const p2 = players.player2;
  if (p2.keys.left) p2.x -= speed;
  if (p2.keys.right) p2.x += speed;
  if (p2.keys.up) p2.y -= speed;
  if (p2.keys.down) p2.y += speed;
  p2.x = clamp(p2.x, 0, gameArea.clientWidth - 40);
  p2.y = clamp(p2.y, 0, gameArea.clientHeight - 40);
  updatePlayerSprite(p2);

  window.requestAnimationFrame(updateGame);
}

function setStatus(text) {
  if (statusText) statusText.textContent = text;
}

function setMessage(text) {
  if (messageText) messageText.textContent = text;
}

function startGame() {
  const nickname = nicknameInput.value.trim();
  if (!nickname) {
    setMessage("Introdu un nickname înainte de a porni jocul.");
    return;
  }
  gameStarted = true;
  setMessage(`Joc pornit cu ${nickname} pe ${serverSelect.value}`);
  setStatus("Joc multiplayer local activ");
}

function applyBonusCode() {
  const code = bonusCodeInput.value.trim();
  if (!code) {
    alert("Introdu un cod bonus.");
    return;
  }
  alert(`Codul ${code} a fost aplicat!`);
}

function openSettings() {
  alert("Deschide setările pentru sunet, grafică și controale.");
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  switch (key) {
    case "arrowleft": players.player1.keys.left = true; break;
    case "arrowright": players.player1.keys.right = true; break;
    case "arrowup": players.player1.keys.up = true; break;
    case "arrowdown": players.player1.keys.down = true; break;
    case "a": players.player2.keys.left = true; break;
    case "d": players.player2.keys.right = true; break;
    case "w": players.player2.keys.up = true; break;
    case "s": players.player2.keys.down = true; break;
  }
});

window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  switch (key) {
    case "arrowleft": players.player1.keys.left = false; break;
    case "arrowright": players.player1.keys.right = false; break;
    case "arrowup": players.player1.keys.up = false; break;
    case "arrowdown": players.player1.keys.down = false; break;
    case "a": players.player2.keys.left = false; break;
    case "d": players.player2.keys.right = false; break;
    case "w": players.player2.keys.up = false; break;
    case "s": players.player2.keys.down = false; break;
  }
});

if (startButton) startButton.addEventListener("click", startGame);
if (applyCodeButton) applyCodeButton.addEventListener("click", applyBonusCode);
if (btnSettings) btnSettings.addEventListener("click", openSettings);

createPlayerSprite(players.player1);
createPlayerSprite(players.player2);
setStatus("Completează nickname și apasă Play.");
setMessage("Serverul este gata pentru un meci multiplayer.");
window.requestAnimationFrame(updateGame);
