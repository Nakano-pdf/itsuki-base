const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'ganti-itsuki-store.jpg',
    alias: ['gantistore', 'setitsukistore'],
    category: 'owner',
    description: 'Ganti gambar itsuki-store.jpg (thumbnail store)',
    usage: '.ganti-itsuki-store.jpg (reply/kirim gambar)',
    example: '.ganti-itsuki-store.jpg',
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
        return m.reply(`🖼️ *ɢᴀɴᴛɪ ʜsɴᴀɪ-sᴛᴏʀᴇ.ᴊᴘɢ*\n\n> Kirim/reply gambar untuk mengganti\n> Key: config.assets.images.itsukiStore`)
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
        const url = await uploadAndSetAsset('images.itsukiStore', buffer, 'itsuki-store.jpg')
        
        m.reply(`✅ *ʙᴇʀʜᴀsɪʟ*\n\n> Gambar itsuki-store.jpg telah diganti\n> Link baru: ${url}`)
        
    } catch (error) {
        m.reply(`❌ *Gomen ne~* ✦\n\n> ${error.message}\n\n_Ai udah coba yang terbaik tapi gagal juga... coba lagi nanti ya~ 🌸_`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
