const axios = require('axios')
const store = require('../../src/lib/fixkit/store')
const ui = require('../../src/lib/fixkit/ui')
const { argText, splitPipe } = require('../../src/lib/fixkit/args')
const { validateUrl } = require('../../src/lib/fixkit/scrape')

const pluginConfig = {
    name: 'addapi',
    alias: ['tambahapi', 'apilist'],
    category: 'owner',
    description: 'Tambah / lihat / tes / hapus API (baseURL + API key) untuk dipakai buatfitur',
    usage: '.addapi add <nama> | <baseURL> | <apiKey> | <header|query|none> | [namaAuth]\n.addapi list | del <nama> | test <nama> | <endpoint>',
    example: '.addapi add tiktokapi | https://api.contoh.com | KEY123 | header | x-api-key',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true,
}

const HELP = `🔌 *ADDAPI*

> \`.addapi add <nama> | <baseURL> | <apiKey> | <header|query|none> | [namaAuth]\`
> Contoh: \`.addapi add tiktokapi | https://api.contoh.com | KEY123 | header | x-api-key\`
> \`.addapi list\` — lihat semua API (key disamarkan)
> \`.addapi test <nama> | /endpoint\` — tes panggil API
> \`.addapi del <nama>\` — hapus API`

function maskKey(k) {
    if (!k) return '-'
    return k.length <= 6 ? '•••' : `${k.slice(0, 3)}•••${k.slice(-3)}`
}

async function handler(m, { sock }) {
    const text = argText(m)
    const sub = (text.split(/\s+/)[0] || '').toLowerCase()
    const rest = text.slice(sub.length).trim()

    if (!sub) return m.reply(HELP)

    if (sub === 'add') {
        const [name, baseURL, apiKey = '', authTypeRaw = 'none', authName = ''] = splitPipe(rest)
        if (!name || !baseURL) return m.reply(HELP)
        const clean = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '')
        if (!clean) return m.reply('❌ Nama API tidak valid.')
        try { validateUrl(baseURL) } catch (e) { return m.reply(`❌ ${e.message}`) }
        const authType = ['header', 'query', 'none'].includes(authTypeRaw.toLowerCase()) ? authTypeRaw.toLowerCase() : 'none'
        const api = store.saveApi({
            name: clean,
            baseURL: baseURL.replace(/\/$/, ''),
            apiKey,
            authType,
            authName: authName || (authType === 'header' ? 'x-api-key' : authType === 'query' ? 'apikey' : ''),
            createdAt: new Date().toISOString(),
        })
        return ui.sendPanel(sock, m.chat, {
            title: '✅ API tersimpan',
            body: `*Nama:* ${api.name}\n*Base URL:* ${api.baseURL}\n*API Key:* ${maskKey(api.apiKey)}\n*Auth:* ${api.authType}${api.authName ? ' (' + api.authName + ')' : ''}`,
            quoted: m,
            senderJid: m.sender,
            buttons: [
                { type: 'reply', text: '🧪 Tes API', id: `.addapi test ${api.name}` },
                { type: 'reply', text: '🧱 Buat Fitur', id: `.buatfitur ${api.name} | /endpoint | namafitur` },
                { type: 'reply', text: '📋 Daftar API', id: '.addapi list' },
            ],
        })
    }

    if (sub === 'list') {
        const all = Object.values(store.getApis())
        if (!all.length) return m.reply('Belum ada API terdaftar. Tambah dengan `.addapi add`.')
        const body = all.map((a, i) => `${i + 1}. *${a.name}*\n   ${a.baseURL}\n   key: ${maskKey(a.apiKey)} · auth: ${a.authType}`).join('\n')
        return ui.sendPanel(sock, m.chat, {
            title: `🔌 Daftar API (${all.length})`,
            body,
            quoted: m,
            senderJid: m.sender,
            buttons: all.slice(0, 3).map(a => ({ type: 'reply', text: `🧪 Tes ${a.name}`.slice(0, 24), id: `.addapi test ${a.name}` })),
        })
    }

    if (sub === 'del' || sub === 'delete' || sub === 'hapus') {
        const name = rest.split(/\s+/)[0]
        const ok = store.deleteApi(name || '')
        return m.reply(ok ? `🗑 API \`${name}\` dihapus.` : `❌ API \`${name}\` tidak ditemukan.`)
    }

    if (sub === 'test') {
        const [name, endpoint = ''] = splitPipe(rest)
        const api = store.getApi(name)
        if (!api) return m.reply(`❌ API \`${name}\` tidak ditemukan.`)
        const url = api.baseURL + (endpoint || '')
        const params = {}
        const headers = { 'User-Agent': 'Mozilla/5.0' }
        if (api.authType === 'query') params[api.authName || 'apikey'] = api.apiKey
        if (api.authType === 'header') headers[api.authName || 'x-api-key'] = api.apiKey
        try {
            const res = await axios.get(url, { params, headers, timeout: 15000, validateStatus: () => true })
            const body = typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2)
            return m.reply(`🧪 *Tes ${api.name}*\n> URL: ${url}\n> Status: ${res.status}\n\n${body.slice(0, 1200)}`)
        } catch (e) {
            return m.reply(`❌ Tes gagal: ${e.message}`)
        }
    }

    return m.reply(HELP)
}

module.exports = { config: pluginConfig, handler }
