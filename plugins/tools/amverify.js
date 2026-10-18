const axios = require('axios')

const pluginConfig = {
    name: 'amverify',
    alias: ['alightmotionverify', 'am-verify', 'verifyam'],
    category: 'premium',
    description: 'Verifikasi link Alight Motion Premium',
    usage: '.amverify <email> <link> [orderid]',
    example: '.amverify mbaak@gmail.com https://alight-creative.firebaseapp.com/... 60',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 0,
    isEnabled: true
}

const API_URL = 'https://api.theresav.eu/api/premium/alightmotion/verify'
const API_KEY = 'AOgoh'

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidUrl(str) {
    try {
        const u = new URL(str)
        return u.protocol === 'http:' || u.protocol === 'https:'
    } catch { return false }
}

async function handler(m, { sock }) {
    const args = m.args || []
    const email = (args[0] || '').trim().toLowerCase()
    const link  = (args[1] || '').trim()
    const orderid = (args[2] || '').trim() || '60'

    // Validasi input
    if (!email || !link) {
        m.react('❌')
        return m.reply(
            `╭┈┈⬡「 🔐 *ᴀᴍᴠᴇʀɪꜰʏ* 」\n` +
            `┃\n` +
            `┃ *Format salah!*\n` +
            `┃\n` +
            `┃ 📌 Cara pakai:\n` +
            `┃ \`${m.prefix}amverify <email> <link> [orderid]\`\n` +
            `┃\n` +
            `┃ 📝 Contoh:\n` +
            `┃ \`${m.prefix}amverify kamu@gmail.com https://alight-creative.firebaseapp.com/... 60\`\n` +
            `┃\n` +
            `┃ 💡 Tips:\n` +
            `┃ Link diambil dari email verifikasi\n` +
            `┃ yang dikirim oleh \`${m.prefix}amprem\`\n` +
            `┃\n` +
            `╰┈┈⬡`
        )
    }

    if (!isValidEmail(email)) {
        m.react('❌')
        return m.reply(`❌ *ᴀᴍᴠᴇʀɪꜰʏ*\n\n> Email tidak valid: \`${email}\``)
    }

    if (!isValidUrl(link)) {
        m.react('❌')
        return m.reply(
            `❌ *ᴀᴍᴠᴇʀɪꜰʏ*\n\n` +
            `> Link tidak valid\n` +
            `> Pastikan link diawali \`http://\` atau \`https://\``
        )
    }

    m.react('🕕')

    try {
        const res = await axios.get(API_URL, {
            params: { email, link, orderid },
            headers: {
                'x-apikey': API_KEY,
                'Accept': 'application/json'
            },
            timeout: 45000,
            validateStatus: () => true
        })

        const data = res.data || {}

        // HTTP error
        if (res.status < 200 || res.status >= 300) {
            m.react('❌')
            const detail = data.error || data.message || data.msg || JSON.stringify(data)
            return m.reply(
                `❌ *ᴀᴍᴠᴇʀɪꜰʏ*\n\n` +
                `> Status : \`${res.status}\`\n` +
                `> Pesan  : ${String(detail).slice(0, 300)}\n\n` +
                `> _Link mungkin sudah kadaluarsa atau sudah dipakai._`
            )
        }

        // Status false di body
        if (data.status === false) {
            m.react('❌')
            return m.reply(
                `❌ *ᴀᴍᴠᴇʀɪꜰʏ*\n\n` +
                `> ${data.error || data.message || data.msg || 'Verifikasi gagal'}\n\n` +
                `> 💡 Coba:\n` +
                `> • Pastikan link belum expired\n` +
                `> • Minta link baru via \`${m.prefix}amprem ${email}\``
            )
        }

        m.react('✅')

        // Ekstrak data sukses
        const successMsg = data.message || data.msg || 'Verifikasi berhasil'
        const plan      = data.plan || data.package || data.type || 'Premium'
        const expiry    = data.expired || data.expiry || data.expire || data.expires || '-'
        const username  = data.username || data.user || data.email || email

        const caption =
            `🎉 *ᴠᴇʀɪꜰɪᴋᴀsɪ ʙᴇʀʜᴀsɪʟ*\n\n` +
            `╭┈┈⬡「 ✅ *ᴅᴇᴛᴀɪʟ ᴀᴋᴜɴ* 」\n` +
            `┃ 📧 Email    : \`${username}\`\n` +
            `┃ 💎 Plan     : \`${plan}\`\n` +
            `┃ ⏳ Expired  : \`${expiry}\`\n` +
            `┃ 🆔 Order ID : \`${orderid}\`\n` +
            `┃ 📊 Status   : ✅ ${successMsg}\n` +
            `╰┈┈⬡\n\n` +
            `╭┈┈⬡「 📱 *ʟᴀɴɢᴋᴀʜ sᴇʟᴀɴᴊᴜᴛɴʏᴀ* 」\n` +
            `┃ 1️⃣ Download Alight Motion\n` +
            `┃ 2️⃣ Login pakai email di atas\n` +
            `┃ 3️⃣ Nikmati fitur premium ✨\n` +
            `╰┈┈⬡\n\n` +
            `> 🎬 Selamat berkarya!`

        const templateButtons = [
            { index: 1, urlButton: { displayText: '📥 Download Alight Motion', url: 'https://alightcreative.com/download' } },
            { index: 2, quickReplyButton: { displayText: '🔄 Cek Status', id: `${m.prefix}amverify ${email} ${link} ${orderid}` } },
            { index: 3, quickReplyButton: { displayText: '➕ Kirim ke Email Lain', id: `${m.prefix}amprem ` } }
        ]

        try {
            await sock.sendMessage(m.chat, {
                text: caption,
                footer: 'Alight Motion Premium • Theresav API',
                templateButtons,
                viewOnce: true
            }, { quoted: m })
        } catch {
            await m.reply(caption)
        }

    } catch (e) {
        m.react('❌')

        let errMsg = e.message || 'Unknown error'
        if (e.code === 'ECONNABORTED' || /timeout/i.test(errMsg)) {
            errMsg = 'Request timeout (>45 detik)'
        } else if (e.code === 'ENOTFOUND') {
            errMsg = 'Domain tidak ditemukan'
        } else if (e.response?.data) {
            const d = e.response.data
            errMsg = typeof d === 'object'
                ? (d.error || d.message || JSON.stringify(d))
                : String(d)
        }

        return m.reply(
            `❌ *ᴀᴍᴠᴇʀɪꜰʏ*\n\n` +
            `> Gagal verifikasi\n` +
            `> \`${String(errMsg).slice(0, 300)}\``
        )
    }
}

module.exports = { config: pluginConfig, handler }