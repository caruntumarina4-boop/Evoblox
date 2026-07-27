const socket = io('http://localhost:3000');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const uiLayer = document.getElementById('ui-layer');
const playMenu = document.getElementById('playMenu');
const rightMenu = document.getElementById('rightMenu');
const playBtn = document.getElementById('playBtn');

const splashScreen = document.getElementById('splashScreen');
const loadingScreen = document.getElementById('loadingScreen');
const loadingFill = document.getElementById('loadingFill');
const loadingPercentage = document.getElementById('loadingPercentage');
const loadingStatus = document.getElementById('loadingStatus');
const logoutBtn = document.getElementById('logoutBtn');

// Elemente Profil & UI
const displayUsername = document.getElementById('displayUsername');
const displayTag = document.getElementById('displayTag');
const displayLevel = document.getElementById('displayLevel');
const displayCoins = document.getElementById('displayCoins');
const playerNameInput = document.getElementById('playerNameInput');
const copyHudIdBtn = document.getElementById('copyHudIdBtn');
const xpContainer = document.getElementById('xpContainer');
const openProfileBtn = document.getElementById('openProfileBtn');

// Modale Autentificare
const authModal = document.getElementById('authModal');
const tabLoginBtn = document.getElementById('tabLoginBtn');
const tabSignupBtn = document.getElementById('tabSignupBtn');
const loginFormSection = document.getElementById('loginFormSection');
const signupFormSection = document.getElementById('signupFormSection');

const loginUsernameInput = document.getElementById('loginUsernameInput');
const loginPasswordInput = document.getElementById('loginPasswordInput');
const loginErrorMsg = document.getElementById('loginErrorMsg');
const submitLoginBtn = document.getElementById('submitLoginBtn');

const signupUsernameInput = document.getElementById('signupUsernameInput');
const signupPasswordInput = document.getElementById('signupPasswordInput');
const signupConfirmInput = document.getElementById('signupConfirmInput');
const signupErrorMsg = document.getElementById('signupErrorMsg');
const submitSignupBtn = document.getElementById('submitSignupBtn');
const closeAuthModalBtn = document.getElementById('closeAuthModalBtn');

// Schimbare Nickname & Parolă
const cnNewInput = document.getElementById('cnNewInput');
const cnPassInput = document.getElementById('cnPassInput');
const cnErrorMsg = document.getElementById('cnErrorMsg');
const submitChangeNickBtn = document.getElementById('submitChangeNickBtn');

const cpUsernameInput = document.getElementById('cpUsernameInput');
const cpOldPasswordInput = document.getElementById('cpOldPasswordInput');
const cpNewPasswordInput = document.getElementById('cpNewPasswordInput');
const cpErrorMsg = document.getElementById('cpErrorMsg');
const submitChangePassBtn = document.getElementById('submitChangePassBtn');

const profileModal = document.getElementById('profileModal');
const friendsModal = document.getElementById('friendsModal');

const openFriendsBtn = document.getElementById('openFriendsBtn');
const closeProfileBtn = document.getElementById('closeProfileBtn');
const closeFriendsBtn = document.getElementById('closeFriendsBtn');

const profileId = document.getElementById('profileId');
const profileLevel = document.getElementById('profileLevel');
const profileAvatarTag = document.getElementById('profileAvatarTag');

const friendIdInput = document.getElementById('friendIdInput');
const sendFriendReqBtn = document.getElementById('sendFriendReqBtn');
const friendMsg = document.getElementById('friendMsg');
const friendsList = document.getElementById('friendsList');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let isPlaying = false;
let currentAccount = null;

// Secvență la pornire: Splash -> Loading -> Verificare sesiune
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        splashScreen.style.opacity = '0';
        setTimeout(() => {
            splashScreen.style.display = 'none';
            startLoading();
        }, 500);
    }, 1000);
});

function startLoading() {
    loadingScreen.style.display = 'flex';
    let progress = 0;
    
    const loadingInterval = setInterval(() => {
        progress += 2;
        if (progress > 100) progress = 100;
        
        loadingFill.style.width = progress + '%';
        loadingPercentage.textContent = progress + '%';
        
        if (progress < 30) {
            loadingStatus.textContent = "Conectare la server & verificare bază de date...";
        } else if (progress < 70) {
            loadingStatus.textContent = "Încărcare active joc și resurse lume...";
        } else if (progress === 100) {
            loadingStatus.textContent = "Ready!";
            clearInterval(loadingInterval);
            
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    initAccountSystem();
                }, 500);
            }, 400);
        }
    }, 30);
}

