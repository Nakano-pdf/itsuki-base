/**
 * Fixkit repair — autorepair.
 *
 * Alur saat ada error di plugin:
 *   1. Error dicatat (database/fixkit/logs/errors.log) dan dikelompokkan per "sidik jari" error.
 *   2. Diagnosa:
 *        - "Cannot find module 'x'" (npm) → install paket x (whitelist format npm)
 *        - "Cannot find module './y'" (file lokal hilang) → matikan plugin
 *        - error berulang di file plugin (>= 3x dalam 10 menit) → restore backup terbaru,
 *          kalau tidak ada → matikan plugin
 *        - error sekali-sekali → hot-reload file plugin (membersihkan state)
 *   3. Laporan dikirim ke owner dalam panel dengan tombol (salin log, kirim log, matikan, hidupkan).
 */
const fs = require('fs')
const path = require('path')
const { execFile } = require('child_process')
const store = require('./store')
const ui = require('./ui')
const codegen = require('./codegen')
const adapt = require('./adapt')

const ROOT = process.cwd()
const LOG_FILE = path.join(store.ROOT, 'logs', 'errors.log')
const WINDOW_MS = 10 * 60 * 1000
const NOTIFY_COOLDOWN_MS = 2 * 60 * 1000
const INSTALL_COOLDOWN_MS = 10 * 60 * 1000
const MAX_INSTALLS_PER_HOUR = 3

const registry = new Map()     // sig → { count, times: [], lastNotify }
const installLog = []          // timestamps install terakhir
const installCooldown = new Map()
let lastSock = null
let hooksInstalled = false
let lastReport = null          // laporan terakhir (untuk tombol salin/kirim log)

function getSock() { return lastSock }

function rememberSock(sock) {
    lastSock = sock
    if (!hooksInstalled) installProcessHooks()
}

