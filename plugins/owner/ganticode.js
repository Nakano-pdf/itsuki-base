const fs = require('fs')
const path = require('path')
const vm = require('vm')
const { hotReloadPlugin } = require('../../src/lib/plugins')

const pendingConfirm = new Map()

const pluginConfig = {
    name: 'ganticode',
    alias: ['replaceplugin', 'updateplugin', 'gantiplugin'],
    category: 'owner',
    description: 'Ganti code plugin yang sudah ada',
    usage: '.ganticode [namafile] [folder]',
    example: '.ganticode ping main',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

const AI = {
    ok:      (msg) => `✨ *${msg}*\n\n> いつき〜なかの✨ seneng bisa bantu kamu~ 💖`,
    err:     (msg) => `💔 *Aduh~ Ada yang salah nih!*\n\n> ${msg}\n\n> Jangan nyerah ya, いつき〜なかの✨ tetap di sini! ✨`,
    warn:    (msg) => `🌸 *Hmm~ Perhatiin dulu ya!*\n\n> ${msg}`,
    loading: ()    => `⏳ *Sabar ya~*\n\n> いつき〜なかの✨ lagi proses buat kamu! 💫`,
}

function extractPluginInfo(code) {
    const info = { name: null, category: null, commands: [] }

    const nameStr = code.match(/name:\s*['"`]([^'"`]+)['"`]/)
    if (nameStr) {
        info.name = nameStr[1]
        info.commands = [nameStr[1]]
    }

    const nameArr = code.match(/name:\s*\[([^\]]+)\]/)
    if (nameArr) {
        const items = nameArr[1].match(/['"`]([^'"`]+)['"`]/g)
        if (items && items.length > 0) {
            info.commands = items.map(s => s.replace(/['"`]/g, ''))
            info.name = info.commands[0]
        }
    }

    const aliasArr = code.match(/alias:\s*\[([^\]]*)\]/)
    if (aliasArr) {
        const items = aliasArr[1].match(/['"`]([^'"`]+)['"`]/g)
        if (items) {
            info.commands.push(...items.map(s => s.replace(/['"`]/g, '')))
        }
    }

    const categoryMatch = code.match(/category:\s*['"`]([^'"`]+)['"`]/i)
    if (categoryMatch) info.category = categoryMatch[1]

    return info
}

function validateSyntax(code) {
    try {
        new vm.Script(code)
        return { valid: true }
    } catch (e) {
        return { valid: false, error: e.message }
    }
}

function findPluginFile(pluginsDir, name) {
    const folders = fs.readdirSync(pluginsDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name)

    for (const folder of folders) {
        const folderPath = path.join(pluginsDir, folder)
        const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'))

        for (const file of files) {
            const baseName = file.replace('.js', '')
            if (baseName.toLowerCase() === name.toLowerCase()) {
                return { folder, file, path: path.join(folderPath, file) }
            }
        }
    }

    return null
}

function listBackups(pluginName) {
    const backupDir = path.join(process.cwd(), 'backup', 'plugins')
    if (!fs.existsSync(backupDir)) return []

    return fs.readdirSync(backupDir)
        .filter(f => f.startsWith(pluginName + '_') && f.endsWith('.js'))
        .sort()
        .reverse()
}

function restoreBackup(pluginsDir, pluginName, backupFile) {
    const backupPath = path.join(process.cwd(), 'backup', 'plugins', backupFile)
    if (!fs.existsSync(backupPath)) throw new Error(`Backup tidak ditemukan: ${backupFile}`)

    const existing = findPluginFile(pluginsDir, pluginName)
    if (!existing) throw new Error(`Plugin \`${pluginName}\` tidak ditemukan di plugins folder`)

    fs.copyFileSync(backupPath, existing.path)
    return existing.path
}

function buildCommandMap(pluginsDir) {
    const map = {}

    const folders = fs.readdirSync(pluginsDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name)

    for (const folder of folders) {
        const folderPath = path.join(pluginsDir, folder)
        const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'))

        for (const file of files) {
            try {
                const code = fs.readFileSync(path.join(folderPath, file), 'utf-8')
                const info = extractPluginInfo(code)
                for (const cmd of info.commands) {
                    map[cmd.toLowerCase()] = { file, folder }
                }
            } catch {}
        }
    }

    return map
}

function checkConflicts(newCommands, commandMap, skipFile = null) {
    const conflicts = []

    for (const cmd of newCommands) {
        const existing = commandMap[cmd.toLowerCase()]
        if (existing && existing.file !== skipFile) {
            conflicts.push({ cmd, file: existing.file, folder: existing.folder })
        }
    }

    return conflicts
}

async function executeReplace(m, { code, fileName, folderName, extracted }) {
    const pluginsDir = path.join(process.cwd(), 'plugins')

    try {
        // ── Conflict check — selalu jalan, termasuk dari jalur yes/no ────────
        const commandMap = buildCommandMap(pluginsDir)
        const skipFile   = `${fileName}.js`
        const conflicts  = checkConflicts(extracted.commands, commandMap, skipFile)

        if (conflicts.length > 0) {
            const lines = conflicts.map(c =>
                `> ⚡ \`${c.cmd}\` → sudah dipakai oleh \`${c.file}\` (${c.folder})`
            ).join('\n')
            m.react('❌')
            return m.reply(
                `💔 *Aduh~ Ada command yang bentrok nih!*\n\n` +
                `${lines}\n\n` +
                `> Ganti nama command/alias dulu sebelum upload ya~ ✨\n` +
                `> いつき〜なかの✨ gak mau sampe ada plugin yang ketubruk! 🌸`
            )
        }

        const existing = findPluginFile(pluginsDir, fileName)

        let filePath, targetFolder, isNewFile = false
        let backupPath = null, oldSize = 0, oldInfo = null

        if (existing) {
            filePath     = existing.path
            targetFolder = existing.folder
            oldSize      = fs.statSync(filePath).size

            const oldCode = fs.readFileSync(filePath, 'utf-8')
            oldInfo = extractPluginInfo(oldCode)

            const backupDir = path.join(process.cwd(), 'backup', 'plugins')
            if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true })

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
            backupPath = path.join(backupDir, `${fileName}_${timestamp}.js`)
            fs.copyFileSync(filePath, backupPath)

        } else {
            if (!folderName) folderName = 'other'
            folderName   = folderName.toLowerCase().replace(/[^a-z0-9-]/g, '')
            targetFolder = folderName

            const folderPath = path.join(pluginsDir, targetFolder)
            if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true })

            filePath  = path.join(folderPath, `${fileName}.js`)
            isNewFile = true
        }

        let previewText = `🌸✨ *Preview ${isNewFile ? 'Plugin Baru' : 'Perubahan'}* ✨🌸\n\n`

        previewText +=
            `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
            `┃ 📝 File: \`${fileName}.js\`\n` +
            `┃ 📁 Folder: \`${targetFolder}\`\n`

        if (!isNewFile && oldInfo) {
            const oldCmds     = oldInfo.commands.join(', ') || '-'
            const newCmds     = extracted.commands.join(', ') || '-'
            const cmdsChanged = oldCmds !== newCmds

            previewText +=
                `┃ 📦 Size: \`${oldSize} → ${code.length} bytes\`\n` +
                `┃ ⚡ Commands lama: \`${oldCmds}\`\n` +
                `┃ ✨ Commands baru: \`${newCmds}\`${cmdsChanged ? ' ⚠️' : ''}\n`
        } else {
            previewText +=
                `┃ 📊 Size: \`${code.length} bytes\`\n` +
                `┃ ✨ Commands: \`${extracted.commands.join(', ') || '-'}\`\n`
        }

        previewText += `┃ ✅ Syntax: Valid\n`

        fs.writeFileSync(filePath, code)
        const reloadResult = hotReloadPlugin(filePath)

        m.react('✅')

        previewText += `┃ 🔄 Hot reload: ${reloadResult.success ? '✅ Sukses' : '⚠️ Pending'}\n`

        if (backupPath) {
            const relBackup = path.relative(process.cwd(), backupPath)
            previewText += `┃ 💾 Backup: \`${relBackup}\`\n`
        }

        previewText +=
            `╰┈┈⬡\n\n` +
            `> Yeay~ Plugin-nya udah ${isNewFile ? 'ditambah' : 'diganti'} sama いつき〜なかの✨! 💖✨\n` +
            `> Langsung aktif dan siap dipake~`

        return m.reply(previewText)

    } catch (error) {
        m.react('❌')
        return m.reply(AI.err(error.message))
    }
}

