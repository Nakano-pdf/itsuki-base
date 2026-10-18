const config = require('../../config');
const { getDatabase } = require('../../src/lib/database');
const { generateWAMessageFromContent, proto } = require('itsuki');

const pluginConfig = {
    name: 'setreply',
    alias: ['replyvariant', 'replystyle'],
    category: 'owner',
    description: 'Mengatur variant tampilan reply',
    usage: '.setreply <v1-v14>',
    example: '.setreply v10',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
};

const VARIANTS = {
    v1:  { id: 1,  name: 'Simple',          desc: 'Reply text biasa tanpa styling',                        emoji: '📝' },
    v2:  { id: 2,  name: 'Image',           desc: 'Reply dengan gambar thumbnail itsuki.jpg',               emoji: '🖼️' },
    v3:  { id: 3,  name: 'Link Preview',    desc: 'Link preview + forwardedNewsletter saluran',            emoji: '🔗' },
    v4:  { id: 4,  name: 'GIF + Kontak',    desc: 'GIF playback + fake quoted contact user',              emoji: '🎞️' },
    v5:  { id: 5,  name: 'FakeTroli',       desc: 'Fake order (troli) quoted + thumbnail',                emoji: '🛒' },
    v6:  { id: 6,  name: 'Document',        desc: 'Document + fake contact quoted (centang biru)',         emoji: '📄' },
    v7:  { id: 7,  name: 'Doc + Ori',       desc: 'Document + quoted pesan asli (tanpa fake contact)',     emoji: '🌟' },
    v8:  { id: 8,  name: 'Location',        desc: 'Fake location header interaktif (interactive message)', emoji: '📍' },
    v9:  { id: 9,  name: 'Buttons',         desc: 'Buttons + location header + tombol Owner & Allmenu',    emoji: '🔘' },
    v10: { id: 10, name: 'Business Card',   desc: 'Interactive business card + Fake order (troli) quoted', emoji: '💼' },
    v11: { id: 11, name: 'Tagihan',         desc: 'Native payment request bubble (tampilan tagihan)',      emoji: '💳' },
    v12: { id: 12, name: 'Nama Animasi',    desc: 'Teks animasi loop bertahap mengambil dari nama bot',    emoji: '🌀' },
    v13: { id: 13, name: 'Fake Katalog',    desc: 'Order message sebagai isi pesan utama, tampil seperti katalog produk', emoji: '🍙' }, 
    v14: { id: 14, name: 'いつき〜なかの✨ Rich',    desc: 'いつき〜なかの✨ Rich dari Baileys itsuki file message_builder', emoji: '⭐' }
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
                `Gunakan: \`v1\` s/d \`v14\` ya Kak~`
            );
            return;
        }

        db.setting('replyVariant', selected.id);

        let warningMsg = '';
        if (selected.id === 12) {
            warningMsg = `\n\n⚠ _Peringatan khusus V12: variant animasi ini kirim edit pesan berulang kali, ada kemungkinan bikin nomor bot ter-banned, kinerja panel melambat, dan spam di console._`;
        }

        // Kirim pakai sock.sendMessage langsung (bukan m.reply) supaya pesan konfirmasi
        // ini gak ikut ke-render pakai variant baru yang baru aja dipilih (misal V10/V12/V13
        // yang punya efek bubble khusus / animasi / side-effect lain)
        await m.reply(
    `✦ *ʀᴇᴘʟʏ ᴅɪᴘᴇʀʙᴀʀᴜɪ~* ✦\n\n` +
    `Yay~ いつき〜なかの✨ sudah ganti tampilan reply-nya! ⭐\n\n` +
    `> ${selected.emoji} *V${selected.id} — ${selected.name}*\n` +
    `> _${selected.desc}_\n\n` +
    `_Semoga balasannya makin chan ya Kak~ 💕_${warningMsg}`
);
        return;
    }

    const current = db.setting('replyVariant') || config.ui?.replyVariant || 1;

    const rows = Object.entries(VARIANTS).map(([key, val]) => ({
        title: `${val.emoji} ${key.toUpperCase()}${val.id === current ? ' ✓' : ''} — ${val.name}`,
        description: val.desc,
        id: `${m.prefix}setreply ${key}`
    }));

    const bodyText =
        `✦ *sᴇᴛ ʀᴇᴘʟʏ ᴠᴀʀɪᴀɴᴛ* ✦\n\n` +
        `Kon-いつき〜なかの✨~ Kak *${m.pushName}*! 🌟\n` +
        `Di sini いつき〜なかの✨ bisa atur gaya balasan pesan bot-nya~\n\n` +
        `> Variant aktif: *V${current}*\n` +
        `> ${VARIANTS[`v${current}`]?.emoji || '📝'} _${VARIANTS[`v${current}`]?.name || 'Unknown'}_\n\n` +
        `> Pilih variant dari daftar di bawah ya~ 💕`;

    try {
        const interactiveButtons = [
            {
                name: 'single_select',
                buttonParamsJson: JSON.stringify({
                    title: '💬 ᴘɪʟɪʜ ᴠᴀʀɪᴀɴᴛ',
                    sections: [{
                        title: 'ᴅᴀꜰᴛᴀʀ ᴠᴀʀɪᴀɴᴛ ʀᴇᴘʟʏ',
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
                            title: '💬 Reply Variant',
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
        let txt = `✦ *sᴇᴛ ʀᴇᴘʟʏ ᴠᴀʀɪᴀɴᴛ* ✦\n\n`;
        txt += `Kon-いつき〜なかの✨~! 🌟 Variant aktif: *V${current}*\n\n`;
        for (const [key, val] of Object.entries(VARIANTS)) {
            const mark = val.id === current ? ' ✓' : '';
            txt += `> ${val.emoji} *${key.toUpperCase()}*${mark} — _${val.desc}_\n`;
        }
        txt += `\n_Gunakan: \`.setreply v1\` s/d \`.setreply v14\`_`;
        await m.reply(txt);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};