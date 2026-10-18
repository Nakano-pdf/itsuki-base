const config = require('../../config')

const pluginConfig = {
    name: 'absen',
    alias: ['hadir', 'present'],
    category: 'group',
    description: 'Tandai kehadiran di sesi absen',
    usage: '.absen',
    example: '.absen',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

if (!global.absensi) global.absensi = {}

async function handler(m, { sock }) {
    const chatId = m.chat

    if (!global.absensi[chatId]) {
        return m.reply(
`╭━━━〔 🌸 ITSUKI CHAN ABSEN 🌸 〕━━━⬣
┃ ❌ *Sesi absen belum dimulai~*
┃
┃ 💬 Silakan hubungi admin yaa~
┃ ✨ Gunakan:
┃ ➤ *.mulaiabsen [keterangan]*
╰━━━━━━━━━━━━━━━━⬣`
        )
    }

    const absen = global.absensi[chatId]

    if (!absen.data) absen.data = {}
    if (!absen.peserta) absen.peserta = []

    // 🔥 AMBIL NAMA WA (FIX)
    let senderName = m.pushName || await sock.getName(m.sender)

    if (!senderName || senderName === m.sender) {
        senderName = m.sender.split('@')[0]
    }

    senderName = senderName.trim()

    // cek sudah absen
    if (absen.peserta.includes(m.sender)) {
        return m.reply(
`╭━━━〔 ⚠️ ABSEN DETECTED ⚠️ 〕━━━⬣
┃ 💢 Kamu sudah absen sebelumnya!
┃ 🌸 Jangan curang yaa~
╰━━━━━━━━━━━━━━━━⬣`
        )
    }

    // simpan
    absen.peserta.push(m.sender)
    absen.data[m.sender] = senderName

    const moment = require('moment-timezone')
    const now = moment().tz('Asia/Jakarta')

    const dateStr = now.format('dddd, D MMMM YYYY')
    const timeStr = now.format('HH:mm:ss')

    // 🔥 LIST NAMA (NO NOMOR)
    const list = absen.peserta.map((jid, i) => {
        const name = absen.data?.[jid] || 'User'
        return `┃ ${i + 1}. ${name}`
    }).join('\n')

    await m.reply(
`╭━━━〔 🌸 ITSUKI CHAN ABSEN 🌸 〕━━━⬣
┃ 🎤 *${senderName} hadir, yay~!*
┃
┃ 💖 *Tujuan:* ${absen.keterangan}
┃
┣━━━〔 📋 INFO 〕━━━⬣
┃ 📅 ${dateStr}
┃ ⏰ ${timeStr}
┃ 👥 Total Hadir: ${absen.peserta.length} orang
┃
┣━━━〔 📝 DAFTAR HADIR 〕━━━⬣
${list}
┃
╰━━━〔 🌟 NOTE 〕━━━⬣
> ✨ Ketik *${m.prefix}absen* untuk hadir
> 📊 Ketik *${m.prefix}cekabsen* untuk melihat daftar
`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}