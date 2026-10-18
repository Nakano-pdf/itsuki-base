const codegen = require('../../src/lib/fixkit/codegen')
const store = require('../../src/lib/fixkit/store')
const ui = require('../../src/lib/fixkit/ui')
const { argText, splitPipe } = require('../../src/lib/fixkit/args')
const { hotReloadPlugin } = require('../../src/lib/plugins')

const pluginConfig = {
    name: 'buatfitur',
    alias: ['makefitur', 'fiturdariapi'],
    category: 'owner',
    description: 'Buat plugin/fitur baru dari endpoint API yang sudah ada di addapi, lalu langsung dipasang',
    usage: '.buatfitur <namaApi> | <endpoint> | <namaCommand> | [paramName] | [GET|POST] | [deskripsi]',
    example: '.buatfitur tiktokapi | /v1/download | ttdl | url | GET | Download TikTok',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
}

const HELP = `🧱 *BUATFITUR — Fitur dari API*

> Format: \`.buatfitur <namaApi> | <endpoint> | <namaCommand> | [paramName] | [GET|POST] | [deskripsi]\`
> Contoh: \`.buatfitur tiktokapi | /v1/download | ttdl | url | GET | Download TikTok\`
> Daftar API: \`.addapi list\``

async function handler(m, { sock }) {
    const [apiName, endpointRaw, cmdRaw, paramName = '', methodRaw = 'GET', desc = ''] = splitPipe(argText(m))
    if (!apiName || !endpointRaw || !cmdRaw) return m.reply(HELP)

    const api = store.getApi(apiName)
    if (!api) return m.reply(`❌ API \`${apiName}\` belum terdaftar. Tambah dulu dengan \`.addapi add\`.`)

    const command = cmdRaw.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '')
    if (!codegen.isValidFileName(command)) return m.reply('❌ Nama command tidak valid (huruf kecil, angka, tanda -).')

    const endpoint = endpointRaw.startsWith('/') ? endpointRaw : '/' + endpointRaw
    const method = methodRaw.toUpperCase() === 'POST' ? 'POST' : 'GET'
    const param = paramName.replace(/[^a-zA-Z0-9_]/g, '')

    const code = codegen.buildApiPlugin({
        apiName: api.name,
        endpoint,
        method,
        paramName: param,
        name: command,
        alias: [],
        category: 'tools',
        description: desc || `Fitur dari API ${api.name}`,
        usage: param ? `.${command} <${param}>` : `.${command}`,
        example: param ? `.${command} contoh` : `.${command}`,
        cooldown: 5,
    })

    const res = codegen.writePlugin({ folder: 'tools', fileName: command, code, hotReload: hotReloadPlugin })
    if (!res.ok) return m.reply(`❌ *BUATFITUR*\n\n> ${res.error}`)

    return ui.sendPanel(sock, m.chat, {
        title: '🧱 Fitur dibuat',
        body: `*Command:* \`.${command}\`\n*API:* ${api.name} → ${api.baseURL}${endpoint}\n*Metode:* ${method}${param ? `\n*Parameter:* ${param}` : ''}\n*Reload:* ${res.reload?.success ? 'berhasil' : 'gagal — ' + (res.reload?.error || '')}`,
        quoted: m,
        senderJid: m.sender,
        buttons: [
            { type: 'reply', text: `▶ Coba .${command}`, id: `.${command}` },
            { type: 'reply', text: '📁 Kirim File', id: `.kirimplugin ${command}` },
            { type: 'reply', text: '🧪 Lint Plugin', id: `.fixpl2 ${command}` },
            { type: 'reply', text: '🏠 Menu Fixkit', id: '.fixkit' },
        ],
    })
}

module.exports = { config: pluginConfig, handler }
