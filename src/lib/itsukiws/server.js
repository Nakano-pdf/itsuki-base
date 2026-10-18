/**
 * Itsuki WebSocket Stream Server
 * ─────────────────────────────────────────────────────────────────────────────
 * Server WebSocket untuk fitur ytplay. Bisa dijalankan di dalam bot atau sebagai
 * proses terpisah (itsuki-ws.js).
 *
 * Protokol (sama dengan yang diharapkan halaman ytplay):
 *   client → server : wss://<host>/?url=<direct-video-url>&token=<token>
 *   server → client : JSON  {"type":"start","mime":"video/mp4","contentLength":N}
 *   server → client : frame binary (potongan video)
 *   server → client : JSON  {"type":"end"}
 *   server → client : JSON  {"type":"error","message":"..."}  (lalu tutup)
 *
 * Keamanan:
 *   - Hanya menerima URL https dari googlevideo, youtube, dan ytimg.
 *   - Menolak alamat lokal dan privat (anti SSRF).
 *   - Token opsional (ITSUKI_WS_TOKEN), dicek dengan timingSafeEqual.
 *   - Batas stream bersamaan, batas ukuran, batas idle, heartbeat ping/pong.
 *   - Token tidak pernah ditulis ke log (diganti ***).
 *
 * Environment variable:
 *   ITSUKI_WS_PORT, ITSUKI_WS_HOST, ITSUKI_WS_PUBLIC_URL, ITSUKI_WS_TOKEN
 *   ITSUKI_WS_maxStreams() (default 3), ITSUKI_WS_maxBytes() (default 400 MB)
 *   ITSUKI_WS_statsMs()    interval dashboard, 0 = mati (default 300000)
 *   ITSUKI_WS_QUIET=1     sembunyikan log per-koneksi (error tetap tampil)
 */
const http = require('http')
const https = require('https')
const crypto = require('crypto')
const { URL } = require('url')
const net = require('net')
const ui = require('./console')

const { log } = ui

// ─── konfigurasi ─────────────────────────────────────────────────────────────
// Nilai utama datang dari config.js (lewat configure()). Environment variable
// hanya dipakai kalau nilai di config kosong.
let CONF = {}
function configure(c) { CONF = c || {} }

function cfgGet(key, envName, def) {
    const v = CONF[key]
    if (v !== undefined && v !== null && v !== '') return v
    const e = process.env[envName]
    if (e !== undefined && e !== '') return e
    return def
}
const maxStreams = () => Number(cfgGet('maxStreams', 'ITSUKI_WS_maxStreams()', 3))
const maxBytes = () => Number(cfgGet('maxBytes', 'ITSUKI_WS_maxBytes()', 400 * 1024 * 1024))
const statsMs = () => Number(cfgGet('statsMs', 'ITSUKI_WS_statsMs()', 300000))
const quiet = () => { const q = cfgGet('quiet', 'ITSUKI_WS_QUIET', false); return q === true || String(q) === '1' }
const tokenValue = () => String(cfgGet('token', 'ITSUKI_WS_TOKEN', ''))
const publicUrlValue = () => String(cfgGet('publicUrl', 'ITSUKI_WS_PUBLIC_URL', ''))
const hostValue = () => String(cfgGet('host', 'ITSUKI_WS_HOST', '0.0.0.0'))
const portValue = () => Number(cfgGet('port', 'ITSUKI_WS_PORT', 8787))
const isExternal = () => { const v = cfgGet('external', 'ITSUKI_WS_EXTERNAL', false); return v === true || String(v) === '1' }

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'
const ALLOWED_HOST_PATTERNS = [/(^|\.)googlevideo\.com$/i, /(^|\.)youtube\.com$/i, /(^|\.)ytimg\.com$/i]
const IDLE_MS = 60 * 1000
const HEARTBEAT_MS = 30 * 1000
const HIGH_WATER = 8 * 1024 * 1024
const CHUNK_HINT = 64 * 1024
const MAX_REDIRECTS = 3
const PROGRESS_STEP = 25 * 1024 * 1024

const state = {
    server: null,
    wss: null,
    timer: null,
    statsTimer: null,
    startedAt: null,
    port: null,
    host: null,
    activeConnections: 0,
    totalConnections: 0,
    activeStreams: 0,
    totalStreams: 0,
    streamsOk: 0,
    streamsFail: 0,
    bytesSent: 0,
    rejectedAuth: 0,
    rejectedHost: 0,
    rejectedBusy: 0,
    lastError: null,
    nextId: 1,
}

