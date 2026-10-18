// Bangun HTML kartu AM Finder (tampilan mirip screenshot referensi).

const PLATFORM_LABEL = {
    tiktok: 'TIKTOK', youtube: 'YOUTUBE', instagram: 'INSTAGRAM',
    facebook: 'FACEBOOK', twitter: 'X', threads: 'THREADS',
    capcut: 'CAPCUT', direct: 'DIRECT', general: 'LINK'
}

function esc(s = '') {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

function shorten(s = '', max = 60) {
    return s.length > max ? s.slice(0, max - 1) + '…' : s
}

function categorize(url) {
    if (/alight\.link|alightcreative\.com/i.test(url)) return 'ALIGHT'
    if (/drive\.google|mediafire|sfile\.mobi/i.test(url)) return 'DRIVE'
    if (/whatsapp\.com/i.test(url)) return 'WA'
    return 'LAIN'
}

const CAT_META = {
    ALIGHT: { label: 'Alight Motion', color: '#22c55e', bg: '#11281c', border: '#1f5a36' },
    DRIVE:  { label: 'File Drive',    color: '#3b82f6', bg: '#14203a', border: '#27457f' },
    WA:     { label: 'WhatsApp',      color: '#22c55e', bg: '#11281c', border: '#1f5a36' },
    LAIN:   { label: 'Link',          color: '#a1a1aa', bg: '#1f1f26', border: '#34343f' }
}

function buildAmCardHtml(r, { description = '' } = {}) {
    const counts = { ALIGHT: 0, DRIVE: 0, WA: 0, LAIN: 0 }
    for (const p of r.presetLinks) counts[categorize(p.url)]++

    const platform = PLATFORM_LABEL[r.platform] || String(r.platform || 'LINK').toUpperCase()
    const author = r.author || '-'
    const initial = esc((author.replace(/^@/, '')[0] || '?').toUpperCase())
    const total = r.presetLinks.length
    const headline = r.found ? `${total} link ditemukan` : 'Tidak ditemukan'
    const quote = esc(shorten(description || r.title || '', 160))

    const rows = r.presetLinks.slice(0, 6).map((p, i) => {
        const cat = categorize(p.url)
        const meta = CAT_META[cat]
        const pw = p.password ? `<span class="pw">PW: ${esc(p.password)}</span>` : ''
        return `
        <div class="row" style="background:${meta.bg};border-color:${meta.border}">
            <div class="num" style="background:${meta.color}">${i + 1}</div>
            <div class="info">
                <div class="label">${esc(meta.label)} ${cat === 'DRIVE' ? '<span class="tag">FILE</span>' : ''} ${pw}</div>
                <div class="url">${esc(shorten(p.url, 46))}</div>
            </div>
            <div class="open">↗</div>
        </div>`
    }).join('')

    const first = r.presetLinks.find(p => p.type === '5mb') || r.presetLinks[0]
    const importBtn = first
        ? `<div class="btn red">↓ Import to AM</div>`
        : ''
    const dlBtn = first
        ? `<div class="btn dark">↓ Download</div>`
        : `<div class="btn dark">Coba link lain</div>`

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0b0b10; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5; }
  #card { width: 400px; padding: 16px; background: #15151c; }
  .panel { background: linear-gradient(180deg, #2a1215 0%, #1b1b23 60%); border-radius: 18px; border: 1px solid #2f2f3a; padding: 16px; }
  .head { display: flex; align-items: center; gap: 12px; }
  .ico { width: 44px; height: 44px; border-radius: 12px; background: #e62117; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #fff; }
  .title { flex: 1; }
  .title h1 { font-size: 17px; font-weight: 700; }
  .title p { font-size: 12px; color: #a1a1aa; margin-top: 2px; }
  .live { font-size: 11px; font-weight: 700; color: #ff5b5b; border: 1px solid #7f1d1d; background: #2a1012; padding: 4px 10px; border-radius: 999px; }
  .platform { font-size: 10px; font-weight: 700; background: #e62117; color: #fff; padding: 2px 8px; border-radius: 6px; margin-left: 6px; }
  .divider { height: 1px; background: #2f2f3a; margin: 14px 0; }
  .author { display: flex; align-items: center; gap: 10px; }
  .avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #f472b6, #8b5cf6); display: flex; align-items: center; justify-content: center; font-weight: 700; }
  .author .name { font-size: 14px; font-weight: 700; }
  .author .handle { font-size: 12px; color: #a1a1aa; }
  .stats { display: flex; gap: 8px; margin-top: 12px; }
  .stat { flex: 1; border-radius: 12px; padding: 10px 6px; text-align: center; border: 1px solid; }
  .stat .n { font-size: 20px; font-weight: 800; }
  .stat .t { font-size: 10px; letter-spacing: 1px; color: #a1a1aa; margin-top: 2px; }
  .quote { margin-top: 12px; background: #1e1e27; border-left: 4px solid #e62117; border-radius: 10px; padding: 10px 12px; font-size: 12px; color: #d4d4d8; line-height: 1.4; }
  .list { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
  .row { display: flex; align-items: center; gap: 10px; border: 1px solid; border-radius: 12px; padding: 10px; }
  .num { width: 28px; height: 28px; border-radius: 8px; color: #fff; font-weight: 800; font-size: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .info { flex: 1; min-width: 0; }
  .label { font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .tag { font-size: 9px; background: #1e3a8a; color: #bfdbfe; padding: 1px 6px; border-radius: 6px; }
  .pw { font-size: 10px; color: #fbbf24; }
  .url { font-size: 11px; color: #a1a1aa; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .open { width: 30px; height: 30px; border-radius: 8px; background: #26262f; border: 1px solid #3a3a46; display: flex; align-items: center; justify-content: center; color: #d4d4d8; font-size: 14px; flex-shrink: 0; }
  .btns { display: flex; gap: 10px; margin-top: 14px; }
  .btn { flex: 1; text-align: center; padding: 12px 0; border-radius: 12px; font-size: 14px; font-weight: 700; }
  .btn.red { background: #e62117; color: #fff; }
  .btn.dark { background: #26262f; color: #e4e4e7; border: 1px solid #3a3a46; }
  .foot { display: flex; justify-content: space-between; font-size: 11px; color: #71717a; margin-top: 12px; }
</style>
</head>
<body>
<div id="card">
  <div class="panel">
    <div class="head">
      <div class="ico">▶</div>
      <div class="title">
        <h1>AM Finder <span class="platform">${esc(platform)}</span></h1>
        <p>${esc(headline)}</p>
      </div>
      <div class="live">● LIVE</div>
    </div>

    <div class="divider"></div>

    <div class="author">
      <div class="avatar">${initial}</div>
      <div>
        <div class="name">${esc(author.replace(/^@/, ''))}</div>
        <div class="handle">${esc(author.startsWith('@') ? author : '')}</div>
      </div>
    </div>

    <div class="stats">
      <div class="stat" style="background:${CAT_META.ALIGHT.bg};border-color:${CAT_META.ALIGHT.border}">
        <div class="n" style="color:${CAT_META.ALIGHT.color}">${counts.ALIGHT}</div><div class="t">ALIGHT</div></div>
      <div class="stat" style="background:${CAT_META.DRIVE.bg};border-color:${CAT_META.DRIVE.border}">
        <div class="n" style="color:${CAT_META.DRIVE.color}">${counts.DRIVE}</div><div class="t">DRIVE</div></div>
      <div class="stat" style="background:${CAT_META.WA.bg};border-color:${CAT_META.WA.border}">
        <div class="n" style="color:${CAT_META.WA.color}">${counts.WA}</div><div class="t">WA</div></div>
    </div>

    ${quote ? `<div class="quote">${quote}</div>` : ''}

    <div class="list">${rows}</div>

    <div class="btns">${importBtn}${dlBtn}</div>

    <div class="foot">
      <span>${esc(platform)} • ${total} link</span>
      <span></span>
    </div>
  </div>
</div>
</body>
</html>`
}

module.exports = { buildAmCardHtml, categorize }
