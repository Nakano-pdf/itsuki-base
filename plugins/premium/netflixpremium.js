const axios = require('axios')

const pluginConfig = {
    name: 'netflixpremium',
    alias: ['npremium', 'netflixprem', 'getnetflix'],
    category: 'premium',
    description: 'Ambil akun Netflix premium dari Theresav API',
    usage: '.netflixpremium',
    example: '.netflixpremium',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

const API_URL = 'https://api.theresav.eu/api/premium/netflix'
const API_KEY = 'AOgoh'

function formatResult(data) {
    // Respons bisa berupa string, array, atau object
    if (data == null) return '> _(respons kosong)_'

    // Kalau string, tampilkan langsung
    if (typeof data === 'string') return data

    // Kalau array, gabungkan
    if (Array.isArray(data)) {
        return data.map((item, i) => formatSingle(item, i + 1)).join('\n\n')
    }

    // Kalau object, cek apakah ada field wrapper umum
    const wrapperKeys = ['result', 'results', 'data', 'accounts', 'account', 'akun']
    for (const key of wrapperKeys) {
        if (data[key] != null) {
            const inner = data[key]
            if (Array.isArray(inner)) {
                return inner.map((item, i) => formatSingle(item, i + 1)).join('\n\n')
            }
            return formatSingle(inner)
        }
    }

    return formatSingle(data)
}

function formatSingle(item, index = null) {
    if (item == null) return '> _(null)_'
    if (typeof item === 'string') {
        return index ? `*#${index}* — \`${item}\`` : `\`${item}\``
    }

    const lines = []
    const header = index ? `╭┈┈⬡「 📦 *ᴀᴋᴜɴ #${index}* 」` : `╭┈┈⬡「 📦 *ᴀᴋᴜɴ* 」`
    lines.push(header)

    // Field-field umum
    const fieldMap = {
        email:        '📧 Email',
        mail:         '📧 Email',
        username:     '👤 Username',
        user:         '👤 Username',
        password:     '🔑 Password',
        pass:         '🔑 Password',
        plan:         '💎 Plan',
        package:      '💎 Package',
        type:         '🏷️ Tipe',
        status:       '📊 Status',
        expiry:       '⏳ Expired',
        expired:      '⏳ Expired',
        expires:      '⏳ Expired',
        expire:       '⏳ Expired',
        duration:     '⏱️ Durasi',
        profile:      '👥 Profile',
        profiles:     '👥 Profile',
        cookie:       '🍪 Cookie',
        token:        '🎟️ Token',
        country:      '🌏 Country',
        region:       '🌏 Region',
    }

    const usedKeys = new Set()
    for (const [key, label] of Object.entries(fieldMap)) {
        if (item[key] != null && !usedKeys.has(key)) {
            usedKeys.add(key)
            lines.push(`┃ ${label.padEnd(12)}: \`${item[key]}\``)
        }
    }

    // Field lain yang belum ditampilkan
    for (const [key, val] of Object.entries(item)) {
        if (usedKeys.has(key)) continue
        if (val == null) continue
        if (typeof val === 'object') {
            lines.push(`┃ ${key}: \`${JSON.stringify(val)}\``)
        } else {
            lines.push(`┃ ${key}: \`${val}\``)
        }
    }

    lines.push('╰┈┈⬡')
    return lines.join('\n')
}

async function handler(m, { sock }) {
    m.react('🕕')

    try {
        const res = await axios.get(API_URL, {
            headers: {
                'x-apikey': API_KEY,
                'Accept': 'application/json'
            },
            timeout: 30000,
            validateStatus: () => true // kita handle manual
        })

        // Cek HTTP status
        if (res.status < 200 || res.status >= 300) {
            m.react('❌')
            const detail = typeof res.data === 'object'
                ? JSON.stringify(res.data)
                : String(res.data || '')
            return m.reply(
                `❌ *ɴᴇᴛꜰʟɪx ᴘʀᴇᴍɪᴜᴍ*\n\n` +
                `> HTTP ${res.status}\n` +
                `> \`${detail.slice(0, 300)}\``
            )
        }

        const data = res.data

        // Kalau server kasih flag error di body
        if (data && typeof data === 'object' && data.status === false) {
            m.react('❌')
            return m.reply(
                `❌ *ɴᴇᴛꜰʟɪx ᴘʀᴇᴍɪᴜᴍ*\n\n` +
                `> ${data.message || data.msg || 'API mengembalikan status false'}`
            )
        }

        const body = formatResult(data)

        m.react('✅')
        return m.reply(
            `✅ *ɴᴇᴛꜰʟɪx ᴘʀᴇᴍɪᴜᴍ*\n\n` +
            body + '\n\n' +
            `> Sumber: \`api.theresav.eu\``
        )

    } catch (e) {
        m.react('❌')

        let errMsg = e.message || 'Unknown error'
        if (e.code === 'ECONNABORTED' || /timeout/i.test(errMsg)) {
            errMsg = 'Request timeout (>30 detik)'
        } else if (e.code === 'ENOTFOUND') {
            errMsg = 'Domain tidak ditemukan — cek koneksi internet'
        } else if (e.response?.data) {
            errMsg = typeof e.response.data === 'object'
                ? JSON.stringify(e.response.data)
                : String(e.response.data)
        }

        return m.reply(
            `❌ *ɴᴇᴛꜰʟɪx ᴘʀᴇᴍɪᴜᴍ*\n\n` +
            `> Gagal mengambil data\n` +
            `> \`${errMsg.slice(0, 300)}\``
        )
    }
}

module.exports = { config: pluginConfig, handler }