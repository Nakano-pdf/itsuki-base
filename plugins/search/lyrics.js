const axios = require('axios')
const config = require('../../config')
const cheerio = require('cheerio')

const GENIUS_URL = 'https://genius.com'

const AI = { warn: (...a) => console.error('[lirik]', ...a) }

async function searchGenius(query) {
    const url = `${GENIUS_URL}/api/search/song?q=${encodeURIComponent(query)}`
    const res = await axios.get(url, {
        timeout: 15000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json'
        }
    })

    const hits = res.data?.response?.sections?.[0]?.hits || []
    return hits
        .filter(h => h.result?.url)
        .map(h => ({
            judul: h.result?.title || null,
            artis: h.result?.artist_names || null,
            url: h.result?.url
        }))
}

async function scrapeGeniusLyrics(url) {
    const res = await axios.get(url, {
        timeout: 20000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
        },
        validateStatus: status => status < 500
    })

    const $ = cheerio.load(res.data)

    const ogTitle = $('meta[property="og:title"]').attr('content') || ''
    const titleMatch = ogTitle.match(/–\s*(.+)/)
    const artistMatch = ogTitle.match(/^(.+?)(?:\s*–|$)/)

    let judul = titleMatch ? titleMatch[1].trim() : $('h1').first().text().trim()
    let artis = artistMatch ? artistMatch[1].trim() : ''
    judul = judul.replace(/lyrics/i, '').trim()
    artis = artis.replace(/lyrics/i, '').trim()

    const containers = [
        "div[data-lyrics-container='true']",
        'div.lyrics',
        "div[class*='Lyrics__Container']"
    ]

    let parts = []
    for (const sel of containers) {
        $(sel).each((_, el) => {
            const text = ($(el).html() || '')
                .replace(/<br\s*\/?>/g, '\n')
                .replace(/<[^>]+>/g, '')
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&#x27;/g, "'")
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .trim()
            if (text) parts.push(text)
        })
        if (parts.length > 0) break
    }

    const lirik = parts
        .join('\n\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()

    return {
        judul,
        artis,
        lirik: lirik || null
    }
}

async function getLyrics(query) {
    const hasil = await searchGenius(query)
    if (!hasil.length) {
        throw new Error('Lagu tidak ditemukan di Genius')
    }

    const target = hasil[0]
    const data = await scrapeGeniusLyrics(target.url)

    if (!data.lirik) {
        throw new Error('Lirik kosong / tidak ketemu di halaman Genius')
    }

    return {
        judul: data.judul || target.judul || query,
        artis: data.artis || target.artis || '-',
        lirik: data.lirik,
        url: target.url
    }
}

const pluginConfig = {
    name: 'lyrics',
    alias: ['lyric', 'lirik', 'liriklagu'],
    category: 'search',
    description: 'Cari lirik lagu',
    usage: '.lirik <query>',
    example: '.lirik Somewhere only we know',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const query = m.text?.trim()

    if (!query) {
        return m.reply(
            `╭┈┈⬡「 ʟɪʀɪᴋ ʟᴀɢᴜ 」\n` +
            `│ Masukkan kata kunci pencarian\n` +
            `│\n` +
            `│ Contoh: \`${m.prefix}lirik Somewhere only we know\`\n` +
            `╰┈┈⬡`
        )
    }

    await m.react('🔍')

    try {
        const hasil = await getLyrics(query)

        let teks = `╭┈┈⬡「 🎶 ʟɪʀɪᴋ ʟᴀɢᴜ 」\n`
        teks += `│ *${hasil.judul}*\n`
        teks += `│ ${hasil.artis}\n`
        teks += `╰┈┈⬡\n\n`
        teks += `${hasil.lirik}\n\n`
        teks += `> sumber: ${hasil.url}`

        await m.reply(teks)
        await m.react('💖')
    } catch (error) {
        AI.warn(error)
        await m.react('❌')
        await m.reply(
            `╭┈┈⬡「 ❌ ᴇʀʀᴏʀ 」\n` +
            `│ いつき〜なかの✨ gagal nemuin liriknya~ 🌸\n` +
            `│ ${error.message}\n` +
            `╰┈┈⬡`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}