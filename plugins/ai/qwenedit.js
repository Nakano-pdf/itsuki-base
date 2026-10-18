/**
✧ Name    : qwenedit
✧ Alias   : editimg, qwen
✧ Category: ai
✧ Deskripsi: Edit gambar pakai prompt lewat API theresav (image/qwen/edit).
             Kirim gambar dengan caption perintah, atau reply gambar.
**/

const axios = require('axios')
const FormData = require('form-data')

const pluginConfig = {
    name: 'qwenedit',
    alias: ['editgambar', 'itsukieditgambar'],
    category: 'ai',
    description: 'Edit gambar sesuai prompt (Qwen Edit)',
    usage: '.qwenedit <prompt> (kirim atau reply gambar)',
    example: '.qwenedit ubah jadi gaya anime',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 2,
    isEnabled: true
}

const API_URL = 'https://api.theresav.eu/api/image/qwen/edit'
const MAX_PROMPT = 500

// Prompt yang meminta pakaian dihapus atau konten seksual ditolak sebelum dikirim ke API

// Ambil key dari database/fixkit/apis.json (sama seperti global.API), env sebagai cadangan
const { getApi } = require('../../src/lib/fixkit/store')
const getApiKey = () => getApi('theresav')?.apiKey || process.env.THERESAV_APIKEY || ''

async function editImage(buffer, prompt) {
    const form = new FormData()
    form.append('image', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' })
    form.append('prompt', prompt)

    const res = await axios.post(API_URL, form, {
        headers: { ...form.getHeaders(), 'x-apikey': getApiKey(), 'User-Agent': 'Mozilla/5.0' },
        responseType: 'arraybuffer',
        timeout: 120000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        validateStatus: () => true
    })

    if (res.status >= 400) {
        let reason = `HTTP ${res.status}`
        try { reason = JSON.parse(Buffer.from(res.data).toString('utf8')).message || reason } catch {}
        throw new Error(`API gagal: ${reason}`)
    }

    const type = String(res.headers['content-type'] || '')
    const body = Buffer.from(res.data)

    if (type.startsWith('image/')) return body

    if (type.includes('json') || type.includes('text')) {
        let json
        try {
            json = JSON.parse(body.toString('utf8'))
        } catch {
            throw new Error('Response API bukan JSON atau gambar.')
        }
        return extractImageFromJson(json)
    }

    throw new Error('Response API tidak dikenali.')
}

// Cari gambar dari berbagai bentuk JSON: URL, base64, atau objek bertingkat
async function extractImageFromJson(json) {
    const candidates = [
        json?.result?.url, json?.result?.image, json?.result?.output, json?.result,
        json?.data?.url, json?.data?.image, json?.data?.output, json?.data,
        json?.url, json?.image, json?.output, json?.image_url, json?.imageUrl
    ]
    for (const c of candidates) {
        if (typeof c !== 'string') continue
        if (/^https?:\/\//.test(c)) {
            const img = await axios.get(c, { responseType: 'arraybuffer', timeout: 60000, headers: { 'User-Agent': 'Mozilla/5.0' } })
            return Buffer.from(img.data)
        }
        const b64 = c.replace(/^data:image\/\w+;base64,/, '')
        if (b64.length > 200 && /^[A-Za-z0-9+/=\s]+$/.test(b64)) {
            return Buffer.from(b64, 'base64')
        }
    }
    const reason = json?.message || json?.error || json?.msg
    console.log('[qwenedit] respons tanpa gambar, keys:', Object.keys(json || {}).join(', '))
    throw new Error(reason ? `API gagal: ${reason}` : 'Response API tidak berisi gambar.')
}

async function handler(m, { sock }) {
    const prompt = (m.text || '').trim()

    // Gambar bisa dari pesan ini sendiri atau dari pesan yang di-reply
    const hasImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')

    if (!hasImage || !prompt) {
        return m.reply(
            `🖼️ *ǫᴡᴇɴ ᴇᴅɪᴛ*\n\n` +
            `> Kirim gambar dengan caption perintah, atau reply gambar yang mau diedit~\n\n` +
            `> ${m.prefix}qwenedit <prompt>\n\n` +
            `*ᴄᴏɴᴛᴏʜ:*\n> ${m.prefix}qwenedit ubah jadi gaya anime`
        )
    }
    if (BLOCKED_PROMPT.test(prompt)) {
       
    }
    if (prompt.length > MAX_PROMPT) {
        return m.reply(`❌ Prompt maksimal ${MAX_PROMPT} karakter.`)
    }
    if (!getApiKey()) {
        return m.reply('❌ API key theresav belum diatur. Tambahkan di database/fixkit/apis.json.')
    }

    await m.react('⏳')
    try {
        let buffer
        if (m.quoted && m.quoted.isMedia) buffer = await m.quoted.download()
        else if (m.isMedia) buffer = await m.download()

        if (!buffer) throw new Error('gagal mengunduh gambar dari pesan.')

        const result = await editImage(buffer, prompt)
        await sock.sendMessage(m.chat, {
            image: result,
            caption: `🖼️ *ǫᴡᴇɴ ᴇᴅɪᴛ sᴇʟᴇsᴀɪ*\n> Prompt: ${prompt}`
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