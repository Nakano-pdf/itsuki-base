const axios = require('axios')
const { wrapper } = require('axios-cookiejar-support')
const { CookieJar } = require('tough-cookie')

const pluginConfig = {
    name: 'igstalk',
    alias: ['instagramstalk', 'stalking'],
    category: 'stalker',
    description: 'Stalk akun Instagram',
    usage: '.igstalk <username>',
    example: '.igstalk cristiano',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

const baseHeaders = {
    'host': 'insta-stories-viewer.com',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0',
    'accept': '*/*',
    'accept-language': 'en-US,en;q=0.9',
    'accept-encoding': 'gzip, deflate, br, zstd',
    'origin': 'https://insta-stories-viewer.com',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'te': 'trailers'
}

function shortNum(num) {
    if (!num) return '0'
    if (num >= 1_000_000_000)
        return (num / 1_000_000_000).toFixed(1).replace('.0', '') + ' miliar'
    if (num >= 1_000_000)
        return (num / 1_000_000).toFixed(1).replace('.0', '') + ' jt'
    if (num >= 1_000)
        return (num / 1_000).toFixed(1).replace('.0', '') + ' rb'
    return num.toString()
}

async function fetchIgProfile(username) {
    const jar = new CookieJar()
    const client = wrapper(axios.create({ jar, withCredentials: true }))
    const referer = `https://insta-stories-viewer.com/${username}/`
    const headers = { ...baseHeaders, referer }
    const t = () => `O${Date.now()}${Math.random().toString(36).substring(2, 7)}`

    await client.get(`https://insta-stories-viewer.com/${username}/`, {
        headers: {
            ...baseHeaders,
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'sec-fetch-dest': 'document',
            'sec-fetch-mode': 'navigate',
            'upgrade-insecure-requests': '1'
        }
    })

    const resConnect = await client.get('https://insta-stories-viewer.com/connect/', { headers })
    const token = resConnect.data.token

    const resPoll1 = await client.get(`https://insta-stories-viewer.com/socket.io/?EIO=4&transport=polling&t=${t()}`, { headers })
    const sidMatch = resPoll1.data.match(/"sid":"([^"]+)"/)
    if (!sidMatch) throw new Error('Gagal mendapatkan session id dari socket.io')
    const sid = sidMatch[1]

    await client.post(`https://insta-stories-viewer.com/socket.io/?EIO=4&transport=polling&t=${t()}&sid=${sid}`, '40', { headers: { ...headers, 'content-type': 'text/plain;charset=UTF-8' } })
    await client.get(`https://insta-stories-viewer.com/socket.io/?EIO=4&transport=polling&t=${t()}&sid=${sid}`, { headers })
    await client.get(`https://insta-stories-viewer.com/socket.io/?EIO=4&transport=polling&t=${t()}&sid=${sid}`, { headers })

    const date = Date.now()
    const payload = `42["search",{"username":"${username}","date":${date},"token":"${token}"}]`
    await client.post(`https://insta-stories-viewer.com/socket.io/?EIO=4&transport=polling&t=${t()}&sid=${sid}`, payload, { headers: { ...headers, 'content-type': 'text/plain;charset=UTF-8' } })

    const resPollFinal = await client.get(`https://insta-stories-viewer.com/socket.io/?EIO=4&transport=polling&t=${t()}&sid=${sid}`, { headers })
    const rawData = resPollFinal.data

    let userData = null
    if (typeof rawData === 'string' && rawData.startsWith('42')) {
        const parsed = JSON.parse(rawData.substring(2))
        if (Array.isArray(parsed) && parsed.length > 1) {
            userData = parsed[1]?.data?.user || null
        }
    }

    if (!userData) throw new Error('Data user tidak ditemukan')

    const getMeta = (html, regexStr) => {
        const match = html.match(new RegExp(regexStr))
        return match ? match[1].trim() : null
    }
    const htmlPage = (await client.get(`https://insta-stories-viewer.com/${username}/`, { headers })).data
    const avatarProxy = getMeta(htmlPage, '<img class="profile__avatar-pic" src="([^"]+)"')

    return { user: userData, avatarProxy }
}

async function handler(m, { sock }) {
    const username = m.args[0]?.replace('@', '')

    if (!username) {
        return m.reply(
            `📸 *ɪɴsᴛᴀɢʀᴀᴍ sᴛᴀʟᴋ*\n\n` +
            `> Masukkan username Instagram\n\n` +
            `\`Contoh: ${m.prefix}igstalk cristiano\``
        )
    }

    m.react('🔍')

    try {
        const { user, avatarProxy } = await fetchIgProfile(username)

        const caption = `📸 *ɪɴsᴛᴀɢʀᴀᴍ sᴛᴀʟᴋ*\n\n` +
            `👤 *Username:* ${user.username}\n` +
            `📛 *Nama:* ${user.full_name || '-'}\n` +
            `✅ *Verified:* ${user.is_verified ? 'Ya' : 'Tidak'}\n` +
            `🔒 *Private:* ${user.is_private ? 'Ya' : 'Tidak'}\n\n` +
            `👥 *Pengikut:* ${shortNum(user.edge_followed_by)}\n` +
            `👤 *Mengikuti:* ${shortNum(user.edge_follow)}\n` +
            `📷 *Postingan:* ${shortNum(user.edges_count)}\n\n` +
            `📝 *Bio:*\n${user.biography || '-'}\n\n` +
            `🔗 https://instagram.com/${user.username}`

        m.react('✅')

        if (avatarProxy) {
            await sock.sendMessage(m.chat, {
                image: { url: avatarProxy },
                caption
            }, { quoted: m })
        } else {
            await m.reply(caption)
        }

    } catch (error) {
        m.react('❌')
        m.reply(`❌ *Gomen ne~* ✦\n\n> ${error.message}\n\n_Ai udah coba yang terbaik tapi gagal juga... coba lagi nanti ya~ 🌸_`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}