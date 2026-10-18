const config = require('../../config');
const { generateWAMessageFromContent, proto } = require('itsuki');

const pluginConfig = {
    name: 'setmenu',
    alias: ['menuvariant', 'menustyle'],
    category: 'owner',
    description: 'Mengatur variant tampilan menu',
    usage: '.setmenu <v1-v20>',
    example: '.setmenu v20',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
};

const VARIANTS = {
    v1:  { id: 1,  name: 'Simple',               desc: 'Image biasa tanpa contextInfo' },
    v2:  { id: 2,  name: 'Standard',              desc: 'Image + full contextInfo (default)' },
    v3:  { id: 3,  name: 'Document',              desc: 'Document + jpegThumbnail + verified quoted' },
    v4:  { id: 4,  name: 'Video',                 desc: 'Video + contextInfo + verified quoted' },
    v5:  { id: 5,  name: 'Button',                desc: 'Image + buttons (single_select & quick_reply)' },
    v6:  { id: 6,  name: 'Document Premium',      desc: 'Document + jpegThumbnail 1280x450 + full contextInfo' },
    v7:  { id: 7,  name: 'Carousel',              desc: 'Swipeable cards per kategori (modern)' },
    v8:  { id: 8,  name: 'Minimalist',            desc: 'Image + ftroli quoted + fresh design' },
    v9:  { id: 9,  name: 'NativeFlow',            desc: 'Interactive + limited_time_offer + bottom_sheet + single_select' },
    v10: { id: 10, name: 'NativeFlow',            desc: 'ITSUKI CHAN' },
    v11: { id: 11, name: 'Document Interactive',  desc: 'Document + nativeFlowMessage + limited_time_offer + cta buttons' },
    v12: { id: 12, name: 'MENU VERSI 12',         desc: 'XXXXXX' },
    v13: { id: 13, name: 'Canvas Thumbnail',      desc: 'Document style V6 + Canvas Banner Thumbnail' },
    v14: { id: 14, name: 'MENU VERSI 14',         desc: 'XXXXXX' },
    v15: { id: 15, name: 'MENU VERSI 15',         desc: 'XXXXXX' },
    v16: { id: 16, name: 'NativeFlow Catalog',    desc: 'Product catalog header + CTA saluran + quick reply + select menu kategori' },
    v17: { id: 17, name: 'Buttons Location',      desc: 'buttonsMessage + locationMessage header + 2 tombol Owner & Allmenu' },
    v18: { id: 18, name: 'Readmore + Category Tap', desc: 'Readmore trick + tombol per kategori (command langsung bisa di-tap) + History command' },
    v19: { id: 19, name: 'Sticker + Video Combo', desc: 'Sticker fake-quoted + video nempel via messageAssociation (ala status)' }, 
    v20: { id: 20, name: 'Menu いつき〜なかの✨ Rich', desc: 'gak tw, aja sendiri' },
    v21: { id: 21, name: 'A2UI Widget', desc: 'Adaptive UI native — card, video, choicePicker kategori (via itsuki core)' }
};

async function handler(m, { sock, db }) {
    const args = m.args || [];
    const variant = args[0]?.toLowerCase();

    if (variant) {
        const selected = VARIANTS[variant];
        if (!selected) {
            await m.reply(
                `✦ *Kon-いつき〜なかの✨~* ✦\n\n` +
                `Eeh~ \`${variant}\` bukan variant yang いつき〜なかの✨ kenal deh~ 🌸\n` +
                `Gunakan: \`v1\` s/d \`v21\` ya Kak~`
            );
            return;
        }

        db.setting('menuVariant', selected.id);
        await db.save();

        await m.reply(
            `✦ *ᴍᴇɴᴜ ᴅɪᴘᴇʀʙᴀʀᴜɪ~* ✦\n\n` +
            `Yay~ いつき〜なかの✨ sudah ganti tampilan menu-nya! ⭐\n\n` +
            `> 🎨 *V${selected.id} — ${selected.name}*\n` +
            `> _${selected.desc}_\n\n` +
            `_Semoga menunya makin cantik ya Kak~ 💕_`
        );
        return;
    }

    const current = db.setting('menuVariant') || config.ui?.menuVariant || 2;

    const rows = Object.entries(VARIANTS).map(([key, val]) => ({
        title: `${key.toUpperCase()}${val.id === current ? ' ✓' : ''} — ${val.name}`,
        description: val.desc,
        id: `${m.prefix}setmenu ${key}`
    }));

    const bodyText =
        `✦ *sᴇᴛ ᴍᴇɴᴜ ᴠᴀʀɪᴀɴᴛ* ✦\n\n` +
        `Kon-いつき〜なかの✨~ Kak *${m.pushName}*! 🌟\n` +
        `Di sini いつき〜なかの✨ bisa atur tampilan menu bot-nya~\n\n` +
        `> Variant aktif: *V${current}*\n` +
        `> _${VARIANTS[`v${current}`]?.name || 'Unknown'}_\n\n` +
        `> Pilih variant dari daftar di bawah ya~ 💕`;

    try {
        const interactiveButtons = [
            {
                name: 'single_select',
                buttonParamsJson: JSON.stringify({
                    title: '🎨 ᴘɪʟɪʜ ᴠᴀʀɪᴀɴᴛ',
                    sections: [{
                        title: 'ᴅᴀꜰᴛᴀʀ ᴠᴀʀɪᴀɴᴛ ᴍᴇɴᴜ',
                        rows
                    }]
                })
            }
        ];

        const msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                        body: proto.Message.InteractiveMessage.Body.fromObject({
                            text: bodyText
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.fromObject({
                            text: config.bot?.name || 'Itsuki Nakano'
                        }),
                        header: proto.Message.InteractiveMessage.Header.fromObject({
                            title: '🎨 Menu Variant',
                            subtitle: `${Object.keys(VARIANTS).length} variant tersedia`,
                            hasMediaAttachment: false
                        }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                            buttons: interactiveButtons
                        }),
                        contextInfo: {
                            mentionedJid: [m.sender],
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: config.saluran?.id || 'https://whatsapp.com/channel/0029VbDytkmBqbrF0rFKr12w',
                                newsletterName: config.saluran?.name || config.bot?.name || 'Itsuki Nakano',
                                serverMessageId: 127
                            }
                        }
                    })
                }
            }
        }, { userJid: m.sender, quoted: m });

        await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
    } catch {
        let txt = `✦ *sᴇᴛ ᴍᴇɴᴜ ᴠᴀʀɪᴀɴᴛ* ✦\n\n`;
        txt += `Kon-いつき〜なかの✨~! 🌟 Variant aktif: *V${current}*\n\n`;
        for (const [key, val] of Object.entries(VARIANTS)) {
            const mark = val.id === current ? ' ✓' : '';
            txt += `> *${key.toUpperCase()}*${mark} — _${val.desc}_\n`;
        }
        txt += `\n_Gunakan: \`.setmenu v1\` dst._`;
        await m.reply(txt);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};