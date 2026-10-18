const { buildAmCardHtml } = require('../../src/lib/amcard')
const { renderHtmlToPng } = require('../../src/lib/htmlcard')

const pluginConfig = {
    name: 'amfind',
    alias: ['amfinder', 'ampreset'],
    category: 'search',
    description: 'Cari preset Alight Motion dari link TikTok atau YouTube',
    usage: '.amfind <link TikTok/YouTube>',
    example: '.amfind https://youtu.be/275bmTyyafU',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

// Fungsi API Fetch Baru
async function fetchAmFinder(url) {
    const apiUrl = `https://api.wilz.web.id/api/tools/amfinder?url=${encodeURIComponent(url)}`
    const res = await fetch(apiUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
        }
    })
    
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`)
    
    const json = await res.json()
    if (json.status !== true) throw new Error(json.message || 'Gagal mengambil data dari API')
    
    return json.result
}

function buildTextCaption(data) {
    let caption = `🎬 *ALIGHT MOTION PRESET FINDER*\n\n`
    caption += `🌐 *Platform:* ${(data.platform || '-').toUpperCase()}\n`
    caption += `👤 *Kreator:* ${data.author || '-'}\n`
    caption += `📦 *Total Preset:* ${data.totalPresets || 0}\n\n`
    
    if (data.presetLinks && data.presetLinks.length > 0) {
        data.presetLinks.forEach((p, i) => {
            caption += `*${i + 1}. [${(p.type || 'LINK').toUpperCase()}]* ${p.title || 'Link'}\n`
            caption += `🔗 *Link:* ${p.url}\n`
            if (p.size) caption += `💾 *Ukuran:* ${p.size}\n`
            if (p.ratio) caption += `📐 *Rasio:* ${p.ratio}\n`
            if (p.password) caption += `🔑 *Password:* ${p.password}\n`
            caption += `\n`
        })
    } else {
        caption += `_Tidak ada link yang ditemukan._`
    }
    
    return caption.trim()
}

async function handler(m, { sock }) {
    const rawText = m.text?.trim()
    if (!rawText) return m.reply('❌ Masukkan URL video TikTok atau YouTube.')

    // Filter Regex: Hanya ekstrak URL dari TikTok atau YouTube
    const urlMatch = rawText.match(/https?:\/\/(?:www\.|vt\.|vm\.)?(?:tiktok\.com|youtube\.com|youtu\.be)[^\s]*/i)
    
    if (!urlMatch) {
        return m.reply('❌ Link tidak valid! Pastikan kamu mengirim link TikTok atau YouTube yang benar.')
    }
    
    const url = urlMatch[0]
    await m.reply('⏳ Sedang memindai link preset Alight Motion...')

    try {
        // Panggil API
        const apiResult = await fetchAmFinder(url)
        
        if (!apiResult.links || apiResult.links.length === 0) {
            return m.reply('❌ Tidak ditemukan preset Alight Motion / Google Drive pada video tersebut.')
        }

        // Normalisasi data (Mendukung TikTok & YouTube secara otomatis)
        const platformName = apiResult.platform === 'youtube' ? 'YouTube' : 'TikTok'
        
        const dataResult = {
            platform: platformName,
            author: apiResult.nickname || apiResult.author || 'Tanpa Nama',
            title: apiResult.title || 'Video',
            totalPresets: apiResult.links.length,
            presetLinks: apiResult.links.map(l => {
                let typeName = l.type.replace(/_/g, ' ')
                if (l.type === 'alight_motion') typeName = 'Alight Motion'
                if (l.type === 'google_drive') typeName = 'Google Drive'
                if (l.type === 'whatsapp_channel') typeName = 'WhatsApp Channel'

                return {
                    type: typeName,
                    title: l.kind ? `${typeName} (${l.kind})` : typeName,
                    url: l.url,
                    size: l.size || null,
                    ratio: l.ratio || null,
                    password: l.password || null
                }
            })
        }

        const linkList = dataResult.presetLinks
            .map((p, i) => `${i + 1}. ${p.url}`)
            .join('\n')

        try {
            // Render Gambar Card
            const html = buildAmCardHtml(dataResult, { description: dataResult.title })
            const png = await renderHtmlToPng(html)
            
            await sock.sendMessage(
                m.chat,
                { image: png, caption: `🎬 *AM Finder* — ${dataResult.totalPresets} link ditemukan\n\n${linkList}` },
                { quoted: m.raw || m }
            )
        } catch (renderErr) {
            console.error('[amfind] render kartu gagal, fallback teks:', renderErr.message)
            // Jika render gambar gagal, kirim teks
            await m.reply(buildTextCaption(dataResult))
        }
    } catch (err) {
        console.error('[amfind] Error:', err)
        await m.reply('❌ Gagal: ' + err.message)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}