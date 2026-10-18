/**
 * Itsuki dipanggil tanpa prefix: lewat nama, tag, atau reply ke bot.
 * Menangani: konfirmasi perintah, konteks grup, media, balasan kartu, dan menjalankan plugin pilihan AI.
 * Mengembalikan true kalau pesan sudah ditangani (handler berhenti di sini).
 */
const itsukiAI = require('./itsukiAI')

function bare(jid = '') {
    return String(jid).split('@')[0].split(':')[0].replace(/\D/g, '')
}

/** Ambil gambar/dokumen dari pesan atau dari pesan yang di-reply. */
async function getMedia(m) {
    try {
        const q = m.quoted
        const qMsg = q?.message || {}
        if (qMsg.imageMessage || qMsg.documentMessage) {
            const key = qMsg.imageMessage ? 'imageMessage' : 'documentMessage'
            const buf = await q.download()
            return buf ? { buf, mime: qMsg[key]?.mimetype } : null
        }
        const dMsg = m.message || {}
        if ((dMsg.imageMessage || dMsg.documentMessage) && typeof m.download === 'function') {
            const key = dMsg.imageMessage ? 'imageMessage' : 'documentMessage'
            const buf = await m.download()
            return buf ? { buf, mime: dMsg[key]?.mimetype } : null
        }
    } catch (e) {
        console.log('[ITSUKI] gagal ambil media:', e?.message || e)
    }
    return null
}

/** Kirim balasan AI sebagai extended text: thumbnail + judul + link (seperti link preview). */
async function sendAiReply(m, sock, text, isOwner, rich) {
    const cfg = require('../../config')
    const thumb = cfg.assets?.images?.itsukimenu
    const link = cfg.info?.website || thumb
    if (!sock || !thumb) return m.reply(text)
    try {
        return await sock.sendMessage(
            m.chat,
            {
                text,
                contextInfo: {
                    externalAdReply: {
                        title: 'Itsuki Nakano AI',
                        body: rich && isOwner ? 'Pacar' : 'Assistant',
                        thumbnailUrl: thumb,
                        sourceUrl: link,
                        mediaType: 1,
                        renderLargerThumbnail: true,
                        showAdAttribution: false
                    }
                }
            },
            { quoted: m }
        )
    } catch (e) {
        console.log('[ITSUKI] gagal kirim extended text, fallback teks:', e?.message || e)
        return m.reply(text)
    }
}

async function handle(m, sock) {
    if (!m || m.fromMe || m.isCommand) return false
    const ctrl = itsukiAI.getControl()
    if (!ctrl.enabled) return false

    const text = String(m.text || m.body || m.caption || '').trim()

    // Jawaban "ya"/"tidak" untuk perintah yang menunggu konfirmasi
    const confirmed = await itsukiAI.takeConfirm(m, sock)
    if (confirmed !== null) {
        if (confirmed) await m.reply(confirmed)
        return true
    }

    if (m.isGroup && ctrl.group && text) {
        itsukiAI.pushGroup(m.chat, m.pushName || 'User', text)
    }

    if (!ctrl.listen) return false
    if (m.isGroup && !ctrl.group) return false
    if (!text || /^[./#!]/.test(text)) return false

    // Aturan: Itsuki hanya menjawab kalau pesan DIAWALI kata "itsuki" / "nakano".
    // Tag atau reply ke pesan bot saja tidak cukup.
    const body = text.replace(/^(\s*@\d+)+/, '').trim()
    const startsWithName = /^(itsuki|nakano)\b/i.test(body)
    if (!startsWithName) return false

    // Buang kata panggilan di awal supaya AI menerima isi pesannya saja
    const clean = body
        .replace(/^(itsuki|nakano)\b[\s,:!.\-]*/i, '')
        .replace(/@\d+/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    const isOwner = Boolean(m.isOwner)

    if (!itsukiAI.allow(m.sender, isOwner)) {
        await m.reply('Batas pemakaian harian kamu sudah habis ya Kak. Besok kita lanjut lagi 🌸')
        return true
    }

    try {
        let mediaText = ''
        const media = await getMedia(m)
        if (media) {
            try { mediaText = await itsukiAI.analyzeMedia(media.buf, media.mime, clean || 'Jelaskan isi media ini.') }
            catch (e) { mediaText = '' }
        }

        const out = await itsukiAI.chat({
            chatId: itsukiAI.chatKey(m), text: clean || 'halo', isOwner,
            senderName: m.pushName || 'User', isGroup: m.isGroup, m, mediaText,
        })

        if (out.reply) {
            await sendAiReply(m, sock, out.reply, isOwner, ctrl.rich)
        }

        if (out.command) {
            const plugin = itsukiAI.findPlugin(out.command)
            if (!plugin) return true
            if (!itsukiAI.canRun(plugin.config, m)) {
                await m.reply(itsukiAI.denyReason(plugin.config))
                return true
            }
            if (isOwner) {
                await itsukiAI.runPlugin(plugin, m, sock, out.query)
            } else {
                itsukiAI.setPending(m.sender, { plugin, query: out.query, chatId: itsukiAI.chatKey(m) })
                await m.reply(
                    `Itsuki akan menjalankan *${out.command}*${out.query ? ` dengan "${out.query}"` : ''}.\n` +
                    'Balas *ya* dalam 60 detik untuk lanjut, atau *tidak* untuk batal.'
                )
            }
        }
    } catch (err) {
        await m.reply(`Maaf Kak, Itsuki belum bisa menjawab sekarang.\n> ${err.message}`)
    }
    return true
}

module.exports = { handle }
