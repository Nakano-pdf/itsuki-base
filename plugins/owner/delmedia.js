const { listAssets, removeAsset } = require('../../src/lib/assetManager')
const config = require('../../config')

const pluginConfig = {
    name: 'delmedia',
    alias: ['hapusmedia', 'deletemedia', 'delasset'],
    category: 'owner',
    description: 'Kosongkan URL asset di config.assets',
    usage: '.delmedia <kategori> <nama-file>',
    example: '.delmedia images itsuki-newpose.jpg',
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

async function handler(m, { sock }) {
    const categories = getCategories()
    const [kategoriArg, ...rest] = m.args
    const namaFileArg = rest.join(' ')

    const kategori = kategoriArg ? kategoriArg.toLowerCase() : null

    // ── Tanpa kategori sama sekali → tampilkan kategori yang ada ────────────
    if (!kategori) {
        return m.reply(
            `📁 *ᴅᴇʟ ᴍᴇᴅɪᴀ*\n\n` +
            `Format: \`${m.prefix}delmedia <kategori> <nama-file>\`\n\n` +
            `*Kategori tersedia:*\n${categories.map(c => `> \`${c}\``).join('\n') || '> (belum ada folder)'}\n\n` +
            `> _Ketik \`${m.prefix}delmedia <kategori>\` aja buat liat daftar file-nya~ 🌸_`
        )
    }

    if (!categories.includes(kategori)) {
        return m.reply(AI.warn(
            `Kategori \`${kategori}\` nggak ada nih~\n\nKategori tersedia:\n${categories.map(c => `> \`${c}\``).join('\n')}`
        ))
    }

    const keys = listAssets().filter(a => a.key.startsWith(kategori + '.'))

    // ── Kategori doang tanpa nama key → tampilkan daftar key di kategori itu ──
    if (!namaFileArg) {
        if (!keys.length) {
            return m.reply(AI.warn(`Kategori \`${kategori}\` masih kosong nih~`))
        }
        const listText = keys.map(a => `┃ 📄 \`${a.key.slice(kategori.length + 1)}\` ${a.url ? '✅' : '⬜ (kosong)'}`).join('\n')
        return m.reply(
            `📁 *ɪsɪ ᴄᴏɴꜰɪɢ.ᴀssᴇᴛs.${kategori}* (${keys.length} key)\n\n` +
            `╭┈┈⬡\n${listText}\n╰┈┈⬡\n\n` +
            `> _Pilih salah satu lalu \`${m.prefix}delmedia ${kategori} <nama-key>\` ya~ 🌸_`
        )
    }

    const fileName = namaFileArg.trim()
    const assetKey = `${kategori}.${fileName}`
    const found = keys.find(a => a.key === assetKey)
    if (!found || !found.url) {
        return m.reply(AI.warn(`Key \`${fileName}\` nggak ketemu / udah kosong di \`${kategori}\`~ Cek lagi namanya ya`))
    }

    try {
        removeAsset(assetKey)

        m.react('🗑️')
        await m.reply(
            `✅ *ᴍᴇᴅɪᴀ ᴅɪʜᴀᴘᴜs* 🌸\n\n` +
            `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
            `┃ 📁 ᴋᴀᴛᴇɢᴏʀɪ: \`${kategori}\`\n` +
            `┃ 📝 ᴋᴇʏ: \`config.assets.${assetKey}\`\n` +
            `╰┈┈⬡\n\n` +
            `> _Udah いつき〜なかの✨ kosongin URL-nya ya~ 💕_`
        )
    } catch (error) {
        m.reply(`❌ *Gomen ne~* ✦\n\n> ${error.message}\n\n_Ai udah coba yang terbaik tapi gagal juga... coba lagi nanti ya~ 🌸_`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}