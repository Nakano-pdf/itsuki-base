const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'owner',
    alias: ['creator', 'dev', 'developer'],
    category: 'main',
    description: 'Menampilkan kontak owner bot',
    usage: '.owner',
    example: '.owner',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock, config: botConfig }) {
    const db        = getDatabase()
    const ownerType = db.setting('ownerType') || 1
    const botName   = botConfig.bot?.name || 'Itsuki Nakano'

    function getOwnerName(cleanNumber) {
        const names  = db.setting('ownerNames') || {}
        if (names[cleanNumber]) return names[cleanNumber]
        const userDb = db.getUser(cleanNumber + '@s.whatsapp.net') || db.getUser(cleanNumber)
        return userDb?.name || botConfig.owner?.name || 'Owner'
    }

    const configOwners = [].concat(botConfig.owner?.number || [])
        .map(n => String(n).replace(/[^0-9]/g, ''))
        .filter(n => n.length >= 10)

    const dbOwners = (Array.isArray(db.data.owner) ? db.data.owner : [])
        .map(n => String(n).replace(/[^0-9]/g, ''))
        .filter(n => n.length >= 10 && !configOwners.includes(n))

    const ownerList = [
        ...configOwners.map(num => ({ num, label: '👑 Owner Utama' })),
        ...dbOwners.map((num, i) => ({ num, label: `⭐ Owner ${i + 1}` }))
    ]

    if (ownerList.length === 0) {
        return m.reply(`❌ *Belum ada owner terdaftar~*`)
    }

    // ── TYPE 1 — Teks + contact card ─────────────────────────────────────────
    if (ownerType === 1) {
        let ownerText = `👑 *ᴏᴡɴᴇʀ ɪɴꜰᴏʀᴍᴀᴛɪᴏɴ*\n\n`
        ownerText += `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n`
        ownerText += `┃ 🤖 ʙᴏᴛ: *${botName}*\n`
        ownerText += `┃ 👑 ᴏᴡɴᴇʀ ᴜᴛᴀᴍᴀ: *${configOwners.length}*\n`
        ownerText += `┃ ⭐ ᴏᴡɴᴇʀ ʟᴀɪɴɴʏᴀ: *${dbOwners.length}*\n`
        ownerText += `┃ 🟢 sᴛᴀᴛᴜs: *Online*\n`
        ownerText += `╰┈┈⬡\n\n`
        ownerText += `> _Hubungi owner via contact card di bawah~ 🌸_`

        await m.reply(ownerText)

        for (const { num, label } of ownerList) {
            const displayName = getOwnerName(num)
            const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${displayName} (${label})\nTEL;type=CELL;type=VOICE;waid=${num}:+${num}\nEND:VCARD`
            await sock.sendMessage(m.chat, {
                contacts: {
                    displayName,
                    contacts: [{ vcard }]
                }
            }, { quoted: m.raw })
        }

    // ── TYPE 2 — Carousel Cards ───────────────────────────────────────────────
    } else if (ownerType === 2) {
        const cards = []
        const DEFAULT_PP = 'https://cdn.gimita.id/download/pp%20kosong%20wa%20default%20(1)_1769506608569_52b57f5b.jpg'

        for (const { num, label } of ownerList) {
            const jid         = num + '@s.whatsapp.net'
            const displayName = getOwnerName(num)

            let ppUrl = DEFAULT_PP
            try { ppUrl = await sock.profilePictureUrl(jid, 'image') } catch {}

            cards.push({
                image: { url: ppUrl },
                body: `${label}\n${displayName}\n\nRules:\n- Jangan spam\n- Jangan VidCall/Call Sembarangan\n- Jangan jadiin bahan bug/banned`,
                footer: botName,
                buttons: [
                    {
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({
                            display_text: '💬 Chat Owner',
                            url: `https://wa.me/${num}`
                        })
                    }
                ]
            })
        }

        await sock.sendMessage(m.chat, {
            text: `Hallo *${m.pushName}*\n\nKamu ingin mengetahui owner dari *${botName}*?\n\nBerikut daftar owner bot kami~`,
            title: 'Owner Info',
            footer: botName,
            cards
        }, { quoted: m.raw })

    // ── TYPE 3 — Contact card ─────────────────────────────────────────────────
    } else if (ownerType === 3) {
        const contacts = []

        for (const { num, label } of ownerList) {
            const displayName = getOwnerName(num)
            const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${displayName} (${label} ${botName})\nTEL;type=CELL;type=VOICE;waid=${num}:+${num}\nEND:VCARD`
            contacts.push({ vcard })
        }

        await sock.sendMessage(m.chat, {
            contacts: {
                displayName: `${botName} Owners`,
                contacts
            }
        }, { quoted: m.raw })

    // ── TYPE 4 — AIRich Post Card ─────────────────────────────────────────────
    } else if (ownerType === 4) {
        const { AIRich } = require('../../src/lib/aiRich')
        const DEFAULT_PP = 'https://cdn.gimita.id/download/pp%20kosong%20wa%20default%20(1)_1769506608569_52b57f5b.jpg'

        const posts = []
        for (const { num, label } of ownerList) {
            const jid         = num + '@s.whatsapp.net'
            const displayName = getOwnerName(num)

            let ppUrl = DEFAULT_PP
            try { ppUrl = await sock.profilePictureUrl(jid, 'image') } catch {}

            posts.push({
                profile_url: ppUrl,
                username: `~ ${displayName}`,
                caption: label,
                subtitle: `${label} • ${botName}`,
                thumbnail: ppUrl,
                footer: `Ketuk untuk chat ${displayName}~ 💖`,
                verified: configOwners.includes(num),
                source: 'NIXEL',
                orientation: 'LANDSCAPE',
                post_type: 'PHOTO',
                like: 0,
                comment: 0,
                share: 0,
                post_url: `https://wa.me/${num}?text=Hai%20${encodeURIComponent(displayName)}~`,
                post_deeplink: `https://wa.me/${num}?text=Hai%20${encodeURIComponent(displayName)}~`
            })
        }

        await new AIRich(sock)
            .addPost(posts)
            .send(m.chat, { quoted: m.raw })
        // ── TYPE 5 — AIRich Entity Sections ──────────────────────────────────────
    } else if (ownerType === 5) {
        const { AIRich } = require('itsuki')
        const rich = new AIRich(sock)
   
    // Rich image 16:9 di atas rich content
    const HEADER_IMAGE_URL = 'https://raw.githubusercontent.com/fiturmediafire-beep/Hsn-ai-Tourl/main/uploads/1789285684791-c9210383.jpg' // TODO: isi URL gambar 16:9 di sini

    if (HEADER_IMAGE_URL) {
        rich.addImage(HEADER_IMAGE_URL, { width: 1280, height: 720 })
    }

        const sections = []

        for (const { num, label } of ownerList) {
            const displayName = getOwnerName(num)
            const isMainOwner = configOwners.includes(num)

            let ppUrl = 'https://cdn.gimita.id/download/pp%20kosong%20wa%20default%20(1)_1769506608569_52b57f5b.jpg'

            try {
                ppUrl = await sock.profilePictureUrl(
                    num + '@s.whatsapp.net',
                    'image'
                )
            } catch {}

            const ownerSection = AIRich.newLayout('Single', {
                __typename: 'GenAICompactEntityPrimitive',
                title: displayName,
                subtitle: label,
                secondary_subtitle: isMainOwner
                    ? `Owner Utama • ${botName}`
                    : `Owner • ${botName}`,
                entity_id: Number(num),
                entity_url: `https://wa.me/${num}`,
                entity_type: 'PERSON',
                action_type: 'MESSAGE',
                is_verified: isMainOwner,
                image: {
                    url: ppUrl
                }
            })

            sections.push(ownerSection)
        }

        const submessage = {
            messageType: 2,
            messageText: `Pusat Kontak Owner ${botName}`
        }

        rich._addContent(sections, submessage)

        await rich.send(m.chat, { quoted: m.raw })
    }
}

module.exports = {
    config: pluginConfig,
    handler
}