/**
✧ Name    : photobox
✧ Alias   : pbox, photoboxkoran
✧ Category: maker
✧ Deskripsi: Buat photobox koran dari gambar atau URL, dengan pilihan tema, layout, dan mode (API vamx).
              .photobox tanpa argumen menampilkan semua pilihan sebagai tombol.
**/

const axios = require('axios')
const { getApi } = require('../../src/lib/fixkit/store')
const { buildRichCardHtml, sendRichCard } = require('../../src/lib/richCard')

const pluginConfig = {
    name: 'photobox',
    alias: ['pbox', 'photoboxkoran'],
    category: 'maker',
    description: 'Buat photobox koran dengan pilihan tema, layout, dan mode',
    usage: '.photobox <tema> | <layout> | <caption> [| sendiri/berempat] [| url]',
    example: '.photobox retro-film | strip-4 | SPECIAL MOMENT WITH YOU',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 20,
    energi: 2,
    isEnabled: true
}

const API_URL = 'https://vamxapi.my.id/api/v1/canvas/photobox-koran'
const THEMES = ['retro-film', 'y2k-digital', 'korean-studio', 'pink-love', 'bestie', 'vintage-polaroid', 'black-white', 'cyber-neon', 'cute-pastel', 'classic-photostrip', 'koran']
const LAYOUTS = ['strip-4', 'strip-3', 'strip-6', 'grid-2x2', 'grid-2x3', 'single-large', 'collage-asym']
const MODES = ['sendiri', 'berempat']
const DEFAULT_THEME = 'retro-film'
const DEFAULT_LAYOUT = 'strip-4'
const DEFAULT_MODE = 'sendiri'
const DEFAULT_CAPTION = 'SPECIAL MOMENT WITH YOU'
const MAX_CAPTION = 60

// Key diambil dari database/fixkit/apis.json (nama "vamx"), env sebagai cadangan
const getApiKey = () => getApi('vamx')?.apiKey || process.env.VAMX_APIKEY || ''

