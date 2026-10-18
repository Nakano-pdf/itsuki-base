/**
 * Kartu menu rich STATIS (tanpa animasi, tanpa tab, tanpa posisi absolut).
 * Pola ini sudah terbukti tampil penuh di frame WhatsApp (sama dengan richCard).
 * Tampilan: header sapaan + badge, bubble AI, statistik, tombol, dan navigasi bawah
 * yang berupa tombol salin perintah.
 */

const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// data: { title, subtitle, accent, greeting, userName, badges:[{text,tone}], aiLine,
//         stats:[{label,value}], buttons:[{label,copy}], nav:[{label,copy,active}], footer }
function buildMenuHtml(data = {}) {
    const accent = data.accent || '#ff4d7a'
    const badges = (data.badges || []).map(b =>
        `<span class="bdg${b.tone ? ' ' + b.tone : ''}">${esc(b.text)}</span>`
    ).join('')
    const stats = (data.stats || []).map(s =>
        `<div class="st"><div class="sl">${esc(s.label)}</div><div class="sv">${esc(s.value)}</div></div>`
    ).join('')
    const buttons = (data.buttons || []).map(b =>
        `<button class="bt" data-copy="${esc(b.copy)}">${esc(b.label)}</button>`
    ).join('')
    const nav = (data.nav || []).map(n =>
        `<button class="nv${n.active ? ' on' : ''}" data-copy="${esc(n.copy)}"><span class="ic">${esc(n.icon || '')}</span>${esc(n.label)}</button>`
    ).join('')

    return `
<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
.card{max-width:420px;margin:0 auto;border-radius:24px;background:linear-gradient(165deg,#1b1b26,#0b0b12 60%);border:2px solid rgba(255,255,255,.08);color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;padding-bottom:10px}
.hd{padding:16px 18px 14px;background:linear-gradient(135deg,${accent},#2b1a4a);border-radius:22px 22px 0 0;position:relative}
.gr{font-size:11px;letter-spacing:1.5px;text-transform:uppercase;opacity:.85}
.hd h1{font-size:19px;font-weight:800;margin-top:4px}
.hd p{font-size:12px;opacity:.85;margin-top:4px}
.hd .star{position:absolute;right:16px;top:12px;font-size:26px;opacity:.3}
.bdgs{display:flex;flex-wrap:wrap;gap:6px;padding:12px 14px 0}
.bdg{font-size:10.5px;padding:5px 10px;border-radius:14px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18)}
.bdg.hi{border-color:#ffb84d;color:#ffb84d}
.bubble{display:flex;gap:10px;align-items:flex-start;margin:12px 12px 0;padding:12px;border-radius:16px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1)}
.av{width:36px;height:36px;flex:none;border-radius:50%;background:${accent};display:flex;align-items:center;justify-content:center;font-size:17px}
.bw{font-size:10px;letter-spacing:1.2px;text-transform:uppercase;opacity:.6}
.bm{font-size:13px;line-height:1.45;margin-top:3px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px}
.st{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:10px 12px}
.sl{font-size:10px;text-transform:uppercase;letter-spacing:.6px;opacity:.6}
.sv{font-size:15px;font-weight:700;margin-top:3px;word-break:break-word}
.btns{display:flex;flex-wrap:wrap;gap:8px;padding:4px 12px 12px}
.bt{flex:1 1 45%;padding:11px 12px;border:0;border-radius:14px;background:${accent};color:#fff;font-weight:700;font-size:12.5px;cursor:pointer}
.nav{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px;margin:0 12px;padding:6px;border-radius:20px;background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.1)}
.nv{border:0;background:transparent;color:rgba(255,255,255,.7);padding:8px 0;border-radius:14px;font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px}
.nv.on{background:${accent};color:#fff}
.nv .ic{font-size:16px}
.ft{text-align:center;font-size:10.5px;opacity:.55;padding:10px 12px 0}
.toast{text-align:center;font-size:11.5px;padding:8px 12px 0;min-height:16px}
</style>
<div class="card">
  <div class="hd">
    <div class="gr">${esc(data.greeting || '')}</div>
    <h1>${esc(data.title)}</h1>
    ${data.subtitle ? `<p>${esc(data.subtitle)}</p>` : ''}
    <div class="star">★</div>
  </div>
  ${badges ? `<div class="bdgs">${badges}</div>` : ''}
  ${data.aiLine ? `<div class="bubble"><div class="av">🍥</div><div><div class="bw">AI bilang~</div><div class="bm">${esc(data.aiLine)}</div></div></div>` : ''}
  ${stats ? `<div class="grid">${stats}</div>` : ''}
  ${buttons ? `<div class="btns">${buttons}</div>` : ''}
  ${nav ? `<div class="nav">${nav}</div>` : ''}
  ${data.footer ? `<div class="ft">${esc(data.footer)}</div>` : ''}
  <div class="toast" id="toast"></div>
</div>
<script>
(function(){
  var toastEl=document.getElementById('toast'), tt=null
  function toast(t){ toastEl.textContent=t; clearTimeout(tt); tt=setTimeout(function(){ toastEl.textContent='' },2600) }
  function copy(t){
    var fb=function(){
      try{ var ta=document.createElement('textarea'); ta.value=t; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.focus(); ta.select(); var ok=document.execCommand('copy'); ta.remove(); toast(ok?'✅ Disalin! Paste di chat lalu kirim':'Gagal menyalin') }catch(e){ toast('Gagal menyalin') }
    }
    try{ if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(t).then(function(){ toast('✅ Disalin! Paste di chat lalu kirim') }).catch(fb) } else fb() }catch(e){ fb() }
  }
  document.querySelectorAll('[data-copy]').forEach(function(b){ b.addEventListener('click',function(){ copy(b.getAttribute('data-copy')) }) })
})()
</script>`
}

module.exports = { buildMenuHtml }