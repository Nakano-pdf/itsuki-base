const fs = require('fs')
const codegen = require('../../src/lib/fixkit/codegen')
const store = require('../../src/lib/fixkit/store')
const ui = require('../../src/lib/fixkit/ui')
const adapt = require('../../src/lib/fixkit/adapt')
const repair = require('../../src/lib/fixkit/repair')
const { argText, extractCode } = require('../../src/lib/fixkit/args')

const pluginConfig = {
    name: 'fixpl3',
    alias: ['cekdeps', 'depsdoctor'],
    category: 'owner',
    description: 'Cek dependensi plugin (npm & file lokal), dan pasang paket yang hilang',
    usage: '.fixpl3 [nama] | .fixpl3 install <paket>',
    example: '.fixpl3 install axios',
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

    // ── install paket manual ───────────────────────────────────────────────
    if ((args[0] || '').toLowerCase() === 'install') {
        const pkg = args[1]
        if (!pkg || !adapt.isSafePackageName(pkg)) return m.reply('❌ Nama paket tidak valid. Contoh: `.fixpl3 install axios`')
        await m.reply(`⏳ Memasang \`${pkg}\`…`)
        const res = await repair.installPackage(pkg)
        return ui.sendPanel(sock, m.chat, {
            title: res.ok ? '✅ Paket terpasang' : '❌ Gagal pasang paket',
            body: res.ok ? `\`${pkg}\` berhasil dipasang. Restart atau reload plugin yang memakainya.` : `\`${pkg}\`\n${res.reason}`,
            quoted: m,
            senderJid: m.sender,
            buttons: [{ type: 'reply', text: '🏠 Menu Fixkit', id: '.fixkit' }],
        })
    }

    // ── sumber kode ───────────────────────────────────────────────────────
    let code = extractCode(m)
    let found = null
    let name = args[0] || 'plugin'
    if (!code) {
        if (!args[0]) {
            return m.reply('🧩 *FIXPL3 — Dependency Doctor*\n\n> `.fixpl3 <nama>` cek dependensi plugin\n> `.fixpl3 install <paket>` pasang paket npm')
        }
        found = codegen.findPluginFile(args[0])
        if (!found) return m.reply(`❌ Plugin \`${args[0]}\` tidak ditemukan.`)
        code = fs.readFileSync(found.path, 'utf-8')
        name = found.file.replace(/\.js$/, '')
    }

    const deps = adapt.scanDeps(code, found ? require('path').dirname(found.path) : undefined)
    const lines = [
        `*Builtin Node:* ${deps.builtin.length ? deps.builtin.join(', ') : '-'}`,
        `*NPM terpasang:* ${deps.installed.length ? deps.installed.join(', ') : '-'}`,
        `*NPM hilang:* ${deps.missingNpm.length ? deps.missingNpm.join(', ') : '✅ tidak ada'}`,
        `*File lokal OK:* ${deps.localOk.length ? deps.localOk.join(', ') : '-'}`,
        `*File lokal hilang:* ${deps.missingLocal.length ? deps.missingLocal.join(', ') : '✅ tidak ada'}`,
    ]

    const buttons = []
    for (const pkg of deps.missingNpm.slice(0, 3)) {
        buttons.push({ type: 'reply', text: `📦 Install ${pkg}`.slice(0, 40), id: `.fixpl3 install ${pkg}` })
    }
    buttons.push({ type: 'reply', text: '🧪 Lint Plugin', id: `.fixpl2 ${name}` })
    buttons.push({ type: 'reply', text: '🏠 Menu Fixkit', id: '.fixkit' })

    const missingAny = deps.missingNpm.length + deps.missingLocal.length
    return ui.sendPanel(sock, m.chat, {
        title: `🧩 FIXPL3 — ${name}`,
        body: lines.join('\n') + (missingAny ? `\n\n⚠ Ada ${missingAny} dependensi yang hilang.` : '\n\n✅ Semua dependensi aman.'),
        quoted: m,
        senderJid: m.sender,
        buttons,
    })
}

module.exports = { config: pluginConfig, handler }
