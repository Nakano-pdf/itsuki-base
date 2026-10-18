const axios = require('axios')
const FormData = require('form-data')
const fetch = require('node-fetch')

const pluginConfig = {
    name: 'editimage',
    alias: ['editimg', 'imgedit'],
    category: 'ai',
    description: 'Edit gambar dengan AI menggunakan prompt',
    usage: '.editimage <prompt>',
    example: '.editimage make it anime style',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 1,
    isEnabled: true
}

// ── Uploaders (same chain as tourl.js, no catbox/telegra) ──────────────────

const termaiKey = 'ISI_API_KEY_KAMU'
const termaiDomain = 'https://c.termai.cc'

async function uploadToTermai(buffer) {
    const form = new FormData()
    form.append('file', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' })
    const res = await fetch(`${termaiDomain}/api/upload?key=${termaiKey}`, {
        method: 'POST', body: form, headers: form.getHeaders(), timeout: 30000
    })
    if (!res.ok) throw new Error('Termai gagal')
    const data = await res.json()
    if (!data?.status || !data?.path) throw new Error('Termai invalid response')
    return data.path
}

async function uploadToGofile(buffer) {
    const serverRes = await fetch('https://api.gofile.io/servers', { timeout: 10000 })
    const serverData = await serverRes.json()
    const server = serverData?.data?.servers?.[0]?.name
    if (!server) throw new Error('Gofile server gagal')

    const form = new FormData()
    form.append('file', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' })
    const res = await fetch(`https://${server}.gofile.io/uploadFile`, {
        method: 'POST', body: form, headers: form.getHeaders(), timeout: 60000
    })
    if (!res.ok) throw new Error('Gofile gagal')
    const data = await res.json()
    // Gofile returns page URL, not direct — not suitable for image API
    // Try to get direct link
    if (data?.data?.directLink) return data.data.directLink
    throw new Error('Gofile tidak punya direct link')
}

async function uploadToYpnk(buffer) {
    const form = new FormData()
    form.append('files', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' })
    const res = await fetch('https://cdn.ypnk.biz.id/upload', {
        method: 'POST',
        body: form,
        headers: { ...form.getHeaders(), 'User-Agent': 'Mozilla/5.0' },
        timeout: 30000
    })
    if (!res.ok) throw new Error('YPNK gagal')
    const data = await res.json()
    if (!data?.success || !data?.files?.[0]?.url) throw new Error('YPNK invalid response')
    return `https://cdn.ypnk.biz.id${data.files[0].url}`
}

async function uploadToQuax(buffer) {
    const form = new FormData()
    form.append('files[]', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' })
    const res = await fetch('https://qu.ax/upload.php', {
        method: 'POST', body: form, headers: form.getHeaders(), timeout: 30000
    })
    if (!res.ok) throw new Error('Qu.ax gagal')
    const data = await res.json()
    if (!data?.success || !data?.files?.[0]?.url) throw new Error('Qu.ax invalid response')
    return data.files[0].url
}

async function uploadToTmpFiles(buffer) {
    const form = new FormData()
    form.append('file', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' })
    const res = await fetch('https://tmpfiles.org/api/v1/upload', {
        method: 'POST', body: form, headers: form.getHeaders(), timeout: 30000
    })
    if (!res.ok) throw new Error('TmpFiles gagal')
    const data = await res.json()
    if (!data?.data?.url) throw new Error('TmpFiles invalid response')
    const url = data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
    return url
}

// Coba uploader satu-satu, return URL pertama yang berhasil
async function uploadImage(buffer) {
    const uploaders = [
        { name: 'Termai',   fn: () => uploadToTermai(buffer) },
        { name: 'YPNK',     fn: () => uploadToYpnk(buffer) },
        { name: 'Qu.ax',    fn: () => uploadToQuax(buffer) },
        { name: 'TmpFiles', fn: () => uploadToTmpFiles(buffer) },
        { name: 'Gofile',   fn: () => uploadToGofile(buffer) },
    ]

    for (const u of uploaders) {
        try {
            const url = await u.fn()
            console.log(`[editimage] Upload OK via ${u.name}: ${url}`)
            return url
        } catch (e) {
            console.log(`[editimage] Upload gagal via ${u.name}:`, e.message)
        }
    }

    throw new Error('Semua uploader gagal — tidak ada host yang bisa dijangkau')
}

// ── Handler ─────────────────────────────────────────────────────────────────

async function handler(m, { sock }) {
    let prompt = m.args.join(' ').trim()

    if (!prompt) {
        return m.reply(
            `✨ *ᴇᴅɪᴛ ɪᴍᴀɢᴇ* ✨\n\n` +
            `💕 Haii~ いつき〜なかの✨ bisa bantu edit gambarmu dengan AI lho!\n\n` +
            `> Kasih tahu いつき〜なかの✨ mau diapain gambarnya~\n\n` +
            `\`Contoh: ${m.prefix}editimage make it anime style\`\n\n` +
            `> Reply atau kirim gambar dengan caption ya! いつき〜なかの✨ tunggu~ 🌟`
        )
    }

    const isImage = m.isImage || (m.quoted && m.quoted.isImage)
    if (!isImage) {
        return m.reply(
            `✨ *ᴇᴅɪᴛ ɪᴍᴀɢᴇ* ✨\n\n` +
            `💔 Ehh~ いつき〜なかの✨ tidak lihat gambarnya nih!\n` +
            `> Reply atau kirim gambar dengan caption ya~ いつき〜なかの✨ tunggu! 💕`
        )
    }

    m.react('🕕')

    try {
        let mediaBuffer
        if (m.isImage && m.download) {
            mediaBuffer = await m.download()
        } else if (m.quoted && m.quoted.isImage && m.quoted.download) {
            mediaBuffer = await m.quoted.download()
        }

        if (!mediaBuffer || !Buffer.isBuffer(mediaBuffer) || mediaBuffer.length < 100) {
            m.react('❌')
            return m.reply(`💔 *Aduh~*\n\n> Gagal mengunduh gambarnya... Coba kirim ulang ya~ 💕`)
        }

        // Upload ke host yang accessible
        const imageUrl = await uploadImage(mediaBuffer)
        console.log('[editimage] PROMPT:', prompt)
        console.log('[editimage] IMAGE URL:', imageUrl)

        // Hit API edit foto
        const apiRes = await axios.get(
            `https://api-faa.my.id/faa/editfoto?url=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(prompt)}`,
            { responseType: 'arraybuffer', timeout: 120000 }
        )

        const contentType = apiRes.headers['content-type'] || ''
        if (!contentType.includes('image')) {
            const errText = Buffer.from(apiRes.data).toString('utf-8')
            console.log('[editimage] API response bukan gambar:', errText)
            throw new Error(`API tidak mengembalikan gambar: ${errText.slice(0, 200)}`)
        }

        const resultBuffer = Buffer.from(apiRes.data)
        if (resultBuffer.length < 100) throw new Error('Hasil edit gambar kosong atau rusak')

        await sock.sendMessage(
            m.chat,
            {
                image: resultBuffer,
                caption: `✨ *DONE!* ✨\n\n💕 Gambarnya sudah いつき〜なかの✨ edit~ Cantik kan? いつき〜なかの✨ bangga sama hasilnya! ⭐`
            },
            { quoted: m }
        )

        m.react('✅')

    } catch (error) {
        m.react('❌')
        const errMsg = error?.response?.status
            ? `Request failed with status code ${error.response.status}`
            : (error?.message || String(error))
        console.log('[editimage] ERROR:', errMsg)
        m.reply(
            `🍀 *Waduuhh~ Ada yang tidak beres nih!*\n\n` +
            `> ${errMsg}\n\n` +
            `💕 Jangan menyerah ya~ Coba lagi atau pakai \`${m.prefix}itsukibanana\` kalau masih error! いつき〜なかの✨ tetap support kamu! ✨`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}