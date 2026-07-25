const gameArea = document.getElementById("game-area");
const statusText = document.getElementById("match-status");
const messageText = document.getElementById("game-message");
const startButton = document.getElementById("start-button");
const nicknameInput = document.getElementById("nickname");
const bonusCodeInput = document.getElementById("bonus-code");
const applyCodeButton = document.getElementById("apply-code");
const serverSelect = document.getElementById("server-select");
const btnSettings = document.getElementById("btn-settings");
const btnLogin = document.getElementById("btn-login");
const btnRegister = document.getElementById("btn-register");
const btnGuestLogin = document.getElementById("guest-login-button");
const authUsernameInput = document.getElementById("auth-username");
const authPasswordInput = document.getElementById("auth-password");
const authSubmit = document.getElementById("auth-submit");
const authToggleMode = document.getElementById("auth-toggle-mode");
const authHeading = document.getElementById("auth-heading");
const authMessage = document.getElementById("auth-message");
const authModal = document.getElementById("auth-modal");
const settingsModal = document.getElementById("settings-modal");
const modalOverlay = document.getElementById("modal-overlay");
const closeAuth = document.getElementById("close-auth");
const closeSettings = document.getElementById("close-settings");
const langSelect = document.getElementById("lang-select");
const accountStatus = document.getElementById("account-status");
const refreshLeaders = document.getElementById("refresh-leaders");
const leaderList = document.getElementById("leader-list");
const friendInvite = document.getElementById("friend-invite");
const sendInvite = document.getElementById("send-invite");
const friendList = document.getElementById("friend-list");
const pendingInvites = document.getElementById("pending-invites");
const toggleWikiButton = document.getElementById("toggle-wiki");
const wikiContent = document.querySelector(".wiki-content");

const players = {
  player1: { x: 60, y: 240, color: "player-1", label: "1", keys: { left: false, right: false, up: false, down: false }, sprite: null },
  player2: { x: 180, y: 240, color: "player-2", label: "2", keys: { left: false, right: false, up: false, down: false }, sprite: null, active: true }
};

const translations = {
  ru: {
    login: 'Логин',
    register: 'Регистрация',
    server: 'Сервер:',
    settings: 'Настройки',
    nickname: 'Никнейм',
    nicknamePlaceholder: 'Введите имя...',
    playStart: 'Играть / Старт',
    leaders: 'Лидеры',
    leaderDescription: 'Рейтинг лучших игроков.',
    refreshLeaders: 'Обновить',
    friends: 'Друзья',
    friendsDescription: 'Здесь будут отображаться ваши друзья.',
    invitePlaceholder: 'Введите ник или ID...',
    sendInvite: 'Отправить приглашение',
    pendingInvites: 'Входящие приглашения',
    acceptInvite: 'Принять',
    authTitle: 'Авторизация',
    authMessage: 'Войдите с локальным аккаунтом.',
    continueGuest: 'Играть как Guest',
    enterEmailPassword: 'Введите никнейм и пароль.',
    enterEmailPasswordNickname: 'Введите никнейм и пароль.',
    emailExists: 'Имя пользователя уже занято.',
    invalidCredentials: 'Неверное имя или пароль.',
    waitingLogin: 'Вход в процессе...',
    waitingRegister: 'Регистрация в процессе...',
    guestNicknamePlaceholder: 'Guest не может менять nickname.',
    chooseLanguage: 'Выберите язык:',
    multiplayerNote: 'Мультиплеер работает локально; для реального онлайн потребуется плагин.'
  },
  ro: {
    login: 'Login',
    register: 'Register',
    server: 'Server:',
    settings: 'Setări',
    nickname: 'Nickname',
    nicknamePlaceholder: 'Introdu un nume...',
    playStart: 'Joacă / Start',
    leaders: 'Lideri',
    leaderDescription: 'Clasamentul celor mai buni jucători.',
    refreshLeaders: 'Reîmprospătează',
    friends: 'Prieteni',
    friendsDescription: 'Aici vor apărea prietenii tăi.',
    invitePlaceholder: 'Introdu un nick sau ID...',
    sendInvite: 'Trimite invitație',
    pendingInvites: 'Invitații primite',
    authTitle: 'Autentificare',
    authMessage: 'Autentifică-te cu cont local.',
    continueGuest: 'Joacă ca Guest',
    enterEmailPassword: 'Introdu nick și parolă.',
    enterEmailPasswordNickname: 'Introdu nick și parolă.',
    emailExists: 'Numele de utilizator este deja folosit.',
    invalidCredentials: 'Nume sau parolă incorectă.',
    waitingLogin: 'Se realizează autentificarea...',
    waitingRegister: 'Se realizează înscrierea...',
    guestNicknamePlaceholder: 'Guest nu poate schimba nickname.',
    chooseLanguage: 'Alege limba:',
    multiplayerNote: 'Multiplayer local. Online real necesită plugin.'
  },
  en: {
    login: 'Login',
    register: 'Register',
    server: 'Server:',
    settings: 'Settings',
    nickname: 'Nickname',
    nicknamePlaceholder: 'Enter a name...',
    playStart: 'Play / Start',
    leaders: 'Leaders',
    leaderDescription: 'Top players leaderboard.',
    refreshLeaders: 'Refresh',
    friends: 'Friends',
    friendsDescription: 'Your friends will appear here.',
    invitePlaceholder: 'Enter a nick or ID...',
    sendInvite: 'Send invite',
    pendingInvites: 'Incoming invites',
    acceptInvite: 'Accept',
    authTitle: 'Authentication',
    authMessage: 'Sign in with a local account.',
    continueGuest: 'Play as Guest',
    enterEmailPassword: 'Enter username and password.',
    enterEmailPasswordNickname: 'Enter username and password.',
    emailExists: 'Username is already taken.',
    invalidCredentials: 'Invalid username or password.',
    waitingLogin: 'Signing in...',
    waitingRegister: 'Registering...',
    guestNicknamePlaceholder: 'Guest cannot change nickname.',
    chooseLanguage: 'Choose language:',
    multiplayerNote: 'Multiplayer is local. Real online requires a plugin.'
  }
};

