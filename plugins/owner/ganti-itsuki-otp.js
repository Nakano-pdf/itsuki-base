const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'ganti-itsuki-otp.jpg',
    alias: ['gantiitsukiotp', 'setitsukiotp'],
    category: 'owner',
    description: 'Ganti gambar itsuki-otp.jpg',
    usage: '.ganti-itsuki-otp.jpg (reply/kirim gambar)',
    example: '.ganti-itsuki-otp.jpg',
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
    if (!isImage) return m.reply(`🖼️ *ɢᴀɴᴛɪ Itsuki-OTP.JPG*\n\n> Kirim/reply gambar untuk mengganti\n> Key: config.assets.images.itsukiOtp`)
    try {
        let buffer = m.quoted && m.quoted.isMedia ? await m.quoted.download() : await m.download()
        if (!buffer) return m.reply('❌ *Ara ara~*\n\n> いつき〜なかの✨ gagal download gambarnya nih... coba lagi ya~ 🥺')
        const { uploadAndSetAsset } = require('../../src/lib/assetManager')
        const url = await uploadAndSetAsset('images.itsukiOtp', buffer, 'itsuki-otp.jpg')
        m.reply(`✅ *ʙᴇʀʜᴀsɪʟ*\n\n> Gambar itsuki-otp.jpg telah diganti\n> Link baru: ${url}`)
    } catch (error) {
        m.reply(`❌ *Gomen ne~* ✦\n\n> ${error.message}\n\n_Ai udah coba yang terbaik tapi gagal juga... coba lagi nanti ya~ 🌸_`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}