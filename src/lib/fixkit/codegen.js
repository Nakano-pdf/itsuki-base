/**
 * Fixkit codegen — membuat source plugin dari template, mengecek sintaks,
 * dan menulis plugin ke folder plugins/ dengan aturan yang sama seperti addplugin
 * (cek bentrok command, backup versi lama, lalu hot-reload).
 */
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const { ROOT } = require('./store')

const PLUGINS_DIR = path.join(process.cwd(), 'plugins')

const ALLOWED_FOLDERS = [
    'main', 'owner', 'downloader', 'download', 'sticker', 'ai', 'media',
    'game', 'rpg', 'maker', 'fun', 'group', 'premium', 'info', 'search',
    'canvas', 'anime', 'nsfw', 'utility', 'economy', 'tools', 'other',
    'stalker', 'security', 'store', 'user', 'system',
]

const REQUIRED_CONFIG_KEYS = ['name', 'category', 'description', 'isOwner', 'isEnabled']

// ─── Validasi ───────────────────────────────────────────────────────────────
function isValidFileName(name) {
    return /^[a-z0-9][a-z0-9-]{1,40}$/.test(name || '')
}

function isAllowedFolder(folder) {
    return ALLOWED_FOLDERS.includes(folder)
}

/** Cek sintaks JS. Mengembalikan { ok, error }. */
function checkSyntax(code) {
    try {
        new vm.Script(code)
        return { ok: true }
    } catch (e) {
        return { ok: false, error: e.message }
    }
}

