const axios = require('axios')

const pluginConfig = {
    name: 'amprem',
    alias: ['alightmotionprem', 'ampremium', 'am-prem', 'getam'],
    category: 'premium',
    description: 'Kirim link verifikasi Alight Motion Premium ke email',
    usage: '.amprem <email>',
    example: '.amprem mbaak@gmail.com',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 0,
    isEnabled: true
}

const API_URL = 'https://api.theresav.eu/api/premium/alightmotion/send'
const API_KEY = 'AOgoh'

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function handler(m, { sock }) {
    const email = (m.args[0] || '').trim().toLowerCase()

    // Validasi email
    if (!email) {
        m.react('❌')
        return m.reply(
            `╭┈┈⬡「 🎬 *ᴀʟɪɢʜᴛ ᴍᴏᴛɪᴏɴ* 」\n` +
            `┃\n` +
            `┃ *Format salah!*\n` +
            `┃\n` +
            `┃ 📌 Cara pakai:\n` +
            `┃ \`${m.prefix}amprem <email>\`\n` +
            `┃\n` +
            `┃ 📝 Contoh:\n` +
            `┃ \`${m.prefix}amprem kamu@gmail.com\`\n` +
            `┃\n` +
            `╰┈┈⬡\n\n` +
            `> Link verifikasi akan dikirim ke email kamu`
        )
    }

    if (!isValidEmail(email)) {
        m.react('❌')
        return m.reply(
            `❌ *ᴀᴍᴘʀᴇᴍ*\n\n` +
            `> Email tidak valid: \`${email}\`\n` +
            `> Pastikan formatnya benar ya~`
        )
    }

    m.react('🕕')

    try {
        const res = await axios.get(API_URL, {
            params: { email },
            headers: {
                'x-apikey': API_KEY,
                'Accept': 'application/json'
            },
            timeout: 30000,
            validateStatus: () => true
        })

        const data = res.data || {}

        // Handle HTTP error
        if (res.status < 200 || res.status >= 300) {
            m.react('❌')
            const detail = data.error || data.message || data.msg || JSON.stringify(data)
            return m.reply(
                `❌ *ᴀᴍᴘʀᴇᴍ*\n\n` +
                `> Status : \`${res.status}\`\n` +
                `> Pesan  : ${String(detail).slice(0, 300)}\n\n` +
                `> _Coba lagi nanti._`
            )
        }

        // Handle status false di body
        if (data.status === false) {
            m.react('❌')
            return m.reply(
                `❌ *ᴀᴍᴘʀᴇᴍ*\n\n` +
                `> ${data.error || data.message || data.msg || 'API gagal memproses'}`
            )
        }

        m.react('✅')

        const successMsg = data.message || data.msg || 'Link verifikasi berhasil dikirim'
        const orderId = data.orderid || data.orderId || data.order_id || '-'

        // Simpan orderid kalau ada, di cache user
        if (orderId && orderId !== '-') {
            global.amOrderCache = global.amOrderCache || {}
            global.amOrderCache[m.sender] = { email, orderId, time: Date.now() }
        }

        // Full button reply
        const buttons = [
            {
                buttonId: `${m.prefix}amverify ${email}`,
                buttonText: { displayText: '🔐 Verifikasi Sekarang' },
                type: 1
            },
            {
                buttonId: 'action::saluransendiri',
                buttonText: { displayText: '📧 Cek Email' },
                type: 1
            }
        ]

        const templateButtons = [
            { index: 1, urlButton: { displayText: '📖 Cara Verifikasi', url: 'https://alightcreative.com' } },
            { index: 2, quickReplyButton: { displayText: '🔐 Verifikasi Sekarang', id: `${m.prefix}amverify ${email}` } },
            { index: 3, quickReplyButton: { displayText: '📧 Cek Inbox Email', id: 'action::bukaemail' } }
        ]

        const caption =
            `✅ *ᴀʟɪɢʜᴛ ᴍᴏᴛɪᴏɴ ᴘʀᴇᴍɪᴜᴍ*\n\n` +
            `╭┈┈⬡「 📧 *ᴅᴇᴛᴀɪʟ ᴘᴇɴɢɪʀɪᴍᴀɴ* 」\n` +
            `┃ 📮 Email   : \`${email}\`\n` +
            `┃ 🆔 Order ID: \`${orderId}\`\n` +
            `┃ 📊 Status  : ✅ ${successMsg}\n` +
            `╰┈┈⬡\n\n` +
            `╭┈┈⬡「 📋 *ʟᴀɴɢᴋᴀʜ sᴇʟᴀɴᴊᴜᴛɴʏᴀ* 」\n` +
            `┃ 1️⃣ Buka inbox email kamu\n` +
            `┃ 2️⃣ Cari email dari Alight Creative\n` +
            `┃ 3️⃣ Copy link verifikasi di email\n` +
            `┃ 4️⃣ Kembali ke chat & kirim:\n` +
            `┃    \`${m.prefix}amverify ${email} <link>\`\n` +
            `╰┈┈⬡\n\n` +
            `> ⏱️ Link berlaku terbatas, segera verifikasi!`

        try {
            await sock.sendMessage(m.chat, {
                text: caption,
                footer: 'Alight Motion Premium • Theresav API',
                templateButtons,
                viewOnce: true
            }, { quoted: m })
        } catch (err) {
            // Fallback kalau button tidak didukung
            await m.reply(caption)
        }

    } catch (e) {
        m.react('❌')

        let errMsg = e.message || 'Unknown error'
        if (e.code === 'ECONNABORTED' || /timeout/i.test(errMsg)) {
            errMsg = 'Request timeout (>30 detik)'
        } else if (e.code === 'ENOTFOUND') {
            errMsg = 'Domain tidak ditemukan'
        } else if (e.response?.data) {
            const d = e.response.data
            errMsg = typeof d === 'object'
                ? (d.error || d.message || JSON.stringify(d))
                : String(d)
        }

        return m.reply(
            `❌ *ᴀᴍᴘʀᴇᴍ*\n\n` +
            `> Gagal mengirim link\n` +
            `> \`${String(errMsg).slice(0, 300)}\``
        )
    }
}

module.exports = { config: pluginConfig, handler }