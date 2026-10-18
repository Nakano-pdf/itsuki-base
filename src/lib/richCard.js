/**
 * Kartu Rich HTML bersama (dipakai plugin statusrich, profilrich, dst).
 * Tampilan gelap, statistik dalam grid, dan tombol yang menyalin perintah.
 */

const { AIRich } = require('./aiRich')

const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// opts: { title, subtitle, stats: [{label, value}], buttons: [{label, copy}], accent }
function buildRichCardHtml(opts = {}) {
    const accent = opts.accent || '#ff4d7a'
    const hero = opts.heroB64
        ? `<img class="hero" alt="" src="data:${esc(opts.heroMime || 'image/jpeg')};base64,${opts.heroB64}">`
        : ''
    const stats = (opts.stats || []).map(s =>
        `<div class="st"><div class="sl">${esc(s.label)}</div><div class="sv">${esc(s.value)}</div></div>`
    ).join('')
    const tabs = (opts.tabs || []).map(t =>
        `<button class="tab${t.active ? ' on' : ''}" data-copy="${esc(t.copy)}">${esc(t.label)}</button>`
    ).join('')
    const buttons = (opts.buttons || []).map((b, i) =>
        `<button class="bt" data-copy="${esc(b.copy)}" data-i="${i}">${esc(b.label)}</button>`
    ).join('')

    return `
<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html,body{background:transparent!important}
body{color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;padding:2px;user-select:none;-webkit-user-select:none}
.card{max-width:420px;margin:0 auto;border-radius:24px;overflow:hidden;background:linear-gradient(165deg,#1a1a24,#0b0b12 60%);border:2px solid rgba(255,255,255,.08);box-shadow:0 10px 30px rgba(0,0,0,.5)}
.hd{padding:18px 18px 14px;background:linear-gradient(135deg,${accent},#2b1a4a);position:relative}
.hd h1{font-size:18px;font-weight:800;letter-spacing:.3px}
.hd p{font-size:12px;opacity:.85;margin-top:4px}
.hd:after{content:"★";position:absolute;right:16px;top:10px;font-size:34px;opacity:.25}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px}
.st{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:10px 12px}
.sl{font-size:10.5px;text-transform:uppercase;letter-spacing:.6px;opacity:.6}
.sv{font-size:15px;font-weight:700;margin-top:3px;word-break:break-word}
.btns{display:flex;flex-wrap:wrap;gap:8px;padding:4px 12px 14px}
.bt{flex:1 1 45%;padding:10px 12px;border:0;border-radius:14px;background:${accent};color:#fff;font-weight:700;font-size:12.5px;cursor:pointer}
.bt:active{transform:scale(.97);opacity:.85}
.hero{width:100%;display:block;max-height:200px;object-fit:cover}
.tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:0 12px 10px}
.tab{border:0;border-radius:14px;background:rgba(255,255,255,.08);color:#fff;padding:9px 4px;font-size:11px;font-weight:700;letter-spacing:.5px;cursor:pointer}
.tab.on{background:${accent}}
.toast{text-align:center;font-size:11.5px;opacity:0;transition:opacity .25s;padding:0 12px 12px;min-height:14px}
.toast.show{opacity:1}
</style>
<div class="card">
  ${hero}
  <div class="hd">
    <h1>${esc(opts.title)}</h1>
    ${opts.subtitle ? `<p>${esc(opts.subtitle)}</p>` : ''}
  </div>
  <div class="grid">${stats}</div>
  ${tabs ? `<div class="tabs">${tabs}</div>` : ''}
  <div class="btns">${buttons}</div>
  <div class="toast" id="toast"></div>
</div>
<script>
(function(){
  var toastEl=document.getElementById('toast'), tt=null
  function toast(t){ toastEl.textContent=t; toastEl.classList.add('show'); clearTimeout(tt); tt=setTimeout(function(){ toastEl.classList.remove('show') },2600) }
  function copy(t){
    var fb=function(){
      try{
        var ta=document.createElement('textarea'); ta.value=t; ta.style.position='fixed'; ta.style.opacity='0'
        document.body.appendChild(ta); ta.focus(); ta.select()
        var ok=document.execCommand('copy'); ta.remove()
        toast(ok?'✅ Disalin! Paste di chat lalu kirim':'Gagal menyalin')
      }catch(e){ toast('Gagal menyalin') }
    }
    try{
      if(navigator.clipboard&&navigator.clipboard.writeText){
        navigator.clipboard.writeText(t).then(function(){ toast('✅ Disalin! Paste di chat lalu kirim') }).catch(fb)
      } else fb()
    }catch(e){ fb() }
  }
  document.querySelectorAll('.bt,.tab').forEach(function(b){
    b.addEventListener('click',function(){ copy(b.getAttribute('data-copy')) })
  })
})()
</script>`
}

// Kirim kartu sebagai rich message satu kali (AIRich di project ini tidak punya sendEdit)
async function sendRichCard(sock, m, { title, footer, html, imageUrl }) {
    const rich = new AIRich(sock).setTitle(title).setFooter(footer || '')
    if (imageUrl) rich.addImage(imageUrl)
    rich.addSection({
            view_model: {
                __typename: 'GenAISingleLayoutViewModel',
                primitive: {
                    __typename: 'GenAIaeacdsnwHtmlPrimitive',
                    trusted_sources: ['https://i.pinimg.com'],
                    payload: html
                }
            }
        })
    return rich.send(m.chat, { quoted: m })
}

module.exports = { buildRichCardHtml, sendRichCard, esc }