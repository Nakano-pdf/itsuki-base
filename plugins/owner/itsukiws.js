const http = require('http')
const server = require('../../src/lib/itsukiws/server')
const ui = require('../../src/lib/fixkit/ui')
const { argText } = require('../../src/lib/fixkit/args')

const pluginConfig = {
    name: ['itsukiws', 'wsserver'],
    alias: ['wsstatus', 'streamws'],
    category: 'owner',
    description: 'Kelola server WebSocket Itsuki untuk streaming ytplay: start, stop, status, tes',
    usage: '.itsukiws status | start | stop | test',
    example: '.itsukiws status',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 2,
    energi: 0,
    isEnabled: true,
}

const EXTERNAL = () => server.isExternal()

function externalStatus() {
    const port = server.getPort()
    return {
        running: false, host: server.getHost(), port,
        uptimeSec: 0, activeStreams: '?', maxStreams: '?', totalStreams: '?',
        tokenProtected: !!server.getStatus().tokenProtected, publicUrl: server.getPublicBase() || null,
        lastError: null, external: true,
    }
}

function statusBody(s) {
    const pub = s.publicUrl || '❌ belum diatur (ITSUKI_WS_PUBLIC_URL)'
    return [
        `*Mode:* ${s.external ? 'proses terpisah (itsuki-ws.js)' : 'di dalam bot'}`,
        `*Status:* ${s.running ? '🟢 berjalan' : (s.external ? '⏳ dicek lewat /health' : '⛔ mati')}`,
        `*Bind:* ${s.host || '-'}:${s.port || '-'}`,
        `*URL publik:* ${pub}`,
        `*Stream aktif:* ${s.activeStreams}/${s.maxStreams} · total: ${s.totalStreams}`,
        `*Token:* ${s.tokenProtected ? '🔒 aktif' : '⚠ tidak ada (disarankan diisi)'}`,
        `*Uptime:* ${s.uptimeSec} detik`,
        s.lastError ? `*Error terakhir:* ${String(s.lastError).slice(0, 200)}` : '',
    ].filter(Boolean).join('\n')
}

function buttons(s) {
    return [
        s.running
            ? { type: 'reply', text: '⛔ Stop', id: '.itsukiws stop' }
            : { type: 'reply', text: '🟢 Start', id: '.itsukiws start' },
        { type: 'reply', text: '🧪 Tes Server', id: '.itsukiws test' },
        { type: 'reply', text: '🔄 Status', id: '.itsukiws status' },
        { type: 'reply', text: '🏠 Menu Fixkit', id: '.fixkit' },
    ]
}

/** Tes: cek endpoint /health lokal dan validasi penolakan host asing. */
function selfTest(s) {
    return new Promise((resolve) => {
        const results = []
        try {
            server.validateUpstream('https://evil.example.com/x')
            results.push('❌ host asing seharusnya ditolak')
        } catch {
            results.push('✅ host asing ditolak')
        }
        try {
            server.validateUpstream('https://rr1---sn-abc.googlevideo.com/videoplayback?x=1')
            results.push('✅ host googlevideo diterima')
        } catch (e) {
            results.push('❌ googlevideo ditolak: ' + e.message)
        }
        results.push(s.publicUrl ? '✅ URL publik diatur' : '⚠ URL publik belum diatur')
        if (!s.running && !s.external) {
            results.push('⛔ server belum berjalan, /health tidak dicek')
            return resolve(results)
        }
        const req = http.get({ host: '127.0.0.1', port: s.port, path: '/health', timeout: 3000 }, (res) => {
            let data = ''
            res.on('data', (c) => { data += c })
            res.on('end', () => {
                results.push(res.statusCode === 200 ? '✅ /health OK' : `❌ /health status ${res.statusCode}`)
                resolve(results)
            })
        })
        req.on('error', (e) => { results.push('❌ /health gagal: ' + e.message); resolve(results) })
        req.on('timeout', () => { req.destroy(); results.push('❌ /health timeout') })
    })
}

async function handler(m, { sock }) {
    const sub = (argText(m).split(/\s+/)[0] || 'status').toLowerCase()
    const send = (title, body, extra = {}) => ui.sendPanel(sock, m.chat, {
        title, body, quoted: m, senderJid: m.sender, buttons: buttons(server.getStatus()), ...extra,
    })

    if (sub === 'start' || sub === 'stop') {
        if (EXTERNAL()) {
            return send('📡 WebSocket Itsuki', `Server dijalankan terpisah.\nKelola lewat terminal/pm2:\n> pm2 ${sub === 'start' ? 'start' : 'stop'} itsuki-ws`)
        }
    }
    if (sub === 'start') {
        try {
            const s = server.startServer()
            return send('🟢 WebSocket Itsuki', statusBody(s))
        } catch (e) {
            return m.reply(`❌ Gagal start: ${e.message}`)
        }
    }
    if (sub === 'stop') {
        const ok = server.stopServer()
        return send('⛔ WebSocket Itsuki', ok ? 'Server dihentikan.' : 'Server memang sudah mati.')
    }
    if (sub === 'test') {
        const s = EXTERNAL() ? externalStatus() : server.getStatus()
        const results = await selfTest(s)
        return send('🧪 Tes WebSocket', results.join('\n'))
    }
    if (EXTERNAL()) {
        const s = externalStatus()
        const results = await selfTest(s)
        return send('📡 WebSocket Itsuki', statusBody(s) + '\n\n' + results.join('\n'))
    }
    return send('📡 WebSocket Itsuki', statusBody(server.getStatus()))
}

module.exports = { config: pluginConfig, handler }
