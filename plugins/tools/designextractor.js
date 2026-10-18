const axios = require('axios')

const pluginConfig = {
    name: 'designextractor',
    alias: ['dx', 'getdesign', 'extractdesign', 'ambilweb'],
    category: 'tools',
    description: 'Ekstrak desain/kode dari sebuah website',
    usage: '.dx <url>',
    example: '.dx https://tokcer.web.id',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 0,
    isEnabled: true
}

const API_URL = 'https://vamxapi.my.id/api/v1/tools/design-extractor'
const API_KEY = 'ISI_API_KEY_KAMU'

function isValidUrl(str) {
    try {
        const u = new URL(str)
        return u.protocol === 'http:' || u.protocol === 'https:'
    } catch { return false }
}

function formatBytes(bytes) {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

async function handler(m, { sock }) {
    const targetUrl = (m.args[0] || '').trim()

    if (!targetUrl) {
        m.react('❌')
        return m.reply(`Format salah!\nContoh: \`${m.prefix}${pluginConfig.name} https://tokcer.web.id\``)
    }

    if (!isValidUrl(targetUrl)) {
        m.react('❌')
        return m.reply(`URL tidak valid. Pastikan diawali http:// atau https://`)
    }

    m.react('🕕')

    try {
        const res = await axios.get(API_URL, {
            params: { url: targetUrl },
            headers: {
                'x-api-key': API_KEY,
                'Accept': 'application/json, application/zip, */*'
            },
            responseType: 'arraybuffer',
            timeout: 60000,
            validateStatus: () => true
        })

        // Konversi data ke buffer & text
        const buffer = Buffer.from(res.data)
        const text = buffer.toString('utf-8')
        const contentType = (res.headers['content-type'] || '').toLowerCase()
        const domain = new URL(targetUrl).hostname.replace(/[^a-z0-9.-]/gi, '_')

        // === CASE 1: HTTP Error ===
        if (res.status < 200 || res.status >= 300) {
            m.react('❌')
            let detail = text
            try {
                const json = JSON.parse(text)
                detail = json.message || json.error || JSON.stringify(json)
            } catch {}
            return m.reply(`❌ *ᴅᴇsɪɢɴ ᴇxᴛʀᴀᴄᴛᴏʀ*\n\n> Status : ${res.status}\n> Pesan  : ${detail.slice(0, 300)}`)
        }

        // === CASE 2: Deteksi File ZIP via Magic Bytes (PK..) ===
        const isZip = buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04

        if (isZip || contentType.includes('zip')) {
            m.react('✅')
            return await sock.sendMessage(m.chat, {
                document: buffer,
                mimetype: 'application/zip',
                fileName: `design-${domain}.zip`,
                caption: `✅ *ᴅᴇsɪɢɴ ᴇxᴛʀᴀᴄᴛᴏʀ*\n\n╭┈┈⬡「 📦 *ʜᴀsɪʟ ᴇxᴛʀᴀᴋsɪ* 」\n┃ 🌐 Target : ${targetUrl}\n┃ 📁 Format : ZIP File\n┃ 📊 Size   : ${formatBytes(buffer.length)}\n╰┈┈⬡\n\n> Extract file ini untuk melihat HTML, CSS, JS, dan assets.`
            }, { quoted: m })
        }

        // === CASE 3: Deteksi JSON ===
        if (contentType.includes('json') || text.trim().startsWith('{')) {
            let json = null
            try { json = JSON.parse(text) } catch {}

            if (json) {
                // Jika status false
                if (json.status === false || json.success === false) {
                    m.react('❌')
                    return m.reply(`❌ *ᴅᴇsɪɢɴ ᴇxᴛʀᴀᴄᴛᴏʀ*\n\n> ${json.message || json.error || 'API gagal memproses'}`)
                }

                // Cek jika ada link download
                const dlLink = json.data?.download_url || json.data?.url || json.url || json.download_url || json.result?.url

                if (dlLink) {
                    m.react('✅')
                    const caption = `✅ *ᴅᴇsɪɢɴ ᴇxᴛʀᴀᴄᴛᴏʀ*\n\n╭┈┈⬡「 📦 *ʜᴀsɪʟ ᴇxᴛʀᴀᴋsɪ* 」\n┃ 🌐 Target : ${targetUrl}\n┃ 🔗 Link   : [Tersedia]\n╰┈┈⬡\n\n> Klik tombol untuk mendownload.`
                    
                    try {
                        return await sock.sendMessage(m.chat, {
                            text: caption,
                            footer: 'VamX Extractor',
                            templateButtons: [{ index: 1, urlButton: { displayText: '📥 Download Hasil', url: dlLink } }]
                        }, { quoted: m })
                    } catch {
                        return m.reply(caption + `\n\n📥 *Link Download:*\n${dlLink}`)
                    }
                }
                
                // Jika JSON valid tapi tidak ada link, kirim sebagai file JSON
                m.react('✅')
                return await sock.sendMessage(m.chat, {
                    document: buffer,
                    mimetype: 'application/json',
                    fileName: `design-${domain}.json`,
                    caption: `✅ *ᴅᴇsɪɢɴ ᴇxᴛʀᴀᴄᴛᴏʀ*\n\nData JSON dari target: ${targetUrl}`
                }, { quoted: m })
            }
        }

        // === CASE 4: Fallback (Berupa HTML/Teks) ===
        // Dikirim sebagai FILE (.html / .txt) agar tidak error karena terlalu panjang/format
        m.react('✅')
        const isHtml = contentType.includes('html') || text.trim().toLowerCase().startsWith('<!doctype html')
        const ext = isHtml ? 'html' : 'txt'
        const mime = isHtml ? 'text/html' : 'text/plain'

        return await sock.sendMessage(m.chat, {
            document: buffer,
            mimetype: mime,
            fileName: `design-${domain}.${ext}`,
            caption: `✅ *ᴅᴇsɪɢɴ ᴇxᴛʀᴀᴄᴛᴏʀ*\n\n╭┈┈⬡「 📦 *ʜᴀsɪʟ ᴇxᴛʀᴀᴋsɪ* 」\n┃ 🌐 Target : ${targetUrl}\n┃ 📁 Format : ${ext.toUpperCase()} File\n┃ 📊 Size   : ${formatBytes(buffer.length)}\n╰┈┈⬡\n\n> File dikirim sebagai dokumen karena ukurannya terlalu besar untuk chat.`
        }, { quoted: m })

    } catch (e) {
        m.react('❌')
        let errMsg = e.message || 'Unknown error'
        if (e.code === 'ECONNABORTED' || /timeout/i.test(errMsg)) {
            errMsg = 'Request timeout (>60 detik). Website mungkin terlalu besar.'
        }
        return m.reply(`❌ *ᴅᴇsɪɢɴ ᴇxᴛʀᴀᴄᴛᴏʀ*\n\n> Gagal mengambil data\n> \`${String(errMsg).slice(0, 300)}\``)
    }
}

module.exports = { config: pluginConfig, handler }