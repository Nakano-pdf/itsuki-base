const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'ganti-itsuki-promote.jpg',
    alias: ['gantiitsukipromote', 'setitsukipromote'],
    category: 'owner',
    description: 'Ganti gambar itsuki-promote.jpg',
    usage: '.ganti-itsuki-promote.jpg (reply/kirim gambar)',
    example: '.ganti-itsuki-promote.jpg',
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
    if (!isImage) return m.reply(`🖼️ *ɢᴀɴᴛɪ Itsuki-PROMOTE.JPG*\n\n> Kirim/reply gambar untuk mengganti\n> Key: config.assets.images.itsukiPromote`)
    try {
        let buffer = m.quoted && m.quoted.isMedia ? await m.quoted.download() : await m.download()
        if (!buffer) return m.reply('❌ *Ara ara~*\n\n> いつき〜なかの✨ gagal download gambarnya nih... coba lagi ya~ 🥺')
        const { uploadAndSetAsset } = require('../../src/lib/assetManager')
        const url = await uploadAndSetAsset('images.itsukiPromote', buffer, 'itsuki-promote.jpg')
        m.reply(`✅ *ʙᴇʀʜᴀsɪʟ*\n\n> Gambar itsuki-promote.jpg telah diganti\n> Link baru: ${url}`)
    } catch (error) {
        m.reply(`❌ *Gomen ne~* ✦\n\n> ${error.message}\n\n_Ai udah coba yang terbaik tapi gagal juga... coba lagi nanti ya~ 🌸_`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}