/**
 * ╭━━━🌸〔 ITSUKI CHAN 〕━━━⬣
 * ┃ Fitur: Edit Message ✨
 * ┃ Status: Active & Sparkling! 🎤
 * ╰━━━━━━━━━━━━━━━━━⬣
 */

const pluginConfig = {
    name: 'edit',
    alias: ['ubah', 'editmsg', 'magic'],
    category: 'tools',
    description: 'Mengubah kata-kata lama menjadi baru dengan keajaiban chan! ✨',
    usage: '.edit <teks baru> (balas pesan bot)',
    example: '.edit いつき〜なかの✨ sayang Senpai~',
    cooldown: 2, 
    isAdmin: true, 
    isEnabled: true
}

async function handler(m, { sock }) {
    try {
        // ✨ Mengambil teks baru dari panggung (chat)
        let teksBaru = m.body.split(' ').slice(1).join(' ')
        
        // ❌ Ups, teksnya ketinggalan di belakang panggung!
        if (!teksBaru) {
            return m.reply(
`╭━━━🌸〔 IDOL HINT 〕━━━⬣
┃ 🎤 *Senpai, mau いつき〜なかの✨ ubah jadi apa?*
┃ 📌 Caranya: Balas pesan いつき〜なかの✨, lalu ketik:
┃ ✨ .edit <teks baru kamu>
╰━━━━━━━━━━━━━━━━━⬣`
            )
        }

        // ❌ Senpai belum pilih pesan yang mau disulap!
        if (!m.quoted) {
            return m.reply(`✨ *Itsuki Nakano Magic*\n\n> Pilih (reply) pesan yang mau いつき〜なかの✨ ubah dulu ya, Senpai~ 🎤`)
        }

        // 🪄 PROSES KEAJAIBAN TERJADI!
        await sock.sendMessage(m.chat, {
            edit: m.quoted.key, // ID Pesan yang akan disulap ✨
            text: teksBaru      // Kata-kata baru yang indah 🎤
        })

    } catch (err) {
        console.error('[chan ERROR]', err)
        m.react('❌')
        m.reply(`❌ *Itsuki Nakano Error*\n\n> Duh, panggungnya goyang! ⚠️\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}