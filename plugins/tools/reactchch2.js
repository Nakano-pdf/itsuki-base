/**
✧ Name    : reactchch
✧ Alias   : reactch
✧ Category: tools
✧ Deskripsi: Mengirim reaction ke WhatsApp Channel melalui API theresav.
✧ Premium : Yes
**/

const axios = require('axios')

const pluginConfig = {
    name: 'reactchch2',
    alias: ['reactch2'],
    category: 'tools',
    description: 'Mengirim reaction ke WhatsApp Channel melalui API theresav',
    usage: '.reactchch2 <url> <emoji> <jumlah>',
    example: '.reactchch2 https://whatsapp.com/channel/xxxx 😭,😂,❤️ 300',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 1,
    isEnabled: true
}

// =====================================================
// API THERESAV
// =====================================================

const API_URL = 'https://api.theresav.eu/api/premium/reactch'

// Ambil API key dari database/fixkit/apis.json
// Sama seperti sistem stalkrobloxv2.
const { getApi } = require('../../src/lib/fixkit/store')

const getApiKey = () =>
    getApi('theresav')?.apiKey ||
    process.env.THERESAV_APIKEY ||
    ''

// =====================================================
// CONFIG
// =====================================================

const ALLOWED_AMOUNTS = [300, 500, 1000]
const MAX_REACTIONS = 5

// URL WhatsApp Channel
const CHANNEL_URL_RE =
    /^https?:\/\/(?:www\.)?whatsapp\.com\/channel\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)?(?:\?.*)?$/i

// =====================================================
// REQUEST API
// =====================================================

async function reactChannel(url, reaction) {
    const apiKey = getApiKey()

    if (!apiKey) {
        throw new Error('API key theresav belum diatur.')
    }

    const res = await axios.get(API_URL, {
        params: {
            url,
            reaction
        },
        headers: {
            'x-apikey': apiKey,
            'User-Agent': 'Mozilla/5.0'
        },
        timeout: 30000,
        validateStatus: () => true
    })

    if (res.status >= 400) {
        const reason =
            res.data?.message ||
            res.data?.error ||
            res.data?.msg ||
            `HTTP ${res.status}`

        throw new Error(`API theresav gagal: ${reason}`)
    }

    return res.data
}

// =====================================================
// PARSE INPUT
// =====================================================
//
// Format:
//
// .reactchch URL 😭 300
// .reactchch URL 😭,😂,❤️ 500
// .reactchch URL 😭,😂,❤️,🔥,👍 1000
//
// =====================================================

function parseInput(input) {
    const parts = input
        .trim()
        .split(/\s+/)
        .filter(Boolean)

    if (parts.length < 3) {
        return {
            url: '',
            reactions: [],
            amount: 0
        }
    }

    const url = parts[0]
    const amount = Number(parts[parts.length - 1])

    const emojiText = parts
        .slice(1, -1)
        .join('')

    const reactions = emojiText
        .split(',')
        .map(v => v.trim())
        .filter(Boolean)

    return {
        url,
        reactions,
        amount
    }
}

// =====================================================
// DISTRIBUSI JUMLAH
// =====================================================
//
// Contoh:
//
// 300 + 3 emoji
// 100 + 100 + 100
//
// 500 + 3 emoji
// 167 + 167 + 166
//
// 1000 + 5 emoji
// 200 + 200 + 200 + 200 + 200
//
// =====================================================

function distributeAmount(reactions, amount) {
    const base = Math.floor(amount / reactions.length)
    const remainder = amount % reactions.length

    return reactions.map((emoji, index) => ({
        emoji,
        count: base + (index < remainder ? 1 : 0)
    }))
}

// =====================================================
// DELAY
// =====================================================

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

// =====================================================
// HANDLER
// =====================================================

