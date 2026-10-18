const axios = require('axios')

const pluginConfig = {
    name: 'bypass',
    alias: ['bypassurl', 'bypasslink', 'unshorten'],
    category: 'tools',
    description: 'Bypass link shortener (ouo.io, dll)',
    usage: '.bypass <url>',
    example: '.bypass https://ouo.io/sdg2HV',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

const API_URL = 'https://vamxapi.my.id/api/v1/tools/bypass'
const API_KEY = 'ISI_API_KEY_KAMU'

function isValidUrl(str) {
    try {
        const u = new URL(str)
        return u.protocol === 'http:' || u.protocol === 'https:'
    } catch { return false }
}

// Fungsi untuk mengekstrak URL hasil bypass dari berbagai kemungkinan struktur JSON
function extractBypassedUrl(json) {
    if (!json) return null
    if (typeof json === 'string') return json

    const paths = [
        'data.url', 'data.result', 'data.bypassed_url', 'data.final_url',
        'result.url', 'result', 'url', 'bypassed_url', 'final_url', 'link'
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
        if (typeof current === 'string' && isValidUrl(current)) {
            return current
        }
    }
    return null
}

async function handler(m, { sock }) {
    const targetUrl = (m.args[0] || '').trim()

    // Validasi input
    if (!targetUrl) {
        m.react('❌')
        return m.reply(
            `╭┈┈⬡「 🔗 *ʙʏᴘᴀss ʟɪɴᴋ* 」\n` +
            `┃\n` +
            `┃ *Format salah!*\n` +
            `┃\n` +
            `┃ 📌 Cara pakai:\n` +
            `┃ \`${m.prefix}${pluginConfig.name} <url>\`\n` +
            `┃\n` +
            `┃ 📝 Contoh:\n` +
            `┃ \`${m.prefix}${pluginConfig.name} https://ouo.io/sdg2HV\`\n` +
            `┃\n` +
            `╰┈┈⬡\n\n` +
            `> 💡 Support: ouo.io, adf.ly, dll.`
        )
    }

    if (!isValidUrl(targetUrl)) {
        m.react('❌')
        return m.reply(
            `❌ *ʙʏᴘᴀss ʟɪɴᴋ*\n\n` +
            `> URL tidak valid: \`${targetUrl}\`\n` +
            `> Pastikan link diawali \`http://\` atau \`https://\``
        )
    }

    m.react('🕕')

    try {
        // Request POST sesuai cURL
        const res = await axios.post(API_URL, {
            url: targetUrl,
            turnstileToken: ""
        }, {
            headers: {
                'x-api-key': API_KEY,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 45000, // 45 detik timeout
            validateStatus: () => true
        })

        const data = res.data || {}

        // === CASE 1: HTTP Error ===
        if (res.status < 200 || res.status >= 300) {
            m.react('❌')
            const detail = data.message || data.error || JSON.stringify(data)
            return m.reply(
                `❌ *ʙʏᴘᴀss ʟɪɴᴋ*\n\n` +
                `> Status : \`${res.status}\`\n` +
                `> Pesan  : ${String(detail).slice(0, 300)}\n\n` +
                `> _Link mungkin tidak didukung atau API sedang down._`
            )
        }

        // === CASE 2: API return status false ===
        if (data.status === false || data.success === false) {
            m.react('❌')
            return m.reply(
                `❌ *ʙʏᴘᴀss ʟɪɴᴋ*\n\n` +
                `> ${data.message || data.error || 'Gagal bypass link'}\n\n` +
                `> 💡 Pastikan link shortener-nya benar.`
            )
        }

        // === CASE 3: Ekstrak URL hasil bypass ===
        const bypassedUrl = extractBypassedUrl(data)

        if (bypassedUrl) {
            m.react('✅')
            
            const caption =
                `✅ *ʙʏᴘᴀss ʙᴇʀʜᴀsɪʟ*\n\n` +
                `╭┈┈⬡「 🔗 *ᴅᴇᴛᴀɪʟ ʟɪɴᴋ* 」\n` +
                `┃ 📥 Asal   : \`${targetUrl}\`\n` +
                `┃ 🎯 Tujuan : \`${bypassedUrl.length > 50 ? bypassedUrl.slice(0, 50) + '...' : bypassedUrl}\`\n` +
                `╰┈┈⬡\n\n` +
                `> Klik tombol di bawah untuk membuka link tujuan.`

            const templateButtons = [
                { index: 1, urlButton: { displayText: '🌐 Buka Link Tujuan', url: bypassedUrl } }
            ]

            try {
                await sock.sendMessage(m.chat, {
                    text: caption,
                    footer: 'VamX Bypass Tool',
                    templateButtons
                }, { quoted: m })
            } catch {
                // Fallback jika tombol gagal
                await m.reply(caption + `\n\n🎯 *Link Tujuan:*\n${bypassedUrl}`)
            }
        } else {
            // === CASE 4: Sukses tapi URL tidak terdeteksi otomatis ===
            m.react('✅')
            const pretty = JSON.stringify(data, null, 2)
            return m.reply(
                `✅ *ʙʏᴘᴀss ʟɪɴᴋ*\n\n` +
                `> Respons API:\n\n\`\`\`json\n${pretty.slice(0, 3500)}\n\`\`\``
            )
        }

    } catch (e) {
        m.react('❌')

        let errMsg = e.message || 'Unknown error'
        if (e.code === 'ECONNABORTED' || /timeout/i.test(errMsg)) {
            errMsg = 'Request timeout (>45 detik). Server sedang sibuk atau link terlalu rumit.'
        } else if (e.code === 'ENOTFOUND') {
            errMsg = 'Domain tidak ditemukan — cek koneksi internet'
        } else if (e.response?.data) {
            const d = e.response.data
            errMsg = typeof d === 'object'
                ? (d.message || d.error || JSON.stringify(d))
                : String(d)
        }

        return m.reply(
            `❌ *ʙʏᴘᴀss ʟɪɴᴋ*\n\n` +
            `> Gagal memproses link\n` +
            `> \`${String(errMsg).slice(0, 300)}\``
        )
    }
}

module.exports = { config: pluginConfig, handler }