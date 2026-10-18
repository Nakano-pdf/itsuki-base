const fs = require('fs')
const codegen = require('../../src/lib/fixkit/codegen')
const store = require('../../src/lib/fixkit/store')
const ui = require('../../src/lib/fixkit/ui')
const { lintAndFix } = require('../../src/lib/fixkit/adapt')
const { argText, extractCode } = require('../../src/lib/fixkit/args')
const { hotReloadPlugin } = require('../../src/lib/plugins')

const pluginConfig = {
    name: 'fixpl2',
    alias: ['lintplugin', 'cekplugin'],
    category: 'owner',
    description: 'Lint plugin: cek sintaks, config, konflik command; auto-fix masalah umum',
    usage: '.fixpl2 [nama] | .fixpl2 fix [nama] (reply kode juga bisa)',
    example: '.fixpl2 fix tiktokdl',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true,
}

async function handler(m, { sock }) {
    const args = argText(m).split(/\s+/).filter(Boolean)
    const applyFix = args[0] === 'fix'
    const nameArg = applyFix ? args[1] : args[0]

    // sumber: reply kode, atau file plugin
    let raw = extractCode(m)
    let found = null
    if (!raw) {
        if (!nameArg) {
            return m.reply(
                `🧪 *FIXPL2 — Lint & Auto-Fix*\n\n` +
                `> \`.fixpl2 <nama>\` cek plugin yang ada\n` +
                `> \`.fixpl2 fix <nama>\` perbaiki otomatis (dengan backup)\n` +
                `> Reply kode lalu \`.fixpl2\` untuk cek kode mentah`
            )
        }
        found = codegen.findPluginFile(nameArg)
        if (!found) return m.reply(`❌ Plugin \`${nameArg}\` tidak ditemukan.`)
        raw = fs.readFileSync(found.path, 'utf-8')
    }

    const base = found ? found.file.replace(/\.js$/, '') : (nameArg || 'plugin-lint')
    const result = lintAndFix(raw, { name: base })

    const fixedList = result.fixed.length ? result.fixed.map(x => `• ${x}`).join('\n') : '• tidak ada perbaikan otomatis yang perlu'
    const issueList = result.issues.length ? result.issues.map(x => `• ${x}`).join('\n') : '• tidak ada masalah'
    const syntaxLine = result.syntax.ok ? '✅ Sintaks valid' : `❌ ${result.syntax.error}`

    if (applyFix && found) {
        if (!result.syntax.ok) {
            return m.reply(`❌ Tidak bisa auto-fix: sintaks error.\n\n> ${result.syntax.error}`)
        }
        if (result.fixed.length === 0) {
            return m.reply(`✅ \`${found.file}\` sudah bersih, tidak ada yang perlu diperbaiki.`)
        }
        codegen.backupPlugin(found.path)
        fs.writeFileSync(found.path, result.code)
        const reload = hotReloadPlugin(found.path)
        return ui.sendPanel(sock, m.chat, {
            title: '🛠 FIXPL2 — Auto-Fix diterapkan',
            body: `*File:* ${found.folder}/${found.file}\n*Backup:* tersimpan\n*Reload:* ${reload.success ? 'berhasil' : 'gagal — ' + reload.error}\n\n*Diperbaiki:*\n${fixedList}\n\n*Catatan:*\n${issueList}`,
            quoted: m,
            senderJid: m.sender,
            buttons: [
                { type: 'reply', text: '🧩 Cek Dependensi', id: `.fixpl3 ${base}` },
                { type: 'reply', text: '📁 Kirim File', id: `.kirimplugin ${base}` },
                { type: 'reply', text: '🏠 Menu Fixkit', id: '.fixkit' },
            ],
        })
    }

    // mode lint saja
    if (result.code !== raw && !found) store.savePending(base, result.code)
    const buttons = [
        ...(found ? [{ type: 'reply', text: '🛠 Auto-Fix', id: `.fixpl2 fix ${base}` }] : [{ type: 'reply', text: '💾 Simpan Hasil Fix', id: `.fixpl1 simpan tools ${base}` }]),
        { type: 'reply', text: '🧩 Cek Dependensi', id: `.fixpl3 ${base}` },
        { type: 'reply', text: '📁 Kirim File', id: `.kirimplugin ${base}` },
    ]
    return ui.sendPanel(sock, m.chat, {
        title: `🧪 FIXPL2 — ${base}`,
        body: `*Status:* ${syntaxLine}\n\n*Masalah:*\n${issueList}\n\n*Bisa diperbaiki otomatis:*\n${fixedList}`,
        quoted: m,
        senderJid: m.sender,
        buttons,
    })
}

module.exports = { config: pluginConfig, handler }
