/**
 * Fixkit UI — membuat pesan dengan tombol (button) untuk setiap plugin/fitur.
 *
 * Jenis tombol:
 *   { type: 'reply', text, id }      → quick reply, saat ditekan mengirim `id` sebagai pesan (mis. ".fixkit")
 *   { type: 'copy',  text, code }    → cta_copy, saat ditekan menyalin `code` ke clipboard
 *   { type: 'url',   text, url }     → cta_url, buka link
 *   { type: 'file',  text, fileName, code }
 *                                    → quick reply dengan id khusus; handler `.kirimfile` yang mengirim dokumen
 */
const config = require('../../../config')
const { generateWAMessageFromContent, proto } = require('itsuki')

const COPY_MAX = 900 // batas aman untuk isi tombol salin

function brandFooter() {
    const name = config.bot?.name || 'Itsuki Nakano'
    const ver = config.bot?.version || ''
    return `© ${name} ${ver ? 'v' + ver : ''}`.trim()
}

function ownerJid() {
    const num = (config.owner?.number?.[0] || '').replace(/[^0-9]/g, '')
    return num ? `${num}@s.whatsapp.net` : null
}

/** Bentuk satu tombol native flow dari deskripsi sederhana. */
function toNativeButton(b) {
    if (b.type === 'copy') {
        const code = String(b.code ?? '')
        return {
            name: 'cta_copy',
            buttonParamsJson: JSON.stringify({
                display_text: b.text,
                id: b.id || 'copy',
                copy_code: code.slice(0, COPY_MAX),
            }),
        }
    }
    if (b.type === 'url') {
        return {
            name: 'cta_url',
            buttonParamsJson: JSON.stringify({ display_text: b.text, url: b.url, merchant_url: b.url }),
        }
    }
    // reply & file: keduanya quick_reply; id dibaca handler sebagai teks perintah
    return {
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({ display_text: b.text, id: b.id || '.fixkit' }),
    }
}

/** Kirim panel interaktif. Kalau gagal, fallback ke teks biasa + daftar tombol. */
async function sendPanel(sock, jid, { title, body, footer, buttons = [], quoted, senderJid }) {
    const plain = () => {
        const lines = buttons.map(b => {
            if (b.type === 'url') return `• ${b.text}: ${b.url}`
            if (b.type === 'copy') return `• ${b.text} (ketik: ${b.id || '.salin'})`
            return `• ${b.text} → ${b.id || '.fixkit'}`
        })
        const text = [title ? `*${title}*` : '', body, '', ...lines, '', footer || brandFooter()]
            .filter(Boolean).join('\n')
        return sock.sendMessage(jid, { text }, { quoted })
    }

    try {
        const interactive = proto.Message.InteractiveMessage.fromObject({
            header: proto.Message.InteractiveMessage.Header.fromObject({
                title: title || '',
                hasMediaAttachment: false,
            }),
            body: proto.Message.InteractiveMessage.Body.fromObject({ text: body || '' }),
            footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: footer || brandFooter() }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                buttons: buttons.map(toNativeButton),
            }),
        })

        const msg = generateWAMessageFromContent(
            jid,
            {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                        interactiveMessage: interactive,
                    },
                },
            },
            { userJid: senderJid || ownerJid() || jid, quoted }
        )
        await sock.relayMessage(jid, msg.message, { messageId: msg.key.id })
        return msg
    } catch (e) {
        console.error('[fixkit/ui] panel gagal, fallback teks:', e.message)
        return plain()
    }
}

/** Kirim isi kode sebagai file dokumen (.js / .txt / .json). */
async function sendCodeFile(sock, jid, fileName, code, { quoted, mimetype } = {}) {
    const ext = (fileName.split('.').pop() || '').toLowerCase()
    const mime = mimetype || (ext === 'json' ? 'application/json' : ext === 'txt' ? 'text/plain' : 'application/javascript')
    return sock.sendMessage(
        jid,
        { document: Buffer.from(String(code), 'utf-8'), mimetype: mime, fileName },
        { quoted }
    )
}

/** Tombol standar untuk satu plugin: salin, kirim file, ulangi, dan info. */
function pluginButtons({ name, code, fileName }) {
    const buttons = []
    if (code && code.length <= COPY_MAX) buttons.push({ type: 'copy', text: '📋 Salin Kode', id: `.salinplugin ${name}` })
    buttons.push({ type: 'reply', text: '📁 Kirim File', id: `.kirimplugin ${name}` })
    buttons.push({ type: 'reply', text: '🧪 Cek Lint', id: `.fixpl2 ${name}` })
    buttons.push({ type: 'reply', text: '🧩 Cek Dependensi', id: `.fixpl3 ${name}` })
    buttons.push({ type: 'reply', text: '🏠 Menu Fixkit', id: '.fixkit' })
    return buttons
}

/**
 * richReply — dipakai plugin yang sudah di-richify (addairich).
 * Mengirim teks sebagai panel interaktif dengan tombol; jika gagal kembali ke m.reply biasa.
 */
async function richReply(m, text, opts = {}) {
    const cmd = (m.command || 'menu').toString()
    const body = String(text ?? "")
    rememberBody(m.chat, body)
    const buttons = opts.buttons || [
        ...(body.length <= COPY_MAX ? [{ type: 'copy', text: '📋 Salin', id: '.salin', code: body }] : []),
        { type: 'reply', text: '🔄 Ulangi', id: m.prefix ? `${m.prefix}${cmd}` : `.${cmd}` },
        { type: 'reply', text: '📁 Kirim .txt', id: `.kirimfile ${cmd}` },
    ]
    try {
        const sock = m.sock || m._sock || require("./repair").getSock()
        if (!sock) return m.reply(body)
        return await sendPanel(sock, m.chat, {
            title: opts.title || '',
            body,
            footer: opts.footer,
            buttons,
            quoted: m,
            senderJid: m.sender,
        })
    } catch {
        return m.reply(body)
    }
}

// ─── simpan isi balasan rich terakhir per chat (untuk tombol "Kirim .txt") ───
const lastBodies = new Map()
function rememberBody(chat, body) {
    lastBodies.set(chat, body)
    if (lastBodies.size > 200) lastBodies.delete(lastBodies.keys().next().value)
}
function getLastBody(chat) {
    return lastBodies.get(chat) || null
}

module.exports = {
    rememberBody,
    getLastBody,
    brandFooter,
    ownerJid,
    sendPanel,
    sendCodeFile,
    pluginButtons,
    richReply,
    COPY_MAX,
}
