const axios = require('axios')

const pluginConfig = {
    name: 'stalkgd',
    alias: ['gdstalk', 'gdprofile'],
    category: 'stalker',
    description: 'Stalk profil player Geometry Dash',
    usage: '.stalkgd <username>',
    example: '.stalkgd AlwaysTeam',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

const MODERATOR_LABEL = { 0: '❌ Bukan Moderator', 1: '🛡️ Moderator', 2: '👑 Elder Moderator' }
const PRIVACY_LABEL = {
    all: '🌐 Publik',
    friends: '👥 Hanya Teman',
    off: '🔒 Nonaktif'
}

function privacyText(value) {
    if (value === 'all') return PRIVACY_LABEL.all
    if (value === 'friends') return PRIVACY_LABEL.friends
    return PRIVACY_LABEL.off
}

function iconLine(label, value) {
    return value !== undefined && value !== null ? `│ ${label} ${value}\n` : ''
}

function buildIconUrl(p) {
    const params = new URLSearchParams({
        form: 'cube',
        icon: p.icon ?? 1,
        col1: p.col1 ?? 0,
        col2: p.col2 ?? 3,
        glow: p.glow ? '1' : '0'
    })
    return `https://gdbrowser.com/icon/icon.png?${params.toString()}`
}

async function handler(m, { sock }) {
    const username = m.args[0]

    if (!username) {
        return m.reply(
            `『 🎮 *sᴛᴀʟᴋ ɢᴇᴏᴍᴇᴛʀʏ ᴅᴀsʜ* 🎮 』\n` +
            `✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦\n\n` +
            `✨ *Cara pakai:*\n` +
            `\`${m.prefix}stalkgd <username>\`\n\n` +
            `💫 *Contoh:*\n` +
            `\`${m.prefix}stalkgd AlwaysTeam\`\n\n` +
            `✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦\n` +
            `> 💖 いつき〜なかの✨ siap cek profil GD kamu~ 🌸`
        )
    }

    m.react('⭐')

    try {
        const res = await axios.get(
            `https://gdbrowser.com/api/profile/${encodeURIComponent(username)}`,
            { timeout: 20000 }
        )

        if (!res.data || res.data === '-1') {
            m.react('❌')
            return m.reply(
                `『 💔 *Tidak Ditemukan~* 』\n\n` +
                `> Player \`${username}\` tidak ditemukan nih~\n` +
                `> Cek lagi username-nya ya~ 💕`
            )
        }

        const p = res.data

        const iconGamemodes =
            iconLine('🧊 *Cube:*', p.icon) +
            iconLine('🚀 *Ship:*', p.ship) +
            iconLine('⚽ *Ball:*', p.ball) +
            iconLine('🛸 *UFO:*', p.ufo) +
            iconLine('🌊 *Wave:*', p.wave) +
            iconLine('🤖 *Robot:*', p.robot) +
            iconLine('🕷️ *Spider:*', p.spider)

        const caption =
            `『 🌟 *ʜᴏsʜɪɴᴏ ᴀɪ* — ɢᴇᴏᴍᴇᴛʀʏ ᴅᴀsʜ 🌟 』\n` +
            `✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦\n\n` +
            `🎮 *ᴘʀᴏꜰɪʟ ᴘʟᴀʏᴇʀ*\n` +
            `┌─────────────────\n` +
            `│ 👤 *Username:*   ${p.username || '-'}\n` +
            `│ 🆔 *Player ID:*  ${p.playerID || '-'}\n` +
            `│ 🔑 *Account ID:* ${p.accountID || '-'}\n` +
            `│ 🏆 *Global Rank:* ${p.rank ? '#' + p.rank.toLocaleString('id-ID') : 'Unranked'}\n` +
            `│ 🛡️ *Status:*     ${MODERATOR_LABEL[p.moderator] || MODERATOR_LABEL[0]}\n` +
            `└─────────────────\n\n` +
            `📊 *sᴛᴀᴛɪsᴛɪᴋ*\n` +
            `┌─────────────────\n` +
            `│ ⭐ *Stars:*      ${p.stars?.toLocaleString('id-ID') || '0'}\n` +
            `│ 💎 *Diamonds:*   ${p.diamonds?.toLocaleString('id-ID') || '0'}\n` +
            `│ 🌙 *Moons:*      ${p.moons?.toLocaleString('id-ID') || '0'}\n` +
            `│ 😈 *Demons:*     ${p.demons?.toLocaleString('id-ID') || '0'}\n` +
            `│ 🪙 *Coins:*      ${p.coins?.toLocaleString('id-ID') || '0'}\n` +
            `│ 🔮 *User Coins:* ${p.userCoins?.toLocaleString('id-ID') || '0'}\n` +
            `│ 🎨 *Creator Points:* ${p.cp?.toLocaleString('id-ID') || '0'}\n` +
            `└─────────────────\n\n` +
            `🕹️ *ɪᴄᴏɴ sᴇᴛɪᴀᴘ ɢᴀᴍᴇᴍᴏᴅᴇ*\n` +
            `┌─────────────────\n` +
            iconGamemodes +
            `│ 🟣 *Color 1:*  ${p.col1 ?? '-'}\n` +
            `│ 🟡 *Color 2:*  ${p.col2 ?? '-'}\n` +
            `│ ✨ *Glow:*     ${p.glow ? '✅ Ya' : '❌ Tidak'}\n` +
            `│ 💀 *Death FX:* ${p.deathEffect ?? '-'}\n` +
            `└─────────────────\n\n` +
            `🔐 *ᴘᴇɴɢᴀᴛᴜʀᴀɴ ᴘʀɪᴠᴀsɪ*\n` +
            `┌─────────────────\n` +
            `│ 💬 *Pesan (DM):*      ${privacyText(p.messages)}\n` +
            `│ 📜 *Riwayat Komentar:* ${privacyText(p.commentHistory)}\n` +
            `│ 🤝 *Permintaan Teman:* ${privacyText(p.friendRequests)}\n` +
            `└─────────────────\n\n` +
            (p.youtube || p.twitter || p.twitch ? (
                `🔗 *sᴏsɪᴀʟ ᴍᴇᴅɪᴀ*\n` +
                `┌─────────────────\n` +
                (p.youtube ? `│ 📺 *YouTube:* https://youtube.com/channel/${p.youtube}\n` : '') +
                (p.twitter ? `│ 🐦 *Twitter:* https://twitter.com/${p.twitter}\n` : '') +
                (p.twitch  ? `│ 🟣 *Twitch:*  https://twitch.tv/${p.twitch}\n` : '') +
                `└─────────────────\n\n`
            ) : '') +
            `🌐 *Profil Lengkap:*\n` +
            `https://gdbrowser.com/u/${encodeURIComponent(p.username || username)}\n\n` +
            `✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦\n` +
            `🌸 *Itsuki Nakano Bot* ✨\n` +
            `> 「 *推しの子* 」\n` +
            `> いつき〜なかの✨ selalu ada buat kamu~ 💖⭐`

        m.react('✅')

        const iconUrl = buildIconUrl(p)

        try {
            await sock.sendMessage(
                m.chat,
                { image: { url: iconUrl }, caption },
                { quoted: m }
            )
        } catch (imgErr) {
            // Kalau render icon gagal, tetap kirim teksnya aja
            await m.reply(caption)
        }

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