let WebSocketServer = null
function loadWs() {
    if (WebSocketServer) return WebSocketServer
    try {
        WebSocketServer = require('ws').WebSocketServer
        return WebSocketServer
    } catch {
        throw new Error('Paket "ws" belum terpasang. Jalankan: npm install ws')
    }
}

// ─── validasi ────────────────────────────────────────────────────────────────
function isPrivateIp(ip) {
    if (!net.isIP(ip)) return false
    if (net.isIPv4(ip)) {
        const p = ip.split('.').map(Number)
        return p[0] === 10 || p[0] === 127 || p[0] === 0 ||
            (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
            (p[0] === 192 && p[1] === 168) || (p[0] === 169 && p[1] === 254)
    }
    const l = ip.toLowerCase()
    return l === '::1' || l.startsWith('fc') || l.startsWith('fd') || l.startsWith('fe80')
}

/** Mengembalikan URL yang sudah tervalidasi, atau melempar error. */
function validateUpstream(raw) {
    let u
    try { u = new URL(String(raw || '')) } catch { throw new Error('URL video tidak valid.') }
    if (u.protocol !== 'https:') throw new Error('Hanya https yang diizinkan.')
    if (u.username || u.password) throw new Error('URL dengan kredensial tidak diizinkan.')
    if (!ALLOWED_HOST_PATTERNS.some(re => re.test(u.hostname))) {
        throw new Error(`Host "${u.hostname}" tidak ada di allowlist.`)
    }
    if (net.isIP(u.hostname) && isPrivateIp(u.hostname)) throw new Error('Alamat privat tidak diizinkan.')
    return u.toString()
}

function tokenOk(provided) {
    const expected = tokenValue() || ''
    if (!expected) return true
    const a = Buffer.from(String(provided || ''))
    const b = Buffer.from(expected)
    return a.length === b.length && crypto.timingSafeEqual(a, b)
}

function clientIp(req) {
    const raw = req.socket?.remoteAddress || '-'
    return raw.replace(/^::ffff:/, '')
}

// ─── upstream ────────────────────────────────────────────────────────────────
/** Ambil respons upstream (ikuti redirect terbatas). */
function fetchUpstream(url, redirects = 0) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, {
            headers: { 'User-Agent': UA, Accept: '*/*', 'Accept-Encoding': 'identity' },
            timeout: 20000,
        }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                res.resume()
                if (redirects >= MAX_REDIRECTS) return reject(new Error('Terlalu banyak redirect.'))
                let next
                try { next = validateUpstream(new URL(res.headers.location, url).toString()) } catch (e) { return reject(e) }
                if (!quiet()) log.stream(`redirect #${redirects + 1} → ${new URL(next).hostname}`)
                return resolve(fetchUpstream(next, redirects + 1))
            }
            if (res.statusCode !== 200) {
                res.resume()
                return reject(new Error(`Upstream membalas status ${res.statusCode}.`))
            }
            resolve(res)
        })
        req.on('timeout', () => req.destroy(new Error('Timeout menghubungi upstream.')))
        req.on('error', reject)
    })
}

