const fs = require('fs')
const { adaptToItsuki } = require('../../src/lib/fixkit/adapt')
const codegen = require('../../src/lib/fixkit/codegen')
const store = require('../../src/lib/fixkit/store')
const ui = require('../../src/lib/fixkit/ui')
const { argText, extractCode, quotedText } = require('../../src/lib/fixkit/args')
const { hotReloadPlugin } = require('../../src/lib/plugins')

const pluginConfig = {
    name: 'fixpl1',
    alias: ['adaptplugin', 'itsukifix'],
    category: 'owner',
    description: 'Ubah plugin mentah (bot lain) agar sesuai format Itsuki, lalu simpan ke plugins',
    usage: '.fixpl1 [nama] (reply kode) | .fixpl1 simpan <folder> <nama>',
    example: '.fixpl1 tiktok-mentah (reply kode plugin)',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true,
}

function safeName(v) {
    return String(v || '').toLowerCase().replace(/\.js$/, '').replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

async function handler(m, { sock }) {
    const args = argText(m).split(/\s+/).filter(Boolean)
    const sub = (args[0] || '').toLowerCase()

    // ── .fixpl1 simpan <folder> <nama> → tulis pending ke plugins ───────────
    if (sub === 'simpan') {
        const folder = args[1]
        const name = safeName(args[2])
        const pending = name ? store.loadPending(name) : null
        if (!pending) return m.reply(`❌ Belum ada hasil adaptasi \`${name || '?'}\`. Jalankan \`.fixpl1 <nama>\` dulu.`)
        if (!folder || !codegen.isAllowedFolder(folder)) {
            return m.reply(`❌ Folder tidak valid. Pilihan: ${codegen.ALLOWED_FOLDERS.join(', ')}`)
        }
        const res = codegen.writePlugin({ folder, fileName: name, code: pending, hotReload: hotReloadPlugin })
        if (!res.ok) return m.reply(`❌ *ADAPT → SIMPAN*\n\n> ${res.error}`)
        m.react?.('✅')
        return ui.sendPanel(sock, m.chat, {
            title: '✅ Plugin tersimpan',
            body: `Plugin \`${name}.js\` masuk ke folder \`${folder}\`.\nReload: ${res.reload?.success ? 'berhasil' : 'gagal — ' + (res.reload?.error || '')}${res.backup ? `\nBackup versi lama disimpan.` : ''}`,
            quoted: m,
            senderJid: m.sender,
            buttons: [
                { type: 'reply', text: '🧪 Lint Plugin', id: `.fixpl2 ${name}` },
                { type: 'reply', text: '🧩 Cek Dependensi', id: `.fixpl3 ${name}` },
                { type: 'reply', text: '🏠 Menu Fixkit', id: '.fixkit' },
            ],
        })
    }

    // ── sumber kode: reply teks/kode, atau nama plugin yang sudah ada ─────────
    let raw = extractCode(m)
    let nameArg = args[0] || ''
    if (!raw && nameArg) {
        const found = codegen.findPluginFile(nameArg)
        if (!found) return m.reply(`❌ Plugin \`${nameArg}\` tidak ditemukan. Reply kode plugin mentahnya lalu ketik \`.fixpl1\`.`)
        raw = fs.readFileSync(found.path, 'utf-8')
    }
    if (!raw) {
        return m.reply(
            `🔧 *FIXPL1 — Adaptasi Plugin ke Itsuki*\n\n` +
            `> Reply kode plugin mentah, lalu ketik \`.fixpl1\` (opsional: \`.fixpl1 nama\`)\n` +
            `> Setelah itu tekan *Simpan* atau ketik \`.fixpl1 simpan <folder> <nama>\``
        )
    }

    const baseName = safeName(nameArg) || safeName((raw.match(/name:\s*['"`]([^'"`]+)['"`]/) || [])[1]) || 'plugin-adaptasi'
    const { code, changes, syntax } = adaptToItsuki(raw, { name: baseName })
    store.savePending(baseName, code)

    const summary = changes.length ? changes.map(c => `• ${c}`).join('\n') : '• tidak ada perubahan (sudah sesuai Itsuki)'
    const status = syntax.ok ? '✅ Sintaks valid' : `❌ Sintaks error: ${syntax.error}`
    const body = `*Nama:* ${baseName}\n*Status:* ${status}\n\n*Perubahan:*\n${summary}`

    const file = `${baseName}.js`
    const buttons = [
        { type: 'reply', text: `💾 Simpan (tools)`, id: `.fixpl1 simpan tools ${baseName}` },
        { type: 'reply', text: '💾 Simpan (owner)', id: `.fixpl1 simpan owner ${baseName}` },
        ...(code.length <= ui.COPY_MAX ? [{ type: 'copy', text: '📋 Salin Kode', id: `.salinplugin ${baseName}`, code }] : []),
        { type: 'reply', text: '📁 Kirim File', id: `.kirimplugin ${baseName}` },
        { type: 'reply', text: '🧪 Lint Dulu', id: `.fixpl2 ${baseName}` },
    ]

    await ui.sendPanel(sock, m.chat, { title: '🔧 FIXPL1 — Hasil Adaptasi', body, quoted: m, senderJid: m.sender, buttons })
    await ui.sendCodeFile(sock, m.chat, file, code, { quoted: m })
}

module.exports = { config: pluginConfig, handler }
