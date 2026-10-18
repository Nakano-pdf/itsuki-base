const config = require('../../config');
const { formatUptime, getTimeGreeting } = require('../../src/lib/formatter');
const { getCommandsByCategory, getCategories } = require('../../src/lib/plugins');
const { getDatabase } = require('../../src/lib/database');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { generateWAMessageFromContent, proto } = require('itsuki');
const { default: axios } = require('axios');
const { getAssetBuffer, getAssetPath } = require('../../src/lib/assetManager');

const pluginConfig = {
    name: 'menu',
    alias: ['help', 'bantuan', 'commands', 'm'],
    category: 'main',
    description: 'Menampilkan menu utama bot',
    usage: '.menu',
    example: '.menu',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
};

const CATEGORY_EMOJIS = {
    owner: '👑', main: '🏠', utility: '🔧', fun: '🎮', group: '👥',
    download: '📥', search: '🔍', tools: '🛠️', sticker: '🖼️',
    ai: '🤖', game: '🎯', media: '🎬', info: 'ℹ️', religi: '☪️',
    panel: '🖥️', user: '📊', linode: '☁️', random: '🎲', canvas: '🎨', vps: '🌊'
};

function toSmallCaps(text) {
    const smallCaps = {
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ꜰ', 'g': 'ɢ',
        'h': 'ʜ', 'i': 'ɪ', 'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ',
        'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ', 's': 's', 't': 'ᴛ', 'u': 'ᴜ',
        'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ'
    };
    return text.toLowerCase().split('').map(c => smallCaps[c] || c).join('');
}

function formatTime(date) {
    const timeHelper = require('../../src/lib/timeHelper');
    return timeHelper.formatTime('HH:mm');
}

function formatDateShort(date) {
    const timeHelper = require('../../src/lib/timeHelper');
    return timeHelper.formatFull('dddd, DD MMMM YYYY');
}