const clean = (s, max) => String(s || '').replace(/[^\w\s\-.,!?'()]/g, '').trim().slice(0, max)
const slug = (s) => clean(s, 40).toLowerCase().replace(/\s+/g, '-')

// Format: tema | layout | caption | [mode] | [url]
function parseArgs(text) {
    const parts = String(text || '').split('|').map(p => p.trim())
    const theme = slug(parts[0]) || DEFAULT_THEME
    const layout = slug(parts[1]) || DEFAULT_LAYOUT
    const caption = clean(parts[2], MAX_CAPTION) || DEFAULT_CAPTION
    let mode = DEFAULT_MODE
    let url = ''
    for (const p of parts.slice(3)) {
        const v = slug(p)
        if (MODES.includes(v)) mode = v
        else if (/^https:\/\//i.test(p)) url = p
    }
    return { theme, layout, caption, mode, url }
}

// Ambil gambar hasil: bisa langsung gambar, atau JSON berisi URL/base64
async function readResult(res) {
    const type = String(res.headers['content-type'] || '')
    const body = Buffer.from(res.data)
    if (type.startsWith('image/')) return body
    if (type.includes('json')) {
        const json = JSON.parse(body.toString('utf8'))
        const url = json?.result?.url || json?.result || json?.url || json?.data?.url || json?.image
        if (typeof url === 'string' && /^https?:\/\//.test(url)) {
            const img = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000, headers: { 'User-Agent': 'Mozilla/5.0' } })
            return Buffer.from(img.data)
        }
        const b64 = typeof json?.result === 'string' ? json.result : json?.image_base64
        if (typeof b64 === 'string' && b64.length > 200) return Buffer.from(b64.replace(/^data:image\/\w+;base64,/, ''), 'base64')
        throw new Error(json?.message || json?.error || 'Response API tidak berisi gambar.')
    }
    throw new Error('Response API tidak dikenali.')
}

// Kartu pilihan: semua tema, layout, dan mode sebagai tombol (bisa di-scroll)
async function sendOptionsMenu(sock, m, prefix) {
    const cap = DEFAULT_CAPTION
    const buttons = [
        ...THEMES.map(t => ({ label: '🎨 ' + t, copy: `${prefix}photobox ${t} | ${DEFAULT_LAYOUT} | ${cap}` })),
        ...LAYOUTS.map(l => ({ label: '🧩 ' + l, copy: `${prefix}photobox ${DEFAULT_THEME} | ${l} | ${cap}` })),
        ...MODES.map(md => ({ label: '📦 ' + md, copy: `${prefix}photobox ${DEFAULT_THEME} | ${DEFAULT_LAYOUT} | ${cap} | ${md}` }))
    ]
    const html = buildRichCardHtml({
        title: '🎞️ Photobox Koran',
        subtitle: `Tema ${THEMES.length} • Layout ${LAYOUTS.length} • Mode ${MODES.length}`,
        accent: '#c0392b',
        stats: [
            { label: 'Cara pakai', value: 'Kirim gambar + perintah' },
            { label: 'Contoh', value: prefix + 'photobox retro-film | strip-4' }
        ],
        buttons
    })
    await sendRichCard(sock, m, { title: '🎞️ PHOTOBOX', footer: 'Ketuk tombol untuk menyalin perintah, lalu kirim bersama foto', html })
}

async function handler(m, { sock }) {
    const prefix = m.prefix || '.'
    const { theme, layout, caption, mode, url } = parseArgs(m.text)

    const hasImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')
    const hasArgs = String(m.text || '').trim().length > 0

    // Tanpa argumen dan tanpa gambar: tampilkan semua pilihan
    if (!hasArgs && !hasImage) {
        try {
            await m.react('🎞️')
            return sendOptionsMenu(sock, m, prefix).then(() => m.react('✅'))
        } catch (e) {
            console.error('[photobox] menu error:', e)
            return m.reply('❌ Gagal menampilkan pilihan photobox.')
        }
    }

    // Validasi pilihan terhadap daftar resmi
    if (!THEMES.includes(theme)) return m.reply(`❌ Tema "${theme}" tidak ada.\nPilihan: ${THEMES.join(', ')}`)
    if (!LAYOUTS.includes(layout)) return m.reply(`❌ Layout "${layout}" tidak ada.\nPilihan: ${LAYOUTS.join(', ')}`)

    if (!url && !hasImage) {
        return m.reply(`🎞️ Kirim/reply gambar, atau sertakan URL https di bagian terakhir.\n\n> ${prefix}photobox <tema> | <layout> | <caption> | [mode] | [url]`)
    }
    const apiKey = getApiKey()
    if (!apiKey) {
        return m.reply('❌ API key vamx belum diatur. Tambahkan dengan .addapi (nama: vamx).')
    }

    try {
        await m.react('🎞️')
        const payload = { theme, layout, caption, mode, url: url || '', file: '' }
        if (!url) {
            const buf = m.quoted && m.quoted.isMedia ? await m.quoted.download() : await m.download()
            if (!buf) throw new Error('gagal mengunduh gambar dari pesan.')
            payload.file = Buffer.from(buf).toString('base64')
        }

        const res = await axios.post(API_URL, payload, {
            headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
            responseType: 'arraybuffer',
            timeout: 120000,
            maxBodyLength: Infinity,
            validateStatus: () => true
        })
        if (res.status >= 400) {
            await m.react('❌')
            let reason = `HTTP ${res.status}`
            try { reason = JSON.parse(Buffer.from(res.data).toString('utf8')).message || reason } catch {}
            return m.reply(`❌ API gagal: ${reason}`)
        }

        const image = await readResult(res)
        await sock.sendMessage(m.chat, {
            image,
            caption: `🎞️ *ᴘʜᴏᴛᴏʙᴏx*\n> Tema: ${theme}\n> Layout: ${layout}\n> Mode: ${mode}\n> ${caption}`
        }, { quoted: m })
        return m.react('✅')
    } catch (e) {
        console.error('[photobox] Error:', e)
        await m.react('❌')
        return m.reply('❌ Gagal membuat photobox: ' + (e?.message || e))
    }
}

module.exports = { config: pluginConfig, handler }