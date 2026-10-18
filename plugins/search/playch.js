const axios = require('axios')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const { promisify } = require('util')
const config = require('../../config')

const execAsync = promisify(exec)

const pluginConfig = {
    name: 'playch',
    alias: ['pch'],
    category: 'search',
    description: 'Putar musik dari YouTube (Itsuki Nakano Stage)',
    usage: '.playch <query>',
    example: '.playch chan yoasobi',
    cooldown: 20,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const query = m.text?.trim()

    if (!query) {
        return m.reply(`
╭━━━〔 🌸 ITSUKI NAKANO CHAN 🌸 〕━━━⬣
┃ 🎤 Masukkan judul lagu ya~
┃
┃ ✨ Contoh:
┃ \`${m.prefix}playch chan yoasobi\`
╰━━━━━━━━━━━━━━━━━━⬣
        `.trim())
    }

    m.react('🎧')

    let tempMp3, output

    try {
        const api = `https://api.nexray.web.id/downloader/ytplay?q=${encodeURIComponent(query)}`
        const { data } = await axios.get(api)

        if (!data.status || !data.result) {
            throw "Lagu tidak ditemukan"
        }

        const res = data.result

        const dl = await axios.get(res.download_url, { responseType: 'arraybuffer' })

        const tempDir = path.join(process.cwd(), 'temp')
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)

        tempMp3 = path.join(tempDir, `play_${Date.now()}.mp3`)
        output = path.join(tempDir, `out_${Date.now()}.ogg`)

        fs.writeFileSync(tempMp3, Buffer.from(dl.data))

        await execAsync(`ffmpeg -y -i "${tempMp3}" -c:a libopus -b:a 64k "${output}"`)

        const ogg = fs.readFileSync(output)

        // 🌟 CAPTION ITSUKI AI STYLE
        const caption = `
╭━━━〔 🌟 ITSUKI NAKANO LIVE 🌟 〕━━━⬣
┃ 🎤 Now Performing…
┃
┃ 🎶 Title : ${res.title}
┃ 📺 Channel : ${res.channel}
┃ 👁 Views : ${res.views}
┃ ⏱ Duration : ${res.duration}
┃
┃ 💫 「最高のアイドルステージへ！」
┃ 🌸 Feel the chan energy ~
╰━━━〔 💖 B-KOMACHI 💖 〕━━━⬣
        `.trim()

        await sock.sendMessage(config?.saluran?.id, {
            audio: ogg,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterName: config?.saluran?.name || "🌟 Itsuki Nakano Stage",
                    newsletterId: config?.saluran?.id
                },
            }
        })

        // 🌸 Feedback ke user
        await m.reply(`
╭━━━〔 ✨ STAGE SUCCESS ✨ 〕━━━⬣
┃ 🎶 Lagu berhasil dikirim!
┃
┃ 💿 ${res.title}
┃ 📡 Ke saluran:
┃ ${config?.saluran?.id}
┃
┃ 💖 Enjoy ya, chan vibes!
╰━━━━━━━━━━━━━━━━━━⬣
        `.trim())

        m.react('✨')

        // cleanup
        setTimeout(() => {
            try { fs.unlinkSync(tempMp3) } catch {}
            try { fs.unlinkSync(output) } catch {}
        }, 30000)

    } catch (e) {
        console.error('[PlayCH Itsuki]', e)

        m.react('❌')

        m.reply(`
╭━━━〔 ❌ ERROR STAGE 〕━━━⬣
┃ 💔 Aduh... lagunya gak ketemu...
┃
┃ 🔍 Coba pakai kata lain ya!
╰━━━━━━━━━━━━━━━━━━⬣
        `.trim())
    }
}

module.exports = {
    config: pluginConfig,
    handler
}