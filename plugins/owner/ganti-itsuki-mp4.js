const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'ganti-itsuki.mp4',
    alias: ['gantiitsukivideo', 'setitsukivideo'],
    category: 'owner',
    description: 'Ganti video itsuki.mp4',
    usage: '.ganti-itsuki.mp4 (reply/kirim video)',
    example: '.ganti-itsuki.mp4',
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
        return m.reply(`🎬 *ɢᴀɴᴛɪ ʜsɴᴀɪ.ᴍᴘ4*\n\n> Kirim/reply video untuk mengganti\n> Key: config.assets.video.itsuki`)
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
        const url = await uploadAndSetAsset('video.itsuki', buffer, 'itsuki.mp4')
        
        m.reply(`✅ *ʙᴇʀʜᴀsɪʟ*\n\n> Video itsuki.mp4 telah diganti\n> Link baru: ${url}`)
        
    } catch (error) {
        m.reply(`❌ *Gomen ne~* ✦\n\n> ${error.message}\n\n_Ai udah coba yang terbaik tapi gagal juga... coba lagi nanti ya~ 🌸_`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
