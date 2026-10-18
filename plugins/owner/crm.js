const store = require('../../src/lib/fixkit/store')
const ui = require('../../src/lib/fixkit/ui')
const { argText, splitPipe, toJid } = require('../../src/lib/fixkit/args')

const pluginConfig = {
    name: 'crm',
    alias: ['kontak', 'pelanggan'],
    category: 'owner',
    description: 'CRM sederhana: simpan kontak pelanggan, tag, catatan, cari, dan ekspor',
    usage: '.crm add <nomor> | <nama> | [tag1,tag2] | [catatan]\n.crm list [tag] | cari <kata> | lihat <nomor> | note <nomor> | <teks>\n.crm tag <nomor> | <tag> | hapus <nomor> | export',
    example: '.crm add 6281234567890 | Budi | vip,reseller | Langganan bulanan',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 2,
    energi: 0,
    isEnabled: true,
}

const HELP = `📇 *CRM*

> \`.crm add <nomor> | <nama> | [tag,tag] | [catatan]\`
> \`.crm list [tag]\` · \`.crm cari <kata>\` · \`.crm lihat <nomor>\`
> \`.crm note <nomor> | <catatan>\` · \`.crm tag <nomor> | <tag>\`
> \`.crm hapus <nomor>\` · \`.crm export\``

const digits = v => String(v || '').replace(/[^0-9]/g, '')
const now = () => new Date().toISOString()

function fmt(c) {
    return [
        `*${c.name}* (${c.number})`,
        c.tags.length ? `🏷 ${c.tags.join(', ')}` : '',
        c.note ? `📝 ${c.note}` : '',
        `🕒 ${c.updatedAt.slice(0, 10)}`,
    ].filter(Boolean).join('\n')
}

async function handler(m, { sock }) {
    const text = argText(m)
    const sub = (text.split(/\s+/)[0] || '').toLowerCase()
    const rest = text.slice(sub.length).trim()
    const all = store.getCrm()
    const reply = (body, buttons = []) => ui.sendPanel(sock, m.chat, {
        title: '📇 CRM', body, quoted: m, senderJid: m.sender,
        buttons: buttons.length ? buttons : [{ type: 'reply', text: '📋 Daftar', id: '.crm list' }, { type: 'reply', text: '🏠 Menu Fixkit', id: '.fixkit' }],
    })

    if (!sub) return m.reply(HELP)

    if (sub === 'add') {
        const [num, name, tagsRaw = '', note = ''] = splitPipe(rest)
        const n = digits(num)
        if (!n || !name) return m.reply('❌ Format: `.crm add <nomor> | <nama> | [tag] | [catatan]`')
        const existed = all[n]
        all[n] = {
            number: n,
            name,
            tags: tagsRaw ? tagsRaw.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : (existed?.tags || []),
            note: note || existed?.note || '',
            createdAt: existed?.createdAt || now(),
            updatedAt: now(),
        }
        store.saveCrm(all)
        return reply(`${existed ? '✏️ Kontak diperbarui' : '✅ Kontak ditambahkan'}\n\n${fmt(all[n])}`, [
            { type: 'reply', text: '👁 Lihat', id: `.crm lihat ${n}` },
            { type: 'reply', text: '📋 Daftar', id: '.crm list' },
        ])
    }

    if (sub === 'list' || sub === 'daftar') {
        const tag = rest.toLowerCase()
        const list = Object.values(all).filter(c => !tag || c.tags.includes(tag))
        if (!list.length) return reply(tag ? `Tidak ada kontak dengan tag *${tag}*.` : 'Belum ada kontak. Tambah dengan `.crm add`.')
        const body = list.slice(0, 30).map((c, i) => `${i + 1}. ${c.name} — ${c.number}${c.tags.length ? ' [' + c.tags.join(',') + ']' : ''}`).join('\n')
        return reply(`Total: ${list.length}${tag ? ` (tag: ${tag})` : ''}\n\n${body}${list.length > 30 ? '\n…dan lainnya' : ''}`)
    }

    if (sub === 'cari' || sub === 'search') {
        const q = rest.toLowerCase()
        if (!q) return m.reply('❌ Contoh: `.crm cari budi`')
        const hit = Object.values(all).filter(c => c.name.toLowerCase().includes(q) || c.number.includes(q) || c.note.toLowerCase().includes(q))
        if (!hit.length) return reply(`Tidak ada hasil untuk *${q}*.`)
        return reply(hit.slice(0, 15).map(fmt).join('\n\n'))
    }

    if (sub === 'lihat' || sub === 'view') {
        const c = all[digits(rest)]
        if (!c) return reply('Kontak tidak ditemukan.')
        const wa = toJid(c.number)
        return reply(fmt(c), [
            { type: 'url', text: '💬 Chat WhatsApp', url: `https://wa.me/${c.number}` },
            { type: 'reply', text: '📝 Tambah Catatan', id: `.crm note ${c.number} | ` },
            { type: 'reply', text: '🗑 Hapus', id: `.crm hapus ${c.number}` },
        ])
    }

    if (sub === 'note' || sub === 'catatan') {
        const [num, note] = splitPipe(rest)
        const c = all[digits(num)]
        if (!c || !note) return m.reply('❌ Format: `.crm note <nomor> | <catatan>`')
        c.note = note
        c.updatedAt = now()
        store.saveCrm(all)
        return reply(`📝 Catatan disimpan.\n\n${fmt(c)}`)
    }

    if (sub === 'tag') {
        const [num, tagsRaw] = splitPipe(rest)
        const c = all[digits(num)]
        if (!c || !tagsRaw) return m.reply('❌ Format: `.crm tag <nomor> | <tag1,tag2>`')
        c.tags = tagsRaw.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
        c.updatedAt = now()
        store.saveCrm(all)
        return reply(`🏷 Tag diperbarui.\n\n${fmt(c)}`)
    }

    if (sub === 'hapus' || sub === 'del') {
        const n = digits(rest)
        if (!all[n]) return reply('Kontak tidak ditemukan.')
        const name = all[n].name
        delete all[n]
        store.saveCrm(all)
        return reply(`🗑 Kontak *${name}* dihapus.`)
    }

    if (sub === 'export') {
        const json = JSON.stringify(Object.values(all), null, 2)
        await ui.sendCodeFile(sock, m.chat, 'crm-export.json', json, { quoted: m })
        return
    }

    return m.reply(HELP)
}

module.exports = { config: pluginConfig, handler }
