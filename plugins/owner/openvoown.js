const { downloadContentFromMessage } = require('itsuki')

const pluginConfig = {
    name: 'openvoown',
    alias: ['rvoown', 'voown'],
    category: 'owner',
    description: 'Membuka pesan 1x lihat dan mengirim ke PM owner',
    usage: '.openvoown (reply pesan 1x lihat)',
    example: '.openvoown',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock, config }) {
    const quoted = m.quoted

    if (!quoted) {
        await m.reply(
            `👁️ *Itsuki Nakano - View Once Opener*\n\n` +
            `Ara ara~ Kamu lupa reply pesan 1x lihatnya loh~\n` +
            `いつき〜なかの✨ gak bisa bantu kalau gitu ♡\n\n` +
            `*Cara pakai:*\n` +
            `Reply pesan 1x lihat lalu ketik *.openvoown*\n\n` +
            `> _"いつき〜なかの✨ loves you~!"_ ⭐`
        )
        return
    }

    const quotedMsg = quoted.message
    if (!quotedMsg) {
        await m.reply(
            `😢 *Itsuki Nakano Sedih...*\n\n` +
            `Fufu~ Sepertinya pesan itu sudah menghilang~\n` +
            `Mungkin sudah terlalu lama atau sudah dihapus pengirimnya~\n\n` +
            `> _"いつき〜なかの✨ loves you~!"_ ⭐`
        )
        return
    }

    const type = Object.keys(quotedMsg)[0]
    const content = quotedMsg[type]

    if (!content) {
        await m.reply(
            `😣 *Itsuki Nakano Bingung...*\n\n` +
            `Ufufu~ いつき〜なかの✨ sudah coba buka tapi isinya kosong~\n` +
            `Mungkin medianya sudah tidak tersedia lagi ♡\n\n` +
            `> _"いつき〜なかの✨ loves you~!"_ ⭐`
        )
        return
    }

    if (!content.viewOnce) {
        await m.reply(
            `👁️ *Ehh~ Ini Bukan Pesan 1x Lihat!*\n\n` +
            `Muu~ いつき〜なかの✨ hanya bisa buka pesan dengan ikon 1x lihat (👁️) ya~\n` +
            `Pastikan kamu reply pesan yang benar dulu~\n\n` +
            `> _"いつき〜なかの✨ loves you~!"_ ⭐`
        )
        return
    }

    await m.react('🕕')

    try {
        let mediaType = null
        if (type.includes('image')) mediaType = 'image'
        else if (type.includes('video')) mediaType = 'video'
        else if (type.includes('audio')) mediaType = 'audio'

        if (!mediaType) {
            await m.reply(
                `😓 *Itsuki Nakano Menyerah...*\n\n` +
                `Yah~ Tipe medianya gak いつき〜なかの✨ kenali~\n` +
                `いつき〜なかの✨ hanya support image, video, dan audio ya ♡\n\n` +
                `> _"いつき〜なかの✨ loves you~!"_ ⭐`
            )
            return
        }

        const stream = await downloadContentFromMessage(content, mediaType)

        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }

        if (!buffer || buffer.length < 100) {
            await m.reply(
                `💔 *Itsuki Nakano Gagal...*\n\n` +
                `Aduh~ Medianya sudah kadaluarsa senpai~\n` +
                `いつき〜なかの✨ sudah coba sekuat tenaga tapi gak bisa diunduh ♡\n\n` +
                `> _"いつき〜なかの✨ loves you~!"_ ⭐`
            )
            return
        }

        const ownerNumber = config.owner.number[0] + '@s.whatsapp.net'
        const senderJid = m.sender || m.chat
        const senderNumber = senderJid.split('@')[0]
        const isGroup = m.chat.endsWith('@g.us')
        const chatType = isGroup ? 'Grup' : 'Private Chat'
        const mediaCaption = content.caption || null
        const now = new Date().toLocaleString('id-ID', {
            timeZone: 'Asia/Jakarta',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })

        const mediaLabel =
            mediaType === 'image' ? '🖼️ Foto' :
            mediaType === 'video' ? '🎥 Video' :
            '🎵 Audio'

        const caption =
            `👁️⭐ *Itsuki Nakano - Laporan View Once*\n\n` +
            `Psst~ いつき〜なかの✨ berhasil intip pesan rahasianya~\n` +
            `Ufufu~ Rahasia terbongkar deh ♡\n\n` +
            `*Detail Pesan:*\n` +
            `👤 *Pengirim:* @${senderNumber}\n` +
            `💬 *Tipe Chat:* ${chatType}\n` +
            `🆔 *Chat ID:* ${m.chat}\n` +
            `📁 *Tipe Media:* ${mediaLabel}\n` +
            `📝 *Caption:* ${mediaCaption ? mediaCaption : '_Tidak ada caption_'}\n` +
            `📦 *Ukuran:* ${(buffer.length / 1024).toFixed(1)} KB\n` +
            `🕐 *Waktu:* ${now}\n\n` +
            `> _"Tidak ada rahasia yang bisa disembunyikan dari いつき〜なかの✨~"_ ⭐`

        if (mediaType === 'image') {
            await sock.sendMedia(ownerNumber, buffer, caption, null, {
                type: 'image',
                mentions: [senderJid]
            })
        } else if (mediaType === 'video') {
            await sock.sendMedia(ownerNumber, buffer, caption, null, {
                type: 'video',
                mentions: [senderJid]
            })
        } else if (mediaType === 'audio') {
            await sock.sendMedia(ownerNumber, buffer, null, null, {
                type: 'audio',
                mimetype: 'audio/mpeg',
                ptt: true
            })
            await sock.sendMessage(ownerNumber, {
                text: caption,
                mentions: [senderJid]
            })
        }

        await m.react('✅')
        await m.reply(
            `✨ *Ufufu~ Berhasil~!*\n\n` +
            `いつき〜なかの✨ sudah kirim pesan 1x lihatnya ke PM owner~\n` +
            `Rahasia terbongkar deh ♡\n\n` +
            `Jangan bilang siapa-siapa ya~ 🤫\n\n` +
            `> _"いつき〜なかの✨ loves you~!"_ ⭐`
        )

    } catch (error) {
        await m.react('❌')
        await m.reply(
            `😭 *Itsuki Nakano Gagal...*\n\n` +
            `Muu~ いつき〜なかの✨ sudah coba sekuat tenaga tapi ada yang salah~\n` +
            `Maaf ya senpai ♡\n\n` +
            `*Error:* _${error.message}_\n\n` +
            `> _"いつき〜なかの✨ loves you~!"_ ⭐`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}