function appendLog(entry) {
    try {
        fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true })
        fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${entry}\n`)
    } catch {}
}

/** Ambil path file plugin dari stack trace (kalau error berasal dari plugin). */
function pluginFromStack(stack = '') {
    const m = String(stack).match(/plugins[\\/]([\w-]+)[\\/]([\w-]+)\.js/)
    if (!m) return null
    return { folder: m[1], file: m[2], path: path.join(ROOT, 'plugins', m[1], `${m[2]}.js`) }
}

function signature(err, plugin) {
    const msg = String(err?.message || err).slice(0, 160)
    return `${plugin ? plugin.file : 'global'}|${msg}`
}

function trackRegistry(sig) {
    const now = Date.now()
    const entry = registry.get(sig) || { count: 0, times: [], lastNotify: 0 }
    entry.count++
    entry.times = entry.times.filter(t => now - t < WINDOW_MS)
    entry.times.push(now)
    registry.set(sig, entry)
    return entry
}

// ─── aksi perbaikan ─────────────────────────────────────────────────────────
function canInstallNow(pkg) {
    const now = Date.now()
    while (installLog.length && now - installLog[0] > 60 * 60 * 1000) installLog.shift()
    if (installLog.length >= MAX_INSTALLS_PER_HOUR) return { ok: false, reason: 'batas install per jam tercapai' }
    const last = installCooldown.get(pkg) || 0
    if (now - last < INSTALL_COOLDOWN_MS) return { ok: false, reason: 'paket ini baru saja dicoba' }
    return { ok: true }
}

function installPackage(pkg) {
    return new Promise((resolve) => {
        if (!adapt.isSafePackageName(pkg)) return resolve({ ok: false, reason: `nama paket tidak aman: ${pkg}` })
        const gate = canInstallNow(pkg)
        if (!gate.ok) return resolve({ ok: false, reason: gate.reason })
        installCooldown.set(pkg, Date.now())
        installLog.push(Date.now())
        execFile(
            process.platform === 'win32' ? 'npm.cmd' : 'npm',
            ['install', pkg, '--no-audit', '--no-fund', '--loglevel=error'],
            { cwd: ROOT, timeout: 180000, maxBuffer: 5 * 1024 * 1024 },
            (err, stdout, stderr) => {
                if (err) return resolve({ ok: false, reason: (stderr || err.message).slice(0, 300) })
                resolve({ ok: true, reason: 'terpasang' })
            }
        )
    })
}

function hotReload(filePath) {
    try {
        const { hotReloadPlugin } = require('../plugins')
        return hotReloadPlugin(filePath)
    } catch (e) {
        return { success: false, error: e.message }
    }
}

function disablePluginByFile(plugin, fallbackName) {
    try {
        const { disablePlugin, pluginStore } = require('../plugins')
        for (const [name, p] of pluginStore.commands) {
            const names = Array.isArray(p.config?.name) ? p.config.name : [p.config?.name]
            if (names.map(n => String(n).toLowerCase()).includes(String(plugin?.file || fallbackName).toLowerCase())) {
                return disablePlugin(name)
            }
        }
        return disablePlugin(plugin?.file || fallbackName)
    } catch {
        return false
    }
}

/** Diagnosa + perbaikan. Mengembalikan daftar tindakan yang diambil. */
async function diagnoseAndRepair(err, plugin, ctx) {
    const settings = store.getRepairSettings()
    const actions = []
    const msg = String(err?.message || err)
    const entry = registry.get(signature(err, plugin))

    // 1. module npm hilang
    const missing = msg.match(/Cannot find module ['"]([^'"]+)['"]/)
    if (missing) {
        const id = missing[1]
        if (!id.startsWith('.') && !id.startsWith('/')) {
            if (settings.autoInstall) {
                const res = await installPackage(id.replace(/^node:/, ''))
                actions.push(res.ok ? `✅ install paket \`${id}\`` : `⚠ gagal install \`${id}\`: ${res.reason}`)
                if (res.ok && plugin) actions.push(`🔄 reload plugin ${plugin.file}: ${hotReload(plugin.path).success ? 'ok' : 'gagal'}`)
            } else {
                actions.push(`ℹ paket \`${id}\` hilang (autoInstall mati)`)
            }
            return actions
        }
        if (settings.autoDisable && plugin) {
            disablePluginByFile(plugin)
            actions.push(`⛔ file \`${id}\` hilang → plugin ${plugin.file} dimatikan`)
            return actions
        }
    }

    if (!plugin) {
        actions.push('ℹ error di core bot — hanya dicatat dan dilaporkan')
        return actions
    }

    const repeats = entry ? entry.times.length : 1

    // 2. error berulang di plugin
    if (repeats >= 3) {
        const backup = settings.autoRestore ? codegen.latestBackup(plugin.path) : null
        if (backup) {
            try {
                fs.copyFileSync(backup, plugin.path)
                const r = hotReload(plugin.path)
                actions.push(`♻ restore backup terbaru → ${r.success ? 'hot-reload ok' : 'reload gagal: ' + r.error}`)
                return actions
            } catch (e) {
                actions.push(`⚠ restore gagal: ${e.message}`)
            }
        }
        if (settings.autoDisable) {
            disablePluginByFile(plugin, ctx.command)
            actions.push(`⛔ error berulang ${repeats}x → plugin ${plugin.file} dimatikan sementara`)
            return actions
        }
        actions.push(`ℹ error berulang ${repeats}x, auto-disable mati`)
        return actions
    }

    // 3. error pertama kali → reload
    const r = hotReload(plugin.path)
    actions.push(`🔄 hot-reload ${plugin.file}: ${r.success ? 'ok' : 'gagal'}`)
    return actions
}