// ─── stream ke satu client ───────────────────────────────────────────────────
function streamToClient(ws, upstreamUrl, meta) {
    const id = meta.id
    state.activeStreams++
    state.totalStreams++
    const t0 = Date.now()
    let sent = 0
    let nextProgress = PROGRESS_STEP
    let upstream = null
    let closed = false
    let idleTimer = null
    let ok = false

    const tag = `#${id}`
    const resetIdle = () => {
        clearTimeout(idleTimer)
        idleTimer = setTimeout(() => finish(new Error('Client tidak aktif terlalu lama.')), IDLE_MS)
    }
    const send = (obj) => { if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj)) }
    const finish = (err) => {
        if (closed) return
        closed = true
        clearTimeout(idleTimer)
        state.activeStreams = Math.max(0, state.activeStreams - 1)
        if (upstream) upstream.destroy()
        const sec = ((Date.now() - t0) / 1000).toFixed(1)
        const speed = sec > 0 ? ui.fmtBytes(sent / sec) + '/s' : '-'
        if (err) {
            state.streamsFail++
            state.lastError = err.message
            log.err(`stream ${tag} gagal setelah ${sec}s · ${ui.fmtBytes(sent)} terkirim · ${err.message}`)
            send({ type: 'error', message: err.message })
            try { ws.close(1011, err.message.slice(0, 100)) } catch {}
        } else {
            if (ok) state.streamsOk++
            log.ok(`stream ${tag} selesai · ${ui.fmtBytes(sent)} dalam ${sec}s · rata-rata ${speed}`)
            send({ type: 'end' })
        }
    }

    log.stream(`stream ${tag} dimulai · ${meta.ip} → upstream ${new URL(upstreamUrl).hostname}`)

    fetchUpstream(upstreamUrl).then((res) => {
        upstream = res
        const mime = res.headers['content-type'] || 'video/mp4'
        const len = Number(res.headers['content-length'] || 0) || null
        if (len && len > maxBytes()) return finish(new Error('Video terlalu besar untuk di-stream.'))
        ok = true
        if (!quiet()) log.stream(`stream ${tag} upstream OK · mime=${mime} · ukuran=${len ? ui.fmtBytes(len) : 'tidak diketahui'}`)
        send({ type: 'start', mime, contentLength: len })
        resetIdle()

        res.on('data', (chunk) => {
            if (closed) return
            resetIdle()
            sent += chunk.length
            state.bytesSent += chunk.length
            if (sent > maxBytes()) return finish(new Error('Batas ukuran stream tercapai.'))
            if (ws.readyState !== ws.OPEN) return finish(new Error('Koneksi client terputus.'))
            for (let off = 0; off < chunk.length; off += CHUNK_HINT) {
                ws.send(chunk.subarray(off, Math.min(off + CHUNK_HINT, chunk.length)), { binary: true })
            }
            if (!quiet() && sent >= nextProgress) {
                nextProgress += PROGRESS_STEP
                const pct = len ? ` (${((sent / len) * 100).toFixed(0)}%)` : ''
                log.stream(`stream ${tag} progres ${ui.fmtBytes(sent)}${pct}`)
            }
            if (ws.bufferedAmount > HIGH_WATER) {
                res.pause()
                if (!quiet()) log.warn(`stream ${tag} buffer penuh, upstream dijeda`)
                const wait = setInterval(() => {
                    if (ws.bufferedAmount < HIGH_WATER / 2 || closed) {
                        clearInterval(wait)
                        if (!closed) res.resume()
                    }
                }, 50)
            }
        })
        res.on('end', () => finish(null))
        res.on('error', (e) => finish(e))
    }).catch((e) => finish(e))

    ws.on('close', () => finish(null))
    ws.on('error', () => finish(new Error('Koneksi client error.')))
}

// ─── server ──────────────────────────────────────────────────────────────────
function handleHttp(req, res) {
    const url = new URL(req.url || '/', 'http://localhost')
    if (url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        return res.end(JSON.stringify({ ok: true, ...getStatus() }))
    }
    res.writeHead(426, { 'Content-Type': 'text/plain' })
    res.end('Upgrade Required: gunakan WebSocket')
}

function startServer({ port, host } = {}) {
    if (state.server) return getStatus()
    const WSS = loadWs()
    const listenPort = Number(port || portValue())
    const listenHost = host || hostValue()

    const server = http.createServer(handleHttp)
    const wss = new WSS({ noServer: true, maxPayload: 16 * 1024 })

    server.on('upgrade', (req, socket, head) => {
        const ip = clientIp(req)
        let url
        try { url = new URL(req.url || '/', 'http://localhost') } catch {
            log.auth(`request tidak valid dari ${ip}`)
            return socket.destroy()
        }
        const meta = ui.redactUrl(req.url || '/')

        if (!tokenOk(url.searchParams.get('token'))) {
            state.rejectedAuth++
            log.auth(`token salah dari ${ip} · ${meta}`)
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
            return socket.destroy()
        }
        if (state.activeStreams >= maxStreams()) {
            state.rejectedBusy++
            log.warn(`stream penuh (${state.activeStreams}/${maxStreams()}), ${ip} ditolak`)
            socket.write('HTTP/1.1 503 Service Unavailable\r\n\r\n')
            return socket.destroy()
        }
        wss.handleUpgrade(req, socket, head, (ws) => {
            const id = state.nextId++
            state.activeConnections++
            state.totalConnections++
            ws.isAlive = true
            ws.on('pong', () => { ws.isAlive = true })
            ws.on('close', () => {
                state.activeConnections = Math.max(0, state.activeConnections - 1)
                if (!quiet()) log.conn(`client #${id} terputus · ${ip}`)
            })
            if (!quiet()) log.conn(`client #${id} terhubung · ${ip} · ${meta}`)

            let upstreamUrl
            try {
                upstreamUrl = validateUpstream(url.searchParams.get('url'))
            } catch (e) {
                state.rejectedHost++
                log.auth(`URL ditolak dari ${ip} (client #${id}): ${e.message}`)
                ws.send(JSON.stringify({ type: 'error', message: e.message }))
                return ws.close(1008, e.message.slice(0, 100))
            }
            streamToClient(ws, upstreamUrl, { id, ip })
        })
    })

    state.timer = setInterval(() => {
        for (const ws of wss.clients) {
            if (!ws.isAlive) {
                log.warn('client tidak merespons ping, koneksi diputus')
                ws.terminate()
                continue
            }
            ws.isAlive = false
            try { ws.ping() } catch {}
        }
    }, HEARTBEAT_MS)
    state.timer.unref?.()

    if (statsMs() > 0) {
        state.statsTimer = setInterval(() => ui.dashboard(getStatus()), statsMs())
        state.statsTimer.unref?.()
    }

    server.on('error', (e) => {
        state.lastError = e.message
        log.err(`server error: ${e.message}`)
    })

    server.listen(listenPort, listenHost, () => {
        log.ok(`server listening di ws://${listenHost}:${listenPort}`)
    })

    state.server = server
    state.wss = wss
    state.port = listenPort
    state.host = listenHost
    state.startedAt = Date.now()
    return getStatus()
}

