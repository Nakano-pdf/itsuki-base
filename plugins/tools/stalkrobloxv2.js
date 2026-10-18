/**
✧ Name    : stalkrobloxv2
✧ Alias   : stalkroblox
✧ Category: stalker
✧ Deskripsi: Cek info profil publik Roblox lewat API theresav.
**/

const axios = require('axios')

const pluginConfig = {
    name: 'stalkrobloxv2',
    alias: ['stalkrobloxv2'],
    category: 'stalker',
    description: 'Cek info profil publik Roblox berdasarkan username',
    usage: '.stalkrobloxv2 <username>',
    example: '.stalkrobloxv2 yellowferrari',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

const API_URL = 'https://api.theresav.eu/api/stalk/roblox'
// Ambil key dari database/fixkit/apis.json (sama seperti global.API), env sebagai cadangan
const { getApi } = require('../../src/lib/fixkit/store')
const getApiKey = () => getApi('theresav')?.apiKey || process.env.THERESAV_APIKEY || ''
const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/

// Field yang sebaiknya disembunyikan dari tampilan
const HIDDEN_KEYS = new Set(['avatar', 'avatarUrl', 'image', 'thumbnail', 'status', 'success', 'creator', 'developer'])

async function stalkRoblox(username) {
    const res = await axios.get(API_URL, {
        params: { username },
        headers: { 'x-apikey': getApiKey(), 'User-Agent': 'Mozilla/5.0' },
        timeout: 30000,
        validateStatus: () => true
    })
    if (res.status >= 400) {
        throw new Error(res.data?.message || res.data?.error || `API gagal (HTTP ${res.status})`)
    }
    return res.data
}

// Ambil data profil dari bentuk response yang mungkin berbeda
function unwrap(data) {
    if (data && typeof data === 'object' && data.result && typeof data.result === 'object') return data.result
    if (data && typeof data === 'object' && data.data && typeof data.data === 'object') return data.data
    return data || {}
}

function formatValue(v) {
    if (v === null || v === undefined || v === '') return '-'
    if (typeof v === 'object') return JSON.stringify(v).slice(0, 120)
    return String(v)
}

// Ambil headshot resmi dari Roblox pakai user id (endpoint publik, tanpa key).
// Return { url, state }: state dari Roblox, misalnya "Completed" atau "Blocked".
async function getRobloxHeadshot(userId) {
    if (!userId || !/^\d+$/.test(String(userId))) return { url: '', state: 'Invalid' }
    try {
        const res = await axios.get('https://thumbnails.roblox.com/v1/users/avatar-headshot', {
            params: { userIds: String(userId), size: '420x420', format: 'Png', isCircular: 'false' },
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0' },
            validateStatus: () => true
        })
        const item = res.data?.data?.[0] || {}
        const url = typeof item.imageUrl === 'string' && /^https?:\/\//.test(item.imageUrl) ? item.imageUrl : ''
        return { url, state: item.state || 'Unknown' }
    } catch (e) {
        console.log('[stalkrobloxv2] thumbnail API error:', e.message)
        return { url: '', state: 'Error' }
    }
}

function findAvatar(info) {
    const candidate = info.avatar || info.avatarUrl || info.image || info.thumbnail || info.headshot || ''
    return typeof candidate === 'string' && /^https?:\/\//.test(candidate) ? candidate : ''
}

async function handler(m, { sock }) {
    // Hilangkan '+' dan spasi sisa, lalu ambil username pertama
    const raw = (m.text || '').trim().replace(/\+/g, ' ').split(/\s+/)[0] || ''
    const username = raw.trim()

    if (!username) {
        return m.reply(
            `🎮 *ʀᴏʙʟᴏx ꜱᴛᴀʟᴋ*\n\n` +
            `> Kirim username Roblox-nya~\n\n` +
            `> ${m.prefix}stalkrobloxv2 <username>\n\n` +
            `*ᴄᴏɴᴛᴏʜ:*\n> ${m.prefix}stalkrobloxv2 yellowferrari`
        )
    }
    if (!USERNAME_RE.test(username)) {
        return m.reply('❌ Username Roblox hanya boleh huruf, angka, dan underscore (3–20 karakter).')
    }
    if (!getApiKey()) {
        return m.reply('❌ API key theresav belum diatur. Tambahkan di database/fixkit/apis.json.')
    }

    await m.react('🔍')
    try {
        const data = await stalkRoblox(username)
        const info = unwrap(data)

        if (!info || !Object.keys(info).length) {
            await m.react('⚠️')
            return m.reply(`⚠️ Profil Roblox *${username}* tidak ditemukan.`)
        }

        const rows = Object.entries(info)
            .filter(([k]) => !HIDDEN_KEYS.has(k))
            .slice(0, 15)
            .map(([k, v]) => `> *${k}:* ${formatValue(v)}`)
            .join('\n')

        const baseCaption =
            `🎮 *ʀᴏʙʟᴏx ᴘʀᴏꜰɪʟᴇ*\n` +
            `> Username: ${username}\n\n` +
            (rows || '> (tidak ada data tambahan)')

        const userId = info.id || info.userId || info.data?.id
        const thumb = findAvatar(info) ? { url: findAvatar(info), state: 'Completed' } : await getRobloxHeadshot(userId)
        const avatar = thumb.url
        const avatarNote = avatar ? '' : `\n\n> ⚠️ Avatar tidak tersedia (status Roblox: ${thumb.state})`
        const caption = baseCaption + avatarNote
        if (avatar) {
            try {
                const img = await axios.get(avatar, { responseType: 'arraybuffer', timeout: 20000, headers: { 'User-Agent': 'Mozilla/5.0' } })
                await sock.sendMessage(m.chat, { image: Buffer.from(img.data), caption }, { quoted: m })
                return m.react('✅')
            } catch (e) {
                console.log('[stalkrobloxv2] gagal unduh/kirim avatar:', avatar, e.message)
            }
        } else {
            console.log('[stalkrobloxv2] avatar tidak ditemukan untuk id:', userId)
        }

        await m.react('✅')
        return m.reply(caption)
    } catch (e) {
        await m.react('❌')
        return m.reply(`❌ ${e.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}