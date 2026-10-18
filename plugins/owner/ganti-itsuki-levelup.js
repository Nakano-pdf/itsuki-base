const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'ganti-itsuki-levelup.jpg',
    alias: ['gantiitsukilevelup', 'setitsukilevelup'],
    category: 'owner',
    description: 'Ganti gambar itsuki-levelup.jpg',
    usage: '.ganti-itsuki-levelup.jpg (reply/kirim gambar)',
    example: '.ganti-itsuki-levelup.jpg',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')
    if (!isImage) return m.reply(`🖼️ *ɢᴀɴᴛɪ Itsuki-LEVELUP.JPG*\n\n> Kirim/reply gambar untuk mengganti\n> Key: config.assets.images.itsukiLevelup`)
    try {
        let buffer = m.quoted && m.quoted.isMedia ? await m.quoted.download() : await m.download()
        if (!buffer) return m.reply('❌ *Ara ara~*\n\n> いつき〜なかの✨ gagal download gambarnya nih... coba lagi ya~ 🥺')
        const { uploadAndSetAsset } = require('../../src/lib/assetManager')
        const url = await uploadAndSetAsset('images.itsukiLevelup', buffer, 'itsuki-levelup.jpg')
        m.reply(`✅ *ʙᴇʀʜᴀsɪʟ*\n\n> Gambar itsuki-levelup.jpg telah diganti\n> Link baru: ${url}`)
    } catch (error) {
        m.reply(`❌ *Gomen ne~* ✦\n\n> ${error.message}\n\n_Ai udah coba yang terbaik tapi gagal juga... coba lagi nanti ya~ 🌸_`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}