let gameStarted = false;
let userAccount = {
  isLoggedIn: false,
  id: null,
  name: 'Guest',
  friends: [],
  invites: []
};
let accountDatabase = {};
let guestId = `Guest${Math.floor(Math.random() * 9000) + 1000}`;

function loadAccounts() {
  try {
    const saved = JSON.parse(localStorage.getItem('evobloxAccounts') || '{}');
    accountDatabase = saved || {};
  } catch {
    accountDatabase = {};
  }
}

function saveAccounts() {
  localStorage.setItem('evobloxAccounts', JSON.stringify(accountDatabase));
}

function loadCurrentUser() {
  try {
    const saved = JSON.parse(localStorage.getItem('evobloxCurrent') || 'null');
    if (saved && saved.username && accountDatabase[saved.username]) {
      userAccount = JSON.parse(JSON.stringify(saved));
      const stored = accountDatabase[saved.username];
      userAccount.friends = stored.friends || [];
      userAccount.invites = stored.invites || [];
      userAccount.username = saved.username;
      userAccount.name = stored.displayName || saved.username;
      userAccount.isLoggedIn = true;
    }
  } catch {
    userAccount = { isLoggedIn: false, username: null, name: 'Guest', friends: [], invites: [] };
  }
}

function saveCurrentUser() {
  localStorage.setItem('evobloxCurrent', JSON.stringify(userAccount.isLoggedIn ? userAccount : null));
}

let authMode = 'login';

function setAuthMode(mode) {
  authMode = mode === 'register' ? 'register' : 'login';
  if (!authHeading || !authMessage || !authSubmit || !authToggleMode) return;
  authHeading.textContent = t('authTitle');
  authMessage.textContent = t('authMessage');
  authSubmit.textContent = t(authMode === 'register' ? 'authSubmitRegister' : 'authSubmitLogin');
  authToggleMode.textContent = t(authMode === 'register' ? 'authTogglePromptLogin' : 'authTogglePromptRegister');
}

function showAuthModal(mode) {
  setAuthMode(mode);
  if (authUsernameInput) authUsernameInput.value = '';
  if (authPasswordInput) authPasswordInput.value = '';
  openModal(authModal);
}

function loginAccount(username) {
  const account = accountDatabase[username];
  if (!account) return;
  userAccount = {
    isLoggedIn: true,
    username,
    name: account.displayName || username,
    friends: account.friends || [],
    invites: account.invites || []
  };
  saveCurrentUser();
  updateAccountStatus();
  refreshLeadersList();
  updateFriendUI();
  setNicknameFieldState();
  closeModal(authModal);
}

function registerLocalAccount() {
  if (!authUsernameInput || !authPasswordInput) return;
  const username = authUsernameInput.value.trim();
  const password = authPasswordInput.value.trim();
  if (!username || !password) {
    alert(t('enterAccountCredentials'));
    return;
  }
  const key = username.toLowerCase();
  if (accountDatabase[key]) {
    alert(t('usernameTaken'));
    return;
  }
  accountDatabase[key] = {
    username: key,
    password,
    displayName: username,
    friends: [],
    invites: []
  };
  saveAccounts();
  loginAccount(key);
}

