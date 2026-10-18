const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const config = require('../../config')
const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = require('itsuki')

const pluginConfig = {
    name: 'buatsaluran',
    alias: ['createsaluran', 'createnewsletter'],
    category: 'owner',
    description: 'Buat saluran/newsletter baru',
    usage: '.buatsaluran <nama>|<deskripsi>',
    example: '.buatsaluran Info Bot|Update terbaru bot kami',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

// ── Load gambar dari config.assets (URL) ──
let cachedThumb = null
let cachedImage = null
;(async () => {
    try {
        const { getAssetBuffer } = require('../../src/lib/assetManager')
        cachedThumb = await getAssetBuffer('images.itsuki2')
        cachedImage = await getAssetBuffer('images.itsuki')
    } catch (e) {}
})()

function getVerifiedQuoted() {
    return {
        key: { participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast' },
        message: {
            contactMessage: {
                displayName: `🪸 ${config.bot?.name}`,
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:XL;ttname,;;;\nFN:ttname\nitem1.TEL;waid=13135550002:+1 (313) 555-0002\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
                sendEphemeral: true
            }
        }
    }
}

async function handler(m, { sock }) {
    const text = m.text?.trim() || ''
    const pipeIdx = text.indexOf('|')

    let name, description
    if (pipeIdx === -1) {
        name = text
        description = ''
    } else {
        name = text.substring(0, pipeIdx).trim()
        description = text.substring(pipeIdx + 1).trim()
    }

    if (!name || name.length < 2) {
        return m.reply(
            `📢 *ʜᴏsʜɪɴᴏ ᴀɪ ʙᴜᴀᴛ sᴀʟᴜʀᴀɴ*\n\n` +
            `"Mau bikin saluran baru? Kasih namanya dulu dong~" 🌟\n\n` +
            `> \`${m.prefix}buatsaluran Nama Saluran\`\n` +
            `> \`${m.prefix}buatsaluran Nama|Deskripsi\`\n\n` +
            `📝 Contoh:\n` +
            `> \`${m.prefix}buatsaluran Info Bot\`\n` +
            `> \`${m.prefix}buatsaluran Info Bot|Update terbaru bot kami\``
        )
    }

    m.react('⭐')

    try {
        const result = await sock.newsletterCreate(name, description || '', 'ALL')
        const saluranId   = result?.id || result?.thread_metadata?.id || 'unknown'
        const saluranName = result?.name || name
        const saluranLink = result?.invite ? `https://whatsapp.com/channel/${result.invite}` : null

        const cfgSaluranId   = config.saluran?.id   || 'https://whatsapp.com/channel/0029VbDytkmBqbrF0rFKr12w'
        const cfgSaluranName = config.saluran?.name || config.bot?.name || 'Itsuki Nakano Bot'
        const cfgSaluranLink = config.saluran?.link || cfgSaluranId

        // ── Prepare header media (upload ke WA server) ──
        let headerMedia = null
        const imageBuffer = cachedImage || cachedThumb
        if (imageBuffer) {
            try {
                const resized = await sharp(imageBuffer)
                    .resize(300, 300, { fit: 'cover' })
                    .jpeg({ quality: 80 })
                    .toBuffer()
                headerMedia = await prepareWAMessageMedia(
                    { image: resized },
                    { upload: sock.waUploadToServer }
                )
            } catch (e) {
                console.error('[buatsaluran] Media prep error:', e.message)
            }
        }

        // ── Caption ──
        const caption =
            `📢 *sᴀʟᴜʀᴀɴ ᴅɪʙᴜᴀᴛ*\n\n` +
            `"Yeay! Salurannya udah jadi~ 💖"\n\n` +
            `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
            `┃ 📝 ɴᴀᴍᴀ: \`${saluranName}\`\n` +
            (description ? `┃ 💬 ᴅᴇsᴋ: \`${description}\`\n` : '') +
            `┃ 🆔 ɪᴅ: \`${saluranId}\`\n` +
            `┃ 👥 sᴜʙsᴄʀɪʙᴇʀ: \`${result?.subscribers || 0}\`\n` +
            `╰┈┈⬡`

        // ── Buttons ──
        const buttons = [
            {
                name: 'cta_copy',
                buttonParamsJson: JSON.stringify({
                    display_text: '📋 Salin ID Saluran',
                    copy_code: saluranId
                })
            },
            ...(saluranLink ? [{
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '📢 Buka Saluran',
                    url: saluranLink,
                    merchant_url: saluranLink
                })
            }] : [])
        ]

        // ── interactiveMessage gaya v9 ──
        const msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                        header: proto.Message.InteractiveMessage.Header.fromObject({
                            hasMediaAttachment: !!headerMedia,
                            ...(headerMedia || {})
                        }),
                        body: proto.Message.InteractiveMessage.Body.fromObject({
                            text: caption
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.fromObject({
                            text: `© ${config.bot?.name || 'Itsuki Nakano Bot'}`
                        }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                            messageParamsJson: JSON.stringify({
                                limited_time_offer: {
                                    text: saluranName,
                                    url: cfgSaluranLink,
                                    copy_code: saluranId,
                                    expiration_time: Date.now() * 999
                                },
                                bottom_sheet: {
                                    in_thread_buttons_energi: 2,
                                    divider_indices: [1, 2, 999],
                                    list_title: config.bot?.name || 'Itsuki Nakano Bot',
                                    button_title: '📢 Detail Saluran'
                                }
                            }),
                            buttons: buttons
                        }),
                        contextInfo: {
                            mentionedJid: [m.sender],
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: cfgSaluranId,
                                newsletterName: cfgSaluranName,
                                serverMessageId: 127
                            }
                        }
                    })
                }
            }
        }, { userJid: m.sender, quoted: getVerifiedQuoted() })

        await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
        await m.react('✅')

    } catch (err) {
        m.react('💔')
        m.reply(
            `💔 *ᴇʀʀᴏʀ ᴘᴀɴɢɢᴜɴɢ*\n\n` +
            `"Kyaa~ gagal bikin salurannya~" 🎤\n\n` +
            `> Masalah: ${err.message}`
        )
    }
}

module.exports = { config: pluginConfig, handler }