// gak bisa di gabungin ama fake location + dokumen cik (yang ilang fake location nya) 
const config = require('../../config')
const { f } = require('../../src/lib/undici')

const pluginConfig = {
    name: 'ytmp3',
    alias: ['youtubemp3', 'ytaudio'],
    category: 'download',
    description: 'Download audio YouTube',
    usage: '.ytmp3 <url>',
    example: '.ytmp3 https://youtube.com/watch?v=xxx',
    cooldown: 20,
    energi: 2,
    isEnabled: true
}

async function handler(m, { sock }) {
    const url = m.text?.trim()
    if (!url) return m.reply(`Contoh: ${m.prefix}ytmp3 https://youtube.com/watch?v=xxx`)
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) return m.reply('❌ *Ehh~* URL harus YouTube~ 🥺')

    m.react('🕕')

    let audioUrl, title, thumbnail, duration

    try {
        // Primary API
        const { result } = await f(`https://api.nexray.web.id/downloader/ytmp3?url=${encodeURIComponent(url)}`)
        if (!result?.url) throw new Error('No URL from primary API')
        audioUrl = result.url
        title = result?.title || 'audio.mp3'
        thumbnail = result?.thumbnail || null
        duration = result?.duration || null
    } catch (err) {
        console.warn('[YTMP3] Primary API gagal, fallback...', err.message)
        try {
            // Fallback API
            const { result } = await f(`https://api-faa.my.id/faa/ytmp3?url=${encodeURIComponent(url)}`)
            if (!result?.mp3) throw new Error('No URL from fallback API')
            audioUrl = result.mp3
            title = result?.title || 'audio.mp3'
            thumbnail = result?.thumbnail || null
            duration = result?.duration || null
        } catch (err2) {
            console.error('[YTMP3] Fallback API juga gagal', err2.message)
            m.react('❌')
            return m.reply('❌ *Gomen ne~* Semua API gagal, coba lagi nanti~ 🥺')
        }
    }

    try {
        const caption = [
            `🎵 *${title}*`,
            duration ? `⏱️ Durasi: ${duration}` : '',
            `\n> Pilih format download di bawah ya~`
        ].filter(Boolean).join('\n')

        await sock.sendMessage(
            m.chat,
            {
                interactiveMessage: {
                    title: caption,
                    footer: config.bot?.name || 'Bot',
                    document: Buffer.alloc(0),
                    mimetype: 'application/pdf',
                    fileName: title,
                    fileLength: 0,
                    contextInfo: {
                        isForwarded: true,
                        forwardingScore: 7,
                        ...(config.saluran?.id && {
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: config.saluran.id,
                                newsletterName: config.saluran.name || config.bot?.name,
                            }
                        })
                    },
                    ...(thumbnail && {
                        header: {
                            hasMediaAttachment: true,
                            locationMessage: {
                                degreesLatitude: 0,
                                degreesLongitude: 0,
                                name: title,
                                address: duration || 'YouTube Audio',
                                jpegThumbnail: await (async () => {
                                    try {
                                        const { default: axios } = await import('axios')
                                        const res = await axios.get(thumbnail, { responseType: 'arraybuffer' })
                                        return Buffer.from(res.data)
                                    } catch { return undefined }
                                })()
                            }
                        }
                    }),
                    buttons: [
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: '🎵 Audio MP3',
                                id: `__audio__${audioUrl}__${title}`
                            })
                        },
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: '📄 File Dokumen',
                                id: `__doc__${audioUrl}__${title}`
                            })
                        }
                    ]
                }
            },
            { quoted: m }
        )

        // Simpan session untuk handle reply button
        if (!global.ytmp3Sessions) global.ytmp3Sessions = new Map()
        global.ytmp3Sessions.set(m.id, { audioUrl, title })

        m.react('✅')

    } catch (error) {
        console.error('[YTMP3]', error)
        m.react('❌')
        m.reply('❌ *Gomen ne~* Gagal mengirim pilihan download~ 🥺')
    }
}

async function handleReply(m, { sock }) {
    const body = m.body || ''

    if (body.startsWith('__audio__') || body.startsWith('__doc__')) {
        const isDoc = body.startsWith('__doc__')
        const parts = body.replace(/^__(audio|doc)__/, '').split('__')
        const audioUrl = parts[0]
        const title = parts.slice(1).join('__') || 'audio.mp3'

        if (!audioUrl?.startsWith('http')) return false

        m.react('🕕')
        try {
            if (isDoc) {
                // Kirim sebagai dokumen/file
                await sock.sendMessage(
                    m.chat,
                    {
                        document: { url: audioUrl },
                        mimetype: 'audio/mpeg',
                        fileName: title.endsWith('.mp3') ? title : `${title}.mp3`,
                    },
                    { quoted: m }
                )
            } else {
                // Kirim sebagai audio biasa
                await sock.sendMedia(m.chat, audioUrl, null, m, {
                    type: 'audio',
                    mimetype: 'audio/mpeg',
                    ptt: false,
                    fileName: title,
                })
            }
            m.react('✅')
        } catch (err) {
            console.error('[YTMP3 Reply]', err)
            m.react('❌')
            m.reply('❌ *Gomen ne~* Gagal mengirim file~ 🥺')
        }
        return true
    }

    return false
}

module.exports = {
    config: pluginConfig,
    handler,
    handleReply
}