function getDatabase() {
    return JSON.parse(localStorage.getItem('evoblox_server_db')) || {};
}

function saveDatabase(db) {
    localStorage.setItem('evoblox_server_db', JSON.stringify(db));
}

function generateUniqueId() {
    return Math.floor(Math.random() * 900000000 + 100000000).toString();
}

function initAccountSystem() {
    let db = getDatabase();
    let savedUsername = localStorage.getItem('evoblox_active_session');
    
    if (savedUsername && db[savedUsername]) {
        currentAccount = db[savedUsername];
        loadAccountToUI();
    } else {
        setGuestMode();
    }
}

function setGuestMode() {
    currentAccount = null;
    localStorage.removeItem('evoblox_active_session');
    
    let randomGuestNum = Math.floor(Math.random() * 90000000 + 10000000);
    let guestName = `Guest_${randomGuestNum}`;

    displayUsername.innerHTML = guestName;
    displayTag.innerHTML = "";
    displayLevel.textContent = "Guest mode";
    displayCoins.textContent = "0";
    playerNameInput.value = guestName;
    playerNameInput.disabled = true; 
    copyHudIdBtn.style.display = "none";
    openProfileBtn.style.display = "none";
    xpContainer.style.display = "none";
    logoutBtn.textContent = "Log In";

    uiLayer.style.display = 'block';
}

function loadAccountToUI() {
    displayUsername.innerHTML = `${currentAccount.username} <span class="tag">#${currentAccount.id}</span>`;
    displayLevel.textContent = `level ${currentAccount.level}`;
    displayCoins.textContent = currentAccount.coins;
    playerNameInput.value = currentAccount.username;
    playerNameInput.disabled = false; 
    copyHudIdBtn.style.display = "inline-block";
    openProfileBtn.style.display = "block";
    xpContainer.style.display = "block";
    logoutBtn.textContent = "Log Out";

    uiLayer.style.display = 'block';
}

// Comutare între tab-urile Login și Sign Up
tabLoginBtn.addEventListener('click', () => {
    tabLoginBtn.classList.add('active');
    tabSignupBtn.classList.remove('active');
    loginFormSection.style.display = 'flex';
    signupFormSection.style.display = 'none';
});

tabSignupBtn.addEventListener('click', () => {
    tabSignupBtn.classList.add('active');
    tabLoginBtn.classList.remove('active');
    signupFormSection.style.display = 'flex';
    loginFormSection.style.display = 'none';
});

// Acțiune Sign Up (Creare Cont)
submitSignupBtn.addEventListener('click', () => {
    let username = signupUsernameInput.value.trim();
    let password = signupPasswordInput.value;
    let confirmPass = signupConfirmInput.value;

    if (!username || !password) {
        signupErrorMsg.textContent = "Completează toate câmpurile!";
        return;
    }
    if (password !== confirmPass) {
        signupErrorMsg.textContent = "Parolele nu coincid!";
        return;
    }

    let db = getDatabase();
    if (db[username]) {
        signupErrorMsg.textContent = "Acest nickname este deja folosit!";
        return;
    }

    let newAccount = {
        id: generateUniqueId(),
        username: username,
        password: password,
        level: 1,
        coins: 2500,
        inventory: ["FireDragon"],
        friends: []
    };

    db[username] = newAccount;
    saveDatabase(db);

    currentAccount = newAccount;
    localStorage.setItem('evoblox_active_session', username);

    signupErrorMsg.textContent = "";
    signupUsernameInput.value = "";
    signupPasswordInput.value = "";
    signupConfirmInput.value = "";
    authModal.style.display = 'none';
    loadAccountToUI();
});

// Acțiune Login (Conectare)
submitLoginBtn.addEventListener('click', () => {
    let username = loginUsernameInput.value.trim();
    let password = loginPasswordInput.value;

    let db = getDatabase();
    if (!db[username]) {
        loginErrorMsg.textContent = "Nickname-ul nu există!";
        return;
    }

    if (db[username].password !== password) {
        loginErrorMsg.textContent = "Parolă incorectă!";
        return;
    }

    currentAccount = db[username];
    localStorage.setItem('evoblox_active_session', username);

    loginErrorMsg.textContent = "";
    loginUsernameInput.value = "";
    loginPasswordInput.value = "";
    authModal.style.display = 'none';
    loadAccountToUI();
});

