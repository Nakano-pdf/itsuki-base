/**
✧ Name    : reactchannel
✧ Alias   : rc
✧ Category: owner
✧ Deskripsi: Memberikan reaction ke postingan WhatsApp Channel.
**/

const config = require('../../config')

const pluginConfig = {
    name: 'reactchannel',
    alias: ['rc', 'reactch'],
    category: 'owner',
    description: 'Memberikan reaction ke postingan WhatsApp Channel',
    usage: '.reactchannel <link> [reaction]',
    example: '.reactchannel https://whatsapp.com/channel/... 🎊🎉🥳✨',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.text?.trim()

    if (!text) {
        return m.reply(
            `📦 *ʀᴇᴀᴄᴛ ᴄʜᴀɴɴᴇʟ* 🎤✨\n\n` +
            `> Masukkan link postingan WhatsApp Channel dulu yaa~\n\n` +
            `*ᴄᴏɴᴛᴏʜ:*\n` +
            `> ${m.prefix}rc https://whatsapp.com/channel/...\n\n` +
            `*ᴄᴜsᴛᴏᴍ ʀᴇᴀᴄᴛɪᴏɴ:*\n` +
            `> ${m.prefix}rc https://whatsapp.com/channel/... 🎊🎉🥳✨🎂🍰`
        )
    }

    // ============================================================
    // AMBIL LINK WHATSAPP CHANNEL
    // ============================================================

    const urlMatch = text.match(
        /https?:\/\/(?:www\.)?whatsapp\.com\/channel\/[^\s]+/i
    )

    if (!urlMatch) {
        return m.reply(
            `❌ *ʟɪɴᴋ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ*\n\n` +
            `> Masukkan link postingan WhatsApp Channel yang benar.`
        )
    }

    const url = urlMatch[0].replace(/[.,!?]+$/, '')

    // ============================================================
    // AMBIL REACTION SETELAH LINK
    // ============================================================

    const reactionText = text
        .slice(urlMatch.index + urlMatch[0].length)
        .trim()

    let reactions

    if (!reactionText) {
        // Default reaction
        reactions = '😗, 🤪, 😎'
    } else {
        /*
         * Mendukung:
         *
         * 🎊🎉🥳✨🎂🍰
         *
         * maupun:
         *
         * 🎊, 🎉, 🥳, ✨, 🎂, 🍰
         */

        const parsed = reactionText
            .split(/[\s,]+/)
            .filter(Boolean)
            .flatMap(item => Array.from(item))

        reactions = [...new Set(parsed)].join(', ')
    }

    await m.react('🕕')

    try {
        // ========================================================
        // BUAT URL API
        // ========================================================

        const apiUrl =
            `https://api-faa.my.id/faa/react-channel` +
            `?url=${encodeURIComponent(url)}` +
            `&react=${encodeURIComponent(reactions)}` +
            `&apikey=${encodeURIComponent('faa-ganteng-sekali')}`

        console.log('[reactchannel] Target   :', url)
        console.log('[reactchannel] Reaction :', reactions)
        console.log('[reactchannel] Request  :', apiUrl)

        // ========================================================
        // REQUEST API
        // ========================================================

        const response = await fetch(apiUrl)

        const raw = await response.text()

        console.log('[reactchannel] HTTP:', response.status)
        console.log('[reactchannel] RAW :', raw)

        let result = null

        try {
            result = JSON.parse(raw)
        } catch {
            result = null
        }

        // ========================================================
        // API SUKSES
        // ========================================================

        if (result?.status === true) {
            await m.react('✅')

            return m.reply(
                `✅ *ʀᴇᴀᴄᴛ ᴄʜᴀɴɴᴇʟ ʙᴇʀʜᴀsɪʟ~* 🎀✨\n\n` +
                `╭┈┈⬡「 🎤 ʀᴇᴀᴄᴛ 」\n` +
                `┃ 🎯 Target : Berhasil\n` +
                `┃ 💫 React  : ${reactions}\n` +
                `┃ ⏳ Status : ${result.task_status || 'pending'}\n` +
                `╰┈┈┈┈┈┈┈┈⬡\n\n` +
                `> ${result.note || 'Reaction sedang diproses oleh server.'}`
            )
        }

        // ========================================================
        // API MEMBERIKAN PESAN ERROR
        // ========================================================

        if (result?.message) {
            throw new Error(result.message)
        }

        // ========================================================
        // RESPONSE TIDAK DIKENALI
        // ========================================================

        throw new Error(
            `API mengembalikan HTTP ${response.status}`
        )

    } catch (error) {
        console.error('[reactchannel] Error:', error)

        await m.react('❌')

        return m.reply(
            `❌ *ʀᴇᴀᴄᴛ ᴄʜᴀɴɴᴇʟ ɢᴀɢᴀʟ*\n\n` +
            `> ${error.message}\n\n` +
            `*ᴛᴀʀɢᴇᴛ:*\n` +
            `> ${url}\n\n` +
            `*ʀᴇᴀᴄᴛ:*\n` +
            `> ${reactions}`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}