// ─── laporan ke owner ─────────────────────────────────────────────────────────
async function notifyOwner({ title, body, buttons, sigEntry }) {
    const settings = store.getRepairSettings()
    if (!settings.notifyOwner) return
    const jid = ui.ownerJid()
    const sock = lastSock
    if (!jid || !sock) return
    if (sigEntry && Date.now() - sigEntry.lastNotify < NOTIFY_COOLDOWN_MS) return
    if (sigEntry) sigEntry.lastNotify = Date.now()
    try {
        await ui.sendPanel(sock, jid, { title, body, buttons, senderJid: jid })
    } catch (e) {
        console.error('[autorepair] gagal kirim laporan:', e.message)
    }
}

/**
 * Titik masuk utama — dipanggil dari handler saat ada error.
 * @param {Error} error
 * @param {{ m?, sock?, command? }} ctx
 */
async function onError(error, ctx = {}) {
    const settings = store.getRepairSettings()
    if (!settings.enabled) return
    if (ctx.sock) rememberSock(ctx.sock)

    const plugin = pluginFromStack(error?.stack)
    const sig = signature(error, plugin)
    const entry = trackRegistry(sig)
    const stamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
    appendLog(`${plugin ? plugin.folder + '/' + plugin.file : 'core'} | cmd=${ctx.command || '-'} | ${error?.message}\n${error?.stack || ''}`)

    const actions = await diagnoseAndRepair(error, plugin, ctx).catch(e => [`⚠ autorepair crash: ${e.message}`])
    lastReport = {
        at: stamp,
        plugin: plugin ? `${plugin.folder}/${plugin.file}` : 'core',
        command: ctx.command || '-',
        error: String(error?.message || error),
        stack: String(error?.stack || '').slice(0, 2000),
        actions,
    }

    const body = [
        `*Waktu:* ${stamp}`,
        `*Plugin:* ${lastReport.plugin}`,
        `*Command:* ${lastReport.command}`,
        `*Error:* ${lastReport.error.slice(0, 300)}`,
        `*Jumlah (10 menit):* ${entry.times.length}x`,
        '',
        '*Tindakan otomatis:*',
        ...(actions.length ? actions : ['-']),
    ].join('\n')

    const buttons = [
        { type: 'copy', text: '📋 Salin Error', id: '.autorepair log', code: `${lastReport.plugin} | ${lastReport.command}\n${lastReport.error}\n\n${lastReport.stack}` },
        { type: 'reply', text: '📁 Kirim Log', id: '.autorepair log' },
        { type: 'reply', text: '♻ Restore Plugin', id: plugin ? `.autorepair restore ${plugin.file}` : '.autorepair status' },
        { type: 'reply', text: '⛔ Matikan Plugin', id: plugin ? `.autorepair matikan ${plugin.file}` : '.autorepair status' },
        { type: 'reply', text: '✅ Hidupkan Plugin', id: plugin ? `.autorepair hidupkan ${plugin.file}` : '.autorepair status' },
    ]

    await notifyOwner({ title: '🛠 AUTOREPAIR — ada error', body, buttons, sigEntry: entry })
}

// ─── error di level proses ─────────────────────────────────────────────────
function installProcessHooks() {
    hooksInstalled = true
    process.on('unhandledRejection', (reason) => {
        const err = reason instanceof Error ? reason : new Error(String(reason))
        appendLog(`unhandledRejection: ${err.stack || err.message}`)
        onError(err, { command: 'unhandledRejection' }).catch(() => {})
    })
    process.on('uncaughtException', (err) => {
        appendLog(`uncaughtException: ${err.stack || err.message}`)
        onError(err, { command: 'uncaughtException' }).catch(() => {})
    })
}

function getLastReport() { return lastReport }

function readLog(maxLines = 80) {
    try {
        const lines = fs.readFileSync(LOG_FILE, 'utf-8').split('\n')
        return lines.slice(-maxLines).join('\n')
    } catch {
        return '(log kosong)'
    }
}

module.exports = {
    onError,
    rememberSock,
    getSock,
    installPackage,
    getLastReport,
    readLog,
    LOG_FILE,
    pluginFromStack,
    disablePluginByFile,
    hotReload,
}