function stopServer() {
    if (!state.server) return false
    clearInterval(state.timer)
    clearInterval(state.statsTimer)
    for (const ws of state.wss.clients) { try { ws.terminate() } catch {} }
    try { state.wss.close() } catch {}
    try { state.server.close() } catch {}
    state.server = null
    state.wss = null
    state.startedAt = null
    state.activeConnections = 0
    state.activeStreams = 0
    log.sys('server dihentikan')
    return true
}

function getStatus() {
    return {
        running: !!state.server,
        host: state.host,
        port: state.port,
        uptimeSec: state.startedAt ? Math.floor((Date.now() - state.startedAt) / 1000) : 0,
        activeConnections: state.activeConnections,
        totalConnections: state.totalConnections,
        activeStreams: state.activeStreams,
        totalStreams: state.totalStreams,
        streamsOk: state.streamsOk,
        streamsFail: state.streamsFail,
        bytesSent: state.bytesSent,
        rejectedAuth: state.rejectedAuth,
        rejectedHost: state.rejectedHost,
        rejectedBusy: state.rejectedBusy,
        maxStreams: maxStreams(),
        maxBytes: maxBytes(),
        tokenProtected: !!tokenValue(),
        publicUrl: getPublicBase() || null,
        lastError: state.lastError,
    }
}

/** Basis URL publik (wss://...). Kosong kalau belum dikonfigurasi. */
function getPublicBase() {
    const raw = (publicUrlValue() || '').trim().replace(/\/$/, '')
    if (!raw) return ''
    try {
        const u = new URL(raw)
        if (u.protocol !== 'wss:' && u.protocol !== 'ws:') return ''
        return u.toString().replace(/\/$/, '')
    } catch {
        return ''
    }
}

/** Bangun wsUrl lengkap untuk halaman ytplay. */
function buildStreamUrl(videoUrl) {
    const base = getPublicBase()
    if (!base) throw new Error('ITSUKI_WS_PUBLIC_URL belum diatur. Isi dengan alamat wss:// publik server ini.')
    const u = new URL(base + '/')
    u.searchParams.set('url', String(videoUrl))
    if (tokenValue()) u.searchParams.set('token', tokenValue())
    return u.toString()
}

// Kalau lib ini dipakai di dalam bot, ambil blok wsStream dari config.js bot.
// Di folder ws, config.js ws dipasang lewat configure() oleh itsuki-ws.js.
try {
    const botCfg = require('../../../config')
    if (botCfg && botCfg.wsStream) configure(botCfg.wsStream)
} catch {}

module.exports = {
    startServer,
    stopServer,
    getStatus,
    buildStreamUrl,
    getPublicBase,
    validateUpstream,
    isPrivateIp,
    configure,
    isExternal,
    getPort: () => portValue(),
    getHost: () => hostValue(),
    get MAX_BYTES() { return maxBytes() },
    get MAX_STREAMS() { return maxStreams() },
}
