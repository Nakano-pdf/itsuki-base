// ============================================================
// PLUGIN: templateplugin
// Fungsi: generate boilerplate/template buat bikin plugin baru
// Owner only, cukup ketik .templateplugin buat dapetin template-nya
// ============================================================

const config = require('../../config')

const pluginConfig = {
    name: 'templateplugin',
    alias: ['tplplugin', 'plugin-template', 'tpp'],
    category: 'owner',
    description: 'Generate plugin template (Owner Only)',
    usage: '.templateplugin',
    example: '.templateplugin',
    isOwner: true,       // cuma owner yang boleh pake command ini
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,         // gak perlu cooldown, ini command internal/dev tools
    energi: 0,           // gak makan energi karena bukan fitur buat user biasa
    isEnabled: true
}

async function handler(m, { sock }) {
    // Gate paling awal: kalau bukan owner, tolak duluan sebelum proses apa pun
    if (!config.isOwner(m.sender)) {
        return m.reply(
            `🎤 *ʙᴀᴄᴋsᴛᴀɢᴇ ᴏɴʟʏ~*\n\n` +
            `> Maaf yaa, ruang ganti ini khusus staff いつき〜なかの✨ doang~ 🎀\n` +
            `> Bukan buat penonton~ ✨`
        )
    }

    // Template di bawah ini adalah STRING MENTAH (bukan kode yang dijalankan).
    // Isinya bakal dikirim ke owner sebagai contoh kerangka plugin baru,
    // dibungkus tanda kutip tiga (```) biar WA nampilinnya sebagai code block.
    //
    // PENTING soal escaping:
    // - \` (backslash + backtick) dipake supaya backtick di dalam string
    //   template ini nggak dianggap "menutup" template literal terluar.
    // - \${...} (backslash + $) dipake supaya ${...} yang ada di dalam
    //   TIDAK langsung di-interpolasi sekarang (misal ${m.prefix} atau
    //   ${text}) — itu harus tetap jadi teks literal, karena baru bakal
    //   dieksekusi/di-interpolasi NANTI, di plugin baru yang dibuat dari
    //   template ini, bukan sekarang saat template-nya di-generate.
    // - \n (dobel backslash + n) dipake supaya hasil generate-nya
    //   beneran mengandung teks "\n" (2 karakter: backslash + n),
    //   bukan newline sungguhan — karena "\n" itu emang harus tetap
    //   jadi kode sumber yang valid di file plugin baru nanti.
    const template = `/**
‎✧ Name    : example
‎✧ Category: general
**/

// require dependency yang dibutuhin plugin ini.
// config wajib di-require kalau butuh akses ke isOwner(), prefix, dll
const config = require('../../config')

// pluginConfig = metadata plugin, dipakai handler.js buat registrasi command
const pluginConfig = {
    name: 'example',           // nama internal plugin (unik, dipakai buat lookup)
    alias: ['ex'],              // alias/command tambahan yang bisa trigger plugin ini
    category: 'general',        // kategori buat pengelompokan di menu/help
    description: 'Example plugin',
    usage: '.example <args>',   // format cara pakai, ditampilin di help
    example: '.example halo',   // contoh konkret pemakaian
    isOwner: false,              // true kalau command ini cuma buat owner
    isPremium: false,            // true kalau butuh status premium
    isGroup: false,              // true kalau cuma bisa dipake di grup
    isPrivate: false,            // true kalau cuma bisa dipake di chat pribadi
    cooldown: 3,                 // jeda (detik) sebelum user bisa pakai command ini lagi
    energi: 1,                   // biaya "energi"/kuota per pemakaian (kalau bot pakai sistem energi)
    isEnabled: true              // toggle on/off plugin tanpa perlu hapus file
}

// handler = fungsi utama yang dijalanin tiap kali command ke-trigger.
// m     = objek pesan (berisi m.text, m.sender, m.chat, m.reply(), m.react(), dll)
// sock  = instance socket Baileys (buat kirim pesan/media custom kalau perlu)
async function handler(m, { sock }) {
    // Ambil teks argumen setelah command, contoh: ".example halo" -> text = "halo"
    const text = m.text?.trim()

    // Kalau user gak kasih argumen, tampilin cara pakai + contoh, lalu stop di sini
    if (!text) {
        return m.reply(
            \`📦 *ᴇxᴀᴍᴘʟᴇ ᴘʟᴜɢɪɴ* 🎤\n\n\` +
            \`> いつき〜なかの✨ butuh input dulu dong~ ✨\n\n\` +
            \`> \${m.prefix}example <args>\n\n\` +
            \`*ᴄᴏɴᴛᴏʜ:*\n\` +
            \`> \${m.prefix}example halo\`
        )
    }

    // Kasih reaksi "processing" dulu biar user tau command lagi diproses
    await m.react('🕕')

    try {
        // ============================
        // TARUH LOGIC UTAMA DI SINI
        // (misal: panggil API, proses data, generate gambar, dll)
        // ============================

        // Kalau sukses: ganti reaksi jadi centang + kirim hasil
        await m.react('✅')
        return m.reply(\`✅ *ʙᴇʀʜᴀsɪʟ~* 🎤✨\n\n> Nih, いつき〜なかの✨ udah proses: \${text}\`)
    } catch (error) {
        // Selalu log error ke console buat debugging,
        // tapi jangan bocorin stack trace mentah ke user
        console.error('[example] Error:', error)
        await m.react('❌')
        return m.reply(\`❌ *ᴀᴅᴜʜ, ɢᴀɢᴀʟ*\n\n> \${error.message}\n\n> Coba lagi ya, いつき〜なかの✨ janji next take bakal lebih bagus~\`)
    }
}

// Wajib export { config, handler } biar plugin loader (handler.js) bisa
// baca metadata dan manggil fungsi handler-nya
module.exports = {
    config: pluginConfig,
    handler
}
`

    // Kirim template yang udah dibungkus code block (```) ke owner,
    // plus catatan singkat cara makenya
    return m.reply(
        `📦 *ᴘʟᴜɢɪɴ ᴛᴇᴍᴘʟᴀᴛᴇ* 🎤\n\n` +
        `> Nih template baru dari いつき〜なかの✨, dipake baik-baik yaa~ ✨\n\n` +
        `\`\`\`${template}\`\`\`\n\n` +
        `╭┈┈⬡「 🎀 ᴘᴇsᴀɴ ᴅᴀʀɪ ᴀɪ 」\n` +
        `┃ Copy-paste terus rename sesuai kebutuhan\n` +
        `┃ Jangan lupa ganti \`name\`, \`alias\`, \`category\` ya\n` +
        `┃ Ganbatte bikin plugin barunya! ⭐\n` +
        `╰┈┈┈┈┈┈┈┈⬡`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}