async function handler(m, { sock }) {
    const args       = m.args
    const pluginsDir = path.join(process.cwd(), 'plugins')

    // ── .ganticode listbackup ─────────────────────────────────────────────────
    if (args[0] === 'listbackup') {
        const pluginName = args[1]
        if (!pluginName) {
            return m.reply(AI.err('Sebutin nama plugin-nya ya~\n> Contoh: `.ganticode listbackup tiktok`'))
        }

        const backups = listBackups(pluginName)
        if (backups.length === 0) {
            return m.reply(AI.warn(`Tidak ada backup untuk plugin \`${pluginName}\` nih~`))
        }

        let txt = `🌸 *Backup tersedia untuk \`${pluginName}\`:*\n\n`
        backups.forEach((b, i) => {
            const stat = fs.statSync(path.join(process.cwd(), 'backup', 'plugins', b))
            txt += `┃ ${i + 1}. \`${b}\` — ${stat.size} bytes\n`
        })
        txt += `\n> Gunakan: \`.ganticode restore ${pluginName} <nomor>\``
        return m.reply(txt)
    }

    // ── .ganticode restore ────────────────────────────────────────────────────
    if (args[0] === 'restore') {
        const pluginName = args[1]
        if (!pluginName) {
            return m.reply(AI.err('Sebutin nama plugin-nya ya~\n> Contoh: `.ganticode restore tiktok`'))
        }

        const backups = listBackups(pluginName)
        if (backups.length === 0) {
            return m.reply(AI.warn(`Tidak ada backup untuk \`${pluginName}\` nih~`))
        }

        const idx = args[2] ? parseInt(args[2]) - 1 : 0
        if (isNaN(idx) || idx < 0 || idx >= backups.length) {
            return m.reply(AI.err(`Nomor backup tidak valid. Ada ${backups.length} backup tersedia.`))
        }

        m.react('🕕')

        try {
            const backupFile   = backups[idx]
            const filePath     = restoreBackup(pluginsDir, pluginName, backupFile)
            const reloadResult = hotReloadPlugin(filePath)

            m.react('✅')
            return m.reply(
                `✨ *Yeay~ Restore berhasil!* ✨\n\n` +
                `╭┈┈⬡「 💾 *ʀᴇsᴛᴏʀᴇ ɪɴꜰᴏ* 」\n` +
                `┃ 📝 Plugin: \`${pluginName}.js\`\n` +
                `┃ 📦 Dari backup: \`${backupFile}\`\n` +
                `┃ 🔄 Hot reload: ${reloadResult.success ? '✅ Sukses' : '⚠️ Pending'}\n` +
                `╰┈┈⬡\n\n` +
                `> いつき〜なかの✨ udah kembaliin plugin-nya ke versi lama~ 💖`
            )
        } catch (e) {
            m.react('❌')
            return m.reply(AI.err(e.message))
        }
    }

    // ── .ganticode (replace/add plugin) ──────────────────────────────────────
    const quoted = m.quoted
    if (!quoted) {
        return m.reply(
            `🌸✨ *ʜᴀɪ~ ɪɴɪ ɢᴀɴᴛɪᴄᴏᴅᴇ!* ✨🌸\n\n` +
            `> Reply code plugin baru dengan caption:\n\n` +
            `┃ \`${m.prefix}ganticode\` — Auto detect nama\n` +
            `┃ \`${m.prefix}ganticode namafile\` — Custom nama\n` +
            `┃ \`${m.prefix}ganticode namafile folder\` — Custom nama + folder\n\n` +
            `┃ \`${m.prefix}ganticode listbackup <nama>\` — Lihat backup\n` +
            `┃ \`${m.prefix}ganticode restore <nama> [no]\` — Restore backup\n\n` +
            `⚠️ *ᴘᴇʀɪɴɢᴀᴛᴀɴ:*\n` +
            `> Code lama akan di-backup otomatis sebelum diganti ya~ 💖`
        )
    }

    // ── Download code ─────────────────────────────────────────────────────────
    let code = ''

    if (quoted.isDocument) {
        const docFileName =
            quoted.message?.documentMessage?.fileName ||
            quoted.message?.documentWithCaptionMessage?.message?.documentMessage?.fileName ||
            ''

        if (docFileName && !docFileName.toLowerCase().endsWith('.js')) {
            return m.reply(
                `💔 *File-nya bukan .js nih~*\n\n` +
                `> File terdeteksi: \`${docFileName}\`\n` +
                `> いつき〜なかの✨ cuma bisa terima file \`.js\` ya~ 🌸`
            )
        }

        try {
            const buf = await quoted.download()
            if (!buf || buf.length === 0) throw new Error('Buffer kosong')
            code = buf.toString('utf-8')
        } catch (e) {
            return m.reply(AI.err(`Gagal download file-nya nih~\n> ${e.message}`))
        }
    } else if (quoted.isImage || quoted.isVideo || quoted.isAudio || quoted.isSticker) {
        return m.reply(AI.err('Yang di-reply harus file `.js` ya, bukan media~ 🌸'))
    } else {
        code = quoted.text || quoted.body || ''
    }

    if (!code || code.trim().length < 50) {
        return m.reply(AI.err('Code terlalu pendek atau kosong deh~'))
    }

    if (code.includes('\x00') || /[\x00-\x08\x0E-\x1F\x7F]/.test(code)) {
        return m.reply(AI.err('File sepertinya binary atau corrupt, bukan teks JS~ 🌸'))
    }

    const missingParts = []
    if (!code.includes('pluginConfig'))   missingParts.push('`pluginConfig`')
    if (!code.includes('module.exports')) missingParts.push('`module.exports`')
    if (!code.includes('handler'))        missingParts.push('`handler`')

    if (missingParts.length > 0) {
        return m.reply(
            `💔 *Aduh~ Struktur plugin-nya kurang lengkap nih!*\n\n` +
            `> Tidak ditemukan: ${missingParts.join(', ')}\n\n` +
            `> Pastiin plugin-nya punya \`pluginConfig\`, \`handler\`, dan \`module.exports\` ya~ 💖`
        )
    }

    const configMissing = []
    if (!code.match(/name\s*:/))        configMissing.push('`name`')
    if (!code.match(/category\s*:/))    configMissing.push('`category`')
    if (!code.match(/description\s*:/)) configMissing.push('`description`')

    if (configMissing.length > 0) {
        return m.reply(
            `💔 *pluginConfig-nya kurang lengkap nih~*\n\n` +
            `> Field yang hilang: ${configMissing.join(', ')}\n\n` +
            `> Tambahin dulu ya~ いつき〜なかの✨ sayang kamu! 💖`
        )
    }

    // ── Syntax check ──────────────────────────────────────────────────────────
    const syntaxCheck = validateSyntax(code)
    if (!syntaxCheck.valid) {
        return m.reply(
            `💔 *Ada syntax error nih~*\n\n` +
            `> ${syntaxCheck.error}\n\n` +
            `> Fix dulu terus kirim lagi ya~ いつき〜なかの✨ tunggu! ✨`
        )
    }

    // ── Extract info ──────────────────────────────────────────────────────────
    const extracted = extractPluginInfo(code)
    let fileName    = args[0] || extracted.name
    let folderName  = args[1] || extracted.category

    if (!fileName) {
        return m.reply(AI.err(
            'Tidak bisa detect nama plugin-nya nih~\n' +
            `> Gunakan \`${m.prefix}ganticode <namafile>\``
        ))
    }

    fileName = fileName.toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (!fileName) return m.reply(AI.err('Nama file tidak valid~'))

    // ── SCAN: Pattern berbahaya → minta konfirmasi ────────────────────────────
    const dangerPatterns = [
        { pattern: /\beval\s*\(/,                      label: 'eval()' },
        { pattern: /\bchild_process\b/,                label: 'child_process' },
        { pattern: /\bexec\s*\(/,                      label: 'exec()' },
        { pattern: /\bspawnSync\s*\(/,                 label: 'spawnSync()' },
        { pattern: /\bprocess\.exit\s*\(/,             label: 'process.exit()' },
        { pattern: /fs\s*\.\s*(unlink|rmdir|rm)\s*\(/, label: 'fs.unlink/rmdir/rm()' },
        { pattern: /require\s*\(\s*['"`]child_process/, label: "require('child_process')" },
        { pattern: /rm\s+-rf/,                         label: 'rm -rf' },
    ]

    const dangers = dangerPatterns.filter(d => d.pattern.test(code)).map(d => d.label)

    if (dangers.length > 0) {
        pendingConfirm.set(m.sender, { code, fileName, folderName, extracted })
        setTimeout(() => pendingConfirm.delete(m.sender), 60_000)

        return m.reply(
            `⚠️ *Wah~ いつき〜なかの✨ nemu kode yang berbahaya nih!*\n\n` +
            `> Terdeteksi: ${dangers.map(d => `\`${d}\``).join(', ')}\n\n` +
            `╭┈┈⬡「 ❓ *ᴋᴏɴꜰɪʀᴍᴀsɪ* 」\n` +
            `┃ Tetap mau lanjut pasang plugin ini?\n` +
            `┃ Balas \`yes\` untuk lanjut\n` +
            `┃ Balas \`no\` untuk batal\n` +
            `╰┈┈⬡\n\n` +
            `> ⏱️ Konfirmasi expired dalam *60 detik* ya~`
        )
    }

    m.react('🕕')
    return executeReplace(m, { code, fileName, folderName, extracted })
}

// ── Confirm answer handler (dipanggil dari src/handler.js) ───────────────────
async function confirmAnswerHandler(m, sock) {
    if (!m.body) return false
    if (m.isCommand) return false

    const userId = m.sender
    if (!pendingConfirm.has(userId)) return false

    const text = (m.body || '').trim().toLowerCase()

    if (text === 'yes' || text === 'y') {
        const pending = pendingConfirm.get(userId)
        pendingConfirm.delete(userId)
        m.react('🕕')
        await executeReplace(m, pending)
        return true
    }

    if (text === 'no' || text === 'n') {
        pendingConfirm.delete(userId)
        m.react('❌')
        await m.reply(
            `❌ *ᴅɪʙᴀᴛᴀʟᴋᴀɴ*\n\n` +
            `> Oke~ Plugin tidak jadi diganti!\n` +
            `> いつき〜なかの✨ sayang kamu~ 💖`
        )
        return true
    }

    await m.reply(
        `⏳ *Masih nunggu konfirmasi nih~*\n\n` +
        `> Balas \`yes\` untuk lanjut atau \`no\` untuk batal\n` +
        `> ⏱️ Expired dalam 60 detik~`
    )
    return true
}

module.exports = {
    config: pluginConfig,
    handler,
    confirmAnswerHandler
}