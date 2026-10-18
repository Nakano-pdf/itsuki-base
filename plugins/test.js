const fs = require('fs')
const config = require('../config')

const pluginConfig = {
    name: 'testing',
    alias: ['test', 'tes', 'itsukiai', 'itsuki'],
    category: 'main',
    description: 'Test plugin - Send PTV to newsletter',
    usage: '.test',
    isOwner: true,
    isGroup: false,
    isEnabled: true
}

async function handler(m, { sock }) {
    await m.react('🕕')
    await sock.sendMessage(m.chat, {
                        text: `*Halo @${m.pushName} 👋*`,
                        contextInfo: {
                            mentionedJid: [m.sender],
                            forwardingScore: 9,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterName: "AlwaysLennz || AlwaysTeam",
                                newsletterJid: "https://whatsapp.com/channel/0029VbDytkmBqbrF0rFKr12w"
                            },
                            externalAdReply: {
                                title: `WELCOME TO ${m.sender.toUpperCase()}`,
                                body: `Join Our Community`,
                                thumbnail: await require('../src/lib/assetManager').getAssetBuffer('images.itsuki'),
                                sourceUrl: config.info?.grupwa || '',
                                mediaUrl: config.info?.grupwa || '',
                                mediaType: 2,
                                // renderLargerThumbnail: true
                            }
                        }
                    })
}

module.exports = {
    config: pluginConfig,
    handler
}