function loginLocalAccount() {
  if (!authUsernameInput || !authPasswordInput) return;
  const username = authUsernameInput.value.trim();
  const password = authPasswordInput.value.trim();
  if (!username || !password) {
    alert(t('enterAccountCredentials'));
    return;
  }
  const key = username.toLowerCase();
  const account = accountDatabase[key];
  if (!account || account.password !== password) {
    alert(t('invalidCredentials'));
    return;
  }
  loginAccount(key);
}

function handleAuthSubmit() {
  if (authMode === 'register') {
    registerLocalAccount();
  } else {
    loginLocalAccount();
  }
}

function handleNicknameChange() {
  if (!userAccount.isLoggedIn || !nicknameInput) return;
  const newName = nicknameInput.value.trim();
  if (!newName || newName === userAccount.name) return;
  userAccount.name = newName;
  const account = accountDatabase[userAccount.username];
  if (account) {
    account.displayName = newName;
    accountDatabase[userAccount.username] = account;
    saveAccounts();
    saveCurrentUser();
    updateAccountStatus();
    refreshLeadersList();
  }
}

function t(key) {
  const lang = langSelect ? langSelect.value : 'ru';
  return translations[lang][key] || key;
}

function translatePage() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    el.placeholder = t(key);
  });
}

function openModal(modal) {
  if (!modal || !modalOverlay) return;
  modalOverlay.style.display = 'block';
  modal.style.display = 'block';
}

function closeModal(modal) {
  if (!modal || !modalOverlay) return;
  modalOverlay.style.display = 'none';
  modal.style.display = 'none';
}

function updateAccountStatus() {
  if (!accountStatus) return;
  if (userAccount.isLoggedIn) {
    accountStatus.textContent = `Аккаунт: ${userAccount.name}`;
  } else {
    accountStatus.textContent = `Гость: ${guestId}`;
  }
}

function updateFriendUI() {
  if (friendList) {
    friendList.innerHTML = userAccount.friends.map(f => `<li>${f}</li>`).join('') || `<li>${t('friendsDescription')}</li>`;
  }
  if (pendingInvites) {
    pendingInvites.innerHTML = userAccount.invites.map(inv => `<li>${inv} <button class="link-button" data-accept="${inv}">${t('acceptInvite')}</button></li>`).join('');
  }
}

function refreshLeadersList() {
  if (!leaderList) return;
  const base = [
    { name: 'Aren', score: 950 },
    { name: 'Roko', score: 820 },
    { name: 'Luna', score: 780 }
  ];
  const current = userAccount.isLoggedIn ? { name: userAccount.name, score: Math.floor(500 + Math.random() * 500) } : { name: guestId, score: Math.floor(200 + Math.random() * 300) };
  const list = [current, ...base];
  leaderList.innerHTML = list.map(item => `<li>${item.name} — ${item.score}</li>`).join('');
}

function setNicknameFieldState() {
  if (!nicknameInput) return;
  if (userAccount.isLoggedIn) {
    nicknameInput.disabled = false;
    nicknameInput.placeholder = t('nicknamePlaceholder');
    nicknameInput.value = userAccount.name;
  } else {
    nicknameInput.disabled = true;
    nicknameInput.value = guestId;
    nicknameInput.placeholder = t('guestNicknamePlaceholder');
  }
}

function loginGuest() {
  userAccount = { isLoggedIn: false, email: null, name: guestId, friends: [], invites: [] };
  localStorage.removeItem('evobloxCurrent');
  updateAccountStatus();
  translatePage();
  setNicknameFieldState();
  closeModal(authModal);
}

function sendInviteToFriend() {
  if (!friendInvite || !friendList) return;
  const target = friendInvite.value.trim();
  if (!target) return;
  if (!userAccount.isLoggedIn) {
    alert('Только зарегистрированный аккаунт может отправлять приглашения.');
    return;
  }
  const found = Object.values(accountDatabase).find(a => a.username === target.toLowerCase() || a.displayName.toLowerCase() === target.toLowerCase());
  if (!found) {
    alert('Игрок не найден. Введите правильный ник или username.');
    return;
  }
  if (!found.invites.includes(userAccount.name)) {
    found.invites.push(userAccount.name);
    accountDatabase[found.username] = found;
    saveAccounts();
    alert(`Приглашение отправлено ${found.displayName}`);
  }
  friendInvite.value = '';
}

