const axios = require('axios')

const pluginConfig = {
    name: 'searchgd',
    alias: ['carigd', 'gdsearch', 'searchlevel'],
    category: 'search',
    description: 'Cari level Geometry Dash berdasarkan nama',
    usage: '.searchgd <nama level>',
    example: '.searchgd Bloodbath',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

const RESULT_LIMIT = 5

function fmtNum(n) {
    return (n ?? 0).toLocaleString('id-ID')
}

function levelLine(idx, lvl) {
    return (
        `┌─ *${idx}. ${lvl.name || 'Tanpa Nama'}*\n` +
        `│ 🆔 ID: ${lvl.id ?? '-'}\n` +
        `│ 👤 Author: ${lvl.author || '-'}\n` +
        `│ 🎯 Difficulty: ${lvl.difficulty || '-'}\n` +
        `│ ⭐ Stars: ${fmtNum(lvl.stars)}${lvl.featured ? ' 🌟 Featured' : ''}${lvl.epic ? ' 💫 Epic' : ''}\n` +
        `│ 📥 Downloads: ${fmtNum(lvl.downloads)}  👍 Likes: ${fmtNum(lvl.likes)}\n` +
        `│ 📏 Length: ${lvl.length || '-'}\n` +
        `│ 🎵 Song: ${lvl.songName || '-'}\n` +
        `└─────────────────\n`
    )
}

async function handler(m, { sock }) {
    const query = m.args.join(' ').trim()

    if (!query) {
        return m.reply(
            `『 🔍 *ᴄᴀʀɪ ʟᴇᴠᴇʟ ɢᴇᴏᴍᴇᴛʀʏ ᴅᴀsʜ* 🔍 』\n` +
            `✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦\n\n` +
            `✨ *Cara pakai:*\n` +
            `\`${m.prefix}searchgd <nama level>\`\n\n` +
            `💫 *Contoh:*\n` +
            `\`${m.prefix}searchgd Bloodbath\`\n\n` +
            `✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦\n` +
            `> 💖 いつき〜なかの✨ bantu cariin level GD-nya~ 🌸`
        )
    }

    m.react('⭐')

    try {
        const res = await axios.get(
            `https://gdbrowser.com/api/search/${encodeURIComponent(query)}`,
            { params: { count: RESULT_LIMIT }, timeout: 20000 }
        )

        const results = res.data

        if (!results || results === '-1' || !Array.isArray(results) || results.length === 0) {
            m.react('❌')
            return m.reply(
                `『 💔 *Tidak Ditemukan~* 』\n\n` +
                `> Level dengan kata kunci \`${query}\` gak ketemu nih~\n` +
                `> Coba kata kunci lain ya~ 💕`
            )
        }

        const levelList = results
            .slice(0, RESULT_LIMIT)
            .map((lvl, i) => levelLine(i + 1, lvl))
            .join('\n')

        const caption =
            `『 🌟 *ʜᴏsʜɪɴᴏ ᴀɪ* — ʜᴀsɪʟ ᴘᴇɴᴄᴀʀɪᴀɴ 🌟 』\n` +
            `✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦\n\n` +
            `🔍 *Kata kunci:* ${query}\n` +
            `📋 *Menampilkan:* ${Math.min(results.length, RESULT_LIMIT)} level\n\n` +
            levelList + '\n' +
            `💡 *Tips:* Pakai \`${m.prefix}levelgd <ID>\` buat lihat detail lengkap salah satu level di atas~\n\n` +
            `✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦\n` +
            `🌸 *Itsuki Nakano Bot* ✨\n` +
            `> 「 *推しの子* 」\n` +
            `> いつき〜なかの✨ selalu ada buat kamu~ 💖⭐`

        m.react('✅')
        await m.reply(caption)

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