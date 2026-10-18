const { live3d } = require('../../src/scraper/seaart')

const pluginConfig = {
    name: 'itsukibanana',
    alias: [],
    category: 'ai',
    description: 'Edit gambar dengan AI menggunakan prompt (nano-banana)',
    usage: '.itsukibanana <prompt>',
    example: '.itsukibanana make it anime style',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const prompt = m.args.join(' ').trim()

    if (!prompt) {
        return m.reply(
            `🍌 *ʜᴏsʜɪɴᴏ ʙᴀɴᴀɴᴀ sᴜᴘᴇʀ*\n\n` +
            `Haii~ いつき〜なかの✨ bisa bantu edit gambarmu pakai AI lho! Kasih tahu いつき〜なかの✨ mau diapain gambarnya~ 🌸\n\n` +
            `\`Contoh: ${m.prefix}itsukibanana make it anime style\`\n\n` +
            `> Reply atau kirim gambar dengan caption ya~ いつき〜なかの✨ tunggu! ✨`
        )
    }

    const isImage = m.isImage || (m.quoted && m.quoted.isImage)
    if (!isImage) {
        return m.reply(`🍌 *ɴᴀɴᴏ ʙᴀɴᴀɴᴀ*\n\nEhh~ いつき〜なかの✨ belum lihat gambarnya nih!\n> Reply atau kirim gambar dengan caption ya~ 🌸`)
    }

    m.react('🕕')

    try {
        let mediaBuffer
        if (m.isImage && m.download) {
            mediaBuffer = await m.download()
        } else if (m.quoted && m.quoted.isImage && m.quoted.download) {
            mediaBuffer = await m.quoted.download()
        }

        if (!mediaBuffer || !Buffer.isBuffer(mediaBuffer)) {
            m.react('❌')
            return m.reply(`❌ *Ara ara~*\n\n> いつき〜なかの✨ gagal ngunduh gambarnya nih... coba kirim ulang ya~ 🥺`)
        }

        const { image: resultBuffer } = await live3d(mediaBuffer, prompt)

        await sock.sendMessage(
            m.chat,
            { image: resultBuffer, caption: `✨ *DONE!* ✨\n\n🍌 Gambarnya udah di-edit sama Banana AI~ Keren kan? ⭐` },
            { quoted: m }
        )

        m.react('✅')

    } catch (error) {
        m.react('❌')
        console.error('[itsukibanana] ERROR:', error)
        m.reply(
            `🍀 *Waduuhh~ Ada yang tidak beres nih!*\n\n` +
            `> ${error?.message || String(error)}\n\n` +
            `💕 Coba lagi nanti ya~ tapi jangan spam dulu, いつき〜なかの✨ capek nih! ✨`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}