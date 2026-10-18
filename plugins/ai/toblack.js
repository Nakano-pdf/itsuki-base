const nanoBanana = require('../../src/scraper/nanobanana')
const axios = require('axios')
const FormData = require('form-data')
const fetch = require('node-fetch')
const mime = require('mime-types')
const path = require('path')
const crypto = require('crypto')
const config = require('../../config')
const { GoogleGenerativeAI } = require('@google/generative-ai')

const pluginConfig = {
    name: 'toblack',
    alias: ['black', 'hitamkan', 'hitam', 'tohitam'],
    category: 'ai',
    description: 'Ubah gambar ke skin tone lebih gelap',
    usage: '.toblack (reply gambar)',
    example: '.toblack',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 2,
    isEnabled: true
}

const PROMPT_IRENG = `Make the skin tone of every human in this image extremely dark, pitch black like coal or obsidian. 
The skin should be the darkest possible black, darker than night, like closing your eyes in a dark room.
Keep everything else completely unchanged — background, clothes, hair, accessories, expression, composition.
Only the skin should be changed to absolute pitch black. No grey, no dark brown — pure black skin only.`

// ── Header wajib buat semua request ke api-faa.my.id ───────────────────────
// api-faa.my.id dilindungi Cloudflare managed challenge yang nge-block
// signature default axios ("axios/x.x.x"). JANGAN hapus header ini.
const API_FAA_HEADERS = {
    'User-Agent': 'Itsuki-Bot/2.0',
    'Accept': '*/*'
}

// ── Proteksi karakter Itsuki Nakano ───────────────────────────────────────────
async function isItsukiAi(buffer) {
    try {
        const keys = config.geminiApiKey
const genAI = new GoogleGenerativeAI(Array.isArray(keys) ? keys[Math.floor(Math.random() * keys.length)] : keys)
        const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' })

        const result = await model.generateContent([
            {
                inlineData: {
                    data: buffer.toString('base64'),
                    mimeType: 'image/jpeg'
                }
            },
            `Apakah gambar ini menampilkan karakter anime "Itsuki Nakano" dari anime/manga "Oshi no Ko"? 
Jawab HANYA dengan satu kata: YA atau TIDAK. Jangan tambahkan penjelasan apapun.`
        ])

        const text = result.response.text().trim().toUpperCase()
        return text.startsWith('YA')
    } catch (e) {
        console.log('[ToHitam] Cek Itsuki Nakano gagal, lanjut proses seperti biasa:', e.message)
        return false
    }
}

// ── GitHub uploader (temp, auto-dihapus lagi) ───────────────────────────────
const githubConfig = {
    token: config.github?.token || process.env.GITHUB_TOKEN || '',
    owner: config.github?.owner || process.env.GITHUB_OWNER || '',
    repo: config.github?.repo || process.env.GITHUB_REPO || '',
    branch: config.github?.branch || process.env.GITHUB_BRANCH || 'main',
    folder: config.github?.folder || process.env.GITHUB_FOLDER || 'uploads'
}

async function uploadToGithubTemp(buffer, filename) {
    const { token, owner, repo, branch, folder } = githubConfig
    if (!token || !owner || !repo) throw new Error('GitHub belum dikonfigurasi')

    const ext = path.extname(filename) || '.jpg'
    const safeName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`
    const filePath = `${folder}/${safeName}`

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json',
            'User-Agent': 'itsuki-tohitam'
        },
        body: JSON.stringify({ message: `upload: ${safeName}`, content: buffer.toString('base64'), branch }),
        timeout: 60000
    })
    if (!res.ok) {
        const err = await res.text().catch(() => '')
        throw new Error(`GitHub upload gagal (${res.status}): ${err.slice(0, 200)}`)
    }
    const data = await res.json()
    const sha = data?.content?.sha
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`
    return { url, path: filePath, sha }
}

async function deleteFromGithubTemp(filePath, sha) {
    const { token, owner, repo, branch } = githubConfig
    if (!token || !owner || !repo || !filePath || !sha) return
    try {
        await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json',
                'Content-Type': 'application/json',
                'User-Agent': 'itsuki-tohitam'
            },
            body: JSON.stringify({ message: `cleanup: hapus ${filePath}`, sha, branch }),
            timeout: 30000
        })
        console.log('[ToHitam] GitHub temp file dihapus:', filePath)
    } catch (e) {
        console.log('[ToHitam] Gagal hapus GitHub temp file:', filePath, '-', e.message)
    }
}

