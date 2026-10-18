/**
✧ Name    : itsukiai
✧ Alias   : itsukiaisetting
✧ Category: itsukiai
✧ Deskripsi: Nyalakan/matikan balasan otomatis Itsuki AI di grup, dan reset memori.
**/

const ai = require('../../src/lib/itsukiai')

const pluginConfig = {
    name: 'itsukiai',
    alias: ['itsukiaisetting'],
    category: 'itsukiai',
    description: 'On/off balasan otomatis Itsuki AI dan reset memori',
    usage: '.itsukiai <on|off|status|private on|private off|reset>',
    example: '.itsukiai on',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

async function handler(m) {
    const args = (m.text || '').trim().toLowerCase().split(/\s+/).filter(Boolean)
    const sub = args[0] || 'status'

    // reset memori boleh untuk semua user, untuk dirinya sendiri
    if (sub === 'reset') {
        ai.clearMemory(m.sender)
        return m.reply('🌸 Memori percakapanmu sudah dihapus. Kita mulai dari awal lagi ya~ 🦋')
    }

    if (sub === 'status') {
        const s = ai.getSettings()
        const here = m.isGroup ? (s.groups[m.chat] ? 'ON 🍥' : 'OFF 🍡') : (s.privateEnabled ? 'ON 🍥' : 'OFF 🍡')
        return m.reply(
            `🦋 *ɪᴛsᴜᴋɪ ᴀɪ*\n\n` +
            `> Status di chat ini: ${here}\n` +
            `> Balasan privat: ${s.privateEnabled ? 'ON' : 'OFF'}\n\n` +
            `*ᴄᴀʀᴀ ᴘᴀᴋᴀɪ:*\n` +
            `> Panggil "itsuki" atau reply/tag bot di grup\n` +
            `> ${m.prefix}itsuki <pesan> untuk chat langsung\n` +
            `> ${m.prefix}itsukiai reset untuk hapus memori`
        )
    }

    if (sub === 'private') {
        if (!m.isOwner) return m.reply('🔒 Pengaturan balasan privat hanya untuk owner.')
        const on = args[1] === 'on'
        if (args[1] !== 'on' && args[1] !== 'off') return m.reply(`> Pakai: ${m.prefix}itsukiai private on|off`)
        ai.setPrivateEnabled(on)
        return m.reply(`🦋 Balasan privat Itsuki AI sekarang *${on ? 'ON' : 'OFF'}*.`)
    }

    if (sub === 'on' || sub === 'off') {
        if (!m.isGroup) return m.reply(`> Di chat privat, pakai ${m.prefix}itsukiai private on|off (khusus owner).`)
        if (!m.isAdmin && !m.isOwner) return m.reply('🔒 Hanya admin grup atau owner yang bisa mengatur ini.')
        const on = sub === 'on'
        ai.setGroupEnabled(m.chat, on)
        return m.reply(on
            ? '🍥 Itsuki AI aktif di grup ini~ Panggil "itsuki" atau reply aku ya 🦋'
            : '🍡 Itsuki AI dinonaktifkan di grup ini. Sampai jumpa lagi~ 🌸')
    }

    return m.reply(`> Pakai: ${m.prefix}itsukiai <on|off|status|reset>`)
}

module.exports = {
    config: pluginConfig,
    handler
}
