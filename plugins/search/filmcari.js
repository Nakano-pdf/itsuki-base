/**
✧ Name    : filmcari
✧ Alias   : cari film, moviecari
✧ Category: search
✧ Deskripsi: Cari film dan tampilkan 5 hasil teratas (API vamx).
**/

const axios = require('axios')
const { getApi } = require('../../src/lib/fixkit/store')
const { buildRichCardHtml, sendRichCard } = require('../../src/lib/richCard')

const pluginConfig = {
    name: 'filmcari',
    alias: ['cari film', 'moviecari'],
    category: 'search',
    description: 'Cari film dan tampilkan 5 hasil teratas',
    usage: '.filmcari <judul film>',
    example: '.filmcari Spider-Man',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 8,
    energi: 1,
    isEnabled: true
}

const API_URL = 'https://vamxapi.my.id/api/v1/movie/search'
const MAX_RESULTS = 5
const MAX_QUERY = 80

// Key diambil dari database/fixkit/apis.json (nama "vamx"), env sebagai cadangan
const getApiKey = () => getApi('vamx')?.apiKey || process.env.VAMX_APIKEY || ''

// Ambil daftar film dari bentuk response yang mungkin berbeda
function extractMovies(data) {
    const list = Array.isArray(data) ? data
        : Array.isArray(data?.results) ? data.results
        : Array.isArray(data?.data) ? data.data
        : Array.isArray(data?.data?.results) ? data.data.results
        : Array.isArray(data?.items) ? data.items
        : []
    return list.slice(0, MAX_RESULTS).map(item => {
        const date = item.release_date || item.year || item.first_air_date || ''
        const rating = item.vote_average ?? item.rating ?? ''
        return {
            title: String(item.title || item.name || item.original_title || 'Tanpa judul').slice(0, 60),
            year: String(date).slice(0, 4) || '-',
            rating: rating !== '' && rating !== null ? Number(rating).toFixed(1) : '-'
        }
    })
}

async function handler(m, { sock }) {
    const prefix = m.prefix || '.'
    const query = (m.text || '').trim().slice(0, MAX_QUERY)
    if (!query) {
        return m.reply(`🎬 *ꜰɪʟᴍ ᴄᴀʀɪ*\n\n> ${prefix}filmcari <judul film>\n\n*ᴄᴏɴᴛᴏʜ:*\n> ${prefix}filmcari Spider-Man`)
    }
    const apiKey = getApiKey()
    if (!apiKey) {
        return m.reply('❌ API key vamx belum diatur. Tambahkan dengan .addapi (nama: vamx).')
    }

    try {
        await m.react('🎬')
        const res = await axios.get(API_URL, {
            params: { query, page: 1 },
            headers: { 'x-api-key': apiKey, 'User-Agent': 'Mozilla/5.0' },
            timeout: 20000,
            validateStatus: () => true
        })
        if (res.status >= 400) {
            await m.react('❌')
            const reason = res.data?.message || res.data?.error || `HTTP ${res.status}`
            return m.reply(`❌ API gagal: ${reason}`)
        }

        const movies = extractMovies(res.data)
        if (!movies.length) {
            await m.react('⚠️')
            return m.reply(`⚠️ Film *${query}* tidak ditemukan.`)
        }

        const html = buildRichCardHtml({
            title: '🎬 ' + query,
            subtitle: movies.length + ' hasil teratas',
            accent: '#c0392b',
            stats: movies.map((f, i) => ({ label: (i + 1) + '. ' + f.title, value: f.year + ' • ⭐ ' + f.rating })),
            buttons: [{ label: '🔁 Cari film lain', copy: prefix + 'filmcari ' }]
        })
        await sendRichCard(sock, m, { title: '🎬 HASIL FILM', footer: 'Data dari layanan pihak ketiga', html })
        return m.react('✅')
    } catch (e) {
        console.error('[filmcari] Error:', e)
        await m.react('❌')
        return m.reply('❌ Gagal mencari film: ' + (e?.message || e))
    }
}

module.exports = { config: pluginConfig, handler }