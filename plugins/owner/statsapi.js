/**
✧ Name    : statsapi
✧ Alias   : apistats, cekapi
✧ Category: owner
✧ Deskripsi: Cek koneksi, kecepatan, dan kesehatan semua API yang tersimpan di apis.json (tampil sebagai kartu AIRich).
**/

const axios = require('axios')
const { AIRich } = require('../../src/lib/aiRich')
const store = require('../../src/lib/fixkit/store')

const pluginConfig = {
    name: 'statsapi',
    alias: ['apistats', 'cekapi'],
    category: 'owner',
    description: 'Cek koneksi, kecepatan, dan kesehatan API',
    usage: '.statsapi',
    example: '.statsapi',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

const TIMEOUT_MS = 8000
const NET_PROBE = 'https://www.google.com/generate_204'

// Cek satu URL: kembalikan status, latensi (ms), dan label kesehatan
async function probe(url, headers = {}) {
    const start = Date.now()
    try {
        const res = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0', ...headers },
            timeout: TIMEOUT_MS,
            validateStatus: () => true,
            maxRedirects: 3,
        })
        const ms = Date.now() - start
        const code = res.status
        let health
        if (code >= 200 && code < 400) health = 'ok'
        else if (code === 401 || code === 403) health = 'key'
        else if (code === 404) health = 'path'
        else if (code >= 500) health = 'down'
        else health = 'warn'
        return { code, ms, health }
    } catch (e) {
        const ms = Date.now() - start
        const timeout = /timeout|ECONNABORTED/i.test(String(e?.code || e?.message))
        return { code: 0, ms, health: timeout ? 'timeout' : 'offline' }
    }
}

// Bar progres dari karakter: makin kecil latensi, makin penuh
function bar(ms, health) {
    if (health !== 'ok') return '░░░░░░░░░░'
    const filled = ms < 200 ? 10 : ms < 500 ? 8 : ms < 1000 ? 6 : ms < 2000 ? 4 : 2
    return '█'.repeat(filled) + '░'.repeat(10 - filled)
}

const ICON = { ok: '🟢', key: '🔑', path: '🟡', warn: '🟠', down: '🔴', timeout: '⏱️', offline: '⚫' }
const LABEL = { ok: 'SEHAT', key: 'KEY BERMASALAH', path: 'PATH SALAH', warn: 'PERLU DICEK', down: 'SERVER ERROR', timeout: 'TIMEOUT', offline: 'OFFLINE' }

// Ambil base URL dari entri apis.json; host saja yang ditampilkan (key tidak pernah ditampilkan)
function listApis() {
    const all = typeof store.getApis === 'function' ? store.getApis() : {}
    return Object.values(all || {}).filter(a => a && a.baseURL)
}

async function handler(m, { sock }) {
    const prefix = m.prefix || '.'
    try {
        await m.react('📡')

        const net = await probe(NET_PROBE)
        const apis = listApis()
        const results = await Promise.all(apis.map(async (api) => {
            const headers = api.apiKey && api.authType === 'header' && api.authName
                ? { [api.authName]: api.apiKey } : {}
            const r = await probe(api.baseURL, headers)
            let host = api.name
            try { host = new URL(api.baseURL).hostname } catch {}
            return { name: api.name, host, ...r }
        }))

        const healthy = results.filter(r => r.health === 'ok').length
        const avg = results.length ? Math.round(results.reduce((s, r) => s + r.ms, 0) / results.length) : 0
        const netOk = net.health === 'ok'

        const rich = new AIRich(sock)
            .setTitle('📡 API STATS')
            .setFooter(`Cek dijalankan ${new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`)

        rich.addText(
            `${netOk ? '🟢' : '🔴'} *Koneksi internet:* ${netOk ? 'stabil' : 'bermasalah'} • ${net.ms} ms\n` +
            `${healthy}/${results.length} API sehat • rata-rata ${avg} ms`
        )

        if (!results.length) {
            rich.addText('⚠️ Belum ada API tersimpan. Tambahkan dengan `.addapi`.')
        }

        for (const r of results) {
            rich.addText(
                `${ICON[r.health] || '⚪'} *${r.name}* — ${LABEL[r.health] || r.health}\n` +
                `   ${r.host}\n` +
                `   ${bar(r.ms, r.health)}  ${r.ms} ms${r.code ? ` • HTTP ${r.code}` : ''}`
            )
        }

        await rich.send(m.chat, { quoted: m })
        return m.react('✅')
    } catch (e) {
        console.error('[statsapi] Error:', e)
        await m.react('❌')
        return m.reply('❌ Gagal mengecek API: ' + (e?.message || e))
    }
}

module.exports = { config: pluginConfig, handler }