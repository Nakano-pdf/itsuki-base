const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'itsuki-large',
    alias: ['setitsukilarge', 'gantiitsukilarge'],
    category: 'owner',
    description: 'Preset: Ganti gambar itsuki.jpg, serta itsuki-v7 hingga itsuki-v11.jpg sekaligus',
    usage: '.itsuki-large (reply/kirim gambar)',
    example: '.itsuki-large',
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
        return m.reply(`🖼️ *ʜsɴᴀɪ ʟᴀʀɢᴇ ᴘʀᴇsᴇᴛ*\n\n> Kirim/reply gambar untuk mengganti kumpulan foto besar (images.itsuki, itsukiV7, itsukiV8, itsukiV9, itsukiV11) sekaligus.\n> Pastikan rasio gambar sesuai dengan yang diinginkan.`)
    }
    
    await m.react('🕕')
    
    try {
        let buffer
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download()
        } else if (m.isMedia) {
            buffer = await m.download()
        }
        
        if (!buffer) {
            await m.react('❌')
            return m.reply(`❌ *Ara ara~*\n\n> いつき〜なかの✨ gagal download gambarnya nih... coba lagi ya~ 🥺`)
        }
        
        const targetKeys = [
            'images.itsuki',
            'images.itsukiV7',
            'images.itsukiV8',
            'images.itsukiV9',
            'images.itsukiV11'
        ]

        // Upload sekali ke Catbox, URL yang sama dipakai untuk semua key
        const { uploadAndSetAsset, setAssetUrl } = require('../../src/lib/assetManager')
        const url = await uploadAndSetAsset(targetKeys[0], buffer, 'itsuki-large.jpg')
        for (const key of targetKeys.slice(1)) setAssetUrl(key, url)
        const targetImages = targetKeys.map(k => 'config.assets.' + k)
        
        await m.react('✅')
        m.reply(`✅ *ʙᴇʀʜᴀsɪʟ*\n\n> Gambar bundle *itsuki-large* berhasil diganti secara massal.\n> Mencakup: ${targetImages.join(', ')}\n> Link baru: ${url}`)
        
    } catch (error) {
        await m.react('❌')
        m.reply(`❌ *Gomen ne~* ✦\n\n> ${error.message}\n\n_Ai udah coba yang terbaik tapi gagal juga... coba lagi nanti ya~ 🌸_`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
