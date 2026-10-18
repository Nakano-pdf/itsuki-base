/**
 * Balasan branding: gambar banner + caption (nama bot, nama owner, domain).
 * Dipakai untuk setiap balasan AI dan oleh plugin .brand.
 */

const axios = require('axios')
const config = require('../../config')

const DOMAIN = 'itsuki-nakano.my.id'
const DEFAULT_IMAGE = 'https://cdn.zass.in/3IPxdg5ZZD.jpg'

let cachedImage = null

function brandCaption(extraLine = '') {
    const botName = config.bot?.name || 'Itsuki Nakano'
    const ownerName = config.owner?.name || 'Owner'
    const lines = [botName, ownerName, DOMAIN]
    if (extraLine) lines.push(extraLine)
    return lines.join('\n')
}

// Unduh gambar banner sekali, lalu simpan di memori
async function getBrandImage(imageUrl = DEFAULT_IMAGE) {
    if (cachedImage) return cachedImage
    try {
        const res = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 20000 })
        cachedImage = Buffer.from(res.data)
        return cachedImage
    } catch {
        return null
    }
}

// Kirim teks sebagai gambar banner dengan caption: isi balasan + branding
async function sendBrandedText(sock, jid, text, quoted) {
    const body = String(text || '').trim().slice(0, 700)
    const caption = body ? `${body}\n\n${brandCaption()}` : brandCaption()
    const image = await getBrandImage()
    if (image) {
        return sock.sendMessage(jid, { image, caption }, { quoted })
    }
    return sock.sendMessage(jid, { text: caption }, { quoted })
}

// Kirim gambar branding sebagai balasan (dipakai plugin .brand)
async function sendBrandReply(sock, m, extraLine = '') {
    const image = await getBrandImage()
    const caption = brandCaption(extraLine)
    if (image) return sock.sendMessage(m.chat, { image, caption }, { quoted: m })
    return sock.sendMessage(m.chat, { text: caption }, { quoted: m })
}

module.exports = { brandCaption, sendBrandedText, sendBrandReply, DOMAIN }