// ✦━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━✦
// 🌟 Itsuki Nakano - Lonjong Image Magic
// ✦━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━✦

const fs = require('fs')
const path = require('path')
const Jimp = require('jimp')

const pluginConfig = {
    name: 'lonjong',
    alias: ['stretch', 'melar'],
    category: 'tools',
    description: '✨ いつき〜なかの✨ akan mengubah gambarmu jadi tinggi elegan~',
    usage: '.lonjong (reply gambar)',
    example: '.lonjong',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')

    // ❌ Tidak ada gambar
    if (!isImage) {
        return m.reply(
`🎤 *Itsuki Nakano Stage Notice~*

Hmm~ kamu mau いつき〜なかの✨ sulap apa nih? 💫  
Coba reply *gambar* dulu ya~

✨ Gunakan:
> \`.lonjong\`

Nanti いつき〜なかの✨ bikin gambarnya jadi lebih... *tinggi dan menarik perhatian~* ♡`
        )
    }

    await m.react('✨')

    let buffer
    try {
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download()
        } else if (m.isMedia) {
            buffer = await m.download()
        } else {
            throw new Error('いつき〜なかの✨ tidak bisa melihat gambarnya...')
        }
    } catch (e) {
        await m.react('❌')
        return m.reply(
`💔 *いつき〜なかの✨ sedikit sedih...*

Aku gagal ambil gambarnya 😢  
> ${e.message}`
        )
    }

    try {
        const image = await Jimp.read(buffer)

        const oldWidth = image.bitmap.width
        const oldHeight = image.bitmap.height

        const newHeight = Math.floor(oldHeight * 2)

        // ✨ Stretch vertikal
        image.resize(oldWidth, newHeight)

        const outBuffer = await image.getBufferAsync(Jimp.MIME_PNG)

        const caption =
`╭━━━〔 🌟 AI TRANSFORMATION 〕━━━╮
┃ 🎤 chan: Itsuki Nakano
┃ 📸 Status: *Berhasil~*
┃
┃ 📏 Tinggi Asli : ${oldHeight}px
┃ 📏 Tinggi Baru : ${newHeight}px
┃
┃ "Lihat kan...? Bahkan gambar pun
┃  bisa bersinar di panggung~"
╰━━━━━━━━━━━━━━━━━━━━━━━╯

💖 Jangan berhenti kirim karya ya~`

        await m.react('💖')

        await sock.sendMessage(m.chat, {
            image: outBuffer,
            caption
        }, { quoted: m })

    } catch (e) {
        console.error(e)
        await m.react('❌')
        return m.reply(
`💔 *Oops... いつき〜なかの✨ melakukan kesalahan*

Sepertinya transformasinya gagal 😣  
Coba lagi ya?

> "chan juga bisa gagal... tapi tetap tersenyum~"`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}