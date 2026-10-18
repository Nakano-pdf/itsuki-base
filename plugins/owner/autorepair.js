const fs = require('fs')
const path = require('path')
const store = require('../../src/lib/fixkit/store')
const repair = require('../../src/lib/fixkit/repair')
const codegen = require('../../src/lib/fixkit/codegen')
const ui = require('../../src/lib/fixkit/ui')
const { argText } = require('../../src/lib/fixkit/args')
const { enablePlugin, disablePlugin, hotReloadPlugin } = require('../../src/lib/plugins')

const pluginConfig = {
    name: ['autorepair', 'arep'],
    alias: ['perbaikiotomatis'],
    category: 'owner',
    description: 'Atur autorepair: status, nyala/mati, restore plugin, matikan/hidupkan plugin, lihat log error',
    usage: '.autorepair status | on | off | set <install|disable|restore|notif> <on|off> | log | laporan | restore <file> | matikan <file> | hidupkan <file>',
    example: '.autorepair set install off',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 2,
    energi: 0,
    isEnabled: true,
}

const KEY_MAP = { install: 'autoInstall', disable: 'autoDisable', restore: 'autoRestore', notif: 'notifyOwner' }

function statusText() {
    const s = store.getRepairSettings()
    const onoff = v => (v ? '✅ ON' : '⛔ OFF')
    return [
        `*Autorepair:* ${onoff(s.enabled)}`,
        `*Install npm otomatis:* ${onoff(s.autoInstall)}`,
        `*Matikan plugin error berulang:* ${onoff(s.autoDisable)}`,
        `*Restore backup otomatis:* ${onoff(s.autoRestore)}`,
        `*Laporan ke owner:* ${onoff(s.notifyOwner)}`,
    ].join('\n')
}

function statusButtons() {
    const s = store.getRepairSettings()
    return [
        s.enabled
            ? { type: 'reply', text: '⛔ Matikan Autorepair', id: '.autorepair off' }
            : { type: 'reply', text: '✅ Nyalakan Autorepair', id: '.autorepair on' },
        { type: 'reply', text: '📁 Kirim Log', id: '.autorepair log' },
        { type: 'reply', text: '📋 Laporan Terakhir', id: '.autorepair laporan' },
        { type: 'reply', text: '🏠 Menu Fixkit', id: '.fixkit' },
    ]
}

function findByArg(name) {
    const found = codegen.findPluginFile(name)
    return found
}

async function handler(m, { sock }) {
    const args = argText(m).split(/\s+/).filter(Boolean)
    const sub = (args[0] || 'status').toLowerCase()
    const jidReply = body => ui.sendPanel(sock, m.chat, { title: '🛠 AUTOREPAIR', body, quoted: m, senderJid: m.sender, buttons: statusButtons() })

    switch (sub) {
        case 'status':
            return jidReply(statusText())

        case 'on':
        case 'off': {
            store.saveRepairSettings({ enabled: sub === 'on' })
            return jidReply(`Autorepair sekarang *${sub === 'on' ? 'ON' : 'OFF'}*.\n\n${statusText()}`)
        }

        case 'set': {
            const key = KEY_MAP[(args[1] || '').toLowerCase()]
            const val = (args[2] || '').toLowerCase()
            if (!key || !['on', 'off'].includes(val)) {
                return m.reply('❌ Pakai: `.autorepair set <install|disable|restore|notif> <on|off>`')
            }
            store.saveRepairSettings({ [key]: val === 'on' })
            return jidReply(statusText())
        }

        case 'log': {
            const text = repair.readLog(200) || '(log kosong)'
            await ui.sendCodeFile(sock, m.chat, 'errors.log', text, { quoted: m, mimetype: 'text/plain' })
            return
        }

        case 'laporan': {
            const r = repair.getLastReport()
            if (!r) return m.reply('Belum ada laporan error sejak bot dinyalakan.')
            return ui.sendPanel(sock, m.chat, {
                title: '📋 Laporan Terakhir',
                body: `*Waktu:* ${r.at}\n*Plugin:* ${r.plugin}\n*Command:* ${r.command}\n*Error:* ${r.error.slice(0, 300)}\n\n*Tindakan:*\n${(r.actions || []).join('\n') || '-'}`,
                quoted: m,
                senderJid: m.sender,
                buttons: [
                    { type: 'copy', text: '📋 Salin Stack', id: '.autorepair laporan', code: `${r.plugin} | ${r.command}\n${r.error}\n\n${r.stack}` },
                    { type: 'reply', text: '📁 Kirim Log', id: '.autorepair log' },
                ],
            })
        }

        case 'restore': {
            const found = findByArg(args[1])
            if (!found) return m.reply('❌ Plugin tidak ditemukan. Contoh: `.autorepair restore tiktokdl`')
            const backup = codegen.latestBackup(found.path)
            if (!backup) return m.reply(`❌ Belum ada backup untuk \`${found.file}\`.`)
            fs.copyFileSync(backup, found.path)
            const r = hotReloadPlugin(found.path)
            return m.reply(`♻ \`${found.file}\` dikembalikan dari backup.\nReload: ${r.success ? 'berhasil' : 'gagal — ' + r.error}`)
        }

        case 'matikan': {
            const name = (args[1] || '').replace(/\.js$/, '')
            const ok = disablePlugin(name) || repair.disablePluginByFile({ file: name }, name)
            return m.reply(ok ? `⛔ Plugin \`${name}\` dimatikan.` : `❌ Plugin \`${name}\` tidak ditemukan di memori.`)
        }

        case 'hidupkan': {
            const name = (args[1] || '').replace(/\.js$/, '')
            const ok = enablePlugin(name)
            return m.reply(ok ? `✅ Plugin \`${name}\` dihidupkan lagi.` : `❌ Plugin \`${name}\` tidak ditemukan di memori.`)
        }

        default:
            return jidReply(statusText())
    }
}

module.exports = { config: pluginConfig, handler }
