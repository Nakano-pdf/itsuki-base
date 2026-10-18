const ui = require('../../src/lib/fixkit/ui')
const store = require('../../src/lib/fixkit/store')

const pluginConfig = {
    name: ['fixkit', 'fk'],
    alias: ['menufixkit', 'toolsfix'],
    category: 'owner',
    description: 'Panel utama Fixkit: akses cepat ke semua fitur perbaikan, scrape, API, CRM, dan relay',
    usage: '.fixkit',
    example: '.fixkit',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 2,
    energi: 0,
    isEnabled: true,
}

async function handler(m, { sock }) {
    const rep = store.getRepairSettings()
    const apis = Object.keys(store.getApis()).length
    const contacts = Object.keys(store.getCrm()).length
    const relays = store.getRelays().filter(r => r.active).length

    const body = [
        '🛠 *Panel Fixkit Itsuki*',
        '',
        `*Autorepair:* ${rep.enabled ? '✅ ON' : '⛔ OFF'}`,
        `*API terdaftar:* ${apis}`,
        `*Kontak CRM:* ${contacts}`,
        `*Relay aktif:* ${relays}`,
        '',
        '*Perbaikan plugin*',
        '• `.fixpl1` — adaptasi plugin mentah ke Itsuki',
        '• `.fixpl2` — lint & auto-fix',
        '• `.fixpl3` — cek & pasang dependensi',
        '• `.addairich` — ubah ke versi Rich (tombol)',
        '*Scrape & API*',
        '• `.buatscrape` · `.toscrape` · `.addapi` · `.buatfitur`',
        '*Bisnis & lainnya*',
        '• `.crm` · `.relay`',
    ].join('\n')

    return ui.sendPanel(sock, m.chat, {
        title: 'FIXKIT',
        body,
        quoted: m,
        senderJid: m.sender,
        buttons: [
            { type: 'reply', text: '🔧 Fixpl1', id: '.fixpl1' },
            { type: 'reply', text: '🧪 Fixpl2', id: '.fixpl2' },
            { type: 'reply', text: '🧩 Fixpl3', id: '.fixpl3' },
            { type: 'reply', text: '🛠 Autorepair', id: '.autorepair status' },
            { type: 'reply', text: '✨ Addairich', id: '.addairich' },
            { type: 'reply', text: '🔌 Daftar API', id: '.addapi list' },
            { type: 'reply', text: '📇 CRM', id: '.crm list' },
            { type: 'reply', text: '🔁 Relay', id: '.relay list' },
        ],
    })
}

module.exports = { config: pluginConfig, handler }