// ── Uploader lain ────────────────────────────────────────────────────────
async function uploadToCatbox(buffer, filename) {
    const form = new FormData()
    form.append('reqtype', 'fileupload')
    form.append('fileToUpload', buffer, { filename, contentType: mime.lookup(filename) || 'image/jpeg' })
    const res = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: form, headers: form.getHeaders(), timeout: 60000 })
    if (!res.ok) throw new Error('Catbox gagal')
    const url = await res.text()
    if (!url.startsWith('http')) throw new Error('Catbox response tidak valid')
    return url
}

async function uploadToLitterbox(buffer, filename) {
    const form = new FormData()
    form.append('reqtype', 'fileupload')
    form.append('time', '72h')
    form.append('fileToUpload', buffer, { filename, contentType: mime.lookup(filename) || 'image/jpeg' })
    const res = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', { method: 'POST', body: form, headers: form.getHeaders(), timeout: 60000 })
    if (!res.ok) throw new Error('Litterbox gagal')
    const url = await res.text()
    if (!url.startsWith('http')) throw new Error('Litterbox response tidak valid')
    return url
}

async function uploadToTmpFiles(buffer, filename) {
    const form = new FormData()
    form.append('file', buffer, { filename, contentType: mime.lookup(filename) || 'image/jpeg' })
    const res = await fetch('https://tmpfiles.org/api/v1/upload', { method: 'POST', body: form, headers: form.getHeaders(), timeout: 30000 })
    if (!res.ok) throw new Error('TmpFiles gagal')
    const data = await res.json()
    if (!data?.data?.url) throw new Error('TmpFiles response tidak valid')
    const idMatch = data.data.url.match(/\/(\d+)(?:\/|$)/)
    return idMatch ? `https://tmpfiles.org/dl/${idMatch[1]}/${filename}` : data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
}

async function uploadToQuax(buffer, filename) {
    const form = new FormData()
    form.append('files[]', buffer, { filename, contentType: mime.lookup(filename) || 'image/jpeg' })
    const res = await fetch('https://qu.ax/upload.php', { method: 'POST', body: form, headers: form.getHeaders(), timeout: 60000 })
    if (!res.ok) throw new Error('Qu.ax gagal')
    const data = await res.json()
    if (!data?.success || !data?.files?.[0]?.url) throw new Error('Qu.ax response tidak valid')
    return data.files[0].url
}

async function uploadToGofile(buffer, filename) {
    const serverRes = await fetch('https://api.gofile.io/servers', { timeout: 10000 })
    const serverData = await serverRes.json()
    if (!serverData?.data?.servers?.[0]?.name) throw new Error('Gofile server gagal')
    const server = serverData.data.servers[0].name
    const form = new FormData()
    form.append('file', buffer, { filename, contentType: mime.lookup(filename) || 'image/jpeg' })
    const res = await fetch(`https://${server}.gofile.io/uploadFile`, { method: 'POST', body: form, headers: form.getHeaders(), timeout: 60000 })
    if (!res.ok) throw new Error('Gofile gagal')
    const data = await res.json()
    if (!data?.data?.downloadPage) throw new Error('Gofile response tidak valid')
    return data.data.downloadPage
}

