// ╭┈┈⬡ baca dulu ya~ semua pengaturan いつき〜なかの✨ ada di bawah ini, jangan buru-buru~ ✨
const config = {

    ryuu: {
        apiKey: 'ISI_API_KEY_KAMU',
        baseURL: 'https://api.ryuu-dev.my.id',
        premium: true,
    },

    bagah: {
        apiKey: 'ISI_API_KEY_KAMU',
        baseURL: 'https://api.bagahproject.com/api',
        authHeader: 'x-api-key',
        specUrl: '',
        autoSync: true,
        syncHours: 6,
    },
    
    itsukiAI: {
        ownerNick: 'Kak',
        ownerLabel: 'Pacar',
        userLabel: 'Assistant',
        greeting: true,
        listener: true,
        listenGroup: true,
        limitPerMinute: 5,
        limitPerDay: 100,
    },
    
    info: {
        website: 'https://itsuki-nakano.my.id',
        grupwa: 'https://chat.whatsapp.com/JDbi2xkFiTI3U1xb6LFe4C?s=cl&p=a&mlu=4&ilr=4&iam=2'
    },

    owner: {
        name: 'AlwaysLennz || AlwaysTeam',                    // Nama owner~ orang spesialnya いつき〜なかの✨
        number: ['628xxxxxxxxxx']         // Format: 628xxx (tanpa + atau 0)
    },

    // ── Server WebSocket streaming (itsuki-ws) ───────────────────────────
    // Samakan dengan config.js di folder ws. Tidak perlu env variable.
    wsStream: {
        publicUrl: 'wss://stream.domainmu.com', // domain tunnel, wajib
        token: 'ISI_TOKEN_KAMU', // HARUS sama dengan config ws
        host: '127.0.0.1',
        port: 8787,                              // HARUS sama dengan config ws
        external: true,                          // true = server jalan di folder ws
    },

    session: {
        pairingNumber: '628xxxxxxxxxx',   // Nomor WA yang akan di-pair sama いつき〜なかの✨
        usePairingCode: true              // true = Pairing Code, false = QR Code
    },

    bot: {
    name: 'Itsuki Base Bot',
    version: "3.0.0-base",
    developer: 'AlwaysLennz || AlwaysTeam ✨ (didukung oleh いつき〜なかの✨)',
    tqtoStyle: 'v1'
    },

    mode: 'public',

    command: {
        prefix: '.'
    },

    
    vercel: {
        // ambil token vercel di: https://vercel.com/account/tokens
        token: 'ISI_API_KEY_KAMU'                        // Token Vercel~ wajib diisi biar .deploy nya いつき〜なかの✨ bisa jalan ✨
    },
    
    github: {
        token: 'ISI_API_KEY_KAMU',   // isi token GitHub kamu sendiri di sini
        owner: 'fiturmediafire-beep',
        repo: 'Hsn-ai-Tourl',
        branch: 'main',
        folder: 'uploads'
    },

    store: {
        payment: [
    { name: 'Dana', number: '08xxxxxxxxxx', holder: 'Nama Owner' },
    { name: 'OVO', number: '08xxxxxxxxxx', holder: 'Nama Owner' },
    { name: 'GoPay', number: '08xxxxxxxxxx', holder: 'Nama Owner' },
    { name: 'ShopeePay', number: '08xxxxxxxxxx', holder: 'Nama Owner' }
        ],
        qris: '-'
    },

    donasi: {
        payment: [
    { name: 'Dana', number: '08xxxxxxxxxx', holder: 'Nama Owner' },
    { name: 'GoPay', number: '08xxxxxxxxxx', holder: 'Nama Owner' },
    { name: 'OVO', number: '08xxxxxxxxxx', holder: 'Nama Owner' }
        ],
        links: [
            { name: 'Saweria', url: 'saweria.co/username' },
            { name: 'Trakteer', url: 'trakteer.id/username' }
        ],
        benefits: [
    'Bantu いつき〜なかの✨ tetap bersinar di panggung ini~ ✨',
    'Bikin dunia いつき〜なかの✨ jadi lebih stabil dan hangat~',
    'Fitur baru? いつき〜なかの✨ kasih lebih cepat khusus buat kamu~ ♡',
    'Kamu jadi lebih dekat dengan いつき〜なかの✨… spesial loh~'
        ],
        qris: '-'
    },

    energi: {
        enabled: true, // Kalau true, sistem energi/limit いつき〜なかの✨ bekerja
        default: 99999,
        premium: 99999999,
        owner: -1
    },

    sticker: {
    packname: 'いつき〜なかの✨ いつき〜なかの✨  Mode ♡',
    author: 'AlwaysLennz || AlwaysTeam\n\nTerima kasih sudah mendukung いつき〜なかの✨ ya~ ♡'
    },

    saluran: {
    id: '120363412274875891@newsletter',
    name: '=  いつき〜なかの✨ Channel ✨ Rahasia Kita ♡ =',
    link: 'https://whatsapp.com/channel/0029VbDytkmBqbrF0rFKr12w'
    },

    groupProtection: {
    antilink: 'Eh~ @%user% kirim link ya? いつき〜なかの✨ gak suka itu loh… jadi pesannya aku hapus ya~ ♡',
    antilinkKick: 'Hmm~ @%user% kirim link… いつき〜なかの✨ sedih, jadi kamu harus keluar dulu ya~ bye bye~ ✨',
    antilinkGc: 'Ara~ @%user% kirim link grup WA? Itu rahasia loh… jadi いつき〜なかの✨ hapus ya~',
    antilinkGcKick: 'Yahh @%user%… kirim link grup itu gak boleh loh~ jadi いつき〜なかの✨ keluarkan ya~ ♡',
    antilinkAll: 'Hmm~ @%user% kirim sesuatu yang mencurigakan ya? いつき〜なかの✨ hapus aja deh~',
    antilinkAllKick: 'Maaf ya @%user%… いつき〜なかの✨ gak punya pilihan lain~ kamu harus keluar dulu ✨',
    antitagsw: 'Eh? @%user% main tag status? いつき〜なかの✨ hapus ya, itu ganggu loh~',
    antiviewonce: 'Ufufu~ pesan sekali lihat dari @%user% berhasil いつき〜なかの✨ intip~ rahasia terbongkar~ 👁️',
    antiremove: 'Eh~ @%user% hapus pesan? いつき〜なかの✨ masih ingat kok… ini dia isinya~',
    antihidetag: 'Hidetag dari @%user%? Nggak bisa sembunyi dari いつき〜なかの✨ loh~ aku hapus ya~',
    antitoxicWarn: 'Nee~ @%user% ngomongnya kasar banget… いつき〜なかの✨ kasih peringatan ya (%warn%/%max%)… jangan bikin いつき〜なかの✨ kecewa lagi ya~ ♡',
    antitoxicAction: 'Yahh… @%user% kelewatan… いつき〜なかの✨ harus %method% kamu sekarang… (%warn%/%max%)',
    antidocument: 'Hmm~ dokumen dari @%user%? いつき〜なかの✨ hapus dulu ya, biar aman~',
    antisticker: 'Sticker dari @%user%? Hehe~ lucu sih… tapi tetap いつき〜なかの✨ hapus ya~',
    antimedia: 'Media dari @%user% terlalu berisik~ いつき〜なかの✨ hapus aja ya~',
    antibot: 'Ara ara~ @%user% ternyata bot ya? いつき〜なかの✨ gak suka saingan… jadi aku kick ya~ 🤖✨',
    notAdmin: 'Ehh… いつき〜なかの✨ belum jadi admin… jadi belum bisa apa-apa nih… bantuin いつき〜なかの✨ dong? ♡'
},

    features: {
        antiSpam: true,
        antiSpamInterval: 3000,
        antiCall: true, // Kalau true, いつき〜なかの✨ bakal nolak panggilan masuk~
        blockIfCall: true, // Kalau true, いつき〜なかの✨ blokir nomor yang berani nelpon いつき〜なかの✨~
        autoTyping: true,
        autoRead: true,
        logMessage: true,
        dailyLimitReset: true,
        smartTriggers: false
    },

    registration: {
        enabled: false, // Kalau true, harus daftar dulu ya sebelum main sama いつき〜なかの✨~
        rewards: {
            koin: 30000,
            energi: 300,
            exp: 300000
        }
    },

    welcome: { defaultEnabled: false },
    goodbye: { defaultEnabled: false },

    premiumUsers: [],
    partnerUsers: [],
    bannedUsers: [],

    ui: {
        menuVariant: 1,
        allMenuVariant: 1   // Variant default buat allmenu (v1-v5)
    },

    messages: {
    wait: 'Tunggu bentar ya~ いつき〜なかの✨ lagi proses dengan penuh cinta… jangan kemana-mana~ ♡',
    success: 'Yatta~ berhasil loh! いつき〜なかの✨ sudah menyelesaikan permintaan kamu dengan sempurna ✨',
    error: 'Eh… gagal ya? Maaf ya… mungkin いつき〜なかの✨ lagi capek sedikit… coba lagi nanti ya~',

    ownerOnly: 'Hmm~ fitur ini cuma untuk orang spesialnya いつき〜なかの✨ loh… kamu belum termasuk~ ♡',
    premiumOnly: 'Ara~ ini khusus Premium loh~ kalau mau lebih dekat sama いつき〜なかの✨, upgrade dulu ya~ ✨',

    groupOnly: 'Hehe~ ini cuma bisa dipakai di grup loh~ いつき〜なかの✨ butuh banyak orang biar seru~',
    privateOnly: 'Ini rahasia kita berdua aja ya… cuma bisa di chat pribadi loh~ ♡',

    adminOnly: 'Ehh~ kamu belum admin… いつき〜なかの✨ butuh yang punya kekuatan lebih nih~',
    botAdminOnly: 'いつき〜なかの✨ belum jadi admin… gimana mau bantu kamu coba? Jadikan dulu ya~ ✨',
    
    cooldown: 'Sabar ya~ jangan buru-buru… tunggu %time% detik lagi, nanti いつき〜なかの✨ layani lagi kok~ ♡',
    energiExceeded: 'Yahh… energi kamu habis… いつき〜なかの✨ jadi gak bisa bantu… istirahat dulu atau jadi Premium ya~ ✨',

    banned: 'Hmm… いつき〜なかの✨ sedih… kamu sudah melanggar aturan… jadi gak bisa main bareng lagi… 🚫',

    rejectCall: 'Ehh jangan ditelepon dong~ いつき〜なかの✨ malu… chat aja ya~ ♡'
},

    database: { path: './database/main' },
    backup: { enabled: false, intervalHours: 24, retainDays: 7 },
    scheduler: { resetHour: 0, resetMinute: 0 },

    // Pengaturan dev mode~ auto aktif kalau NODE_ENV=development
    dev: {
        enabled: process.env.NODE_ENV === 'development',
        watchPlugins: true,    // Hot reload plugins~ ini aman kok
        watchSrc: false,       // DIMATIKAN - reload src bikin koneksi いつき〜なかの✨ konflik 440
        debugLog: false        // Tampilkan stack trace kalau perlu
    },

    // boleh dikosongin dulu ya~
    pterodactyl: {
        server1: {
            domain: '',
            apikey: '',
            capikey: '',
            egg: '15',
            nestid: '5',
            location: '1'
        },
        server2: {
            domain: '',
            apikey: '',
            capikey: '',
            egg: '15',
            nestid: '5',
            location: '1'
        },
        server3: {
            domain: '',
            apikey: '',
            capikey: '',
            egg: '15',
            nestid: '5',
            location: '1'
        },
        server4: {
            domain: '',
            apikey: '',
            capikey: '',
            egg: '15',
            nestid: '5',
            location: '1'
        },
        server5: {
            domain: '',
            apikey: '',
            capikey: '',
            egg: '15',
            nestid: '5',
            location: '1'
        }
    },

    digitalocean: {
        token: '',
        region: 'sgp1',
        sellers: [],
        ownerPanels: []
    },

    // CATATAN: ini di versi free gak ada ya~ adanya cuma di sc pt いつき〜なかの✨
    //  daftar di: https://pakasir.com/
    pakasir: {
        enabled: true,
        slug: '',
        apiKey: '',
        defaultMethod: 'qris',
        sandbox: false,
        pollingInterval: 5000
    },
    
    // CATATAN: ini di versi free gak ada ya~ adanya cuma di sc pt いつき〜なかの✨
    // Ambil apikey di: https://ditznesia.id -> Daftar -> Masuk ke Profile -> Ambil Apikey
    jasaotp: {
        apiKey: '',
        markup: 2000,
        timeout: 300
    },

    // CATATAN: kalau mau command "autoai" nya jalan, ini gak wajib diisi kok~
    // ambil apikey di: https://aistudio.google.com/apikey
    geminiApiKey: [
    'ISI_API_KEY_KAMU', // key lama いつき〜なかの✨
    'ISI_API_KEY_KAMU',  // ← daftar di aistudio.google.com
    'ISI_API_KEY_KAMU',
],

    // ✨ APIkey rahasia いつき〜なかの✨ ✨
    APIkey: {
        lolhuman: 'ISI_API_KEY_KAMU',
        neoxr: 'ISI_API_KEY_KAMU',
        google: 'ISI_API_KEY_KAMU',
        groq: 'ISI_API_KEY_KAMU',
        betabotz: 'ISI_API_KEY_KAMU',
        fishaudio: 'ISI_API_KEY_KAMU',   // API key dari fish.audio/app/api-keys/, wajib diisi buat fitur .いつき〜なかの✨ai
        youtube: "ISI_API_KEY_KAMU"

    },

    // ╭┈┈⬡ ASSETS (URL) ✨
    // Semua gambar/video/audio/font bawaan いつき〜なかの✨ sekarang diambil dari URL, bukan folder assets/ lokal lagi.
    // Isi link di bawah ini (bisa hosting sendiri, Catbox, GitHub raw, dsb). Kosongin dulu juga gapapa,
    // nanti otomatis kepakai fallback/di-skip. Command .ganti-* akan otomatis update value di sini
    // (lewat cache/asset-overrides.json) tiap owner reply gambar/video baru.
    // ╰┈┈⬡
    assets: {
        images: {
            itsuki: 'https://cdn.zass.in/3IPxdg5ZZD.jpg',
            itsukimenu: 'https://cdn.zass.in/3IPxdg5ZZD.jpg',
            itsuki2: 'https://cdn.zass.in/3IPxdg5ZZD.jpg',
            itsuki3: 'https://cdn.zass.in/3IPxdg5ZZD.jpg',
            itsukiV7: 'https://cdn.zass.in/fGyLxbgPHY.jpg',
            itsukiV8: 'https://cdn.zass.in/boJORpUZD9.jpg',
            itsukiV9: 'https://cdn.zass.in/dS8h4mwhov.jpg',
            itsukiV11: 'https://cdn.zass.in/S6ldAUo0uE.jpg',
            itsukiV20: 'https://cdn.zass.in/hlwSdpZ5aW.jpg',
            itsukiAllmenu: 'https://cdn.zass.in/9KPPPTRdfK.jpg',
            itsukiDemote: 'https://raw.githubusercontent.com/fiturmediafire-beep/hsn-assets/main/images/itsuki-demote.jpg',
            itsukiPromote: 'https://raw.githubusercontent.com/fiturmediafire-beep/hsn-assets/main/images/itsuki-promote.jpg',
            itsukiGames: 'https://raw.githubusercontent.com/fiturmediafire-beep/hsn-assets/main/images/itsuki-games.jpg',
            itsukiLevelup: 'https://raw.githubusercontent.com/fiturmediafire-beep/hsn-assets/main/images/itsuki-levelup.jpg',
            itsukiOtp: 'https://raw.githubusercontent.com/fiturmediafire-beep/hsn-assets/main/images/itsuki-otp.jpg',
            itsukiRpg: 'https://raw.githubusercontent.com/fiturmediafire-beep/hsn-assets/main/images/itsuki-rpg.jpg',
            itsukiRules: 'https://raw.githubusercontent.com/fiturmediafire-beep/hsn-assets/main/images/itsuki-rules.jpg',
            itsukiStore: 'https://raw.githubusercontent.com/fiturmediafire-beep/hsn-assets/main/images/itsuki-store.jpg',
            itsukiWinner: 'https://raw.githubusercontent.com/fiturmediafire-beep/hsn-assets/main/images/itsuki-winner.jpg',
            itsukiWelcome: '',
            itsukiGoodbye: '',
            itsukiPagi: 'https://cdn.zass.in/S6ldAUo0uE.jpg',
            itsukiMalam: 'https://cdn.zass.in/hlwSdpZ5aW.jpg',
            ppKosong: 'https://raw.githubusercontent.com/fiturmediafire-beep/hsn-assets/main/images/pp-kosong.jpg',
            sea: 'https://cdn.zass.in/S6ldAUo0uE.jpg',
            nokiaTemplate: 'https://raw.githubusercontent.com/fiturmediafire-beep/hsn-assets/main/images/nokia_template.jpg',
            magernulis: 'https://raw.githubusercontent.com/fiturmediafire-beep/hsn-assets/main/kertas/magernulis1.jpg',
            test: 'https://raw.githubusercontent.com/fiturmediafire-beep/hsn-assets/main/images/test.webp',
            // direferensikan di kode tapi belum ada file-nya waktu scan — isi kalau ada
            itsukiAi: '',
            itsukiMusic: '',
            itsukiFilm: '',
            itsukiTools: '',
            giveaway: '',
            cat: {} // opsional: isi per-kategori menu, mis. cat: { main: 'https://...' }
        },
        video: {
            itsuki: 'https://cdn.zass.in/3859mBuKFs.mp4',
            itsukiReplyV4: 'https://cdn.zass.in/3859mBuKFs.mp4',
            itsukiAllmenu: '',
            greetPagi: '',
            greetMalam: '',
            greetGeneric: ''
        },
        audio: {
            itsuki: 'https://raw.githubusercontent.com/fiturmediafire-beep/hsn-assets/main/audio/itsuki.mp3',
            tes: 'https://raw.githubusercontent.com/fiturmediafire-beep/hsn-assets/main/audio/tes.mp3'
        },
        fonts: {
            cinzel: 'https://raw.githubusercontent.com/fiturmediafire-beep/hsn-assets/main/fonts/Cinzel.ttf',
            epep: 'https://raw.githubusercontent.com/fiturmediafire-beep/hsn-assets/main/fonts/Epep.ttf',
            rajdhaniBold: 'https://raw.githubusercontent.com/fiturmediafire-beep/hsn-assets/main/fonts/Rajdhani-Bold.ttf',
            zahraaa: 'https://raw.githubusercontent.com/fiturmediafire-beep/hsn-assets/main/fonts/Zahraaa.ttf',
            arialNarrow: 'https://raw.githubusercontent.com/fiturmediafire-beep/hsn-assets/main/fonts/arialnarrow.ttf',
            nokiafc22: 'https://raw.githubusercontent.com/fiturmediafire-beep/hsn-assets/main/fonts/nokiafc22.ttf',
            fakequotes2: {
                interMedium: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff2',
                interRegular: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
                interSemiBold: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff2'
            },
            ignotes: { interMedium: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff2', interSemiBold: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff2' },
            ttqc: {
                notoColorEmoji: 'https://github.com/googlefonts/noto-emoji/raw/main/fonts/NotoColorEmoji.ttf',
                plusJakartaSansBold: 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/ttqc/PlusJakartaSans-Bold.ttf',
                plusJakartaSansMedium: 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/ttqc/PlusJakartaSans-Medium.ttf',
                plusJakartaSansRegular: 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/ttqc/PlusJakartaSans-Regular.ttf',
                faSolid900: 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/ttqc/fa-solid-900.ttf'
            },
            wdwsMeme: { interBold: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff2' },
            faketele: { robotoMonoBold: 'https://cdn.jsdelivr.net/fontsource/fonts/roboto-mono@latest/latin-700-normal.ttf' },
            brat: { poppins: 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Brat/Poppins.ttf' },
            fakequote: { crimsonTextRegular: 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Font/CrimsonText-Regular.ttf' }
        },
        templates: {
            fakequotes2Bg: 'https://raw.githubusercontent.com/ryyntwx/allimagerin/refs/heads/main/qc.png',
            ignotesTemplate: 'https://raw.githubusercontent.com/ryyntwx/allimagerin/refs/heads/main/bf3903f6-ae57-4d75-96a4-5c2e00c441c1.png',
            ttqcTemplate: 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/ttqc/qyzwa.png',
            ttqcDefaultAvatar: 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/6b71d84a580f385bd7ee36402df5341ead4770a0/Image/artworks-gWLRE6HyPH3DgVMG-ZFFxtg-t500x500.jpg',
            wdwsMemeTemplate: 'https://raw.githubusercontent.com/ryyntwx/allimagerin/refs/heads/main/wdws.png',
            fakeTeleBg: 'https://raw.githubusercontent.com/ryyntwx/Image-rinn/refs/heads/main/c8ac4ffc-618c-411c-b36c-45c06c7e5a5e.png',
            fakeovoBg: 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Image/file_0000000078bc71fa87da5cf26dc6c008.jpeg',
            bratGojo: 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Brat/Gojo.jpeg',
            bratVermeil: 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Brat/Vermile.jpg',
            fakequoteBg: 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Image/_20260425155846190.jpeg'
        }
    }
}


// ╭┈┈⬡ HELPER FUNCTIONS ✨
// Jangan diubah-ubah ya, nanti いつき〜なかの✨ ngambek loh~
// ╰┈┈⬡

function isOwner(number) {
    if (!number) return false
    const cleanNumber = number.split(':')[0].replace(/[^0-9]/g, '')
    if (!cleanNumber) return false

    if (config.bot?.number && cleanNumber === config.bot.number) return true

    try {
        const { getDatabase } = require('./src/lib/database')
        const db = getDatabase()

        if (config.owner && config.owner.number && config.owner.number.includes(cleanNumber)) {
            return true
        }

        if (db && db.data && Array.isArray(db.data.owner)) {
            if (db.data.owner.includes(cleanNumber)) return true
        }
        if (db) {
            const definedOwner = db.setting('ownerNumbers')
            if (Array.isArray(definedOwner) && definedOwner.includes(cleanNumber)) return true
        }

        return false
    } catch {
        return false
    }
}

function isPremium(number) {
    if (!number) return false
    if (isOwner(number)) return true
    
    const cleanNumber = number.replace(/[^0-9]/g, '')
    const premiumList = config.premiumUsers || []
    
    const inConfig = premiumList.some(premium => {
        if (!premium) return false
        const cleanPremium = premium.replace(/[^0-9]/g, '')
        return cleanNumber === cleanPremium || cleanNumber.endsWith(cleanPremium) || cleanPremium.endsWith(cleanNumber)
    })
    
    if (inConfig) return true
    
    try {
        const ownerPremiumDb = require('./src/lib/ownerPremiumDb')
        if (ownerPremiumDb.isPremium(cleanNumber)) return true
    } catch {}
    
    try {
        const { getDatabase } = require('./src/lib/database')
        const db = getDatabase()
        if (db && db.data && Array.isArray(db.data.premium)) {
             const now = Date.now()
             const found = db.data.premium.find(p => {
                if (typeof p === 'string') return p === cleanNumber
                if (p.id) return p.id === cleanNumber
                return false
            })
            
            if (found) {
                if (typeof found === 'string') return true
                if (found.expired && found.expired < now) return false
                return true
            }
        }
        if (db) {
            const savedPremium = db.setting('premiumUsers') || []
            const inDb = savedPremium.some(premium => {
                if (!premium) return false
                const cleanPremium = premium.replace(/[^0-9]/g, '')
                return cleanNumber === cleanPremium || cleanNumber.endsWith(cleanPremium) || cleanPremium.endsWith(cleanNumber)
            })
            if (inDb) return true
        }
    } catch {}
    
    return false
}

function isPartner(number) {
    if (!number) return false
    if (isOwner(number)) return true

    const cleanNumber = number.replace(/[^0-9]/g, '')
    const partnerList = config.partnerUsers || []

    const inConfig = partnerList.some(partner => {
        if (!partner) return false
        const cleanPartner = partner.replace(/[^0-9]/g, '')
        return cleanNumber === cleanPartner || cleanNumber.endsWith(cleanPartner) || cleanPartner.endsWith(cleanNumber)
    })

    if (inConfig) return true

    try {
        const ownerPremiumDb = require('./src/lib/ownerPremiumDb')
        if (ownerPremiumDb.isPartner(cleanNumber)) return true
    } catch {}

    return false
}

function isBanned(number) {
    if (!number) return false
    if (isOwner(number)) return false
    
    const cleanNumber = number.replace(/[^0-9]/g, '')
    return config.bannedUsers.some(banned => {
        const cleanBanned = banned.replace(/[^0-9]/g, '')
        return cleanNumber === cleanBanned || cleanNumber.endsWith(cleanBanned) || cleanBanned.endsWith(cleanNumber)
    })
}

function setBotNumber(number) {
    if (number) config.bot.number = number.replace(/[^0-9]/g, '')
}

function isSelf(number) {
    if (!number || !config.bot.number) return false
    const cleanNumber = number.replace(/[^0-9]/g, '')
    const botNumber = config.bot.number.replace(/[^0-9]/g, '')
    return cleanNumber.includes(botNumber) || botNumber.includes(cleanNumber)
}

function getConfig() { return config }

module.exports = {
    ...config,
    config,
    getConfig,
    isOwner,
    isPartner,
    isPremium,
    isBanned,
    setBotNumber,
    isSelf
}