/** Ambil nama command dan alias dari source plugin (regex, cukup untuk konflik). */
function extractCommands(code) {
    const cmds = []
    const nameArr = code.match(/(?<![A-Za-z_])name:\s*\[([^\]]+)\]/)
    const nameStr = code.match(/(?<![A-Za-z_])name:\s*['"`]([^'"`]+)['"`]/)
    if (nameArr) {
        cmds.push(...(nameArr[1].match(/['"`]([^'"`]+)['"`]/g) || []).map(s => s.replace(/['"`]/g, '')))
    } else if (nameStr) {
        cmds.push(nameStr[1])
    }
    const aliasArr = code.match(/alias:\s*\[([^\]]*)\]/)
    if (aliasArr) {
        cmds.push(...(aliasArr[1].match(/['"`]([^'"`]+)['"`]/g) || []).map(s => s.replace(/['"`]/g, '')))
    }
    return cmds.map(c => c.toLowerCase())
}

/** Peta command → file yang sudah ada di plugins/. */
function buildCommandMap() {
    const map = {}
    if (!fs.existsSync(PLUGINS_DIR)) return map
    for (const folder of fs.readdirSync(PLUGINS_DIR, { withFileTypes: true }).filter(d => d.isDirectory())) {
        const dir = path.join(PLUGINS_DIR, folder.name)
        for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.js'))) {
            try {
                const code = fs.readFileSync(path.join(dir, file), 'utf-8')
                for (const c of extractCommands(code)) map[c] = { folder: folder.name, file }
            } catch {}
        }
    }
    return map
}

/** Cek kelengkapan config plugin. Mengembalikan daftar masalah. */
function checkConfigFields(code) {
    const issues = []
    if (!/module\.exports/.test(code)) issues.push('module.exports tidak ditemukan')
    if (!/async\s+function\s+handler|handler\s*[:=]\s*(async\s*)?\(|function\s+handler/.test(code)) {
        issues.push('fungsi handler tidak ditemukan')
    }
    for (const key of REQUIRED_CONFIG_KEYS) {
        if (!new RegExp(`\\b${key}\\s*:`).test(code)) issues.push(`field config "${key}" tidak ada`)
    }
    return issues
}

// ─── Penulisan plugin ──────────────────────────────────────────────────────
/**
 * Tulis plugin ke plugins/<folder>/<fileName>.js dengan semua pengecekan.
 * Mengembalikan { ok, error?, path?, reload?, backup? }.
 */
function writePlugin({ folder, fileName, code, overwrite = false, hotReload }) {
    if (!isAllowedFolder(folder)) return { ok: false, error: `Folder \`${folder}\` tidak diizinkan.` }
    if (!isValidFileName(fileName)) return { ok: false, error: `Nama file \`${fileName}\` tidak valid (huruf kecil, angka, tanda -).` }

    const syntax = checkSyntax(code)
    if (!syntax.ok) return { ok: false, error: `Sintaks error: ${syntax.error}` }

    const filePath = path.join(PLUGINS_DIR, folder, `${fileName}.js`)
    const exists = fs.existsSync(filePath)
    if (exists && !overwrite) {
        return { ok: false, error: `File \`${fileName}.js\` sudah ada di \`${folder}\`. Pakai overwrite untuk menimpa.` }
    }

    const map = buildCommandMap()
    const conflicts = extractCommands(code)
        .map(c => ({ cmd: c, hit: map[c] }))
        .filter(x => x.hit && !(exists && x.hit.file === `${fileName}.js` && x.hit.folder === folder))
    if (conflicts.length) {
        return {
            ok: false,
            error: 'Command bentrok: ' + conflicts.map(c => `\`${c.cmd}\` (dipakai ${c.hit.folder}/${c.hit.file})`).join(', '),
        }
    }

    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    let backup = null
    if (exists) {
        backup = backupPlugin(filePath)
    }
    fs.writeFileSync(filePath, code)

    let reload = { success: true }
    if (hotReload) reload = hotReload(filePath)
    return { ok: true, path: filePath, reload, backup }
}

/** Simpan salinan plugin sebelum ditimpa / diperbaiki. */
function backupPlugin(filePath) {
    const rel = path.relative(PLUGINS_DIR, filePath).replace(/[\\/]/g, '__')
    const ts = new Date().toISOString().replace(/[:.]/g, '-')
    const dest = path.join(ROOT, 'backup', `${rel}.${ts}.js`)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.copyFileSync(filePath, dest)
    return dest
}

/** Cari backup terbaru untuk satu file plugin. */
function latestBackup(filePath) {
    const rel = path.relative(PLUGINS_DIR, filePath).replace(/[\\/]/g, '__')
    const dir = path.join(ROOT, 'backup')
    if (!fs.existsSync(dir)) return null
    const files = fs.readdirSync(dir).filter(f => f.startsWith(rel + '.')).sort()
    return files.length ? path.join(dir, files[files.length - 1]) : null
}

/** Cari file plugin berdasarkan nama command / nama file. */
function findPluginFile(query) {
    if (!query) return null
    const q = query.toLowerCase().replace(/\.js$/, '')
    if (!fs.existsSync(PLUGINS_DIR)) return null
    let fallback = null
    for (const folder of fs.readdirSync(PLUGINS_DIR, { withFileTypes: true }).filter(d => d.isDirectory())) {
        const dir = path.join(PLUGINS_DIR, folder.name)
        for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.js'))) {
            const full = path.join(dir, file)
            const base = file.replace(/\.js$/, '').toLowerCase()
            if (base === q) return { folder: folder.name, file, path: full }
            try {
                const cmds = extractCommands(fs.readFileSync(full, 'utf-8'))
                if (!fallback && cmds.includes(q)) fallback = { folder: folder.name, file, path: full }
            } catch {}
        }
    }
    return fallback
}

// ─── Template plugin ───────────────────────────────────────────────────────
function pluginConfigBlock({ name, alias = [], category = 'tools', description, usage, example, isOwner = false, cooldown = 5 }) {
    const s = v => JSON.stringify(v)
    return `const pluginConfig = {
    name: ${s(name)},
    alias: ${s(alias)},
    category: ${s(category)},
    description: ${s(description)},
    usage: ${s(usage)},
    example: ${s(example)},
    isOwner: ${isOwner},
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: ${Number(cooldown) || 0},
    energi: 0,
    isEnabled: true
}`
}

/** Template plugin yang memanggil API yang terdaftar di addapi. */
function buildApiPlugin(spec) {
    const { apiName, endpoint, method = 'GET', paramName = '', ...meta } = spec
    return `// Dibuat otomatis oleh .buatfitur — jangan simpan API key di sini (ambil dari addapi)
const axios = require('axios')
const { getApi } = require('../../src/lib/fixkit/store')
const { sendPanel, sendCodeFile } = require('../../src/lib/fixkit/ui')

${pluginConfigBlock({ ...meta, category: meta.category || 'tools' })}

const API_NAME = ${JSON.stringify(apiName)}
const ENDPOINT = ${JSON.stringify(endpoint)}
const METHOD = ${JSON.stringify(method.toUpperCase())}
const PARAM = ${JSON.stringify(paramName)}

async function handler(m, { sock }) {
    const api = getApi(API_NAME)
    if (!api) return m.reply(\`API \\\`\${API_NAME}\\\` belum terdaftar. Tambah dulu dengan .addapi\`)

    const input = String(m.text || m.args?.join(' ') || '').trim()
    if (PARAM && !input) return m.reply(\`Contoh pemakaian: \${pluginConfig.example}\`)

    const url = api.baseURL.replace(/\\/$/, '') + ENDPOINT
    const params = {}
    const headers = { 'User-Agent': 'Mozilla/5.0' }
    if (api.authType === 'query') params[api.authName || 'apikey'] = api.apiKey
    if (api.authType === 'header') headers[api.authName || 'x-api-key'] = api.apiKey
    if (PARAM) params[PARAM] = input

    await m.reply('⏳ Tunggu sebentar ya~')
    try {
        const res = METHOD === 'POST'
            ? await axios.post(url, params, { headers, timeout: 30000 })
            : await axios.get(url, { params, headers, timeout: 30000 })
        const data = res.data
        const full = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
        const preview = full.length > 2500 ? full.slice(0, 2500) + '\\n…(terpotong)' : full

        await sendPanel(sock, m.chat, {
            title: pluginConfig.name,
            body: preview,
            quoted: m,
            senderJid: m.sender,
            buttons: [
                ...(full.length <= 900 ? [{ type: 'copy', text: '📋 Salin Hasil', id: '.salin', code: full }] : []),
                { type: 'reply', text: '🔄 Ulangi', id: \`.\${pluginConfig.name} \${input}\`.trim() },
            ],
        })
        await sendCodeFile(sock, m.chat, \`\${pluginConfig.name}.json\`, full, { quoted: m })
    } catch (e) {
        throw new Error(\`[\${pluginConfig.name}] gagal memanggil API: \${e.message}\`)
    }
}

module.exports = { config: pluginConfig, handler }
`
}

/** Template plugin scrape (URL tetap + selector tetap). */
function buildScrapePlugin(spec) {
    const { url, selector = '', attr = '', ...meta } = spec
    return `// Dibuat otomatis oleh .buatscrape
const { scrapePage } = require('../../src/lib/fixkit/scrape')
const { sendPanel, sendCodeFile } = require('../../src/lib/fixkit/ui')

${pluginConfigBlock({ ...meta, category: meta.category || 'tools' })}

const TARGET_URL = ${JSON.stringify(url)}
const SELECTOR = ${JSON.stringify(selector)}
const ATTR = ${JSON.stringify(attr)}

async function handler(m, { sock }) {
    await m.reply('⏳ Lagi ngambil data dari website~')
    const result = await scrapePage(TARGET_URL, { selector: SELECTOR, attr: ATTR, limit: 20 })
    const full = JSON.stringify(result, null, 2)
    await sendPanel(sock, m.chat, {
        title: pluginConfig.name,
        body: full.slice(0, 2500),
        quoted: m,
        senderJid: m.sender,
        buttons: [
            ...(full.length <= 900 ? [{ type: 'copy', text: '📋 Salin Hasil', id: '.salin', code: full }] : []),
            { type: 'reply', text: '🔄 Ulangi', id: \`.\${pluginConfig.name}\` },
        ],
    })
    await sendCodeFile(sock, m.chat, \`\${pluginConfig.name}.json\`, full, { quoted: m })
}

module.exports = { config: pluginConfig, handler }
`
}

module.exports = {
    PLUGINS_DIR,
    ALLOWED_FOLDERS,
    isValidFileName,
    isAllowedFolder,
    checkSyntax,
    extractCommands,
    buildCommandMap,
    checkConfigFields,
    writePlugin,
    backupPlugin,
    latestBackup,
    findPluginFile,
    buildApiPlugin,
    buildScrapePlugin,
}
