const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'ganti-itsuki-reply-v4.mp4',
    alias: ['gantiitsukireplyv4', 'setitsukireplyv4'],
    category: 'owner',
    description: 'Ganti video itsuki-reply-v4.mp4',
    usage: '.ganti-itsuki-reply-v4.mp4 (reply/kirim video)',
    example: '.ganti-itsuki-reply-v4.mp4',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const isVideo = m.type === 'videoMessage' || (m.quoted && m.quoted.type === 'videoMessage')

    if (!isVideo) {
        return m.reply(
            `🎬 *ɢᴀɴᴛɪ ʜsɴᴀɪ-ʀᴇᴘʟʏ-ᴠ4.ᴍᴘ4*\n\n` +
            `> Kirim/reply video untuk mengganti\n` +
            `> Key: config.assets.video.itsukiReplyV4`
        )
    }

    try {
        let buffer
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download()
        } else if (m.isMedia) {
            buffer = await m.download()
        }

        if (!buffer) {
            return m.reply(`❌ *Gomen ne~* Gagal mendownload video~ 🥺`)
        }

        const { uploadAndSetAsset } = require('../../src/lib/assetManager')
        const url = await uploadAndSetAsset('video.itsukiReplyV4', buffer, 'itsuki-reply-v4.mp4')

        m.reply(
            `✅ *ʙᴇʀʜᴀsɪʟ*\n\n` +
            `> Video \`itsuki-reply-v4.mp4\` telah diganti\n> Link baru: ${url}`
        )

    } catch (error) {
        m.reply(`❌ *Gomen ne~* ✦\n\n> ${error.message}\n\n_Ai udah coba yang terbaik tapi gagal juga... coba lagi nanti ya~ 🌸_`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}