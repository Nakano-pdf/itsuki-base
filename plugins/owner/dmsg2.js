/**
 * ✦ Itsuki Nakano — DMSG2
 * ✦ Category: Owner
 */

const { delay } = require('itsuki')

const pluginConfig = {
    name: 'dmsg2',
    alias: [],
    category: 'owner',
    description: 'DMSG2 — group status + delayed delete',
    usage: '.dmsg2 (reply pesan)',
    example: '.dmsg2',
    isOwner: true,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function dmsg2(sock, chatId, stanzaId, text) {

    // =========================================================
    // 1. EDIT PESAN REPLY
    // =========================================================

    const editResult = await sock.sendMessage(
        chatId,
        {
            text: text || 'Hai',
            edit: {
                remoteJid: chatId,
                fromMe: true,
                id: stanzaId
            }
        }
    )

    const editId = editResult?.key?.id

    // =========================================================
    // 2. BUAT GROUP STATUS
    // =========================================================

    const tempMsg = await sock.relayMessage(
        chatId,
        {
            groupStatusMessageV2: {
                message: {
                    extendedTextMessage: {
                        text: 'tes',
                        contextInfo: {
                            isGroupStatus: true
                        }
                    }
                }
            }
        },
        {}
    )

    const tempKey = tempMsg?.key
    const tempId = tempKey?.id

    // =========================================================
    // 3. TUNGGU 200ms
    // =========================================================

    await delay(200)

    // =========================================================
    // 4. HAPUS GROUP STATUS
    // =========================================================

    if (tempKey) {

        console.log(
            '[DMSG2] DELETE GROUP STATUS:',
            JSON.stringify(tempKey, null, 2)
        )

        await sock.sendMessage(chatId, {
            delete: tempKey
        })

        // =====================================================
        // 5. TUNGGU 200ms SETELAH DELETE
        // =====================================================

        await delay(200)
    }

    // =========================================================
    // 6. JALANKAN DMSG / TYPE 14
    // =========================================================

    if (tempId) {

        const editedMsg = await sock.relayMessage(
            chatId,
            {
                protocolMessage: {
                    key: {
                        remoteJid: chatId,
                        fromMe: true,
                        id: tempId
                    },
                    type: 14,
                    editedMessage: {
                        extendedTextMessage: {
                            text: '\0',
                            contextInfo: {
                                isGroupStatus: false
                            }
                        }
                    }
                }
            },
            {
                messageId: stanzaId
            }
        )

        console.log(
            '[DMSG2] TYPE 14 RESULT:',
            JSON.stringify(editedMsg, null, 2)
        )
    }

    // =========================================================
    // 7. HAPUS HASIL EDIT
    // =========================================================

    if (editId) {

        await sock.sendMessage(chatId, {
            delete: {
                remoteJid: chatId,
                id: editId,
                fromMe: true
            }
        })
    }

    // =========================================================
    // 8. DEBUG
    // =========================================================

    console.log('[DMSG2] SELESAI', {
        stanzaId,
        editId,
        tempId,
        tempKey
    })
}

async function handler(m, { sock }) {

    if (!m.isGroup) {

        return m.reply(
            '💗 *Ehh, Senpai~!*\n\n' +
            'Command ini khusus digunakan di grup, yaa~ ✨'
        )
    }

    if (!m.quoted) {

        return m.reply(
            '🌟 *Ehh? Belum ada pesan yang direply~*\n\n' +
            'Reply dulu pesan yang ingin diproses, Senpai~ 💫'
        )
    }

    const stanzaId = m.quoted.key?.id

    if (!stanzaId) {

        return m.reply(
            '💔 *Aduh... ID pesannya tidak ditemukan~*\n\n' +
            'Coba reply pesannya lagi, Senpai.'
        )
    }

    const text =
        Array.isArray(m.args)
            ? m.args.join(' ').trim()
            : ''

    try {

        await dmsg2(
            sock,
            m.chat,
            stanzaId,
            text
        )

    } catch (error) {

        console.error(
            '[dmsg2]',
            error
        )

        return m.reply(
            '💔 *Aww... gagal diproses, Senpai~*\n\n' +
            `> ${error?.message || error}`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}