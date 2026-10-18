/**
✧ Name    : cekoperator
✧ Alias   : operator, cekprovider
✧ Category: tools
✧ Deskripsi: Cek operator seluler dari nomor HP (API vamx).
**/

const axios = require('axios')
const { getApi } = require('../../src/lib/fixkit/store')
const { buildRichCardHtml, sendRichCard } = require('../../src/lib/richCard')

const pluginConfig = {
    name: 'cekoperator',
    alias: ['operator', 'cekprovider'],
    category: 'tools',
    description: 'Cek operator seluler dari nomor HP',
    usage: '.cekoperator <nomor>',
    example: '.cekoperator 081234567890',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

const API_URL = 'https://vamxapi.my.id/api/v1/tools/cek-operator'

// Key diambil dari database/fixkit/apis.json (nama "vamx"), env sebagai cadangan
const getApiKey = () => getApi('vamx')?.apiKey || process.env.VAMX_APIKEY || ''

// Terima 08xxx, 628xxx, +628xxx; kembalikan format 08xxx
function normalizeNumber(raw) {
    let n = String(raw || '').replace(/[^\d+]/g, '').replace(/^\+/, '')
    if (n.startsWith('62')) n = '0' + n.slice(2)
    if (!/^08\d{7,12}$/.test(n)) return null
    return n
}

const LABELS = { operator: 'Operator', provider: 'Operator', nama_operator: 'Operator', region: 'Wilayah', wilayah: 'Wilayah', prefix: 'Prefix', status: 'Status', tipe: 'Tipe', type: 'Tipe', nomor: 'Nomor' }

// Ambil data dari bentuk response yang mungkin berbeda
function extractFields(data) {
    const root = data?.data ?? data?.result ?? data ?? {}
    const out = []
    for (const [k, v] of Object.entries(root)) {
        if (v === null || v === undefined || typeof v === 'object') continue
        const label = LABELS[k.toLowerCase()] || k
        out.push({ label, value: String(v) })
    }
    return out.slice(0, 6)
}

async function handler(m, { sock }) {
    const prefix = m.prefix || '.'
    const nomor = normalizeNumber((m.text || '').trim())
    if (!nomor) {
        return m.reply(`📱 *ᴄᴇᴋ ᴏᴘᴇʀᴀᴛᴏʀ*\n\n> ${prefix}cekoperator <nomor>\n\n*ᴄᴏɴᴛᴏʜ:*\n> ${prefix}cekoperator 081234567890`)
    }
    const apiKey = getApiKey()
    if (!apiKey) {
        return m.reply('❌ API key vamx belum diatur. Tambahkan dengan .addapi (nama: vamx).')
    }

    try {
        await m.react('📱')
        const res = await axios.get(API_URL, {
            params: { nomor },
            headers: { 'x-api-key': apiKey, 'User-Agent': 'Mozilla/5.0' },
            timeout: 20000,
            validateStatus: () => true
        })
        if (res.status >= 400) {
            await m.react('❌')
            const reason = res.data?.message || res.data?.error || `HTTP ${res.status}`
            return m.reply(`❌ API gagal: ${reason}`)
        }
        const fields = extractFields(res.data)
        if (!fields.length) {
            await m.react('⚠️')
            return m.reply('⚠️ Nomor tidak menghasilkan data operator.')
        }

        const html = buildRichCardHtml({
            title: '📱 ' + nomor,
            subtitle: 'Hasil cek operator',
            accent: '#2a9d8f',
            stats: [{ label: 'Nomor', value: nomor }, ...fields],
            buttons: [{ label: '🔁 Cek nomor lain', copy: prefix + 'cekoperator ' }]
        })
        await sendRichCard(sock, m, { title: '📱 CEK OPERATOR', footer: 'Data dari layanan pihak ketiga', html })
        return m.react('✅')
    } catch (e) {
        console.error('[cekoperator] Error:', e)
        await m.react('❌')
        return m.reply('❌ Gagal cek operator: ' + (e?.message || e))
    }
}

module.exports = { config: pluginConfig, handler }