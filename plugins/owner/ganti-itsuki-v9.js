const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'ganti-itsuki-v9.jpg',
    alias: ['gantiitsukiv9', 'setitsukiv9'],
    category: 'owner',
    description: 'Ganti gambar itsuki-v9.jpg (thumbnail welcome)',
    usage: '.ganti-itsuki-v9.jpg (reply/kirim gambar)',
    example: '.ganti-itsuki-welcome.jpg',
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
    
    if (!isImage) {
        return m.reply(`🖼️ *ɢᴀɴᴛɪ ʜsɴᴀɪ-ᴠ9.ᴊᴘɢ*\n\n> Kirim/reply gambar untuk mengganti\n> Key: config.assets.images.itsukiV9`)
    }
    
    try {
        let buffer
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download()
        } else if (m.isMedia) {
            buffer = await m.download()
        }
        
        if (!buffer) {
            return m.reply(`❌ *Ara ara~*\n\n> いつき〜なかの✨ gagal download gambarnya nih... coba lagi ya~ 🥺`)
        }
        
        const { uploadAndSetAsset } = require('../../src/lib/assetManager')
        const url = await uploadAndSetAsset('images.itsukiV9', buffer, 'itsuki-v9.jpg')
        
        m.reply(`✅ *ʙᴇʀʜᴀsɪʟ*\n\n> Gambar itsuki-v9.jpg telah diganti\n> Link baru: ${url}`)
        
    } catch (error) {
        m.reply(`❌ *Gomen ne~* ✦\n\n> ${error.message}\n\n_Ai udah coba yang terbaik tapi gagal juga... coba lagi nanti ya~ 🌸_`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
