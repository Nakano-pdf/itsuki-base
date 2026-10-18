/**
✧ Name    : filmsesi
✧ Alias   : daftarepisode, seasonfilm
✧ Category: search
✧ Deskripsi: Daftar episode satu season serial (nomor, judul, tanggal tayang saja).
              Tidak menampilkan tautan tonton atau unduh.
**/

const axios = require('axios')
const { getApi } = require('../../src/lib/fixkit/store')
const { buildRichCardHtml, sendRichCard } = require('../../src/lib/richCard')

const pluginConfig = {
    name: 'filmsesi',
    alias: ['daftarepisode', 'seasonfilm'],
    category: 'search',
    description: 'Daftar episode satu season serial (tanpa tautan tonton)',
    usage: '.filmsesi <id> <season>',
    example: '.filmsesi 1399 1',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 8,
    energi: 1,
    isEnabled: true
}

const API_URL = 'https://vamxapi.my.id/api/v1/movie/season'
const MAX_EPISODES = 12

// Key diambil dari database/fixkit/apis.json (nama "vamx"), env sebagai cadangan
const getApiKey = () => getApi('vamx')?.apiKey || process.env.VAMX_APIKEY || ''

// Field yang dibuang: tautan, sumber tontonan, dan file apa pun
const BLOCKED_KEY = /url|link|stream|source|embed|watch|download|file|video|player/i

// Ambil daftar episode dengan metadata saja
function extractEpisodes(data) {
    const root = data?.data ?? data?.result ?? data ?? {}
    const list = Array.isArray(root) ? root
        : Array.isArray(root.episodes) ? root.episodes
        : Array.isArray(root.episode) ? root.episode
        : []
    return list.slice(0, MAX_EPISODES).map((ep, i) => {
        const safe = {}
        for (const [k, v] of Object.entries(ep || {})) {
            if (BLOCKED_KEY.test(k)) continue
            if (v === null || v === undefined || typeof v === 'object') continue
            safe[k] = v
        }
        return {
            no: String(safe.episode_number ?? safe.episode ?? safe.number ?? i + 1),
            title: String(safe.name ?? safe.title ?? 'Episode ' + (i + 1)).slice(0, 50),
            date: String(safe.air_date ?? safe.release_date ?? safe.date ?? '-').slice(0, 10)
        }
    })
}

async function handler(m, { sock }) {
    const prefix = m.prefix || '.'
    const args = (m.text || '').trim().split(/\s+/).filter(Boolean)
    const id = args[0]
    const season = args[1] || '1'
    if (!id || !/^\d{1,10}$/.test(id) || !/^\d{1,3}$/.test(season)) {
        return m.reply(`📺 *ᴅᴀꜰᴛᴀʀ ᴇᴘɪsᴏᴅᴇ*\n\n> ${prefix}filmsesi <id> <season>\n\n*ᴄᴏɴᴛᴏʜ:*\n> ${prefix}filmsesi 1399 1`)
    }
    const apiKey = getApiKey()
    if (!apiKey) {
        return m.reply('❌ API key vamx belum diatur. Tambahkan dengan .addapi (nama: vamx).')
    }

    try {
        await m.react('📺')
        const res = await axios.get(API_URL, {
            params: { id, season },
            headers: { 'x-api-key': apiKey, 'User-Agent': 'Mozilla/5.0' },
            timeout: 20000,
            validateStatus: () => true
        })
        if (res.status >= 400) {
            await m.react('❌')
            const reason = res.data?.message || res.data?.error || `HTTP ${res.status}`
            return m.reply(`❌ API gagal: ${reason}`)
        }

        const episodes = extractEpisodes(res.data)
        if (!episodes.length) {
            await m.react('⚠️')
            return m.reply(`⚠️ Tidak ada episode untuk ID ${id} season ${season}.`)
        }

        const html = buildRichCardHtml({
            title: '📺 Season ' + season,
            subtitle: 'ID ' + id + ' • ' + episodes.length + ' episode ditampilkan',
            accent: '#2980b9',
            stats: episodes.map(e => ({ label: 'Ep ' + e.no, value: e.title + (e.date !== '-' ? ' • ' + e.date : '') })),
            buttons: [{ label: '🔁 Season lain', copy: prefix + 'filmsesi ' + id + ' ' }]
        })
        await sendRichCard(sock, m, { title: '📺 DAFTAR EPISODE', footer: 'Hanya informasi, tanpa tautan tonton', html })
        return m.react('✅')
    } catch (e) {
        console.error('[filmsesi] Error:', e)
        await m.react('❌')
        return m.reply('❌ Gagal mengambil daftar episode: ' + (e?.message || e))
    }
}

module.exports = { config: pluginConfig, handler }