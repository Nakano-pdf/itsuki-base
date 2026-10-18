/**
 * ✧ Name     : tictactoemp
 * ✧ Category : game
 * ✧ Type     : Rich HTML Multiplayer
 * ✧ Usage    : .tictactoemp
 */

'use strict'

const {
    proto,
    generateWAMessageFromContent,
    generateMessageIDV2
} = require('baileys')

/* =========================================================
 * CONFIG
 * =========================================================
 *
 * TIDAK PERLU DOMAIN SENDIRI.
 *
 * Endpoint ini sama dengan WebSocket Test kamu
 * yang sudah berhasil OPEN + menerima echo.
 */

const WEB_URL =
    'https://alwayslennz-dev.my.id'

const WS_URL =
    'wss://free.blr2.piesocket.com/v3/1?api_key=ISI_API_KEY_KAMU&notify_self=1'

const BOT_JID =
    '0@bot'

/* =========================================================
 * HTML ESCAPE
 * ========================================================= */

function escapeHtml(text = '') {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

/* =========================================================
 * CREATE HTML
 * ========================================================= */

function createGameHTML() {

    const safeWeb =
        escapeHtml(WEB_URL)

    const safeWs =
        escapeHtml(WS_URL)

    return `
<style>

* {
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
}

html,
body {
    margin: 0;
    padding: 0;
    background: transparent;
    color: #fff;
    font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Roboto,
        Arial,
        sans-serif;
}

button,
input {
    font-family: inherit;
}

button {
    user-select: none;
}

.wrap {
    width: 100%;
    max-width: 430px;
    margin: auto;
    padding: 8px;
}

.game {
    position: relative;
    overflow: hidden;

    padding: 18px;

    border-radius: 22px;

    background:
        linear-gradient(
            145deg,
            rgba(255,255,255,.095),
            rgba(255,255,255,.035)
        );

    border:
        1px solid rgba(255,255,255,.12);

    box-shadow:
        0 20px 60px rgba(0,0,0,.45);
}

.glow {
    position: absolute;

    width: 190px;
    height: 190px;

    top: -100px;
    right: -70px;

    border-radius: 50%;

    background:
        rgba(100,180,255,.09);

    filter: blur(55px);

    pointer-events: none;
}

.header {
    position: relative;

    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 10px;
}

.brand {
    min-width: 0;
}

.eyebrow {
    font-size: 9px;
    letter-spacing: 2px;

    color:
        rgba(255,255,255,.42);
}

.title {
    margin-top: 3px;

    font-size: 23px;
    font-weight: 800;
}

.connection {
    display: flex;
    align-items: center;

    gap: 6px;

    font-size: 9px;

    color:
        rgba(255,255,255,.48);
}

.connection-dot {
    width: 7px;
    height: 7px;

    flex: 0 0 auto;

    border-radius: 50%;

    background: #777;
}

.connection-dot.online {
    background: #65df91;
}

.connection-dot.error {
    background: #ff6060;
}

.menu {
    position: relative;

    margin-top: 18px;
}

.name-input,
.room-input,
.chat-input {
    width: 100%;

    outline: none;

    border:
        1px solid rgba(255,255,255,.1);

    background:
        rgba(255,255,255,.055);

    color: white;
}

.name-input,
.room-input {
    padding: 12px 13px;

    border-radius: 12px;

    font-size: 13px;
}

.name-input {
    margin-bottom: 8px;
}

.name-input::placeholder,
.room-input::placeholder,
.chat-input::placeholder {
    color:
        rgba(255,255,255,.35);
}

.menu-row {
    display: grid;

    grid-template-columns:
        1fr 1fr;

    gap: 8px;
}

.btn {
    border: 0;

    border-radius: 12px;

    padding: 12px;

    color: white;

    background:
        rgba(255,255,255,.08);

    font-size: 12px;

    font-weight: 700;

    cursor: pointer;
}

.btn:active {
    transform: scale(.97);
}

.btn-main {
    background: white;
    color: #111;
}

.join-box {
    margin-top: 8px;
}

.hidden {
    display: none !important;
}

.room-panel {
    display: none;

    margin-top: 15px;

    padding: 12px;

    border-radius: 14px;

    background:
        rgba(255,255,255,.045);

    border:
        1px solid rgba(255,255,255,.08);
}

.room-panel.show {
    display: block;
}

.room-label {
    font-size: 9px;
    letter-spacing: 1.5px;

    color:
        rgba(255,255,255,.4);
}

.room-code {
    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 8px;

    margin-top: 4px;
}

.room-code strong {
    font-size: 22px;
    letter-spacing: 4px;
}

.copy-btn {
    padding: 8px 11px;

    border: 0;
    border-radius: 9px;

    background:
        rgba(255,255,255,.09);

    color: white;

    font-size: 10px;
    font-weight: 700;
}

.players {
    display: grid;

    grid-template-columns:
        1fr 1fr;

    gap: 8px;

    margin-top: 12px;
}

.player {
    padding: 10px;

    border-radius: 12px;

    background:
        rgba(255,255,255,.045);

    border:
        1px solid rgba(255,255,255,.07);
}

.player.active {
    border-color:
        rgba(255,255,255,.3);

    background:
        rgba(255,255,255,.09);
}

.player-symbol {
    font-size: 20px;
    font-weight: 900;
}

.player-name {
    margin-top: 3px;

    overflow: hidden;

    text-overflow: ellipsis;
    white-space: nowrap;

    font-size: 10px;

    color:
        rgba(255,255,255,.65);
}

.score {
    display: flex;

    justify-content: center;

    gap: 20px;

    margin-top: 13px;

    font-size: 10px;

    color:
        rgba(255,255,255,.5);
}

.score b {
    color: white;
}

.status {
    margin-top: 15px;

    padding: 11px;

    border-radius: 12px;

    text-align: center;

    background:
        rgba(255,255,255,.045);

    font-size: 12px;

    font-weight: 700;
}

.board {
    display: grid;

    grid-template-columns:
        repeat(3, 1fr);

    gap: 8px;

    margin-top: 15px;
}

.cell {
    aspect-ratio: 1;

    display: flex;
    align-items: center;
    justify-content: center;

    padding: 0;

    border: 0;

    border-radius: 17px;

    background:
        rgba(255,255,255,.055);

    color: white;

    font-size: 42px;
    font-weight: 900;

    cursor: pointer;

    transition:
        transform .12s ease,
        background .15s ease;
}

.cell:active {
    transform: scale(.94);
}

.cell:hover {
    background:
        rgba(255,255,255,.09);
}

.cell.x {
    color: white;
}

.cell.o {
    color: #aeb9ff;
}

.cell.win {
    background:
        rgba(100,220,150,.16);

    box-shadow:
        inset 0 0 0 1px
        rgba(100,220,150,.3);
}

.actions {
    display: grid;

    grid-template-columns:
        1fr 1fr;

    gap: 8px;

    margin-top: 12px;
}

.chat {
    margin-top: 14px;

    overflow: hidden;

    border-radius: 14px;

    background:
        rgba(0,0,0,.16);
}

.chat-title {
    padding: 9px 11px;

    border-bottom:
        1px solid rgba(255,255,255,.06);

    font-size: 9px;
    letter-spacing: 1px;

    color:
        rgba(255,255,255,.4);
}

.chat-log {
    height: 110px;

    overflow-y: auto;

    padding: 8px 10px;

    font-size: 10px;
}

.chat-message {
    margin-bottom: 5px;

    line-height: 1.4;

    color:
        rgba(255,255,255,.7);
}

.chat-message b {
    color: white;
}

.chat-send {
    display: grid;

    grid-template-columns:
        1fr auto;

    gap: 6px;

    padding: 8px;

    border-top:
        1px solid rgba(255,255,255,.06);
}

.chat-input {
    min-width: 0;

    padding: 9px 10px;

    border: 0;
    border-radius: 9px;

    font-size: 10px;
}

.send-chat {
    padding: 9px 12px;

    border: 0;
    border-radius: 9px;

    background: white;

    color: #111;

    font-size: 10px;
    font-weight: 800;
}

.footer {
    margin-top: 13px;

    text-align: center;

    font-size: 9px;

    line-height: 1.6;

    color:
        rgba(255,255,255,.32);
}

</style>

<div class="wrap">

<div class="game">

<div class="glow"></div>

<div class="header">

<div class="brand">
    <div class="eyebrow">
        ITSUKI AI · MULTIPLAYER
    </div>

    <div class="title">
        TicTacToeMP
    </div>
</div>

<div class="connection">

<span
    class="connection-dot"
    id="connectionDot"
></span>

<span id="connectionText">
    OFFLINE
</span>

</div>

</div>

<div
    class="menu"
    id="menu"
>

<input
    id="nameInput"
    class="name-input"
    maxlength="20"
    placeholder="Nama pemain..."
    autocomplete="off"
>

<div class="menu-row">

<button
    class="btn btn-main"
    id="createBtn"
>
    ＋ BUAT ROOM
</button>

<button
    class="btn"
    id="showJoinBtn"
>
    MASUK ROOM
</button>

</div>

<div
    id="joinBox"
    class="join-box hidden"
>

<input
    id="roomInput"
    class="room-input"
    maxlength="6"
    placeholder="Kode room..."
    autocomplete="off"
>

<button
    class="btn btn-main"
    id="joinBtn"
    style="width:100%;margin-top:8px"
>
    MASUK
</button>

</div>

</div>

<div
    id="roomPanel"
    class="room-panel"
>

<div class="room-label">
    ROOM CODE
</div>

<div class="room-code">

<strong id="roomCode">
    ------
</strong>

<button
    class="copy-btn"
    id="copyBtn"
>
    SALIN
</button>

</div>

<div class="players">

<div
    class="player"
    id="playerX"
>

<div class="player-symbol">
    X
</div>

<div
    class="player-name"
    id="nameX"
>
    Menunggu...
</div>

</div>

<div
    class="player"
    id="playerO"
>

<div class="player-symbol">
    O
</div>

<div
    class="player-name"
    id="nameO"
>
    Menunggu...
</div>

</div>

</div>

<div class="score">

<span>
    X <b id="scoreX">0</b>
</span>

<span>
    DRAW <b id="scoreDraw">0</b>
</span>

<span>
    O <b id="scoreO">0</b>
</span>

</div>

</div>

<div
    id="status"
    class="status"
>
    Buat atau masuk room untuk bermain
</div>

<div
    id="board"
    class="board"
>

<button class="cell" data-index="0"></button>
<button class="cell" data-index="1"></button>
<button class="cell" data-index="2"></button>

<button class="cell" data-index="3"></button>
<button class="cell" data-index="4"></button>
<button class="cell" data-index="5"></button>

<button class="cell" data-index="6"></button>
<button class="cell" data-index="7"></button>
<button class="cell" data-index="8"></button>

</div>

<div class="actions">

<button
    class="btn"
    id="rematchBtn"
>
    ↻ REMATCH
</button>

<button
    class="btn"
    id="leaveBtn"
>
    LEAVE ROOM
</button>

</div>

<div class="chat">

<div class="chat-title">
    ROOM CHAT
</div>

<div
    id="chatLog"
    class="chat-log"
></div>

<div class="chat-send">

<input
    id="chatInput"
    class="chat-input"
    maxlength="300"
    placeholder="Ketik pesan..."
    autocomplete="off"
>

<button
    class="send-chat"
    id="sendChat"
>
    KIRIM
</button>

</div>

</div>

<div class="footer">

TicTacToeMP · Realtime Multiplayer<br>
TTT Realtime

</div>

</div>

</div>

<script>

(function () {

'use strict';

/* ========================================================
 * CONFIG
 * ======================================================== */

const WS_URL =
    '${safeWs}';

/* ========================================================
 * DOM
 * ======================================================== */

const $ = id =>
    document.getElementById(id);

const nameInput =
    $('nameInput');

const roomInput =
    $('roomInput');

const createBtn =
    $('createBtn');

const showJoinBtn =
    $('showJoinBtn');

const joinBtn =
    $('joinBtn');

const joinBox =
    $('joinBox');

const roomPanel =
    $('roomPanel');

const roomCode =
    $('roomCode');

const copyBtn =
    $('copyBtn');

const statusEl =
    $('status');

const connectionDot =
    $('connectionDot');

const connectionText =
    $('connectionText');

const nameX =
    $('nameX');

const nameO =
    $('nameO');

const playerX =
    $('playerX');

const playerO =
    $('playerO');

const scoreX =
    $('scoreX');

const scoreO =
    $('scoreO');

const scoreDraw =
    $('scoreDraw');

const rematchBtn =
    $('rematchBtn');

const leaveBtn =
    $('leaveBtn');

const chatInput =
    $('chatInput');

const sendChat =
    $('sendChat');

const chatLog =
    $('chatLog');

const cells =
    Array.from(
        document.querySelectorAll('.cell')
    );

/* ========================================================
 * LOCAL PLAYER ID
 * ======================================================== */

let playerId = '';

try {

    playerId =
        localStorage.getItem(
            'tictactoemp_player_id'
        );

} catch {}

if (!playerId) {

    playerId =
        'p_' +
        Math.random()
            .toString(36)
            .slice(2) +
        Date.now()
            .toString(36);

    try {

        localStorage.setItem(
            'tictactoemp_player_id',
            playerId
        );

    } catch {}
}

/* ========================================================
 * STATE
 * ======================================================== */

let ws = null;

let room = '';

let playerName = '';

let mySymbol = '';

let isHost = false;

let state = null;

let reconnectTimer = null;

let reconnectAttempts = 0;

let manualLeave = false;

/* ========================================================
 * DEFAULT STATE
 * ======================================================== */

function defaultState() {

    return {

        room: room,

        hostId: '',

        players: [],

        board: Array(9).fill(null),

        turn: 'X',

        state: 'waiting',

        winner: null,

        winningLine: [],

        scores: {
            X: 0,
            O: 0,
            draw: 0
        },

        round: 1

    };

}

/* ========================================================
 * STORAGE NAME
 * ======================================================== */

try {

    const saved =
        localStorage.getItem(
            'tictactoemp_name'
        );

    if (saved) {
        nameInput.value =
            saved;
    }

} catch {}

/* ========================================================
 * HELPERS
 * ======================================================== */

function getName() {

    let name =
        String(
            nameInput.value || ''
        ).trim();

    if (!name) {
        name = 'Player';
    }

    name =
        name.slice(0, 20);

    try {

        localStorage.setItem(
            'tictactoemp_name',
            name
        );

    } catch {}

    return name;
}

function randomRoom() {

    const chars =
        'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    let out = '';

    for (
        let i = 0;
        i < 6;
        i++
    ) {

        out +=
            chars[
                Math.floor(
                    Math.random() *
                    chars.length
                )
            ];

    }

    return out;
}

function setConnection(
    type,
    text
) {

    connectionDot.className =
        'connection-dot';

    if (type === 'online') {

        connectionDot.classList.add(
            'online'
        );

    }

    if (type === 'error') {

        connectionDot.classList.add(
            'error'
        );

    }

    connectionText.textContent =
        text;
}

function setStatus(text) {

    statusEl.textContent =
        text;
}

/* ========================================================
 * SEND WS
 * ======================================================== */

function send(data) {

    if (
        !ws ||
        ws.readyState !==
        WebSocket.OPEN
    ) {
        return false;
    }

    try {

        ws.send(
            JSON.stringify(data)
        );

        return true;

    } catch {

        return false;

    }
}

/* ========================================================
 * CONNECT
 * ======================================================== */

function connect() {

    if (!room) return;

    manualLeave = false;

    if (ws) {

        try {
            ws.close();
        } catch {}

    }

    setConnection(
        '',
        'CONNECTING'
    );

    setStatus(
        'Membuka koneksi realtime...'
    );

    try {

        ws =
            new WebSocket(
                WS_URL
            );

        ws.onopen =
            function () {

                reconnectAttempts = 0;

                setConnection(
                    'online',
                    'ONLINE'
                );

                setStatus(
                    'Menghubungkan ke room ' +
                    room +
                    '...'
                );

                send({
                    type: 'tttmp_join',
                    room: room,
                    playerId: playerId,
                    name: playerName,
                    host: isHost
                });

            };

        ws.onmessage =
            function (event) {

                let data;

                try {

                    data =
                        JSON.parse(
                            event.data
                        );

                } catch {

                    return;

                }

                handleMessage(data);

            };

        ws.onerror =
            function () {

                setConnection(
                    'error',
                    'ERROR'
                );

            };

        ws.onclose =
            function () {

                setConnection(
                    'error',
                    'CLOSED'
                );

                if (
                    room &&
                    !manualLeave
                ) {

                    setStatus(
                        'Koneksi terputus. Mencoba kembali...'
                    );

                    scheduleReconnect();

                }

            };

    } catch (error) {

        setConnection(
            'error',
            'FAILED'
        );

        setStatus(
            'WebSocket gagal'
        );

        scheduleReconnect();

    }

}

/* ========================================================
 * RECONNECT
 * ======================================================== */

function scheduleReconnect() {

    if (reconnectTimer) {
        return;
    }

    const delay =
        Math.min(
            1000 *
            Math.pow(
                2,
                reconnectAttempts
            ),
            10000
        );

    reconnectAttempts++;

    reconnectTimer =
        setTimeout(
            function () {

                reconnectTimer =
                    null;

                connect();

            },
            delay
        );

}

/* ========================================================
 * CREATE
 * ======================================================== */

function createRoom() {

    playerName =
        getName();

    room =
        randomRoom();

    mySymbol =
        'X';

    isHost =
        true;

    state =
        defaultState();

    roomPanel.classList.add(
        'show'
    );

    roomCode.textContent =
        room;

    renderState(
        state
    );

    addChat(
        'SYSTEM',
        'Room dibuat. Bagikan kode ' +
        room +
        ' ke pemain kedua.'
    );

    connect();

}

/* ========================================================
 * JOIN
 * ======================================================== */

function joinRoom() {

    const code =
        String(
            roomInput.value || ''
        )
        .trim()
        .toUpperCase()
        .slice(0, 6);

    if (!code) {

        setStatus(
            'Masukkan kode room.'
        );

        return;

    }

    playerName =
        getName();

    room =
        code;

    mySymbol =
        '';

    isHost =
        false;

    state =
        null;

    roomPanel.classList.add(
        'show'
    );

    roomCode.textContent =
        room;

    connect();

}

/* ========================================================
 * MESSAGE HANDLER
 * ======================================================== */

function handleMessage(data) {

    if (!data) return;

    /*
     * Hanya pesan TTTMP.
     */

    if (
        data.type ===
        'tttmp_join'
    ) {

        handleJoin(
            data
        );

        return;

    }

    if (
        data.type ===
        'tttmp_joined'
    ) {

        if (
            data.playerId ===
            playerId
        ) {

            mySymbol =
                data.symbol || mySymbol;

            isHost =
                data.hostId === playerId;

        }

        if (data.data) {

            state =
                data.data;

            renderState(
                state
            );

        }

        addChat(
            'SYSTEM',
            data.message ||
            'Berhasil masuk room.'
        );

        return;

    }

    if (
        data.type ===
        'tttmp_state'
    ) {

        if (
            data.room !== room
        ) {
            return;
        }

        state =
            data.data;

        if (
            data.hostId
        ) {

            isHost =
                data.hostId ===
                playerId;

        }

        const me =
            state.players?.find(
                p =>
                    p.id === playerId
            );

        if (me) {
            mySymbol =
                me.symbol || mySymbol;
        }

        renderState(
            state
        );

        return;

    }

    if (
        data.type ===
        'tttmp_move'
    ) {

        if (
            data.room !== room ||
            !isHost
        ) {
            return;
        }

        processMove(
            data.playerId,
            data.index
        );

        return;

    }

    if (
        data.type ===
        'tttmp_rematch'
    ) {

        if (
            data.room !== room ||
            !isHost
        ) {
            return;
        }

        startRematch();

        return;

    }

    if (
        data.type ===
        'tttmp_chat'
    ) {

        if (
            data.room === room
        ) {

            addChat(
                data.name ||
                'Player',
                data.message ||
                ''
            );

        }

        return;

    }

    if (
        data.type ===
        'tttmp_leave'
    ) {

        if (
            data.room !== room
        ) {
            return;
        }

        handleLeave(
            data
        );

        return;

    }

    if (
        data.type ===
        'tttmp_ping'
    ) {

        send({
            type:
                'tttmp_pong',
            room:
                room,
            playerId:
                playerId,
            time:
                Date.now()
        });

        return;

    }

}

/* ========================================================
 * JOIN HANDLER
 * ======================================================== */

function handleJoin(data) {

    if (
        data.room !== room
    ) {
        return;
    }

    /*
     * Jika kita host:
     * tambahkan pemain baru.
     */

    if (isHost) {

        if (!state) {
            state =
                defaultState();
        }

        let existing =
            state.players.find(
                p =>
                    p.id ===
                    data.playerId
            );

        if (!existing) {

            if (
                state.players.length >= 2
            ) {

                send({
                    type:
                        'tttmp_joined',
                    playerId:
                        data.playerId,
                    symbol:
                        '',
                    hostId:
                        state.hostId,
                    data:
                        state,
                    message:
                        'Room penuh. Kamu menjadi penonton.'
                });

                return;

            }

            const symbol =
                state.players.some(
                    p =>
                        p.symbol === 'X'
                )
                    ? 'O'
                    : 'X';

            existing = {

                id:
                    data.playerId,

                name:
                    String(
                        data.name ||
                        'Player'
                    ).slice(
                        0,
                        20
                    ),

                symbol:
                    symbol,

                connected:
                    true

            };

            state.players.push(
                existing
            );

        } else {

            existing.connected =
                true;

        }

        if (!state.hostId) {

            state.hostId =
                playerId;

        }

        if (
            state.players.length >= 2 &&
            state.state === 'waiting'
        ) {

            state.state =
                'playing';

            state.turn =
                'X';

        }

        broadcastState();

        return;

    }

    /*
     * Kalau bukan host,
     * kita cuma memberi tahu host.
     */

    return;

}

/* ========================================================
 * BROADCAST STATE
 * ======================================================== */

function broadcastState() {

    if (!state) return;

    state.room =
        room;

    state.hostId =
        state.hostId ||
        playerId;

    /*
     * broadcast/echo, jadi kirim state
     * sebagai pesan biasa.
     */

    send({
        type:
            'tttmp_state',

        room:
            room,

        hostId:
            state.hostId,

        data:
            state,

        sender:
            playerId
    });

    renderState(
        state
    );

}

/* ========================================================
 * MOVE REQUEST
 * ======================================================== */

function move(index) {

    if (!room) {

        setStatus(
            'Masuk room terlebih dahulu.'
        );

        return;

    }

    if (!mySymbol) {

        setStatus(
            'Kamu sedang menjadi penonton.'
        );

        return;

    }

    if (
        !state ||
        state.state !==
        'playing'
    ) {

        return;

    }

    if (
        state.turn !==
        mySymbol
    ) {

        return;

    }

    if (
        state.board[index]
    ) {

        return;

    }

    /*
     * Host langsung memproses.
     */

    if (isHost) {

        processMove(
            playerId,
            index
        );

        return;

    }

    send({
        type:
            'tttmp_move',

        room:
            room,

        playerId:
            playerId,

        symbol:
            mySymbol,

        index:
            index
    });

}

/* ========================================================
 * PROCESS MOVE - HOST
 * ======================================================== */

function processMove(
    senderId,
    index
) {

    if (!isHost) return;

    if (
        !state ||
        state.state !==
        'playing'
    ) {
        return;
    }

    const player =
        state.players.find(
            p =>
                p.id ===
                senderId
        );

    if (!player) return;

    if (
        player.symbol !==
        state.turn
    ) {
        return;
    }

    index =
        Number(index);

    if (
        !Number.isInteger(index) ||
        index < 0 ||
        index > 8
    ) {
        return;
    }

    if (
        state.board[index]
    ) {
        return;
    }

    state.board[index] =
        player.symbol;

    const result =
        checkWinner(
            state.board
        );

    if (result) {

        state.state =
            'finished';

        state.winner =
            result.winner;

        state.winningLine =
            result.line;

        if (
            result.winner ===
            'draw'
        ) {

            state.scores.draw =
                Number(
                    state.scores.draw || 0
                ) + 1;

        } else {

            state.scores[
                result.winner
            ] =
                Number(
                    state.scores[
                        result.winner
                    ] || 0
                ) + 1;

        }

    } else {

        state.turn =
            player.symbol === 'X'
                ? 'O'
                : 'X';

    }

    broadcastState();

}

/* ========================================================
 * WINNER
 * ======================================================== */

function checkWinner(board) {

    const lines = [

        [0,1,2],
        [3,4,5],
        [6,7,8],

        [0,3,6],
        [1,4,7],
        [2,5,8],

        [0,4,8],
        [2,4,6]

    ];

    for (
        const line of lines
    ) {

        const [
            a,
            b,
            c
        ] = line;

        if (
            board[a] &&
            board[a] === board[b] &&
            board[a] === board[c]
        ) {

            return {

                winner:
                    board[a],

                line:
                    line

            };

        }

    }

    if (
        board.every(Boolean)
    ) {

        return {

            winner:
                'draw',

            line:
                []

        };

    }

    return null;

}

/* ========================================================
 * REMATCH
 * ======================================================== */

function rematch() {

    if (!room) return;

    if (!state) return;

    send({
        type:
            'tttmp_rematch',

        room:
            room,

        playerId:
            playerId
    });

}

/* ========================================================
 * START REMATCH - HOST
 * ======================================================== */

function startRematch() {

    if (!isHost) return;

    if (!state) return;

    if (
        state.players.length < 2
    ) {

        setStatus(
            'Menunggu pemain kedua...'
        );

        return;

    }

    state.board =
        Array(9).fill(null);

    state.turn =
        'X';

    state.state =
        'playing';

    state.winner =
        null;

    state.winningLine =
        [];

    state.round =
        Number(
            state.round || 1
        ) + 1;

    broadcastState();

}

/* ========================================================
 * LEAVE
 * ======================================================== */

function leaveRoom() {

    if (room) {

        send({
            type:
                'tttmp_leave',

            room:
                room,

            playerId:
                playerId,

            name:
                playerName
        });

    }

    manualLeave =
        true;

    if (reconnectTimer) {

        clearTimeout(
            reconnectTimer
        );

        reconnectTimer =
            null;

    }

    if (ws) {

        try {
            ws.close();
        } catch {}

        ws = null;

    }

    room =
        '';

    mySymbol =
        '';

    isHost =
        false;

    state =
        null;

    roomPanel.classList.remove(
        'show'
    );

    cells.forEach(
        cell => {

            cell.textContent =
                '';

            cell.classList.remove(
                'x',
                'o',
                'win'
            );

        }
    );

    setConnection(
        '',
        'OFFLINE'
    );

    setStatus(
        'Buat atau masuk room untuk bermain'
    );

}

/* ========================================================
 * HANDLE LEAVE
 * ======================================================== */

function handleLeave(data) {

    if (!state) return;

    const leaving =
        state.players.find(
            p =>
                p.id ===
                data.playerId
        );

    if (leaving) {

        leaving.connected =
            false;

    }

    /*
     * Kalau host keluar,
     * pemain lain mengambil alih.
     */

    if (
        data.playerId ===
        state.hostId
    ) {

        const next =
            state.players.find(
                p =>
                    p.id !==
                    data.playerId &&
                    p.connected
            );

        if (next) {

            state.hostId =
                next.id;

            if (
                next.id ===
                playerId
            ) {

                isHost =
                    true;

                setStatus(
                    'Kamu menjadi host room.'
                );

                broadcastState();

            }

        }

    }

    renderState(
        state
    );

    addChat(
        'SYSTEM',
        (
            data.name ||
            'Player'
        ) +
        ' keluar dari room.'
    );

}

/* ========================================================
 * CHAT
 * ======================================================== */

function sendChatMessage() {

    const message =
        String(
            chatInput.value || ''
        ).trim();

    if (!message) return;

    if (!room) {

        setStatus(
            'Masuk room dahulu.'
        );

        return;

    }

    if (
        send({
            type:
                'tttmp_chat',

            room:
                room,

            playerId:
                playerId,

            name:
                playerName,

            message:
                message.slice(
                    0,
                    300
                )
        })
    ) {

        chatInput.value =
            '';

    }

}

/* ========================================================
 * CHAT UI
 * ======================================================== */

function addChat(
    name,
    message
) {

    const row =
        document.createElement(
            'div'
        );

    row.className =
        'chat-message';

    const bold =
        document.createElement(
            'b'
        );

    bold.textContent =
        name + ': ';

    row.appendChild(
        bold
    );

    row.appendChild(
        document.createTextNode(
            message
        )
    );

    chatLog.appendChild(
        row
    );

    chatLog.scrollTop =
        chatLog.scrollHeight;

}

/* ========================================================
 * COPY
 * ======================================================== */

async function copyRoom() {

    if (!room) return;

    try {

        await navigator
            .clipboard
            .writeText(room);

        copyBtn.textContent =
            'TERSALIN!';

        setTimeout(
            () => {

                copyBtn.textContent =
                    'SALIN';

            },
            1200
        );

    } catch {

        setStatus(
            'Kode room: ' +
            room
        );

    }

}

/* ========================================================
 * RENDER
 * ======================================================== */

function renderState(data) {

    if (!data) return;

    state =
        data;

    room =
        data.room ||
        room;

    roomCode.textContent =
        room ||
        '------';

    const board =
        Array.isArray(
            data.board
        )
            ? data.board
            : Array(9).fill(null);

    cells.forEach(
        (
            cell,
            index
        ) => {

            const value =
                board[index];

            cell.textContent =
                value ||
                '';

            cell.classList.remove(
                'x',
                'o',
                'win'
            );

            if (
                value ===
                'X'
            ) {

                cell.classList.add(
                    'x'
                );

            }

            if (
                value ===
                'O'
            ) {

                cell.classList.add(
                    'o'
                );

            }

        }
    );

    const players =
        Array.isArray(
            data.players
        )
            ? data.players
            : [];

    const px =
        players.find(
            p =>
                p.symbol ===
                'X'
        );

    const po =
        players.find(
            p =>
                p.symbol ===
                'O'
        );

    nameX.textContent =
        px
            ? (
                px.name +
                (
                    px.connected
                        ? ''
                        : ' · offline'
                )
            )
            : 'Menunggu...';

    nameO.textContent =
        po
            ? (
                po.name +
                (
                    po.connected
                        ? ''
                        : ' · offline'
                )
            )
            : 'Menunggu...';

    playerX.classList.toggle(
        'active',
        data.turn ===
        'X' &&
        data.state ===
        'playing'
    );

    playerO.classList.toggle(
        'active',
        data.turn ===
        'O' &&
        data.state ===
        'playing'
    );

    const scores =
        data.scores ||
        {};

    scoreX.textContent =
        Number(
            scores.X || 0
        );

    scoreO.textContent =
        Number(
            scores.O || 0
        );

    scoreDraw.textContent =
        Number(
            scores.draw || 0
        );

    const winningLine =
        Array.isArray(
            data.winningLine
        )
            ? data.winningLine
            : [];

    winningLine.forEach(
        index => {

            if (
                cells[index]
            ) {

                cells[index]
                    .classList
                    .add(
                        'win'
                    );

            }

        }
    );

    /*
     * Status
     */

    if (
        data.state ===
        'waiting'
    ) {

        setStatus(
            'Menunggu pemain kedua...'
        );

    } else if (
        data.state ===
        'playing'
    ) {

        if (
            data.turn ===
            mySymbol
        ) {

            setStatus(
                '🎯 Giliran kamu (' +
                mySymbol +
                ')'
            );

        } else {

            setStatus(
                '⏳ Giliran ' +
                data.turn
            );

        }

    } else if (
        data.state ===
        'finished'
    ) {

        if (
            data.winner ===
            'draw'
        ) {

            setStatus(
                '🤝 Permainan seri!'
            );

        } else if (
            data.winner ===
            mySymbol
        ) {

            setStatus(
                '🏆 Kamu menang!'
            );

        } else {

            setStatus(
                '💀 Kamu kalah.'
            );

        }

    }

}

/* ========================================================
 * EVENTS
 * ======================================================== */

createBtn.addEventListener(
    'click',
    createRoom
);

showJoinBtn.addEventListener(
    'click',
    function () {

        joinBox.classList.toggle(
            'hidden'
        );

        if (
            !joinBox.classList.contains(
                'hidden'
            )
        ) {

            roomInput.focus();

        }

    }
);

joinBtn.addEventListener(
    'click',
    joinRoom
);

copyBtn.addEventListener(
    'click',
    copyRoom
);

rematchBtn.addEventListener(
    'click',
    rematch
);

leaveBtn.addEventListener(
    'click',
    leaveRoom
);

sendChat.addEventListener(
    'click',
    sendChatMessage
);

chatInput.addEventListener(
    'keydown',
    function (event) {

        if (
            event.key ===
            'Enter'
        ) {

            sendChatMessage();

        }

    }
);

roomInput.addEventListener(
    'input',
    function () {

        roomInput.value =
            roomInput.value
                .toUpperCase()
                .replace(
                    /[^A-Z0-9]/g,
                    ''
                )
                .slice(
                    0,
                    6
                );

    }
);

cells.forEach(
    cell => {

        cell.addEventListener(
            'click',
            function () {

                move(
                    Number(
                        cell.dataset.index
                    )
                );

            }
        );

    }
);

/* ========================================================
 * START
 * ======================================================== */

setConnection(
    '',
    'OFFLINE'
);

})();

</script>
`
}

/* =========================================================
 * SEND RICH RESPONSE
 * ========================================================= */

async function sendTicTacToeMP(
    sock,
    m,
    html
) {

    const responseId =
        generateMessageIDV2()

    const sources = [
        {
            source_type:
                'THIRD_PARTY',

            source_display_name:
                'TicTacToeMP',

            source_subtitle:
                'Realtime Multiplayer',

            source_url:
                WEB_URL
        }
    ]

    const unifiedData =
        Buffer
            .from(
                JSON.stringify({

                    response_id:
                        responseId,

                    sections: [

                        {
                            view_model: {

                                primitive: {

                                    __typename:
                                        'GenAIaeacdsnwHtmlPrimitive',

                                    payload:
                                        html,

                                    trusted_sources:
                                        [
                                            WEB_URL
                                        ]
                                },

                                __typename:
                                    'GenAISingleLayoutViewModel'
                            }
                        }

                    ]

                })
            )
            .toString(
                'base64'
            )

    const isi = {

        messageContextInfo: {

            deviceListMetadata:
                {},

            deviceListMetadataVersion:
                2,

            botMetadata: {

                messageDisclaimerText:
                    'TicTacToeMP',

                botResponseId:
                    responseId,

                richResponseSourcesMetadata: {

                    sources:
                        sources

                }

            }

        },

        botForwardedMessage: {

            message: {

                richResponseMessage: {

                    messageType:
                        1,

                    submessages: [

                        {

                            messageType:
                                proto
                                    .AIRichResponseSubMessageType
                                    .AI_RICH_RESPONSE_TEXT,

                            messageText:
                                'TicTacToeMP'

                        }

                    ],

                    unifiedResponse: {

                        data:
                            unifiedData

                    },

                    contextInfo: {

                        forwardingScore:
                            1,

                        isForwarded:
                            true,

                        forwardedAiBotMessageInfo: {

                            botJid:
                                BOT_JID

                        },

                        forwardOrigin:
                            4

                    }

                }

            }

        }

    }

    const msg =
        generateWAMessageFromContent(
            m.chat,
            isi,
            {
                messageId:
                    generateMessageIDV2()
            }
        )

    await sock.relayMessage(
        m.chat,
        msg.message,
        {
            messageId:
                msg.key.id
        }
    )

}

/* =========================================================
 * PLUGIN CONFIG
 * ========================================================= */

const pluginConfig = {

    name: 'tictactoemp',

    alias: [
        'tttmp',
        'tiktaktomp'
    ],

    category: 'game',

    description:
        'TicTacToe multiplayer realtime antar perangkat.',

    usage:
        '.tictactoemp',

    example:
        '.tictactoemp',

    isOwner: false,

    isPremium: false,

    isGroup: false,

    isPrivate: false,

    cooldown: 5,

    energi: 1,

    isEnabled: true
}

/* =========================================================
 * HANDLER
 * ========================================================= */

async function handler(
    m,
    { sock }
) {

    try {

        if (m.react) {
            await m.react(
                '🎮'
            )
        }

        const html =
            createGameHTML()

        await sendTicTacToeMP(
            sock,
            m,
            html
        )

        if (m.react) {
            await m.react(
                '✅'
            )
        }

    } catch (error) {

        console.error(
            '[tictactoemp]',
            error
        )

        if (m.react) {
            await m.react(
                '❌'
            )
        }

        return m.reply(
            '❌ Gagal mengirim TicTacToeMP\\n\\n' +
            (
                error?.message ||
                'Unknown error'
            )
        )

    }

}

/* =========================================================
 * EXPORT
 * ========================================================= */

module.exports = {
    config:
        pluginConfig,

    handler
}