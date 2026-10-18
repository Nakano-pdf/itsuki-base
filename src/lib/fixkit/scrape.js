/**
 * Fixkit scrape — ambil data dari halaman web (judul, meta, heading, link, gambar,
 * dan hasil CSS selector). Memblokir alamat lokal/privat supaya tidak bisa dipakai
 * untuk mengakses jaringan internal server.
 */
const axios = require('axios')
const cheerio = require('cheerio')

const PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.0\.0\.0|::1|\[::1\])/i

function validateUrl(raw) {
    let u
    try {
        u = new URL(String(raw).trim())
    } catch {
        throw new Error('URL tidak valid. Pakai format https://...')
    }
    if (!['http:', 'https:'].includes(u.protocol)) throw new Error('Hanya http/https yang diizinkan.')
    if (PRIVATE_HOST.test(u.hostname)) throw new Error('Alamat lokal/privat tidak diizinkan.')
    return u.toString()
}

async function scrapePage(rawUrl, { selector = '', attr = '', limit = 20 } = {}) {
    const url = validateUrl(rawUrl)
    const res = await axios.get(url, {
        timeout: 20000,
        maxContentLength: 5 * 1024 * 1024,
        maxRedirects: 3,
        responseType: 'text',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
            'Accept-Language': 'id,en;q=0.8',
        },
    })
    const $ = cheerio.load(String(res.data || ''))

    const meta = name =>
        $(`meta[name="${name}"]`).attr('content') || $(`meta[property="${name}"]`).attr('content') || ''

    const info = {
        url,
        status: res.status,
        title: $('title').first().text().trim(),
        description: meta('description'),
        og: { title: meta('og:title'), image: meta('og:image'), type: meta('og:type') },
        headings: $('h1, h2, h3').slice(0, 10).map((_, el) => $(el).text().trim()).get().filter(Boolean),
        links: $('a[href]').length,
        images: $('img').length,
        textPreview: $('body').text().replace(/\s+/g, ' ').trim().slice(0, 500),
    }

    if (selector) {
        let items = []
        try {
            items = $(selector)
                .slice(0, limit)
                .map((_, el) => (attr ? $(el).attr(attr) : $(el).text().trim()))
                .get()
                .filter(Boolean)
        } catch (e) {
            throw new Error(`Selector "${selector}" tidak valid: ${e.message}`)
        }
        info.selector = selector
        info.items = items
        info.count = items.length
    }
    return info
}

module.exports = { scrapePage, validateUrl }
