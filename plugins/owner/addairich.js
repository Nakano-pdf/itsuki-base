const fs = require('fs')
const codegen = require('../../src/lib/fixkit/codegen')
const store = require('../../src/lib/fixkit/store')
const ui = require('../../src/lib/fixkit/ui')
const { richify } = require('../../src/lib/fixkit/rich')
const { argText, extractCode } = require('../../src/lib/fixkit/args')
const { hotReloadPlugin } = require('../../src/lib/plugins')

const pluginConfig = {
    name: 'addairich',
    alias: ['richify', 'jadirich'],
    category: 'owner',
    description: 'Ubah plugin/fitur Itsuki menjadi versi Rich (balasan interaktif dengan tombol salin, kirim file, dll)',
    usage: '.addairich <nama> | .addairich apply <nama> (reply kode juga bisa)',
    example: '.addairich ping',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
}

async function handler(m, { sock }) {
    const args = argText(m).split(/\s+/).filter(Boolean)
    const apply = (args[0] || '').toLowerCase() === 'apply'
    const nameArg = (apply ? args[1] : args[0]) || ''

    // ── apply: timpa plugin asli (dengan backup) ───────────────────────────
    if (apply) {
        const pending = store.loadPending(nameArg.replace(/\.js$/, ''))
        const found = codegen.findPluginFile(nameArg)
        if (!found) return m.reply(`❌ Plugin \`${nameArg}\` tidak ditemukan.`)
        const src = pending || richify(fs.readFileSync(found.path, 'utf-8')).code
        const res = codegen.writePlugin({
            folder: found.folder,
            fileName: found.file.replace(/\.js$/, ''),
            code: src,
            overwrite: true,
            hotReload: hotReloadPlugin,
        })
        if (!res.ok) return m.reply(`❌ *ADDAIRICH*\n\n> ${res.error}`)
        return ui.sendPanel(sock, m.chat, {
            title: '✨ Rich diterapkan',
            body: `\`${found.folder}/${found.file}\` sudah versi Rich.\nBackup versi lama tersimpan.\nReload: ${res.reload?.success ? 'berhasil' : 'gagal — ' + res.reload.error}`,
            quoted: m,
            senderJid: m.sender,
            buttons: [
                { type: 'reply', text: `▶ Coba .${found.file.replace(/\.js$/, '')}`, id: `.${found.file.replace(/\.js$/, '')}` },
                { type: 'reply', text: '♻ Restore Versi Lama', id: `.autorepair restore ${found.file}` },
                { type: 'reply', text: '🏠 Menu Fixkit', id: '.fixkit' },
            ],
        })
    }

    // ── sumber kode ─────────────────────────────────────────────────────────
    let src = extractCode(m)
    let base = nameArg.replace(/\.js$/, '')
    if (!src) {
        if (!nameArg) {
            return m.reply(
                `✨ *ADDAIRICH*\n\n` +
                `> \`.addairich <nama>\` ubah plugin yang ada jadi Rich (pratinjau + simpan ke pending)\n` +
                `> \`.addairich apply <nama>\` terapkan langsung (ada backup)\n` +
                `> Reply kode plugin lalu \`.addairich\` untuk versi Rich dari kode mentah`
            )
        }
        const found = codegen.findPluginFile(nameArg)
        if (!found) return m.reply(`❌ Plugin \`${nameArg}\` tidak ditemukan.`)
        src = fs.readFileSync(found.path, 'utf-8')
        base = found.file.replace(/\.js$/, '')
    }
    if (!base) base = 'plugin-rich'

    const result = richify(src)
    if (!result.syntax.ok) return m.reply(`❌ Hasil Rich tidak valid: ${result.syntax.error}`)
    store.savePending(base, result.code)

    const body = `*Plugin:* ${base}\n*Balasan diubah:* ${result.count}\n\n*Perubahan:*\n${result.changes.map(c => '• ' + c).join('\n')}\n\nTombol yang muncul di setiap balasan: 📋 Salin · 🔄 Ulangi · 📁 Kirim .txt`
    const buttons = [
        { type: 'reply', text: '✨ Terapkan (apply)', id: `.addairich apply ${base}` },
        { type: 'reply', text: '💾 Simpan Baru', id: `.fixpl1 simpan tools ${base}` },
        ...(result.code.length <= ui.COPY_MAX ? [{ type: 'copy', text: '📋 Salin Kode', id: `.salinplugin ${base}`, code: result.code }] : []),
        { type: 'reply', text: '📁 Kirim File', id: `.kirimplugin ${base}` },
    ]
    await ui.sendPanel(sock, m.chat, { title: '✨ ADDAIRICH — Pratinjau', body, quoted: m, senderJid: m.sender, buttons })
    await ui.sendCodeFile(sock, m.chat, `${base}.rich.js`, result.code, { quoted: m })
}

module.exports = { config: pluginConfig, handler }
