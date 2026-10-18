// ╭┈┈⬡ ASSET MANAGER ✨
// Ganti total dari baca file assets/ lokal → ambil dari URL di config.assets.
// - getAssetUrl(key)    : ambil URL mentah (dari override / config)
// - getAssetBuffer(key) : ambil Buffer (didownload + di-cache di memori)
// - getAssetPath(key)   : ambil path file lokal (didownload sekali → cache/asset-cache/, dipakai buat
//                         canvas/font yang butuh path fisik, bukan buffer)
// - setAssetUrl(key,url): update URL di runtime + simpan ke cache/asset-overrides.json (persist restart)
// - uploadAndSetAsset(key, buffer, filename): upload ke Catbox lalu setAssetUrl otomatis (dipakai .ganti-*)
// ╰┈┈⬡

const fs = require('fs')
const path = require('path')
const axios = require('axios')
const FormData = require('form-data')
const config = require('../../config')

const CACHE_DIR = path.join(process.cwd(), 'cache', 'asset-cache')
const OVERRIDES_PATH = path.join(process.cwd(), 'cache', 'asset-overrides.json')

let overrides = {}
try {
    if (fs.existsSync(OVERRIDES_PATH)) {
        overrides = JSON.parse(fs.readFileSync(OVERRIDES_PATH, 'utf-8')) || {}
    }
} catch {
    overrides = {}
}

function saveOverrides() {
    try {
        fs.mkdirSync(path.dirname(OVERRIDES_PATH), { recursive: true })
        fs.writeFileSync(OVERRIDES_PATH, JSON.stringify(overrides, null, 2))
    } catch (e) {
        console.error('[assetManager] gagal simpan asset-overrides.json:', e.message)
    }
}

function getByPath(obj, key) {
    return key.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), obj)
}

function setByPath(obj, key, value) {
    const parts = key.split('.')
    let cur = obj
    for (let i = 0; i < parts.length - 1; i++) {
        if (!cur[parts[i]] || typeof cur[parts[i]] !== 'object') cur[parts[i]] = {}
        cur = cur[parts[i]]
    }
    cur[parts[parts.length - 1]] = value
}

/**
 * Ambil URL asset. key contoh: 'images.itsuki', 'fonts.ttqc.plusJakartaSansBold'
 */
function getAssetUrl(key) {
    const override = getByPath(overrides, key)
    if (typeof override === 'string') return override // '' = sengaja dikosongkan (tombstone)
    const fromConfig = getByPath(config.assets || {}, key)
    return fromConfig || ''
}

/**
 * Update URL asset di runtime + persist ke cache/asset-overrides.json.
 */
function setAssetUrl(key, url) {
    setByPath(overrides, key, url)
    if (config.assets) setByPath(config.assets, key, url)
    saveOverrides()
    return url
}

const memCache = new Map() // key -> Buffer (cache di memori selama proses jalan)

/**
 * Ambil isi asset sebagai Buffer. Return null kalau URL belum diisi / gagal download.
 */
async function getAssetBuffer(key, { forceRefresh = false } = {}) {
    const url = getAssetUrl(key)
    if (!url) return null

    if (!forceRefresh && memCache.has(key)) return memCache.get(key)

    try {
        const { data } = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 })
        const buf = Buffer.from(data)
        memCache.set(key, buf)
        return buf
    } catch (e) {
        console.error(`[assetManager] gagal download asset "${key}" dari ${url}:`, e.message)
        return null
    }
}

/**
 * Ambil path file lokal buat asset (didownload sekali ke cache/asset-cache/, dipakai ulang selanjutnya).
 * Cocok buat canvas/GlobalFonts.registerFromPath yang butuh path fisik, bukan buffer.
 * Return null kalau URL belum diisi / gagal download.
 */
async function getAssetPath(key, ext) {
    const url = getAssetUrl(key)
    if (!url) return null

    const safeName = key.replace(/\./g, '_') + (ext ? `.${ext}` : path.extname(url) || '')
    const localPath = path.join(CACHE_DIR, safeName)

    if (fs.existsSync(localPath)) return localPath

    const buf = await getAssetBuffer(key)
    if (!buf) return null

    try {
        fs.mkdirSync(CACHE_DIR, { recursive: true })
        fs.writeFileSync(localPath, buf)
        return localPath
    } catch (e) {
        console.error(`[assetManager] gagal cache asset "${key}" ke disk:`, e.message)
        return null
    }
}

/**
 * Upload buffer ke Catbox (permanent, gak butuh API key) lalu langsung update config.assets[key].
 * Dipakai plugin .ganti-* biar tetap bisa "reply gambar buat ganti asset" walau udah gak ada folder assets/.
 */
async function uploadAndSetAsset(key, buffer, filename = 'file') {
    const form = new FormData()
    form.append('reqtype', 'fileupload')
    form.append('fileToUpload', buffer, { filename })
    const res = await axios.post('https://catbox.moe/user/api.php', form, {
        headers: form.getHeaders(),
        timeout: 60000
    })
    const url = typeof res.data === 'string' ? res.data.trim() : ''
    if (!url.startsWith('http')) throw new Error('Upload ke Catbox gagal / response gak valid')

    setAssetUrl(key, url)
    memCache.delete(key)
    // hapus cache path lama biar getAssetPath download ulang versi baru
    try {
        const files = fs.existsSync(CACHE_DIR) ? fs.readdirSync(CACHE_DIR) : []
        const prefix = key.replace(/\./g, '_')
        for (const f of files) if (f.startsWith(prefix)) fs.unlinkSync(path.join(CACHE_DIR, f))
    } catch {}

    return url
}

/**
 * Flatten config.assets (+ override) jadi list { key, url }.
 */
function listAssets() {
    const out = []
    const walk = (obj, prefix) => {
        for (const [k, v] of Object.entries(obj || {})) {
            const full = prefix ? `${prefix}.${k}` : k
            if (v && typeof v === 'object') walk(v, full)
            else out.push({ key: full, url: getAssetUrl(full) })
        }
    }
    walk(config.assets, '')
    // key yang cuma ada di override (dibuat lewat .addmedia)
    const seen = new Set(out.map(o => o.key))
    const walkOv = (obj, prefix) => {
        for (const [k, v] of Object.entries(obj || {})) {
            const full = prefix ? `${prefix}.${k}` : k
            if (v && typeof v === 'object') walkOv(v, full)
            else if (!seen.has(full)) out.push({ key: full, url: v })
        }
    }
    walkOv(overrides, '')
    return out
}

/**
 * Kosongkan URL asset (persist). Return true kalau sebelumnya ada isinya.
 */
function removeAsset(key) {
    const had = !!getAssetUrl(key)
    setAssetUrl(key, '')
    memCache.delete(key)
    return had
}

module.exports = {
    listAssets,
    removeAsset,
    getAssetUrl,
    setAssetUrl,
    getAssetBuffer,
    getAssetPath,
    uploadAndSetAsset
}