async function uploadToYpnk(buffer, filename) {
    const form = new FormData()
    form.append('files', buffer, { filename, contentType: mime.lookup(filename) || 'image/jpeg' })
    const res = await fetch('https://cdn.ypnk.biz.id/upload', {
        method: 'POST', body: form,
        headers: { ...form.getHeaders(), 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36' },
        timeout: 120000
    })
    if (!res.ok) throw new Error('YPNK gagal')
    const data = await res.json()
    if (!data?.success || !data?.files?.[0]?.url) throw new Error('YPNK response tidak valid')
    return `https://cdn.ypnk.biz.id${data.files[0].url}`
}

// ── Daftar kandidat host, urut dari yang paling diprioritaskan ─────────────
// Tiap kandidat balikin { url, cleanup } — cleanup null kalau host itu gak
// butuh/gak bisa dihapus manual (cuma GitHub yang butuh).
const HOST_CANDIDATES = [
    { name: 'Catbox', upload: async (buf, fn) => ({ url: await uploadToCatbox(buf, fn), cleanup: null }) },
    { name: 'Litterbox', upload: async (buf, fn) => ({ url: await uploadToLitterbox(buf, fn), cleanup: null }) },
    { name: 'TmpFiles', upload: async (buf, fn) => ({ url: await uploadToTmpFiles(buf, fn), cleanup: null }) },
    { name: 'Qu.ax', upload: async (buf, fn) => ({ url: await uploadToQuax(buf, fn), cleanup: null }) },
    { name: 'Gofile', upload: async (buf, fn) => ({ url: await uploadToGofile(buf, fn), cleanup: null }) },
    { name: 'YPNK', upload: async (buf, fn) => ({ url: await uploadToYpnk(buf, fn), cleanup: null }) },
    {
        // GitHub taruh paling akhir — cuma dicoba kalau semua host gratisan di atas
        // gagal, soalnya butuh config.github.token yang gak semua orang isi.
        name: 'GitHub',
        upload: async (buf, fn) => {
            const f = await uploadToGithubTemp(buf, fn)
            return { url: f.url, cleanup: () => deleteFromGithubTemp(f.path, f.sha) }
        }
    }
]

// ── Panggil api-faa dengan 1x percobaan buat 1 imageUrl ────────────────────
async function callApiFaa(endpoint, imageUrl, extraParams = '') {
    const url = `https://api-faa.my.id/faa/${endpoint}?url=${encodeURIComponent(imageUrl)}${extraParams}`
    const { data, status, headers: resHeaders } = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 100000, // di bawah limit 524 Cloudflare (~100 detik), biar kita yang nyerah duluan & lanjut ke host lain
        headers: API_FAA_HEADERS,
        validateStatus: () => true
    })
    const contentType = resHeaders?.['content-type'] || ''
    if (status === 200 && data && data.byteLength > 0 && contentType.includes('image')) {
        return Buffer.from(data)
    }
    const bodyText = Buffer.from(data || '').toString('utf8').slice(0, 300)
    throw new Error(`Status ${status} (${contentType || 'unknown'}): ${bodyText}`)
}

// ── Muter ke semua host: upload -> panggil api-faa -> kalau gagal, host berikutnya ──
async function processViaHostFallback(buffer, filename, endpoint, extraParams, logLabel) {
    const errors = []
    for (const host of HOST_CANDIDATES) {
        let uploaded
        try {
            uploaded = await host.upload(buffer, filename)
            console.log(`[${logLabel}] upload ${host.name} -> ${uploaded.url}`)
        } catch (e) {
            errors.push(`${host.name} (upload): ${e.message}`)
            console.log(`[${logLabel}] upload ${host.name} gagal:`, e.message)
            continue
        }

        try {
            const result = await callApiFaa(endpoint, uploaded.url, extraParams)
            if (uploaded.cleanup) await uploaded.cleanup()
            return result
        } catch (e) {
            errors.push(`${host.name} (api-faa): ${e.message}`)
            console.log(`[${logLabel}] api-faa via ${host.name} gagal:`, e.message)
            if (uploaded.cleanup) await uploaded.cleanup()
            continue
        }
    }
    throw new Error(errors.join(' | ') || 'Semua host gagal, tidak ada detail error')
}

