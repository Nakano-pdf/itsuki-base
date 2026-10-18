const relay = require('../../src/lib/fixkit/relay')
const ui = require('../../src/lib/fixkit/ui')
const { argText, splitPipe, toJid } = require('../../src/lib/fixkit/args')

const pluginConfig = {
    name: 'relay',
    alias: ['teruskan', 'forwardchat'],
    category: 'owner',
    description: 'Teruskan otomatis semua pesan dari satu chat ke chat lain (relay)',
    usage: '.relay add <dari|here> | <ke> · .relay list · .relay on|off <id> · .relay del <id> · .relay test <id>',
    example: '.relay add here | 120363xxxxxx@g.us',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 2,
    energi: 0,
    isEnabled: true,
}

const HELP = `🔁 *RELAY*

> \`.relay add <dari|here> | <ke>\` — teruskan semua pesan dari chat *dari* ke chat *ke*
> \`.relay list\` — lihat aturan
> \`.relay on <id>\` / \`.relay off <id>\` — aktif / nonaktif
> \`.relay del <id>\` — hapus aturan
> \`.relay test <id>\` — kirim pesan uji ke tujuan

Tujuan bisa nomor (628xxx), jid, atau ID grup (xxx@g.us).`

async function handler(m, { sock }) {
    const text = argText(m)
    const sub = (text.split(/\s+/)[0] || '').toLowerCase()
    const rest = text.slice(sub.length).trim()
    const reply = (body, buttons = []) => ui.sendPanel(sock, m.chat, {
        title: '🔁 RELAY', body, quoted: m, senderJid: m.sender,
        buttons: buttons.length ? buttons : [{ type: 'reply', text: '📋 Daftar Relay', id: '.relay list' }, { type: 'reply', text: '🏠 Menu Fixkit', id: '.fixkit' }],
    })

    if (!sub) return m.reply(HELP)

    if (sub === 'add') {
        const [fromRaw, toRaw] = splitPipe(rest)
        const from = toJid(fromRaw, m.chat)
        const to = toJid(toRaw, null)
        if (!from || !to) return m.reply('❌ Format: `.relay add <dari|here> | <ke>`')
        if (from === to) return m.reply('❌ Asal dan tujuan tidak boleh sama.')
        const rule = relay.addRule({ from, to })
        return reply(`✅ Relay #${rule.id} dibuat.\n\n*Dari:* ${from}\n*Ke:* ${to}`, [
            { type: 'reply', text: '🧪 Tes', id: `.relay test ${rule.id}` },
            { type: 'reply', text: '⛔ Nonaktifkan', id: `.relay off ${rule.id}` },
            { type: 'reply', text: '📋 Daftar Relay', id: '.relay list' },
        ])
    }

    if (sub === 'list') {
        const rules = relay.store.getRelays()
        if (!rules.length) return reply('Belum ada aturan relay. Buat dengan `.relay add here | <ke>`.')
        const body = rules.map(r =>
            `#${r.id} ${r.active ? '🟢' : '⚪'} ${r.from} → ${r.to}\n   terkirim: ${r.count || 0}${r.lastError ? ' · error: ' + String(r.lastError).slice(0, 60) : ''}`
        ).join('\n')
        return reply(body)
    }

    if (sub === 'on' || sub === 'off') {
        const id = parseInt(rest, 10)
        const r = relay.setActive(id, sub === 'on')
        if (!r) return m.reply(`❌ Relay #${rest} tidak ditemukan.`)
        return reply(`Relay #${r.id} sekarang *${r.active ? 'AKTIF' : 'NONAKTIF'}*.`)
    }

    if (sub === 'del' || sub === 'hapus') {
        const ok = relay.deleteRule(parseInt(rest, 10))
        return reply(ok ? `🗑 Relay #${rest} dihapus.` : `❌ Relay #${rest} tidak ditemukan.`)
    }

    if (sub === 'test') {
        const rule = relay.store.getRelays().find(r => r.id === parseInt(rest, 10))
        if (!rule) return m.reply(`❌ Relay #${rest} tidak ditemukan.`)
        try {
            await sock.sendMessage(rule.to, { text: `${relay.LOOP_GUARD_TAG} Tes relay #${rule.id} dari ${m.pushName || 'owner'} ✨` })
            return reply(`✅ Pesan uji terkirim ke ${rule.to}.`)
        } catch (e) {
            return reply(`❌ Gagal kirim tes: ${e.message}`)
        }
    }

    return m.reply(HELP)
}

module.exports = { config: pluginConfig, handler }
