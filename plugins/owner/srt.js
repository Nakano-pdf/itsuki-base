const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('../../config');
const { getDatabase } = require('../../src/lib/database');
const { generateWAMessageFromContent, generateWAMessage, jidNormalizedUser } = require('itsuki');

const pluginConfig = {
    name: 'srt',
    alias: ['shufflereplythumb', 'shufflereply'],
    category: 'owner',
    description: 'Sistem Shuffle Reply Thumb (SRT) untuk reply random image di semua variant',
    usage: '.srt on',
    example: '.srt on',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    energi: 0,
    isEnabled: true
};

if (!global.srtSession) {
    global.srtSession = {};
}

const SHUFFLE_DIR = path.join(process.cwd(), 'data', 'shuffle');

function countShuffleImages() {
    if (!fs.existsSync(SHUFFLE_DIR)) return 0;
    const files = fs.readdirSync(SHUFFLE_DIR);
    return files.filter(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.jpeg')).length;
}

async function handler(m, { sock, args = [] }) {
    try {
        const db = getDatabase();
        const action = args[0]?.toLowerCase();

        if (!action) {
            await m.reply(
                `╭┈┈⬡ *sɪsᴛᴇᴍ sʀᴛ* ⬡\n` +
                `┊ Kon-いつき〜なかの✨~ Kak *${m.pushName}*! 🌸\n` +
                `┊ Sistem *Shuffle Reply Thumb* bikin balasan bot pakai thumbnail acak dari koleksi gambar yang kamu simpan sendiri.\n` +
                `┊\n` +
                `┊ *.srt on* — aktifin shuffle secara global\n` +
                `┊ *.srt off* — matiin, balik ke thumbnail default\n` +
                `┊ *.srt c* — mulai sesi capture gambar baru\n` +
                `┊ *.srt d* — tutup sesi capture\n` +
                `┊ *.srt list* — liat semua koleksi tersimpan\n` +
                `┊ *.srt del* — hapus gambar (reply salah satu dari list)\n` +
                `╰┈┈┈┈┈┈┈┈⬡`
            );
            return;
        }

        if (action === 'on') {
            db.setting('srtEnabled', true);
            await m.reply(
                `╭┈┈⬡ *sʀᴛ ᴀᴋᴛɪғ* ⬡\n` +
                `┊ Yay~ fitur SRT sudah nyala global! ⭐\n` +
                `┊ Semua variant reply yang punya thumbnail sekarang bakal nampilin gambar acak dari folder shuffle ya Kak~\n` +
                `╰┈┈┈┈┈┈┈┈⬡`
            );
        }
        else if (action === 'off') {
            db.setting('srtEnabled', false);
            await m.reply(
                `╭┈┈⬡ *sʀᴛ ɴᴏɴᴀᴋᴛɪғ* ⬡\n` +
                `┊ Oke~ shuffle thumbnail dimatiin. Balasan bot balik pakai gambar default bawaan いつき〜なかの✨ lagi~ 🌙\n` +
                `╰┈┈┈┈┈┈┈┈⬡`
            );
        }
        else if (action === 'c' || action === 'capture') {
            global.srtSession[m.chat] = { sender: m.sender, count: 0 };
            const totalImages = countShuffleImages();
            await m.reply(
                `╭┈┈⬡ *sᴇsɪ ᴄᴀᴘᴛᴜʀᴇ ᴅɪᴍᴜʟᴀɪ* ⬡\n` +
                `┊ Kirimin gambar satu-satu ke chat ini ya Kak, nanti いつき〜なかの✨ simpen otomatis ke database shuffle~ 📸\n` +
                `┊\n` +
                `┊ Total gambar tersimpan saat ini: *${totalImages}*\n` +
                `┊ Udah selesai kirim? Ketik \`${m.prefix}srt d\` buat nutup sesinya~\n` +
                `╰┈┈┈┈┈┈┈┈⬡`
            );
        }
        else if (action === 'd' || action === 'done') {
            if (!global.srtSession[m.chat] || global.srtSession[m.chat].sender !== m.sender) {
                return m.reply(
                    `╭┈┈⬡ *ᴋᴏɴ-ᴀɪ~* ⬡\n` +
                    `┊ Kamu gak lagi di dalam sesi capture aktif deh Kak~ 🌸\n` +
                    `╰┈┈┈┈┈┈┈┈⬡`
                );
            }
            const count = global.srtSession[m.chat].count;
            delete global.srtSession[m.chat];
            const totalImages = countShuffleImages();
            await m.reply(
                `╭┈┈⬡ *sᴇsɪ ᴄᴀᴘᴛᴜʀᴇ sᴇʟᴇsᴀɪ* ⬡\n` +
                `┊ Sesinya udah いつき〜なかの✨ tutup~ ✅\n` +
                `┊ Gambar baru ditambahin sesi ini: *${count}*\n` +
                `┊ Total keseluruhan di sistem: *${totalImages}*\n` +
                `╰┈┈┈┈┈┈┈┈⬡`
            );
        }
        else if (action === 'list') {
            if (!fs.existsSync(SHUFFLE_DIR)) return m.reply(
                `╭┈┈⬡ *ᴋᴏsᴏɴɢ* ⬡\n` +
                `┊ Belum ada gambar tersimpan sama sekali. Coba capture dulu pakai \`${m.prefix}srt c\` ya~\n` +
                `╰┈┈┈┈┈┈┈┈⬡`
            );
            const files = fs.readdirSync(SHUFFLE_DIR).filter(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.jpeg'));
            if (files.length === 0) return m.reply(
                `╭┈┈⬡ *ᴋᴏsᴏɴɢ* ⬡\n` +
                `┊ Folder shuffle masih kosong nih Kak, capture dulu gih~\n` +
                `╰┈┈┈┈┈┈┈┈⬡`
            );

            await m.reply(
                `╭┈┈⬡ *ᴅᴀғᴛᴀʀ ɢᴀᴍʙᴀʀ sʀᴛ* ⬡\n` +
                `┊ いつき〜なかの✨ nemu *${files.length}* gambar tersimpan, lagi nyusun album-nya dulu ya Kak, tunggu bentar~ 💕\n` +
                `╰┈┈┈┈┈┈┈┈⬡`
            );

            try {
                const opener = generateWAMessageFromContent(
                    m.chat,
                    {
                        messageContextInfo: { messageSecret: crypto.randomBytes(32) },
                        albumMessage: {
                            expectedImageCount: files.length,
                            expectedVideoCount: 0,
                        },
                    },
                    {
                        userJid: jidNormalizedUser(sock.user.id),
                        quoted: m,
                        upload: sock.waUploadToServer,
                    }
                );

                await sock.relayMessage(opener.key.remoteJid, opener.message, {
                    messageId: opener.key.id,
                });

                for (let i = 0; i < files.length; i++) {
                    const imgPath = path.join(SHUFFLE_DIR, files[i]);
                    const imgBuffer = fs.readFileSync(imgPath);

                    const msg = await generateWAMessage(opener.key.remoteJid, { image: imgBuffer }, {
                        upload: sock.waUploadToServer,
                    });

                    msg.message.messageContextInfo = {
                        messageSecret: crypto.randomBytes(32),
                        messageAssociation: {
                            associationType: 1,
                            parentMessageKey: opener.key,
                        },
                    };

                    await sock.relayMessage(msg.key.remoteJid, msg.message, {
                        messageId: msg.key.id,
                    });
                }
            } catch (albumErr) {
                console.error('SRT Album Error:', albumErr);
                return m.reply(
                    `╭┈┈⬡ *ᴇʀʀᴏʀ* ⬡\n` +
                    `┊ Waduh, gagal bikin album gambarnya Kak~ 😢\n` +
                    `╰┈┈┈┈┈┈┈┈⬡`
                );
            }
        }
        else if (action === 'del' || action === 'delete') {
            const isImage = m.isImage || (m.quoted && m.quoted.isImage);
            if (!isImage) {
                return m.reply(
                    `╭┈┈⬡ *ᴄᴀʀᴀ ʜᴀᴘᴜs* ⬡\n` +
                    `┊ 1. Ketik \`${m.prefix}srt list\` buat liat koleksinya\n` +
                    `┊ 2. Reply salah satu gambar dari album itu pake \`${m.prefix}srt del\`\n` +
                    `╰┈┈┈┈┈┈┈┈⬡`
                );
            }

            await m.react('🕕');
            let buffer;
            try {
                if (m.quoted && m.quoted.isImage) {
                    buffer = await m.quoted.download();
                } else if (m.isImage) {
                    buffer = await m.download();
                }
            } catch (e) {
                return m.reply(
                    `╭┈┈⬡ *ᴇʀʀᴏʀ* ⬡\n` +
                    `┊ Gagal download gambarnya buat dihapus, Kak~\n` +
                    `╰┈┈┈┈┈┈┈┈⬡`
                );
            }

            if (buffer) {
                const hash = crypto.createHash('md5').update(buffer).digest('hex').substring(0, 10);
                const filename = `srt_${hash}.jpg`;
                const filepath = path.join(SHUFFLE_DIR, filename);

                if (fs.existsSync(filepath)) {
                    fs.unlinkSync(filepath);
                    await m.reply(
                        `╭┈┈⬡ *ʙᴇʀʜᴀsɪʟ* ⬡\n` +
                        `┊ Gambar udah dihapus dari database shuffle~ ✅\n` +
                        `╰┈┈┈┈┈┈┈┈⬡`
                    );
                } else {
                    await m.reply(
                        `╭┈┈⬡ *ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ* ⬡\n` +
                        `┊ Gambar ini gak cocok sama yang ada di database (atau udah kehapus duluan)~\n` +
                        `╰┈┈┈┈┈┈┈┈⬡`
                    );
                }
            }
            await m.react('✅');
        }
        else {
            await m.reply(
                `╭┈┈⬡ *ᴛɪᴅᴀᴋ ᴅɪᴋᴇɴᴀʟ* ⬡\n` +
                `┊ Perintah lanjutan "${action}" gak いつき〜なかの✨ kenal deh~\n` +
                `╰┈┈┈┈┈┈┈┈⬡`
            );
        }

    } catch (error) {
        console.error('SRT Error:', error);
        await m.reply('❌ *Ehh~* Terjadi kesalahan pada sistem SRT~ 🥺');
    }
}

async function srtAnswerHandler(m, sock) {
    if (!global.srtSession) return false;
    const session = global.srtSession[m.chat];
    if (!session || session.sender !== m.sender) return false;

    if (m.isCommand) return false;

    const isImage = m.isImage || (m.quoted && m.quoted.isImage);
    if (!isImage) return false;

    try {
        await m.react('🕕');
        let buffer;
        if (m.quoted && m.quoted.isImage) {
            buffer = await m.quoted.download();
        } else if (m.isImage) {
            buffer = await m.download();
        }

        if (buffer) {
            if (!fs.existsSync(SHUFFLE_DIR)) fs.mkdirSync(SHUFFLE_DIR, { recursive: true });

            const hash = crypto.createHash('md5').update(buffer).digest('hex').substring(0, 10);
            const filename = `srt_${hash}.jpg`;
            const filepath = path.join(SHUFFLE_DIR, filename);

            if (fs.existsSync(filepath)) {
                await m.reply('⚠️ Gambar yang sama udah ada di database~');
            } else {
                fs.writeFileSync(filepath, buffer);
                session.count++;
                await m.reply(
                    `╭┈┈⬡ *ᴛᴇʀsɪᴍᴘᴀɴ* ⬡\n` +
                    `┊ Gambar berhasil diamankan~ ✅\n` +
                    `┊ Total ditambahin sesi ini: *${session.count}*\n` +
                    `╰┈┈┈┈┈┈┈┈⬡`
                );
            }
        }
        await m.react('✅');
        return true;
    } catch (e) {
        await m.react('❌');
        await m.reply('❌ *Gomen ne~* Gagal mengunduh dan menyimpan gambar~ 🥺');
        return true;
    }
}

module.exports = {
    config: pluginConfig,
    handler,
    srtAnswerHandler
};