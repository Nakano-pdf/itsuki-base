/**
 * Balasan branding: gambar + nama bot + nama owner + domain.
 * Format caption:
 *   <nama bot>
 *   |<nama owner>
 *   |domain : itsuki-nakano.my.id
 */

const config = require('../../config')

const DOMAIN = 'itsuki-nakano.my.id'
const DEFAULT_IMAGE = 'https://raw.githubusercontent.com/fiturmediafire-beep/hsn-assets/main/images/itsuki-rules.jpg'

function brandCaption(extraLine = '') {
    const botName = config.bot?.name || 'Itsuki Nakano'
    const ownerName = config.owner?.name || 'Owner'
    const lines = [botName, `|${ownerName}`, `|domain : ${DOMAIN}`]
    if (extraLine) lines.push(extraLine)
    return lines.join('\n')
}

// Kirim gambar branding sebagai balasan ke pesan m
async function sendBrandReply(sock, m, extraLine = '', imageUrl = DEFAULT_IMAGE) {
    const axios = require('axios')
    let image
    try {
        const res = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 20000 })
        image = Buffer.from(res.data)
    } catch {
        image = null
    }
    const caption = brandCaption(extraLine)
    if (image) {
        return sock.sendMessage(m.chat, { image, caption }, { quoted: m })
    }
    // gambar gagal diunduh: kirim teks saja, format tetap sama
    return sock.sendMessage(m.chat, { text: caption }, { quoted: m })
}

module.exports = { brandCaption, sendBrandReply, DOMAIN }
