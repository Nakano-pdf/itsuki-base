/**
 * ✧ lib/underDevStore.js
 * ✧ Fungsi: nyimpen daftar PRIMARY COMMAND NAME plugin yang lagi
 *   ditandain "masih otak-atik" alias belum boleh dipake user biasa.
 *
 * Disimpen berdasarkan config.name (bukan alias, bukan raw text yang
 * diketik owner) karena pluginStore.commands di lib/plugins.js itu Map
 * yang di-key pakai nama itu secara unik — jadi gak akan pernah ada
 * dua plugin beda nabrak di key yang sama.
 */

const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(__dirname, '../data/underdev.json')

function ensureFile() {
    if (!fs.existsSync(DB_PATH)) {
        fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
        fs.writeFileSync(DB_PATH, JSON.stringify({ plugins: [] }, null, 2))
    }
}

function readAll() {
    ensureFile()
    try {
        const raw = fs.readFileSync(DB_PATH, 'utf-8')
        const data = JSON.parse(raw)
        return Array.isArray(data.plugins) ? data.plugins : []
    } catch (e) {
        console.error('[underDevStore] Gagal baca db, reset ke kosong:', e)
        return []
    }
}

function writeAll(list) {
    ensureFile()
    fs.writeFileSync(DB_PATH, JSON.stringify({ plugins: list }, null, 2))
}

// Daftar primary name yang lagi ditandain
function getList() {
    return readAll()
}

// name di sini WAJIB primary command name (plugin.config.name), bukan alias
function isMarked(name) {
    if (!name) return false
    const list = readAll().map(x => x.toLowerCase())
    return list.includes(String(name).toLowerCase())
}

function add(name) {
    const list = readAll()
    const lower = list.map(x => x.toLowerCase())
    if (lower.includes(String(name).toLowerCase())) return false
    list.push(name)
    writeAll(list)
    return true
}

function remove(name) {
    const list = readAll()
    const filtered = list.filter(x => x.toLowerCase() !== String(name).toLowerCase())
    if (filtered.length === list.length) return false
    writeAll(filtered)
    return true
}

module.exports = {
    getList,
    isMarked,
    add,
    remove
}