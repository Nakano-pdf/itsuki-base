const itsukiAI = require('../../src/lib/itsukiAI')

const pluginConfig = {
    name: 'aicontroll',
    alias: ['aictrl'],
    category: 'owner',
    description: 'Panel Itsuki AI: nyala/mati, grup, akses folder, tulis file (khusus owner)',
    usage: '.aicontroll status | on|off | listen on|off | grup on|off | tools on|off | dir [folder] | baca <file> | tulis <file> (reply code) | konfirmasi | reset',
    example: '.aicontroll dir plugins',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 2,
    energi: 0,
    isEnabled: true
}

const onoff = (v) => (v ? 'AKTIF' : 'NONAKTIF')
const isOO = (v) => v === 'on' || v === 'off'

function statusText(c, p) {
    return [
        'Status Itsuki AI',
        `- Aktif            : ${onoff(c.enabled)}`,
        `- Dipanggil nama   : ${onoff(c.listen)}`,
        `- Balas di grup    : ${onoff(c.group)}`,
        `- Akses folder AI  : ${onoff(c.tools)}`,
        '- Otak             : Gemini via RyuuApi',
        '- Batas user       : 20 pesan per hari',
        '',
        'Perintah:',
        `${p}aicontroll on / off`,
        `${p}aicontroll listen on / off`,
        `${p}aicontroll grup on / off`,
        `${p}aicontroll tools on / off`,
        `${p}aicontroll dir [folder]`,
        `${p}aicontroll baca <file>`,
        `${p}aicontroll tulis <file> (reply code)`,
        `${p}aicontroll konfirmasi`,
        `${p}aicontroll reset`,
    ].join('\n')
}

const ITSUKI_AD_TITLE = 'AICONTROLL'
const ITSUKI_AD_BODY = 'Itsuki AI • Panel Kontrol'

// Balasan teks dengan extended text (thumbnail dari config.assets.images.itsukimenu)
async function sendExtText(sock, m, text) {
    const cfg = require('../../config')
    const thumb = cfg.assets?.images?.itsukimenu
    if (!sock || !thumb) return m.reply(text)
    return sock.sendMessage(
        m.chat,
        {
            text,
            contextInfo: {
                externalAdReply: {
                    title: ITSUKI_AD_TITLE,
                    body: ITSUKI_AD_BODY,
                    thumbnailUrl: thumb,
                    sourceUrl: thumb,
                    mediaType: 1,
                    renderLargerThumbnail: false,
                    showAdAttribution: false
                }
            }
        },
        { quoted: m }
    )
}

async function handler(m, { sock } = {}) {
    const reply = (text) => sendExtText(sock, m, text)

    const p = m.prefix || '.'
    const args = m.args || []
    const sub = (args[0] || 'status').toLowerCase()
    const a1 = (args[1] || '').toLowerCase()
    const rest = args.slice(1).join(' ').trim()

    try {
        if (sub === 'status') return reply(statusText(itsukiAI.getControl(), p))

        // Edit gambar: .aicontroll edit <url https> | <prompt>
        if (sub === 'edit') {
            const body = (args.slice(1).join(' ') || '').trim()
            const [urlPart, ...promptParts] = body.split('|').map(x => x.trim())
            const prompt = promptParts.join(' | ').trim()
            if (!/^https:\/\//i.test(urlPart || '') || !prompt) {
                return reply(`Pakai: ${p}aicontroll edit <url https> | <prompt>\nContoh: ${p}aicontroll edit https://contoh.com/a.jpg | ubah jadi gaya retro`)
            }
            if (!sock) return reply('Gagal: koneksi bot tidak tersedia.')
            await m.react('🎨')
            const image = await itsukiAI.editImage(urlPart, prompt)
            await sock.sendMessage(m.chat, { image, caption: `🎨 ${prompt.slice(0, 200)}` }, { quoted: m })
            return m.react('✅')
        }

        if (sub === 'on' || sub === 'off') {
            itsukiAI.setControl({ enabled: sub === 'on' })
            return reply(`Itsuki AI: ${onoff(sub === 'on')}`)
        }
        if (sub === 'listen' && isOO(a1)) {
            itsukiAI.setControl({ listen: a1 === 'on' })
            return reply(`Dipanggil nama: ${onoff(a1 === 'on')}`)
        }
        if (sub === 'grup' && isOO(a1)) {
            itsukiAI.setControl({ group: a1 === 'on' })
            return reply(`Balas di grup: ${onoff(a1 === 'on')}`)
        }
        if (sub === 'tools' && isOO(a1)) {
            itsukiAI.setControl({ tools: a1 === 'on' })
            return reply(`Akses folder AI: ${onoff(a1 === 'on')}`)
        }

        if (sub === 'dir') {
            const { rel, items } = itsukiAI.listDir(rest || '.')
            if (!items.length) return reply(`Folder ${rel} kosong.`)
            return reply(`*${rel}* (${items.length} item)\n` + items.join('\n'))
        }

        if (sub === 'baca') {
            if (!rest) return reply(`Pakai: ${p}aicontroll baca <path file>`)
            const { rel, total, head } = itsukiAI.readFileHead(rest)
            return reply(`*${rel}* (${total} baris, 60 pertama)\n\`\`\`\n${head}\n\`\`\``)
        }

        if (sub === 'tulis') {
            if (!rest) return reply(`Pakai: reply kode, lalu ${p}aicontroll tulis <path file.js>`)
            let code = ''
            if (m.quoted?.isDocument) {
                const buf = await m.quoted.download()
                code = buf ? buf.toString('utf8') : ''
            } else {
                code = m.quoted?.text || m.quoted?.body || ''
            }
            const r = itsukiAI.prepareWrite(m.sender, rest, code)
            return reply(
                `Siap menulis *${r.rel}* (${r.lines} baris).\n` +
                `Ketik ${p}aicontroll konfirmasi dalam 2 menit untuk menyimpan. Backup otomatis dibuat.`
            )
        }

        if (sub === 'konfirmasi') {
            const r = itsukiAI.confirmWrite(m.sender)
            return reply(`File disimpan: ${r.rel}` + (r.backup ? `\nBackup: ${r.backup}` : '') + `\nRestart bot agar berlaku.`)
        }

        if (sub === 'reset') {
            const n = itsukiAI.resetAll()
            const jumlah = typeof n === 'object' ? n.riwayat : n
            return reply(`Riwayat Itsuki direset (${jumlah} percakapan). Pengaturan tidak berubah.`)
        }
    } catch (err) {
        return reply(`❌ ${err.message}`)
    }

    return reply(statusText(itsukiAI.getControl(), p))
}

module.exports = { config: pluginConfig, handler }
