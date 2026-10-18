/**
✧ Name    : fakeff
✧ Alias   : fakeff, fakefreefire
✧ Category: maker
✧ Deskripsi: Buat gambar fake Free Fire dengan username dan nomor lobby.
**/

const axios = require('axios')

const pluginConfig = {
    name: 'fakeff3',
    alias: ['fakefreefire3'],
    category: 'maker',
    description: 'Buat gambar fake Free Fire dengan username dan lobby',
    usage: '.fakeff <username> [lobby]',
    example: '.fakeff ItsukiBot 2',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 1,
    isEnabled: true
}

const API_URL = 'https://api.theresav.eu/api/maker/fake/ff'
const MAX_USERNAME = 30

async function fetchFakeFF(username, lobby) {
    const res = await axios.get(API_URL, {
        params: { username, lobby },
        responseType: 'arraybuffer',
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 30000,
        validateStatus: () => true
    })
    if (res.status >= 400) throw new Error(`API gagal (HTTP ${res.status})`)

    const type = String(res.headers['content-type'] || '')
    const body = Buffer.from(res.data)

    // Response langsung berupa gambar
    if (type.startsWith('image/')) return body

    // Response JSON yang berisi link gambar
    if (type.includes('json')) {
        const json = JSON.parse(body.toString('utf8'))
        const imgUrl = json?.result?.url || json?.result || json?.url || json?.data?.url || json?.image
        if (typeof imgUrl === 'string' && /^https?:\/\//.test(imgUrl)) {
            const img = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 30000, headers: { 'User-Agent': 'Mozilla/5.0' } })
            return Buffer.from(img.data)
        }
        throw new Error(json?.message || json?.error || 'Response API tidak berisi gambar.')
    }

    throw new Error('Response API tidak dikenali.')
}

async function handler(m, { sock }) {
    const args = (m.text || '').trim().split(/\s+/).filter(Boolean)

    if (!args.length) {
        return m.reply(
            `🎮 *ꜰᴀᴋᴇ ꜰʀᴇᴇ ꜰɪʀᴇ*\n\n` +
            `> Kirim username dan nomor lobby~\n\n` +
            `> ${m.prefix}fakeff <username> [lobby]\n\n` +
            `*ᴄᴏɴᴛᴏʜ:*\n> ${m.prefix}fakeff ItsukiBot 2`
        )
    }

    // Kalau argumen terakhir angka, anggap itu nomor lobby
    let lobby = '1'
    if (args.length > 1 && /^\d+$/.test(args[args.length - 1])) {
        lobby = args.pop()
    }
    const username = args.join(' ')

    if (username.length > MAX_USERNAME) {
        return m.reply(`❌ Username maksimal ${MAX_USERNAME} karakter.`)
    }

    await m.react('⏳')
    try {
        const image = await fetchFakeFF(username, lobby)
        await sock.sendMessage(m.chat, {
            image,
            caption: `🎮 *ꜰᴀᴋᴇ ꜰʀᴇᴇ ꜰɪʀᴇ*\n> Username: ${username}\n> Lobby: ${lobby}`
        }, { quoted: m })
        return m.react('✅')
    } catch (e) {
        await m.react('❌')
        return m.reply(`❌ ${e.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}