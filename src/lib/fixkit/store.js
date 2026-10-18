/**
 * Fixkit store — penyimpanan JSON sederhana untuk semua fitur fixkit.
 * Data disimpan di database/fixkit/ supaya tidak bercampur dengan database utama.
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(process.cwd(), 'database', 'fixkit')
const DIRS = ['', 'backup', 'pending', 'logs']
for (const d of DIRS) fs.mkdirSync(path.join(ROOT, d), { recursive: true })

function filePath(name) {
    return path.join(ROOT, `${name}.json`)
}

function read(name, fallback) {
    try {
        const raw = fs.readFileSync(filePath(name), 'utf-8')
        return raw.trim() ? JSON.parse(raw) : fallback
    } catch {
        return fallback
    }
}

function write(name, data) {
    fs.writeFileSync(filePath(name), JSON.stringify(data, null, 2))
    return data
}

// ─── API registry (addapi) ───────────────────────────────────────────────────
// bentuk: { [name]: { name, baseURL, apiKey, authType: 'header'|'query'|'none', authName, createdAt } }
function getApis() {
    return read('apis', {})
}

function getApi(name) {
    if (!name) return null
    return getApis()[name.toLowerCase()] || null
}

function saveApi(api) {
    const all = getApis()
    all[api.name.toLowerCase()] = api
    write('apis', all)
    return api
}

function deleteApi(name) {
    const all = getApis()
    const key = name.toLowerCase()
    if (!all[key]) return false
    delete all[key]
    write('apis', all)
    return true
}

// ─── CRM ─────────────────────────────────────────────────────────────────────
function getCrm() {
    return read('crm', {})
}

function saveCrm(all) {
    return write('crm', all)
}

// ─── Relay rules ─────────────────────────────────────────────────────────────
function getRelays() {
    return read('relay', [])
}

function saveRelays(list) {
    return write('relay', list)
}

// ─── Autorepair settings ─────────────────────────────────────────────────────
const DEFAULT_REPAIR = {
    enabled: true,      // autorepair aktif
    autoInstall: true,  // install module npm yang hilang otomatis
    autoDisable: true,  // matikan plugin yang terus error
    autoRestore: true,  // restore backup plugin kalau ada
    notifyOwner: true,  // kirim laporan error ke owner
}

function getRepairSettings() {
    return { ...DEFAULT_REPAIR, ...read('autorepair', {}) }
}

function saveRepairSettings(patch) {
    const next = { ...getRepairSettings(), ...patch }
    write('autorepair', next)
    return next
}

// ─── Pending (kode hasil fixpl1 / addairich yang belum disimpan) ─────────────
function pendingPath(name) {
    return path.join(ROOT, 'pending', `${name}.js`)
}

function savePending(name, code) {
    fs.writeFileSync(pendingPath(name), code)
    return pendingPath(name)
}

function loadPending(name) {
    try { return fs.readFileSync(pendingPath(name), 'utf-8') } catch { return null }
}

module.exports = {
    ROOT,
    read,
    write,
    getApis,
    getApi,
    saveApi,
    deleteApi,
    getCrm,
    saveCrm,
    getRelays,
    saveRelays,
    getRepairSettings,
    saveRepairSettings,
    savePending,
    loadPending,
}
