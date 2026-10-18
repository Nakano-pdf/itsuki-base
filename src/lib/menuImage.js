/**
 * Menu sebagai gambar PNG (SVG -> PNG lewat sharp).
 * Layout mengikuti struktur referensi: header + theme dots, kolom pencarian,
 * kartu kategori dengan ikon kotak berwarna dan dekorasi blur, serta navigasi bawah.
 * Ikon memakai huruf di kotak berwarna (emoji sering tampil kotak di server Linux).
 */

const FONT = "Poppins, 'DejaVu Sans', Arial, sans-serif"
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const PALETTE = ['#e0457b', '#7b5cff', '#2a9d8f', '#f4a261', '#4da6ff', '#e76f51', '#8e44ad', '#16a085', '#d4a017', '#c0392b', '#3498db', '#27ae60']

// opts: { title, subtitle, role, mode, version, timeLabel, categories:[{label,count}], activeTab }
function buildMenuSvg(opts = {}) {
    const simple = !!opts.simple
    const W = 800
    const cats = (opts.categories || []).slice(0, 16)
    const cols = 2
    const tileW = 340, tileH = 150, gap = 22, gridY = 236
    const rows = Math.max(1, Math.ceil(cats.length / cols))
    const gridEnd = gridY + rows * tileH + (rows - 1) * gap
    const navY = gridEnd + 36
    const H = navY + 120


    const tiles = cats.map((c, i) => {
        const x = 40 + (i % cols) * (tileW + gap)
        const y = gridY + Math.floor(i / cols) * (tileH + gap)
        const color = PALETTE[i % PALETTE.length]
        const letter = esc(String(c.label || '?').trim().charAt(0).toUpperCase())
        return `
  <g>
    <rect x="${x}" y="${y}" width="${tileW}" height="${tileH}" rx="28" fill="url(#tile)" stroke="rgba(255,255,255,0.14)" stroke-width="2"/>
    ${simple ? '' : `<circle cx="${x + tileW - 40}" cy="${y + 30}" r="46" fill="${color}" opacity="0.28"/>`}
    <rect x="${x + 24}" y="${y + 36}" width="76" height="76" rx="24" fill="${color}"/>
    <text x="${x + 62}" y="${y + 88}" font-family="${FONT}" font-size="36" font-weight="800" text-anchor="middle" fill="#fff">${letter}</text>
    <text x="${x + 120}" y="${y + 70}" font-family="${FONT}" font-size="24" font-weight="800" fill="#fff">${esc(String(c.label).toUpperCase())}</text>
    <text x="${x + 120}" y="${y + 100}" font-family="${FONT}" font-size="18" fill="rgba(255,255,255,0.72)">${esc(c.count)} command</text>
  </g>`
    }).join('')

    const tabs = [
        { label: 'Beranda', letter: 'B' },
        { label: 'Menu', letter: 'M' },
        { label: 'Info', letter: 'I' },
        { label: 'Profil', letter: 'P' }
    ]
    const tabW = 170
    const activeTab = opts.activeTab ?? 1
    const navTabs = tabs.map((t, i) => {
        const x = 60 + i * (tabW + 0)
        const cx = x + tabW / 2
        const active = activeTab === i
        return `
    ${active ? `<rect x="${x + 4}" y="${navY + 10}" width="${tabW - 8}" height="80" rx="24" fill="url(#accent)"/>` : ''}
    <rect x="${cx - 16}" y="${navY + 22}" width="32" height="32" rx="10" fill="${active ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)'}"/>
    <text x="${cx}" y="${navY + 44}" font-family="${FONT}" font-size="16" font-weight="800" text-anchor="middle" fill="#fff">${t.letter}</text>
    <text x="${cx}" y="${navY + 74}" font-family="${FONT}" font-size="15" font-weight="700" text-anchor="middle" fill="${active ? '#fff' : 'rgba(255,255,255,0.6)'}">${esc(t.label.toUpperCase())}</text>`
    }).join('')

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2d1446"/><stop offset="0.5" stop-color="#16103a"/><stop offset="1" stop-color="#0a0f24"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ff4d8d"/><stop offset="1" stop-color="#7b5cff"/>
    </linearGradient>
    <linearGradient id="tile" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="rgba(255,255,255,0.13)"/><stop offset="1" stop-color="rgba(255,255,255,0.04)"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" rx="44" fill="url(#bg)"/>
  ${simple ? '' : `<circle cx="90" cy="${H - 200}" r="120" fill="#7b5cff" opacity="0.14"/>
  <circle cx="720" cy="300" r="110" fill="#ff4d8d" opacity="0.1"/>`}

  <rect x="40" y="34" width="76" height="76" rx="24" fill="url(#accent)"/>
  <text x="78" y="84" font-family="${FONT}" font-size="38" font-weight="800" text-anchor="middle" fill="#fff">I</text>
  <text x="140" y="70" font-family="${FONT}" font-size="32" font-weight="800" fill="#fff">${esc(opts.title || 'Itsuki Nakano')}</text>
  <circle cx="148" cy="96" r="6" fill="#2ecc71"/>
  <text x="162" y="101" font-family="${FONT}" font-size="17" font-weight="700" fill="rgba(255,255,255,0.85)">ONLINE  •  ${esc(opts.version || '')}</text>
  <circle cx="630" cy="72" r="13" fill="#ff4d8d"/><circle cx="682" cy="72" r="13" fill="#4da6ff"/><circle cx="734" cy="72" r="13" fill="#ffb84d"/>

  <g font-family="${FONT}" font-size="17" font-weight="700">
    <rect x="40" y="128" width="170" height="44" rx="22" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.25)"/>
    <text x="125" y="156" text-anchor="middle" fill="#fff">${esc(opts.role || 'USER')}</text>
    <rect x="226" y="128" width="150" height="44" rx="22" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.25)"/>
    <text x="301" y="156" text-anchor="middle" fill="#fff">${esc(opts.mode || 'PUBLIC')}</text>
    <rect x="392" y="128" width="210" height="44" rx="22" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.25)"/>
    <text x="497" y="156" text-anchor="middle" fill="#fff">${esc(opts.timeLabel || '')}</text>
  </g>

  <rect x="40" y="190" width="720" height="30" rx="15" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.12)"/>
  <text x="66" y="211" font-family="${FONT}" font-size="16" fill="rgba(255,255,255,0.6)">${esc(opts.subtitle || 'Ketik .menurich <kategori>')}</text>

  ${tiles}

  <rect x="40" y="${navY}" width="720" height="104" rx="34" fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.12)"/>
  ${navTabs}
</svg>`
}

// SVG -> PNG (sharp dari dependensi project; librsvg sudah dibundel di dalamnya)
async function renderMenuPng(svg, fallbackSvg) {
    const sharp = require('sharp')
    try {
        return await sharp(Buffer.from(svg)).png().toBuffer()
    } catch (e) {
        console.error('[menuImage] SVG lengkap gagal:', e?.message || e)
        if (!fallbackSvg) throw e
        return sharp(Buffer.from(fallbackSvg)).png().toBuffer()
    }
}

module.exports = { buildMenuSvg, renderMenuPng }