const axios = require('axios')
const config = require('../../config')
const { uploadToTmpFiles } = require('../../src/lib/sea')

const pluginConfig = {
    name: 'fakeff',
    alias: ['fakefreefire'],
    category: 'canvas',
    description: 'Membuat gambar ff',
    usage: '.fakeff <text>',
    example: '.fakeff Hai cantik',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const nama = m.text
    if(!nama) {
        return m.reply(`*FAKE FF*\n\n> Contoh: ${m.prefix}fakeff nama1`)
    }
    m.react('🕕')
    
    try {
        await sock.sendMedia(m.chat, `https://kazztzyy.my.id/api/maker/fakeff?text=${encodeURIComponent(nama)}&bg=${Math.floor(Math.random() * 60)}`, null, m, {
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
