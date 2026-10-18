const path = require('path')
const { listAssets } = require('../../src/lib/assetManager')
const config = require('../../config')

const pluginConfig = {
    name: 'sendasset',
    alias: ['assetbrowser', 'sendassets', 'browseasset'],
    category: 'owner',
    description: 'Asset browser & sender — lihat/kirim asset dari URL di config.assets',
    usage: '.sendasset [kategori] [keyword/key]',
    example: '.sendasset images itsuki',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

const MAX_SEND = 10

function getCategories() {
    return Object.keys(config.assets || {})
}

function getEntries(category) {
    return listAssets()
        .filter(a => a.key.startsWith(category + '.'))
        .map(a => ({ name: a.key.slice(category.length + 1), key: a.key, url: a.url }))
        .sort((a, b) => a.name.localeCompare(b.name))
}

function detectMsgType(url, category) {
    const ext = path.extname((url || '').split('?')[0]).toLowerCase()
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) return 'image'
    if (['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext)) return 'video'
    if (['.mp3', '.ogg', '.aac', '.m4a', '.wav'].includes(ext)) return 'audio'
    if (category === 'images' || category === 'templates') return 'image'
    if (category === 'video') return 'video'
    if (category === 'audio') return 'audio'
    return 'document'
}

async function sendEntry(sock, chat, entry, category, quoted) {
    const type = detectMsgType(entry.url, category)
    const caption = `🌸 *config.assets.${entry.key}*\n> ${entry.url}`
    if (type === 'document') {
        return sock.sendMessage(chat, {
            document: { url: entry.url },
            fileName: entry.name + (path.extname(entry.url.split('?')[0]) || ''),
            mimetype: 'application/octet-stream',
            caption
        }, { quoted })
    }
    if (type === 'audio') {
        return sock.sendMessage(chat, { audio: { url: entry.url }, mimetype: 'audio/mpeg' }, { quoted })
    }
    return sock.sendMessage(chat, { [type]: { url: entry.url }, caption }, { quoted })
}

async function handler(m, { sock }) {
    const categories = getCategories()
    const [kategoriArg, ...rest] = m.args
    const keyword = rest.join(' ').trim().toLowerCase()

    // ── Tanpa kategori → ringkasan semua kategori ─────────────────────────
    if (!kategoriArg) {
        const all = listAssets()
        const lines = categories.map(cat => {
            const items = all.filter(a => a.key.startsWith(cat + '.'))
            const filled = items.filter(a => a.url).length
            return `┃ 📁 \`${cat}\` — ${filled}/${items.length} terisi`
        }).join('\n')
        return m.reply(
            `📂 *ᴀssᴇᴛ ʙʀᴏᴡsᴇʀ*\n\n` +
            `╭┈┈⬡「 config.assets 」\n${lines || '┃ (kosong)'}\n╰┈┈⬡\n\n` +
            `> \`${m.prefix}sendasset <kategori>\` buat lihat isinya\n` +
            `> \`${m.prefix}sendasset <kategori> <keyword>\` buat kirim asset-nya 🌸`
        )
    }

    const category = kategoriArg.toLowerCase()
    if (!categories.includes(category)) {
        return m.reply(
            `🌸 *Hmm~ Kategori nggak ada*\n\n> Kategori tersedia:\n` +
            categories.map(c => `> \`${c}\``).join('\n')
        )
    }

    const entries = getEntries(category)

    // ── Kategori doang → daftar key ───────────────────────────────────────
    if (!keyword) {
        if (!entries.length) return m.reply(`🌸 Kategori \`${category}\` masih kosong nih~`)
        const list = entries.map(e => `┃ ${e.url ? '✅' : '⬜'} \`${e.name}\``).join('\n')
        return m.reply(
            `📁 *config.assets.${category}* (${entries.length} key)\n\n` +
            `╭┈┈⬡\n${list}\n╰┈┈⬡\n\n` +
            `> ✅ = URL terisi, ⬜ = masih kosong\n` +
            `> \`${m.prefix}sendasset ${category} <keyword>\` buat kirim 💖`
        )
    }

    // ── Kirim: exact match dulu, lalu keyword ─────────────────────────────
    let matched = entries.filter(e => e.name.toLowerCase() === keyword)
    if (!matched.length) matched = entries.filter(e => e.name.toLowerCase().includes(keyword))
    matched = matched.filter(e => e.url)

    if (!matched.length) {
        return m.reply(`🌸 Nggak ada asset \`${keyword}\` yang URL-nya terisi di \`${category}\`~`)
    }

    const toSend = matched.slice(0, MAX_SEND)
    await m.react('🕕')
    let ok = 0
    for (const entry of toSend) {
        try {
            await sendEntry(sock, m.chat, entry, category, m)
            ok++
        } catch (e) {
            await m.reply(`❌ Gagal kirim \`${entry.name}\`: ${e.message}`)
        }
    }
    await m.react(ok ? '✅' : '❌')
    if (matched.length > MAX_SEND) {
        await m.reply(`> Ada ${matched.length} hasil, いつき〜なかの✨ kirim ${MAX_SEND} pertama aja ya~ Perjelas keyword-nya 🌸`)
    }
}

// Tetap diekspor karena handler.js mendaftarkannya; sekarang nggak ada alur konfirmasi lagi.
async function answerHandler() {
    return false
}

module.exports = {
    config: pluginConfig,
    handler,
    answerHandler
}
