#!/usr/bin/env node
/**
 * Itsuki WebSocket — jalankan sebagai proses terpisah dari bot.
 *   node itsuki-ws.js
 *   pm2 start itsuki-ws.js --name itsuki-ws
 *
 * Konfigurasi lewat environment variable (lihat src/lib/itsukiws/server.js).
 */
const server = require('./src/lib/itsukiws/server')
const ui = require('./src/lib/itsukiws/console')
const { log } = ui

let status
try {
    status = server.getStatus()
    ui.banner({
        host: process.env.ITSUKI_WS_HOST || '0.0.0.0',
        port: Number(process.env.ITSUKI_WS_PORT || 8787),
        publicUrl: server.getPublicBase() || null,
        tokenProtected: !!process.env.ITSUKI_WS_TOKEN,
        maxStreams: server.MAX_STREAMS,
        maxBytes: server.MAX_BYTES,
    })
    status = server.startServer()
    if (!server.getPublicBase()) {
        log.warn('ITSUKI_WS_PUBLIC_URL belum diatur — ytplay tidak bisa dipakai sampai diisi')
    }
    if (!process.env.ITSUKI_WS_TOKEN) {
        log.warn('ITSUKI_WS_TOKEN kosong — siapa pun bisa memakai server ini')
    }
    log.sys('ketik Ctrl+C untuk menghentikan · dashboard tiap ' + Math.round((Number(process.env.ITSUKI_WS_STATS_MS ?? 300000)) / 1000) + ' detik')
} catch (e) {
    log.err(`gagal start: ${e.message}`)
    process.exit(1)
}

const shutdown = (sig) => {
    log.sys(`${sig} diterima, menutup server...`)
    ui.dashboard(server.getStatus())
    server.stopServer()
    process.exit(0)
}
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
