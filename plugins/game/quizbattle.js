/**
✧ Name    : quizbattle
✧ Category: game
✧ Note    : Arsitektur (Rich HTML + WebSocket relay pub/sub, host-authoritative
✧           state, reconnect otomatis, identity WhatsApp) mengikuti pola
✧           battleshipmp.js. Plugin ini berdiri sendiri, tidak mengubah
✧           battleshipmp.js sama sekali.
**/

'use strict'

const config = require('../../config')
const { proto, generateWAMessageFromContent, generateMessageIDV2 } = require('baileys')

/* =========================================================
 * pluginConfig
 * ========================================================= */

const pluginConfig = {
    name: 'quizbattle',
    alias: ['quizbattle', 'qb', 'quizmp'],
    category: 'game',
    description: 'Quiz Battle multiplayer realtime antar perangkat via WebSocket.',
    usage: '.quizbattle',
    example: '.quizbattle',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

/* =========================================================
 * CONFIG INTERNAL
 *
 * Reuse WS relay (piesocket pub/sub, tanpa backend custom)
 * dan WEB_URL yang sama seperti BattleshipMP karena memang
 * kompatibel: satu channel relay dipakai bareng, tiap pesan
 * disaring di sisi client lewat field `room`, dan setiap
 * game (battleshipmp vs quizbattle) juga sudah dipisah lewat
 * prefix nama event (`bsmp_*` vs `quiz_*`) supaya tidak
 * pernah saling tabrakan walau lewat channel yang sama.
 * ========================================================= */

const WEB_URL =
    'https://alwayslennz-dev.my.id'
const WS_URL =
    'wss://free.blr2.piesocket.com/v3/1?api_key=ISI_API_KEY_KAMU&notify_self=1'
const BOT_JID =
    '0@bot'

/* =========================================================
 * HTML / SCRIPT ESCAPE (identik dengan pola BattleshipMP)
 * ========================================================= */

function escapeHtml(text = '') {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}
function escapeForScript(text = '') {
    return JSON.stringify(String(text))
        .replace(/</g, '\\u003C')
        .replace(/>/g, '\\u003E')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029')
}
function escapeJsonForScript(json = '[]') {
    return String(json)
        .replace(/</g, '\\u003C')
        .replace(/>/g, '\\u003E')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029')
}

/* =========================================================
 * WHATSAPP IDENTITY (identik dengan pola BattleshipMP)
 * ========================================================= */

function jidToPhoneNumber(jid = '') {
    const raw = String(jid || '').split('@')[0].split(':')[0]
    const digits = raw.replace(/\D/g, '')
    if (!digits) return ''
    return '+' + digits
}
function getWhatsAppIdentity(m) {
    const pushName = String(m?.pushName || m?.pushname || m?.notifyName || '').trim()
    if (pushName) return pushName.slice(0, 20)
    const jid = m?.sender || m?.key?.participant || m?.key?.remoteJid || m?.chat || ''
    const phone = jidToPhoneNumber(jid)
    if (phone) return phone
    return 'Player'
}

/* =========================================================
 * BANK SOAL
 *
 * Dipisah ke file JSON eksternal (src/data/quizbattle.json)
 * supaya soal bisa ditambah/diubah tanpa menyentuh source
 * plugin. Host yang mengacak urutan lalu membagikan soal yang
 * identik ke seluruh pemain lewat broadcast quiz_state, jadi
 * semua client selalu melihat pertanyaan yang sama.
 * ========================================================= */

const QUESTION_BANK = require('../../src/data/quizbattle.json')

/* =========================================================
 * BUILD HTML
 * ========================================================= */

function createGameHTML(playerIdentity = '', questions = []) {
    const safeWs = escapeHtml(WS_URL)
    const safeIdentity = escapeForScript(playerIdentity)
    const safeQuestions = escapeJsonForScript(JSON.stringify(questions))

    return `
<style>
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
html, body { margin:0; padding:0; background:transparent; color:#fff; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif; }
button, input { font-family: inherit; }
button { user-select:none; cursor:pointer; }
.wrap { width:100%; max-width:460px; margin:auto; padding:8px; }
.card { position:relative; overflow:hidden; padding:16px; border-radius:20px; background:linear-gradient(145deg,rgba(255,255,255,.095),rgba(255,255,255,.035)); border:1px solid rgba(255,255,255,.12); box-shadow:0 8px 24px rgba(0,0,0,.35); backdrop-filter:blur(14px); }
.page { display:none; }
.page.show { display:block; }
.title { font-size:22px; font-weight:800; letter-spacing:.5px; text-align:center; margin:2px 0 2px; }
.subtitle { font-size:12.5px; color:#b7c2d9; text-align:center; margin-bottom:14px; }
.row { display:flex; align-items:center; gap:8px; }
.row-between { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.status-bar { display:flex; align-items:center; justify-content:center; gap:6px; font-size:11.5px; color:#b7c2d9; margin-bottom:10px; }
.dot { width:8px; height:8px; border-radius:50%; background:#666; box-shadow:0 0 6px #666; }
.dot.online { background:#3ddc84; box-shadow:0 0 8px #3ddc84; }
.dot.error { background:#ff5470; box-shadow:0 0 8px #ff5470; }
.dot.connecting { background:#ffce54; box-shadow:0 0 8px #ffce54; }
.input { width:100%; padding:13px 14px; border-radius:14px; border:1px solid rgba(255,255,255,.16); background:rgba(255,255,255,.06); color:#fff; font-size:15px; outline:none; margin-bottom:10px; }
.input:focus { border-color:#7c5cff; }
.btn { width:100%; padding:14px; border-radius:14px; border:none; font-size:15px; font-weight:700; letter-spacing:.3px; margin-bottom:8px; transition:transform .12s ease; }
.btn:active { transform:scale(.97); }
.btn-primary { background:linear-gradient(135deg,#7c5cff,#5a3fe0); color:#fff; box-shadow:0 6px 18px rgba(124,92,255,.4); }
.btn-secondary { background:rgba(255,255,255,.08); color:#fff; border:1px solid rgba(255,255,255,.16); }
.btn-danger { background:rgba(255,84,112,.14); color:#ff8fa3; border:1px solid rgba(255,84,112,.3); }
.btn:disabled { opacity:.45; }
.error-text { color:#ff8fa3; font-size:12px; text-align:center; min-height:16px; margin:2px 0 8px; }
.you-are { text-align:center; font-size:12.5px; color:#d7dcf5; background:rgba(255,255,255,.05); border-radius:12px; padding:8px; margin-bottom:12px; }
.you-are b { color:#a58bff; }
.room-code-box { text-align:center; background:rgba(124,92,255,.14); border:1px dashed rgba(124,92,255,.5); border-radius:14px; padding:10px; margin-bottom:12px; }
.room-code-label { font-size:11px; color:#b7c2d9; letter-spacing:1px; }
.room-code-value { font-size:26px; font-weight:800; letter-spacing:4px; color:#c6b6ff; }
.player-list { display:flex; flex-direction:column; gap:6px; margin-bottom:10px; max-height:260px; overflow-y:auto; }
.player-row { display:flex; align-items:center; justify-content:space-between; gap:8px; background:rgba(255,255,255,.05); border-radius:12px; padding:9px 12px; font-size:13.5px; }
.player-row.me { border:1px solid rgba(124,92,255,.5); }
.player-name { display:flex; align-items:center; gap:6px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.tag { font-size:10px; padding:2px 6px; border-radius:8px; background:rgba(255,255,255,.1); color:#b7c2d9; }
.tag.host { background:rgba(255,206,84,.18); color:#ffce54; }
.tag.off { background:rgba(255,84,112,.15); color:#ff8fa3; }
.count-text { text-align:center; font-size:12px; color:#b7c2d9; margin-bottom:10px; }
.waiting-text { text-align:center; font-size:12px; color:#ffce54; margin-bottom:8px; }
.log { font-size:11px; color:#8f9ac2; max-height:60px; overflow-y:auto; margin-top:10px; border-top:1px solid rgba(255,255,255,.08); padding-top:6px; }
.log div { margin-bottom:3px; }
.spectator-badge { text-align:center; font-size:11px; color:#ffce54; background:rgba(255,206,84,.1); border-radius:10px; padding:5px; margin-bottom:8px; }
.score-strip { display:flex; gap:6px; overflow-x:auto; padding-bottom:6px; margin-bottom:10px; }
.score-pill { flex:0 0 auto; font-size:11px; background:rgba(255,255,255,.06); border-radius:10px; padding:5px 9px; white-space:nowrap; }
.score-pill.leader { background:rgba(255,206,84,.16); color:#ffce54; }
.qa-header { text-align:center; font-size:11.5px; color:#b7c2d9; margin-bottom:6px; }
.timer-wrap { display:flex; justify-content:center; margin:6px 0 10px; }
.timer-circle { width:64px; height:64px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:800; border:4px solid rgba(124,92,255,.4); color:#fff; background:rgba(124,92,255,.08); }
.timer-circle.low { border-color:rgba(255,84,112,.6); color:#ff8fa3; }
.question-text { text-align:center; font-size:16px; font-weight:700; line-height:1.4; margin-bottom:14px; min-height:44px; }
.options-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px; }
.opt-btn { padding:14px 8px; border-radius:14px; border:1px solid rgba(255,255,255,.16); background:rgba(255,255,255,.06); color:#fff; font-size:13.5px; font-weight:600; min-height:56px; }
.opt-btn.selected { border-color:#7c5cff; background:rgba(124,92,255,.22); }
.opt-btn.correct { border-color:#3ddc84; background:rgba(61,220,132,.22); }
.opt-btn.wrong { border-color:#ff5470; background:rgba(255,84,112,.2); }
.answered-text { text-align:center; font-size:12.5px; color:#3ddc84; min-height:16px; margin-bottom:6px; }
.reveal-box { background:rgba(0,0,0,.25); border-radius:14px; padding:10px; margin-top:6px; }
.reveal-answer { text-align:center; font-size:13px; font-weight:700; color:#3ddc84; margin-bottom:8px; }
.reveal-row { display:flex; justify-content:space-between; font-size:12px; padding:4px 2px; }
.reveal-row .pts { color:#a58bff; font-weight:700; }
.podium { display:flex; align-items:flex-end; justify-content:center; gap:8px; margin:10px 0 14px; }
.podium-item { text-align:center; font-size:11.5px; }
.podium-name { font-weight:700; margin-bottom:2px; max-width:80px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.podium-bar { border-radius:10px 10px 0 0; background:linear-gradient(180deg,rgba(124,92,255,.5),rgba(124,92,255,.15)); width:64px; }
.podium-1 .podium-bar { height:74px; background:linear-gradient(180deg,rgba(255,206,84,.6),rgba(255,206,84,.15)); }
.podium-2 .podium-bar { height:54px; }
.podium-3 .podium-bar { height:38px; }
.stats-box { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px; }
.stat-cell { background:rgba(255,255,255,.05); border-radius:12px; padding:9px; text-align:center; }
.stat-cell .num { font-size:18px; font-weight:800; }
.stat-cell .lbl { font-size:10.5px; color:#b7c2d9; }
.rank-list { max-height:180px; overflow-y:auto; margin-bottom:10px; }
.toast-wrap { position:fixed; left:0; right:0; bottom:14px; display:flex; justify-content:center; z-index:50; pointer-events:none; }
.toast { background:rgba(20,20,30,.92); border:1px solid rgba(255,255,255,.14); color:#fff; font-size:12.5px; padding:9px 14px; border-radius:12px; max-width:88%; text-align:center; box-shadow:0 6px 18px rgba(0,0,0,.4); }
.footer { text-align:center; font-size:10.5px; color:#6f7aa0; margin-top:8px; }
.link-btn { background:none; border:none; color:#a58bff; font-size:12.5px; text-decoration:underline; padding:6px; }
</style>

<div class="wrap">
<div class="card">
  <div class="status-bar"><span class="dot" id="wsDot"></span><span id="wsText">OFFLINE</span></div>

  <div class="page show" id="page-login">
    <div class="title">⚡ QUIZ BATTLE</div>
    <div class="subtitle">Realtime Multiplayer Quiz</div>
    <input class="input" id="nameInput" maxlength="20" placeholder="Nama pemain..." />
    <button class="btn btn-primary" id="loginBtn">MASUK</button>
    <div class="error-text" id="loginError"></div>
  </div>

  <div class="page" id="page-home">
    <div class="title">⚡ QUIZ BATTLE</div>
    <div class="you-are" id="youAreHome"></div>
    <button class="btn btn-primary" id="createBtn">＋ BUAT ROOM</button>
    <button class="btn btn-secondary" id="goJoinBtn">🔑 JOIN ROOM</button>
    <button class="link-btn" id="changeNameBtn">✎ Ganti Nama</button>
  </div>

  <div class="page" id="page-join">
    <div class="title">🔑 JOIN ROOM</div>
    <input class="input" id="roomInput" maxlength="6" placeholder="Kode room..." style="text-transform:uppercase;text-align:center;letter-spacing:3px;font-weight:700;" />
    <button class="btn btn-primary" id="joinBtn">MASUK ROOM</button>
    <div class="error-text" id="joinError"></div>
    <button class="link-btn" id="backHomeFromJoinBtn">← Kembali</button>
  </div>

  <div class="page" id="page-lobby">
    <div class="title">⚡ QUIZ BATTLE</div>
    <div class="room-code-box">
      <div class="room-code-label">ROOM CODE</div>
      <div class="room-code-value" id="lobbyRoomCode">------</div>
    </div>
    <div class="row" style="margin-bottom:10px;">
      <button class="btn btn-secondary" id="copyRoomBtn" style="margin-bottom:0;">📋 SALIN KODE</button>
    </div>
    <div class="player-list" id="lobbyPlayers"></div>
    <div class="count-text" id="lobbyCount">0/8 PEMAIN</div>
    <div class="waiting-text" id="lobbyWaiting" style="display:none;">Menunggu pemain lain...</div>
    <button class="btn btn-primary" id="startBtn" style="display:none;">⚡ MULAI QUIZ</button>
    <button class="btn btn-danger" id="leaveLobbyBtn">🚪 KELUAR ROOM</button>
    <div class="log" id="lobbyLog"></div>
  </div>

  <div class="page" id="page-game">
    <div class="qa-header" id="gameHeader">ROOM: ------ · SOAL 0/10</div>
    <div class="spectator-badge" id="spectatorBadge" style="display:none;">👁 MODE PENONTON</div>
    <div class="score-strip" id="scoreStrip"></div>
    <div class="timer-wrap"><div class="timer-circle" id="timerCircle">10</div></div>
    <div class="question-text" id="questionText">Menunggu soal...</div>
    <div class="options-grid" id="optionsGrid">
      <button class="opt-btn" id="opt0" data-idx="0"></button>
      <button class="opt-btn" id="opt1" data-idx="1"></button>
      <button class="opt-btn" id="opt2" data-idx="2"></button>
      <button class="opt-btn" id="opt3" data-idx="3"></button>
    </div>
    <div class="answered-text" id="answeredText"></div>
    <div class="reveal-box" id="revealBox" style="display:none;">
      <div class="reveal-answer" id="revealAnswer"></div>
      <div id="revealList"></div>
    </div>
    <button class="btn btn-secondary" id="leaveGameBtn" style="margin-top:10px;">🚪 KELUAR ROOM</button>
  </div>

  <div class="page" id="page-result">
    <div class="title">🏆 QUIZ SELESAI</div>
    <div class="podium" id="resultPodium"></div>
    <div class="stats-box" id="resultStats"></div>
    <div class="rank-list" id="resultList"></div>
    <button class="btn btn-primary" id="rematchBtn">↻ REMATCH</button>
    <button class="btn btn-danger" id="leaveResultBtn">🚪 KELUAR ROOM</button>
  </div>

  <div class="footer">QuizBattle · Realtime Multiplayer<br>Tap jawabanmu secepat mungkin ⚡</div>
</div>
</div>
<div class="toast-wrap" id="toastWrap"></div>

<script>
(function () {
'use strict';

/* ========================================================
 * CONFIG
 * ======================================================== */

var WS_URL = '${safeWs}';
var SERVER_PLAYER_NAME = ${safeIdentity};
var QUESTION_BANK = ${safeQuestions};

var ROOM_MAX = 8;
var MIN_PLAYERS = 2;
var TOTAL_QUESTIONS = 10;
var QUESTION_DURATION_MS = 10000;
var REVEAL_DELAY_MS = 4000;
var HOST_HEARTBEAT_MS = 4000;
var HOST_TIMEOUT_MS = 13000;
var PRESENCE_PING_MS = 8000;
var PRESENCE_PRUNE_MS = 6000;
var PRESENCE_STALE_MS = 20000;
var JOIN_TIMEOUT_MS = 6000;
var NAME_CLAIM_WINDOW_MS = 900;
var PRESENCE_INTERVAL_MS = 20000;
var PRESENCE_STALE_MS = 65000;

/* ========================================================
 * DOM
 * ======================================================== */

function $(id) { return document.getElementById(id); }
var wsDot = $('wsDot'), wsText = $('wsText');
var nameInput = $('nameInput'), loginBtn = $('loginBtn'), loginError = $('loginError');
var youAreHome = $('youAreHome'), createBtn = $('createBtn'), goJoinBtn = $('goJoinBtn'), changeNameBtn = $('changeNameBtn');
var roomInput = $('roomInput'), joinBtn = $('joinBtn'), joinError = $('joinError'), backHomeFromJoinBtn = $('backHomeFromJoinBtn');
var lobbyRoomCode = $('lobbyRoomCode'), copyRoomBtn = $('copyRoomBtn'), lobbyPlayers = $('lobbyPlayers');
var lobbyCount = $('lobbyCount'), lobbyWaiting = $('lobbyWaiting'), startBtn = $('startBtn'), leaveLobbyBtn = $('leaveLobbyBtn'), lobbyLog = $('lobbyLog');
var gameHeader = $('gameHeader'), spectatorBadge = $('spectatorBadge'), scoreStrip = $('scoreStrip');
var timerCircle = $('timerCircle'), questionText = $('questionText'), optionsGrid = $('optionsGrid');
var answeredText = $('answeredText'), revealBox = $('revealBox'), revealAnswer = $('revealAnswer'), revealList = $('revealList');
var leaveGameBtn = $('leaveGameBtn');
var resultPodium = $('resultPodium'), resultStats = $('resultStats'), resultList = $('resultList');
var rematchBtn = $('rematchBtn'), leaveResultBtn = $('leaveResultBtn');
var toastWrap = $('toastWrap');
var optButtons = [$('opt0'), $('opt1'), $('opt2'), $('opt3')];

/* ========================================================
 * PLAYER ID (persisten via localStorage, identik pola
 * BattleshipMP supaya identitas & room bertahan lintas
 * reload / reconnect)
 * ======================================================== */

var playerId = '';
try { playerId = localStorage.getItem('quizbattle_player_id'); } catch (e) {}
if (!playerId) {
    playerId = 'q_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    try { localStorage.setItem('quizbattle_player_id', playerId); } catch (e) {}
}

function loadSession() {
    try {
        var raw = localStorage.getItem('quizbattle_session');
        if (!raw) return null;
        var parsed = JSON.parse(raw);
        if (parsed && parsed.room && parsed.name) return parsed;
    } catch (e) {}
    return null;
}
function saveSession() {
    try {
        localStorage.setItem('quizbattle_session', JSON.stringify({ room: room, name: playerName }));
    } catch (e) {}
}
function clearSession() {
    try { localStorage.removeItem('quizbattle_session'); } catch (e) {}
}

/* ========================================================
 * STATE
 * ======================================================== */

var ws = null;
var room = '';
var playerName = '';
var loggedIn = false;
var isHost = false;
var state = null;
var manualLeave = false;
var reconnectTimer = null;
var reconnectAttempts = 0;
var pendingJoinRoom = '';
var joinTimeoutHandle = null;
var myAnsweredIndex = null;
var myAnsweredQuestionIndex = -1;
var lastHostSeenTs = 0;
var hostQuestionTimeout = null;
var hostRevealTimeout = null;
var hostHeartbeatTimer = null;
var hostWatchdogTimer = null;
var presencePingTimer = null;
var presencePruneTimer = null;
var timerRenderInterval = null;

/*
 * GLOBAL NAME REGISTRY
 *
 * Koneksi WS terpisah yang dibuka begitu widget dimuat (tidak
 * menunggu bikin/join room), khusus untuk klaim & cek keunikan
 * nama secara GLOBAL -- lintas room, meniru persis protokol
 * klaim nama di battleshipmp.js (bsmp_name_claim/reject) tapi
 * dengan prefix quiz_ supaya tidak pernah tabrakan di channel
 * relay yang sama.
 */
var globalWs = null;
var globalManualClose = false;
var globalReconnectTimer = null;
var globalReconnectAttempts = 0;
var activeNames = new Map();
var pendingClaim = null;
var presenceHeartbeat = null;
var myNameKey = '';

/* ========================================================
 * HELPERS
 * ======================================================== */

function randomRoom() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var out = '';
    for (var i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
}

/*
 * normalizeName dipakai host untuk membandingkan nama secara
 * case-insensitive & tanpa peduli spasi ganda, supaya "Xyrann",
 * "xyrann", dan " Xyrann  " dianggap nama yang sama saat
 * mengecek duplikat di dalam satu room (lihat handleJoin).
 */
function normalizeName(raw) {
    return String(raw || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

/* ========================================================
 * GLOBAL CONNECTION (khusus name-claim, terpisah dari koneksi
 * per-room). Dibuka begitu widget dimuat supaya registry nama
 * aktif sudah terisi sebelum pemain menekan MASUK.
 * ======================================================== */

function sendGlobal(data) {
    if (!globalWs || globalWs.readyState !== WebSocket.OPEN) return false;
    try { globalWs.send(JSON.stringify(data)); return true; } catch (e) { return false; }
}
function connectGlobal() {
    globalManualClose = false;
    if (globalWs) { try { globalWs.close(); } catch (e) {} }
    try {
        globalWs = new WebSocket(WS_URL);
        globalWs.onopen = function () {
            globalReconnectAttempts = 0;
            if (loggedIn && playerName) {
                sendGlobal({ type: 'quiz_global_join', playerId: playerId, name: playerName });
            }
        };
        globalWs.onmessage = function (event) {
            var data;
            try { data = JSON.parse(event.data); } catch (e) { return; }
            handleGlobalMessage(data);
        };
        globalWs.onerror = function () {};
        globalWs.onclose = function () {
            if (!globalManualClose) scheduleGlobalReconnect();
        };
    } catch (e) {
        scheduleGlobalReconnect();
    }
}
function scheduleGlobalReconnect() {
    if (globalReconnectTimer) return;
    var delay = Math.min(1000 * Math.pow(2, globalReconnectAttempts), 10000);
    globalReconnectAttempts++;
    globalReconnectTimer = setTimeout(function () { globalReconnectTimer = null; connectGlobal(); }, delay);
}

/* ========================================================
 * NAME CLAIM PROTOCOL (identik pola battleshipmp.js)
 *
 * Tidak ada backend custom di relay pub/sub ini, jadi setiap
 * client bertindak sebagai penjaga bersama: siapa pun yang
 * sudah aktif memakai sebuah nama WAJIB menolak klaim baru
 * untuk nama yang sama. Tie-break memakai timestamp lalu
 * playerId supaya semua client mengambil keputusan yang sama
 * untuk klaim yang datang hampir bersamaan.
 * ======================================================== */

function handleGlobalMessage(data) {
    if (!data || !data.type) return;
    if (data.type === 'quiz_global_join') {
        if (!data.playerId || !data.name) return;
        var key = normalizeName(data.name);
        if (!key) return;
        activeNames.set(key, { playerId: data.playerId, name: data.name, ts: Date.now() });
        return;
    }
    if (data.type === 'quiz_global_leave') {
        if (!data.playerId) return;
        activeNames.forEach(function (entry, key) {
            if (entry.playerId === data.playerId) activeNames.delete(key);
        });
        return;
    }
    if (data.type === 'quiz_name_claim') {
        handleIncomingNameClaim(data);
        return;
    }
    if (data.type === 'quiz_name_reject') {
        if (pendingClaim && data.targetPlayerId === playerId && data.key === pendingClaim.key) {
            pendingClaim.rejected = true;
        }
        return;
    }
}
function claimHasPriority(a, b) {
    if (a.ts !== b.ts) return a.ts < b.ts;
    return String(a.playerId) < String(b.playerId);
}
function handleIncomingNameClaim(data) {
    if (!data.key || !data.playerId || data.playerId === playerId) return;
    if (loggedIn && myNameKey === data.key) {
        sendGlobal({ type: 'quiz_name_reject', key: data.key, targetPlayerId: data.playerId, reason: 'active' });
        return;
    }
    var existing = activeNames.get(data.key);
    if (existing && existing.playerId !== data.playerId) {
        sendGlobal({ type: 'quiz_name_reject', key: data.key, targetPlayerId: data.playerId, reason: 'active' });
        return;
    }
    if (pendingClaim && pendingClaim.key === data.key) {
        var incoming = { ts: Number(data.ts) || Date.now(), playerId: data.playerId };
        if (claimHasPriority(pendingClaim, incoming)) {
            sendGlobal({ type: 'quiz_name_reject', key: data.key, targetPlayerId: data.playerId, reason: 'race' });
        } else {
            pendingClaim.rejected = true;
        }
    }
}
function isNameTakenLocally(key, excludePlayerId) {
    var entry = activeNames.get(key);
    if (!entry) return false;
    if (excludePlayerId && entry.playerId === excludePlayerId) return false;
    return true;
}
function attemptNameClaim(display, key) {
    return new Promise(function (resolve) {
        var claim = { key: key, ts: Date.now(), playerId: playerId, rejected: false };
        pendingClaim = claim;
        sendGlobal({ type: 'quiz_name_claim', key: key, name: display, playerId: playerId, ts: claim.ts });
        setTimeout(function () {
            var won = pendingClaim === claim && !claim.rejected;
            if (pendingClaim === claim) pendingClaim = null;
            resolve(won);
        }, NAME_CLAIM_WINDOW_MS);
    });
}
function startPresenceHeartbeat() {
    stopPresenceHeartbeat();
    presenceHeartbeat = setInterval(function () {
        if (loggedIn && playerName) sendGlobal({ type: 'quiz_global_join', playerId: playerId, name: playerName });
    }, PRESENCE_INTERVAL_MS);
}
function stopPresenceHeartbeat() {
    if (presenceHeartbeat) { clearInterval(presenceHeartbeat); presenceHeartbeat = null; }
}
function purgeStaleNames() {
    var now = Date.now();
    activeNames.forEach(function (entry, key) {
        if (entry.playerId === playerId) return;
        if (now - entry.ts > PRESENCE_STALE_MS) activeNames.delete(key);
    });
}
setInterval(purgeStaleNames, PRESENCE_INTERVAL_MS);
function isMeSpectator() {
    if (!state) return false;
    var s = state.spectators || [];
    for (var i = 0; i < s.length; i++) if (s[i].id === playerId) return true;
    return false;
}
function findMePlayer() {
    if (!state) return null;
    var p = state.players || [];
    for (var i = 0; i < p.length; i++) if (p[i].id === playerId) return p[i];
    return null;
}
function showToast(text) {
    var el = document.createElement('div');
    el.className = 'toast';
    el.textContent = text;
    toastWrap.appendChild(el);
    setTimeout(function () { try { toastWrap.removeChild(el); } catch (e) {} }, 2600);
}
function addLog(text) {
    var el = document.createElement('div');
    el.textContent = text;
    lobbyLog.appendChild(el);
    while (lobbyLog.children.length > 6) lobbyLog.removeChild(lobbyLog.firstChild);
    lobbyLog.scrollTop = lobbyLog.scrollHeight;
}
function setConnection(cls, text) {
    wsDot.className = 'dot' + (cls ? ' ' + cls : '');
    wsText.textContent = text;
}
function showPage(name) {
    var pages = ['login', 'home', 'join', 'lobby', 'game', 'result'];
    for (var i = 0; i < pages.length; i++) {
        var el = $('page-' + pages[i]);
        if (el) el.classList.toggle('show', pages[i] === name);
    }
}

/* ========================================================
 * SEND / CONNECT (pola relay pub/sub identik BattleshipMP:
 * satu channel WS dipakai bareng, disaring lewat field room
 * + prefix quiz_ pada tiap type)
 * ======================================================== */

function send(data) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    try { ws.send(JSON.stringify(data)); return true; } catch (e) { return false; }
}
function connect() {
    if (!room) return;
    manualLeave = false;
    if (ws) { try { ws.close(); } catch (e) {} }
    setConnection('connecting', 'CONNECTING');
    try {
        ws = new WebSocket(WS_URL);
        ws.onopen = function () {
            reconnectAttempts = 0;
            setConnection('online', 'ONLINE');
            send({ type: 'quiz_join', room: room, playerId: playerId, name: playerName });
            startPresencePing();
        };
        ws.onmessage = function (event) {
            var data;
            try { data = JSON.parse(event.data); } catch (e) { return; }
            handleMessage(data);
        };
        ws.onerror = function () { setConnection('error', 'ERROR'); };
        ws.onclose = function () {
            setConnection('error', 'CLOSED');
            if (room && !manualLeave) {
                showToast('🔄 MENGHUBUNGKAN KEMBALI...');
                scheduleReconnect();
            }
        };
    } catch (e) {
        setConnection('error', 'FAILED');
        scheduleReconnect();
    }
}
function scheduleReconnect() {
    if (reconnectTimer) return;
    var delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
    reconnectAttempts++;
    reconnectTimer = setTimeout(function () { reconnectTimer = null; connect(); }, delay);
}

/* ========================================================
 * LOGIN
 * ======================================================== */

async function performLogin() {
    /*
     * Nama WAJIB diisi sendiri oleh pemain lewat halaman Login.
     * Tidak ada lagi fallback otomatis ke pushName WhatsApp, dan
     * nama dicek dulu ke registry global (lintas room) sebelum
     * diterima -- lihat GLOBAL NAME REGISTRY di atas.
     */
    var display = String(nameInput.value || '').trim().replace(/\s+/g, ' ').slice(0, 20);
    if (!display) {
        if (loginError) loginError.textContent = 'Nama tidak boleh kosong.';
        return;
    }
    var key = normalizeName(display);
    if (loginError) loginError.textContent = '';
    loginBtn.disabled = true;
    loginBtn.textContent = 'MEMERIKSA NAMA...';

    if (!globalWs || globalWs.readyState !== WebSocket.OPEN) {
        connectGlobal();
        await new Promise(function (resolve) { setTimeout(resolve, 500); });
    }
    if (isNameTakenLocally(key, playerId)) {
        loginBtn.disabled = false;
        loginBtn.textContent = 'MASUK';
        if (loginError) loginError.textContent = 'Nama tersebut sudah digunakan. Silakan gunakan nama lain.';
        return;
    }
    var won = await attemptNameClaim(display, key);
    loginBtn.disabled = false;
    loginBtn.textContent = 'MASUK';
    if (!won) {
        if (loginError) loginError.textContent = 'Nama tersebut sudah digunakan. Silakan gunakan nama lain.';
        return;
    }

    playerName = display;
    myNameKey = key;
    loggedIn = true;
    activeNames.set(key, { playerId: playerId, name: display, ts: Date.now() });
    sendGlobal({ type: 'quiz_global_join', playerId: playerId, name: playerName });
    startPresenceHeartbeat();
    youAreHome.innerHTML = '';
    var b = document.createElement('b');
    b.textContent = playerName;
    youAreHome.appendChild(document.createTextNode('Kamu bermain sebagai: '));
    youAreHome.appendChild(b);
    showPage('home');
}

/*
 * Kembali ke halaman Login untuk mengganti nama. Klaim nama
 * lama dilepas (diumumkan quiz_global_leave) supaya nama itu
 * bisa dipakai pemain lain, dan nilai lama ditaruh lagi di
 * input supaya tinggal diedit.
 */
function changeName() {
    if (loggedIn) {
        sendGlobal({ type: 'quiz_global_leave', playerId: playerId });
        activeNames.delete(myNameKey);
        stopPresenceHeartbeat();
    }
    loggedIn = false;
    myNameKey = '';
    if (loginError) loginError.textContent = '';
    nameInput.value = playerName || '';
    showPage('login');
    nameInput.focus();
}

/* ========================================================
 * CREATE / JOIN ROOM
 * ======================================================== */

function defaultState() {
    return {
        room: room,
        hostId: '',
        phase: 'lobby',
        players: [],
        spectators: [],
        questionOrder: [],
        currentIndex: -1,
        currentQuestion: null,
        questionStartTs: 0,
        answers: {},
        roundResults: null,
        ts: Date.now()
    };
}

function createRoom() {
    if (!loggedIn) { showPage('login'); return; }
    room = randomRoom();
    isHost = true;
    state = defaultState();
    state.hostId = playerId;
    state.players.push({ id: playerId, name: playerName, connected: true, lastSeen: Date.now(), score: 0, correct: 0, wrong: 0, unanswered: 0 });
    lobbyLog.innerHTML = '';
    lobbyRoomCode.textContent = room;
    showPage('lobby');
    render();
    addLog('Room dibuat. Bagikan kode ' + room + ' ke pemain lain.');
    saveSession();
    connect();
    startHostHeartbeat();
}

function joinRoom() {
    if (joinError) joinError.textContent = '';
    if (!loggedIn) { showPage('login'); return; }
    var code = String(roomInput.value || '').trim().toUpperCase().slice(0, 6);
    if (!code) { joinError.textContent = 'Masukkan kode room.'; return; }
    room = code;
    isHost = false;
    state = null;
    lobbyLog.innerHTML = '';
    lobbyRoomCode.textContent = room;
    pendingJoinRoom = room;
    if (joinTimeoutHandle) clearTimeout(joinTimeoutHandle);
    joinTimeoutHandle = setTimeout(function () {
        joinTimeoutHandle = null;
        if (pendingJoinRoom !== room) return;
        pendingJoinRoom = '';
        joinError.textContent = 'Room tidak ditemukan.';
        if (ws) { try { ws.close(); } catch (e) {} ws = null; }
        room = ''; state = null;
        setConnection('', 'OFFLINE');
    }, JOIN_TIMEOUT_MS);
    connect();
}

function attemptSilentRejoin(session) {
    playerName = session.name;
    loggedIn = true;
    room = session.room;
    isHost = false;
    state = null;
    lobbyRoomCode.textContent = room;
    pendingJoinRoom = room;
    showPage('lobby');
    addLog('Menghubungkan kembali ke room ' + room + '...');
    if (joinTimeoutHandle) clearTimeout(joinTimeoutHandle);
    joinTimeoutHandle = setTimeout(function () {
        joinTimeoutHandle = null;
        if (pendingJoinRoom !== room) return;
        pendingJoinRoom = '';
        showToast('Room sebelumnya sudah tidak aktif.');
        clearSession();
        room = ''; state = null;
        showPage('home');
    }, JOIN_TIMEOUT_MS);
    connect();
}

/* ========================================================
 * MESSAGE HANDLER
 * ======================================================== */

function handleMessage(data) {
    if (!data || !data.type) return;

    if (data.type === 'quiz_join') {
        if (!isHost || data.room !== room) return;
        handleJoin(data);
        return;
    }

    if (data.type === 'quiz_joined') {
        if (data.playerId === playerId) {
            isHost = data.hostId === playerId;
            if (pendingJoinRoom && pendingJoinRoom === room) {
                pendingJoinRoom = '';
                if (joinTimeoutHandle) { clearTimeout(joinTimeoutHandle); joinTimeoutHandle = null; }
                saveSession();
            }
            if (data.role === 'spectator') showToast('👁 Kamu masuk sebagai penonton.');
        }
        if (data.data) { state = data.data; lastHostSeenTs = Date.now(); applyRoleAndRender(); }
        return;
    }

    if (data.type === 'quiz_state') {
        if (data.room !== room) return;
        state = data.data;
        lastHostSeenTs = Date.now();
        if (data.hostId) isHost = data.hostId === playerId;
        applyRoleAndRender();
        return;
    }

    if (data.type === 'quiz_join_rejected') {
        if (data.room !== room || data.playerId !== playerId) return;
        if (pendingJoinRoom && pendingJoinRoom === room) {
            pendingJoinRoom = '';
            if (joinTimeoutHandle) { clearTimeout(joinTimeoutHandle); joinTimeoutHandle = null; }
        }
        if (ws) { try { ws.close(); } catch (e) {} ws = null; }
        room = ''; state = null; isHost = false;
        setConnection('', 'OFFLINE');
        if (joinError) joinError.textContent = 'Nama "' + playerName + '" sudah dipakai di room ini. Ganti nama lalu coba lagi.';
        showPage('join');
        return;
    }

    if (data.type === 'quiz_answer') {
        if (!isHost || data.room !== room) return;
        processAnswer(data);
        return;
    }

    if (data.type === 'quiz_ping') {
        if (!isHost || data.room !== room || !state) return;
        var p = null;
        for (var i = 0; i < state.players.length; i++) if (state.players[i].id === data.playerId) p = state.players[i];
        if (p) p.lastSeen = Date.now();
        var sp = state.spectators || [];
        for (var j = 0; j < sp.length; j++) if (sp[j].id === data.playerId) sp[j].lastSeen = Date.now();
        return;
    }

    if (data.type === 'quiz_rematch_request') {
        if (!isHost || data.room !== room) return;
        showToast((data.name || 'Pemain') + ' ingin main lagi.');
        return;
    }

    if (data.type === 'quiz_leave') {
        if (data.room !== room) return;
        addLog((data.name || 'Pemain') + ' keluar dari room.');
        if (isHost) handlePlayerLeaveHost(data);
        return;
    }
}

function applyRoleAndRender() {
    var me = findMePlayer();
    var spectator = isMeSpectator();
    if (state && state.phase !== 'lobby' && !me && !spectator) {
        // belum sempat masuk daftar (race), tunggu broadcast berikutnya
    }
    render();
}

/* ========================================================
 * JOIN — HOST SIDE
 * ======================================================== */

function handleJoin(data) {
    if (!state) state = defaultState();
    var incomingName = String(data.name || 'Player').slice(0, 20);
    var incomingKey = normalizeName(incomingName);
    var existing = null;
    for (var i = 0; i < state.players.length; i++) if (state.players[i].id === data.playerId) existing = state.players[i];
    var existingSpec = null;
    state.spectators = state.spectators || [];
    for (var j = 0; j < state.spectators.length; j++) if (state.spectators[j].id === data.playerId) existingSpec = state.spectators[j];

    /*
     * TOLAK NAMA DUPLIKAT
     *
     * Hanya berlaku untuk playerId yang benar-benar BARU di room
     * ini (bukan reconnect -- reconnect dikenali lewat existing/
     * existingSpec di atas, karena playerId sama persis dengan
     * yang sudah tercatat, jadi tidak pernah menolak dirinya
     * sendiri). Dibandingkan terhadap pemain yang masih connected
     * dan seluruh penonton di room yang sama.
     */
    if (!existing && !existingSpec && incomingKey) {
        var nameTaken = false;
        for (var k = 0; k < state.players.length; k++) {
            if (state.players[k].id !== data.playerId && state.players[k].connected !== false && normalizeName(state.players[k].name) === incomingKey) {
                nameTaken = true;
                break;
            }
        }
        if (!nameTaken) {
            for (var s = 0; s < state.spectators.length; s++) {
                if (state.spectators[s].id !== data.playerId && normalizeName(state.spectators[s].name) === incomingKey) {
                    nameTaken = true;
                    break;
                }
            }
        }
        if (nameTaken) {
            send({ type: 'quiz_join_rejected', room: room, playerId: data.playerId, reason: 'name_taken' });
            return;
        }
    }

    var role = 'player';
    if (existing) {
        existing.connected = true;
        existing.lastSeen = Date.now();
        existing.name = incomingName;
    } else if (existingSpec) {
        existingSpec.name = incomingName;
        existingSpec.lastSeen = Date.now();
        role = 'spectator';
    } else if (state.phase === 'lobby' && state.players.length < ROOM_MAX) {
        existing = { id: data.playerId, name: incomingName, connected: true, lastSeen: Date.now(), score: 0, correct: 0, wrong: 0, unanswered: 0 };
        state.players.push(existing);
    } else {
        existingSpec = { id: data.playerId, name: incomingName, lastSeen: Date.now() };
        state.spectators.push(existingSpec);
        role = 'spectator';
    }

    state.hostId = state.hostId || playerId;
    send({
        type: 'quiz_joined',
        room: room,
        playerId: data.playerId,
        hostId: state.hostId,
        role: role,
        data: state
    });
    addLog(incomingName + (role === 'spectator' ? ' bergabung sebagai penonton.' : ' bergabung ke room.'));
    broadcastState();
}

/* ========================================================
 * BROADCAST STATE (dipakai juga sebagai heartbeat host)
 * ======================================================== */

function broadcastState() {
    if (!state) return;
    state.room = room;
    state.ts = Date.now();
    send({ type: 'quiz_state', room: room, hostId: state.hostId, data: state });
    render();
}

function startHostHeartbeat() {
    if (hostHeartbeatTimer) clearInterval(hostHeartbeatTimer);
    hostHeartbeatTimer = setInterval(function () {
        if (isHost && room && state) broadcastState();
    }, HOST_HEARTBEAT_MS);
}

/* ========================================================
 * HOST WATCHDOG / FAILOVER
 * ======================================================== */

function startHostWatchdog() {
    if (hostWatchdogTimer) clearInterval(hostWatchdogTimer);
    hostWatchdogTimer = setInterval(function () {
        if (!room || !state || isHost) return;
        if (isMeSpectator()) return;
        if (Date.now() - lastHostSeenTs > HOST_TIMEOUT_MS) considerHostTakeover();
    }, 3000);
}
function considerHostTakeover() {
    if (!state || !state.players) return;
    var candidates = [];
    for (var i = 0; i < state.players.length; i++) {
        if (state.players[i].connected !== false) candidates.push(state.players[i]);
    }
    if (!candidates.length) return;
    var next = candidates[0];
    if (next.id === playerId) {
        isHost = true;
        state.hostId = playerId;
        lastHostSeenTs = Date.now();
        addLog('Host sebelumnya terputus. Kamu menjadi Host baru.');
        showToast('👑 Kamu menjadi Host baru.');
        startHostHeartbeat();
        broadcastState();
        if (state.phase === 'question') scheduleHostQuestionTimeout();
    }
}

/* ========================================================
 * PRESENCE PING (non-host & host, supaya host bisa
 * mendeteksi pemain yang disconnect tanpa sempat kirim
 * quiz_leave, mis. tab ditutup paksa)
 * ======================================================== */

function startPresencePing() {
    if (presencePingTimer) clearInterval(presencePingTimer);
    presencePingTimer = setInterval(function () {
        if (room) send({ type: 'quiz_ping', room: room, playerId: playerId });
    }, PRESENCE_PING_MS);
    if (presencePruneTimer) clearInterval(presencePruneTimer);
    presencePruneTimer = setInterval(function () {
        if (!isHost || !state) return;
        var changed = false;
        var now = Date.now();
        for (var i = 0; i < state.players.length; i++) {
            var p = state.players[i];
            if (p.id === playerId) { p.lastSeen = now; continue; }
            if (p.connected !== false && p.lastSeen && now - p.lastSeen > PRESENCE_STALE_MS) { p.connected = false; changed = true; }
        }
        var before = (state.spectators || []).length;
        state.spectators = (state.spectators || []).filter(function (s) { return !s.lastSeen || now - s.lastSeen <= PRESENCE_STALE_MS; });
        if (state.spectators.length !== before) changed = true;
        if (changed) broadcastState();
    }, PRESENCE_PRUNE_MS);
}

/* ========================================================
 * START QUIZ (host only)
 * ======================================================== */

function shuffledOrder() {
    var idx = [];
    for (var i = 0; i < QUESTION_BANK.length; i++) idx.push(i);
    for (var j = idx.length - 1; j > 0; j--) {
        var k = Math.floor(Math.random() * (j + 1));
        var tmp = idx[j]; idx[j] = idx[k]; idx[k] = tmp;
    }
    return idx.slice(0, Math.min(TOTAL_QUESTIONS, idx.length));
}
function buildQuestionPayload(orderIdx) {
    var q = QUESTION_BANK[state.questionOrder[orderIdx]];
    return { question: q.question, options: q.options, answerIndex: q.answerIndex, no: orderIdx + 1, total: state.questionOrder.length };
}
function connectedPlayerCount() {
    var n = 0;
    for (var i = 0; i < state.players.length; i++) if (state.players[i].connected !== false) n++;
    return n;
}
function startQuiz() {
    if (!isHost || !state || state.phase !== 'lobby') return;
    if (connectedPlayerCount() < MIN_PLAYERS) { showToast('Minimal ' + MIN_PLAYERS + ' pemain untuk mulai.'); return; }
    for (var i = 0; i < state.players.length; i++) { state.players[i].score = 0; state.players[i].correct = 0; state.players[i].wrong = 0; state.players[i].unanswered = 0; }
    state.questionOrder = shuffledOrder();
    state.currentIndex = 0;
    state.answers = {};
    state.roundResults = null;
    state.currentQuestion = buildQuestionPayload(0);
    state.questionStartTs = Date.now();
    state.phase = 'question';
    myAnsweredIndex = null;
    myAnsweredQuestionIndex = -1;
    showPage('game');
    broadcastState();
    scheduleHostQuestionTimeout();
}

/* ========================================================
 * TIMER (host mengontrol transisi, semua client menghitung
 * mundur dari questionStartTs — bukan cuma setInterval lokal)
 * ======================================================== */

function scheduleHostQuestionTimeout() {
    if (hostQuestionTimeout) clearTimeout(hostQuestionTimeout);
    var thisIndex = state.currentIndex;
    var elapsed = Date.now() - state.questionStartTs;
    var remain = Math.max(50, QUESTION_DURATION_MS - elapsed + 80);
    hostQuestionTimeout = setTimeout(function () {
        if (isHost && state && state.phase === 'question' && state.currentIndex === thisIndex) revealQuestion();
    }, remain);
}

/* ========================================================
 * ANSWER SUBMISSION
 * ======================================================== */

function submitAnswer(idx) {
    if (!state || state.phase !== 'question' || isMeSpectator()) return;
    if (myAnsweredQuestionIndex === state.currentIndex) return;
    myAnsweredIndex = idx;
    myAnsweredQuestionIndex = state.currentIndex;
    renderOptions();
    answeredText.textContent = '✓ Jawaban terkirim';
    send({ type: 'quiz_answer', room: room, playerId: playerId, questionIndex: state.currentIndex, optionIndex: idx, ts: Date.now() });
}

function processAnswer(data) {
    if (!state || state.phase !== 'question') return;
    if (data.questionIndex !== state.currentIndex) return;
    var player = null;
    for (var i = 0; i < state.players.length; i++) if (state.players[i].id === data.playerId) player = state.players[i];
    if (!player || player.connected === false) return;
    state.answers = state.answers || {};
    if (state.answers[data.playerId]) return;
    var optionIndex = data.optionIndex;
    if (typeof optionIndex !== 'number' || optionIndex < 0 || optionIndex > 3) return;
    var elapsed = data.ts - state.questionStartTs;
    if (elapsed < 0) elapsed = 0;
    if (elapsed > QUESTION_DURATION_MS) elapsed = QUESTION_DURATION_MS;
    var correct = optionIndex === state.currentQuestion.answerIndex;
    var speedBonus = correct ? Math.round(50 * (1 - elapsed / QUESTION_DURATION_MS)) : 0;
    var points = correct ? 100 + speedBonus : 0;
    state.answers[data.playerId] = { optionIndex: optionIndex, correct: correct, points: points };
    player.score += points;
    if (correct) player.correct++; else player.wrong++;
    broadcastState();

    var answeredCount = 0;
    for (var k in state.answers) if (Object.prototype.hasOwnProperty.call(state.answers, k)) answeredCount++;
    if (answeredCount >= connectedPlayerCount()) revealQuestion();
}

function revealQuestion() {
    if (!isHost || !state || state.phase !== 'question') return;
    if (hostQuestionTimeout) { clearTimeout(hostQuestionTimeout); hostQuestionTimeout = null; }
    state.answers = state.answers || {};
    for (var i = 0; i < state.players.length; i++) {
        var p = state.players[i];
        if (p.connected === false) continue;
        if (!state.answers[p.id]) {
            state.answers[p.id] = { optionIndex: null, correct: false, points: 0, unanswered: true };
            p.unanswered = (p.unanswered || 0) + 1;
        }
    }
    var results = [];
    for (var id in state.answers) {
        if (!Object.prototype.hasOwnProperty.call(state.answers, id)) continue;
        var pl = null;
        for (var j = 0; j < state.players.length; j++) if (state.players[j].id === id) pl = state.players[j];
        if (!pl) continue;
        results.push({ id: id, name: pl.name, points: state.answers[id].points, correct: state.answers[id].correct });
    }
    results.sort(function (a, b) { return b.points - a.points; });
    state.roundResults = results;
    state.phase = 'reveal';
    broadcastState();

    if (hostRevealTimeout) clearTimeout(hostRevealTimeout);
    hostRevealTimeout = setTimeout(function () {
        if (!isHost || !state || state.phase !== 'reveal') return;
        if (state.currentIndex + 1 >= state.questionOrder.length) finishQuiz();
        else nextQuestion();
    }, REVEAL_DELAY_MS);
}

function nextQuestion() {
    state.currentIndex++;
    state.answers = {};
    state.roundResults = null;
    state.currentQuestion = buildQuestionPayload(state.currentIndex);
    state.questionStartTs = Date.now();
    state.phase = 'question';
    myAnsweredIndex = null;
    myAnsweredQuestionIndex = -1;
    broadcastState();
    scheduleHostQuestionTimeout();
}

function finishQuiz() {
    state.phase = 'finished';
    broadcastState();
}

/* ========================================================
 * REMATCH
 * ======================================================== */

function rematch() {
    if (!state || state.phase !== 'finished') return;
    if (isMeSpectator()) { showToast('Penonton tidak dapat memulai rematch.'); return; }
    if (isHost) processRematch();
    else { send({ type: 'quiz_rematch_request', room: room, playerId: playerId, name: playerName }); showToast('Meminta Host memulai rematch...'); }
}
function processRematch() {
    if (!isHost || !state) return;
    for (var i = 0; i < state.players.length; i++) { state.players[i].score = 0; state.players[i].correct = 0; state.players[i].wrong = 0; state.players[i].unanswered = 0; }
    state.answers = {};
    state.roundResults = null;
    state.currentIndex = -1;
    state.currentQuestion = null;
    if (connectedPlayerCount() >= MIN_PLAYERS) {
        state.questionOrder = shuffledOrder();
        state.currentIndex = 0;
        state.currentQuestion = buildQuestionPayload(0);
        state.questionStartTs = Date.now();
        state.phase = 'question';
        myAnsweredIndex = null;
        myAnsweredQuestionIndex = -1;
        showPage('game');
        broadcastState();
        scheduleHostQuestionTimeout();
    } else {
        state.questionOrder = [];
        state.phase = 'lobby';
        showPage('lobby');
        broadcastState();
    }
}

/* ========================================================
 * LEAVE ROOM
 * ======================================================== */

function leaveRoom() {
    if (isHost && state && state.players && state.players.length) {
        var candidate = null;
        for (var i = 0; i < state.players.length; i++) {
            if (state.players[i].id !== playerId && state.players[i].connected !== false) { candidate = state.players[i]; break; }
        }
        if (candidate) { state.hostId = candidate.id; broadcastState(); }
    }
    if (room) send({ type: 'quiz_leave', room: room, playerId: playerId, name: playerName });
    manualLeave = true;
    clearSession();
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    if (hostQuestionTimeout) { clearTimeout(hostQuestionTimeout); hostQuestionTimeout = null; }
    if (hostRevealTimeout) { clearTimeout(hostRevealTimeout); hostRevealTimeout = null; }
    if (hostHeartbeatTimer) { clearInterval(hostHeartbeatTimer); hostHeartbeatTimer = null; }
    if (hostWatchdogTimer) { clearInterval(hostWatchdogTimer); hostWatchdogTimer = null; }
    if (presencePingTimer) { clearInterval(presencePingTimer); presencePingTimer = null; }
    if (presencePruneTimer) { clearInterval(presencePruneTimer); presencePruneTimer = null; }
    if (ws) { try { ws.close(); } catch (e) {} ws = null; }
    room = ''; isHost = false; state = null;
    myAnsweredIndex = null; myAnsweredQuestionIndex = -1;
    setConnection('', 'OFFLINE');
    showPage('home');
}

function handlePlayerLeaveHost(data) {
    if (!isHost || !state) return;
    var idx = -1;
    for (var i = 0; i < state.players.length; i++) if (state.players[i].id === data.playerId) idx = i;
    if (idx !== -1) {
        if (state.phase === 'lobby') state.players.splice(idx, 1);
        else state.players[idx].connected = false;
    }
    var sidx = -1;
    var spec = state.spectators || [];
    for (var j = 0; j < spec.length; j++) if (spec[j].id === data.playerId) sidx = j;
    if (sidx !== -1) spec.splice(sidx, 1);
    broadcastState();
}

window.addEventListener('beforeunload', function () {
    if (loggedIn && globalWs && globalWs.readyState === WebSocket.OPEN) {
        try { globalWs.send(JSON.stringify({ type: 'quiz_global_leave', playerId: playerId })); } catch (e) {}
    }
    if (room && ws && ws.readyState === WebSocket.OPEN) {
        try { ws.send(JSON.stringify({ type: 'quiz_leave', room: room, playerId: playerId, name: playerName })); } catch (e) {}
    }
});

/* ========================================================
 * RENDER
 * ======================================================== */

function render() {
    if (!state) return;
    renderLobby();
    renderGame();
    renderResult();
}

function playerTagRow(p, extraCls) {
    var row = document.createElement('div');
    row.className = 'player-row' + (p.id === playerId ? ' me' : '') + (extraCls ? ' ' + extraCls : '');
    var left = document.createElement('div');
    left.className = 'player-name';
    left.appendChild(document.createTextNode((p.id === state.hostId ? '👑 ' : '👤 ') + p.name));
    row.appendChild(left);
    var right = document.createElement('div');
    if (p.id === state.hostId) { var t = document.createElement('span'); t.className = 'tag host'; t.textContent = 'HOST'; right.appendChild(t); }
    if (p.connected === false) { var t2 = document.createElement('span'); t2.className = 'tag off'; t2.textContent = 'OFFLINE'; right.appendChild(t2); }
    row.appendChild(right);
    return row;
}

function renderLobby() {
    if (!room) return;
    lobbyRoomCode.textContent = room;
    lobbyPlayers.innerHTML = '';
    var players = state.players || [];
    for (var i = 0; i < players.length; i++) lobbyPlayers.appendChild(playerTagRow(players[i]));
    var spectators = state.spectators || [];
    if (spectators.length) {
        var hdr = document.createElement('div');
        hdr.className = 'count-text';
        hdr.textContent = '👁 ' + spectators.length + ' penonton';
        lobbyPlayers.appendChild(hdr);
    }
    lobbyCount.textContent = players.length + '/' + ROOM_MAX + ' PEMAIN';
    var canStart = isHost && state.phase === 'lobby';
    startBtn.style.display = canStart ? 'block' : 'none';
    var connectedN = connectedPlayerCount();
    lobbyWaiting.style.display = (state.phase === 'lobby' && connectedN < MIN_PLAYERS) ? 'block' : 'none';
    startBtn.disabled = connectedN < MIN_PLAYERS;

    /*
     * Selalu sinkronkan halaman aktif dengan phase saat ini secara
     * tanpa syarat. Sebelumnya switch ke page-result/page-game hanya
     * terjadi kalau BELUM berada di page-game/page-result, sehingga:
     * - Pemain yang baru join (masih di page-join) tidak pernah
     *   dipindah ke page-lobby saat phase === 'lobby'.
     * - Saat quiz selesai (phase berubah ke 'finished'), guard itu
     *   memblokir pindah ke page-result karena page-game memang
     *   sedang aktif -> nyangkut permanen di page-game.
     * Dengan phase sebagai satu-satunya sumber kebenaran di sini,
     * kedua masalah itu tidak lagi mungkin terjadi.
     */
    if (state.phase === 'lobby') {
        showPage('lobby');
    } else if (state.phase === 'finished') {
        showPage('result');
    } else {
        showPage('game');
    }
}

function renderScoreStrip() {
    scoreStrip.innerHTML = '';
    var players = (state.players || []).slice().sort(function (a, b) { return b.score - a.score; });
    for (var i = 0; i < players.length; i++) {
        var pill = document.createElement('div');
        pill.className = 'score-pill' + (i === 0 && players[i].score > 0 ? ' leader' : '');
        pill.textContent = (i === 0 && players[i].score > 0 ? '👑 ' : '') + players[i].name + ' · ' + players[i].score;
        scoreStrip.appendChild(pill);
    }
}

function renderOptions() {
    if (!state || !state.currentQuestion) return;
    var q = state.currentQuestion;
    var answered = myAnsweredQuestionIndex === state.currentIndex;
    var revealed = state.phase === 'reveal' || state.phase === 'finished';
    for (var i = 0; i < 4; i++) {
        var btn = optButtons[i];
        btn.textContent = String.fromCharCode(65 + i) + '. ' + (q.options[i] || '');
        btn.className = 'opt-btn';
        if (answered && myAnsweredIndex === i) btn.classList.add('selected');
        if (revealed) {
            if (i === q.answerIndex) btn.classList.add('correct');
            else if (answered && myAnsweredIndex === i) btn.classList.add('wrong');
        }
        btn.disabled = answered || revealed || isMeSpectator() || state.phase !== 'question';
    }
}

function renderTimerNow() {
    if (!state || state.phase !== 'question' || !state.questionStartTs) return;
    var remain = QUESTION_DURATION_MS - (Date.now() - state.questionStartTs);
    var secs = Math.max(0, Math.ceil(remain / 1000));
    timerCircle.textContent = secs > 0 ? String(secs) : '⏰';
    timerCircle.classList.toggle('low', secs <= 3);
}
if (timerRenderInterval) clearInterval(timerRenderInterval);
timerRenderInterval = setInterval(renderTimerNow, 250);

function renderGame() {
    if (!state) return;
    gameHeader.textContent = 'ROOM: ' + room + ' · SOAL ' + (state.currentQuestion ? state.currentQuestion.no : 0) + '/' + (state.questionOrder ? state.questionOrder.length : TOTAL_QUESTIONS);
    spectatorBadge.style.display = isMeSpectator() ? 'block' : 'none';
    renderScoreStrip();
    if (state.currentQuestion) {
        questionText.textContent = state.currentQuestion.question;
        renderOptions();
        renderTimerNow();
    }
    var answered = myAnsweredQuestionIndex === state.currentIndex && state.phase === 'question';
    answeredText.textContent = answered ? '✓ Jawaban terkirim' : (state.phase === 'question' && !isMeSpectator() ? 'Tap salah satu pilihan jawaban.' : '');

    if (state.phase === 'reveal' && state.currentQuestion) {
        revealBox.style.display = 'block';
        revealAnswer.textContent = 'JAWABAN BENAR: ' + String.fromCharCode(65 + state.currentQuestion.answerIndex) + '. ' + state.currentQuestion.options[state.currentQuestion.answerIndex];
        revealList.innerHTML = '';
        var medals = ['🥇', '🥈', '🥉'];
        var results = state.roundResults || [];
        for (var i = 0; i < results.length; i++) {
            var row = document.createElement('div');
            row.className = 'reveal-row';
            var left = document.createElement('span');
            left.textContent = (medals[i] || (i + 1) + '.') + ' ' + results[i].name;
            var right = document.createElement('span');
            right.className = 'pts';
            right.textContent = '+' + results[i].points;
            row.appendChild(left); row.appendChild(right);
            revealList.appendChild(row);
        }
    } else {
        revealBox.style.display = 'none';
    }
}

function renderResult() {
    if (!state || state.phase !== 'finished') return;
    var players = (state.players || []).slice().sort(function (a, b) { return b.score - a.score; });
    resultPodium.innerHTML = '';
    var order = [1, 0, 2];
    for (var oi = 0; oi < order.length; oi++) {
        var pos = order[oi];
        if (!players[pos]) continue;
        var item = document.createElement('div');
        item.className = 'podium-item podium-' + (pos + 1);
        var name = document.createElement('div');
        name.className = 'podium-name';
        name.textContent = (pos === 0 ? '🥇 ' : pos === 1 ? '🥈 ' : '🥉 ') + players[pos].name;
        var bar = document.createElement('div');
        bar.className = 'podium-bar';
        item.appendChild(name); item.appendChild(bar);
        var pts = document.createElement('div');
        pts.textContent = players[pos].score + ' POIN';
        item.appendChild(pts);
        resultPodium.appendChild(item);
    }

    var me = findMePlayer();
    resultStats.innerHTML = '';
    var cells = [
        { num: me ? me.correct : 0, lbl: 'Soal Benar' },
        { num: me ? me.wrong : 0, lbl: 'Soal Salah' },
        { num: me ? me.unanswered : 0, lbl: 'Tidak Jawab' },
        { num: me ? me.score : 0, lbl: 'Total Poin' }
    ];
    for (var c = 0; c < cells.length; c++) {
        var cell = document.createElement('div');
        cell.className = 'stat-cell';
        var num = document.createElement('div'); num.className = 'num'; num.textContent = String(cells[c].num);
        var lbl = document.createElement('div'); lbl.className = 'lbl'; lbl.textContent = cells[c].lbl;
        cell.appendChild(num); cell.appendChild(lbl);
        resultStats.appendChild(cell);
    }

    resultList.innerHTML = '';
    for (var i = 0; i < players.length; i++) {
        var row = document.createElement('div');
        row.className = 'player-row' + (players[i].id === playerId ? ' me' : '');
        var left = document.createElement('div');
        left.className = 'player-name';
        left.textContent = (i + 1) + '. ' + players[i].name;
        var right = document.createElement('span');
        right.className = 'tag';
        right.textContent = players[i].score + ' pts';
        row.appendChild(left); row.appendChild(right);
        resultList.appendChild(row);
    }
}

/* ========================================================
 * EVENTS
 * ======================================================== */

loginBtn.addEventListener('click', performLogin);
nameInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') performLogin(); });
if (changeNameBtn) changeNameBtn.addEventListener('click', changeName);
createBtn.addEventListener('click', createRoom);
goJoinBtn.addEventListener('click', function () { joinError.textContent = ''; roomInput.value = ''; showPage('join'); });
backHomeFromJoinBtn.addEventListener('click', function () { showPage('home'); });
joinBtn.addEventListener('click', joinRoom);
roomInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') joinRoom(); });
roomInput.addEventListener('input', function () { roomInput.value = roomInput.value.toUpperCase().slice(0, 6); });
function legacyCopy(text) {
    try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '-9999px';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ta.setSelectionRange(0, text.length);
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
    } catch (e) {
        return false;
    }
}
copyRoomBtn.addEventListener('click', function () {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(room).then(function () {
            showToast('Kode room disalin.');
        }).catch(function () {
            if (legacyCopy(room)) showToast('Kode room disalin.');
            else showToast('Gagal menyalin otomatis. Kode: ' + room);
        });
    } else {
        if (legacyCopy(room)) showToast('Kode room disalin.');
        else showToast('Gagal menyalin otomatis. Kode: ' + room);
    }
});
startBtn.addEventListener('click', startQuiz);
leaveLobbyBtn.addEventListener('click', leaveRoom);
leaveGameBtn.addEventListener('click', leaveRoom);
leaveResultBtn.addEventListener('click', leaveRoom);
rematchBtn.addEventListener('click', rematch);
for (var oi2 = 0; oi2 < optButtons.length; oi2++) {
    (function (idx) { optButtons[idx].addEventListener('click', function () { submitAnswer(idx); }); })(oi2);
}

/* ========================================================
 * START
 * ======================================================== */

setConnection('', 'OFFLINE');
startHostWatchdog();
connectGlobal();
var session = loadSession();
if (session) {
    attemptSilentRejoin(session);
} else {
    showPage('login');
    nameInput.focus();
}
})();
</script>
`
}

/* =========================================================
 * SEND RICH RESPONSE
 * ========================================================= */

async function sendQuizBattle(sock, m, html) {
    const responseId = generateMessageIDV2()
    const sources = [
        {
            source_type: 'THIRD_PARTY',
            source_display_name: 'QuizBattle',
            source_subtitle: 'Realtime Multiplayer Quiz',
            source_url: WEB_URL
        }
    ]
    const unifiedData = Buffer.from(
        JSON.stringify({
            response_id: responseId,
            sections: [
                {
                    view_model: {
                        primitive: {
                            __typename: 'GenAIaeacdsnwHtmlPrimitive',
                            payload: html,
                            trusted_sources: [WEB_URL]
                        },
                        __typename: 'GenAISingleLayoutViewModel'
                    }
                }
            ]
        })
    ).toString('base64')
    const isi = {
        messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2,
            botMetadata: {
                messageDisclaimerText: 'QuizBattle',
                botResponseId: responseId,
                richResponseSourcesMetadata: { sources }
            }
        },
        botForwardedMessage: {
            message: {
                richResponseMessage: {
                    messageType: 1,
                    submessages: [
                        {
                            messageType: proto.AIRichResponseSubMessageType.AI_RICH_RESPONSE_TEXT,
                            messageText: 'QuizBattle'
                        }
                    ],
                    unifiedResponse: { data: unifiedData },
                    contextInfo: {
                        forwardingScore: 1,
                        isForwarded: true,
                        forwardedAiBotMessageInfo: { botJid: BOT_JID },
                        forwardOrigin: 4
                    }
                }
            }
        }
    }
    const msg = generateWAMessageFromContent(m.chat, isi, { messageId: generateMessageIDV2() })
    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
}

/* =========================================================
 * HANDLER
 * ========================================================= */

async function handler(m, { sock }) {
    await m.react('⚡')

    try {
        const playerIdentity = getWhatsAppIdentity(m)
        const html = createGameHTML(playerIdentity, QUESTION_BANK)
        await sendQuizBattle(sock, m, html)

        await m.react('✅')
    } catch (error) {
        console.error('[quizbattle] Error:', error)
        await m.react('❌')

        return m.reply(
            `❌ *ᴀᴅᴜʜ, ɢᴀɢᴀʟ ɴɢɪʀɪᴍ ǫᴜɪᴢʙᴀᴛᴛʟᴇ*\n\n` +
            `> ${error?.message || 'Unknown error'}\n\n` +
            `> Coba lagi ya, いつき〜なかの✨ janji next take bakal lebih seru~ ⚡`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