// Schimbare Nickname din Profil
submitChangeNickBtn.addEventListener('click', () => {
    let newNick = cnNewInput.value.trim();
    let pass = cnPassInput.value;

    if (!newNick || !pass) {
        cnErrorMsg.textContent = "Completează toate câmpurile!";
        return;
    }

    if (pass !== currentAccount.password) {
        cnErrorMsg.textContent = "Parola este incorectă!";
        return;
    }

    let db = getDatabase();
    if (db[newNick]) {
        cnErrorMsg.textContent = "Acest nickname este deja folosit!";
        return;
    }

    delete db[currentAccount.username];
    currentAccount.username = newNick;
    db[newNick] = currentAccount;
    saveDatabase(db);

    localStorage.setItem('evoblox_active_session', newNick);
    loadAccountToUI();
    profileAvatarTag.textContent = `[${currentAccount.level}] [DD] ${currentAccount.username}`;

    cnErrorMsg.style.color = "#4caf50";
    cnErrorMsg.textContent = "Nickname schimbat cu succes!";
    cnNewInput.value = "";
    cnPassInput.value = "";

    setTimeout(() => { 
        cnErrorMsg.textContent = ""; 
        cnErrorMsg.style.color = "#ff5252"; 
    }, 2000);
});

// Schimbare Parolă din Profil
submitChangePassBtn.addEventListener('click', () => {
    let uname = cpUsernameInput.value.trim();
    let oldPass = cpOldPasswordInput.value;
    let newPass = cpNewPasswordInput.value;

    if (!uname || !oldPass || !newPass) {
        cpErrorMsg.textContent = "Completează toate câmpurile!";
        return;
    }

    if (uname !== currentAccount.username) {
        cpErrorMsg.textContent = "Nickname-ul introdus nu corespunde!";
        return;
    }

    if (oldPass !== currentAccount.password) {
        cpErrorMsg.textContent = "Parola veche este incorectă!";
        return;
    }

    let db = getDatabase();
    db[currentAccount.username].password = newPass;
    currentAccount.password = newPass;
    saveDatabase(db);

    cpErrorMsg.style.color = "#4caf50";
    cpErrorMsg.textContent = "Parola a fost schimbată cu succes!";
    cpUsernameInput.value = "";
    cpOldPasswordInput.value = "";
    cpNewPasswordInput.value = "";

    setTimeout(() => { 
        cpErrorMsg.textContent = ""; 
        cpErrorMsg.style.color = "#ff5252"; 
    }, 2000);
});

// Butonul Dinamic din stânga sus: Log In / Log Out
logoutBtn.addEventListener('click', () => {
    if (currentAccount) {
        setGuestMode();
    } else {
        loginUsernameInput.value = "";
        loginPasswordInput.value = "";
        loginErrorMsg.textContent = "";
        authModal.style.display = 'flex';
    }
});

closeAuthModalBtn.addEventListener('click', () => {
    authModal.style.display = 'none';
});

copyHudIdBtn.addEventListener('click', () => {
    if (currentAccount) {
        navigator.clipboard.writeText(currentAccount.id);
        copyHudIdBtn.textContent = "[✅]";
        setTimeout(() => { copyHudIdBtn.textContent = "[📋]"; }, 1500);
    }
});

openProfileBtn.addEventListener('click', () => {
    if (!currentAccount) return;
    profileAvatarTag.textContent = `[${currentAccount.level}] [DD] ${currentAccount.username}`;
    profileId.textContent = `#${currentAccount.id}`;
    profileLevel.textContent = currentAccount.level;
    profileModal.style.display = 'flex';
});
closeProfileBtn.addEventListener('click', () => profileModal.style.display = 'none');

document.getElementById('copyIdBtn').addEventListener('click', () => {
    if (currentAccount) {
        navigator.clipboard.writeText(currentAccount.id);
        let copyBtn = document.getElementById('copyIdBtn');
        copyBtn.textContent = "[copied!]";
        setTimeout(() => { copyBtn.textContent = "[copy]"; }, 1500);
    }
});

openFriendsBtn.addEventListener('click', () => {
    updateFriendsListUI();
    friendsModal.style.display = 'flex';
});
closeFriendsBtn.addEventListener('click', () => friendsModal.style.display = 'none');

