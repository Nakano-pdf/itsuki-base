const fs = require('fs')
const codegen = require('../../src/lib/fixkit/codegen')
const store = require('../../src/lib/fixkit/store')
const ui = require('../../src/lib/fixkit/ui')
const { argText } = require('../../src/lib/fixkit/args')

const pluginConfig = {
    name: ['salinplugin', 'kirimplugin', 'kirimfile'],
    alias: ['copyplugin', 'sendplugin', 'filebalasan'],
    category: 'owner',
    description: 'Tombol bantuan: salin kode plugin, kirim plugin sebagai file, atau kirim balasan terakhir sebagai file',
    usage: '.salinplugin <nama> · .kirimplugin <nama> · .kirimfile',
    example: '.kirimplugin tiktokdl',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 2,
    energi: 0,
    isEnabled: true,
}

/** Ambil kode: utamakan hasil adaptasi pending, lalu file plugin yang sudah terpasang. */
function loadSource(name) {
    const clean = name.replace(/\.js$/, '')
    const pending = store.loadPending(clean)
    if (pending) return { code: pending, file: `${clean}.js`, origin: 'pending' }
    const found = codegen.findPluginFile(clean)
    if (found) return { code: fs.readFileSync(found.path, 'utf-8'), file: found.file, origin: `${found.folder}/${found.file}` }
    return null
}

async function handler(m, { sock }) {
    const cmd = (m.command || '').toLowerCase()
    const name = argText(m).split(/\s+/)[0] || ''

    if (cmd === 'kirimfile') {
        const last = ui.getLastBody(m.chat)
        if (!last) return m.reply('Belum ada balasan terakhir di chat ini untuk dikirim sebagai file.')
        return ui.sendCodeFile(sock, m.chat, `${name || 'balasan'}.txt`, last, { quoted: m, mimetype: 'text/plain' })
    }

    if (!name) return m.reply(`Contoh: \`.${cmd} <nama-plugin>\``)
    const src = loadSource(name)
    if (!src) return m.reply(`❌ Kode \`${name}\` tidak ditemukan (belum adaptasi & belum terpasang).`)

    if (cmd === 'salinplugin') {
        if (src.code.length <= ui.COPY_MAX) {
            return ui.sendPanel(sock, m.chat, {
                title: `📋 ${src.file}`,
                body: `Tekan tombol *Salin* di bawah untuk menyalin kode.\nSumber: ${src.origin}`,
                quoted: m,
                senderJid: m.sender,
                buttons: [
                    { type: 'copy', text: '📋 Salin Kode', id: `.salinplugin ${name}`, code: src.code },
                    { type: 'reply', text: '📁 Kirim File', id: `.kirimplugin ${name}` },
                ],
            })
        }
        // terlalu panjang untuk tombol salin → kirim sebagai file
        await m.reply(`Kode terlalu panjang untuk tombol salin (${src.code.length} karakter), saya kirim sebagai file.`)
        return ui.sendCodeFile(sock, m.chat, src.file, src.code, { quoted: m })
    }

    // kirimplugin
    await ui.sendCodeFile(sock, m.chat, src.file, src.code, { quoted: m })
    return ui.sendPanel(sock, m.chat, {
        title: `📁 ${src.file}`,
        body: `Sumber: ${src.origin}\nUkuran: ${src.code.length} karakter`,
        senderJid: m.sender,
        buttons: [
            { type: 'reply', text: '🧪 Lint', id: `.fixpl2 ${name}` },
            { type: 'reply', text: '🧩 Dependensi', id: `.fixpl3 ${name}` },
            { type: 'reply', text: '🏠 Menu Fixkit', id: '.fixkit' },
        ],
    })
}

module.exports = { config: pluginConfig, handler }
