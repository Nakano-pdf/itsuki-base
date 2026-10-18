const axios = require('axios')
const config = require('../../config')
const { uploadToTmpFiles } = require('../../src/lib/sea')

const pluginConfig = {
    name: 'fakeffduo',
    alias: ['fakeff2'],
    category: 'canvas',
    description: 'Membuat gambar ff duo',
    usage: '.fakeff2 <text>',
    example: '.fakeff2 Hai cantik',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const [nama1, nama2] = m.text.split(',') || []
    if(!nama1 || !nama2) {
        return m.reply(`*FAKE FF DUO*\n\n> Contoh: ${m.prefix}fakeffduo nama1,nama2`)
    }
    m.react('🕕')
    
    try {
        await sock.sendMedia(m.chat, `https://kazztzyy.my.id/api/maker/fakeffduo?name1=${encodeURIComponent(nama1)}&name2=${encodeURIComponent(nama2)}&bg=${Math.floor(Math.random() * 6)}`, null, m, {
            type: 'image',
        })
        
        m.react('✅')
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *Gomen ne~* ✦\n\n> ${error.message}\n\n_Ai udah coba yang terbaik tapi gagal juga... coba lagi nanti ya~ 🌸_`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
