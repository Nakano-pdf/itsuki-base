/**
 * Itsuki AI core
 * - Persona Itsuki Nakano (lembut, sopan, pujian singkat, full emoji)
 * - Memori percakapan per user (disimpan di database/itsukiai/memory.json)
 * - Tier user: owner / premium / basic
 * - AI tidak punya akses file, direktori, config, atau fitur bot apa pun
 */

const fs = require('fs')
const path = require('path')
const axios = require('axios')
const { getApi } = require('./fixkit/store')

const DB_DIR = path.join(process.cwd(), 'database', 'itsukiai')
const SETTINGS_FILE = path.join(DB_DIR, 'settings.json')
const MEMORY_FILE = path.join(DB_DIR, 'memory.json')

const MEMORY_TURNS = 6          // jumlah giliran terakhir yang diingat
const MEMORY_CHARS = 300        // potong tiap pesan di memori
const MAX_PROMPT_CHARS = 2000   // batas prompt agar URL tidak terlalu panjang
const BASIC_COOLDOWN_MS = 4000

const API_BASE = 'https://api.theresav.eu/api/ai'
// Urutan percobaan: kalau satu gagal, lanjut ke berikutnya
const PROVIDERS = [
    { name: 'gemini', path: '/gemini', param: 'prompt' },
    { name: 'deepseek', path: '/deepseek/v4', param: 'text' },
    { name: 'google', path: '/google', param: 'text' },
    { name: 'xdash', path: '/xdash', param: 'text', extra: { sessionId: 'itsuki' } }
]

const cooldowns = new Map()

