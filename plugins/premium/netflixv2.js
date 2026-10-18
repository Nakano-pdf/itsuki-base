const axios = require('axios')

const pluginConfig = {
    name: 'netflixv2',
    alias: ['nftoken', 'netflixtoken', 'getnftoken'],
    category: 'premium',
    description: 'Generate Token Netflix dari Cookie via VamX API',
    usage: '.netflixv2 <cookie>',
    example: '.netflixv2 NetflixId=xxx; SecureNetflixId=yyy;',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 0,
    isEnabled: true
}

const API_URL = 'https://vamxapi.my.id/api/v1/tools/netflix-token'
const API_KEY = 'ISI_API_KEY_KAMU'

// Fungsi untuk mengekstrak token dari berbagai kemungkinan struktur JSON
function extractToken(json) {
    if (!json) return null
    if (typeof json === 'string') return json

    const paths = [
        'data.token', 'data.nftoken', 'data.netflix_token', 'data.access_token',
        'result.token', 'result.nftoken', 'result.access_token',
        'token', 'nftoken', 'netflix_token', 'access_token'
    ]

    for (const path of paths) {
        const keys = path.split('.')
        let current = json
        for (const key of keys) {
            if (current && current[key] !== undefined) {
                current = current[key]
            } else {
                current = null
                break
            }
        }
        if (typeof current === 'string' && current.length > 10) {
            return current
        }
    }
    return null
}

async function handler(m, { sock }) {
    // Ekstrak cookie dari argumen ATAU dari pesan yang di-reply
    let cookie = m.args.join(' ').trim()
    
    if (!cookie && m.quoted) {
        cookie = (m.quoted.text || m.quoted.body || '').trim()
    }

    // Validasi input
    if (!cookie) {
        m.react('❌')
        return m.reply(
            `╭┈┈⬡「 🎟️ *ɴᴇᴛꜰʟɪx ᴛᴏᴋᴇɴ* 」\n` +
            `┃\n` +
            `┃ *Format salah!*\n` +
            `┃\n` +
            `┃ 📌 Cara pakai:\n` +
            `┃ 1️⃣ Ketik langsung:\n` +
            `┃ \`${m.prefix}netflixv2 <cookie>\`\n` +
            `┃\n` +
            `┃ 2️⃣ Atau reply pesan cookie:\n` +
            `┃ Ketik \`${m.prefix}netflixv2\`\n` +
            `┃\n` +
            `╰┈┈⬡\n\n` +
            `> 💡 Contoh cookie: \`NetflixId=xxx; SecureNetflixId=yyy;\``
        )
    }

    // Validasi panjang minimal cookie
    if (cookie.length < 50) {
        m.react('❌')
        return m.reply(
            `❌ *ɴᴇᴛꜰʟɪx ᴛᴏᴋᴇɴ*\n\n` +
            `> Cookie terlalu pendek.\n` +
            `> Pastikan formatnya benar (minimal 50 karakter).`
        )
    }

    m.react('🕕')

    try {
        // Request POST sesuai cURL
        const res = await axios.post(API_URL, {
            cookie: cookie
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
                `❌ *ɴᴇᴛꜰʟɪx ᴛᴏᴋᴇɴ*\n\n` +
                `> Status : \`${res.status}\`\n` +
                `> Pesan  : ${String(detail).slice(0, 300)}\n\n` +
                `> _Cookie mungkin sudah expired atau API sedang down._`
            )
        }

        // === CASE 2: API return status false ===
        if (data.status === false || data.success === false) {
            m.react('❌')
            return m.reply(
                `❌ *ɴᴇᴛꜰʟɪx ᴛᴏᴋᴇɴ*\n\n` +
                `> ${data.message || data.error || 'Gagal generate token'}\n\n` +
                `> 💡 Pastikan cookie masih valid dan belum expired.`
            )
        }

        // === CASE 3: Ekstrak Token ===
        const token = extractToken(data)

        if (token) {
            m.react('✅')

            const caption =
                `✅ *ɴᴇᴛꜰʟɪx ᴛᴏᴋᴇɴ ʙᴇʀʜᴀsɪʟ*\n\n` +
                `╭┈┈⬡「 🎟️ *ᴅᴇᴛᴀɪʟ ᴛᴏᴋᴇɴ* 」\n` +
                `┃ 🔑 Token :\n` +
                `┃ \`\`\`${token}\`\`\`\n` +
                `╰┈┈⬡\n\n` +
                `╭┈┈⬡「 📌 *ɪɴꜰᴏ* 」\n` +
                `┃ 💡 Tap & Hold token di atas\n` +
                `┃ untuk menyalin (copy).\n` +
                `┃ ⏱️ Token biasanya expired\n` +
                `┃ dalam beberapa jam.\n` +
                `╰┈┈⬡\n\n` +
                `> Gunakan token ini untuk akses API Netflix.`

            // Button interaktif
            const templateButtons = [
                { index: 1, urlButton: { displayText: '🔍 Cek Token di FastDecode', url: 'https://fastdecode.vercel.app' } },
                { index: 2, quickReplyButton: { displayText: '🔄 Generate Ulang', id: `${m.prefix}netflixv2 ${cookie}` } }
            ]

            try {
                await sock.sendMessage(m.chat, {
                    text: caption,
                    footer: 'VamX Netflix Token API',
                    templateButtons
                }, { quoted: m })
            } catch {
                // Fallback jika button gagal
                await m.reply(caption)
            }

        } else {
            // === CASE 4: Sukses tapi Token tidak terdeteksi otomatis ===
            m.react('✅')
            const pretty = JSON.stringify(data, null, 2)
            return m.reply(
                `✅ *ɴᴇᴛꜰʟɪx ᴛᴏᴋᴇɴ*\n\n` +
                `> Respons API (Raw):\n\n\`\`\`json\n${pretty.slice(0, 3500)}\n\`\`\``
            )
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
            errMsg = typeof d === 'object'
                ? (d.message || d.error || JSON.stringify(d))
                : String(d)
        }

        return m.reply(
            `❌ *ɴᴇᴛꜰʟɪx ᴛᴏᴋᴇɴ*\n\n` +
            `> Gagal memproses token\n` +
            `> \`${String(errMsg).slice(0, 300)}\``
        )
    }
}

module.exports = { config: pluginConfig, handler }