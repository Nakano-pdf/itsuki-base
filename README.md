<div align="center">
  <h1>🌸 ITSUKI NAKANO BASE BOT ✨</h1>
  <p><strong>Versi base dari Itsuki Nakano Bot: bot WhatsApp multi-device dengan sistem plugin modular, siap dipakai sebagai pondasi.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Language-Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
    <img src="https://img.shields.io/badge/Version-3.0.0--base-FF69B4?style=for-the-badge" />
    <img src="https://img.shields.io/badge/License-MIT-purple?style=for-the-badge" />
  </p>
</div>

---

## 📌 Tentang Versi Base

Itsuki Base Bot adalah versi ringkas dari Itsuki Nakano Bot. Sistemnya sama, tapi fitur berat dan data pribadi sudah dibuang, supaya kamu bisa langsung memasangnya dan menambah fitur sendiri.

Base ini dibuat oleh **Sea (Base Bot)**, dengan dasar dari project Itsuki Nakano.

## ✨ Yang Ada di Versi Base

- **Sistem plugin modular**: setiap fitur ada di satu file di folder `plugins/`, mudah ditambah atau dihapus.
- **Baileys fork sendiri** (`itsuki`) untuk koneksi WhatsApp Multi-Device.
- **Kategori plugin lengkap**: main, owner, group, download, search, tools, sticker, game, fun, dan lainnya.
- **Pairing Code atau QR Code** untuk menghubungkan WhatsApp.
- **Database JSON otomatis**: file database dibuat sendiri saat bot pertama kali jalan.

## 🗑️ Yang Dihapus dari Versi Asli

- Fitur store / jualan (order, pembayaran, dan produk).
- Model OCR (`eng.traineddata`, `ind.traineddata`).
- Cache aset, gambar stok, dan data acak (`data/shuffle`, `data/store`).
- Data user, grup, dan chat dari bot asli.
- Nomor pribadi owner dan nomor donasi (diganti placeholder `628xxxxxxxxxx` dan `08xxxxxxxxxx`).

Beberapa fitur mungkin butuh file pendukung tambahan atau API key sendiri. Cek `config.js` setelah install.

## ⚙️ Persyaratan

- **Node.js 22** atau lebih baru
- **npm** (sudah ikut terpasang bersama Node.js)
- Git (opsional, untuk clone repo)

## 🚀 Instalasi

### 1. Ambil source code

```bash
git clone <URL-REPO-KAMU> itsuki-base
cd itsuki-base
```

Atau ekstrak file zip versi base ke satu folder.

### 2. Instal dependensi

```bash
npm install
```

### 3. Konfigurasi `config.js`

Buka `config.js`, lalu isi bagian berikut:

- `owner.number`: nomor owner dengan format `628xxxxxxxxxx` (tanpa `+` dan tanpa `0` di depan).
- `session.pairingNumber`: nomor WhatsApp yang akan dijadikan bot, format sama dengan owner.
- `bot.name` dan `bot.version`: sesuaikan dengan nama botmu.
- `payment`: isi kalau memakai fitur donasi.

```javascript
session: {
    pairingNumber: '628xxxxxxxxxx',
    usePairingCode: true // true = Pairing Code, false = QR Code
},
```

### 4. Jalankan bot

```bash
npm start
```

Kalau diminta pairing, masukkan kode yang muncul di terminal ke WhatsApp kamu.

### 5. Hubungkan WhatsApp

Pilih salah satu:
- **Pairing Code**: aktifkan `usePairingCode: true`, lalu masukkan kode di WhatsApp.
- **QR Code**: set `usePairingCode: false`, lalu scan QR yang muncul di terminal.

## 🔛 Menyalakan Semua Fitur

Secara default semua plugin sudah aktif. Yang perlu kamu cek adalah pengaturan fitur di `config.js` dan pengaturan per grup.

### 1. Cek dan atur plugin

- Lihat status satu plugin: `.infoplugin <nama_plugin>`
- Nyalakan plugin yang mati (owner): `.enableplugin <nama_plugin>`
- Matikan plugin (owner): `.disableplugin <nama_plugin>`
- Setelah mengubah file plugin, muat ulang semua plugin (owner): `.rl all`

### 2. Nyalakan fitur global di `config.js`

Buka bagian `features` dan ubah nilainya menjadi `true`:

```javascript
features: {
    antiSpam: true,
    antiCall: true,
    blockIfCall: true,
    autoTyping: true,
    autoRead: true,
    logMessage: true,
    dailyLimitReset: true,
    smartTriggers: true   // default aslinya false
},
```

Bisa juga lewat chat (owner), tanpa edit file:

```
.toggle-feature smartTriggers on
```

### 3. Welcome dan goodbye

Secara default keduanya mati. Untuk menyalakannya di semua grup baru, ubah di `config.js`:

```javascript
welcome: { defaultEnabled: true },
goodbye: { defaultEnabled: true },
```

### 4. Registrasi (opsional)

Kalau mau pengguna harus daftar dulu sebelum memakai bot, ubah `registration.enabled` menjadi `true`. Biarkan `false` kalau ingin semua orang bisa langsung memakai bot.

### 5. Fitur per grup

Beberapa fitur grup seperti anti-link dan anti-toxic harus dinyalakan di setiap grup, bukan lewat `config.js`. Contohnya:

```
.antitoxic on
```

Cek daftar perintah grup lewat `.menu` di grup tersebut.

### 6. Isi API key

Fitur yang memakai API eksternal tidak akan jalan sebelum API key-nya diisi. Semua tempat yang perlu diisi ditandai dengan `ISI_API_KEY_KAMU` atau `ISI_TOKEN_KAMU`. Cari dengan:

```bash
grep -rn "ISI_API_KEY_KAMU\|ISI_TOKEN_KAMU" .
```

Di Windows, pakai fitur cari (Ctrl+Shift+F) di editor kamu.

### 7. Restart bot

Setelah mengubah `config.js`, restart bot:

```bash
npm start
```

> [!NOTE]
> Fitur store (jualan, order, pembayaran) sudah dihapus di versi base, jadi tidak ada untuk dinyalakan.

## 🧩 Menambah Plugin Sendiri

Buat file baru di folder `plugins/<kategori>/`, dengan format:

```javascript
const pluginConfig = {
    name: 'halo',
    alias: ['hai'],
    category: 'main',
    description: 'Balas halo',
    usage: '.halo',
    example: '.halo',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    return m.reply('Halo juga!')
}

module.exports = { config: pluginConfig, handler }
```

Bot akan memuat plugin ini otomatis, atau bisa dengan perintah reload dari owner.

## 🙏 Credits

-**Sea**: inspired Itsuki Nakano's project.
- **AlwaysLennz**: Creator & Owner Utama Itsuki Nakano Bot.
- **Xyrann** dan **Qynox**: Owner.
- **AlwaysLennz™**: Tim pengembang Botkano Bot.
## 📜 Lisensi

Project ini dirilis di bawah lisensi **MIT**. Lihat file [`LICENSE`](./LICENSE).
