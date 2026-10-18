/**
 * AMFinder - Universal Social Media Alight Motion Preset Finder (5MB & XML)
 * Port untuk Itsuki Nakano Bot
 * Pure Node.js 18+ (tanpa dependensi tambahan)
 */

const URL_REGEX = /https?:\/\/[^\s"'<>\)]+/gi
const PRESET_5MB_REGEX = /alight\.link|alightcreative\.com/i
const PRESET_XML_REGEX = /drive\.google\.com|mediafire\.com|sfile\.mobi|\.xml(?:\?|$)/i
const SHORTLINK_REGEX = /^(?:https?:\/\/)?(?:www\.)?(?:s\.id|bit\.ly|tinyurl\.com|cutt\.ly|t\.co|rb\.gy|linktr\.ee|heylink\.me|beacons\.ai|taplink\.cc|snipfeed\.co)\//i

function parseMetaFromText(text = '') {
    const ratio = (text.match(/\b(9:16|16:9|1:1|4:5|3:4|4:3)\b/i) || [])[1]
    const pw = text.match(/(?:pw|pass(?:word)?|sandi|kode)\s*[:=]\s*([a-zA-Z0-9_@#!]+)/i)
    const size = text.match(/\b([<>]?\s*\d+(?:\.\d+)?\s*(?:mb|kb|gb))\b/i)
    return {
        ratio,
        password: pw ? pw[1] : undefined,
        detail: pw ? `Password: ${pw[1]}` : undefined,
        rawSize: size ? size[1].toUpperCase() : undefined
    }
}

async function resolveUrlAndExtract(rawUrl) {
    const nestedPresets = []
    let resolvedUrl = rawUrl
    try {
        const res = await fetch(rawUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            redirect: 'follow',
            signal: AbortSignal.timeout(5000)
        })
        resolvedUrl = res.url || rawUrl
        const ct = res.headers.get('content-type') || ''
        if (ct.includes('text/html') || ct.includes('json')) {
            const html = await res.text()
            for (const m of html.match(URL_REGEX) || []) {
                if ((PRESET_5MB_REGEX.test(m) || PRESET_XML_REGEX.test(m)) && !nestedPresets.includes(m)) nestedPresets.push(m)
            }
        }
    } catch {}
    return { resolvedUrl, nestedPresets }
}

function detectPlatform(url) {
    const u = url.toLowerCase()
    if (/tiktok\.com/i.test(u) || /^\d{10,}$/.test(u)) return 'tiktok'
    if (/youtu\.be|youtube\.com/i.test(u)) return 'youtube'
    if (/instagram\.com|instagr\.am/i.test(u)) return 'instagram'
    if (/facebook\.com|fb\.watch|fb\.com/i.test(u)) return 'facebook'
    if (/twitter\.com|x\.com/i.test(u)) return 'twitter'
    if (/threads\.(net|com)/i.test(u)) return 'threads'
    if (/capcut\.com/i.test(u)) return 'capcut'
    if (PRESET_5MB_REGEX.test(u) || PRESET_XML_REGEX.test(u) || SHORTLINK_REGEX.test(u)) return 'direct'
    return 'general'
}

function extractYouTubeId(urlOrId) {
    const str = (urlOrId || '').trim()
    if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str
    const m = str.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/i)
    return m ? m[1] : null
}

function buildPreset(type, url, meta, item, fallbackSize) {
    return {
        type,
        url,
        title: type === '5mb' ? 'Preset Alight Motion 5MB' : 'Preset Alight Motion XML File',
        size: meta.rawSize || fallbackSize,
        pinned: item.pinned,
        byAuthor: item.byAuthor,
        detail: meta.detail,
        password: meta.password,
        ratio: meta.ratio
    }
}

async function extractPresetsFromScanItems(scanItems) {
    const presetsMap = new Map()
    const otherLinksMap = new Map()

    await Promise.all(scanItems.map(async (item) => {
        const urls = item.text.match(URL_REGEX) || []
        if (!urls.length) return
        const meta = parseMetaFromText(item.text)

        for (const rawUrl of urls) {
            if (PRESET_5MB_REGEX.test(rawUrl)) {
                if (!presetsMap.has(rawUrl)) presetsMap.set(rawUrl, buildPreset('5mb', rawUrl, meta, item, 'Under 5MB'))
                continue
            }
            if (PRESET_XML_REGEX.test(rawUrl)) {
                if (!presetsMap.has(rawUrl)) presetsMap.set(rawUrl, buildPreset('xml', rawUrl, meta, item))
                continue
            }
            if (SHORTLINK_REGEX.test(rawUrl) || rawUrl.includes('alight')) {
                const { resolvedUrl, nestedPresets } = await resolveUrlAndExtract(rawUrl)
                if (PRESET_5MB_REGEX.test(resolvedUrl) && !presetsMap.has(resolvedUrl)) {
                    presetsMap.set(resolvedUrl, buildPreset('5mb', resolvedUrl, meta, item, 'Under 5MB'))
                } else if (PRESET_XML_REGEX.test(resolvedUrl) && !presetsMap.has(resolvedUrl)) {
                    presetsMap.set(resolvedUrl, buildPreset('xml', resolvedUrl, meta, item))
                }
                for (const nested of nestedPresets) {
                    if (presetsMap.has(nested)) continue
                    const is5 = PRESET_5MB_REGEX.test(nested)
                    presetsMap.set(nested, buildPreset(is5 ? '5mb' : 'xml', nested, meta, item, is5 ? 'Under 5MB' : undefined))
                }
                if (!PRESET_5MB_REGEX.test(resolvedUrl) && !PRESET_XML_REGEX.test(resolvedUrl) && !nestedPresets.length) {
                    if (!otherLinksMap.has(resolvedUrl)) otherLinksMap.set(resolvedUrl, { url: resolvedUrl, origin: item.sourceType })
                }
            } else if (!otherLinksMap.has(rawUrl)) {
                otherLinksMap.set(rawUrl, { url: rawUrl, origin: item.sourceType })
            }
        }
    }))

    return {
        presetLinks: Array.from(presetsMap.values()),
        otherLinks: Array.from(otherLinksMap.values())
    }
}

function buildResult(platform, { found, presetLinks, otherLinks, author = '', title = '', videoUrl, media, notFoundMsg }) {
    return {
        status: true,
        code: 200,
        
        result: {
            found,
            totalPresets: presetLinks.length,
            platform,
            author,
            title,
            videoUrl,
            media,
            presetLinks,
            message: found ? `Berhasil menemukan ${presetLinks.length} preset Alight Motion.` : notFoundMsg,
            otherLinks: otherLinks.length ? otherLinks : undefined
        }
    }
}

async function scrapeYouTube(url) {
    const videoId = extractYouTubeId(url)
    if (!videoId) throw new Error('Invalid YouTube video ID atau URL.')
    const scanItems = []
    let title = '', author = ''
    try {
        const r = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'User-Agent': 'com.google.android.youtube/19.09.37' },
            body: JSON.stringify({
                context: { client: { clientName: 'ANDROID', clientVersion: '19.09.37', hl: 'id', gl: 'ID' } },
                videoId
            }),
            signal: AbortSignal.timeout(6000)
        })
        if (r.ok) {
            const d = (await r.json())?.videoDetails || {}
            title = d.title || ''
            author = d.author || ''
            if (d.shortDescription) scanItems.push({ text: d.shortDescription, pinned: true, byAuthor: true, sourceType: 'description' })
        }
    } catch {}
    const { presetLinks, otherLinks } = await extractPresetsFromScanItems(scanItems)
    const found = presetLinks.length > 0
    return buildResult('youtube', {
        found, presetLinks, otherLinks, author, title,
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        notFoundMsg: 'Tidak ditemukan preset pada video YouTube ini.'
    })
}

