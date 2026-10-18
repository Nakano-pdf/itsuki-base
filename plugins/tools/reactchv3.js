const axios = require('axios')

const pluginConfig = {
    name: 'reactchv3',
    alias: ['reactchv3', 'reactchannelv3', 'chreactv3'],
    category: 'tools',
    description: 'Kirim reaksi ke postingan WhatsApp Channel via VamX',
    usage: '.reactchv3 <url_channel> <emoji> [jumlah]',
    example: '.reactchv3 https://whatsapp.com/channel/0029VaXXXXX/123 👍,🔥 50',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 0,
    isEnabled: true
}

const API_URL = 'https://vamxapi.my.id/api/v1/tools/reactch'
const API_KEY = 'ISI_API_KEY_KAMU'

function isValidChannelUrl(url) {
    if (!url) return false
    // Validasi link channel WhatsApp
    const regex = /^https:\/\/(www\.)?whatsapp\.com\/channel\/[a-zA-Z0-9]+\/[a-zA-Z0-9]+/i
    return regex.test(url)
}

async function handler(m, { sock }) {
    const args = m.args || []
    
    // 1. Ambil URL
    const channelUrl = (args[0] || '').trim()
    if (!channelUrl) {
        m.react('❌')
        return m.reply(
            `╭┈┈⬡「 🎭 *ʀᴇᴀᴄᴛ ᴄʜᴀɴɴᴇʟ* 」\n` +
            `┃\n` +
            `┃ *Format salah!*\n` +
            `┃\n` +
            `┃ 📌 Cara pakai:\n` +
            `┃ \`${m.prefix}${pluginConfig.name} <url> <emoji> [jumlah]\`\n` +
            `┃\n` +
            `┃ 📝 Contoh:\n` +
            `┃ \`${m.prefix}${pluginConfig.name} https://whatsapp.com/channel/... 👍 50\`\n` +
            `┃\n` +
            `╰┈┈⬡\n\n` +
            `> 💡 Jumlah (opsional) untuk spam reaksi.`
        )
    }

    if (!isValidChannelUrl(channelUrl)) {
        m.react('❌')
        return m.reply(
            `❌ *ʀᴇᴀᴄᴛ ᴄʜᴀɴɴᴇʟ*\n\n` +
            `> URL tidak valid.\n` +
            `> Pastikan link berbentuk:\n` +
            `> \`https://whatsapp.com/channel/ID/IDPOST\``
        )
    }

    // 2. Parsing Emoji & Jumlah (Count)
    let count = 1
    let emojiArgs = args.slice(1)

    // Cek jika argumen terakhir adalah angka (jumlah reaksi)
    if (emojiArgs.length > 1 && /^\d+$/.test(emojiArgs[emojiArgs.length - 1])) {
        count = parseInt(emojiArgs.pop())
        if (count <= 0) count = 1
        if (count > 500) count = 500 // Batasi maksimal 500 biar API ga error
    }

    // Gabungkan sisa argumen sebagai emoji
    let reactionsStr = emojiArgs.join(' ').trim()

    if (!reactionsStr) {
        m.react('❌')
        return m.reply(`❌ *ʀᴇᴀᴄᴛ ᴄʜᴀɴɴᴇʟ*\n\n> Emoji tidak boleh kosong!`)
    }

    // Jika user pakai spasi (👍 🔥), ubah jadi koma (👍,🔥)
    if (!reactionsStr.includes(',')) {
        reactionsStr = reactionsStr.replace(/\s+/g, ',')
    }

    m.react('🕕')

    try {
        // 3. Request POST ke API VamX
        // Kita sertakan 'count' dan 'amount' untuk berjaga-jaga jika API mendukung parameter jumlah
        const res = await axios.post(API_URL, {
            url: channelUrl,
            reaction: reactionsStr,
            count: count,
            amount: count
        }, {
            headers: {
                'x-api-key': API_KEY,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 45000,
            validateStatus: () => true
        })

        const data = res.data || {}

        // === CASE 1: HTTP Error ===
        if (res.status < 200 || res.status >= 300) {
            m.react('❌')
            const detail = data.message || data.error || JSON.stringify(data)
            return m.reply(
                `❌ *ʀᴇᴀᴄᴛ ᴄʜᴀɴɴᴇʟ*\n\n` +
                `> Status : \`${res.status}\`\n` +
                `> Pesan  : ${String(detail).slice(0, 300)}\n\n` +
                `> _Pastikan link benar & reaksi didukung._`
            )
        }

        // === CASE 2: API return status false ===
        if (data.status === false || data.success === false) {
            m.react('❌')
            return m.reply(
                `❌ *ʀᴇᴀᴄᴛ ᴄʜᴀɴɴᴇʟ*\n\n` +
                `> ${data.message || data.error || 'Gagal mengirim reaksi'}`
            )
        }

        // === CASE 3: Sukses ===
        m.react('✅')

        const successMsg = data.message || data.msg || 'Reaksi berhasil dikirim!'

        const caption =
            `✅ *ʀᴇᴀᴄᴛ ʙᴇʀʜᴀsɪʟ*\n\n` +
            `╭┈┈⬡「 📊 *ᴅᴇᴛᴀɪʟ ʀᴇᴀᴋsɪ* 」\n` +
            `┃ 🎯 Channel  : \`${channelUrl.length > 30 ? channelUrl.slice(0, 30) + '...' : channelUrl}\`\n` +
            `┃ 🎭 Emoji    : \`${reactionsStr}\`\n` +
            `┃ 🔢 Jumlah   : \`${count}x\`\n` +
            `┃ 📝 Status   : ✅ ${successMsg}\n` +
            `╰┈┈⬡\n\n` +
            `> Cek channel kamu untuk melihat reaksinya!`

        // Full Button
        const templateButtons = [
            { index: 1, urlButton: { displayText: '🔗 Buka Postingan', url: channelUrl } },
            { index: 2, quickReplyButton: { displayText: '🔄 Kirim Ulang', id: `${m.prefix}${pluginConfig.name} ${channelUrl} ${reactionsStr} ${count}` } }
        ]

        try {
            await sock.sendMessage(m.chat, {
                text: caption,
                footer: 'VamX React Channel API',
                templateButtons
            }, { quoted: m })
        } catch {
            await m.reply(caption)
        }

    } catch (e) {
        m.react('❌')

        let errMsg = e.message || 'Unknown error'
        if (e.code === 'ECONNABORTED' || /timeout/i.test(errMsg)) {
            errMsg = 'Request timeout (>45 detik). Server sedang sibuk.'
        } else if (e.code === 'ENOTFOUND') {
            errMsg = 'Domain tidak ditemukan — cek koneksi internet'
        } else if (e.response?.data) {
            const d = e.response.data
            errMsg = typeof d === 'object' ? (d.message || d.error || JSON.stringify(d)) : String(d)
        }

        return m.reply(
            `❌ *ʀᴇᴀᴄᴛ ᴄʜᴀɴɴᴇʟ*\n\n` +
            `> Gagal memproses\n` +
            `> \`${String(errMsg).slice(0, 300)}\``
        )
    }
}

module.exports = { config: pluginConfig, handler }