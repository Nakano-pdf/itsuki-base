/**
‎✧ Name    : quoteswindows
‎✧ Category: maker
‎✧ Note    : Quotes windows notification style, canvas-based
‎✧ Credit  : Rin imup lucu🤤 (original logic)
**/

const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas')
const { writeFile, mkdir, unlink } = require('node:fs/promises')
const { existsSync } = require('node:fs')
const { join } = require('node:path')
const axios = require('axios')

const pluginConfig = {
    name: 'quoteswindows',
    alias: ['wdws', 'wq', 'winquotes', 'wquotes', 'quoteswin', 'notifquotes', 'winnotif'],
    category: 'maker',
    description: 'Bikin quotes ala windows notification style',
    usage: '.quoteswindows <text>',
    example: '.quoteswindows My wife tuh cuman Itsuki Nakano',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.text?.trim()

    if (!text) {
        return m.reply(
            `📦 *ǫᴜᴏᴛᴇsᴡɪɴᴅᴏᴡs ᴘʟᴜɢɪɴ* 🎤\n\n` +
            `> いつき〜なかの✨ butuh teksnya dong~ ✨\n\n` +
            `> ${m.prefix}quoteswindows <text>\n\n` +
            `*ᴄᴏɴᴛᴏʜ:*\n` +
            `> ${m.prefix}quoteswindows My wife tuh cuman Itsuki Nakano`
        )
    }

    await m.react('🕕')

    try {
        const TMP_DIR = join(process.cwd(), 'tmp')

        await mkdir(TMP_DIR, { recursive: true })

        const fPath = await require('../../src/lib/assetManager').getAssetPath('fonts.wdwsMeme.interBold', 'ttf')
        if (fPath) GlobalFonts.registerFromPath(fPath, 'InterBoldMeme')

        const bgBuf = await require('../../src/lib/assetManager').getAssetBuffer('templates.wdwsMemeTemplate')
        if (!bgBuf) throw new Error('Template wdws belum diisi di config.assets.templates.wdwsMemeTemplate')

        const bgImg = await loadImage(bgBuf)
        const canvas = createCanvas(bgImg.width, bgImg.height)
        const ctx = canvas.getContext('2d')
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height)

        const x = 127, y = 406, w = 450, h = 601
        let fSize = 150
        const lHeight = 1.3
        const rawText = text

        ctx.fillStyle = '#1c1d21'
        ctx.textBaseline = 'top'

        function getWrappedLines(context, textStr, maxWidth) {
            const words = textStr.split(/\s+/)
            const resLines = []
            let currentLine = ''

            for (let i = 0; i < words.length; i++) {
                if (!words[i]) continue
                let testLine = currentLine + words[i] + ' '
                let metrics = context.measureText(testLine.trim())

                if (metrics.width > maxWidth && i > 0) {
                    resLines.push(currentLine.trim())
                    currentLine = words[i] + ' '
                } else {
                    currentLine = testLine
                }
            }
            if (currentLine.trim()) resLines.push(currentLine.trim())
            return resLines
        }

        ctx.font = `700 ${fSize}px InterBoldMeme`
        let lines = getWrappedLines(ctx, rawText, w)

        let totalTextHeight = lines.length * (fSize * lHeight)
        while (totalTextHeight > h && fSize > 24) {
            fSize -= 4
            ctx.font = `700 ${fSize}px InterBoldMeme`
            lines = getWrappedLines(ctx, rawText, w)
            totalTextHeight = lines.length * (fSize * lHeight)
        }

        let startY = y
        if (totalTextHeight < h) {
            startY = y + (h - totalTextHeight) / 2
        }

        const wordCount = rawText.split(/\s+/).filter(w => w.length > 0).length

        lines.forEach((line, index) => {
            const currentY = startY + (index * (fSize * lHeight))
            if (currentY + fSize <= y + h) {
                if (wordCount === 1) {
                    ctx.textAlign = 'center'
                    ctx.fillText(line, x + (w / 2), currentY)
                } else {
                    ctx.textAlign = 'left'
                    ctx.fillText(line, x, currentY)
                }
            }
        })

        const outPath = join(TMP_DIR, `wdws-${Date.now()}.png`)
        await writeFile(outPath, await canvas.encode('png'))

        await sock.sendFile(m.chat, outPath, 'quoteswindows.png', `💬 *ǫᴜᴏᴛᴇs ᴡɪɴᴅᴏᴡs ᴅᴏɴᴇ~* 🎤✨\n\n"${rawText}"`, m)
        await m.react('✅')

        if (existsSync(outPath)) await unlink(outPath)

    } catch (error) {
        console.error('[quoteswindows] Error:', error)
        await m.react('❌')
        return m.reply(`❌ *ᴀᴅᴜʜ, ɢᴀɢᴀʟ*\n\n> ${error.message}\n\n> Coba lagi ya~`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}