async function handler(m, { sock }) {
    const input = (m.text || '').trim()

    // =================================================
    // HELP
    // =================================================

    if (!input) {
        return m.reply(
            `💠 *ʀᴇᴀᴄᴛ ᴄʜᴀɴɴᴇʟ*\n\n` +
            `Fitur ini khusus *PREMIUM*.\n\n` +

            `> *Format:*\n` +
            `${m.prefix}reactchch <url> <emoji> <jumlah>\n\n` +

            `> *1 Emoji:*\n` +
            `${m.prefix}reactchch https://whatsapp.com/channel/xxxx 😭 300\n\n` +

            `> *Multiple Emoji:*\n` +
            `${m.prefix}reactchch https://whatsapp.com/channel/xxxx 😭,😂,❤️ 500\n\n` +

            `> *5 Emoji:*\n` +
            `${m.prefix}reactchch https://whatsapp.com/channel/xxxx 😭,😂,❤️,🔥,👍 1000\n\n` +

            `> Maksimal: *5 emoji*\n` +
            `> Jumlah: *300 / 500 / 1000*`
        )
    }

    // =================================================
    // API KEY
    // =================================================

    if (!getApiKey()) {
        return m.reply(
            `❌ API key theresav belum diatur.\n\n` +
            `Tambahkan API key di:\n` +
            `> database/fixkit/apis.json`
        )
    }

    // =================================================
    // PARSE
    // =================================================

    const {
        url,
        reactions,
        amount
    } = parseInput(input)

    // =================================================
    // VALIDASI URL
    // =================================================

    if (!url || !CHANNEL_URL_RE.test(url)) {
        return m.reply(
            `❌ *URL CHANNEL TIDAK VALID*\n\n` +
            `Masukkan URL WhatsApp Channel yang valid.\n\n` +
            `Contoh:\n` +
            `> ${m.prefix}reactchch https://whatsapp.com/channel/xxxx 😭 300`
        )
    }

    // =================================================
    // VALIDASI EMOJI
    // =================================================

    if (!reactions.length) {
        return m.reply(
            `❌ Emoji belum dimasukkan.\n\n` +
            `Contoh:\n` +
            `> ${m.prefix}reactchch ${url} 😭 300`
        )
    }

    if (reactions.length > MAX_REACTIONS) {
        return m.reply(
            `❌ Maksimal *${MAX_REACTIONS} emoji* dalam satu request.`
        )
    }

    // Hapus emoji duplikat
    const uniqueReactions = [
        ...new Set(reactions)
    ]

    // =================================================
    // VALIDASI JUMLAH
    // =================================================

    if (!ALLOWED_AMOUNTS.includes(amount)) {
        return m.reply(
            `❌ *JUMLAH TIDAK VALID*\n\n` +
            `Jumlah yang tersedia:\n` +
            `> 300\n` +
            `> 500\n` +
            `> 1000`
        )
    }

    await m.react('⏳')

    // =================================================
    // DISTRIBUSI
    // =================================================

    const distribution =
        distributeAmount(
            uniqueReactions,
            amount
        )

    let success = 0
    let failed = 0

    const stats = {}

    for (const item of distribution) {
        stats[item.emoji] = {
            requested: item.count,
            success: 0,
            failed: 0
        }
    }

    // =================================================
    // PROSES
    // =================================================

    try {

        for (const item of distribution) {

            for (let i = 0; i < item.count; i++) {

                try {

                    await reactChannel(
                        url,
                        item.emoji
                    )

                    success++
                    stats[item.emoji].success++

                } catch (error) {

                    failed++
                    stats[item.emoji].failed++

                    console.log(
                        `[reactchch] ${item.emoji} gagal:`,
                        error.message
                    )

                    /*
                     * Jika terkena rate limit,
                     * beri jeda lebih panjang.
                     */

                    if (
                        /429|rate.?limit|too many/i
                            .test(error.message)
                    ) {
                        await sleep(1500)
                    } else {
                        await sleep(500)
                    }

                    continue
                }

                /*
                 * Delay normal antar request.
                 */

                await sleep(250)
            }
        }

        // =================================================
        // REACTION STATUS
        // =================================================

        await m.react(
            success > 0
                ? '✅'
                : '❌'
        )

        // =================================================
        // BREAKDOWN
        // =================================================

        let breakdown = ''

        for (const item of distribution) {

            const data =
                stats[item.emoji]

            breakdown +=
                `> ${item.emoji} × ${data.requested}\n` +
                `  ├─ ✅ Berhasil: ${data.success}\n` +
                `  └─ ❌ Gagal: ${data.failed}\n`
        }

        // =================================================
        // HASIL
        // =================================================

        return m.reply(
            `╭─❖ *ʀᴇᴀᴄᴛ ᴄʜᴀɴɴᴇʟ* ❖─╮\n` +
            `│\n` +
            `│ 🔗 *Target:*\n` +
            `│ ${url}\n` +
            `│\n` +
            `│ 😀 *Reaction:*\n` +
            `│ ${uniqueReactions.join(' ')}\n` +
            `│\n` +
            `│ 🔢 *Jumlah:* ${amount}\n` +
            `│\n` +
            `│ *Breakdown:*\n` +
            breakdown +
            `│\n` +
            `│ 📊 *Total diproses:* ${success + failed}\n` +
            `│ ✅ *Berhasil:* ${success}\n` +
            `│ ❌ *Gagal:* ${failed}\n` +
            `│\n` +
            `╰────────────────────╯`
        )

    } catch (e) {

        await m.react('❌')

        return m.reply(
            `❌ *REACT CHANNEL ERROR*\n\n` +
            `> ${e.message || 'Terjadi kesalahan.'}`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}