async function scrapeTikTok(url) {
    const cleanUrl = url.trim()
    const res = await fetch('https://www.tikwm.com/api/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `url=${encodeURIComponent(cleanUrl)}&count=50`,
        signal: AbortSignal.timeout(10000)
    })
    const json = await res.json()
    if (json.code !== 0 || !json.data) throw new Error(json.msg || 'Gagal mengambil data video TikTok.')

    const v = json.data
    const uid = v.author?.unique_id || ''
    const scanItems = [{ text: v.title || '', pinned: true, byAuthor: true, sourceType: 'description' }]
    const { presetLinks, otherLinks } = await extractPresetsFromScanItems(scanItems)
    const found = presetLinks.length > 0
    return buildResult('tiktok', {
        found, presetLinks, otherLinks,
        author: uid ? `@${uid}` : '',
        title: v.title || '',
        videoUrl: cleanUrl,
        // media untuk kartu animasi: video preview (play) dan cover dari tikwm
        media: { play: v.play || v.wmplay || '', cover: v.cover || v.origin_cover || '', duration: v.duration || 0 },
        notFoundMsg: 'Tidak ditemukan preset pada video TikTok ini.'
    })
}

async function scrapeInstagram(url) {
    const sc = url.match(/(?:p|reel|reels)\/([A-Za-z0-9_-]+)/)
    const shortcode = sc ? sc[1] : null
    if (!shortcode) throw new Error('Shortcode Instagram tidak valid.')

    const ua = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'
    const home = await fetch('https://www.instagram.com/', {
        headers: { 'User-Agent': ua, Accept: 'text/html,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.8' },
        signal: AbortSignal.timeout(10000)
    })
    const cookies = home.headers.getSetCookie ? home.headers.getSetCookie() : []
    const cookieStr = cookies.map(c => c.split(';')[0]).join('; ')
    const csrf = (cookieStr.match(/csrftoken=([^;]+)/) || [])[1] || ''

    const payload = new URLSearchParams({
        variables: JSON.stringify({ shortcode, __relay_internal__pv__PolarisAIGMMediaWebLabelEnabledrelayprovider: false }),
        doc_id: '27128499623469141',
        server_timestamps: 'true'
    })
    const res = await fetch('https://www.instagram.com/graphql/query', {
        method: 'POST',
        headers: {
            'User-Agent': ua,
            Accept: '*/*',
            'Accept-Language': 'en-US,en;q=0.8',
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRFToken': csrf,
            'X-IG-App-ID': '936619743392459',
            Cookie: cookieStr,
            Referer: `https://www.instagram.com/p/${shortcode}/`
        },
        body: payload.toString(),
        signal: AbortSignal.timeout(15000)
    })
    const json = await res.json()
    const items = json?.data?.xdt_api__v1__media__shortcode__web_info?.items
    if (!items || !items.length) throw new Error('Media Instagram tidak ditemukan atau akun privat.')

    const item = items[0]
    const username = item.user?.username || ''
    const scanItems = [{ text: item.caption?.text || '', pinned: true, byAuthor: true, sourceType: 'description' }]
    const { presetLinks, otherLinks } = await extractPresetsFromScanItems(scanItems)
    const found = presetLinks.length > 0
    return buildResult('instagram', {
        found, presetLinks, otherLinks,
        author: username ? `@${username}` : '',
        videoUrl: url,
        notFoundMsg: 'Tidak ditemukan preset pada postingan Instagram ini.'
    })
}

