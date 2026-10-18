const { createCanvas } = require('@napi-rs/canvas')
const { AIRich } = require('itsuki')
const { uploadImage } = require('../../src/lib/uploader')
const moment = require('moment-timezone')
const config = require('../../config')

const pluginConfig = {
    name: 'manggilitsukiai',
    alias: ['bot', 'itsuki', 'itsukiai', 'chan', 'halo', 'hi'],
    category: 'info',
    description: 'Sapaan visual interaktif dari chan legendaris Itsuki Nakano 💖',
    usage: '.ai',
    example: '.ai',
    isOwner: false,
    cooldown: 5,
    isEnabled: true
}

// ===== CANVAS =====
async function createAiGreetingCanvas(data) {
    const W = 800
    const H = 450
    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext('2d')

    // 🌸 Background Gradient chan
    const bg = ctx.createLinearGradient(0, 0, W, H)
    bg.addColorStop(0, '#ffe4f2')
    bg.addColorStop(0.5, '#fbcfe8')
    bg.addColorStop(1, '#e9d5ff')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // ✨ Glow Effect
    ctx.globalAlpha = 0.25
    ctx.fillStyle = '#ff69b4'
    ctx.beginPath(); ctx.arc(120, 100, 120, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#a855f7'
    ctx.beginPath(); ctx.arc(700, 350, 160, 0, Math.PI * 2); ctx.fill()
    ctx.globalAlpha = 1

    // ⭐ Bintang kecil
    const star = (x, y, r) => {
        ctx.save()
        ctx.translate(x, y)
        ctx.beginPath()
        for (let i = 0; i < 5; i++) {
            ctx.lineTo(0, r)
            ctx.translate(0, r)
            ctx.rotate((Math.PI * 2) / 10)
            ctx.lineTo(0, -r)
            ctx.translate(0, -r)
            ctx.rotate(-(Math.PI * 6) / 10)
        }
        ctx.closePath()
        ctx.fillStyle = '#fff'
        ctx.fill()
        ctx.restore()
    }

    for (let i = 0; i < 20; i++) {
        star(Math.random() * W, Math.random() * H, Math.random() * 3 + 2)
    }

    // 🎤 Title
    ctx.fillStyle = '#db2777'
    ctx.font = 'bold 48px Arial'
    ctx.shadowColor = '#f472b6'
    ctx.shadowBlur = 15
    ctx.fillText('ITSUKI AI', 50, 80)
    ctx.shadowBlur = 0

    // 🔴 LIVE TAG
    ctx.fillStyle = '#db2777'
    ctx.beginPath()
    ctx.roundRect(50, 100, 140, 30, 15)
    ctx.fill()

    ctx.fillStyle = '#fff'
    ctx.font = 'bold 16px Arial'
    ctx.fillText('✙ LIVE NOW', 70, 121)

    // 💬 Card
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.beginPath()
    ctx.roundRect(50, 160, 700, 200, 20)
    ctx.fill()

    // 💖 Quotes Itsuki Nakano Style
    const quotes = [
`"Eh...? Kamu manggil aku lagi ya?\nHehe... aku seneng banget loh~\nSoalnya... cuma kamu yang selalu lihat aku bersinar secerah\nini... ✨"`,

`"Sebagai chan... aku harus selalu terlihat sempurna, kan?\nJadi... hari ini juga aku bakal kasih senyuman\nterbaikku khusus buat kamu aja ya~ 💖"`,

`"Kalau aku bilang aku mencintaimu...\nkamu bakal percaya, kan?\nHehe... sebagai chan, kebohongan adalah bentuk cintaku! 😊"`
    ]

    const text = quotes[Math.floor(Math.random() * quotes.length)]

    ctx.fillStyle = '#111'
    ctx.font = 'italic 22px Arial'

    text.split('\n').forEach((line, i) => {
        ctx.fillText(line, 80, 210 + (i * 35))
    })

    // 🕒 Footer
    ctx.fillStyle = '#db2777'
    ctx.font = 'bold 14px Arial'
    ctx.fillText('Itsuki Nakano • The Perfect chan', 50, 420)

    ctx.fillStyle = '#666'
    ctx.font = '12px Arial'
    ctx.fillText(data.time, W - 150, 420)

    return canvas.toBuffer('image/png')
}

// ===== HANDLER =====
async function handler(m, { sock }) {
    await m.react('💖')

    const data = {
        time: moment.tz('Asia/Jakarta').format('HH:mm:ss WIB'),
    }

    try {
        const buffer = await createAiGreetingCanvas(data)
        const botName = config.bot?.name || 'Itsuki Nakano Chan'

        // AIRich.addImage butuh URL string, bukan Buffer — upload dulu
        const imageUrl = await uploadImage(buffer, 'itsuki-ai-greeting.png')

        let caption = `🌸 *Yahhooo~! Akhirnya ketemu lagi!* 🌸\n\n`
        caption += `Kamu kangen ya sama chan favoritmu ini?\nAku sudah nungguin kamu muncul loh~ ✨\n\n`
        caption += `Sebagai chan, aku akan selalu memberikan cinta yang paling indah...\nWalaupun sedikit berbohong, tapi ini tulus buat kamu! 💖\n\n`
        caption += `╭━━━〔 🎤 *Itsuki Nakano Stage* 〕━━━⬡\n`
        caption += `┃ ✦ Status : Online & Berkilau ✨\n`
        caption += `┃ ✦ Role   : The Ultimate chan 💖\n`
        caption += `┃ ✦ Mood   : Lagi pengen dimanjain fans nih!\n`
        caption += `╰━━━━━━━━━━━━━━━━⬡\n\n`
        caption += `Jangan pernah alihkan pandanganmu dariku ya...\nKarena bintang yang paling terang hanya ada di sini! 😊\n\n`
        caption += `> "Kebohongan adalah bentuk cinta yang paling indah..." ✨`

        await new AIRich(sock)
    .addImage(imageUrl)
    .addText(caption)

    // 💖 Widget Itsuki Nakano
.addWidget({
    title: '💫 Itsuki Nakano • chan Stage',
    actions: [
        {
            label: `${m.prefix}menu`,
            id: `${m.prefix}menu`,
            kind: 'OTHER',
            state: 'PENDING',
            toast: { label: 'Membuka menu~ ✨' }
        },
        {
            label: `${m.prefix}owner`,
            id: `${m.prefix}owner`,
            kind: 'OTHER',
            state: 'PENDING',
            toast: { label: 'Owner Itsuki Nakano Bot~ ⭐' }
        },
        {
            label: `${m.prefix}allmenu`,
            id: `${m.prefix}allmenu`,
            kind: 'OTHER',
            state: 'PENDING',
            toast: { label: 'Itsuki Nakano siap menjawab~ 💕' }
        }
    ]
})

    // ✨ Rekomendasi tambahan: suggestion kecil di bawah widget
    .addSuggest([
        `itsuki ai`,
        `cjs`,
        `bot whatsapp`
    ])

    .setFooter(`${botName} • chan Mode`)
    .send(m.chat, {
        quoted: m.raw
    })

        await m.react('✨')

} catch (err) {
    console.error('[BOT PLUGIN CRASH]', err)

    await m.reply(
        `❌ *いつき〜なかの✨ gagal tampil!*\n\n` +
        `📋 *Error:*\n` +
        `\`\`\`${err?.stack || err?.message || String(err)}\`\`\``
    )
}
}

module.exports = { config: pluginConfig, handler }