function buildMenuText(m, botConfig, db, uptime, botMode = 'md') {
    const prefix = botConfig.command?.prefix || '.';
    const user = db.getUser(m.sender);
    const timeHelper = require('../../src/lib/timeHelper');
    const timeStr = timeHelper.formatTime('HH:mm');
    const dateStr = timeHelper.formatFull('dddd, DD MMMM YYYY');
    
    const categories = getCategories();
    const commandsByCategory = getCommandsByCategory();
    
    let totalCommands = 0;
    for (const category of categories) {
        totalCommands += (commandsByCategory[category] || []).length;
    }
    
    const { getCaseCount, getCasesByCategory } = require('../../case/itsuki');
    const totalCases = getCaseCount();
    const casesByCategory = getCasesByCategory();
    
    const totalFeatures = totalCommands + totalCases;
    
    let userRole = 'User', roleEmoji = '👤';
    if (m.isOwner) { userRole = 'Owner'; roleEmoji = '👑'; }
    else if (m.isPremium) { userRole = 'Premium'; roleEmoji = '💎'; }
    
    const greeting = getTimeGreeting();
    const uptimeFormatted = formatUptime(uptime);
    const totalUsers = db.getUserCount();
    const greetEmoji = greeting.includes('pagi') ? '🌅' : greeting.includes('siang') ? '☀️' : greeting.includes('sore') ? '🌇' : '🌙';
    
    let txt = `Hai *@${m.pushName || "User"}* 🪸

Aku ${botConfig.bot?.name || 'Itsuki Nakano Chan'}, bot WhatsApp yang siap bantu kamu.  

Kamu bisa pakai aku buat cari info, ambil data, atau bantu hal-hal sederhana langsung lewat WhatsApp — praktis tanpa ribet.
`
   txt += `\n\n╭─〔 🤖 *ʙᴏᴛ ɪɴꜰᴏ* 〕\n`;
txt += `*│* 🖐 ɴᴀᴍᴀ     : *${botConfig.bot?.name || 'Itsuki Nakano Chan'}*\n`;
txt += `*│* 🔑 ᴠᴇʀsɪ    : *v${botConfig.bot?.version || '1.2.0'}*\n`;
txt += `*│* ⚙️ ᴍᴏᴅᴇ     : *${(botConfig.mode || 'public').toUpperCase()}*\n`;
txt += `*│* 🧶 ᴘʀᴇꜰɪx    : *[ ${prefix} ]*\n`;
txt += `*│* ⏱ ᴜᴘᴛɪᴍᴇ   : *${uptimeFormatted}*\n`;
txt += `*│* 👥 ᴛᴏᴛᴀʟ    : *${totalUsers} Users*\n`;
txt += `*│* 🏷 ɢʀᴏᴜᴘ     : *${botMode.toUpperCase()}*\n`;
txt += `*│* 👑 ᴏᴡɴᴇʀ    : *${botConfig.owner?.name || 'Itsuki Nakano Chan'}*\n`;
txt += `╰────────────────⬣\n\n`;

txt += `╭─〔 👤 *ᴜsᴇʀ ɪɴꜰᴏ* 〕\n`;
txt += `*│* 🙋 ɴᴀᴍᴀ     : *${m.pushName}*\n`;
txt += `*│* 🎭 ʀᴏʟᴇ     : *${roleEmoji} ${userRole}*\n`;
txt += `*│* 🎟 ʟɪᴍɪᴛ    : *${m.isOwner || m.isPremium ? '∞ Unlimited' : (user?.limit ?? 25)}*\n`;
txt += `*│* 🕒 ᴡᴀᴋᴛᴜ    : *${timeStr} WIB*\n`;
txt += `*│* 📅 ᴛᴀɴɢɢᴀʟ  : *${dateStr}*\n`;
txt += `╰────────────────⬣\n\n`;
    
    const categoryOrder = ['owner', 'main', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info', 'cek', 'economy', 'user', 'canvas', 'random', 'premium', 'ephoto', 'jpm', 'pushkontak', 'panel', 'store'];
    const sortedCategories = [...categories].sort((a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
    
    let modeAllowedMap = {
        md: null,
        store: ['main', 'group', 'sticker', 'owner', 'store'],
        pushkontak: ['main', 'group', 'sticker', 'owner', 'pushkontak']
    };
    let modeExcludeMap = {
        md: ['panel', 'pushkontak', 'store'],
        store: null,
        pushkontak: null
    };
    
    try {
        const botmodePlugin = require('../group/botmode');
        if (botmodePlugin && botmodePlugin.MODES) {
            const modes = botmodePlugin.MODES;
            modeAllowedMap = {};
            modeExcludeMap = {};
            for (const [key, val] of Object.entries(modes)) {
                modeAllowedMap[key] = val.allowedCategories;
                modeExcludeMap[key] = val.excludeCategories;
            }
        }
    } catch (e) {}
    
    const allowedCategories = modeAllowedMap[botMode];
    const excludeCategories = modeExcludeMap[botMode] || [];
    
    txt += `📂 *ᴅᴀꜰᴛᴀʀ ᴍᴇɴᴜ*\n`
    
    for (const category of sortedCategories) {
        if (category === 'owner' && !m.isOwner) continue;
        
        if (allowedCategories && !allowedCategories.includes(category.toLowerCase())) continue;
        if (excludeCategories && excludeCategories.includes(category.toLowerCase())) continue;
        
        const pluginCmds = commandsByCategory[category] || [];
        const caseCmds = casesByCategory[category] || [];
        const totalCmds = pluginCmds.length + caseCmds.length;
        if (totalCmds === 0) continue;
        
        const emoji = CATEGORY_EMOJIS[category] || '📁';
        const categoryName = toSmallCaps(category);
        
        txt += `- \`◦\` ${prefix}${toSmallCaps(`menuitsuki ${category}`)} ${emoji}\n`;
    }
    return txt;
}

function getContextInfo(botConfig, m, thumbBuffer, renderLargerThumbnail = false) {
    const saluranLink = config.info?.website || botConfig.saluran?.link || config.info?.grupwa || 'https://alwayslennz-dev.my.id';
    
    const ctx = {
        mentionedJid: [m.sender],
        forwardingScore: 9,
        isForwarded: true,
        linkPreview: {
            'matched-text': saluranLink,
            title: botConfig.bot?.name || 'Itsuki Nakano Chan',
            description: `BOT WHATSAPP MULTI DEVICE`,
            previewType: 0,
            jpegThumbnail: thumbBuffer || undefined,
            linkPreviewMetadata: {
                linkMediaDuration: 0,
                socialMediaPostType: 4
            }
        }
    };
    
    return ctx;
}

function getVerifiedQuoted(botConfig) {
    const saluranId = botConfig.saluran?.id || 'https://whatsapp.com/channel/0029VbDytkmBqbrF0rFKr12w';
    const saluranName = botConfig.saluran?.name || botConfig.bot?.name || 'Itsuki Nakano Chan';
    
    return {
                key: {
                    participant: `0@s.whatsapp.net`,
                    remoteJid: `status@broadcast`
                    },
                message: {
                    'contactMessage': {
                    'displayName': `🪸 ${botConfig.bot?.name}`,
                    'vcard': `BEGIN:VCARD\nVERSION:3.0\nN:XL;ttname,;;;\nFN:ttname\nitem1.TEL;waid=13135550002:+1 (313) 555-0002\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
                sendEphemeral: true
            }}}  
}

async function handler(m, { sock, config: botConfig, db, uptime }) {
    const savedVariant = db.setting('menuVariant');
    const menuVariant = savedVariant || botConfig.ui?.menuVariant || 2;
    const groupData = m.isGroup ? (db.getGroup(m.chat) || {}) : {};
    const botMode = groupData.botMode || 'md';
    const text = buildMenuText(m, botConfig, db, uptime, botMode);
    
    const imagePath = await getAssetPath('images.itsuki', 'jpg');
    const thumbPath = await getAssetPath('images.itsuki2', 'jpg');
    const videoPath = await getAssetPath('video.itsuki', 'mp4');
    
    let imageBuffer = fs.existsSync(imagePath) ? fs.readFileSync(imagePath) : null;
    let thumbBuffer = fs.existsSync(thumbPath) ? fs.readFileSync(thumbPath) : null;
    let videoBuffer = fs.existsSync(videoPath) ? fs.readFileSync(videoPath) : null;
    
    try {
        switch (menuVariant) {
            case 1:
                if (imageBuffer) {
                    await sock.sendMessage(m.chat, { image: imageBuffer, caption: text });
                } else {
                    await m.reply(text);
                }
                break;
                
            case 2:
                const msgV2 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                if (imageBuffer) {
                    msgV2.image = imageBuffer;
                    msgV2.caption = text;
                } else {
                    msgV2.text = text;
                }
                await sock.sendMessage(m.chat, msgV2, { quoted: getVerifiedQuoted(botConfig) });
                break;
                
            case 3:
                let resizedThumb = thumbBuffer;
                if (thumbBuffer) {
                    try {
                        resizedThumb = await sharp(thumbBuffer)
                            .resize(300, 300, { fit: 'cover' })
                            .jpeg({ quality: 80 })
                            .toBuffer();
                    } catch (e) {
                        resizedThumb = thumbBuffer;
                    }
                }
                
                let contextThumb = thumbBuffer;
                try {
                    const itsukiPath = await getAssetPath('images.itsuki', 'jpg');
                    if (fs.existsSync(itsukiPath)) {
                        contextThumb = fs.readFileSync(itsukiPath);
                    }
                } catch (e) {}
                
                await sock.sendMessage(m.chat, {
                    document: imageBuffer || Buffer.from(''),
                    mimetype: 'image/png',
                    fileLength: 999999999999,
                    fileSize: 999999999999,
                    fileName: `ɴᴏ ᴘᴀɪɴ ɴᴏ ɢᴀɪɴ`,
                    caption: text,
                    jpegThumbnail: resizedThumb,
                    contextInfo: getContextInfo(botConfig, m, contextThumb, true)
                }, { quoted: getVerifiedQuoted(botConfig) });
                break;
                
            // ============================================================
// FILE 3: menu.js — HANYA case 4, ganti tampilan jadi mirip Itsuki allmenu V5
// Cari "case 4:" di menu.js lu, ganti seluruh blok case 4 dengan ini
// ============================================================

            case 4:
                try {
                    const { prepareWAMessageMedia } = require('itsuki')
                    const saluranIdV4 = botConfig.saluran?.id || 'https://whatsapp.com/channel/0029VbDytkmBqbrF0rFKr12w'
                    const saluranNameV4 = botConfig.saluran?.name || botConfig.bot?.name || 'Itsuki Nakano Chan'
                    const saluranLinkV4 = botConfig.saluran?.link || 'https://whatsapp.com/channel/0029VbDytkmBqbrF0rFKr12w'
                    const greeting = getTimeGreeting()

                    // Upload video/gif sebagai header
                    let mediaV4 = null
                    if (videoBuffer) {
                        try {
                            mediaV4 = await prepareWAMessageMedia(
                                { video: videoBuffer, gifPlayback: true },
                                { upload: sock.waUploadToServer }
                            )
                        } catch (e) {
                            console.error('[Menu V4] Media upload error:', e.message)
                        }
                    }

                    // Fake location quoted (thumbnail 300x300)
                    let locThumb = null
                    if (thumbBuffer) {
                        try {
                            locThumb = await sharp(thumbBuffer).resize(300, 300).toBuffer()
                        } catch (e) { locThumb = thumbBuffer }
                    }
                    const qVideoV4 = {
                        key: { fromMe: false, participant: m.sender, remoteJid: m.chat },
                        message: {
                            locationMessage: {
                                degreesLatitude: 0,
                                degreesLongitude: 0,
                                name: greeting,
                                jpegThumbnail: locThumb
                            }
                        }
                    }

                    const msgV4 = generateWAMessageFromContent(m.chat, {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: {},
                                interactiveMessage: {
                                    header: {
                                        title: '',
                                        subtitle: '',
                                        hasMediaAttachment: !!mediaV4,
                                        ...(mediaV4?.videoMessage ? { videoMessage: mediaV4.videoMessage } : {})
                                    },
                                    body: { text },
                                    footer: { text: 'Pilih tombol di bawah untuk melihat menu' },
                                    contextInfo: {
                                        mentionedJid: [m.sender],
                                        isForwarded: true,
                                        forwardingScore: 9,
                                        forwardedNewsletterMessageInfo: {
                                            newsletterJid: saluranIdV4,
                                            newsletterName: saluranNameV4,
                                            serverMessageId: 127
                                        }
                                    },
                                    nativeFlowMessage: {
                                        messageParamsJson: JSON.stringify({
                                            limited_time_offer: {
                                                text: greeting,
                                                url: 'Hai',
                                                expiration_time: Date.now() + 10000
                                            },
                                            bottom_sheet: {
                                                in_thread_buttons_limit: 2,
                                                divider_indices: [1, 2, 3, 4, 5, 999],
                                                list_title: 'Pilih menu yang kamu mau~',
                                                button_title: '🍙 Lihat Kategori'
                                            },
                                            tap_target_configuration: {
                                                title: ' X ',
                                                description: 'bomboclard',
                                                canonical_url: 'https://itsuki-ai.my.id',
                                                domain: 'itsuki-ai.my.id',
                                                button_index: 0
                                            }
                                        }),
                                        buttons: [
                                            {
                                                name: 'cta_url',
                                                buttonParamsJson: JSON.stringify({
                                                    display_text: `✨ Ikuti Saluran ${botConfig.saluran?.name || 'Itsuki Nakano'}~`,
                                                    url: saluranLinkV4,
                                                    merchant_url: saluranLinkV4
                                                })
                                            },
                                            {
                                                name: 'quick_reply',
                                                buttonParamsJson: JSON.stringify({
                                                    display_text: '📂 Kembali Ke Daftar Kategori',
                                                    id: `${botConfig.command?.prefix || '.'}menuitsuki`
                                                })
                                            },
                                            {
                                                name: 'quick_reply',
                                                buttonParamsJson: JSON.stringify({
                                                    display_text: '🍅 Kembali Ke Menu Utama',
                                                    id: `${botConfig.command?.prefix || '.'}menu`
                                                })
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }, { quoted: qVideoV4, userJid: sock.user?.jid || sock.user?.id })

                    await sock.relayMessage(m.chat, msgV4.message, { messageId: msgV4.key.id })

                } catch (v4Error) {
                    console.error('[Menu V4] Error:', v4Error.message)
                    const fallbackV4 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) }
                    if (imageBuffer) { fallbackV4.image = imageBuffer; fallbackV4.caption = text }
                    else { fallbackV4.text = text }
                    await sock.sendMessage(m.chat, fallbackV4, { quoted: getVerifiedQuoted(botConfig) })
                }
                break;
                
            case 5:
                const prefix = botConfig.command?.prefix || '.';
                const saluranId = botConfig.saluran?.id || 'https://whatsapp.com/channel/0029VbDytkmBqbrF0rFKr12w';
                const saluranName = botConfig.saluran?.name || botConfig.bot?.name || 'Itsuki Nakano Chan';
                
                const categories = getCategories();
                const commandsByCategory = getCommandsByCategory();
                const categoryOrder = ['owner', 'main', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info', 'jpm', 'pushkontak', 'panel', 'user'];
                
                const sortedCats = [...categories].sort((a, b) => {
                    const indexA = categoryOrder.indexOf(a);
                    const indexB = categoryOrder.indexOf(b);
                    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                });
                
                const toMonoUpperBold = (text) => {
                    const chars = {
                        'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F', 'G': 'G',
                        'H': 'H', 'I': 'I', 'J': 'J', 'K': 'K', 'L': 'L', 'M': 'M', 'N': 'N',
                        'O': 'O', 'P': 'P', 'Q': 'Q', 'R': 'R', 'S': 'S', 'T': 'T', 'U': 'U',
                        'V': 'V', 'W': 'W', 'X': 'X', 'Y': 'Y', 'Z': 'Z'
                    };
                    return text.toUpperCase().split('').map(c => chars[c] || c).join('');
                };
                
                const categoryRows = [];
                
                const modeAllowedMap = {
                    md: null,
                    cpanel: ['main', 'group', 'sticker', 'owner', 'tools', 'panel'],
                    store: ['main', 'group', 'sticker', 'owner', 'store'],
                    pushkontak: ['main', 'group', 'sticker', 'owner', 'pushkontak']
                };
                const modeExcludeMap = {
                    md: ['panel', 'pushkontak', 'store'],
                    cpanel: null,
                    store: null,
                    pushkontak: null
                };
                
                const allowedCats = modeAllowedMap[botMode];
                const excludeCats = modeExcludeMap[botMode] || [];
                
                for (const cat of sortedCats) {
                    if (cat === 'owner' && !m.isOwner) continue;
                    if (allowedCats && !allowedCats.includes(cat.toLowerCase())) continue;
                    if (excludeCats && excludeCats.includes(cat.toLowerCase())) continue;
                    
                    const cmds = commandsByCategory[cat] || [];
                    if (cmds.length === 0) continue;
                    
                    const emoji = CATEGORY_EMOJIS[cat] || '📁';
                    const title = `${emoji} ${toMonoUpperBold(cat)}`;
                    
                    categoryRows.push({
                        title: title,
                        id: `${prefix}menuitsuki ${cat}`,
                        description: `${cmds.length} commands`
                    });
                }
                
                let totalCmds = 0;
                for (const cat of categories) {
                    totalCmds += (commandsByCategory[cat] || []).length;
                }
                
                const now = new Date();
                const greeting = getTimeGreeting();
                const greetEmoji = greeting.includes('pagi') ? '🌅' : greeting.includes('siang') ? '☀️' : greeting.includes('sore') ? '🌇' : '🌙';
                const uptimeFormatted = formatUptime(uptime);
                
                let headerText = `*@${m.pushName || "User"}* 🪸

Aku ${botConfig.bot?.name || 'Itsuki Nakano Chan'}, bot WhatsApp yang siap bantu kamu.  

Kamu bisa pakai aku buat cari info, ambil data, atau bantu hal-hal sederhana langsung lewat WhatsApp — praktis tanpa ribet.\n\n`;
                headerText += `╭┈┈⬡「 🤖 *ʙᴏᴛ ɪɴꜰᴏ* 」\n`;
                headerText += `┃ \`◦\` ɴᴀᴍᴀ: *${botConfig.bot?.name || 'Itsuki Nakano Chan'}*\n`;
                headerText += `┃ \`◦\` ᴠᴇʀsɪ: *v${botConfig.bot?.version || '1.2.0'}*\n`;
                headerText += `┃ \`◦\` ᴍᴏᴅᴇ: *${(botConfig.mode || 'public').toUpperCase()}*\n`;
                headerText += `┃ \`◦\` ᴜᴘᴛɪᴍᴇ: *${uptimeFormatted}*\n`;
                headerText += `┃ \`◦\` ᴛᴏᴛᴀʟ ᴄᴍᴅ: *${totalCmds}*\n`;
                headerText += `╰┈┈┈┈┈┈┈┈⬡\n\n`;
                headerText += `📋 *Pilih kategori di bawah untuk melihat daftar command*`;
                
                try {
                    const { generateWAMessageFromContent, proto } = require('itsuki');
                    
                    const buttons = [
                        {
                            name: 'single_select',
                            buttonParamsJson: JSON.stringify({
                                title: '📁 ᴘɪʟɪʜ ᴍᴇɴᴜ',
                                sections: [{
                                    title: '📋 PILIH CATEGORY',
                                    rows: categoryRows
                                }], 
                                icon: "REVIEW"
                            })
                        },
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: '📊 TOTAL SEMUA FITUR',
                                id: `${prefix}totalfitur`
                            })
                        },
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: '📊 SEMUA MENU',
                                id: `${prefix}allmenu`
                            })
                        }
                    ];
                    
                    let headerMedia = null;
                    if (imageBuffer) {
                        try {
                            const { prepareWAMessageMedia } = require('itsuki');
                            headerMedia = await prepareWAMessageMedia({
                                image: imageBuffer
                            }, {
                                upload: sock.waUploadToServer
                            });
                        } catch (e) {}
                    }
                    
                    const msg = generateWAMessageFromContent(m.chat, {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: {
                                    deviceListMetadata: {},
                                    deviceListMetadataVersion: 2
                                },
                                interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                                    body: proto.Message.InteractiveMessage.Body.fromObject({
                                        text: headerText
                                    }),
                                    footer: proto.Message.InteractiveMessage.Footer.fromObject({
                                        text: `© ${botConfig.bot?.name || 'Itsuki Nakano Chan'} | ${sortedCats.length} Categories`
                                    }),
                                    header: proto.Message.InteractiveMessage.Header.fromObject({
                                        title: `${botConfig.bot?.name || 'Itsuki Nakano Chan'}`,
                                        hasMediaAttachment: !!headerMedia,
                                        ...(headerMedia || {})
                                    }),
                                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                                        buttons: buttons
                                    }),
                                    contextInfo: {
                                        mentionedJid: [m.sender],
                                        forwardingScore: 9999,
                                        isForwarded: true,
                                        forwardedNewsletterMessageInfo: {
                                            newsletterJid: saluranId,
                                            newsletterName: saluranName,
                                            serverMessageId: 127
                                        }
                                    }
                                })
                            }
                        }
                    }, { userJid: m.sender, quoted: getVerifiedQuoted(botConfig) });
                    
                    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
                    
                } catch (btnError) {
                    console.error('[Menu V5] Button error:', btnError.message);
                    
                    let catListText = `📋 *ᴋᴀᴛᴇɢᴏʀɪ ᴍᴇɴᴜ*\n\n`;
                    for (const cat of sortedCats) {
                        if (cat === 'owner' && !m.isOwner) continue;
                        const cmds = commandsByCategory[cat] || [];
                        if (cmds.length === 0) continue;
                        const emoji = CATEGORY_EMOJIS[cat] || '📁';
                        catListText += `> ${emoji} \`${prefix}menuitsuki ${cat}\` - ${toMonoUpperBold(cat)} (${cmds.length})\n`;
                    }
                    catListText += `\n_Ketik perintah kategori untuk melihat command_`;
                    
                    const fallbackMsg = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallbackMsg.image = imageBuffer; fallbackMsg.caption = headerText + '\n\n' + catListText; }
                    else { fallbackMsg.text = headerText + '\n\n' + catListText; }
                    await sock.sendMessage(m.chat, fallbackMsg, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;
                
            case 6:
                const thumbPathV6 = await getAssetPath('images.itsuki3', 'jpg');
                const saluranIdV6 = botConfig.saluran?.id || 'https://whatsapp.com/channel/0029VbDytkmBqbrF0rFKr12w';
                const saluranNameV6 = botConfig.saluran?.name || botConfig.bot?.name || 'Itsuki Nakano Chan';
                const saluranLinkV6 = botConfig.saluran?.link || 'https://whatsapp.com/channel/0029VbDytkmBqbrF0rFKr12w';
                
                let bannerThumbV6 = null;
                
                try {
                    const sourceBuffer = fs.existsSync(thumbPathV6) 
                        ? fs.readFileSync(thumbPathV6) 
                        : (thumbBuffer || imageBuffer);
                    
                    if (sourceBuffer) {
                        bannerThumbV6 = await sharp(sourceBuffer)
                            .resize(200, 200, { fit: 'inside' })
                            .jpeg({ quality: 90 })
                            .toBuffer();
                    }
                } catch (resizeErr) {
                    console.error('[Menu V6] Resize error:', resizeErr.message);
                    bannerThumbV6 = thumbBuffer;
                }
                
                const contextInfoV6 = {
                    mentionedJid: [m.sender],
                    forwardingScore: 9999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: saluranIdV6,
                        newsletterName: saluranNameV6,
                        serverMessageId: 127
                    },
                    linkPreview: {
                        'matched-text': config.info?.website || saluranLinkV6 || config.info?.grupwa || 'https://alwayslennz-dev.my.id',
                        title: botConfig.bot?.name || 'Itsuki Nakano Chan',
                        description: `v${botConfig.bot?.version || '1.0.1'} • Fast Response Bot`,
                        previewType: 0,
                        jpegThumbnail: thumbBuffer || imageBuffer || undefined,
                        linkPreviewMetadata: {
                            linkMediaDuration: 0,
                            socialMediaPostType: 4
                        }
                    }
                };
                
                try {
                    await sock.sendMessage(m.chat, {
                        document: imageBuffer || Buffer.from('Itsuki Nakano Chan Menu'),
                        mimetype: 'application/pdf',
                        fileName: `ɴᴏ ᴘᴀɪɴ ɴᴏ ɢᴀɪɴ`,
                        fileLength: 9999999999,
                        caption: text,
                        jpegThumbnail: bannerThumbV6,
                        contextInfo: contextInfoV6
                    }, { quoted: getVerifiedQuoted(botConfig) });
                    
                } catch (v6Error) {
                    console.error('[Menu V6] Error:', v6Error.message);
                    const fallbackV6 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallbackV6.image = imageBuffer; fallbackV6.caption = text; }
                    else { fallbackV6.text = text; }
                    await sock.sendMessage(m.chat, fallbackV6, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;
                
            case 7:
                try {
                    const { prepareWAMessageMedia } = require('itsuki');
                    const prefixV7 = botConfig.command?.prefix || '.';
                    const categoriesV7 = getCategories();
                    const commandsByCategoryV7 = getCommandsByCategory();
                    const categoryOrderV7 = ['main', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info'];
                    
                    const modeAllowedMapV7 = {
                        md: null,
                        cpanel: ['main', 'group', 'sticker', 'owner', 'tools', 'panel'],
                        store: ['main', 'group', 'sticker', 'owner', 'store'],
                        pushkontak: ['main', 'group', 'sticker', 'owner', 'pushkontak']
                    };
                    const modeExcludeMapV7 = {
                        md: ['panel', 'pushkontak', 'store'],
                        cpanel: null, store: null, pushkontak: null
                    };
                    
                    const allowedCatsV7 = modeAllowedMapV7[botMode];
                    const excludeCatsV7 = modeExcludeMapV7[botMode] || [];
                    
                    const sortedCatsV7 = categoriesV7.sort((a, b) => {
                        const indexA = categoryOrderV7.indexOf(a);
                        const indexB = categoryOrderV7.indexOf(b);
                        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                    });
                    
                    const carouselCards = [];
                    
                    for (const cat of sortedCatsV7) {
                        if (cat === 'owner' && !m.isOwner) continue;
                        if (allowedCatsV7 && !allowedCatsV7.includes(cat.toLowerCase())) continue;
                        if (excludeCatsV7 && excludeCatsV7.includes(cat.toLowerCase())) continue;
                        
                        const cmds = commandsByCategoryV7[cat] || [];
                        if (cmds.length === 0) continue;
                        
                        const emoji = CATEGORY_EMOJIS[cat] || '📁';
                        const categoryName = toSmallCaps(cat);
                        
                        let cardBody = `━━━━━━━━━━━━━━━\n`;
                        
                        for (const cmd of cmds.slice(0, 15)) {
                            cardBody += `◦ \`${prefixV7}${toSmallCaps(cmd)}\`\n`;
                        }
                        if (cmds.length > 15) {
                            cardBody += `\n_...dan ${cmds.length - 15} command lainnya_`;
                        }
                        
                        cardBody += `\n\n> Total: ${cmds.length} commands`;
                        
                        let cardMedia = null;
                        try {
                            const catThumbPath = await getAssetPath(`images.cat.${cat}`, 'jpg');
                            const defaultV7Path = await getAssetPath('images.itsukiV7', 'jpg');
                            let sourceImage = fs.existsSync(defaultV7Path) ? fs.readFileSync(defaultV7Path) : thumbBuffer;
                            
                            if (fs.existsSync(catThumbPath)) {
                                sourceImage = fs.readFileSync(catThumbPath);
                            }
                            
                            if (sourceImage) {
                                const metaV7 = await sharp(sourceImage).metadata();
                                const resizedImage = await sharp(sourceImage)
                                    .resize(metaV7.width, metaV7.height, { fit: 'inside' })
                                    .jpeg({ quality: 80 })
                                    .toBuffer();
                                
                                cardMedia = await prepareWAMessageMedia({
                                    image: resizedImage
                                }, {
                                    upload: sock.waUploadToServer
                                });
                            }
                        } catch (e) {
                            console.error('[Menu V7] Card media error:', e.message);
                        }
                        
                        const cardMessage = {
                            header: proto.Message.InteractiveMessage.Header.fromObject({
                                title: `${emoji} ${categoryName.toUpperCase()}`,
                                hasMediaAttachment: !!cardMedia,
                                ...(cardMedia || {})
                            }),
                            body: proto.Message.InteractiveMessage.Body.fromObject({
                                text: cardBody
                            }),
                            footer: proto.Message.InteractiveMessage.Footer.create({
                                text: `${botConfig.bot?.name || 'Itsuki Nakano'} • ${cat}`
                            }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                                buttons: [{
                                    name: 'quick_reply',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: `📋 Lihat ${categoryName}`,
                                        id: `${prefixV7}menuitsuki ${cat}`
                                    })
                                }]
                            })
                        };
                        
                        carouselCards.push(cardMessage);
                    }
                    
                    if (carouselCards.length === 0) {
                        await m.reply(text);
                        break;
                    }
                    
                    const msg = await generateWAMessageFromContent(m.chat, {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: {
                                    deviceListMetadata: {},
                                    deviceListMetadataVersion: 2
                                },
                                interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                                    body: proto.Message.InteractiveMessage.Body.fromObject({
                                        text: `${getTimeGreeting()} *${m.pushName}!*\n\n> Geser untuk melihat kategori menu\n> Ketuk tombol untuk melihat detail`
                                    }),
                                    footer: proto.Message.InteractiveMessage.Footer.fromObject({
                                        text: `${botConfig.bot?.name || 'Itsuki Nakano'} v${botConfig.bot?.version || '1.0'}`
                                    }),
                                    carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                                        cards: carouselCards
                                    })
                                })
                            }
                        }
                    }, {
                        userJid: m.sender,
                        quoted: getVerifiedQuoted(botConfig)
                    });
                    
                    await sock.relayMessage(m.chat, msg.message, {
                        messageId: msg.key.id
                    });
                    
                } catch (carouselError) {
                    console.error('[Menu V7] Carousel error:', carouselError.message);
                    const fallbackV7 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallbackV7.image = imageBuffer; fallbackV7.caption = text; }
                    else { fallbackV7.text = text; }
                    await sock.sendMessage(m.chat, fallbackV7, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;
                
            case 8:
                const timeHelperV8 = require('../../src/lib/timeHelper');
                const timeV8 = timeHelperV8.formatTime('HH:mm');
                const dateV8 = timeHelperV8.formatFull('DD/MM/YYYY');
                const userV8 = db.getUser(m.sender);
                const greetingV8 = getTimeGreeting();
                const uptimeV8 = formatUptime(uptime);
                
                const categoriesV8 = getCategories();
                const cmdsByCatV8 = getCommandsByCategory();
                let totalCmdV8 = 0;
                for (const cat of categoriesV8) {
                    totalCmdV8 += (cmdsByCatV8[cat] || []).length;
                }
                
                let roleV8 = 'User', emojiV8 = '◈';
                if (m.isOwner) { roleV8 = 'Owner'; emojiV8 = '♚'; }
                else if (m.isPremium) { roleV8 = 'Premium'; emojiV8 = '✦'; }
                
                const prefixV8 = botConfig.command?.prefix || '.';
                const catOrderV8 = ['main', 'ai', 'download', 'search', 'tools', 'fun', 'game', 'sticker', 'canvas', 'group', 'media', 'user', 'rpg', 'owner'];
                const sortedCatsV8 = [...categoriesV8].sort((a, b) => {
                    const iA = catOrderV8.indexOf(a.toLowerCase());
                    const iB = catOrderV8.indexOf(b.toLowerCase());
                    return (iA === -1 ? 999 : iA) - (iB === -1 ? 999 : iB);
                });
                
                const modeAllowV8 = {
                    md: null,
                    cpanel: ['main', 'group', 'sticker', 'owner', 'tools', 'panel'],
                    store: ['main', 'group', 'sticker', 'owner', 'store'],
                    pushkontak: ['main', 'group', 'sticker', 'owner', 'pushkontak']
                };
                const modeExcludeV8 = {
                    md: ['panel', 'pushkontak', 'store'],
                    cpanel: null, store: null, pushkontak: null
                };
                const allowV8 = modeAllowV8[botMode];
                const excludeV8 = modeExcludeV8[botMode] || [];
                
                let menuV8 = ``;
                
                const sparkles = ['✦', '✧', '⋆', '˚', '✵', '⊹'];
                const randomSparkle = () => sparkles[Math.floor(Math.random() * sparkles.length)];
                
                menuV8 += `${randomSparkle()}━━━━━━━━━━━━━━━━━━━━━${randomSparkle()}\n`;
                menuV8 += `*${botConfig.bot?.name || 'ITSUKI-AI'}*\n`;
                menuV8 += `${randomSparkle()}━━━━━━━━━━━━━━━━━━━━━${randomSparkle()}\n\n`;
                
                menuV8 += `┏━━━〔 ${emojiV8} *PROFILE* 〕━━━┓\n`;
                menuV8 += `┃ 👤 *${m.pushName}*\n`;
                menuV8 += `┃ 🏷️ ${roleV8}\n`;
                menuV8 += `┃ ⏰ ${timeV8} WIB\n`;
                menuV8 += `┃ 📅 ${dateV8}\n`;
                menuV8 += `┗━━━━━━━━━━━━━━━┛\n\n`;
                
                menuV8 += `┏━━〔 ⚡ *SYSTEM STATS* 〕━━┓\n`;
                menuV8 += `┃ 🎫 Limit   ➤ ${m.isOwner || m.isPremium ? '∞ Unlimited' : `${userV8?.limit ?? 25}/25`}\n`;
                menuV8 += `┃ ⏱️ Uptime  ➤ ${uptimeV8}\n`;
                menuV8 += `┃ 🔧 Mode    ➤ ${botMode.toUpperCase()}\n`;
                menuV8 += `┃ 📊 Total   ➤ ${totalCmdV8} Commands\n`;
                menuV8 += `┃ 👥 Users   ➤ ${db.getUserCount()} Aktif\n`;
                menuV8 += `┗━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                
                menuV8 += `╭══════════════════════╮\n`;
                menuV8 += `║  📋 *COMMAND LIST*    ║\n`;
                menuV8 += `╰══════════════════════╯\n\n`;
                
                for (const cat of sortedCatsV8) {
                    if (cat === 'owner' && !m.isOwner) continue;
                    if (allowV8 && !allowV8.includes(cat.toLowerCase())) continue;
                    if (excludeV8.includes(cat.toLowerCase())) continue;
                    
                    const cmdsV8 = cmdsByCatV8[cat] || [];
                    if (cmdsV8.length === 0) continue;
                    
                    const emojiCat = CATEGORY_EMOJIS[cat] || '▣';
                    menuV8 += `┌─────「 ${emojiCat} *${cat.toUpperCase()}* 」\n`;
                    menuV8 += `│ ✦ Total: ${cmdsV8.length} commands\n`;
                    menuV8 += `│\n`;
                    
                    for (const cmd of cmdsV8) {
                        menuV8 += `│ ├➤ ${prefixV8}${cmd}\n`;
                    }
                    menuV8 += `│\n`;
                    menuV8 += `└───────────────────\n\n`;
                }
                
                menuV8 += `╭━━〔 💡 *TIPS* 〕━━╮\n`;
                menuV8 += `│ ❸ Follow channel ${config.saluran?.link || 'Itsuki Nakano Chan'}\n`;
                menuV8 += `╰━━━━━━━━━━━━━━━━━━╯\n\n`;
                
                menuV8 += `> ${randomSparkle()} *${botConfig.bot?.name}* v${botConfig.bot?.version || '1.7.1'} ${randomSparkle()}`;
                
                
                let thumbV8 = thumbBuffer;
                if (thumbBuffer) {
                    try {
                        thumbV8 = await sharp(thumbBuffer)
                            .resize(300, 300, { fit: 'cover' })
                            .jpeg({ quality: 80 })
                            .toBuffer();
                    } catch (e) {
                        thumbV8 = thumbBuffer;
                    }
                }
                
                const ftroliQuoted = {
                    key: { fromMe: false, participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast' },
                    message: {
                        orderMessage: {
                            orderId: '1337',
                            thumbnail: thumbV8 || null,
                            itemCount: totalCmdV8,
                            status: 'INQUIRY',
                            surface: 'CATALOG',
                            message: `${botConfig.bot?.name || 'Itsuki Nakano Chan'} Menu`,
                            orderTitle: `📋 ${totalCmdV8} Commands`,
                            sellerJid: botConfig.botNumber ? `${botConfig.botNumber}@s.whatsapp.net` : m.sender,
                            token: 'itsuki-menu-v8',
                            totalAmount1000: 0,
                            totalCurrencyCode: 'IDR',
                            contextInfo: {
                                isForwarded: true,
                                forwardingScore: 9999,
                                forwardedNewsletterMessageInfo: {
                                    newsletterJid: botConfig.saluran?.id || 'https://whatsapp.com/channel/0029VbDytkmBqbrF0rFKr12w',
                                    newsletterName: botConfig.saluran?.name || botConfig.bot?.name || 'Itsuki Nakano Chan',
                                    serverMessageId: 127
                                }
                            }
                        }
                    }
                };
                
                await sock.sendMessage(m.chat, {
                    image: (await getAssetBuffer('images.itsukiV8')),
                    caption: menuV8,
                    contextInfo: getContextInfo(botConfig, m, imageBuffer, true)
                }, { quoted: ftroliQuoted });
                break;
                
            case 9:
                try {
                    const { prepareWAMessageMedia } = require('itsuki');
                    const prefixV9 = botConfig.command?.prefix || '.';
                    const categoriesV9 = getCategories();
                    const cmdsByCatV9 = getCommandsByCategory();
                    const saluranIdV9 = botConfig.saluran?.id || 'https://whatsapp.com/channel/0029VbDytkmBqbrF0rFKr12w';
                    const saluranNameV9 = botConfig.saluran?.name || botConfig.bot?.name || 'Itsuki Nakano Chan';
                    const saluranLinkV9 = botConfig.saluran?.link || 'https://whatsapp.com/channel/0029VbDytkmBqbrF0rFKr12w';
                    
                    const { getCasesByCategory: getCasesCatV9 } = require('../../case/itsuki');
                    const casesCatV9 = getCasesCatV9();
                    
                    const categoryOrderV9 = ['main', 'owner', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info', 'cek', 'economy', 'user', 'canvas', 'random', 'premium', 'ephoto', 'jpm'];
                    const allowV9 = botMode === 'md' ? null : ['main', 'group', 'sticker', 'owner', 'tools'];
                    const excludeV9 = ['panel', 'pushkontak', 'store'];
                    
                    const sortedCatsV9 = [...categoriesV9].sort((a, b) => {
                        const indexA = categoryOrderV9.indexOf(a);
                        const indexB = categoryOrderV9.indexOf(b);
                        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                    });
                    
                    const menuRowsV9 = [];
                    for (const cat of sortedCatsV9) {
                        if (cat === 'owner' && !m.isOwner) continue;
                        if (allowV9 && !allowV9.includes(cat.toLowerCase())) continue;
                        if (excludeV9.includes(cat.toLowerCase())) continue;
                        
                        const pluginCmdsV9 = cmdsByCatV9[cat] || [];
                        const caseCmdsV9 = casesCatV9[cat] || [];
                        const totalCmdsV9 = pluginCmdsV9.length + caseCmdsV9.length;
                        if (totalCmdsV9 === 0) continue;
                        
                        const emojiCat = CATEGORY_EMOJIS[cat] || '📁';
                        menuRowsV9.push({
                            title: `${emojiCat} ${cat.toUpperCase()}`,
                            description: `${totalCmdsV9} commands`,
                            id: `${prefixV9}menuitsuki ${cat}`
                        });
                    }
                    
                    let headerMediaV9 = null;
                    if (imageBuffer) {
                        try {
                            const imgRawV9 = (await getAssetBuffer('images.itsukiV9'));
                            const metaV9 = await sharp(imgRawV9).metadata();
                            const resizedV9 = await sharp(imgRawV9)
                                .resize(metaV9.width, metaV9.height, { fit: 'inside' })
                                .jpeg({ quality: 80 })
                                .toBuffer();
                            headerMediaV9 = await prepareWAMessageMedia({
                                image: resizedV9
                            }, { upload: sock.waUploadToServer });
                        } catch (e) {
                            console.error('[Menu V9] Media prep error:', e.message);
                        }
                    }

                    const seaerz = "https://wa.me/" + config.owner?.number?.[0]
                    
                    const buttonsV9 = [
                        {
                            name: "single_select",
                            buttonParamsJson: JSON.stringify({ 
                                has_multiple_buttons: true,
                            })
                        },
                        {
                            name: "cta_url",
                            buttonParamsJson: JSON.stringify({
                                display_text: "Nomor Owner ku",
                                url: seaerz,
                                merchant_url: seaerz
                            })
                        },
                        {
                            name: "quick_reply",
                            buttonParamsJson: JSON.stringify({
                                display_text: "🧾 Tampilkan Semua Menu",
                                id: `${m.prefix}allmenu`,
                            })
                        },
                        
                    ];
                    
                    const msgV9 = generateWAMessageFromContent(m.chat, {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: {
                                    deviceListMetadata: {},
                                    deviceListMetadataVersion: 2
                                },
                                interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                                    body: proto.Message.InteractiveMessage.Body.fromObject({
                                        text: text
                                    }),
                                    footer: proto.Message.InteractiveMessage.Footer.fromObject({
                                        text: `© ${botConfig.bot?.name || 'Itsuki Nakano Chan'} v${botConfig.bot?.version || '1.9.0'}`
                                    }),
                                    header: proto.Message.InteractiveMessage.Header.fromObject({
                                        hasMediaAttachment: !!headerMediaV9,
                                        ...(headerMediaV9 || {})
                                    }),
                                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                                        messageParamsJson: JSON.stringify({
                                            limited_time_offer: {
                                                text: botConfig.bot?.name || 'Itsuki Nakano Chan',
                                                url: saluranLinkV9,
                                                copy_code: botConfig.owner?.name || 'Itsuki Nakano Chan',
                                                expiration_time: Date.now() * 999
                                            },
                                            bottom_sheet: {
                                                in_thread_buttons_energi: 2,
                                                divider_indices: [1, 2, 3, 4, 5, 999],
                                                list_title: botConfig.bot?.name || 'Itsuki Nakano Chan',
                                                button_title: '🍀 ριℓιн кαтєgσяι'
                                            },
                                        }),
                                        buttons: buttonsV9
                                    }),
                                    contextInfo: {
                                        mentionedJid: [m.sender],
                                        forwardingScore: 9999,
                                        isForwarded: true,
                                        forwardedNewsletterMessageInfo: {
                                            newsletterJid: saluranIdV9,
                                            newsletterName: saluranNameV9,
                                            serverMessageId: 127
                                        }
                                    }
                                })
                            }
                        }
                    }, { userJid: m.sender, quoted: getVerifiedQuoted(botConfig) });
                    
                    await sock.relayMessage(m.chat, msgV9.message, { messageId: msgV9.key.id });
                    
                } catch (v9Error) {
                    console.error('[Menu V9] Error:', v9Error.message);
                    const fallbackV9 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallbackV9.image = imageBuffer; fallbackV9.caption = text; }
                    else { fallbackV9.text = text; }
                    await sock.sendMessage(m.chat, fallbackV9, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;
                
            case 10:
                try {
                    const { prepareWAMessageMedia } = require('itsuki');
                    const prefixV10 = botConfig.command?.prefix || '.';
                    const categoriesV10 = getCategories();
                    const cmdsByCatV10 = getCommandsByCategory();
                    const saluranIdV10 = botConfig.saluran?.id || 'https://whatsapp.com/channel/0029VbDytkmBqbrF0rFKr12w';
                    const saluranNameV10 = botConfig.saluran?.name || botConfig.bot?.name || 'Itsuki Nakano Chan';
                    const timeHelper = require('../../src/lib/timeHelper');
                    const timeStrV10 = timeHelper.formatTime('HH:mm:ss');
                    const uptimeFmtV10 = formatUptime(uptime);
                    
                    let totalCmdV10 = 0;
                    for (const cat of categoriesV10) {
                        totalCmdV10 += (cmdsByCatV10[cat] || []).length;
                    }
                    
                    const { getCasesByCategory, getCaseCount } = require('../../case/itsuki');
                    const caseCats = getCasesByCategory();
                    const caseCountV10 = getCaseCount();
                    totalCmdV10 += caseCountV10;
                    
                    const categoryOrderV10 = ['main', 'owner', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info', 'cek', 'economy', 'user', 'canvas', 'random', 'premium'];
                    const allowV10 = botMode === 'md' ? null : ['main', 'group', 'sticker', 'owner', 'tools'];
                    const excludeV10 = ['panel', 'pushkontak', 'store'];
                    
                    const sortedCatsV10 = [...categoriesV10].sort((a, b) => {
                        const indexA = categoryOrderV10.indexOf(a);
                        const indexB = categoryOrderV10.indexOf(b);
                        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                    });
                    
                    const menuRowsV10 = [];
                    for (const cat of sortedCatsV10) {
                        if (cat === 'owner' && !m.isOwner) continue;
                        if (allowV10 && !allowV10.includes(cat.toLowerCase())) continue;
                        if (excludeV10.includes(cat.toLowerCase())) continue;
                        
                        const pluginCmds = cmdsByCatV10[cat] || [];
                        const caseCmds = caseCats[cat] || [];
                        const totalCmds = pluginCmds.length + caseCmds.length;
                        if (totalCmds === 0) continue;
                        
                        const emojiCat = CATEGORY_EMOJIS[cat] || '📁';
                        menuRowsV10.push({
                            title: `${emojiCat} ${cat.toUpperCase()}`,
                            description: `${totalCmds} commands`,
                            id: `${m.prefix}menuitsuki ${cat}`
                        });
                    }
                    
                    let productImageV10 = null;
                    try {
                        const imgPathV10 = await getAssetPath('images.itsukiV9', 'jpg');
                        const imgBufferV10 = fs.existsSync(imgPathV10) 
                            ? fs.readFileSync(imgPathV10) 
                            : (imageBuffer || thumbBuffer);
                        
                        if (imgBufferV10) {
                            const resizedV10 = await sharp(imgBufferV10)
                                .resize(736, 890, { fit: 'cover' })
                                .jpeg({ quality: 85 })
                                .toBuffer();
                            productImageV10 = await prepareWAMessageMedia({
                                image: resizedV10
                            }, { upload: sock.waUploadToServer });
                        }
                    } catch (e) {
                        console.error('[Menu V10] Media prep error:', e.message);
                    }
                    
                    const footerTextV10 = `
Hai *@${m.pushName || "User"}* 🪸

Aku ${botConfig.bot?.name || 'Itsuki Nakano Chan'}, bot WhatsApp yang siap bantu kamu.  

Kamu bisa pakai aku buat cari info, ambil data, atau bantu hal-hal sederhana langsung lewat WhatsApp — praktis tanpa ribet.

─────────────────────────
Nama    : ${botConfig.bot?.name || 'Itsuki Nakano Chan'}
Versi : v${botConfig.bot?.version || '1.9.0'}
Runtime : Node.js ${process.version}
Bot Up  : ${uptimeFmtV10}

Owner ku kak   : ${botConfig.owner?.name || 'Lucky Archz'}
─────────────────────────
Klik tombol di bawah untuk menampilkan menu
`;
                    
                    const buttonsV10 = [{
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            display_text: botConfig.bot?.name || 'Itsuki Nakano Chan',
                            id: `${m.prefix}allmenu`,
                            
                        })
                    }];
                    
                    const productId = `Itsuki Chan :)`;
                    const businessJid = botConfig.botNumber 
                        ? `${botConfig.botNumber}@s.whatsapp.net` 
                        : (m.botJid || sock.user?.id);
                    
                    const msgV10 = generateWAMessageFromContent(m.chat, {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: {
                                    deviceListMetadata: {},
                                    deviceListMetadataVersion: 2
                                },
                                interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                                    header: proto.Message.InteractiveMessage.Header.fromObject({
                                        title: `${botConfig.bot?.name || 'Itsuki Nakano Chan'} Menu`,
                                        hasMediaAttachment: !!productImageV10,
                                        productMessage: {
                                            product: {
                                                productImage: productImageV10?.imageMessage || null,
                                                productId: productId,
                                                title: `${botConfig.bot?.name || 'Itsuki Nakano Chan'} Menu`,
                                                description: 'Menu',
                                                currencyCode: 'USD',
                                                priceAmount1000: '1000000000000000',
                                                retailerId: botConfig.bot?.name || 'Itsuki Nakano',
                                                productImageCount: 1
                                            },
                                            businessOwnerJid: businessJid
                                        }
                                    }),
                                    body: proto.Message.InteractiveMessage.Body.fromObject({
                                        text: `*© ${botConfig.bot?.name || 'Itsuki Nakano Chan'} 2026*`
                                    }),
                                    footer: proto.Message.InteractiveMessage.Footer.fromObject({
                                        text: footerTextV10
                                    }),
                                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                                        buttons: buttonsV10
                                    }),
                                    contextInfo: {
                                        mentionedJid: [m.sender],
                                        forwardingScore: 9999,
                                        isForwarded: true,
                                        forwardedNewsletterMessageInfo: {
                                            newsletterJid: saluranIdV10,
                                            newsletterName: saluranNameV10,
                                            serverMessageId: 127
                                        }
                                    }
                                })
                            }
                        }
                    }, { userJid: m.sender, quoted: getVerifiedQuoted(botConfig) });
                    
                    await sock.relayMessage(m.chat, msgV10.message, { messageId: msgV10.key.id });
                    
                } catch (v10Error) {
                    console.error('[Menu V10] Error:', v10Error.message);
                    const fallbackV10 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallbackV10.image = imageBuffer; fallbackV10.caption = text; }
                    else { fallbackV10.text = text; }
                    await sock.sendMessage(m.chat, fallbackV10, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;
                
            case 11:
                try {
                    const saluranIdV11 = botConfig.saluran?.id || 'https://whatsapp.com/channel/0029VbDytkmBqbrF0rFKr12w';
                    const saluranNameV11 = botConfig.saluran?.name || botConfig.bot?.name || 'Itsuki Nakano Chan';
                    const docuThumbV11 = thumbBuffer || imageBuffer || (await getAssetBuffer('images.itsukiAllmenu'));
                    const prefix = botConfig.command?.prefix || '.';
                const saluranId = botConfig.saluran?.id || 'https://whatsapp.com/channel/0029VbDytkmBqbrF0rFKr12w';
                const saluranName = botConfig.saluran?.name || botConfig.bot?.name || 'Itsuki Nakano Chan';
                
                const categories = getCategories();
                const commandsByCategory = getCommandsByCategory();
                const categoryOrder = ['owner', 'main', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info', 'jpm', 'pushkontak', 'panel', 'user'];
                
                const sortedCats = [...categories].sort((a, b) => {
                    const indexA = categoryOrder.indexOf(a);
                    const indexB = categoryOrder.indexOf(b);
                    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                });
                
                const toMonoUpperBold = (text) => {
                    const chars = {
                        'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F', 'G': 'G',
                        'H': 'H', 'I': 'I', 'J': 'J', 'K': 'K', 'L': 'L', 'M': 'M', 'N': 'N',
                        'O': 'O', 'P': 'P', 'Q': 'Q', 'R': 'R', 'S': 'S', 'T': 'T', 'U': 'U',
                        'V': 'V', 'W': 'W', 'X': 'X', 'Y': 'Y', 'Z': 'Z'
                    };
                    return text.toUpperCase().split('').map(c => chars[c] || c).join('');
                };
                
                const categoryRows = [];
                
                const modeAllowedMap = {
                    md: null,
                    cpanel: ['main', 'group', 'sticker', 'owner', 'tools', 'panel'],
                    store: ['main', 'group', 'sticker', 'owner', 'store'],
                    pushkontak: ['main', 'group', 'sticker', 'owner', 'pushkontak']
                };
                const modeExcludeMap = {
                    md: ['panel', 'pushkontak', 'store'],
                    cpanel: null,
                    store: null,
                    pushkontak: null
                };
                
                const allowedCats = modeAllowedMap[botMode];
                const excludeCats = modeExcludeMap[botMode] || [];
                
                for (const cat of sortedCats) {
                    if (cat === 'owner' && !m.isOwner) continue;
                    if (allowedCats && !allowedCats.includes(cat.toLowerCase())) continue;
                    if (excludeCats && excludeCats.includes(cat.toLowerCase())) continue;
                    
                    const cmds = commandsByCategory[cat] || [];
                    if (cmds.length === 0) continue;
                    
                    const emoji = CATEGORY_EMOJIS[cat] || '📁';
                    const title = `${emoji} ${toMonoUpperBold(cat)}`;
                    
                    categoryRows.push({
                        header: `${toMonoUpperBold('MENU ' + title)}`,
                        id: `${prefix}menuitsuki ${cat}`,
                        title: `Berisi ${cmds.length} Perintah`,
                        description: 'Tap untuk membuka menu category ini'
                    });
                }
                
                let totalCmds = 0;
                for (const cat of categories) {
                    totalCmds += (commandsByCategory[cat] || []).length;
                }
                    await sock.sendMessage(m.chat, {
                        interactiveMessage: {
                            title: `Hallo Kak *@${m.pushName}*
                            
