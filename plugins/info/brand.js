/**
✧ Name    : brand
✧ Alias   : branding
✧ Category: info
✧ Deskripsi: Tampilkan balasan branding bot (gambar + nama bot + nama owner + domain).
**/

const { sendBrandReply } = require('../../src/lib/brandReply')

const pluginConfig = {
    name: 'brand',
    alias: ['branding'],
    category: 'info',
    description: 'Balasan branding bot dengan gambar, nama owner, dan domain',
    usage: '.brand',
    example: '.brand',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    return sendBrandReply(sock, m)
}

module.exports = {
    config: pluginConfig,
    handler
}