sendFriendReqBtn.addEventListener('click', () => {
    if (!currentAccount) {
        friendMsg.textContent = "Trebuie să fii conectat pe un cont!";
        return;
    }
    let targetId = friendIdInput.value.trim();
    if (!targetId) {
        friendMsg.textContent = "Introdu un ID valid!";
        return;
    }

    if (targetId === currentAccount.id) {
        friendMsg.textContent = "Nu te poți adăuga singur!";
        return;
    }

    let db = getDatabase();
    let found = false;

    for (let uname in db) {
        if (db[uname].id === targetId) {
            found = true;
            break;
        }
    }

    if (found) {
        if (currentAccount.friends.includes(targetId)) {
            friendMsg.textContent = "Sunteți deja prieteni!";
        } else {
            currentAccount.friends.push(targetId);
            db[currentAccount.username] = currentAccount;
            saveDatabase(db);
            friendMsg.style.color = "#4caf50";
            friendMsg.textContent = "Player found. Friend request accepted!";
            friendIdInput.value = "";
            updateFriendsListUI();
        }
    } else {
        friendMsg.style.color = "#ff5252";
        friendMsg.textContent = "ID-ul introdus nu există în baza de date!";
    }
});

function updateFriendsListUI() {
    friendsList.innerHTML = "";
    if (!currentAccount || !currentAccount.friends || currentAccount.friends.length === 0) {
        friendsList.innerHTML = `<span class="empty-text">Niciun prieten adăugat.</span>`;
        return;
    }
    let db = getDatabase();
    currentAccount.friends.forEach(fId => {
        let fName = "Unknown Player";
        for (let uname in db) {
            if (db[uname].id === fId) {
                fName = uname;
                break;
            }
        }
        let li = document.createElement('li');
        li.style.padding = "5px 0";
        li.style.borderBottom = "1px solid #222";
        li.innerHTML = `🟢 <strong>${fName}</strong> (ID: ${fId}) - Online`;
        friendsList.appendChild(li);
    });
}

// Acțiunea butonului PLAY (trimite datele și la server)
playBtn.addEventListener('click', () => {
    if (currentAccount) {
        let newName = playerNameInput.value.trim();
        if (newName && newName !== currentAccount.username) {
            let db = getDatabase();
            if (!db[newName]) {
                delete db[currentAccount.username];
                currentAccount.username = newName;
                db[newName] = currentAccount;
                saveDatabase(db);
                localStorage.setItem('evoblox_active_session', newName);
                loadAccountToUI();
            }
        }
    }

    const playerName = playerNameInput.value;
    if (!playerName) {
        alert('Te rog introdu un nume!');
        return;
    }

    // Trimitem serverului faptul că am intrat în joc
    socket.emit('join_game', { name: playerName });
    console.log("Am trimis datele către server!");

    playMenu.style.display = 'none';
    rightMenu.style.display = 'none';
    isPlaying = true;
});

function gameLoop() {
    let skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#5bb3cc');
    skyGradient.addColorStop(1, '#a6d9e8');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#8daab5';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 100);
    ctx.lineTo(200, canvas.height - 400);
    ctx.lineTo(500, canvas.height - 100);
    ctx.lineTo(800, canvas.height - 350);
    ctx.lineTo(canvas.width, canvas.height - 100);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.fill();

    const groundHeight = 150;
    const groundY = canvas.height - groundHeight;

    ctx.fillStyle = '#5c9a2c';
    ctx.fillRect(0, groundY, canvas.width, 20);

    ctx.fillStyle = '#7a5a3a';
    ctx.fillRect(0, groundY + 20, canvas.width, groundHeight - 20);

    if (isPlaying) {
        ctx.fillStyle = '#4caf50';
        ctx.beginPath();
        ctx.arc(canvas.width / 2, groundY - 20, 20, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(canvas.width / 2 + 10, groundY - 25, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFC107';
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 + 18, groundY - 25);
        ctx.lineTo(canvas.width / 2 + 30, groundY - 20);
        ctx.lineTo(canvas.width / 2 + 18, groundY - 15);
        ctx.fill();

        let renderName = currentAccount ? currentAccount.username : (playerNameInput.value.trim() || "Guest");
        
        // Verificăm dacă jucătorul este în lista de prieteni pentru a adăuga emoji-ul 🤝
        if (currentAccount && currentAccount.friends && currentAccount.friends.length > 0) {
            // Dacă ai ID-uri de prieteni în listă, poți adăuga logica de verificare direct aici
        }

        ctx.fillStyle = 'white';
        ctx.font = '16px Impact';
        ctx.textAlign = 'center';
        ctx.fillText(renderName, canvas.width / 2, groundY - 50);
    }

    requestAnimationFrame(gameLoop);
}

gameLoop();