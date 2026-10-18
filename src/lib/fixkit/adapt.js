/**
 * Fixkit adapt — mesin transformasi kode plugin.
 *   adaptToItsuki  → fixpl1: ubah plugin mentah (bot lain) jadi format Itsuki
 *   lintAndFix     → fixpl2: cek + perbaiki masalah umum
 *   scanDeps       → fixpl3: cek dependensi npm & file lokal
 *   richify        → addairich: ubah m.reply(...) jadi balasan interaktif dengan tombol
 */
const fs = require('fs')
const path = require('path')
const { builtinModules } = require('module')
const { checkSyntax, checkConfigFields, extractCommands, buildCommandMap } = require('./codegen')

const ROOT = process.cwd()

// ─── helper: cari blok { ... } yang cocok dari posisi "{" ─────────────────
function findBlockEnd(code, openIdx) {
    let depth = 0
    let inStr = null
    for (let i = openIdx; i < code.length; i++) {
        const ch = code[i]
        const prev = code[i - 1]
        if (inStr) {
            if (ch === inStr && prev !== '\\') inStr = null
            continue
        }
        if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue }
        if (ch === '{') depth++
        else if (ch === '}') {
            depth--
            if (depth === 0) return i
        }
    }
    return -1
}

/** Pastikan blok pluginConfig punya semua field wajib. */
function ensureConfigFields(code, fallback) {
    const changes = []
    const m = code.match(/const\s+pluginConfig\s*=\s*\{/)
    if (!m) return { code, changes }
    const open = m.index + m[0].length - 1
    const end = findBlockEnd(code, open)
    if (end < 0) return { code, changes }
    const block = code.slice(open, end + 1)

    const defaults = {
        name: JSON.stringify(fallback.name),
        category: JSON.stringify(fallback.category || 'tools'),
        description: JSON.stringify(fallback.description || 'Plugin hasil adaptasi Itsuki'),
        usage: JSON.stringify(`.${fallback.name}`),
        example: JSON.stringify(`.${fallback.name}`),
        isOwner: 'false',
        isPremium: 'false',
        isGroup: 'false',
        isPrivate: 'false',
        cooldown: '3',
        energi: '0',
        isEnabled: 'true',
    }
    const missing = Object.keys(defaults).filter(k => !new RegExp(`\\b${k}\\s*:`).test(block))
    if (!missing.length) return { code, changes }

    const insert = missing.map(k => `\n    ${k}: ${defaults[k]},`).join('')
    const newCode = code.slice(0, open + 1) + insert + code.slice(open + 1)
    changes.push(`menambah field config: ${missing.join(', ')}`)
    return { code: newCode, changes }
}

/** Pastikan ada module.exports = { config, handler }. */
function ensureExports(code, fallbackName) {
    const changes = []
    if (/module\.exports/.test(code)) return { code, changes }
    const hasHandler = /async\s+function\s+handler|function\s+handler|const\s+handler\s*=/.test(code)
    if (!hasHandler) return { code, changes }
    const cfg = /const\s+pluginConfig\s*=/.test(code) ? 'pluginConfig' : `{ name: ${JSON.stringify(fallbackName)}, category: 'tools', description: 'Adaptasi Itsuki', isOwner: false, isEnabled: true }`
    changes.push('menambah module.exports')
    return { code: code.trimEnd() + `\n\nmodule.exports = { config: ${cfg}, handler }\n`, changes }
}

/**
 * fixpl1 — adaptasi plugin mentah ke Itsuki.
 * @returns {{ code, changes: string[], syntax: {ok, error} }}
 */
function adaptToItsuki(raw, { name = 'plugin-adaptasi', category = 'tools' } = {}) {
    const changes = []
    let code = String(raw).replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
    if (code !== raw) changes.push('normalisasi encoding/baris')

    // 1. require library bot lain → itsuki
    const libRe = /require\((['"`])(@whiskeysockets\/baileys|baileys|@adiwajshing\/baileys|hsnai|hoshino|ourin[\w-]*|nixcode|itsuki-lib)\1\)/gi
    let n = 0
    code = code.replace(libRe, () => { n++; return "require('itsuki')" })
    if (n) changes.push(`${n} require library bot lain → require('itsuki')`)

    // 2. path helper lama (../lib/... atau ../../lib/...) → ../../src/lib/...
    let p = 0
    code = code.replace(/require\((['"`])(?:\.\.\/)+lib\/([^'"`]+)\1\)/g, (_, q, rest) => { p++; return `require(${q}../../src/lib/${rest}${q})` })

    if (p) changes.push(`${p} path ../lib → ../../src/lib`)

    // 3. branding lama → Itsuki
    let b = 0
    code = code.replace(/Ourin[- ]?AI|Ourin|Hoshino\s*Ai-?Bot|Hoshino Ai|Ai Hoshino|Hoshino|SeaPRST\s*\|\|\s*Died100|SeaPRST|Died100/g, () => { b++; return 'Itsuki Nakano' })
    if (b) changes.push(`${b} branding lama → Itsuki Nakano`)

    // 4. config + exports
    const cfg = ensureConfigFields(code, { name, category })
    code = cfg.code; changes.push(...cfg.changes)
    const ex = ensureExports(code, name)
    code = ex.code; changes.push(...ex.changes)

    // 5. pastikan pakai config Itsuki (bukan config bot lain)
    if (/require\(['"`][^'"`]*(ourin|hoshino|config-ourin)[^'"`]*['"`]\)/i.test(code)) {
        code = code.replace(/require\((['"`])[^'"`]*(ourin|hoshino)[^'"`]*\1\)/gi, "require('../../config')")
        changes.push('require config bot lain → ../../config')
    }

    const syntax = checkSyntax(code)
    return { code, changes, syntax }
}

// ─── fixpl2 — lint & auto-fix ──────────────────────────────────────────────
/**
 * Cek masalah dan perbaiki yang aman diperbaiki otomatis.
 * @returns {{ code, fixed: string[], issues: string[], syntax: {ok, error} }}
 */
function lintAndFix(raw, { name = 'plugin' } = {}) {
    const fixed = []
    const issues = []
    let code = String(raw)

    if (/^\uFEFF/.test(code)) { code = code.replace(/^\uFEFF/, ''); fixed.push('hapus BOM') }
    if (code.includes('\r\n')) { code = code.replace(/\r\n/g, '\n'); fixed.push('CRLF → LF') }
    if (!code.endsWith('\n')) { code += '\n'; fixed.push('tambah newline di akhir file') }

    // m.reply(...) tanpa await → tambahkan await (balasan bisa terlambat / error tak tertangkap)
    const noAwait = code.match(/^(\s*)m\.reply\(/gm)
    if (noAwait) {
        code = code.replace(/^(\s*)m\.reply\(/gm, '$1await m.reply(')
        fixed.push(`${noAwait.length}× tambah await pada m.reply`)
    }

    // console.log yang tidak perlu → peringatan saja
    const logs = (code.match(/console\.log\(/g) || []).length
    if (logs > 5) issues.push(`banyak console.log (${logs}), pertimbangkan dikurangi`)

    // cek config & exports
    issues.push(...checkConfigFields(code).map(x => `⚠ ${x}`))
    const ex = ensureExports(code, name)
    if (ex.changes.length) { code = ex.code; fixed.push(...ex.changes) }
    const cfg = ensureConfigFields(code, { name })
    if (cfg.changes.length) { code = cfg.code; fixed.push(...cfg.changes) }

    // konflik command dengan plugin lain
    const map = buildCommandMap()
    for (const c of extractCommands(code)) {
        if (map[c]) issues.push(`⚠ command \`${c}\` sudah dipakai ${map[c].folder}/${map[c].file}`)
    }

    // masalah pola yang sering bikin error
    if (/\bawait\b/.test(code) && !/async\s+function|async\s*\(|=>\s*\{?\s*$/m.test(code) && !/async/.test(code)) {
        issues.push('⚠ ada `await` tapi tidak ada fungsi async')
    }
    if (/\beval\s*\(/.test(code)) issues.push('⚠ memakai eval(), berisiko')

    const syntax = checkSyntax(code)
    if (!syntax.ok) issues.unshift(`❌ sintaks error: ${syntax.error}`)
    return { code, fixed, issues, syntax }
}

// ─── fixpl3 — dependency doctor ────────────────────────────────────────────
const NODE_BUILTINS = new Set(builtinModules.concat(builtinModules.map(m => m.replace(/^node:/, ''))))

/** Ambil semua require() dari source. */
function extractRequires(code) {
    const out = []
    const re = /require\((['"`])([^'"`]+)\1\)/g
    let m
    while ((m = re.exec(code))) out.push(m[2])
    return [...new Set(out)]
}

/** Cek setiap dependensi: builtin / npm (terpasang?) / lokal (ada file?). */
function scanDeps(code, baseDir = path.join(ROOT, 'plugins')) {
    const res = { builtin: [], installed: [], missingNpm: [], localOk: [], missingLocal: [] }
    for (const id of extractRequires(code)) {
        if (id.startsWith('.') || id.startsWith('/')) {
            const target = path.resolve(baseDir, id)
            const candidates = [target, target + '.js', target + '.json', path.join(target, 'index.js')]
            if (candidates.some(c => fs.existsSync(c))) res.localOk.push(id)
            else res.missingLocal.push(id)
            continue
        }
        const bare = id.replace(/^node:/, '')
        if (NODE_BUILTINS.has(bare)) { res.builtin.push(id); continue }
        try {
            require.resolve(id, { paths: [ROOT] })
            res.installed.push(id)
        } catch {
            res.missingNpm.push(id)
        }
    }
    return res
}

/** Nama paket yang aman untuk dipasang (whitelist format npm). */
function isSafePackageName(name) {
    return /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*(@[a-z0-9^~.\-*]+)?$/i.test(name || '') && name.length <= 100
}

module.exports = {
    adaptToItsuki,
    lintAndFix,
    scanDeps,
    isSafePackageName,
    extractRequires,
    findBlockEnd,
}