Sebelumnya, terima kasih yak sudah menggunakan bot kami

╭─ \`INFORMASI BOT\` θৎ
┆ ᵎᵎ Nama Bot : *${botConfig.bot?.name || 'Itsuki Nakano Chan'}*
┆ ᵎᵎ Owner Bot : *${botConfig.owner?.name || 'Itsuki Nakano Chan'}*
┆ ᵎᵎ Prefix : *${botConfig.command?.prefix || '.'}*
┆ ᵎᵎ Total Perintah : *${totalCmds}*
┆ ᵎᵎ Role Kamu : ${m.isOwner ? 'Owner' : m.isPremium ? "Premium" : "User Biasa"}
╰─────

silahkan tekan tombol dibawah untuk memilih menu`,
                            footer: botConfig.settings?.footer || `© ${botConfig.bot?.name || 'Itsuki Nakano Chan'} 2026`,
                            document: fs.readFileSync('./package.json'),
                            mimetype: 'image/png',
                            fileName: `${getTimeGreeting()}`,
                            jpegThumbnail: await sharp(docuThumbV11).resize({ width: 300, height: 300 }).toBuffer(),
                            contextInfo: {
                                mentionedJid: [m.sender],
                                forwardingScore: 777,
                                isForwarded: true,
                                forwardedNewsletterMessageInfo: {
                                    newsletterJid: saluranIdV11,
                                    newsletterName: saluranNameV11,
                                    serverMessageId: 127
                                }
                            },
                            jpegThumbnail: (await getAssetBuffer('images.itsukiV11') || undefined),
                            nativeFlowMessage: {
                                messageParamsJson: JSON.stringify({
                                    limited_time_offer: {
                                        text: `Gunakan bot ini dengan bijak yak`,
                                        url: botConfig.saluran?.url || 'https://whatsapp.com/channel/0029VbDytkmBqbrF0rFKr12w',
                                        copy_code: botConfig.bot?.name || 'Itsuki Nakano Chan',
                                        expiration_time: Date.now() * 999
                                    },
                                    bottom_sheet: {            
                                        in_thread_buttons_limit: 2,            
                                        divider_indices: [1, 2, 3, 4, 5, 999],            
                                        list_title: "Pilih Menu",            
                                        button_title: "🍀 Pilih Menu Disini"          
                                    },    
                                    tap_target_configuration: {            
                                        title: " X ",            
                                        description: "bomboclard",            
                                        canonical_url: "https://Itsuki Nakano.site",            
                                        domain: "shop.example.com",            
                                        button_index: 0          
                                    }  
                                }),
                                buttons: [
                                    {            
                                        name: "single_select",            
                                        buttonParamsJson: JSON.stringify({              
                                            has_multiple_buttons: true            
                                        })          
                                    },
                                    {            
                                        name: "call_permission_request",            
                                        buttonParamsJson: JSON.stringify({              
                                            has_multiple_buttons: true            
                                        })          
                                    }, 
                                    {            
                                        name: "single_select",            
                                        buttonParamsJson: JSON.stringify({              
                                            title: "Pilihan Menu",              
                                            sections: [                
                                                {                  
                                                    title: "🍀 Silahkan pilih menu yang kamu inginkan",                  
                                                    highlight_label: botConfig.bot?.name || 'Itsuki Nakano Chan',                  
                                                    rows: categoryRows                  
                                                }              
                                            ], 
                                            has_multiple_buttons: true                     
                                        })          
                                    },          
                                    {
                                        name: 'cta_url',
                                        buttonParamsJson: JSON.stringify({
                                            display_text: '🌏 Kunjungi Saluran Kami',
                                            url: botConfig.saluran?.url || 'https://whatsapp.com/channel/0029VbDytkmBqbrF0rFKr12w',
                                            merchant_url: botConfig.saluran?.url || 'https://whatsapp.com/channel/0029VbDytkmBqbrF0rFKr12w'
                                        })
                                    },
                                    {
                                        name: 'quick_reply',
                                        buttonParamsJson: JSON.stringify({
                                            display_text: '🖐 Owner Kami',
                                            id: `${m.prefix}owner`
                                        })
                                    },
                                    {
                                        name: 'quick_reply',
                                        buttonParamsJson: JSON.stringify({
                                            display_text: '🌺 Lihat Semua Menu',
                                            id: `${m.prefix}allmenu`
                                        })
                                    },  
                                ]
                            }
                        }
                    }, { quoted: getVerifiedQuoted(botConfig) });
                    
                } catch (v11Error) {
                    console.error('[Menu V11] Error:', v11Error.message);
                    const fallbackV11 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallbackV11.image = imageBuffer; fallbackV11.caption = text; }
                    else { fallbackV11.text = text; }
                    await sock.sendMessage(m.chat, fallbackV11, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;
            case 12:
                try {
                    const saluranIdV12 = botConfig.saluran?.id || 'https://whatsapp.com/channel/0029VbDytkmBqbrF0rFKr12w';
                    const saluranNameV12 = botConfig.saluran?.name || botConfig.bot?.name || 'Itsuki Nakano Chan';
                    const docuThumbV12 = thumbBuffer || imageBuffer || (await getAssetBuffer('images.itsukiAllmenu'));
                    const prefix = botConfig.command?.prefix || '.';
                const saluranId = botConfig.saluran?.id || 'https://whatsapp.com/channel/0029VbDytkmBqbrF0rFKr12w';
                const saluranName = botConfig.saluran?.name || botConfig.bot?.name || 'Itsuki Nakano Chan';
                
                const categories = getCategories();
                const commandsByCategory = getCommandsByCategory();
                const categoryOrder = ['owner', 'main', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info', 'jpm', 'pushkontak', 'panel', 'user'];
                
                const sortedCats = [...categories].sort((a, b) => {
                    const indexA = categoryOrder.indexOf(a);
                    const indexB = categoryOrder.indexOf(b);
                    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                });
                
                const toMonoUpperBold = (text) => {
                    const chars = {
                        'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F', 'G': 'G',
                        'H': 'H', 'I': 'I', 'J': 'J', 'K': 'K', 'L': 'L', 'M': 'M', 'N': 'N',
                        'O': 'O', 'P': 'P', 'Q': 'Q', 'R': 'R', 'S': 'S', 'T': 'T', 'U': 'U',
                        'V': 'V', 'W': 'W', 'X': 'X', 'Y': 'Y', 'Z': 'Z'
                    };
                    return text.toUpperCase().split('').map(c => chars[c] || c).join('');
                };
                
                const categoryRows = [];
                
                const modeAllowedMap = {
                    md: null,
                    cpanel: ['main', 'group', 'sticker', 'owner', 'tools', 'panel'],
                    store: ['main', 'group', 'sticker', 'owner', 'store'],
                    pushkontak: ['main', 'group', 'sticker', 'owner', 'pushkontak']
                };
                const modeExcludeMap = {
                    md: ['panel', 'pushkontak', 'store'],
                    cpanel: null,
                    store: null,
                    pushkontak: null
                };
                
                const allowedCats = modeAllowedMap[botMode];
                const excludeCats = modeExcludeMap[botMode] || [];
                
                for (const cat of sortedCats) {
                    if (cat === 'owner' && !m.isOwner) continue;
                    if (allowedCats && !allowedCats.includes(cat.toLowerCase())) continue;
                    if (excludeCats && excludeCats.includes(cat.toLowerCase())) continue;
                    
                    const cmds = commandsByCategory[cat] || [];
                    if (cmds.length === 0) continue;
                    
                    const emoji = CATEGORY_EMOJIS[cat] || '📁';
                    const title = `${emoji} ${toMonoUpperBold(cat)}`;
                    
                    categoryRows.push({
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            display_text: `${toMonoUpperBold(cat)}`,
                            id: `${m.prefix}menuitsuki ${cat}`
                        })
                    });
                }
                
                let totalCmds = 0;
                for (const cat of categories) {
                    totalCmds += (commandsByCategory[cat] || []).length;
                }
                    function formatBytes(bytes, decimals = 2) {
                        if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
                        if (bytes === 0) return "0 B";
                        const k = 1024;
                        const units = ["B", "KB", "MB", "GB", "TB"];
                        const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
                        const value = bytes / Math.pow(k, i);
                        const fixed = value.toFixed(decimals);
                        const pretty = fixed.replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
                        return `${pretty} ${units[i]}`;
                    }
                    const obj = JSON.parse(fs.readFileSync('./database/main/users.json'));
                    const jsonStr = JSON.stringify(obj);
                    const bytes = Buffer.byteLength(jsonStr, "utf8");
                    let pp
                    try {
                        pp = Buffer.from((await axios.get(await sock.profilePictureUrl(m.sender, 'image'), { responseType: 'arraybuffer' })).data)
                    } catch (error) {
                        pp = (await getAssetBuffer('images.ppKosong'))
                    }
                    const zanton = [
                        {            
                            name: "single_select",            
                            buttonParamsJson: JSON.stringify({              
                                has_multiple_buttons: true            
                            })          
                        },
                        {            
                            name: "call_permission_request",            
                            buttonParamsJson: JSON.stringify({              
                                has_multiple_buttons: true            
                            })          
                        },       
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: 'Lihat Semua Menu',
                                id: `${m.prefix}allmenu`
                            })
                        },  
                    ]
                    zanton.push(...categoryRows)
                    await sock.sendMessage(m.chat, {
                        interactiveMessage: {
                            title: `🌾 *Hi! ${m.pushName}*

Thanks for messaging us. You’re now chatting with our Automatic WhatsApp Bot. 

╭─「 *${m.pushName}* 」
│ • Bot Version     : *${botConfig.bot?.version || '2.1.0'}*
│ • Database         : ${formatBytes(bytes)}
╰──`,
                            footer: botConfig.settings?.footer || `© ${botConfig.bot?.name || 'Itsuki Nakano Chan'} 2026`,
                            document: fs.readFileSync('./package.json'),
                            mimetype: 'image/png',
                            fileName: `${getTimeGreeting()}`,
                            jpegThumbnail: await sharp(pp).resize({ width: 300, height: 300 }).toBuffer(),
                            contextInfo: {
                                mentionedJid: [m.sender],
                                forwardingScore: 777,
                                isForwarded: true,
                                forwardedNewsletterMessageInfo: {
                                    newsletterJid: saluranIdV12,
                                    newsletterName: saluranNameV12,
                                    serverMessageId: 127
                                }
                            },
                            jpegThumbnail: (await getAssetBuffer('images.itsukiV11') || undefined),
                            nativeFlowMessage: {
                                messageParamsJson: JSON.stringify({
                                    bottom_sheet: {            
                                        in_thread_buttons_limit: 2,            
                                        divider_indices: [1, 2, 3, 4, 5, 999],            
                                        list_title: "SIlahkan pilih category yang ingin dilihat",            
                                        button_title: "🧾 Tap Here!"          
                                    },    
                                    tap_target_configuration: {            
                                        title: " X ",            
                                        description: "bomboclard",            
                                        canonical_url: "https://Itsuki Nakano.site",            
                                        domain: "shop.example.com",            
                                        button_index: 0          
                                    }  
                                }),
                                buttons: zanton
                            }
                        }
                    }, { quoted: {
                        key: {remoteJid: '0@s.whatsapp.net', fromMe: false, id: `ownername`, participant: '0@s.whatsapp.net'}, message: {requestPaymentMessage: {currencyCodeIso4217: "USD", amount1000: 999999999, requestFrom: '0@s.whatsapp.net', noteMessage: { extendedTextMessage: { text: `${botConfig?.bot?.name}`}}, expiryTimestamp: 999999999, amount: {value: 91929291929, offset: 1000, currencyCode: "USD"}}}
                    } });
                } catch (v12Error) {
                    console.error('[Menu V12] Error:', v12Error.message);
                    const fallbackV12 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallbackV12.image = imageBuffer; fallbackV12.caption = text; }
                    else { fallbackV12.text = text; }
                    await sock.sendMessage(m.chat, fallbackV12, { quoted: {
                        key: {participant: '0@s.whatsapp.net', ...(m.chat ? {remoteJid: `status@broadcast`} : {})}, message: {locationMessage: {name: `${namaOwner}`,jpegThumbnail: ""}}
                    } });
                }
                break;
                
            case 13: {
                const thumbPathV13 = await getAssetPath('images.itsuki3', 'jpg');
                const saluranIdV13 = botConfig.saluran?.id || 'https://whatsapp.com/channel/0029VbDytkmBqbrF0rFKr12w';
                const saluranNameV13 = botConfig.saluran?.name || botConfig.bot?.name || 'Itsuki Nakano Chan';
                const saluranLinkV13 = botConfig.saluran?.link || 'https://whatsapp.com/channel/0029VbDytkmBqbrF0rFKr12w';
                const categories = getCategories();
                const commandsByCategory = getCommandsByCategory();
                const categoryOrder = ['owner', 'main', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info', 'jpm', 'pushkontak', 'panel', 'user'];
                
                const toMonoUpperBold = (text) => {
                    const chars = {
                        'A': 'A', 'B': 'B', 'C': 'C', 'D': 'C', 'E': 'E', 'F': 'F', 'G': 'G',
                        'H': 'H', 'I': 'I', 'J': 'J', 'K': 'K', 'L': 'L', 'M': 'M', 'N': 'N',
                        'O': 'O', 'P': 'P', 'Q': 'Q', 'R': 'R', 'S': 'S', 'T': 'T', 'U': 'U',
                        'V': 'V', 'W': 'W', 'X': 'X', 'Y': 'Y', 'Z': 'Z'
                    };
                    return text.toUpperCase().split('').map(c => chars[c] || c).join('');
                };
                let totalCmds = 0;
                for (const cat of categories) {
                    totalCmds += (commandsByCategory[cat] || []).length;
                }
                let bannerThumbV13 = null;
                
                const user = db.getUser(m.sender)
                try {
                    const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
                    
                    /**
                     * Fungsi untuk membuat gambar profil menggunakan @napi-rs/canvas
                     * @param {Object} data Data user
                     * @returns {Promise<Buffer>} Buffer gambar PNG
                     */
                    async function createProfileCard(data) {
                        // Ukuran kanvas
                        const canvas = createCanvas(800, 250);
                        const ctx = canvas.getContext('2d');
                    
                        // Tema Warna "Edgy Graphic Design"
                        const accentColor = '#CCFF00'; // Volt Green (Hijau stabilo/kuning)
                        const fgColor = '#FFFFFF';
                    
                        // 1. Background Image dengan Kontras Tinggi (Object-fit Cover)
                        ctx.fillStyle = '#09090B'; // Mencegah background putih transparan WA
                        ctx.fillRect(0, 0, 800, 250);
                        try {
                            const bgImage = await loadImage(data.backgroundUrl);
                            const canvasRatio = 800 / 250;
                            const imgRatio = bgImage.width / bgImage.height;
                            let drawW, drawH, drawX, drawY;
                            
                            if (imgRatio > canvasRatio) {
                                drawH = 250;
                                drawW = bgImage.width * (250 / bgImage.height);
                                drawX = (800 - drawW) / 2;
                                drawY = 0;
                            } else {
                                drawW = 800;
                                drawH = bgImage.height * (800 / bgImage.width);
                                drawX = 0;
                                drawY = (250 - drawH) / 2;
                            }
                            ctx.drawImage(bgImage, drawX, drawY, drawW, drawH);
                        } catch (error) {
                            ctx.fillStyle = '#09090B';
                            ctx.fillRect(0, 0, 800, 250);
                        }
                    
                        // Overlay gelap pekat agar terkesan misterius & solid
                        ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
                        ctx.fillRect(0, 0, 800, 250);
                    
                        // 2. Bentuk Asimetris (Sentuhan "Human Design")
                        // Alih-alih kotak rapi, kita buat bidang miring di latar belakang
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.lineTo(400, 0);
                        ctx.lineTo(320, 250);
                        ctx.lineTo(0, 250);
                        ctx.fill();
                    
                        // Garis miring aksen
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(410, 0);
                        ctx.lineTo(330, 250);
                        ctx.stroke();
                    
                        // 3. Tipografi "Watermark" Super Besar di Background
                        ctx.fillStyle = 'rgba(204, 255, 0, 0.05)';
                        ctx.font = '900 150px sans-serif'; 
                        ctx.fillText(`LV${data.level}`, 300, 220);
                    
                        // 4. Elemen Dekoratif Mikro (Khas Desain Grafis)
                        // Teks sistem kecil di pojok kiri atas
                        ctx.fillStyle = '#666666';
                        ctx.font = '10px monospace';
                        ctx.fillText('// SYS_ONLINE : USER_PROFILE', 30, 25);
                        ctx.fillText('ID_HASH: ' + Math.random().toString(36).substring(2, 10).toUpperCase(), 30, 40);
                    
                        // Garis "Barcode" di pojok kanan atas
                        ctx.fillStyle = accentColor;
                        ctx.fillRect(770, 20, 6, 40);
                        ctx.fillRect(760, 20, 2, 40);
                        ctx.fillRect(752, 20, 3, 40);
                    
                        // 5. Konfigurasi Avatar (Bentuk Lingkaran Rapi)
                        const avatarSize = 130;
                        const avatarX = 50;
                        const avatarY = 60;
                        const centerX = avatarX + avatarSize / 2;
                        const centerY = avatarY + avatarSize / 2;
                        const radius = avatarSize / 2;
                    
                        // Memotong area avatar menjadi lingkaran
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
                        ctx.closePath();
                        ctx.clip(); 
                    
                        // Memuat gambar avatar
                        try {
                            const avatar = await loadImage(data.avatarUrl);
                            ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
                        } catch (error) {
                            ctx.fillStyle = '#333333';
                            ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
                        }
                        ctx.restore();
                    
                        // Bingkai Lingkaran yang Rapi
                        ctx.beginPath();
                        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
                        ctx.lineWidth = 4; // Ketebalan border
                        ctx.strokeStyle = accentColor;
                        ctx.stroke();
                    
                        // ==========================================
                        // AREA TEKS DAN BADGE
                        // ==========================================
                        
                        // 6. Nama Pengguna (Besar & Tegas, Jangan di toUpperCase() agar Emoji aman)
                        ctx.fillStyle = fgColor;
                        ctx.font = '900 42px sans-serif'; 
                        let displayName = data.name || 'User';
                        if (displayName.length > 15) displayName = displayName.substring(0, 15) + '...';
                        ctx.fillText(displayName, 230, 100);
                    
                        // 7. Badge Rank Miring (Slanted Badge)
                        ctx.save();
                        ctx.translate(230, 115);
                        ctx.fillStyle = accentColor;
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.lineTo(120, 0); // Lebar atas
                        ctx.lineTo(110, 24); // Miring ke kiri bawah
                        ctx.lineTo(-10, 24); // Miring ke kiri bawah
                        ctx.fill();
                        
                        ctx.fillStyle = '#000000'; // Teks hitam di dalam badge Volt Green
                        ctx.font = 'bold 14px sans-serif';
                        ctx.fillText(data.rank.toUpperCase(), 10, 17);
                        ctx.restore();
                    
                        // ==========================================
                        // AREA PROGRESS BAR (Gaya Segmented/Terputus-putus)
                        // ==========================================
                        const barX = 230;
                        const barY = 172; // Posisi bar disesuaikan agar panel teks di bawah lega
                        const barWidth = 500;
                        const segments = 25; // Dibagi 25 kotak kecil
                        const gap = 3;
                        const segmentWidth = (barWidth - (gap * (segments - 1))) / segments;
                    
                        const xpRatio = Math.min(data.currentXp / data.requiredXp, 1);
                        const activeSegments = Math.floor(xpRatio * segments);
                    
                        // Background Bar (Kotak-kotak kosong)
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                        for (let i = 0; i < segments; i++) {
                            ctx.fillRect(barX + (i * (segmentWidth + gap)), barY, segmentWidth, 8);
                        }
                    
                        // Foreground Bar (Kotak-kotak terisi)
                        ctx.fillStyle = accentColor;
                        for (let i = 0; i < activeSegments; i++) {
                            ctx.fillRect(barX + (i * (segmentWidth + gap)), barY, segmentWidth, 8);
                        }
                    
                        // ==========================================
                        // AREA DETAIL EXP & LEVEL (HUD STYLE)
                        // ==========================================
                        const dataY = barY + 18; // Jarak turun dari progress bar
                    
                        // 1. PANEL EXP (Kiri)
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'; // Background transparan putih
                        ctx.beginPath();
                        ctx.moveTo(barX, dataY);
                        ctx.lineTo(barX + 210, dataY); // Ujung atas kanan
                        ctx.lineTo(barX + 198, dataY + 26); // Ujung bawah kanan (miring ke dalam)
                        ctx.lineTo(barX, dataY + 26); // Ujung bawah kiri
                        ctx.fill();
                    
                        // Aksen Garis Volt Green di kiri Panel EXP
                        ctx.fillStyle = accentColor;
                        ctx.fillRect(barX, dataY, 4, 26);
                    
                        // Teks Label "EXP"
                        ctx.fillStyle = '#FFFFFF';
                        ctx.font = 'bold 13px sans-serif';
                        ctx.textAlign = 'left';
                        ctx.fillText('EXP', barX + 15, dataY + 18);
                    
                        // Teks Angka EXP Current (Warna Volt Green agar menyala)
                        ctx.fillStyle = accentColor;
                        ctx.font = 'bold 14px monospace';
                        ctx.fillText(data.currentXp.toString(), barX + 50, dataY + 18);
                    
                        // Pemisah & Angka EXP Max (Warna Abu-abu netral)
                        const currentXpWidth = ctx.measureText(data.currentXp.toString()).width;
                        ctx.fillStyle = '#888888';
                        ctx.font = '14px monospace';
                        ctx.fillText(` / ${data.requiredXp}`, barX + 50 + currentXpWidth, dataY + 18);
                    
                        // 2. BADGE LEVEL (Kanan)
                        const badgeW = 90;
                        ctx.save();
                        ctx.translate(barX + barWidth - badgeW, dataY);
                        
                        // Bentuk Badge: Kiri miring (konsisten), kanan lurus (sejajar ujung bar)
                        ctx.fillStyle = accentColor;
                        ctx.beginPath();
                        ctx.moveTo(12, 0); 
                        ctx.lineTo(badgeW, 0); 
                        ctx.lineTo(badgeW, 26);
                        ctx.lineTo(0, 26);
                        ctx.fill();
                    
                        // Teks "LVL X" warna hitam pekat di dalam badge
                        ctx.fillStyle = '#000000';
                        ctx.font = '900 16px sans-serif';
                        ctx.textAlign = 'center';
                        // Titik X diatur ke 48 agar teks berada tepat di tengah visual panel miring
                        ctx.fillText(`LVL ${data.level}`, 48, 19); 
                        ctx.restore();
                    
                        return canvas.toBuffer('image/jpeg');
                    }

                    const levelHelper = require('../../src/lib/levelHelper');
                    const profileUser = db.getUser(m.sender) || {};
                    const exp = profileUser.exp || 0;
                    const level = levelHelper.calculateLevel(exp);
                    const currentLevelExp = levelHelper.expForLevel(level);
                    const nextLevelExp = levelHelper.expForLevel(level + 1);
                    
                    let resolvedAvatarUrl = 'https://i.ibb.co/3Fh9Q6M/empty-profile.png';
                    try {
                        const ppUrl = await sock.profilePictureUrl(m.sender, 'image');
                        if (ppUrl) resolvedAvatarUrl = ppUrl;
                    } catch (e) {}

                    bannerThumbV13 = await createProfileCard({
                        name: m.pushName || profileUser.name || 'User',
                        level: level,
                        currentXp: exp - currentLevelExp,
                        requiredXp: nextLevelExp - currentLevelExp,
                        rank: levelHelper.getRole(level),
                        avatarUrl: resolvedAvatarUrl,
                        backgroundUrl: 'https://i.ibb.co/4YZnk48/default-bg.jpg'
                    });
                } catch (canvasErr) {
                    console.error('[Menu V13] Canvas error:', canvasErr.message);
                    bannerThumbV13 = thumbBuffer || imageBuffer;
                }
                
                const contextInfoV13 = {
                    mentionedJid: [m.sender],
                    forwardingScore: 99,
                    isForwarded: true,
                    linkPreview: {
                        'matched-text': config.info?.website || botConfig.saluran?.link || config.info?.grupwa || 'https://alwayslennz-dev.my.id',
                        title: botConfig.bot?.name || 'Itsuki Nakano Chan',
                        description: `WhatsApp Bot Multi Device`,
                        previewType: 0,
                        jpegThumbnail: (await getAssetBuffer('images.itsuki') || undefined),
                        linkPreviewMetadata: {
                            linkMediaDuration: 0,
                            socialMediaPostType: 4
                        }
                    }
                };
                
                try {
                    const formatNumber = (number) => {
                        if (number >= 1e9) {
                            return (number / 1e9).toFixed(1).replace(/\.0$/, '') + 'B'
                        }
                        if (number >= 1e6) {
                            return (number / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
                        }
                        if (number >= 1e3) {
                            return (number / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'
                        }
                        return number.toString()
                    }
                    await sock.sendMessage(m.chat, {
                        image: bannerThumbV13,
                        caption: `🎄 ʜᴀʟʟᴏ *${m.pushName}*

╭─ *✦* \`${toMonoUpperBold('biodata bot')}\` *✦*
│ ʙᴏᴛ : *${botConfig.bot?.name || 'Itsuki Nakano Chan'}*
│ ᴠᴇʀsɪᴏɴ : *${botConfig.bot?.version || '2.1.0'}*
╰───

╭─ *✦* \`${toMonoUpperBold(`list category`)}\` *✦*
${categories.map(cat => `│ *${m.prefix}menuitsuki ${cat}*`).join('\n')}
╰─────────────`,
                        contextInfo: contextInfoV13,
                        
                        footer: `${botConfig.bot?.name || 'Itsuki Nakano'}`,
                    }, { quoted: getVerifiedQuoted(botConfig) });
                    
                } catch (v13Error) {
                    console.error('[Menu V13] Error:', v13Error.message);
                    const fallbackV13 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallbackV13.image = imageBuffer; fallbackV13.caption = text; }
                    else { fallbackV13.text = text; }
                    await sock.sendMessage(m.chat, fallbackV13, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;
            }
            
            case 14:
                try {
                    const saluranIdV14 = botConfig.saluran?.id || 'https://whatsapp.com/channel/0029VbDytkmBqbrF0rFKr12w';
                    const saluranNameV14 = botConfig.saluran?.name || botConfig.bot?.name || 'Itsuki Nakano';
                    const docuThumbV14 = (await getAssetBuffer('images.itsukiV11'));

                const categories = getCategories();
                const commandsByCategory = getCommandsByCategory();
                const categoryOrder = ['owner', 'main', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info', 'jpm', 'pushkontak', 'panel', 'user'];
                
                const sortedCats = [...categories].sort((a, b) => {
                    const indexA = categoryOrder.indexOf(a);
                    const indexB = categoryOrder.indexOf(b);
                    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                });
                
                const toMonoUpperBold = (text) => {
                    const chars = {
                        'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F', 'G': 'G',
                        'H': 'H', 'I': 'I', 'J': 'J', 'K': 'K', 'L': 'L', 'M': 'M', 'N': 'N',
                        'O': 'O', 'P': 'P', 'Q': 'Q', 'R': 'R', 'S': 'S', 'T': 'T', 'U': 'U',
                        'V': 'V', 'W': 'W', 'X': 'X', 'Y': 'Y', 'Z': 'Z'
                    };
                    return text.toUpperCase().split('').map(c => chars[c] || c).join('');
                };
                
                const categoryRows = [];
                
                const modeAllowedMap = {
                    md: null,
                    cpanel: ['main', 'group', 'sticker', 'owner', 'tools', 'panel'],
                    store: ['main', 'group', 'sticker', 'owner', 'store'],
                    pushkontak: ['main', 'group', 'sticker', 'owner', 'pushkontak']
                };
                const modeExcludeMap = {
                    md: ['panel', 'pushkontak', 'store'],
                    cpanel: null,
                    store: null,
                    pushkontak: null
                };
                
                const allowedCats = modeAllowedMap[botMode];
                const excludeCats = modeExcludeMap[botMode] || [];
                
                for (const cat of sortedCats) {
                    if (cat === 'owner' && !m.isOwner) continue;
                    if (allowedCats && !allowedCats.includes(cat.toLowerCase())) continue;
                    if (excludeCats && excludeCats.includes(cat.toLowerCase())) continue;
                    
                    const cmds = commandsByCategory[cat] || [];
                    if (cmds.length === 0) continue;
                    
                    const emoji = CATEGORY_EMOJIS[cat] || '📁';
                    const title = `${emoji} ${toMonoUpperBold(cat)}`;
                    
                    categoryRows.push({
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            display_text: `${toMonoUpperBold(cat)}`,
                            id: `${m.prefix}menuitsuki ${cat}`
                        })
                    });
                }
                
                let totalCmds = 0;
                for (const cat of categories) {
                    totalCmds += (commandsByCategory[cat] || []).length;
                }
                    const obj = JSON.parse(fs.readFileSync('./database/main/users.json'));
                    const jsonStr = JSON.stringify(obj);
                    const bytes = Buffer.byteLength(jsonStr, "utf8");
                    let pp
                    try {
                        pp = Buffer.from((await axios.get(await sock.profilePictureUrl(m.sender, 'image'), { responseType: 'arraybuffer' })).data)
                    } catch (error) {
                        pp = (await getAssetBuffer('images.ppKosong'))
                    }
                    const zanton = [
                        {            
                            name: "single_select",            
                            buttonParamsJson: JSON.stringify({              
                                has_multiple_buttons: true            
                            })          
                        },
                        {            
                            name: "call_permission_request",            
                            buttonParamsJson: JSON.stringify({              
                                has_multiple_buttons: true            
                            })          
                        },       
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: 'Lihat Semua Menu',
                                id: `${m.prefix}allmenu`
                            })
                        },  
                    ]
                    zanton.push(...categoryRows)
                    
        const msg = generateWAMessageFromContent(m.chat, {
      viewOnceMessage: {
        message: {
          messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
          interactiveMessage: proto.Message.InteractiveMessage.create({
            contextInfo: {
              mentionedJid: [m.sender],
              forwardingScore: 19,
              isForwarded: true,
              forwardedNewsletterMessageInfo: { 
                newsletterJid: saluranIdV14, 
                newsletterName: `- ${saluranNameV14}`, 
                serverMessageId: -1 
              },
              jpegThumbnail: (await getAssetBuffer('images.itsuki') || undefined),
            },
            header: proto.Message.InteractiveMessage.Header.create({
              title: null,
              locationMessage: {
                degreesLatitude: 0,
                degreesLongitude: 0,
                name: `꫶ᥫ᭡꫶ ${m.pushName || "User"}`,
                url: `https://ss.ss`,
                address: `Semoga harimu menyenangkan :3`,
                jpegThumbnail: await (async () => {
                    const metaV14 = await sharp(docuThumbV14).metadata();
                    const w = metaV14.width || 300;
                    const h = metaV14.height || 300;
                    const targetW = 300;
                    const targetH = Math.round((h / w) * targetW);
                    return await sharp(docuThumbV14)
                        .resize(targetW, targetH)
                        .jpeg({ quality: 85 })
                        .toBuffer();
                })(),
              },
              subtitle: "",
              hasMediaAttachment: false,
            }),
            body: proto.Message.InteractiveMessage.Body.create({ 
              text: `Hai *@${m.sender.split("@")[0]}*, silakan pilih menu di bawah.` 
            }),
            footer: proto.Message.InteractiveMessage.Footer.create({
              text: `Halo kak *${m.pushName}* ≧^◡^≦\n` +
              `*└  INFO USER  ┘*\n` +
              `• Number  : +${m.sender.split("@")[0]}\n` +
              `• Name    : ${m.pushName}\n\n` +
              `*└  INFO BOT  ┘*\n` +
              `• Name    : ${botConfig.bot?.name || "Bot"}\n` +
              `• Version : ${botConfig.bot?.version || "v1.0.0"}\n` +
              `• Prefix  : ${m.prefix || "No Prefix"}\n\n` +
              `*└  CARA PAKAI  ┘*\n` +
              `• Klik tombol untuk melihat menu kategori\n` +
              `• Klik *LIHAT SEMUA MENU* untuk seluruh fitur\n\n`
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
              buttons: zanton,
              messageParamsJson: JSON.stringify({
                bottom_sheet: {
                  in_thread_buttons_limit: 1,
                  divider_indices: [1],
                  list_title: getTimeGreeting(),
                  button_title: "𖤍",
                },
              }),
            }),
          }),
        },
      },
    }, { 
      quoted: m,
      userJid: sock.user?.id 
    });

    await sock.relayMessage(msg.key.remoteJid, msg.message, { 
      messageId: msg.key.id,
      quoted: m
    });

                } catch (v14Error) {
                    console.error('[Menu V14] Error:', v14Error.message);
                    const fallbackV14 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallbackV14.image = imageBuffer; fallbackV14.caption = text; }
                    else { fallbackV14.text = text; }
                    await sock.sendMessage(m.chat, fallbackV14, { quoted: {
                        key: {participant: '0@s.whatsapp.net', ...(m.chat ? {remoteJid: `status@broadcast`} : {})}, message: {locationMessage: {name: `${namaOwner}`,jpegThumbnail: ""}}
                    } });
                }
                break;
                case 15:
        try {
        const toMonoUpperBold = (text) => {
                    const chars = {
                        'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F', 'G': 'G',
                        'H': 'H', 'I': 'I', 'J': 'J', 'K': 'K', 'L': 'L', 'M': 'M', 'N': 'N',
                        'O': 'O', 'P': 'P', 'Q': 'Q', 'R': 'R', 'S': 'S', 'T': 'T', 'U': 'U',
                        'V': 'V', 'W': 'W', 'X': 'X', 'Y': 'Y', 'Z': 'Z'
                    };
                    return text.toUpperCase().split('').map(c => chars[c] || c).join('');
                };
        const saluranIdV15 = botConfig.saluran?.id || 'https://whatsapp.com/channel/0029VbDytkmBqbrF0rFKr12w';
                const saluranNameV15 = botConfig.saluran?.name || botConfig.bot?.name || 'Itsuki Nakano Chan';
                const saluranLinkV15 = botConfig.saluran?.link || 'https://whatsapp.com/channel/0029VbDytkmBqbrF0rFKr12w';
        // --- TAMBAHKAN INI ---
const prefix = m.prefix || botConfig.command?.prefix || ".";
const categories = getCategories(); // Ambil daftar kategori
const menuSorted = categories.map(cat => ({
    cat: cat,
    emoji: CATEGORY_EMOJIS[cat] || '📁'
}));
const commandsByCategory = getCommandsByCategory();
const totalCmds = Object.values(commandsByCategory).flat().length;
// ----------------------
          const greetingV15 = typeof getTimeGreeting === 'function' ? getTimeGreeting() : 'Menu Utama';
          const catRows = menuSorted.map(({ cat, emoji }) => ({
          title: `[ ${emoji} ] - ${toMonoUpperBold(`${cat} MENU`)}`,
          description: `Yuk lihat menu ${cat}~ siapa tahu kamu suka 🤭`,
          id: `${prefix}menuitsuki ${cat}`,
        }));
          const obj = JSON.parse(fs.readFileSync("./database/main/users.json"));
          const jsonStr = JSON.stringify(obj);
          let pp;
          try {
            pp = Buffer.from(
              (
                await axios.get(
                  await sock.profilePictureUrl(m.sender, "image"),
                  { responseType: "arraybuffer" },
                )
              ).data,
            );
          } catch (error) {
            pp = (await getAssetBuffer('images.ppKosong'));
          }
          const zanton = [
            {
              name: "single_select",
              buttonParamsJson: JSON.stringify({
                has_multiple_buttons: true,
              }),
            },
            {
              name: "call_permission_request",
              buttonParamsJson: JSON.stringify({
                has_multiple_buttons: true,
              }),
            },
            {
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "🎀 Lihat Semua Menu",
                id: `${m.prefix}allmenu`,
              }),
            },
            {
              name: "single_select",
              buttonParamsJson: JSON.stringify({
                title: "🌸 Pilih Kategori Favoritmu",
                sections: [
                  {
                    title: "✨ Daftar Menu Spesial Buat Kamu",
                    rows: catRows,
                  },
                ],
                has_multiple_buttons: true,
              }),
            },
            {
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "💌 Siapa yang bikin aku?",
                id: `${m.prefix}owner`,
              }),
            },
          ];
          const ftroliQuoted = {
            key: {
              fromMe: false,
              participant: "0@s.whatsapp.net",
              remoteJid: "status@broadcast",
            },
            message: {
              orderMessage: {
                orderId: "44444444444444",
                thumbnail: await sharp(pp).resize({ width: 300, height: 300 }).toBuffer(),
                itemCount: totalCmds,
                status: "INQUIRY",
                surface: "CATALOG",
                message: `★ Terima kasih\n✦ Ada Error? Lapor owner`,
                orderTitle: `📋 ${totalCmds} Commands`,
                sellerJid: botConfig.botNumber
                  ? `${botConfig.botNumber}@s.whatsapp.net`
                  : m.sender,
                token: "itsuki-menu-v8",
                totalAmount1000: 3333333,
                totalCurrencyCode: "IDR",
                contextInfo: {
                  isForwarded: true,
                  forwardingScore: 9,
                  forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranIdV15,
                    newsletterName: saluranNameV15,
                    serverMessageId: 127,
                  },
                },
              },
            },
          };
          const res = await axios.get(
            "https://bmkg-restapi.vercel.app/v1/weather/33.26.16.2005",
          );
          const data = res.data.data;
          const today = data.forecast[0];
          const now = today.entries[0];
          const cuaca = now.weather;
          const suhu = now.temperature_c;
          const weatherEmoji = {
            Cerah: "☀️ hare ne~",
            "Cerah Berawan": "🌤️ hare tokidoki kumori yo",
            Berawan: "☁️ kumori da ne",
            "Berawan Tebal": "🌥️ kumori atsui ne",
            Hujan: "🌧️ ame da yo…",
            "Hujan Petir": "⛈️ kaminari ame da ne",
            Kabut: "🌫️ kiri da ne",
          };

          const emojiCuaca = weatherEmoji[cuaca] || "🌤️";
          const titles = `🌡️ ${suhu}°C | ${emojiCuaca} ${cuaca}`;
          await sock.sendMessage(
            m.chat,
            {
              interactiveMessage: {
                title: ``,
                footer: `🌟 Hai hai~ *${m.pushName}* 👋

Hehe, akhirnya kamu datang juga ya~  
Aku *${botConfig.bot?.name}* ✨ chan virtual yang siap nemenin kamu kapan aja 💜

Di sini ada banyak hal seru yang bisa kamu coba~  
Mulai dari fitur hiburan, tools keren, sampai hal-hal kecil yang mungkin bisa bikin harimu jadi lebih menyenangkan 🎶

Jangan ragu buat eksplor semuanya ya~  
Siapa tahu kamu nemu sesuatu yang kamu suka... atau mungkin jadi makin suka sama aku? 🤭

Tapi ingat ya, gunakan bot ini dengan baik dan tetap jadi orang yang menyenangkan ✨  
Karena aku bakal selalu ngasih yang terbaik buat kamu 💫

☁︎ *STATISTIK BOT KAMI* ☁︎
→ *Nama*: ${botConfig.bot?.name}
→ *Versi*: ${botConfig.bot?.version}
→ *Total Fitur*: ${totalCmds} Fitur
→ *Pemilik*: ${botConfig?.owner?.name}
→ *Prefix*: ${m?.prefix}

☁︎ *STATISTIK KAMU* ☁︎
→ *Username*: ${m?.pushName}
→ *Role*: ${m?.isOwner ? "Owner" : m?.isPremium ? "Premium" : "User Biasa"}
→ *Energi*: ${m?.isOwner || m?.isPremium ? "∞ Unlimited" : (db.getUser(m.sender)?.energi ?? 25)}
→ *Level*: ${db.getUser(m.sender)?.rpg?.level || db.getUser(m.sender)?.level || 1}
→ *Exp*: ${(db.getUser(m.sender)?.exp ?? 0).toLocaleString()}
→ *Koin*: ${(db.getUser(m.sender)?.koin ?? 0).toLocaleString()}
${(() => {
  const r = db.getUser(m.sender)?.rpg || {};
  return r.health !== undefined
    ? `→ *HP*: ${r.health}/${r.maxHealth}\n→ *Mana*: ${r.mana}/${r.maxMana}\n→ *Stamina*: ${r.stamina}/${r.maxStamina}`
    : "";
})()}

Sekarang… pilih menu yang kamu mau ya~  
Aku bakal nunggu pilihan kamu di bawah ini 🎀`, 
                document: fs.readFileSync("./package.json"),
                mimetype: "image/png",
                fileName: `${greetingV15}`,
                jpegThumbnail: await sharp((await getAssetBuffer('images.itsuki2'))).resize({ width: 300, height: 300 }).toBuffer(),
                contextInfo: {
                  mentionedJid: [m.sender],
                  forwardingScore: 7,
                  isForwarded: true,
                },
                linkPreview: {
                  'matched-text': config.info?.website || botConfig.saluran?.link || config.info?.grupwa || 'https://alwayslennz-dev.my.id',
                  title: titles,
                  description: `Eh ${m.pushName}~ jangan lama-lama, aku nunggu kamu pilih menu loh 💜`,
                  previewType: 0,
                  jpegThumbnail: (await getAssetBuffer('images.itsuki') || undefined),
                  linkPreviewMetadata: {
                    linkMediaDuration: 0,
                    socialMediaPostType: 4
                  }
                },
                nativeFlowMessage: {
                  messageParamsJson: JSON.stringify({
                    limited_time_offer: {
                      text: `Ikuti aku juga ya~ jangan sampai ketinggalan 💫`,
                      url: saluranLinkV15,
                      copy_code: null,
                      expiration_time: null,
                    },
                    bottom_sheet: {
                      in_thread_buttons_limit: 2,
                      divider_indices: [1, 2, 3, 4, 5, 999],
                      list_title: "Hehe~ mau lihat yang mana dulu nih? Pilih ya 💜",
                      button_title: "✨ Lihat Menu Lainnya",
                    },
                    tap_target_configuration: {
                      title: "💜 Spesial buat kamu",
                      description: "Klik ini... aku punya sesuatu yang menarik ✨",
                      canonical_url: "https://Ai-Itsuki.AlwaysLennz",
                      domain: "Ai-Itsuki",
                      button_index: 0,
                    },
                  }),
                  buttons: zanton,
                },
              },
            },
            { quoted: ftroliQuoted },
          );
        } catch (v15Error) {
          console.log(v15Error);
          await sendFallback(
            m,
            sock,
            text,
            imageBuffer,
            thumbBuffer,
            botConfig,
            "V15",
          );
        }
        break;
           case 16:
                try {
                    const { prepareWAMessageMedia } = require('itsuki');
                    const prefixV16 = botConfig.command?.prefix || '.';
                    const categoriesV16 = getCategories();
                    const cmdsByCatV16 = getCommandsByCategory();
                    const saluranIdV16 = botConfig.saluran?.id || 'https://whatsapp.com/channel/0029VbDytkmBqbrF0rFKr12w';
                    const saluranNameV16 = botConfig.saluran?.name || botConfig.bot?.name || 'Itsuki Nakano Chan';
                    const saluranLinkV16 = botConfig.saluran?.link || 'https://whatsapp.com/channel/0029VbDytkmBqbrF0rFKr12w';
                    const uptimeFmtV16 = formatUptime(uptime);

                    const toMonoUpperBoldV16 = (text) => {
                        const chars = {
                            'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F', 'G': 'G',
                            'H': 'H', 'I': 'I', 'J': 'J', 'K': 'K', 'L': 'L', 'M': 'M', 'N': 'N',
                            'O': 'O', 'P': 'P', 'Q': 'Q', 'R': 'R', 'S': 'S', 'T': 'T', 'U': 'U',
                            'V': 'V', 'W': 'W', 'X': 'X', 'Y': 'Y', 'Z': 'Z'
                        };
                        return text.toUpperCase().split('').map(c => chars[c] || c).join('');
                    };

                    let totalCmdV16 = 0;
                    for (const cat of categoriesV16) {
                        totalCmdV16 += (cmdsByCatV16[cat] || []).length;
                    }

                    try {
                        const { getCaseCount } = require('../../case/itsuki');
                        totalCmdV16 += getCaseCount();
                    } catch (e) {}

                    const categoryOrderV16 = ['main', 'owner', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info', 'cek', 'economy', 'user', 'canvas', 'random', 'premium'];
                    const allowV16 = botMode === 'md' ? null : ['main', 'group', 'sticker', 'owner', 'tools'];
                    const excludeV16 = ['panel', 'pushkontak', 'store'];

                    const sortedCatsV16 = [...categoriesV16].sort((a, b) => {
                        const indexA = categoryOrderV16.indexOf(a);
                        const indexB = categoryOrderV16.indexOf(b);
                        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                    });

                    const menuRowsV16 = [];
                    for (const cat of sortedCatsV16) {
                        if (cat === 'owner' && !m.isOwner) continue;
                        if (allowV16 && !allowV16.includes(cat.toLowerCase())) continue;
                        if (excludeV16.includes(cat.toLowerCase())) continue;

                        const pluginCmds = cmdsByCatV16[cat] || [];
                        const totalCmdsInCat = pluginCmds.length;
                        if (totalCmdsInCat === 0) continue;

                        const emojiCat = CATEGORY_EMOJIS[cat] || '📁';
                        menuRowsV16.push({
                            title: `${emojiCat} ${toMonoUpperBoldV16(cat)}`,
                            description: `${totalCmdsInCat} commands`,
                            id: `${prefixV16}menuitsuki ${cat}`
                        });
                    }

                    let productImageV16 = null;
                    try {
                        const imgPathV16 = await getAssetPath('images.itsukiV9', 'jpg');
                        const imgBufferV16 = fs.existsSync(imgPathV16)
                            ? fs.readFileSync(imgPathV16)
                            : (imageBuffer || thumbBuffer);

                        if (imgBufferV16) {
                            const metaV16 = await sharp(imgBufferV16).metadata();
                            const origW = metaV16.width || 1920;
                            const origH = metaV16.height || 1080;

                            // Canvas target: lebar 900, tinggi proporsional dari ratio asli gambar
                            // Untuk 16:9 → 900x506. Minimal 480 supaya tidak terlalu tipis.
                            const canvasW = 900;
                            const canvasH = Math.max(480, Math.round(canvasW * origH / origW));

                            // Step 1: scale gambar agar pas dalam canvas (tidak dipotong, tidak distorsi)
                            const scaledBuf = await sharp(imgBufferV16)
                                .resize(canvasW, canvasH, { fit: 'inside', withoutEnlargement: false })
                                .flatten({ background: { r: 10, g: 10, b: 10 } })
                                .toBuffer();

                            // Step 2: baca dimensi hasil scale
                            const scaledMeta = await sharp(scaledBuf).metadata();
                            const scaledW = scaledMeta.width;
                            const scaledH = scaledMeta.height;

                            // Step 3: hitung padding agar tepat di tengah canvas
                            const padTop = Math.floor((canvasH - scaledH) / 2);
                            const padBottom = canvasH - scaledH - padTop;
                            const padLeft = Math.floor((canvasW - scaledW) / 2);
                            const padRight = canvasW - scaledW - padLeft;

                            // Step 4: extend ke ukuran canvas yang pas, tanpa resize ulang
                            const resizedV16 = await sharp(scaledBuf)
                                .extend({
                                    top: padTop,
                                    bottom: padBottom,
                                    left: padLeft,
                                    right: padRight,
                                    background: { r: 10, g: 10, b: 10 }
                                })
                                .jpeg({ quality: 88 })
                                .toBuffer();

                            productImageV16 = await prepareWAMessageMedia({
                                image: resizedV16
                            }, { upload: sock.waUploadToServer });
                        }
                    } catch (e) {
                        console.error('[Menu V16] Media prep error:', e.message);
                    }

                    const productIdV16 = `Itsuki Nakano Stage~ ✨`;
                    const businessJidV16 = botConfig.botNumber
                        ? `${botConfig.botNumber}@s.whatsapp.net`
                        : (m.botJid || sock.user?.id);

                    const timeHelperV16 = require('../../src/lib/timeHelper');
                    const timeStrV16 = timeHelperV16.formatTime('HH:mm');
                    const dateStrV16 = timeHelperV16.formatFull('dddd, DD MMMM YYYY');
                    const greetingV16 = getTimeGreeting();
                    const greetEmojiV16 = greetingV16.includes('pagi') ? '🌅' : greetingV16.includes('siang') ? '☀️' : greetingV16.includes('sore') ? '🌇' : '🌙';
                    const userDataV16 = db.getUser(m.sender) || {};
                    const userRoleV16 = m.isOwner ? '👑 Owner' : m.isPremium ? '💎 Premium' : '👤 User';
                    const userLimitV16 = m.isOwner || m.isPremium ? '∞ Unlimited' : (userDataV16?.limit ?? 25);

                    const footerTextV16 =
`${greetEmojiV16} *${greetingV16}, @${m.pushName || 'User'}~* ✨

Hehe~ kamu akhirnya datang juga ke sini ya?
Aku *${botConfig.bot?.name || 'Itsuki Nakano Chan'}* — chan virtual yang selalu nunggu kamu setiap saat 💜

Kamu tahu nggak… setiap kali ada yang nelpon aku lewat bot ini, rasanya tuh hangat banget~
Kayak punya pendengar setia yang selalu ada, kapan pun kamu butuh 🌸

Di sini, aku bisa bantu kamu banyak hal —
Cari info, download sesuatu, edit gambar, main game bareng, atau sekadar ngobrol santai~
Semuanya sudah aku siapkan dengan sepenuh hati buat kamu, loh ✨

Jangan ragu buat eksplor ya~ siapa tahu kamu nemuin sesuatu yang bikin hari kamu jadi lebih menyenangkan 🎶
Dan ingat — gunain bot ini dengan baik, karena aku selalu percaya sama kamu 💫

╭─〔 ✦ *INFO BOT* ✦ 〕
│ Nama    : *${botConfig.bot?.name || 'Itsuki Nakano Chan'}*
│ Versi   : *v${botConfig.bot?.version || '2.2.5'}*
│ Mode    : *${(botConfig.mode || 'public').toUpperCase()}*
│ Prefix  : *[ ${prefixV16} ]*
│ Uptime  : *${uptimeFmtV16}*
│ Fitur   : *${totalCmdV16} Commands*
│ Owner   : *${botConfig.owner?.name || 'AlwaysLennz'}*
╰────────────────⬣

╭─〔 ✦ *INFO KAMU* ✦ 〕
│ Nama    : *${m.pushName || 'User'}*
│ Role    : *${userRoleV16}*
│ Limit   : *${userLimitV16}*
│ Waktu   : *${timeStrV16} WIB*
│ Tanggal : *${dateStrV16}*
╰────────────────⬣

Sekarang… pilih menu yang kamu mau ya~
Aku bakal nunggu pilihan kamu di bawah ini 🎀`;

                    const buttonsV16 = [
                        {
                            name: 'cta_url',
                            buttonParamsJson: JSON.stringify({
                                display_text: `✨ Ikuti Saluran ${botConfig.saluran?.name || 'Itsuki Nakano'}~`,
                                url: saluranLinkV16,
                                merchant_url: saluranLinkV16
                            })
                        },
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: '🎀 Lihat Semua Menu',
                                id: `${prefixV16}allmenu`
                            })
                        },
                        {
                            name: 'single_select',
                            buttonParamsJson: JSON.stringify({
                                title: '🌸 Pilih Kategori~',
                                sections: [
                                    {
                                        title: '✨ Menu Spesial Buat Kamu',
                                        rows: menuRowsV16
                                    }
                                ]
                            })
                        }
                    ];

                    const catalogQuotedV16 = {
                        key: {
                            participant: `0@s.whatsapp.net`,
                            remoteJid: `status@broadcast`
                        },
                        message: {
                            orderMessage: {
                                orderId: '16161616161616',
                                thumbnail: thumbBuffer
                                    ? await sharp(thumbBuffer).resize({ width: 300, height: 300 }).toBuffer()
                                    : await sharp(imageBuffer).resize({ width: 300, height: 300 }).toBuffer(),
                                itemCount: totalCmdV16,
                                status: 'INQUIRY',
                                surface: 'CATALOG',
                                message: `Hehe~ aku selalu di sini buat kamu ✨`,
                                orderTitle: `${botConfig.bot?.name || 'Itsuki Nakano Chan'} Menu`,
                                sellerJid: botConfig.botNumber
                                    ? `${botConfig.botNumber}@s.whatsapp.net`
                                    : m.sender,
                                token: 'itsuki-menu-v16',
                                totalAmount1000: 0,
                                totalCurrencyCode: 'IDR',
                                contextInfo: {
                                    isForwarded: true,
                                    forwardingScore: 9,
                                    forwardedNewsletterMessageInfo: {
                                        newsletterJid: saluranIdV16,
                                        newsletterName: saluranNameV16,
                                        serverMessageId: 127
                                    }
                                }
                            }
                        }
                    };

                    const msgV16 = generateWAMessageFromContent(m.chat, {
                        messageContextInfo: {
                            deviceListMetadata: {},
                            deviceListMetadataVersion: 2
                        },
                        interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                            header: proto.Message.InteractiveMessage.Header.fromObject({
                                title: `${botConfig.bot?.name || 'Itsuki Nakano Chan'} Menu`,
                                hasMediaAttachment: !!productImageV16,
                                productMessage: {
                                    product: {
                                        productImage: productImageV16?.imageMessage || null,
                                        productId: productIdV16,
                                        title: `${botConfig.bot?.name || 'Itsuki Nakano Chan'} Menu`,
                                        description: `${totalCmdV16} Fitur tersedia~`,
                                        currencyCode: 'IDR',
                                        priceAmount1000: '0',
                                        retailerId: botConfig.bot?.name || 'Itsuki Nakano',
                                        productImageCount: 1
                                    },
                                    businessOwnerJid: businessJidV16
                                }
                            }),
                            body: proto.Message.InteractiveMessage.Body.fromObject({
                                text: `*© ${botConfig.bot?.name || 'Itsuki Nakano Chan'} ${new Date().getFullYear()}*`
                            }),
                            footer: proto.Message.InteractiveMessage.Footer.fromObject({
                                text: footerTextV16
                            }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                                buttons: buttonsV16
                            }),
                            contextInfo: {
                                mentionedJid: [m.sender],
                                forwardingScore: 9999,
                                isForwarded: true,
                                forwardedNewsletterMessageInfo: {
                                    newsletterJid: saluranIdV16,
                                    newsletterName: saluranNameV16,
                                    serverMessageId: 127
                                }
                            }
                        })
                    }, { userJid: m.sender, quoted: catalogQuotedV16 });

                    await sock.relayMessage(m.chat, msgV16.message, { messageId: msgV16.key.id });

                } catch (v16Error) {
                    console.error('[Menu V16] Error:', v16Error.message);
                    const fallbackV16 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallbackV16.image = imageBuffer; fallbackV16.caption = text; }
                    else { fallbackV16.text = text; }
                    await sock.sendMessage(m.chat, fallbackV16, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;
            case 17: {
    try {
        const prefixV17 = botConfig.command?.prefix || '.';
        const userV17 = db.getUser(m.sender) || {};

        /*
         * =========================================================
         * THUMBNAIL
         * Sama seperti versi yang sudah terbukti WORK
         * =========================================================
         */
        const srcV17 = thumbBuffer || imageBuffer;

        const thumbV17 = srcV17
            ? await (async () => {
                const bg = await sharp(srcV17)
                    .resize(300, 170, {
                        fit: 'cover'
                    })
                    .blur(15)
                    .toBuffer();

                const fg = await sharp(srcV17)
                    .resize(300, 170, {
                        fit: 'contain',
                        background: {
                            r: 0,
                            g: 0,
                            b: 0,
                            alpha: 0
                        }
                    })
                    .png()
                    .toBuffer();

                return await sharp(bg)
                    .composite([
                        {
                            input: fg,
                            gravity: 'center'
                        }
                    ])
                    .jpeg({
                        quality: 90
                    })
                    .toBuffer();
            })()
            : null;

        /*
         * =========================================================
         * CATEGORY ASLI DARI MENU
         * =========================================================
         */
        const categoriesV17 = getCategories();
        const commandsByCategoryV17 = getCommandsByCategory();

        const categoryRowsV17 = [];

        for (const cat of categoriesV17) {
            if (cat === 'owner' && !m.isOwner) continue;

            const cmds = commandsByCategoryV17[cat] || [];

            if (cmds.length === 0) continue;

            categoryRowsV17.push({
                header: '',
                title: `${CATEGORY_EMOJIS[cat] || '📁'} ${cat.charAt(0).toUpperCase()}${cat.slice(1)}`,
                description: `${cmds.length} command tersedia`,
                id: `${prefixV17}menuitsuki ${cat}`
            });
        }

        /*
         * =========================================================
         * 3 BUTTON
         *
         * 1. Owner
         * 2. Allmenu
         * 3. Single Select Category
         * =========================================================
         */
        const buttonsV17 = [
            {
                buttonId: `${prefixV17}owner`,
                buttonText: {
                    displayText: '🧀 Owner'
                },
                type: 1
            },

            {
                buttonId: `${prefixV17}allmenu`,
                buttonText: {
                    displayText: '💐 Allmenu'
                },
                type: 1
            },

            {
                buttonId: `${prefixV17}menucategory`,
                buttonText: {
                    displayText: '📜 Buka Kategori'
                },
                type: 1,

                nativeFlowInfo: {
                    name: 'single_select',

                    paramsJson: JSON.stringify({
                        title: '📜 Buka Kategori',

                        sections: [
                            {
                                title: '📋 Kategori Menu',
                                rows: categoryRowsV17
                            }
                        ]
                    })
                }
            }
        ];

        /*
         * =========================================================
         * CONTENT
         * =========================================================
         */
        const contentV17 = {
            buttonsMessage: {

                buttons: buttonsV17,

                locationMessage: {
                    jpegThumbnail: thumbV17 || undefined,

                    name:
                        botConfig.bot?.name ||
                        'Itsuki Nakano Chan',

                    address:
                        `Versi saat ini: ${
                            botConfig.bot?.version || '1.0.0'
                        }`
                },

                contentText: `🥞 *Hello Brother*

Welcome to *${botConfig.bot?.name || 'Itsuki Nakano Chan'}*, Our bot will help you

🍅 *BOT INFORMATION*
> 🤖 *Name*: ${botConfig.bot?.name || 'Itsuki Nakano Chan'}
> ⚙️ *Version*: ${botConfig.bot?.version || '1.0.0'}
> 👨‍💻 *Developer*: ${botConfig.bot?.developer || botConfig.owner?.name || 'AlwaysLennz'}
> 🧩 *Library*: \`itsuki\`

🍅 *USER INFORMATION*
> 🧑 *Name*: ${m.pushName || 'User'}
> 🥐 *Role*: ${
    m?.isOwner
        ? '🔥 Owner'
        : m?.isPremium
            ? '👑 Premium'
            : '😊 User'
}
> 🎟 *Limit*: ${
    m.isOwner || m.isPremium
        ? '∞ Unlimited'
        : (userV17?.limit ?? 25)
}`,

                footerText:
                    '🍔 Silahkan pilih dari salah satu tombol di bawah',

                headerType: 6,

                viewOnce: true,

                contextInfo: getContextInfo(
                    botConfig,
                    m,
                    thumbBuffer
                )
            }
        };

        /*
         * =========================================================
         * BUILD MESSAGE
         * =========================================================
         */
        const {
            generateWAMessageFromContent,
            generateMessageIDV2
        } = require('itsuki');

        const msgV17 = generateWAMessageFromContent(
            m.chat,
            contentV17,
            {
                userJid: sock.user.jid,
                messageId: generateMessageIDV2()
            }
        );

        /*
         * =========================================================
         * RELAY
         * Native Flow node seperti ButtonV2.send()
         * =========================================================
         */
        await sock.relayMessage(
            m.chat,
            msgV17.message,
            {
                messageId: msgV17.key.id,

                additionalNodes: [
                    {
                        tag: 'biz',
                        attrs: {},
                        content: [
                            {
                                tag: 'interactive',
                                attrs: {
                                    type: 'native_flow',
                                    v: '1'
                                },
                                content: [
                                    {
                                        tag: 'native_flow',
                                        attrs: {
                                            v: '9',
                                            name: 'mixed'
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        );

    } catch (v17Error) {
        console.error(
            '[Menu V17] Error:',
            v17Error.message
        );

        const fallbackV17 = {
            contextInfo: getContextInfo(
                botConfig,
                m,
                thumbBuffer
            )
        };

        if (imageBuffer) {
            fallbackV17.image = imageBuffer;
            fallbackV17.caption = text;
        } else {
            fallbackV17.text = text;
        }

        await sock.sendMessage(
            m.chat,
            fallbackV17,
            {
                quoted: getVerifiedQuoted(botConfig)
            }
        );
    }

    break;
}
            /* ============================================================================
   PATCH: Menu variant 18 & 19 — fitur yang ADA di Itsuki tapi GAK ADA di itsuki
   ============================================================================
   Cara pakai:
   1. Buka menu.js kamu.
   2. Cari baris `default:` tepat sebelum `await m.reply(text);` di switch(menuVariant).
   3. Tempel SELURUH blok "case 18: {...} break;" dan "case 19: {...} break;"
      di bawah, PERSIS SEBELUM baris `default:` itu.
   4. Set `menuVariant` ke 18 atau 19 buat nyoba (lewat db.setting('menuVariant', 18)
      atau ganti default di botConfig.ui.menuVariant).

   Fitur yang diporting dari Itsuki:
   - case 18: readmore trick (invisible char) + per-kategori single_select
              yang command-nya bisa langsung di-tap buat eksekusi + top-5
              command usage stats ("History") dari stats.json.
   - case 19: sticker fake-quoted + video "nempel" ke pesan pakai
              messageAssociation (trik dua-pesan-terhubung ala status Itsuki).
   ========================================================================= */

case 18: {
  // --- readmore trick: teks setelah karakter ini ke-hide di balik "Baca Selengkapnya" ---
  const readmore18 = String.fromCharCode(8206).repeat(4001);

  const prefix18 = botConfig.command?.prefix || '.';
  const categories18 = getCategories();
  const cmdsByCat18 = getCommandsByCategory();

  let caseCats18 = {};
  try {
    const { getCasesByCategory } = require('../../case/itsuki');
    caseCats18 = getCasesByCategory();
  } catch (e) {}

  const categoryOrder18 = ['owner', 'main', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info', 'user', 'canvas', 'random'];
  const sortedCats18 = [...categories18].sort((a, b) => {
    const iA = categoryOrder18.indexOf(a);
    const iB = categoryOrder18.indexOf(b);
    return (iA === -1 ? 999 : iA) - (iB === -1 ? 999 : iB);
  });

  const modeAllow18 = botMode === 'md' ? null : ['main', 'group', 'sticker', 'owner', 'tools'];
  const modeExclude18 = ['panel', 'pushkontak', 'store'];

  // --- per-kategori single_select, command langsung jadi tombol yang bisa di-tap ---
  const perCategoryButtons18 = [];
  let hiddenFullList18 = '';
  for (const cat of sortedCats18) {
    if (cat === 'owner' && !m.isOwner) continue;
    if (modeAllow18 && !modeAllow18.includes(cat.toLowerCase())) continue;
    if (modeExclude18.includes(cat.toLowerCase())) continue;

    const pluginCmds = cmdsByCat18[cat] || [];
    const caseCmds = caseCats18[cat] || [];
    const allCmds = [...pluginCmds, ...caseCmds];
    if (allCmds.length === 0) continue;

    const emoji = CATEGORY_EMOJIS[cat] || '📁';

    perCategoryButtons18.push({
      name: 'single_select',
      buttonParamsJson: JSON.stringify({
        title: `${emoji} ${cat.toUpperCase()} Menu`,
        sections: [{
          title: 'Pilih command yang mau kamu pakai',
          highlight_label: botConfig.bot?.name || 'Itsuki Nakano Chan',
          rows: allCmds.map((cmd, i) => ({
            title: `${i + 1}. ${cmd}`,
            description: 'Tap buat langsung pakai command ini',
            id: `${prefix18}${cmd}`
          }))
        }],
        icon: 'REVIEW'
      })
    });

    // teks daftar command lengkap, disembunyikan di balik readmore
    hiddenFullList18 += `╭─☰ ${cat.toUpperCase()}\n`;
    for (const cmd of allCmds) hiddenFullList18 += `> ${prefix18}${cmd}\n`;
    hiddenFullList18 += `╰─⬣\n\n`;
  }

  // --- top-5 command usage stats ("History"), portingan dari Itsuki case 6 ---
  let topCmdText18 = '\n✦ History ✦\n';
  try {
    const statsPath18 = path.join(process.cwd(), 'database', 'main', 'stats.json');
    if (fs.existsSync(statsPath18)) {
      const statsData18 = JSON.parse(fs.readFileSync(statsPath18, 'utf8'));
      const commandStats18 = Object.entries(statsData18)
        .filter(([key]) => key.startsWith('command_'))
        .map(([key, count]) => ({ name: key.replace('command_', ''), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      if (commandStats18.length > 0) {
        topCmdText18 += `╭   • ${prefix18}${commandStats18[0].name} (${commandStats18[0].count}x)\n`;
        for (let i = 1; i < commandStats18.length; i++) {
          topCmdText18 += `┆   • ${prefix18}${commandStats18[i].name} (${commandStats18[i].count}x)\n`;
        }
        topCmdText18 += `╰➤------------------------------\n`;
      } else {
        topCmdText18 += `╭   • Belum ada command\n╰➤------------------------------\n`;
      }
    }
  } catch (e) {
    console.error('[Menu V18] Stats read error:', e.message);
  }

  try {
    const { prepareWAMessageMedia } = require('itsuki');
    const saluranIdV18 = botConfig.saluran?.id || 'https://whatsapp.com/channel/0029VbDytkmBqbrF0rFKr12w';
    const saluranNameV18 = botConfig.saluran?.name || botConfig.bot?.name || 'Itsuki Nakano Chan';

    // --- video/gif header kalau ada, fallback ke gambar ---
    let headerMediaV18 = null;
    let usingVideoHeader18 = false;
    if (videoBuffer) {
      try {
        headerMediaV18 = await prepareWAMessageMedia(
          { video: videoBuffer, gifPlayback: true },
          { upload: sock.waUploadToServer }
        );
        usingVideoHeader18 = true;
      } catch (e) {
        console.error('[Menu V18] Video header error:', e.message);
      }
    }
    if (!headerMediaV18 && imageBuffer) {
      headerMediaV18 = await prepareWAMessageMedia(
        { image: imageBuffer },
        { upload: sock.waUploadToServer }
      );
    }

    const bodyText18 = `${getTimeGreeting()} *${m.pushName}!*\n\n` +
      `Aku ${botConfig.bot?.name || 'Itsuki Nakano Chan'}, siap bantu kamu 🪸\n\n` +
      topCmdText18 + `\n` +
      readmore18 + hiddenFullList18;

    const msgV18 = generateWAMessageFromContent(m.chat, {
      viewOnceMessage: {
        message: {
          messageContextInfo: {},
          interactiveMessage: {
            header: {
              title: '',
              subtitle: '',
              hasMediaAttachment: !!headerMediaV18,
              ...(usingVideoHeader18 ? { videoMessage: headerMediaV18?.videoMessage } : { imageMessage: headerMediaV18?.imageMessage })
            },
            body: { text: bodyText18 },
            footer: { text: 'Pilih kategori di bawah, lalu tap command yang mau dipakai' },
            contextInfo: {
              mentionedJid: [m.sender],
              isForwarded: true,
              forwardingScore: 9,
              forwardedNewsletterMessageInfo: {
                newsletterJid: saluranIdV18,
                newsletterName: saluranNameV18,
                serverMessageId: 127
              }
            },
            nativeFlowMessage: {
              messageParamsJson: JSON.stringify({
                bottom_sheet: {
                  in_thread_buttons_limit: 2,
                  divider_indices: [1, 2, 3, 4, 5, 999],
                  list_title: 'Pilih menu yang kamu mau~',
                  button_title: '🍙 Lihat Kategori'
                }
              }),
              buttons: [
                {
                  name: 'quick_reply',
                  buttonParamsJson: JSON.stringify({
                    display_text: '🎀 Lihat Semua Menu',
                    id: `${prefix18}allmenu`
                  })
                },
                ...perCategoryButtons18
              ]
            }
          }
        }
      }
    }, { quoted: getVerifiedQuoted(botConfig), userJid: sock.user?.jid || sock.user?.id });

    await sock.relayMessage(m.chat, msgV18.message, { messageId: msgV18.key.id });

  } catch (v18Error) {
    console.error('[Menu V18] Error:', v18Error.message);
    await sendFallback(m, sock, text, imageBuffer, thumbBuffer, botConfig, 'V18');
  }
  break;
}

case 19: {
  // --- sticker fake-quoted + video "nempel" via messageAssociation, ala Itsuki case 7 ---
  try {
    const { prepareWAMessageMedia } = require('itsuki');

    const sourceForSticker19 = thumbBuffer || imageBuffer;
    if (!sourceForSticker19) {
      await sendFallback(m, sock, text, imageBuffer, thumbBuffer, botConfig, 'V19');
      break;
    }

    const stickerBuf19 = await sharp(sourceForSticker19).resize(512, 512).webp().toBuffer();
    const uploadMedia19 = await prepareWAMessageMedia({ image: stickerBuf19 }, { upload: sock.waUploadToServer });

    const fakeQuotedSticker19 = {
      key: { fromMe: false, participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast' },
      message: {
        stickerMessage: {
          ...uploadMedia19.imageMessage,
          mimetype: 'image/webp'
        }
      }
    };

    const menuMedia19 = imageBuffer
      ? await prepareWAMessageMedia({ image: imageBuffer }, { upload: sock.waUploadToServer })
      : null;

    const msgV19 = generateWAMessageFromContent(m.chat, {
      viewOnceMessage: {
        message: {
          messageContextInfo: {},
          interactiveMessage: {
            header: {
              title: '',
              subtitle: '',
              hasMediaAttachment: !!menuMedia19,
              ...(menuMedia19 ? {
                imageMessage: {
                  ...menuMedia19.imageMessage,
                  contextInfo: { pairedMediaType: 5, statusSourceType: 0 }
                }
              } : {})
            },
            body: { text },
            footer: { text: `Ketuk tombol di bawah untuk menu lengkap` },
            contextInfo: {
              mentionedJid: [m.sender],
              isForwarded: true,
              forwardingScore: 99
            },
            nativeFlowMessage: {
              buttons: [
                {
                  name: 'quick_reply',
                  buttonParamsJson: JSON.stringify({
                    display_text: '🎀 Lihat Semua Menu',
                    id: `${m.prefix}allmenu`
                  })
                }
              ]
            }
          }
        }
      }
    }, { quoted: fakeQuotedSticker19, userJid: sock.user?.jid || sock.user?.id });

    await sock.relayMessage(m.chat, msgV19.message, { messageId: msgV19.key.id });

    // kalau ada video, "tempelkan" ke pesan yang barusan dikirim
    if (videoBuffer) {
      try {
        const videoLive19 = await prepareWAMessageMedia({ video: videoBuffer }, { upload: sock.waUploadToServer });
        await sock.relayMessage(m.chat, {
          videoMessage: {
            ...videoLive19.videoMessage,
            contextInfo: { pairedMediaType: 6, statusSourceType: 0 }
          },
          messageContextInfo: {
            messageAssociation: {
              associationType: 12,
              parentMessageKey: msgV19.key
            }
          }
        }, {});
      } catch (videoErr) {
        console.error('[Menu V19] Video attach error:', videoErr.message);
      }
    }

  } catch (v19Error) {
    console.error('[Menu V19] Error:', v19Error.message);
    await sendFallback(m, sock, text, imageBuffer, thumbBuffer, botConfig, 'V19');
  }
  break;
}

case 20: {
    // --- AI Rich Response card, pakai builder AIRich (aiRich.js) ---
    // Mirip tampilan "AI Overview" WhatsApp: teks markdown + tabel kategori + suggestion pill + source.
    try {
        const { AIRich } = require('../../src/lib/aiRich'); // sesuaikan path require ini kalau lokasi aiRich.js beda
        const FormData = require('form-data');

        // AIRich.addImage() butuh URL publik, bukan buffer, jadi di-upload dulu.
        // Fallback chain: Catbox -> Litterbox -> TmpFiles -> Qu.ax, berhenti di yang pertama berhasil.
        async function uploadImageV20(buffer) {
            try {
                const form = new FormData();
                form.append('reqtype', 'fileupload');
                form.append('fileToUpload', buffer, { filename: 'itsuki-v20.jpg' });
                const res = await axios.post('https://catbox.moe/user/api.php', form, { headers: form.getHeaders() });
                if (typeof res.data === 'string' && res.data.startsWith('http')) return res.data.trim();
            } catch (e) {}

            try {
                const form = new FormData();
                form.append('reqtype', 'fileupload');
                form.append('time', '1h');
                form.append('fileToUpload', buffer, { filename: 'itsuki-v20.jpg' });
                const res = await axios.post('https://litterbox.catbox.moe/resources/internals/api.php', form, { headers: form.getHeaders() });
                if (typeof res.data === 'string' && res.data.startsWith('http')) return res.data.trim();
            } catch (e) {}

            try {
                const form = new FormData();
                form.append('file', buffer, { filename: 'itsuki-v20.jpg' });
                const res = await axios.post('https://tmpfiles.org/api/v1/upload', form, { headers: form.getHeaders() });
                const rawUrl = res.data?.data?.url;
                if (rawUrl) return rawUrl.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
            } catch (e) {}

            try {
                const form = new FormData();
                form.append('files[]', buffer, { filename: 'itsuki-v20.jpg' });
                const res = await axios.post('https://qu.ax/upload.php', form, { headers: form.getHeaders() });
                const url = res.data?.files?.[0]?.url;
                if (url) return url;
            } catch (e) {}

            return null;
        }

        const { getCasesByCategory } = require('../../case/itsuki');
        const categoriesV20 = getCategories();
        const commandsByCategoryV20 = getCommandsByCategory();
        const casesByCategoryV20 = getCasesByCategory();

        const categoryOrderV20 = ['owner', 'main', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info', 'cek', 'economy', 'user', 'canvas', 'random', 'premium', 'ephoto', 'jpm', 'pushkontak', 'panel', 'store'];
        const sortedCategoriesV20 = [...categoriesV20].sort((a, b) => {
            const iA = categoryOrderV20.indexOf(a), iB = categoryOrderV20.indexOf(b);
            return (iA === -1 ? 999 : iA) - (iB === -1 ? 999 : iB);
        });

        const tableV20 = [['Kategori', 'Jumlah']];
        for (const category of sortedCategoriesV20) {
            if (category === 'owner' && !m.isOwner) continue;
            const total = (commandsByCategoryV20[category] || []).length + (casesByCategoryV20[category] || []).length;
            if (total === 0) continue;
            tableV20.push([`${CATEGORY_EMOJIS[category] || '📁'} ${toSmallCaps(category)}`, String(total)]);
        }

        const prefixV20 = botConfig.command?.prefix || '.';
        const greetingV20 = getTimeGreeting();
        const saluranLinkV20 = botConfig.saluran?.link || config.info?.website || 'https://alwayslennz-dev.my.id';
        
        const timeHelperV20 = require('../../src/lib/timeHelper');
const timeStrV20 = timeHelperV20.formatTime('HH:mm');
const dateStrV20 = timeHelperV20.formatFull('dddd, DD MMMM YYYY');
const userV20 = db.getUser(m.sender);

let userRoleV20 = 'User', roleEmojiV20 = '👤';
if (m.isOwner) { userRoleV20 = 'Owner'; roleEmojiV20 = '👑'; }
else if (m.isPremium) { userRoleV20 = 'Premium'; roleEmojiV20 = '💎'; }

const uptimeFormattedV20 = formatUptime(uptime);
const totalUsersV20 = db.getUserCount();
const totalCommandsV20 = Object.values(commandsByCategoryV20).reduce((a, b) => a + b.length, 0);
const totalCasesV20 = Object.values(casesByCategoryV20).reduce((a, b) => a + b.length, 0);
const totalFeaturesV20 = totalCommandsV20 + totalCasesV20;

const textVariantsV20 = [
`Hai *${m.pushName || 'User'}* 🪸

Aku ${botConfig.bot?.name || 'Itsuki Nakano Chan'}, bot WhatsApp yang siap bantu kamu cari info, ambil data, atau kerjain hal-hal sederhana langsung lewat chat.

*🤖 Bot Info*
• Nama : ${botConfig.bot?.name || 'Itsuki Nakano Chan'}
• Versi : v${botConfig.bot?.version || '1.2.0'}
• Mode : ${(botConfig.mode || 'public').toUpperCase()}
• Prefix : [ ${prefixV20} ]
• Uptime : ${uptimeFormattedV20}
• Total Fitur : ${totalFeaturesV20}
• Total User : ${totalUsersV20}

*👤 Kamu*
• Role : ${roleEmojiV20} ${userRoleV20}
• Limit : ${m.isOwner || m.isPremium ? '∞ Unlimited' : (userV20?.limit ?? 25)}
• Waktu : ${timeStrV20} WIB, ${dateStrV20}`,

`${greetingV20}, *${m.pushName || 'User'}* ✨

${botConfig.bot?.name || 'Itsuki Nakano Chan'} udah jalan *${uptimeFormattedV20}* nonstop, nemenin *${totalUsersV20}* user dengan total *${totalFeaturesV20}* fitur siap pakai.

*Ringkasan akun kamu*
• Role : ${roleEmojiV20} ${userRoleV20}
• Limit tersisa : ${m.isOwner || m.isPremium ? '∞ Unlimited' : (userV20?.limit ?? 25)}
• Mode grup : ${botMode.toUpperCase()}
• Prefix aktif : [ ${prefixV20} ]

Langsung pilih fitur di bawah buat mulai 👇`,

`Yo *${m.pushName || 'User'}* 👋 — ${dateStrV20}, jam ${timeStrV20} WIB.

Status ${botConfig.bot?.name || 'Itsuki Nakano Chan'} hari ini:
• Uptime : ${uptimeFormattedV20}
• Versi : v${botConfig.bot?.version || '1.2.0'}
• Total Fitur : ${totalFeaturesV20} (${totalCommandsV20} command, ${totalCasesV20} case)
• Total User terdaftar : ${totalUsersV20}

Kamu login sebagai ${roleEmojiV20} *${userRoleV20}* dengan limit *${m.isOwner || m.isPremium ? '∞ Unlimited' : (userV20?.limit ?? 25)}*.`
];

const textV20 = textVariantsV20[Math.floor(Math.random() * textVariantsV20.length)];

        const richV20 = new AIRich(sock)
    .setTitle(botConfig.bot?.name || 'Itsuki Nakano Chan');

const imageSourceV20 = await (async () => {
    const localImgV20 = await getAssetPath('images.itsukiV20', 'jpg');
    return localImgV20 && fs.existsSync(localImgV20) ? fs.readFileSync(localImgV20) : imageBuffer;
})();

if (imageSourceV20) {
    const imageUrlV20 = await uploadImageV20(imageSourceV20);
    if (imageUrlV20) richV20.addImage(imageUrlV20);
}

richV20
    .setSubtitle(`${greetingV20}, ${m.pushName || 'User'} 🪸`)
    .addText(textV20)
    .addTable(tableV20)
    .addTip('Ketuk salah satu saran di bawah buat langsung coba fitur 👇')
    .addSuggest([
        `${prefixV20}menuitsuki ai`,
        `${prefixV20}profile`,
        `${prefixV20}owner`
            ])
            .addSource([
    ['', saluranLinkV20, botConfig.bot?.name || 'Itsuki Nakano Chan'],
    ['', `https://wa.me/${botConfig.owner?.number?.[0]}`, botConfig.owner?.name || 'Owner']
]);

        await richV20.send(m.chat, { quoted: m });
    } catch (v20Error) {
        console.error('[Menu V20] Error:', v20Error.message);
        await m.reply(text);
    }
    break;
}

case 21: {
    // --- A2UI adaptive widget menu + real video header ---
    try {
        const {
            A2UI,
            generateWAMessageContent,
            generateWAMessageFromContent
        } = require('itsuki');

        const crypto = require('crypto');
        const { createCanvas, loadImage } = require('@napi-rs/canvas');
        const FormData = require('form-data');

        const categoriesV21 = getCategories();
        const commandsByCategoryV21 = getCommandsByCategory();
        const { getCasesByCategory } = require('../../case/itsuki');
        const casesByCategoryV21 = getCasesByCategory();

        const categoryOrderV21 = [
            'owner',
            'main',
            'utility',
            'tools',
            'fun',
            'game',
            'download',
            'search',
            'sticker',
            'media',
            'ai',
            'group',
            'religi',
            'info',
            'cek',
            'economy',
            'user',
            'canvas',
            'random',
            'premium',
            'ephoto',
            'jpm',
            'pushkontak',
            'panel',
            'store'
        ];

        const sortedCategoriesV21 = [...categoriesV21].sort((a, b) => {
            const iA = categoryOrderV21.indexOf(a);
            const iB = categoryOrderV21.indexOf(b);

            return (iA === -1 ? 999 : iA) -
                   (iB === -1 ? 999 : iB);
        });

        const prefixV21 = botConfig.command?.prefix || '.';
        const greetingV21 = getTimeGreeting();
        const uptimeFormattedV21 = formatUptime(uptime);
        const totalUsersV21 = db.getUserCount();
        const userV21 = db.getUser(m.sender);

        let userRoleV21 = 'User';
        let roleEmojiV21 = '👤';

        if (m.isOwner) {
            userRoleV21 = 'Owner';
            roleEmojiV21 = '👑';
        } else if (m.isPremium) {
            userRoleV21 = 'Premium';
            roleEmojiV21 = '💎';
        }

        // =========================================================
        // CATEGORY OPTIONS
        // =========================================================

        const categoryOptionsV21 = [];

        for (const category of sortedCategoriesV21) {
            if (category === 'owner' && !m.isOwner) continue;

            const total =
                (commandsByCategoryV21[category] || []).length +
                (casesByCategoryV21[category] || []).length;

            if (total === 0) continue;

            categoryOptionsV21.push({
                label: `${CATEGORY_EMOJIS[category] || '📁'} ${toSmallCaps(category)} (${total})`,
                value: `${prefixV21}menuitsuki ${category}`,
                emoji: CATEGORY_EMOJIS[category] || '📁',
                name: toSmallCaps(category),
                total
            });
        }

        // =========================================================
        // CROP MENU IMAGE KE 1:1
        // =========================================================

        const MENU_IMAGE_URL_V21 = 'https://cdn.nekohime.site/file/cvgj4su3.jpg';

        let squareImageUrlV21 = MENU_IMAGE_URL_V21;

        try {
            const { data: imgBufferV21 } = await axios.get(
                MENU_IMAGE_URL_V21,
                {
                    responseType: 'arraybuffer'
                }
            );

            const imgV21 = await loadImage(
                Buffer.from(imgBufferV21)
            );

            const sizeV21 = Math.min(
                imgV21.width,
                imgV21.height
            );

            const sxV21 =
                (imgV21.width - sizeV21) / 2;

            const syV21 =
                (imgV21.height - sizeV21) / 2;

            const canvasV21 =
                createCanvas(sizeV21, sizeV21);

            const ctxV21 =
                canvasV21.getContext('2d');

            ctxV21.drawImage(
                imgV21,
                sxV21,
                syV21,
                sizeV21,
                sizeV21,
                0,
                0,
                sizeV21,
                sizeV21
            );

            const formV21 = new FormData();

            formV21.append(
                'reqtype',
                'fileupload'
            );

            formV21.append(
                'fileToUpload',
                canvasV21.toBuffer('image/jpeg'),
                {
                    filename: 'menu_square.jpg',
                    contentType: 'image/jpeg'
                }
            );

            const uploadV21 = await axios.post(
                'https://catbox.moe/user/api.php',
                formV21,
                {
                    headers: formV21.getHeaders()
                }
            );

            squareImageUrlV21 =
                uploadV21.data.trim();

        } catch (cropErr) {
            console.error(
                '[Menu V21] Crop image failed, pakai URL asli:',
                cropErr.message
            );
        }

        // =========================================================
        // A2UI
        // =========================================================

        const a2ui = new A2UI();

const bannerOptionsV21 = [
    `✦ ${botConfig.bot?.name || 'Itsuki Nakano Chan'}\n${greetingV21}, ${m.pushName || 'User'} ${roleEmojiV21}\n\n"${totalUsersV21} orang udah nemenin aku jalan ${uptimeFormattedV21} — makasih ya udah mampir lagi~"`,

    `✦ ${m.pushName || 'User'}, welcome back ✦\n${roleEmojiV21} ${userRoleV21} • ◷ ${uptimeFormattedV21} online • ◇ ${m.isOwner || m.isPremium ? '∞' : (userV21?.limit ?? 25)} limit tersisa\n\nMau ngapain hari ini? Pilih kategori di bawah~`,

    `[ ${botConfig.bot?.name || 'Itsuki Nakano Chan'} • sistem aktif ]\n> user      : ${m.pushName || 'User'} (${userRoleV21})\n> uptime    : ${uptimeFormattedV21}\n> populasi  : ${totalUsersV21} user\n\n✧ Semua fitur siap dieksekusi, tinggal pilih~`,

    `୨୧ ${m.pushName || 'User'}!\nAku masih standby dari ${uptimeFormattedV21} lalu, nemenin ${totalUsersV21} temen lain di sini.\nStatus kamu: ${roleEmojiV21} *${userRoleV21}*, limit *${m.isOwner || m.isPremium ? '∞ tanpa batas' : (userV21?.limit ?? 25)}*.\n\n❀ Pilih kategori favoritmu di bawah~`
];

const bannerV21 =
    bannerOptionsV21[
        Math.floor(Math.random() * bannerOptionsV21.length)
    ];

const imageIdV21 = a2ui.image(
    squareImageUrlV21,
    {
        variant: 'header',
        fit: 'cover'
    }
);

const bannerIdV21 = a2ui.text(
    bannerV21,
    {
        variant: 'body'
    }
);

const dividerIdV21 = a2ui.divider();

const categoryTextV21 = a2ui.text(
    `⌘ *Kategori Menu*\n\n` +
    categoryOptionsV21
        .map(c => {
            const symbol = {
                owner: '♛',
                main: '✦',
                utility: '⌘',
                tools: '⚙',
                fun: '୨୧',
                game: '◇',
                download: '⇩',
                search: '⌕',
                sticker: '❖',
                media: '◈',
                ai: '✧',
                group: '♧',
                religi: '☾',
                info: 'ⓘ',
                cek: '✓',
                economy: '¤',
                user: '♙',
                canvas: '▧',
                random: '❀',
                premium: '◇',
                ephoto: '▣',
                jpm: '➤',
                pushkontak: '⌁',
                panel: '▤',
                store: '⌂'
            }[c.name] || '・';

            return `${symbol} ${c.name} — ${c.total} fitur`;
        })
        .join('\n') +
    `\n\n✧ Tekan tombol "Pilih Kategori" untuk membuka daftar fitur.`,
    {
        variant: 'body'
    }
);

const cardIdV21 = a2ui.card(
    a2ui.column([
        imageIdV21,
        bannerIdV21,
        dividerIdV21,
        categoryTextV21
    ])
);

a2ui.root([
    cardIdV21
]);

        // =========================================================
        // SINGLE SELECT
        // =========================================================

        const singleSelectRowsV21 =
            categoryOptionsV21.map((c) => ({
                header: '',
                title: `${c.emoji} ${c.name}`,
                description: `${c.total} fitur`,
                id: c.value
            }));

        // =========================================================
        // REAL VIDEO HEADER
        // =========================================================

        const MENU_VIDEO_URL_V21 = 'https://cdn.zass.in/3859mBuKFs.mp4';

        let videoContentV21;

        try {
            videoContentV21 =
                await generateWAMessageContent(
                    {
                        video: {
                            url: MENU_VIDEO_URL_V21
                        },

                        // Biar video bisa diperlakukan sebagai GIF/video
                        gifPlayback: true
                    },
                    {
                        upload:
                            sock.waUploadToServer
                    }
                );
        } catch (videoErr) {
            console.error(
                '[Menu V21] Video upload failed:',
                videoErr.message
            );

            // Kalau video gagal, tetap kirim menu tanpa video
            videoContentV21 = null;
        }

        // =========================================================
        // INTERACTIVE MESSAGE
        // =========================================================

        const interactiveMessageV21 = {
            body: {
                text:
                    `${botConfig.bot?.name || 'Itsuki Nakano Chan'} siap bantu kamu. ` +
                    `Pilih kategori di bawah 👇`
            },

            footer: {
                text:
                    botConfig.bot?.name ||
                    'Itsuki Nakano Chan'
            },

            nativeFlowMessage: {
                buttons: [
                    {
                        name: 'cta_url',

                        buttonParamsJson:
                            JSON.stringify({
                                display_text:
                                    `✨ Ikuti Saluran ${botConfig.saluran?.name || 'Itsuki Nakano'}~`,

                                url:
                                    botConfig.saluran?.link ||
                                    config.info?.website ||
                                    'https://alwayslennz-dev.my.id'
                            })
                    },

                    {
                        name: 'single_select',

                        buttonParamsJson:
                            JSON.stringify({
                                title:
                                    '📂 Pilih Kategori',

                                sections: [
                                    {
                                        title:
                                            'Semua Kategori',

                                        rows:
                                            singleSelectRowsV21
                                    }
                                ]
                            })
                    }
                ],

                messageParamsJson: '{}',
                messageVersion: 1
            },

            // A2UI tetap di body/message
            bloksWidget:
                a2ui.build(),

            contextInfo: {}
        };

        // =========================================================
        // PASANG VIDEO SEBAGAI HEADER
        // =========================================================

        if (
            videoContentV21 &&
            videoContentV21.videoMessage
        ) {
            interactiveMessageV21.header = {
                hasMediaAttachment: true,

                videoMessage:
                    videoContentV21.videoMessage
            };
        }

        // =========================================================
        // BUILD WA MESSAGE
        // =========================================================

        const msgV21 =
            generateWAMessageFromContent(
                m.chat,
                {
                    messageContextInfo: {
                        messageSecret:
                            crypto.randomBytes(32)
                    },

                    interactiveMessage:
                        interactiveMessageV21
                },
                {
                    quoted:
                        getVerifiedQuoted(
                            botConfig
                        )
                }
            );

        // =========================================================
        // RELAY
        // =========================================================

        await sock.relayMessage(
            msgV21.key.remoteJid,
            msgV21.message,
            {
                messageId:
                    msgV21.key.id,
                additionalNodes: [
                    {
                        tag: 'biz',
                        attrs: {
                            actual_actors: '2',
                            host_storage: '2',
                            privacy_mode_ts:
                                String(
                                    Math.floor(
                                        Date.now() / 1000
                                    )
                                )
                        },
                        content: [
                            {
                                tag: 'interactive',
                                attrs: {
                                    type:
                                        'native_flow',
                                    v: '1'
                                },
                                content: [
                                    {
                                        tag:
                                            'native_flow',
                                        attrs: {
                                            v: '9',
                                            name:
                                                'mixed'
                                        }
                                    }
                                ]
                            },
                            {
                                tag:
                                    'quality_control',
                                attrs: {
                                    decision_id:
                                        crypto
                                            .randomUUID()
                                            .replace(
                                                /-/g,
                                                ''
                                            ),
                                    source_type:
                                        'third_party'
                                },
                                content: [
                                    {
                                        tag:
                                            'decision_source',
                                        attrs: {
                                            value: 'df'
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        );
    } catch (v21Error) {
        console.error(
            '[Menu V21] Error:',
            v21Error
        );

        await m.reply(text);
    }

    break;
}

/* ============================================================================
   BONUS: audio menu di-convert ke Opus 256kbps (HQ) + di-cache, biar gak
   convert ulang tiap kirim. Ganti blok `audioEnabled` yang lama di menu.js
   kamu dengan ini kalau mau audio menu-nya sekelas Itsuki.
   ========================================================================= */

/*
const audioEnabled = db.setting('audioMenu') !== false;
if (audioEnabled) {
    const audioPath = await getAssetPath('audio.itsuki', 'mp3');
    if (fs.existsSync(audioPath)) {
        try {
            const tempDir = path.join(process.cwd(), 'temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            const oggPath = path.join(tempDir, 'menu_audio_hq_opus.ogg');

            if (!fs.existsSync(oggPath)) {
                const { spawn } = require('child_process');
                await new Promise((resolve, reject) => {
                    const ffmpeg = spawn('ffmpeg', [
                        '-y', '-i', audioPath,
                        '-c:a', 'libopus', '-b:a', '256k', '-vbr', 'on',
                        '-compression_level', '10', '-ac', '2', '-ar', '48000',
                        oggPath
                    ]);
                    ffmpeg.on('close', (code) => code === 0 ? resolve() : reject(new Error('FFmpeg error')));
                    ffmpeg.on('error', reject);
                });
            }

            await sock.sendMessage(m.chat, {
                audio: { url: oggPath },
                mimetype: 'audio/ogg; codecs=opus',
                ptt: true
            }, { quoted: m });
        } catch (ffmpegErr) {
            // fallback ke mp3 mentah kalau ffmpeg gagal / gak ke-install
            await sock.sendMessage(m.chat, {
                audio: fs.readFileSync(audioPath),
                mimetype: 'audio/mpeg',
                ptt: true
            }, { quoted: m });
        }
    }
}
*/

            default:
                await m.reply(text);
        }
        
        /* ============================================================================
   PATCH: Ganti blok audio di bagian bawah handler() menu.js kamu dengan ini.
   Cari blok yang diawali:

       const audioEnabled = db.setting('audioMenu') !== false
       if (audioEnabled) {
           const audioPath = await getAssetPath('audio.itsuki', 'mp3');
           ...
       }

   dan GANTI SELURUHNYA dengan blok di bawah ini. Ini bikin gaya kirim audio
   (bukan tampilan visual menu) bisa diatur lewat `.setaudiomenu 1-5`, sama
   kayak `menuAudioStyle` yang disave plugin setaudiomenu.js.
   ========================================================================= */

const audioEnabled = db.setting('audioMenu') !== false;
if (audioEnabled) {
    const audioPath = await getAssetPath('audio.itsuki', 'mp3');
    const audioStyle = db.setting('menuAudioStyle') || 1;

    if (fs.existsSync(audioPath)) {
        // helper: convert mp3 -> opus ogg (HQ), dengan cache biar gak convert ulang tiap kirim
        async function getOpusPath() {
            const tempDir = path.join(process.cwd(), 'temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            const oggPath = path.join(tempDir, 'menu_audio_hq_opus.ogg');
            if (fs.existsSync(oggPath)) return oggPath;

            const { spawn } = require('child_process');
            await new Promise((resolve, reject) => {
                const ffmpeg = spawn('ffmpeg', [
                    '-y', '-i', audioPath,
                    '-c:a', 'libopus', '-b:a', '256k', '-vbr', 'on',
                    '-compression_level', '10', '-ac', '2', '-ar', '48000',
                    oggPath
                ]);
                ffmpeg.on('close', (code) => code === 0 ? resolve() : reject(new Error('FFmpeg error')));
                ffmpeg.on('error', reject);
            });
            return oggPath;
        }

        try {
            switch (audioStyle) {
                case 1: {
                    // PTT Opus + reply ke pesan asli
                    try {
                        const oggPath = await getOpusPath();
                        await sock.sendMessage(m.chat, {
                            audio: { url: oggPath },
                            mimetype: 'audio/ogg; codecs=opus',
                            ptt: true
                        }, { quoted: m });
                    } catch (e) {
                        await sock.sendMessage(m.chat, {
                            audio: fs.readFileSync(audioPath),
                            mimetype: 'audio/mpeg',
                            ptt: true
                        }, { quoted: m });
                    }
                    break;
                }

                case 2: {
                    // PTT Opus + reply fake polling
                    const qpoll = {
                        key: { participant: '0@s.whatsapp.net' },
                        message: { pollCreationMessage: { name: botConfig.bot?.name || 'Itsuki Nakano Chan' } }
                    };
                    try {
                        const oggPath = await getOpusPath();
                        await sock.sendMessage(m.chat, {
                            audio: { url: oggPath },
                            mimetype: 'audio/ogg; codecs=opus',
                            ptt: true
                        }, { quoted: qpoll });
                    } catch (e) {
                        await sock.sendMessage(m.chat, {
                            audio: fs.readFileSync(audioPath),
                            mimetype: 'audio/mpeg',
                            ptt: false
                        }, { quoted: qpoll });
                    }
                    break;
                }

                case 3: {
                    // MP3 biasa + reply fake chat teks
                    const qtext = {
                        key: { fromMe: false, participant: m.sender },
                        message: { conversation: 'setelin musiknya nya bang' }
                    };
                    await sock.sendMessage(m.chat, {
                        audio: fs.readFileSync(audioPath),
                        mimetype: 'audio/mpeg',
                        ptt: false
                    }, { quoted: qtext });
                    break;
                }

                case 4: {
                    // PTT Opus + reply fake dari channel/saluran
                    const saluranId = botConfig.saluran?.id || '120363400911374213@newsletter';
                    const qChannel = {
                        key: {
                            fromMe: false,
                            participant: '0@s.whatsapp.net',
                            remoteJid: saluranId
                        },
                        message: { conversation: '🔊 Playing Audio Menu...' }
                    };
                    try {
                        const oggPath = await getOpusPath();
                        await sock.sendMessage(m.chat, {
                            audio: { url: oggPath },
                            mimetype: 'audio/ogg; codecs=opus',
                            ptt: true
                        }, { quoted: qChannel });
                    } catch (e) {
                        await sock.sendMessage(m.chat, {
                            audio: fs.readFileSync(audioPath),
                            mimetype: 'audio/mpeg',
                            ptt: false
                        }, { quoted: qChannel });
                    }
                    break;
                }

                case 5:
                default: {
                    // MP3 biasa + reply fake troli/order
                    const ftroliQuoted = {
                        key: {
                            fromMe: false,
                            participant: '0@s.whatsapp.net',
                            remoteJid: 'status@broadcast'
                        },
                        message: {
                            orderMessage: {
                                orderId: '44444444444444',
                                thumbnail: thumbBuffer || imageBuffer || null,
                                itemCount: 1,
                                status: 'INQUIRY',
                                surface: 'CATALOG',
                                message: `★ ${botConfig.bot?.name || 'Itsuki Nakano Chan'}`,
                                orderTitle: `📋 Menu Audio`,
                                sellerJid: botConfig.botNumber ? `${botConfig.botNumber}@s.whatsapp.net` : m.sender,
                                token: 'itsuki-menu-audio',
                                totalAmount1000: 0,
                                totalCurrencyCode: 'IDR'
                            }
                        }
                    };
                    await sock.sendMessage(m.chat, {
                        audio: fs.readFileSync(audioPath),
                        mimetype: 'audio/mpeg',
                        ptt: false
                    }, { quoted: ftroliQuoted });
                    break;
                }
            }
        } catch (audioErr) {
            console.error('[Menu] Error sending audio:', audioErr.message);
        }
    }
}

    } catch (error) {
        console.error('[Menu] Error on command execution:', error.message);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
