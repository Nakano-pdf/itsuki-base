/**
✧ Name    : wacheck
✧ Alias   : cekwa, cekwhatsapp
✧ Category: tools
✧ Deskripsi: Cek apakah nomor terdaftar di WhatsApp (API vamx).
**/

const axios = require('axios')
const { getApi } = require('../../src/lib/fixkit/store')
const { buildRichCardHtml, sendRichCard } = require('../../src/lib/richCard')

const pluginConfig = {
    name: 'wacheck',
    alias: ['cekwa', 'cekwhatsapp'],
    category: 'tools',
    description: 'Cek apakah nomor terdaftar di WhatsApp',
    usage: '.wacheck <nomor>',
    example: '.wacheck 08123456789',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

const API_URL = 'https://vamxapi.my.id/api/v1/tools/wacheck'

// Key diambil dari database/fixkit/apis.json (nama "vamx"), env sebagai cadangan
const getApiKey = () => getApi('vamx')?.apiKey || process.env.VAMX_APIKEY || ''

// Terima 08xxx, 628xxx, +628xxx; kembalikan format 08xxx
function normalizeNumber(raw) {
    let n = String(raw || '').replace(/[^\d+]/g, '').replace(/^\+/, '')
    if (n.startsWith('62')) n = '0' + n.slice(2)
    if (!/^08\d{7,12}$/.test(n)) return null
    return n
}

// Ambil hasil cek dari bentuk response yang mungkin berbeda
function interpret(data) {
    const root = data?.data ?? data?.result ?? data ?? {}
    const flag = root.registered ?? root.isRegistered ?? root.exists ?? root.status ?? root.is_registered
    const registered = flag === true || flag === 'true' || flag === 'registered' || flag === 1
    const msg = data?.message || root.message || ''
    return { registered, msg, raw: root }
}

async function handler(m, { sock }) {
    const prefix = m.prefix || '.'
    const nomor = normalizeNumber((m.text || '').trim())
    if (!nomor) {
        return m.reply(`📲 *ᴡᴀ ᴄʜᴇᴄᴋ*\n\n> ${prefix}wacheck <nomor>\n\n*ᴄᴏɴᴛᴏʜ:*\n> ${prefix}wacheck 08123456789`)
    }
    const apiKey = getApiKey()
    if (!apiKey) {
        return m.reply('❌ API key vamx belum diatur. Tambahkan dengan .addapi (nama: vamx).')
    }

    try {
        await m.react('📲')
        const res = await axios.get(API_URL, {
            params: { phone: nomor },
            headers: { 'x-api-key': apiKey, 'User-Agent': 'Mozilla/5.0' },
            timeout: 20000,
            validateStatus: () => true
        })
        if (res.status >= 400) {
            await m.react('❌')
            const reason = res.data?.message || res.data?.error || `HTTP ${res.status}`
            return m.reply(`❌ API gagal: ${reason}`)
        }

        const { registered, msg } = interpret(res.data)
        const html = buildRichCardHtml({
            title: '📲 ' + nomor,
            subtitle: registered ? 'Terdaftar di WhatsApp' : 'Tidak terdaftar / tidak terdeteksi',
            accent: registered ? '#2ecc71' : '#c0392b',
            stats: [
                { label: 'Nomor', value: nomor },
                { label: 'Status', value: registered ? '✅ Terdaftar' : '❌ Tidak terdaftar' },
                ...(msg ? [{ label: 'Keterangan', value: String(msg).slice(0, 60) }] : [])
            ],
            buttons: [{ label: '🔁 Cek nomor lain', copy: prefix + 'wacheck ' }]
        })
        await sendRichCard(sock, m, { title: '📲 CEK WHATSAPP', footer: 'Data dari layanan pihak ketiga', html })
        return m.react('✅')
    } catch (e) {
        console.error('[wacheck] Error:', e)
        await m.react('❌')
        return m.reply('❌ Gagal cek WhatsApp: ' + (e?.message || e))
    }
}

module.exports = { config: pluginConfig, handler }