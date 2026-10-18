/**
✧ Name    : ledcontroller
✧ Category: tools
**/

const config = require('../../config')

const pluginConfig = {
    name: 'ledcontroller',
    alias: ['led', 'neonctrl'],
    category: 'tools',
    description: 'LED Controller - Sea atau Reski mode 💡',
    usage: '.led sea | .led reski',
    example: '.led sea',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 1,
    isEnabled: true
}

// ===== HTML SEA =====
const ledHtmlSea = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { 
    font-family: 'Segoe UI', Arial, sans-serif;
    background: #0a0a0a;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 20px;
    padding-top: 40px;
    overflow-y: auto;
  }
  .container {
    background: rgba(20, 20, 30, 0.95);
    padding: 40px;
    border-radius: 30px;
    max-width: 700px;
    width: 100%;
    border: 1px solid rgba(255,255,255,0.05);
    box-shadow: 0 0 80px rgba(0,0,0,0.8);
    margin-bottom: 40px;
  }
  h1 { 
    color: #fff;
    font-size: 32px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 5px;
  }
  .subtitle {
    color: #666;
    font-size: 14px;
    margin-bottom: 20px;
    letter-spacing: 2px;
  }
  .led-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  .led-item {
    background: rgba(255,255,255,0.03);
    padding: 20px;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.05);
    transition: 0.3s;
    position: relative;
    overflow: hidden;
  }
  .led-item:hover {
    transform: translateY(-5px);
    border-color: rgba(255,255,255,0.1);
  }
  .led-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }
  .led-label {
    color: #fff;
    font-weight: bold;
    font-size: 18px;
  }
  .led-indicator {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    display: inline-block;
    transition: all 0.5s ease;
  }
  .indicator-on {
    background: #4CAF50;
    box-shadow: 0 0 25px rgba(76,175,80,0.8);
    animation: pulse 1.5s ease-in-out infinite;
  }
  .indicator-off {
    background: #444;
    box-shadow: none;
    animation: none;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.7); }
  }
  .led-status {
    font-size: 13px;
    padding: 3px 12px;
    border-radius: 20px;
    font-weight: 600;
    transition: all 0.5s ease;
    display: inline-block;
  }
  .status-on {
    background: rgba(76,175,80,0.2);
    color: #4CAF50;
    border: 1px solid rgba(76,175,80,0.3);
  }
  .status-off {
    background: rgba(255,255,255,0.05);
    color: #666;
    border: 1px solid rgba(255,255,255,0.05);
  }
  .btn-group {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }
  .btn { 
    display: inline-block; 
    padding: 10px 0; 
    font-size: 14px; 
    font-weight: 700; 
    text-decoration: none; 
    color: white; 
    border-radius: 10px; 
    border: none; 
    cursor: pointer; 
    transition: all 0.2s ease; 
    flex: 1;
    text-align: center;
    letter-spacing: 1px;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
  .btn:active {
    transform: scale(0.92) !important;
  }
  .btn-on { 
    background: linear-gradient(135deg, #4CAF50, #2E7D32);
    box-shadow: 0 4px 15px rgba(76,175,80,0.3);
  }
  .btn-on:hover { 
    transform: scale(1.03);
    box-shadow: 0 6px 25px rgba(76,175,80,0.5);
  }
  .btn-off { 
    background: linear-gradient(135deg, #f44336, #B71C1C);
    box-shadow: 0 4px 15px rgba(244,67,54,0.3);
  }
  .btn-off:hover { 
    transform: scale(1.03);
    box-shadow: 0 6px 25px rgba(244,67,54,0.5);
  }
  .led-item[data-led="1"] .indicator-on { 
    background: #FF6B6B;
    box-shadow: 0 0 30px rgba(255,107,107,0.8);
  }
  .led-item[data-led="1"] .status-on { 
    background: rgba(255,107,107,0.2);
    color: #FF6B6B;
    border-color: rgba(255,107,107,0.3);
  }
  .led-item[data-led="2"] .indicator-on { 
    background: #4ECDC4;
    box-shadow: 0 0 30px rgba(78,205,196,0.8);
  }
  .led-item[data-led="2"] .status-on { 
    background: rgba(78,205,196,0.2);
    color: #4ECDC4;
    border-color: rgba(78,205,196,0.3);
  }
  .led-item[data-led="3"] .indicator-on { 
    background: #FFD93D;
    box-shadow: 0 0 30px rgba(255,217,61,0.8);
  }
  .led-item[data-led="3"] .status-on { 
    background: rgba(255,217,61,0.2);
    color: #FFD93D;
    border-color: rgba(255,217,61,0.3);
  }
  .led-item[data-led="4"] .indicator-on { 
    background: #6BCB77;
    box-shadow: 0 0 30px rgba(107,203,119,0.8);
  }
  .led-item[data-led="4"] .status-on { 
    background: rgba(107,203,119,0.2);
    color: #6BCB77;
    border-color: rgba(107,203,119,0.3);
  }
  .all-controls {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin-top: 25px;
    padding-top: 25px;
    border-top: 1px solid rgba(255,255,255,0.05);
  }
  .btn-all {
    padding: 12px 30px;
    flex: 0 1 auto;
    min-width: 140px;
    font-size: 15px;
    border-radius: 12px;
  }
  .btn-all-on {
    background: linear-gradient(135deg, #667eea, #764ba2);
    box-shadow: 0 4px 20px rgba(102,126,234,0.4);
  }
  .btn-all-on:hover {
    transform: scale(1.03);
    box-shadow: 0 6px 30px rgba(102,126,234,0.6);
  }
  .btn-all-off {
    background: linear-gradient(135deg, #666, #333);
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  }
  .btn-all-off:hover {
    transform: scale(1.03);
    box-shadow: 0 6px 30px rgba(0,0,0,0.5);
  }
  .notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(20,20,30,0.95);
    color: #fff;
    padding: 14px 28px;
    border-radius: 14px;
    border-left: 4px solid #4CAF50;
    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    transform: translateX(calc(100% + 30px));
    transition: transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    z-index: 1000;
    font-size: 14px;
    font-weight: 600;
    max-width: 300px;
  }
  .notification.show {
    transform: translateX(0);
  }
  ::-webkit-scrollbar {
    width: 6px;
  }
  ::-webkit-scrollbar-track {
    background: rgba(255,255,255,0.05);
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.2);
    border-radius: 10px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255,255,255,0.3);
  }
  @media (max-width: 480px) {
    .led-container { grid-template-columns: 1fr; }
    .container { padding: 20px; margin-top: 10px; }
    h1 { font-size: 24px; }
    .all-controls { flex-direction: column; align-items: center; }
    .btn-all { width: 100%; }
    .notification {
      top: 10px;
      right: 10px;
      left: 10px;
      max-width: none;
      transform: translateY(calc(-100% - 30px));
    }
    .notification.show { transform: translateY(0); }
    body { padding-top: 20px; padding-bottom: 20px; }
  }
</style>
</head>
<body>
<div class="container">
  <h1>⚡ NEON CTRL</h1>
  <p class="subtitle">✦ 4 CHANNEL LED CONTROLLER ✦</p>
  <div class="led-container">
    <div class="led-item" data-led="1">
      <div class="led-header">
        <span class="led-label">🔴 LED 1</span>
        <span class="led-indicator indicator-off" id="indicator1"></span>
      </div>
      <span class="led-status status-off" id="status1">⬤ OFF</span>
      <div class="btn-group">
        <button class="btn btn-on" data-led="1" data-action="on">ON</button>
        <button class="btn btn-off" data-led="1" data-action="off">OFF</button>
      </div>
    </div>
    <div class="led-item" data-led="2">
      <div class="led-header">
        <span class="led-label">🟢 LED 2</span>
        <span class="led-indicator indicator-off" id="indicator2"></span>
      </div>
      <span class="led-status status-off" id="status2">⬤ OFF</span>
      <div class="btn-group">
        <button class="btn btn-on" data-led="2" data-action="on">ON</button>
        <button class="btn btn-off" data-led="2" data-action="off">OFF</button>
      </div>
    </div>
    <div class="led-item" data-led="3">
      <div class="led-header">
        <span class="led-label">🟡 LED 3</span>
        <span class="led-indicator indicator-off" id="indicator3"></span>
      </div>
      <span class="led-status status-off" id="status3">⬤ OFF</span>
      <div class="btn-group">
        <button class="btn btn-on" data-led="3" data-action="on">ON</button>
        <button class="btn btn-off" data-led="3" data-action="off">OFF</button>
      </div>
    </div>
    <div class="led-item" data-led="4">
      <div class="led-header">
        <span class="led-label">🟣 LED 4</span>
        <span class="led-indicator indicator-off" id="indicator4"></span>
      </div>
      <span class="led-status status-off" id="status4">⬤ OFF</span>
      <div class="btn-group">
        <button class="btn btn-on" data-led="4" data-action="on">ON</button>
        <button class="btn btn-off" data-led="4" data-action="off">OFF</button>
      </div>
    </div>
  </div>
  <div class="all-controls">
    <button class="btn btn-all btn-all-on" id="allOn">✦ ALL ON</button>
    <button class="btn btn-all btn-all-off" id="allOff">✧ ALL OFF</button>
  </div>
</div>
<div class="notification" id="notification"></div>
<script>
const ledState = { 1: false, 2: false, 3: false, 4: false };
const ledNames = { 1: 'LED 1', 2: 'LED 2', 3: 'LED 3', 4: 'LED 4' };
function controlLED(ledNumber, action) {
  const isOn = action === 'on';
  ledState[ledNumber] = isOn;
  const indicator = document.getElementById('indicator' + ledNumber);
  const status = document.getElementById('status' + ledNumber);
  if (isOn) {
    indicator.className = 'led-indicator indicator-on';
    status.className = 'led-status status-on';
    status.textContent = '⬤ ON';
    showNotification('⚡ ' + ledNames[ledNumber] + ' menyala');
  } else {
    indicator.className = 'led-indicator indicator-off';
    status.className = 'led-status status-off';
    status.textContent = '⬤ OFF';
    showNotification('⚡ ' + ledNames[ledNumber] + ' mati');
  }
}
document.querySelectorAll('.btn[data-led]').forEach(function(button) {
  button.addEventListener('click', function(e) {
    e.preventDefault();
    var led = parseInt(this.dataset.led);
    var action = this.dataset.action;
    controlLED(led, action);
  });
});
document.getElementById('allOn').addEventListener('click', function(e) {
  e.preventDefault();
  for (var i = 1; i <= 4; i++) {
    controlLED(i, 'on');
  }
  showNotification('⚡ Semua LED menyala');
});
document.getElementById('allOff').addEventListener('click', function(e) {
  e.preventDefault();
  for (var i = 1; i <= 4; i++) {
    controlLED(i, 'off');
  }
  showNotification('⚡ Semua LED mati');
});
function showNotification(message) {
  var notification = document.getElementById('notification');
  notification.textContent = message;
  notification.className = 'notification show';
  clearTimeout(window.notifTimeout);
  window.notifTimeout = setTimeout(function() {
    notification.className = 'notification';
  }, 2000);
}
setTimeout(function() {
  controlLED(1, 'on');
  controlLED(3, 'on');
}, 100);
</script>
</body>
</html>`;

// ===== HTML RESKI (ESP32 Smart Light) =====
const ledHtmlReski = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ESP32 Smart Light</title>
<style>
*{
    box-sizing:border-box;
    margin:0;
    padding:0;
}
body{
    font-family:Arial,sans-serif;
    min-height:100vh;
    background:#080b10;
    color:white;
    padding:20px;
}
.container{
    max-width:700px;
    margin:auto;
}
header{
    text-align:center;
    margin:25px 0;
}
header h1{
    font-size:30px;
    letter-spacing:2px;
    color:#00e5ff;
    text-shadow:0 0 15px rgba(0,229,255,.5);
}
header p{
    color:#687482;
    font-size:13px;
    margin-top:8px;
}
.connection{
    display:flex;
    justify-content:space-between;
    align-items:center;
    padding:13px 16px;
    margin-bottom:20px;
    border-radius:12px;
    background:#10151c;
    border:1px solid #202a34;
    font-size:12px;
}
.online{
    color:#00ff88;
    font-weight:bold;
}
.dot{
    display:inline-block;
    width:8px;
    height:8px;
    border-radius:50%;
    background:#00ff88;
    margin-right:6px;
    box-shadow:0 0 10px #00ff88;
}
.master{
    background:#10151c;
    border:1px solid #202a34;
    border-radius:16px;
    padding:18px;
    margin-bottom:22px;
    text-align:center;
}
.master h2{
    font-size:13px;
    letter-spacing:3px;
    color:#71808e;
    margin-bottom:15px;
}
.master-buttons{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:10px;
}
.master button{
    padding:13px;
    border:none;
    border-radius:10px;
    color:white;
    font-weight:bold;
    cursor:pointer;
    transition:.2s;
}
.master button:active{
    transform:scale(.95);
}
.all-on{
    background:#00a86b;
}
.all-off{
    background:#d93636;
}
.grid{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:14px;
}
.card{
    background:#10151c;
    border:1px solid #202a34;
    border-radius:16px;
    padding:20px;
    text-align:center;
    transition:.25s;
}
.card.active{
    border-color:#00e5ff;
    box-shadow:0 0 20px rgba(0,229,255,.12);
}
.number{
    width:45px;
    height:45px;
    margin:0 auto 12px;
    display:flex;
    justify-content:center;
    align-items:center;
    border-radius:50%;
    background:#080b10;
    border:2px solid #303b46;
    color:#71808e;
    font-size:13px;
    font-weight:bold;
    transition:.25s;
}
.card.active .number{
    border-color:#00e5ff;
    color:#00e5ff;
    box-shadow:0 0 15px rgba(0,229,255,.4);
}
.card h2{
    font-size:17px;
    margin-bottom:12px;
}
.status{
    display:inline-block;
    padding:6px 14px;
    border-radius:20px;
    background:#191f27;
    color:#687482;
    font-size:11px;
    font-weight:bold;
    margin-bottom:15px;
}
.card.active .status{
    background:rgba(0,255,136,.1);
    color:#00ff88;
}
.buttons{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:8px;
}
.btn{
    padding:11px;
    border:none;
    border-radius:9px;
    color:white;
    font-weight:bold;
    cursor:pointer;
    transition:.2s;
}
.btn:active{
    transform:scale(.92);
}
.on{
    background:#07965f;
}
.off{
    background:#b92f2f;
}
.on:hover{
    background:#00b873;
}
.off:hover{
    background:#dc3939;
}
footer{
    text-align:center;
    color:#4e5b68;
    font-size:10px;
    margin-top:25px;
    letter-spacing:1px;
}
@media(max-width:550px){
    body{padding:12px;}
    header h1{font-size:25px;}
    .grid{grid-template-columns:1fr;}
    .master-buttons{grid-template-columns:1fr;}
}
</style>
</head>
<body>
<div class="container">
<header>
<h1>⚡ ESP32 SMART LIGHT</h1>
<p>Simple LED Control Panel</p>
</header>
<div class="connection">
<span>
<span class="dot"></span>
ESP32
</span>
<span class="online">
● ONLINE
</span>
</div>
<div class="master">
<h2>MASTER CONTROL</h2>
<div class="master-buttons">
<button class="all-on" onclick="allOn()">💡 NYALAKAN SEMUA</button>
<button class="all-off" onclick="allOff()">🌙 MATIKAN SEMUA</button>
</div>
</div>
<div class="grid">
<div class="card" id="card1">
<div class="number">01</div>
<h2>LED 1</h2>
<div class="status" id="status1">● MATI</div>
<div class="buttons">
<button class="btn on" onclick="turnOn(1)">ON</button>
<button class="btn off" onclick="turnOff(1)">OFF</button>
</div>
</div>
<div class="card" id="card2">
<div class="number">02</div>
<h2>LED 2</h2>
<div class="status" id="status2">● MATI</div>
<div class="buttons">
<button class="btn on" onclick="turnOn(2)">ON</button>
<button class="btn off" onclick="turnOff(2)">OFF</button>
</div>
</div>
<div class="card" id="card3">
<div class="number">03</div>
<h2>LED 3</h2>
<div class="status" id="status3">● MATI</div>
<div class="buttons">
<button class="btn on" onclick="turnOn(3)">ON</button>
<button class="btn off" onclick="turnOff(3)">OFF</button>
</div>
</div>
<div class="card" id="card4">
<div class="number">04</div>
<h2>LED 4</h2>
<div class="status" id="status4">● MATI</div>
<div class="buttons">
<button class="btn on" onclick="turnOn(4)">ON</button>
<button class="btn off" onclick="turnOff(4)">OFF</button>
</div>
</div>
</div>
<footer>ESP32 IoT Lighting System<br>Wokwi Web Server</footer>
</div>
<script>
function turnOn(led){
document.getElementById("card"+led).classList.add("active");
document.getElementById("status"+led).innerHTML="● MENYALA";
fetch("/led"+led+"on");
}
function turnOff(led){
document.getElementById("card"+led).classList.remove("active");
document.getElementById("status"+led).innerHTML="● MATI";
fetch("/led"+led+"off");
}
function allOn(){
for(let i=1;i<=4;i++){
document.getElementById("card"+i).classList.add("active");
document.getElementById("status"+i).innerHTML="● MENYALA";
}
fetch("/allon");
}
function allOff(){
for(let i=1;i<=4;i++){
document.getElementById("card"+i).classList.remove("active");
document.getElementById("status"+i).innerHTML="● MATI";
}
fetch("/alloff");
}
</script>
</body>
</html>`;

async function handler(m, { sock }) {
    const text = m.text?.trim() || ''

    if (!text) {
        return m.reply(
            `💡 *LED CONTROLLER*

> Pilih mode:
> ${m.prefix}led sea  - Mode Neon Ctrl
> ${m.prefix}led reski - Mode ESP32 Smart Light

*Contoh:*
> ${m.prefix}led sea`
        )
    }

    await m.react('💡')

    try {
        let html = ''
        let title = ''

        if (text.toLowerCase() === 'sea') {
            html = ledHtmlSea
            title = 'NEON CTRL'
        } else if (text.toLowerCase() === 'reski') {
            html = ledHtmlReski
            title = 'ESP32 SMART LIGHT'
        } else {
            await m.react('❌')
            return m.reply(`❌ *Mode tidak dikenal!*

> Pilihan: sea / reski
> ${m.prefix}led sea
> ${m.prefix}led reski`)
        }

        await sock.relayMessage(
            m.chat,
            {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                botForwardedMessage: {
                    message: {
                        richResponseMessage: {
                            messageType: 1,
                            submessages: [
                                {
                                    messageType: 2,
                                    messageText: title
                                }
                            ],
                            unifiedResponse: {
                                data: Buffer.from(
                                    JSON.stringify({
                                        response_id: crypto.randomUUID(),
                                        sections: [
                                            {
                                                view_model: {
                                                    primitive: {
                                                        __typename: "GenAIaeacdsnwHtmlPrimitive",
                                                        payload: html,
                                                        trusted_sources: ["nixel.dev"]
                                                    },
                                                    __typename: "GenAISingleLayoutViewModel"
                                                }
                                            }
                                        ]
                                    })
                                ).toString("base64")
                            }
                        }
                    }
                }
            },
            {}
        )

        await m.react('✅')
    } catch (error) {
        console.error('[ledcontroller] Error:', error)
        await m.react('❌')
        return m.reply(`❌ *Gagal menampilkan LED Controller!*

> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}