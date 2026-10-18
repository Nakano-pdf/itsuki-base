const { listAssets, uploadAndSetAsset, getAssetUrl } = require('../../src/lib/assetManager')
const config = require('../../config')

const pluginConfig = {
    name: 'addmedia',
    alias: ['tambahmedia', 'uploadmedia', 'addasset'],
    category: 'owner',
    description: 'Tambah/ganti asset media baru di config.assets (upload otomatis ke Catbox)',
    usage: '.addmedia <kategori> <nama-key>',
    example: '.addmedia images itsukiNewpose',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

const AI = {
    warn: (msg) => `🌸 *Hmm~ Perhatiin dulu ya!*\n\n> ${msg}`,
}

function getCategories() {
    return Object.keys(config.assets || {})
}

function formatSize(bytes) {
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB'
    if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return bytes + ' B'
}

// Nama key: huruf/angka/underscore, mulai dengan huruf (dipakai sebagai config.assets.<kategori>.<key>)
function sanitizeKey(name) {
    const base = name.trim()
    if (!/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(base)) return null
    return base
}

function detectMediaType(m) {
    const src = m.quoted?.isMedia ? m.quoted : (m.isMedia ? m : null)
    if (!src) return null
    if (src.isImage) return { type: 'image', emoji: '🖼️', source: src }
    if (src.isVideo) return { type: 'video', emoji: '🎬', source: src }
    if (src.isAudio) return { type: 'audio', emoji: '🎵', source: src }
    if (src.isSticker) return { type: 'sticker', emoji: '🌟', source: src }
    if (src.isDocument) return { type: 'document', emoji: '📄', source: src }
    return null
}

async function handler(m, { sock }) {
    const categories = getCategories()
    const [kategoriArg, ...rest] = m.args
    const namaFileArg = rest.join(' ')

    const media = detectMediaType(m)

    if (!kategoriArg || !namaFileArg || !media) {
        return m.reply(
            `🌸 *ᴀᴅᴅ ᴍᴇᴅɪᴀ*\n\n` +
            `Reply/kirim gambar, video, audio, sticker, atau dokumen, lalu:\n` +
            `\`${m.prefix}addmedia <kategori> <nama-key>\`\n\n` +
            `*Contoh:*\n> \`${m.prefix}addmedia images itsuki-newpose.jpg\`\n\n` +
            `*Kategori tersedia:*\n${categories.map(c => `> \`${c}\``).join('\n') || '> (config.assets kosong)'}\n\n` +
            `> _Ai siap nyimpenin media baru kamu kapan aja~ 💖_`
        )
    }

    const kategori = kategoriArg.toLowerCase()
    if (!categories.includes(kategori)) {
        return m.reply(AI.warn(
            `Kategori \`${kategori}\` nggak ada nih~\n\nKategori tersedia:\n${categories.map(c => `> \`${c}\``).join('\n')}`
        ))
    }

    const fileName = sanitizeKey(namaFileArg)
    if (!fileName) {
        return m.reply(AI.warn('Nama key-nya kurang valid~ Pakai huruf/angka/underscore aja, awali huruf (contoh: itsukiNewpose)'))
    }

    try {
        const buffer = await media.source.download()
        if (!buffer || !buffer.length) {
            return m.reply(AI.warn('Gagal download media-nya, coba kirim ulang ya~'))
        }

        const assetKey = `${kategori}.${fileName}`
        const isOverwrite = !!getAssetUrl(assetKey)
        const url = await uploadAndSetAsset(assetKey, buffer, fileName)

        m.react(media.emoji)
        await m.reply(
            `✅ *ᴍᴇᴅɪᴀ ᴅɪᴛᴀᴍʙᴀʜᴋᴀɴ* 🌸\n\n` +
            `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
            `┃ 📁 ᴋᴀᴛᴇɢᴏʀɪ: \`${kategori}\`\n` +
            `┃ 📝 ᴋᴇʏ: \`config.assets.${assetKey}\`\n` +
            `┃ 📦 ᴜᴋᴜʀᴀɴ: *${formatSize(buffer.length)}*\n` +
            `┃ 🗂️ sᴛᴀᴛᴜs: *${isOverwrite ? 'Menimpa URL lama' : 'Key baru'}*\n` +
            `╰┈┈⬡\n\n` +
            `> _Udah いつき〜なかの✨ upload ya~ 💖_\n> ${url}`
        )
    } catch (error) {
        m.reply(`❌ *Gomen ne~* ✦\n\n> ${error.message}\n\n_Ai udah coba yang terbaik tapi gagal juga... coba lagi nanti ya~ 🌸_`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}