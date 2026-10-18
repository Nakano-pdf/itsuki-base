const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'ganti-itsuki-v11.jpg',
    alias: ['gantiitsukiv11', 'setitsukiv11'],
    category: 'owner',
    description: 'Ganti gambar itsuki-v11.jpg',
    usage: '.ganti-itsuki-v11.jpg (reply/kirim gambar)',
    example: '.ganti-itsuki-v11.jpg',
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
    if (!isImage) return m.reply(`🖼️ *ɢᴀɴᴛɪ Itsuki-V11.JPG*\n\n> Kirim/reply gambar untuk mengganti\n> Key: config.assets.images.itsukiV11`)
    try {
        let buffer = m.quoted && m.quoted.isMedia ? await m.quoted.download() : await m.download()
        if (!buffer) return m.reply('❌ *Ara ara~*\n\n> いつき〜なかの✨ gagal download gambarnya nih... coba lagi ya~ 🥺')
        const { uploadAndSetAsset } = require('../../src/lib/assetManager')
        const url = await uploadAndSetAsset('images.itsukiV11', buffer, 'itsuki-v11.jpg')
        m.reply(`✅ *ʙᴇʀʜᴀsɪʟ*\n\n> Gambar itsuki-v11.jpg telah diganti\n> Link baru: ${url}`)
    } catch (error) {
        m.reply(`❌ *Gomen ne~* ✦\n\n> ${error.message}\n\n_Ai udah coba yang terbaik tapi gagal juga... coba lagi nanti ya~ 🌸_`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}