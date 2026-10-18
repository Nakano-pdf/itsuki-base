const config = require('../../config')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'script',
    alias: ['sc', 'sourcecode', 'source'],
    category: 'main',
    description: 'Dapatkan source code bot',
    usage: '.script',
    example: '.script',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    try {
        const botName = config.bot?.name || 'Itsuki Nakano'
        const footer = config.settings?.footer || `© ${botName} 2026`
        const saluranId = config.saluran?.id || 'https://whatsapp.com/channel/0029VbDytkmBqbrF0rFKr12w'
        const saluranName = config.saluran?.name || botName
        const saluranUrl = config.saluran?.url || 'https://whatsapp.com/channel/0029VbDytkmBqbrF0rFKr12w'
        const scriptUrl ="https://github.com/"
        const scriptPrice = 0
        
        const thumbBuffer = await require('../../src/lib/assetManager').getAssetBuffer('images.itsuki')

        await sock.sendMessage(m.chat, {
            productMessage: {
                title: `${botName}`,
                description: `Source code WhatsApp Bot ${botName}\n\nFitur:\n• Multi-device support\n• 500+ Commands\n• Anti-spam & Anti-link\n• Game & RPG System\n• Panel Management\n• Auto-update`,
                thumbnail: thumbBuffer ? { url: require('../../src/lib/assetManager').getAssetUrl('images.itsuki') } : undefined,
                productId: 'SCRIPT001',
                retailerId: botName,
                url: scriptUrl,
                body: `Dapatkan script ${botName} sekarang!`,
                footer: footer,
                priceAmount1000: scriptPrice * 1000,
                currencyCode: 'IDR',
                buttons: [
                    {
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({
                            display_text: '📦 Download di GitHub',
                            url: scriptUrl
                        })
                    }
                ]
            },
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 99,
                isForwarded: true,
            }
        }, { quoted: m })

    } catch (error) {
        console.error('[Script] Error:', error.message)
        
        const botName = config.bot?.name || 'Itsuki Nakano'
        const scriptUrl = config.script?.url || 'https://github.com/'
        const saluranUrl = config.saluran?.url || 'https://whatsapp.com/channel/0029VbDytkmBqbrF0rFKr12w'
        
        await m.reply(
            `📦 *${botName} sᴄʀɪᴘᴛ*\n\n` +
            `╭┈┈⬡「 📋 *ɪɴꜰᴏ* 」\n` +
            `┃ 📝 ɴᴀᴍᴀ: ${botName}\n` +
            `┃ 💰 ʜᴀʀɢᴀ: ${config.script?.price ? `Rp ${config.script.price.toLocaleString('id-ID')}` : 'FREE'}\n` +
            `┃ 🔗 ɢɪᴛʜᴜʙ: ${scriptUrl}\n` +
            `┃ 📢 sᴀʟᴜʀᴀɴ: ${saluranUrl}\n` +
            `╰┈┈⬡\n\n` +
            `> Hubungi owner untuk info lebih lanjut`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}