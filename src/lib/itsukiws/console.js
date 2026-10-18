/**
 * Itsuki WebSocket — tampilan console.
 * Banner, log berwarna dengan timestamp, dan dashboard status berkala.
 * Warna dimatikan otomatis kalau output bukan terminal atau NO_COLOR diset.
 */
const os = require('os')

const COLOR = !!process.stdout.isTTY && !process.env.NO_COLOR
const WIDTH = 66

const PAL = {
    pink: '38;5;213',
    violet: '38;5;141',
    cyan: '38;5;51',
    gold: '38;5;220',
    green: '38;5;84',
    red: '38;5;203',
    orange: '38;5;215',
    gray: '38;5;245',
    white: '38;5;255',
}

const paint = (code, s) => (COLOR ? `\x1b[${code}m${s}\x1b[0m` : String(s))
const bold = (s) => (COLOR ? `\x1b[1m${s}\x1b[0m` : String(s))
const dim = (s) => (COLOR ? `\x1b[2m${s}\x1b[0m` : String(s))

// lebar terlihat (tanpa kode ANSI)
const visibleLen = (s) => String(s).replace(/\x1b\[[0-9;]*m/g, '').length

function ts() {
    return new Date().toLocaleTimeString('en-GB', { hour12: false, timeZone: 'Asia/Jakarta' })
}

const TAG = {
    SYS: ['gray', 'SYS '],
    OK: ['green', ' OK '],
    CONN: ['violet', 'CONN'],
    STRM: ['pink', 'STRM'],
    WARN: ['gold', 'WARN'],
    ERR: ['red', 'ERR '],
    AUTH: ['orange', 'AUTH'],
    STAT: ['cyan', 'STAT'],
}

function line(tag, msg) {
    const [color, label] = TAG[tag] || TAG.SYS
    const badge = paint(`${PAL[color]};1`, `[${label}]`)
    console.log(`${dim(ts())}  ${badge}  ${msg}`)
}

const log = {
    sys: (m) => line('SYS', paint(PAL.gray, m)),
    ok: (m) => line('OK', m),
    conn: (m) => line('CONN', m),
    stream: (m) => line('STRM', m),
    warn: (m) => line('WARN', paint(PAL.gold, m)),
    err: (m) => line('ERR', paint(PAL.red, m)),
    auth: (m) => line('AUTH', m),
    stat: (m) => line('STAT', m),
}

// ─── banner ──────────────────────────────────────────────────────────────────
function rule(ch = '═') {
    return paint(PAL.violet, ch.repeat(WIDTH))
}

function boxRow(text = '', align = 'left') {
    const inner = WIDTH - 4
    const len = visibleLen(text)
    const pad = Math.max(0, inner - len)
    const body = align === 'center'
        ? ' '.repeat(Math.floor(pad / 2)) + text + ' '.repeat(pad - Math.floor(pad / 2))
        : text + ' '.repeat(pad)
    return paint(PAL.violet, '║ ') + body + paint(PAL.violet, ' ║')
}

function banner(info) {
    const art = [
        '◆  ✦  ◆   I T S U K I   N A K A N O   ◆  ✦  ◆',
    ]
    const out = []
    out.push('')
    out.push(rule('═'))
    out.push(paint(PAL.violet, '╔' + '═'.repeat(WIDTH - 2) + '╗'))
    out.push(boxRow(''))
    for (const a of art) out.push(boxRow(paint(`${PAL.pink};1`, a), 'center'))
    out.push(boxRow(''))
    out.push(boxRow(paint(`${PAL.cyan};1`, 'WebSocket Nakano powered Itsuki Nakano By AlwaysLennz'), 'center'))
    out.push(boxRow(dim('stream server · fitur ytplay'), 'center'))
    out.push(boxRow(''))
    out.push(paint(PAL.violet, '╚' + '═'.repeat(WIDTH - 2) + '╝'))
    out.push(rule('═'))

    const kv = (k, v) => `  ${paint(PAL.gray, k.padEnd(14))} ${v}`
    out.push(kv('Node.js', process.version + '  ·  ' + process.platform + '/' + process.arch))
    out.push(kv('PID', String(process.pid)))
    out.push(kv('Listen', paint(PAL.white, `${info.host}:${info.port}`)))
    out.push(kv('URL publik', info.publicUrl ? paint(PAL.green, info.publicUrl) : paint(PAL.gold, '(belum diatur — ITSUKI_WS_PUBLIC_URL)')))
    out.push(kv('Token', info.tokenProtected ? paint(PAL.green, '🔒 aktif') : paint(PAL.gold, '⚠ kosong (disarankan diisi)')))
    out.push(kv('Max stream', String(info.maxStreams)))
    out.push(kv('Max ukuran', (info.maxBytes / 1024 / 1024).toFixed(0) + ' MB per video'))
    out.push(kv('Host', os.hostname()))
    out.push(rule('─'))
    console.log(out.join('\n'))
}

// ─── dashboard status berkala ────────────────────────────────────────────────
function fmtBytes(n) {
    if (!n) return '0 B'
    const u = ['B', 'KB', 'MB', 'GB']
    const i = Math.min(u.length - 1, Math.floor(Math.log(n) / Math.log(1024)))
    return (n / Math.pow(1024, i)).toFixed(i ? 1 : 0) + ' ' + u[i]
}

function fmtUptime(sec) {
    const d = Math.floor(sec / 86400)
    const h = Math.floor((sec % 86400) / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    return (d ? d + 'h ' : '') + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0')
}

function dashboard(s) {
    const mem = process.memoryUsage()
    const load = os.loadavg()[0].toFixed(2)
    const rows = [
        ['Uptime', fmtUptime(s.uptimeSec)],
        ['Koneksi aktif', `${s.activeConnections}   (total sejak start: ${s.totalConnections})`],
        ['Stream aktif', `${s.activeStreams}/${s.maxStreams}   (sukses: ${s.streamsOk} · gagal: ${s.streamsFail})`],
        ['Data terkirim', `${fmtBytes(s.bytesSent)}   (rata-rata ${fmtBytes(s.uptimeSec ? s.bytesSent / s.uptimeSec : 0)}/detik)`],
        ['Ditolak', `token:${s.rejectedAuth} · host:${s.rejectedHost} · penuh:${s.rejectedBusy}`],
        ['Memori', `RSS ${fmtBytes(mem.rss)} · heap ${fmtBytes(mem.heapUsed)} / ${fmtBytes(mem.heapTotal)}`],
        ['Beban CPU', `load 1m ${load} · ${os.cpus().length} core`],
        ['Error terakhir', s.lastError ? paint(PAL.red, String(s.lastError).slice(0, 80)) : paint(PAL.green, 'tidak ada')],
    ]
    const w = Math.max(...rows.map(r => r[0].length)) + 2
    const out = []
    out.push(paint(PAL.cyan, '┌' + '─'.repeat(WIDTH - 2) + '┐'))
    const hdr = paint(`${PAL.cyan};1`, '⚡ DASHBOARD  ·  ' + new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }))
    out.push(paint(PAL.cyan, '│ ') + hdr + ' '.repeat(Math.max(0, WIDTH - 3 - visibleLen(hdr))) + paint(PAL.cyan, '│'))
    out.push(paint(PAL.cyan, '├' + '─'.repeat(WIDTH - 2) + '┤'))
    for (const [k, v] of rows) {
        const left = '│ ' + paint(PAL.gray, k.padEnd(w)) + v
        const pad = Math.max(0, WIDTH - 1 - visibleLen(left))
        out.push(left + ' '.repeat(pad) + paint(PAL.cyan, '│'))
    }
    out.push(paint(PAL.cyan, '└' + '─'.repeat(WIDTH - 2) + '┘'))
    console.log(out.join('\n'))
}

function redactUrl(raw) {
    try {
        const u = new URL(raw, 'http://x')
        const target = u.searchParams.get('url')
        let host = '-'
        if (target) { try { host = new URL(target).hostname } catch {} }
        return `${u.pathname}  upstream=${host}${u.searchParams.get('token') ? '  token=***' : ''}`
    } catch {
        return '(url tidak valid)'
    }
}

module.exports = {
    banner,
    dashboard,
    log,
    fmtBytes,
    fmtUptime,
    redactUrl,
    paint,
    bold,
    dim,
    PAL,
    COLOR,
}