// ── Handler ──────────────────────────────────────────────────────────────
async function handler(m, { sock }) {
    const raw = (m.args || []).join(' ').trim().toLowerCase()
    const mode = raw.split(/\s+/)[0] || ''

    const isImage = m.isImage || (m.quoted && (m.quoted.isImage || m.quoted.type === 'imageMessage'))

    if (!mode || !['coklat', 'ireng'].includes(mode)) {
        return m.reply(
            `🖤 *ᴛᴏ ʜɪᴛᴀᴍ*\n\n` +
            `Kyaa~ pilih dulu mau hitam yang mana~ ⭐\n\n` +
            `✦ \`${m.prefix}tohitam coklat\` — Gelap eksotis ala いつき〜なかの✨~\n` +
            `✦ \`${m.prefix}tohitam ireng\` — Hitam arang, gelap banget!\n\n` +
            `_Reply atau kirim gambarnya juga ya~ 🌸_`
        )
    }

    if (!isImage) {
        return m.reply(
            `🖤 *ᴛᴏ ʜɪᴛᴀᴍ*\n\n` +
            `Kyaa~ gambarnya mana dulu dong~ 🌸\n\n` +
            `\`${m.prefix}tohitam ${mode} (reply/kirim gambar)\``
        )
    }

    m.react('🕕')

    try {
        let buffer
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download()
        } else if (m.isMedia) {
            buffer = await m.download()
        }

        if (!buffer) {
            m.react('❌')
            return m.reply(`❌ *Ara ara~*\n\n> いつき〜なかの✨ gagal download gambarnya nih... coba lagi ya~ 🥺`)
        }

        const isAi = await isItsukiAi(buffer)
        if (isAi) {
            m.react('🚫')
            return m.reply(
                `🚫 *Eh, tunggu dulu!* ✦\n\n` +
                `> Itu Itsuki Nakano... masa いつき〜なかの✨ disuruh nge-hitamin diri sendiri? 🥺\n` +
                `> Owner juga pasti gak rela liat Itsuki Nakano dihitamin!\n\n` +
                `_Coba gambar lain ya~ 🌸_`
            )
        }

        // ── MODE COKLAT ─────────────────────────────────────────────────────
        if (mode === 'coklat') {
            try {
                const resultBuffer = await processViaHostFallback(buffer, 'image.jpg', 'tohitam', '', 'ToHitam-coklat')
                m.react('✅')
                return await sock.sendMessage(m.chat, {
                    image: resultBuffer,
                    caption: `🖤 *ᴛᴏ ʜɪᴛᴀᴍ — ᴄᴏᴋʟᴀᴛ*\n\n> Sugoi~! Kulitnya jadi gelap eksotis sekarang! Keren kan? ⭐`
                }, { quoted: m })
            } catch (err) {
                m.react('❌')
                return m.reply(
                    `❌ *Gomen ne~* ✦\n\n` +
                    `> Semua host gagal:\n> ${err.message}\n\n` +
                    `_Coba lagi nanti ya~ 🌸_`
                )
            }
        }

        // ── MODE IRENG ──────────────────────────────────────────────────────
        if (mode === 'ireng') {
            const NB_RETRIES = 2
            let nbError = ''
            let result = null

            for (let i = 1; i <= NB_RETRIES; i++) {
                try {
                    result = await nanoBanana(buffer, PROMPT_IRENG)
                    if (result) break
                } catch (e) {
                    nbError = e.message
                    console.log(`[ToHitam] NanoBanana gagal (percobaan ${i}/${NB_RETRIES}):`, e.message)
                }
                if (!result && i < NB_RETRIES) await new Promise(r => setTimeout(r, 2000 * i))
            }

            if (result) {
                m.react('✅')
                return await sock.sendMessage(m.chat, {
                    image: result,
                    caption: `🖤 *ᴛᴏ ʜɪᴛᴀᴍ — ɪʀᴇɴɢ*\n\n> Hitam arang~ Gelap banget kayak nutup mata! ⭐`
                }, { quoted: m })
            }

            console.log('[ToHitam] NanoBanana gagal total, fallback ke editfoto (multi-host)...')

            const efExtraParams = `&prompt=${encodeURIComponent(PROMPT_IRENG)}`
            try {
                const efBuffer = await processViaHostFallback(buffer, 'image.jpg', 'editfoto', efExtraParams, 'ToHitam-editfoto')
                m.react('✅')
                return await sock.sendMessage(m.chat, {
                    image: efBuffer,
                    caption: `🖤 *ᴛᴏ ʜɪᴛᴀᴍ — ɪʀᴇɴɢ*\n\n> Nano Banana sedang bermasalah, jadi いつき〜なかの✨ memakai mode cadangan~ 🌸`
                }, { quoted: m })
            } catch (err) {
                m.react('❌')
                return m.reply(
                    `❌ *Gomen ne~* ✦\n\n` +
                    `> Nano Banana dan EditFoto sama-sama gagal.\n` +
                    `> NanoBanana: ${nbError || '-'}\n` +
                    `> EditFoto (semua host): ${err.message}\n\n` +
                    `_Coba lagi beberapa saat ya~ 🌸_`
                )
            }
        }

    } catch (error) {
        m.react('❌')
        m.reply(
            `❌ *Gomen ne~* ✦\n\n` +
            `> ${error.message}\n\n` +
            `_Ai udah coba yang terbaik tapi gagal juga... coba lagi nanti ya~ 🌸_`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}