const { scrapePage } = require('../../src/lib/fixkit/scrape')
const ui = require('../../src/lib/fixkit/ui')
const { argText, splitPipe } = require('../../src/lib/fixkit/args')

const pluginConfig = {
    name: 'toscrape',
    alias: ['scrape', 'scrapeurl'],
    category: 'owner',
    description: 'Scrape satu halaman web sekali jalan: judul, meta, heading, dan hasil selector CSS',
    usage: '.toscrape <url> | [selector] | [attr]',
    example: '.toscrape https://example.com | h2 | ',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
}

async function handler(m, { sock }) {
    const [url, selector = '', attr = ''] = splitPipe(argText(m))
    if (!url) return m.reply('🕸 *TOSCRAPE*\n\n> Format: `.toscrape <url> | [selector] | [attr]`\n> Contoh: `.toscrape https://example.com | a | href`')

    await m.reply('⏳ Lagi scraping halamannya~')
    try {
        const result = await scrapePage(url, { selector, attr, limit: 25 })
        const full = JSON.stringify(result, null, 2)
        const preview = [
            `*Judul:* ${result.title || '-'}`,
            `*Deskripsi:* ${result.description || '-'}`,
            `*Heading:* ${result.headings.length}`,
            `*Link:* ${result.links} · *Gambar:* ${result.images}`,
            selector ? `*Hasil selector "${selector}":* ${result.count}` : '',
            selector && result.items?.length ? '\n' + result.items.slice(0, 8).map((x, i) => `${i + 1}. ${String(x).slice(0, 120)}`).join('\n') : '',
        ].filter(Boolean).join('\n')

        await ui.sendPanel(sock, m.chat, {
            title: '🕸 TOSCRAPE — Hasil',
            body: preview,
            quoted: m,
            senderJid: m.sender,
            buttons: [
                ...(full.length <= ui.COPY_MAX ? [{ type: 'copy', text: '📋 Salin JSON', id: '.toscrape', code: full }] : []),
                { type: 'reply', text: '🔄 Ulangi', id: `.toscrape ${url}${selector ? ' | ' + selector : ''}` },
                { type: 'url', text: '🌐 Buka Halaman', url: result.url },
            ],
        })
        await ui.sendCodeFile(sock, m.chat, 'scrape-result.json', full, { quoted: m })
    } catch (e) {
        return m.reply(`❌ Gagal scrape: ${e.message}`)
    }
}

module.exports = { config: pluginConfig, handler }
