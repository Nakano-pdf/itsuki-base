const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'ganti-itsuki.mp3',
    alias: ['gantiitsukiaudio', 'setitsukiaudio'],
    category: 'owner',
    description: 'Ganti audio itsuki.mp3',
    usage: '.ganti-itsuki.mp3 (reply/kirim audio)',
    example: '.ganti-itsuki.mp3',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const isAudio = m.type === 'audioMessage' || (m.quoted && m.quoted.type === 'audioMessage')
    
    if (!isAudio) {
        return m.reply(`🎵 *ɢᴀɴᴛɪ ʜsɴᴀɪ.ᴍᴘ3*\n\n> Kirim/reply audio untuk mengganti\n> Key: config.assets.audio.itsuki`)
    }
    
    try {
        let buffer
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download()
        } else if (m.isMedia) {
            buffer = await m.download()
        }
        
        if (!buffer) {
            return m.reply(`❌ *Gomen ne~* Gagal mendownload audio~ 🥺`)
        }
        
        const { uploadAndSetAsset } = require('../../src/lib/assetManager')
        const url = await uploadAndSetAsset('audio.itsuki', buffer, 'itsuki.mp3')
        
        m.reply(`✅ *ʙᴇʀʜᴀsɪʟ*\n\n> Audio itsuki.mp3 telah diganti\n> Link baru: ${url}`)
        
    } catch (error) {
        m.reply(`❌ *Gomen ne~* ✦\n\n> ${error.message}\n\n_Ai udah coba yang terbaik tapi gagal juga... coba lagi nanti ya~ 🌸_`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