function acceptInvite(sender) {
  if (!userAccount.isLoggedIn) return;
  if (!userAccount.invites.includes(sender)) return;
  if (!userAccount.friends.includes(sender)) {
    userAccount.friends.push(sender);
  }
  userAccount.invites = userAccount.invites.filter(inv => inv !== sender);
  const userData = accountDatabase[userAccount.username];
  if (userData) {
    userData.friends = userAccount.friends;
    userData.invites = userAccount.invites;
    accountDatabase[userAccount.username] = userData;
  }
  const senderAccount = Object.values(accountDatabase).find(a => a.displayName === sender || a.username === sender);
  if (senderAccount && !senderAccount.friends.includes(userAccount.name)) {
    senderAccount.friends.push(userAccount.name);
    accountDatabase[senderAccount.username] = senderAccount;
  }
  saveAccounts();
  saveCurrentUser();
  updateFriendUI();
}

function handlePendingClick(event) {
  const accept = event.target.dataset.accept;
  if (accept) {
    acceptInvite(accept);
  }
}

function startGame() {
  const nickname = nicknameInput.value.trim() || (userAccount.isLoggedIn ? userAccount.name : guestId);
  if (!nickname) {
    setMessage('Введите никнейм, чтобы начать игру.');
    return;
  }
  gameStarted = true;
  setMessage(`Joc pornit cu ${nickname} pe ${serverSelect ? serverSelect.value : 'server'}`);
  setStatus('Joc multiplayer local activ');
}

function applyBonusCode() {
  const code = bonusCodeInput ? bonusCodeInput.value.trim() : '';
  if (!code) {
    alert('Introdu un cod bonus.');
    return;
  }
  alert(`Codul ${code} a fost aplicat!`);
}

function openSettings() {
  openModal(settingsModal);
}

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  switch (key) {
    case 'arrowleft': players.player1.keys.left = true; break;
    case 'arrowright': players.player1.keys.right = true; break;
    case 'arrowup': players.player1.keys.up = true; break;
    case 'arrowdown': players.player1.keys.down = true; break;
    case 'a': players.player2.keys.left = true; break;
    case 'd': players.player2.keys.right = true; break;
    case 'w': players.player2.keys.up = true; break;
    case 's': players.player2.keys.down = true; break;
  }
});

window.addEventListener('keyup', (event) => {
  const key = event.key.toLowerCase();
  switch (key) {
    case 'arrowleft': players.player1.keys.left = false; break;
    case 'arrowright': players.player1.keys.right = false; break;
    case 'arrowup': players.player1.keys.up = false; break;
    case 'arrowdown': players.player1.keys.down = false; break;
    case 'a': players.player2.keys.left = false; break;
    case 'd': players.player2.keys.right = false; break;
    case 'w': players.player2.keys.up = false; break;
    case 's': players.player2.keys.down = false; break;
  }
});

if (startButton) startButton.addEventListener('click', startGame);
if (applyCodeButton) applyCodeButton.addEventListener('click', applyBonusCode);
if (btnLogin) btnLogin.addEventListener('click', () => showAuthModal('login'));
if (btnRegister) btnRegister.addEventListener('click', () => showAuthModal('register'));
if (authSubmit) authSubmit.addEventListener('click', handleAuthSubmit);
if (authToggleMode) authToggleMode.addEventListener('click', () => setAuthMode(authMode === 'login' ? 'register' : 'login'));
if (btnGuestLogin) btnGuestLogin.addEventListener('click', loginGuest);
if (nicknameInput) nicknameInput.addEventListener('blur', handleNicknameChange);
if (closeAuth) closeAuth.addEventListener('click', () => closeModal(authModal));
if (closeSettings) closeSettings.addEventListener('click', () => closeModal(settingsModal));
if (modalOverlay) modalOverlay.addEventListener('click', () => {
  closeModal(authModal);
  closeModal(settingsModal);
});
if (btnSettings) btnSettings.addEventListener('click', () => openModal(settingsModal));
if (langSelect) {
  langSelect.addEventListener('change', translatePage);
}
if (refreshLeaders) refreshLeaders.addEventListener('click', refreshLeadersList);
if (sendInvite) sendInvite.addEventListener('click', sendInviteToFriend);
if (pendingInvites) pendingInvites.addEventListener('click', handlePendingClick);
if (toggleWikiButton && wikiContent) {
  toggleWikiButton.addEventListener('click', () => {
    const isOpen = wikiContent.style.display === 'block';
    wikiContent.style.display = isOpen ? 'none' : 'block';
    toggleWikiButton.textContent = isOpen ? 'Открыть Wiki' : 'Закрыть Wiki';
  });
}

loadAccounts();
loadCurrentUser();
setNicknameFieldState();
updateAccountStatus();
translatePage();
refreshLeadersList();
updateFriendUI();

createPlayerSprite(players.player1);
createPlayerSprite(players.player2);
setStatus('Completează nickname și apasă Play.');
setMessage('Serverul este gata pentru un meci multiplayer.');
window.requestAnimationFrame(updateGame);
