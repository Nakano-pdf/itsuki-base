const fs = require('fs')

const pluginConfig = {
    name: 'testing2',
    alias: ['test2'],
    category: 'main',
    description: 'Test plugin - Send PTV to newsletter',
    usage: '.test',
    isOwner: true,
    isGroup: false,
    isEnabled: true
}

async function handler(m, { sock }) {
    await m.react('🕕')
    await sock.relayMessage(m.chat, {
        pollResultSnapshotMessage: {
            name: "AlwaysLennz || AlwaysTeam",
            pollVotes: [
            {
                optionName: "AlwaysLennz || AlwaysTeam",
                optionVoteCount: "99999999999999"
            },
            {
                optionName: "AlwaysLennz || AlwaysTeam",
                optionVoteCount: "88888888888888"
            },
            {
                optionName: "AlwaysLennz || AlwaysTeam",
                optionVoteCount: "5555"
            },
            {
                optionName: "AlwaysLennz || AlwaysTeam",
                optionVoteCount: "66666666"
            },
            {
                optionName: "AlwaysLennz || AlwaysTeam",
                optionVoteCount: "777777777777"
            },
            {
                optionName: "AlwaysLennz || AlwaysTeam",
                optionVoteCount: "2"
            },
            ],
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterName: "AlwaysLennz || AlwaysTeam",
                    newsletterJid: "https://whatsapp.com/channel/0029VbDytkmBqbrF0rFKr12w"
                }
            },
            
        }
    }, { messageId: m.key.id, quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}