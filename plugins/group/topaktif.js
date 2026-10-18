const fs = require('fs')
const path = require('path')

// ===== CONFIG =====
const pluginConfig = {
    name: 'topaktif',
    alias: ['topactive', 'leaderboard'],
    category: 'group',
    description: 'Menampilkan user paling aktif di grup',
    usage: '.topaktif',
    cooldown: 5,
    energi: 1,
    isGroup: true,
    isAdmin: false
}

// ===== HANDLER =====
async function handler(m, { sock }) {
    try {
        const jid = m.chat

        // BACA DATA DARI DATABASE YANG SUDAH DIHITUNG DI HANDLER.JS
        const DB_PATH = path.join(__dirname, '../../database/other/topaktif.json')
        if (!fs.existsSync(DB_PATH)) return m.reply('Belum ada aktivitas di grup ini 😅')

        const db = JSON.parse(fs.readFileSync(DB_PATH))
        const data = db[jid] || {}
        
        const entries = Object.entries(data)
        if (!entries.length) return m.reply('Belum ada aktivitas di grup ini 😅')

        const sorted = entries.sort((a,b) => b[1] - a[1]).slice(0, 10)
        
        let reply = `╭───〔 🎤 *I T S U K I* 〕───⬡
┃ 🌸 *TOP ACTIVE USERS*
╰───────────────────────⬡\n\n`

        sorted.forEach(([jidUser, count], i) => {
            let nomor = jidUser.split('@')[0]
            let rank = i + 1
            let icon = '🔹'
            if (rank === 1) icon = '👑'
            if (rank === 2) icon = '🥈'
            if (rank === 3) icon = '🥉'

            reply += `${icon} *#${rank} @${nomor}
   └─💬 ${count} Pesan\n`
        })

        reply += `\n╭───────────────────────⬡
┃ ✨ Itsuki Nakano chan
╰───────────────────────⬡`
        
        return m.reply(reply, { mentions: sorted.map(v => v[0]) })
        
    } catch (err) {
        console.error('[TOPAKTIF ERROR]', err)
    }
}

// ===== EXPORT =====
module.exports = {
    config: pluginConfig,
    handler
}