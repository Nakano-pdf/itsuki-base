const axios = require('axios')
const config = require('../../config')
const { reelsvideo } = require('../../src/scraper/reelsvideo')
const { saveig } = require('../../src/scraper/saveig')
const { snapinsta } = require('../../src/scraper/snapinsta')

const pluginConfig = {
    name: 'instagramdl',
    alias: ['igdl', 'ig', 'instagram'],
    category: 'download',
    description: 'Download video/foto Instagram',
    usage: '.instagramdl <url>',
    example: '.instagramdl https://www.instagram.com/reel/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

const IG_REGEX = /instagram\.com\/(p|reel|reels|stories|tv)\//i
const UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36'

async function sendMediaGroup(sock, chat, m, items, mediaKey, ctxInfo) {
    if (!items.length) return

    if (items.length === 1) {
        // Kirim tunggal, jangan pakai albumMessage kalau cuma 1 item
        await sock.sendMessage(m.chat, {
            [mediaKey]: { url: items[0] },
            contextInfo: ctxInfo
        }, { quoted: m })
        return
    }

    await sock.sendMessage(chat, {
        albumMessage: items.map(url => ({ [mediaKey]: { url } })),
        contextInfo: ctxInfo
    }, { quoted: m })
}

// saveig/snapinsta cuma ngasih link mentah tanpa breakdown video/foto,
// jadi klasifikasiin lewat cek beberapa byte awal (magic bytes) + content-type.
// Pakai Range header biar nggak perlu download full file cuma buat ngecek tipe.
// Referer wajib disertain karena banyak downloader proteksi hotlink.
async function classifySaveigLinks(links) {
    const videos = []
    const images = []

    await Promise.all(links.map(async (url) => {
        try {
            const res = await axios.get(url, {
                timeout: 15000,
                validateStatus: () => true,
                responseType: 'arraybuffer',
                headers: {
                    'referer': 'https://snapinsta.top/',
                    'range': 'bytes=0-2048',
                    'user-agent': UA
                }
            })

            const buf = Buffer.from(res.data)
            const ct = String(res.headers['content-type'] || '')

            // Cek by content-type dulu (paling akurat kalau ada)
            if (ct.startsWith('video/')) { videos.push(url); return }
            if (ct.startsWith('image/')) { images.push(url); return }

            // Content-type nggak jelas -> cek magic bytes langsung dari buffer
            const isMp4 = buf.length >= 8 && buf.slice(4, 8).toString('ascii') === 'ftyp'
            const isJpg = buf.length >= 2 && buf[0] === 0xFF && buf[1] === 0xD8
            const isPng = buf.length >= 2 && buf[0] === 0x89 && buf[1] === 0x50
            const isWebp = buf.length >= 12 && buf.slice(8, 12).toString('ascii') === 'WEBP'

            if (isMp4) videos.push(url)
            else if (isJpg || isPng || isWebp) images.push(url)
            else {
                // Beneran nggak jelas -> skip, jangan asal masuk video biar nggak ngirim file corrupt
                console.error('[classifySaveigLinks] tipe nggak dikenali, size:', buf.length, 'url:', url)
            }
        } catch (err) {
            console.error('[classifySaveigLinks] gagal cek:', url, err.message)
        }
    }))

    let type = 'unknown'
    if (videos.length && images.length) type = 'carousel'
    else if (videos.length) type = 'video'
    else if (images.length) type = 'photo'

    return { type, videos, images }
}

// Coba reelsvideo dulu (lebih lengkap: username, thumb, mp3).
// Kalau gagal, fallback ke saveig.
// Kalau saveig juga gagal (post private/dibatasi/format HTML server berubah), fallback ke snapinsta.
async function fetchMedia(url) {
    const cleanUrl = url.split('?')[0]

    let primaryErr = null
    let secondaryErr = null
    let tertiaryErr = null

    try {
        const result = await reelsvideo(cleanUrl)
        if (result.type !== 'unknown' && (result.videos.length || result.images.length)) {
            return { source: 'reelsvideo', ...result }
        }
        throw new Error('reelsvideo: hasil kosong/unknown')
    } catch (err) {
        primaryErr = err
    }

    try {
        const saveigResult = await saveig(cleanUrl)
        if (!saveigResult.result.length) throw new Error('saveig: hasil kosong')

        const classified = await classifySaveigLinks(saveigResult.result)
        if (classified.type === 'unknown') throw new Error('saveig: gagal klasifikasi media')

        return { source: 'saveig', ...classified }
    } catch (err) {
        secondaryErr = err
    }

    try {
        const snapResult = await snapinsta(cleanUrl)
        if (!snapResult.result.length) throw new Error('snapinsta: hasil kosong')

        const classified = await classifySaveigLinks(snapResult.result)
        if (classified.type === 'unknown') throw new Error('snapinsta: gagal klasifikasi media')

        return { source: 'snapinsta', ...classified }
    } catch (err) {
        tertiaryErr = err
    }

    console.error('[instagramdl] reelsvideo gagal:', primaryErr?.message)
    console.error('[instagramdl] saveig gagal:', secondaryErr?.message)
    console.error('[instagramdl] snapinsta gagal:', tertiaryErr?.message)

    const isRateLimit = primaryErr?.isRateLimit ||
        /making requests too fast/i.test(primaryErr?.message || '') ||
        /429/.test(primaryErr?.message || '')

    const combinedErr = new Error(
        `Semua sumber gagal.\n• reelsvideo: ${primaryErr?.message}\n• saveig: ${secondaryErr?.message}\n• snapinsta: ${tertiaryErr?.message}`
    )
    combinedErr.isRateLimit = isRateLimit
    throw combinedErr
}

async function handler(m, { sock }) {
    const url = m.text?.trim()

    if (!url) {
        return m.reply(
            `📸 *ɪɴsᴛᴀɢʀᴀᴍ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n` +
            `> \`${m.prefix}igdl <url>\`\n\n` +
            `*ᴄᴏɴᴛᴏʜ:*\n` +
            `> \`${m.prefix}igdl https://www.instagram.com/reel/xxx\`\n` +
            `> \`${m.prefix}igdl https://www.instagram.com/p/xxx\``
        )
    }

    if (!IG_REGEX.test(url)) {
        return m.reply(`❌ *Ehh~* URL tidak valid. Gunakan link Instagram (reel/post/story)~ 🥺`)
    }

    await m.react('🕕')

    try {
        const result = await fetchMedia(url)

        if (result.type === 'unknown' || (!result.videos.length && !result.images.length)) {
            await m.react('❌')
            return m.reply(`❌ *Gomen ne~* Gagal mengambil media. Coba link lain~ 🥺`)
        }

        const ctxInfo = {
            forwardingScore: 99,
            isForwarded: true
        }

        if (result.type === 'video') {
            await sendMediaGroup(sock, m.chat, m, result.videos, 'video', ctxInfo)
        } else if (result.type === 'photo') {
            await sendMediaGroup(sock, m.chat, m, result.images, 'image', ctxInfo)
        } else {
            // carousel: kirim video dulu (kalau ada), baru foto (kalau ada)
            if (result.videos.length) {
                await sendMediaGroup(sock, m.chat, m, result.videos, 'video', ctxInfo)
            }
            if (result.images.length) {
                await sendMediaGroup(sock, m.chat, m, result.images, 'image', ctxInfo)
            }
        }

        await m.react('✅')
    } catch (err) {
        await m.react('❌')

        // Pesan khusus kalau kena rate limit dari server reelsvideo
        if (err.isRateLimit || /making requests too fast/i.test(err.message || '') || /429/.test(err.message || '')) {
            return m.reply(
                `❌ *sᴇʀᴠᴇʀ sᴇᴅᴀɴɢ sɪʙᴜᴋ*\n\n` +
                `Terlalu banyak request ke server downloader. Coba lagi dalam ~15-20 detik.`
            )
        }

        return m.reply(`❌ *ɢᴀɢᴀʟ ᴍᴇɴɢᴜɴᴅᴜʜ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}