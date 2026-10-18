const axios = require('axios')

const pluginConfig = {
    name: 'levelgd',
    alias: ['detailgd', 'gdlevel', 'infolevel'],
    category: 'stalker',
    description: 'Lihat detail lengkap sebuah level Geometry Dash',
    usage: '.levelgd <ID atau nama level>',
    example: '.levelgd Bloodbath',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

function fmtNum(n) {
    return (n ?? 0).toLocaleString('id-ID')
}

function isLevelId(query) {
    return /^\d+$/.test(query) || query.toLowerCase() === 'daily' || query.toLowerCase() === 'weekly'
}

async function fetchLevel(query) {
    if (isLevelId(query)) {
        const res = await axios.get(
            `https://gdbrowser.com/api/level/${encodeURIComponent(query)}`,
            { timeout: 20000 }
        )
        return res.data
    }

    // Bukan angka -> cari dulu berdasarkan nama, ambil hasil teratas
    const res = await axios.get(
        `https://gdbrowser.com/api/search/${encodeURIComponent(query)}`,
        { params: { count: 1 }, timeout: 20000 }
    )
    const results = res.data
    if (!results || results === '-1' || !Array.isArray(results) || results.length === 0) return null
    return results[0]
}

async function handler(m, { sock }) {
    const query = m.args.join(' ').trim()

    if (!query) {
        return m.reply(
            `『 📄 *ᴅᴇᴛᴀɪʟ ʟᴇᴠᴇʟ ɢᴇᴏᴍᴇᴛʀʏ ᴅᴀsʜ* 📄 』\n` +
            `✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦\n\n` +
            `✨ *Cara pakai:*\n` +
            `\`${m.prefix}levelgd <ID atau nama level>\`\n\n` +
            `💫 *Contoh:*\n` +
            `\`${m.prefix}levelgd Bloodbath\`\n` +
            `\`${m.prefix}levelgd 10565740\`\n` +
            `\`${m.prefix}levelgd daily\`\n\n` +
            `✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦\n` +
            `> 💖 いつき〜なかの✨ bongkar detail levelnya~ 🌸`
        )
    }

    m.react('⭐')

    try {
        const lvl = await fetchLevel(query)

        if (!lvl || lvl === '-1') {
            m.react('❌')
            return m.reply(
                `『 💔 *Tidak Ditemukan~* 』\n\n` +
                `> Level \`${query}\` gak ketemu nih~\n` +
                `> Cek lagi ID atau nama levelnya ya~ 💕`
            )
        }

        const songInfo = lvl.customSong && lvl.customSong !== 0
            ? `${lvl.songName || '-'} — ${lvl.songAuthor || '-'} (${lvl.songSize ? lvl.songSize + ' MB' : 'Custom'})`
            : `${lvl.songName || '-'} (Official Song)`

        const caption =
            `『 🌟 *ʜᴏsʜɪɴᴏ ᴀɪ* — ᴅᴇᴛᴀɪʟ ʟᴇᴠᴇʟ 🌟 』\n` +
            `✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦\n\n` +
            `🎮 *ɪɴꜰᴏ ᴜᴛᴀᴍᴀ*\n` +
            `┌─────────────────\n` +
            `│ 📛 *Nama:*       ${lvl.name || '-'}\n` +
            `│ 🆔 *ID:*         ${lvl.id ?? '-'}\n` +
            `│ 👤 *Author:*     ${lvl.author || '-'}\n` +
            `│ 🔑 *Author ID:*  ${lvl.authorID ?? '-'}\n` +
            `│ 🎯 *Difficulty:* ${lvl.difficulty || '-'}\n` +
            `│ 📏 *Length:*     ${lvl.length || '-'}\n` +
            `│ 🏷️ *Versi GD:*   ${lvl.gameVersion || '-'}\n` +
            `│ 🔄 *Update ke-:* ${lvl.version ?? '-'}\n` +
            `└─────────────────\n\n` +
            `📊 *sᴛᴀᴛɪsᴛɪᴋ*\n` +
            `┌─────────────────\n` +
            `│ ⭐ *Stars:*      ${fmtNum(lvl.stars)}\n` +
            `│ 🔮 *Orbs:*       ${fmtNum(lvl.orbs)}\n` +
            `│ 💎 *Diamonds:*   ${fmtNum(lvl.diamonds)}\n` +
            `│ 🪙 *User Coins:* ${fmtNum(lvl.coins)} ${lvl.verifiedCoins ? '✅ Verified' : ''}\n` +
            `│ 📥 *Downloads:*  ${fmtNum(lvl.downloads)}\n` +
            `│ 👍 *Likes:*      ${fmtNum(lvl.disliked ? '-' + fmtNum(Math.abs(lvl.likes)) : lvl.likes)}\n` +
            `│ 🧩 *Objects:*    ${fmtNum(lvl.objects)}${lvl.large ? ' (Large Level)' : ''}\n` +
            `│ 🎨 *Creator Pts:* ${fmtNum(lvl.cp)}\n` +
            `└─────────────────\n\n` +
            `🏅 *sᴛᴀᴛᴜs*\n` +
            `┌─────────────────\n` +
            `│ 🌟 *Featured:*    ${lvl.featured ? '✅ Ya' : '❌ Tidak'}\n` +
            `│ 💫 *Epic:*        ${lvl.epic ? '✅ Ya' : '❌ Tidak'}\n` +
            `│ ⭐ *Rated:*       ${lvl.stars > 0 ? '✅ Ya' : '❌ Belum'}\n` +
            `│ 👥 *Two Player:*  ${lvl.twoPlayer ? '✅ Ya' : '❌ Tidak'}\n` +
            `│ 🔓 *Password:*    ${lvl.password === 0 ? '🔒 Private' : lvl.password === 1 ? '🌐 Free Copy' : `🔑 ${lvl.password}`}\n` +
            (lvl.demonList ? `│ 💀 *Demon List:*  #${lvl.demonList} (Pointercrate)\n` : '') +
            (lvl.copiedID && lvl.copiedID !== 0 ? `│ 📋 *Copy dari ID:* ${lvl.copiedID}\n` : '') +
            `└─────────────────\n\n` +
            `🎵 *ʟᴀɢᴜ*\n` +
            `┌─────────────────\n` +
            `│ ${songInfo}\n` +
            `└─────────────────\n\n` +
            `📝 *ᴅᴇsᴋʀɪᴘsɪ*\n` +
            `> ${lvl.description ? lvl.description.slice(0, 200) : 'Tidak ada deskripsi~'}\n\n` +
            `🕐 *Diupload:* ${lvl.uploaded || '-'} lalu\n` +
            `🕑 *Diupdate:* ${lvl.updated || '-'} lalu\n\n` +
            `✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦\n` +
            `🌸 *Itsuki Nakano Bot* ✨\n` +
            `> 「 *推しの子* 」\n` +
            `> いつき〜なかの✨ selalu ada buat kamu~ 💖⭐`
            
            m.react('☑️')

if (lvl.difficultyFace) {
    const faceUrl = `https://gdbrowser.com/difficulty/${lvl.difficultyFace}.png`

    try {
        await sock.sendMessage(
            m.chat,
            {
                image: { url: faceUrl },
                caption
            },
            { quoted: m }
        )
        return
    } catch (e) {
        // fallback
    }
}

        await m.reply(caption)
        m.react('✅')

    } catch (error) {
        m.react('❌')
        m.reply(
            `『 💥 *E R R O R* 』\n\n` +
            `> ${error.message || 'Unknown error'}\n\n` +
            `> 💔 Maaf ya~ いつき〜なかの✨ gagal kali ini...\n` +
            `> Coba lagi nanti ya~ 🌸`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}