async function scrapeDirect(url) {
    const scanItems = [{ text: url, pinned: true, byAuthor: true, sourceType: 'direct' }]
    const { presetLinks, otherLinks } = await extractPresetsFromScanItems(scanItems)
    const found = presetLinks.length > 0
    return buildResult('direct', {
        found, presetLinks, otherLinks, videoUrl: url,
        notFoundMsg: 'Link preset tidak dapat diekstrak.'
    })
}

async function findAmPresets(inputUrl) {
    if (!inputUrl || typeof inputUrl !== 'string') throw new Error('Parameter URL wajib disertakan.')
    const platform = detectPlatform(inputUrl)
    switch (platform) {
        case 'youtube': return scrapeYouTube(inputUrl)
        case 'tiktok': return scrapeTikTok(inputUrl)
        case 'instagram': return scrapeInstagram(inputUrl)
        case 'direct': return scrapeDirect(inputUrl)
        default: {
            const scanItems = [{ text: inputUrl, pinned: true, byAuthor: true, sourceType: 'general' }]
            const { presetLinks, otherLinks } = await extractPresetsFromScanItems(scanItems)
            const found = presetLinks.length > 0
            return buildResult(platform, {
                found, presetLinks, otherLinks, videoUrl: inputUrl,
                notFoundMsg: 'Preset tidak ditemukan.'
            })
        }
    }
}

module.exports = { findAmPresets, detectPlatform }