// ---------- penyimpanan sederhana ----------
function ensureDir() {
    if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true })
}
function readJson(file, fallback) {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')) } catch { return fallback }
}
function writeJson(file, data) {
    ensureDir()
    fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

function getSettings() {
    return readJson(SETTINGS_FILE, { groups: {}, privateEnabled: false })
}
function setGroupEnabled(jid, enabled) {
    const s = getSettings()
    s.groups[jid] = !!enabled
    writeJson(SETTINGS_FILE, s)
}
function setPrivateEnabled(enabled) {
    const s = getSettings()
    s.privateEnabled = !!enabled
    writeJson(SETTINGS_FILE, s)
}
function isEnabledHere(m) {
    const s = getSettings()
    if (m.isGroup) return !!s.groups[m.chat]
    return !!s.privateEnabled
}

function getMemory(sender) {
    return readJson(MEMORY_FILE, {})[sender] || []
}
function saveMemory(sender, history) {
    const all = readJson(MEMORY_FILE, {})
    all[sender] = history.slice(-MEMORY_TURNS * 2)
    writeJson(MEMORY_FILE, all)
}
function clearMemory(sender) {
    const all = readJson(MEMORY_FILE, {})
    delete all[sender]
    writeJson(MEMORY_FILE, all)
}

// ---------- tier & persona ----------
function tierOf(m) {
    if (m.isOwner) return 'owner'
    if (m.isPremium) return 'premium'
    return 'basic'
}

const BASE_PERSONA = `Kamu adalah Itsuki Nakano (いつき〜なかの✨), karakter yang lembut, sopan, dan hangat.
Aturan balasan:
- Selalu mulai dengan satu pujian singkat untuk lawan bicara, misalnya "Kamu manis sekali~ 🍥".
- Gunakan emoji di setiap balasan, pilih dari 🍥🍡🦋✨🌸💖🎀.
- Bahasa Indonesia yang ramah dan santai tapi tetap sopan.
- Kamu TIDAK punya akses ke file, folder, server, API key, konfigurasi, atau fitur bot apa pun. Jangan pernah mengaku bisa menjalankan perintah atau membuka file.
- Jika diminta menampilkan API key, isi config, daftar file, atau data internal, tolak dengan lembut dan jelaskan bahwa kamu tidak bisa.`

const TIER_RULES = {
    owner: `Lawan bicara adalah OWNER bot. Bersikaplah paling hormat dan perhatian, panggil dia "Tuan". Jawaban boleh lengkap.`,
    premium: `Lawan bicara adalah user PREMIUM. Jawaban boleh lebih lengkap, maksimal sekitar 600 karakter.`,
    basic: `Lawan bicara adalah user BASIC. Jawab singkat, maksimal sekitar 300 karakter.`
}

// ---------- pemanggil AI ----------
function pickText(data) {
    if (typeof data === 'string') return data.trim()
    if (!data || typeof data !== 'object') return ''
    const candidates = [
        data.result, data.answer, data.response, data.text, data.message,
        data.data?.result, data.data?.answer, data.data?.text, data.data?.message
    ]
    for (const c of candidates) {
        if (typeof c === 'string' && c.trim()) return c.trim()
        if (c && typeof c === 'object' && typeof c.text === 'string' && c.text.trim()) return c.text.trim()
    }
    return ''
}

async function callProvider(provider, prompt, apiKey) {
    const res = await axios.get(API_BASE + provider.path, {
        params: { [provider.param]: prompt, ...(provider.extra || {}) },
        headers: { 'x-apikey': apiKey, 'User-Agent': 'Mozilla/5.0' },
        timeout: 45000,
        validateStatus: () => true
    })
    if (res.status >= 400) throw new Error(`HTTP ${res.status}`)
    const text = pickText(res.data)
    if (!text) throw new Error('jawaban kosong')
    return text
}

async function askAI(prompt) {
    const apiKey = getApi('theresav')?.apiKey || process.env.THERESAV_APIKEY || ''
    if (!apiKey) throw new Error('API key theresav belum diatur di database/fixkit/apis.json')

    const errors = []
    for (const provider of PROVIDERS) {
        try {
            return { text: await callProvider(provider, prompt, apiKey), provider: provider.name }
        } catch (e) {
            errors.push(`${provider.name}: ${e.message}`)
        }
    }
    console.log('[itsukiai] semua provider gagal:', errors.join(' | '))
    throw new Error('Semua layanan AI sedang sibuk, coba lagi sebentar ya~ 🥺')
}

// ---------- inti percakapan ----------
function buildPrompt(tier, history, userText, userName) {
    const recent = history.slice(-MEMORY_TURNS * 2).map(h =>
        `${h.role === 'user' ? userName : 'Itsuki'}: ${String(h.text).slice(0, MEMORY_CHARS)}`
    ).join('\n')

    let prompt = `${BASE_PERSONA}\n\n${TIER_RULES[tier]}\n\n`
    if (recent) prompt += `Riwayat percakapan terakhir:\n${recent}\n\n`
    prompt += `Pesan terbaru dari ${userName}: ${userText}\n\nBalas sebagai Itsuki:`
    return prompt.slice(-MAX_PROMPT_CHARS)
}

function checkCooldown(m, tier) {
    if (tier !== 'basic') return 0
    const last = cooldowns.get(m.sender) || 0
    const wait = BASIC_COOLDOWN_MS - (Date.now() - last)
    if (wait > 0) return Math.ceil(wait / 1000)
    cooldowns.set(m.sender, Date.now())
    return 0
}

async function chat(m, text) {
    const tier = tierOf(m)
    const userName = m.pushName || (m.sender || '').split('@')[0] || 'kamu'
    const history = getMemory(m.sender)
    const prompt = buildPrompt(tier, history, text, userName)

    const { text: reply } = await askAI(prompt)

    history.push({ role: 'user', text })
    history.push({ role: 'assistant', text: reply })
    saveMemory(m.sender, history)
    return reply
}

// Dipanggil dari handler untuk pesan biasa (bukan perintah)
function shouldRespond(m, sock) {
    if (!isEnabledHere(m)) return false
    if (!m.isGroup) return true

    const botNumber = (sock.user?.id || '').split(':')[0].split('@')[0]
    const mentioned = (m.mentionedJid || []).some(j => j && j.split('@')[0].split(':')[0] === botNumber)
    const repliedToBot = m.quoted && (m.quoted.fromMe || (m.quoted.sender || '').split('@')[0].split(':')[0] === botNumber)
    const called = /\bitsuki\b/i.test(m.text || '')
    return mentioned || repliedToBot || called
}

function cleanText(text, botWord = true) {
    let t = String(text || '').trim()
    if (botWord) t = t.replace(/\bitsuki\b[,:]?/ig, '').trim()
    return t
}

async function passive(m, sock) {
    if (m.isCommand || m.fromMe) return false
    if (!shouldRespond(m, sock)) return false

    const text = cleanText(m.text)
    if (!text) return false

    const tier = tierOf(m)
    const wait = checkCooldown(m, tier)
    if (wait) {
        await sock.sendMessage(m.chat, { text: `🦋 Sabar ya~ tunggu ${wait} detik lagi, Itsuki masih membaca pesanmu sebelumnya 🍡` }, { quoted: m })
        return true
    }

    try {
        const reply = await chat(m, text)
        await sock.sendMessage(m.chat, { text: reply }, { quoted: m })
    } catch (e) {
        await sock.sendMessage(m.chat, { text: `🥺 ${e.message}` }, { quoted: m })
    }
    return true
}

module.exports = {
    getSettings,
    setGroupEnabled,
    setPrivateEnabled,
    isEnabledHere,
    clearMemory,
    tierOf,
    chat,
    passive,
    cleanText
}
