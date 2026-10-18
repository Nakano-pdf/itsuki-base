const codegen = require('../../src/lib/fixkit/codegen')
const ui = require('../../src/lib/fixkit/ui')
const { validateUrl } = require('../../src/lib/fixkit/scrape')
const { argText, splitPipe } = require('../../src/lib/fixkit/args')
const { hotReloadPlugin } = require('../../src/lib/plugins')

const pluginConfig = {
    name: 'buatscrape',
    alias: ['makescrape', 'scrapebuat'],
    category: 'owner',
    description: 'Buat plugin scraping baru dari URL website + selector CSS, lalu langsung dipasang',
    usage: '.buatscrape <nama> | <url> | [selector] | [attr]',
    example: '.buatscrape beritaterkini | https://example.com/news | h2.title | ',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
}

async function handler(m, { sock }) {
    const [rawName, rawUrl, selector = '', attr = ''] = splitPipe(argText(m))
    if (!rawName || !rawUrl) {
        return m.reply(
            `🕷 *BUATSCRAPE*\n\n` +
            `> Format: \`.buatscrape nama | url | selector | attr\`\n` +
            `> Contoh: \`.buatscrape beritaterkini | https://site.com/berita | h2.judul\`\n` +
            `> Selector & attr opsional. attr contoh: \`href\``
        )
    }

    const name = rawName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '')
    if (!codegen.isValidFileName(name)) return m.reply('❌ Nama tidak valid (huruf kecil, angka, tanda -).')

    let url
    try { url = validateUrl(rawUrl) } catch (e) { return m.reply(`❌ ${e.message}`) }

    const code = codegen.buildScrapePlugin({
        name,
        alias: [],
        category: 'tools',
        description: `Scrape data dari ${new URL(url).hostname}`,
        usage: `.${name}`,
        example: `.${name}`,
        url,
        selector,
        attr,
        cooldown: 10,
    })

    const res = codegen.writePlugin({ folder: 'tools', fileName: name, code, hotReload: hotReloadPlugin })
    if (!res.ok) return m.reply(`❌ *BUATSCRAPE*\n\n> ${res.error}`)

    return ui.sendPanel(sock, m.chat, {
        title: '🕷 Plugin scrape dibuat',
        body: `*Command:* \`.${name}\`\n*Sumber:* ${url}\n*Selector:* ${selector || '(tidak ada, hanya info halaman)'}\n*Reload:* ${res.reload?.success ? 'berhasil' : 'gagal — ' + (res.reload?.error || '')}`,
        quoted: m,
        senderJid: m.sender,
        buttons: [
            { type: 'reply', text: `▶ Coba .${name}`, id: `.${name}` },
            { type: 'reply', text: '📁 Kirim File', id: `.kirimplugin ${name}` },
            { type: 'reply', text: '🧪 Lint Plugin', id: `.fixpl2 ${name}` },
            { type: 'reply', text: '🏠 Menu Fixkit', id: '.fixkit' },
        ],
    })
}

module.exports = { config: pluginConfig, handler }
