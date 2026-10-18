/**
 * Helper argumen untuk plugin fixkit.
 */

/** Teks argumen setelah command (tanpa prefix & nama command). */
function argText(m) {
    return String(m.text || m.args?.join(' ') || '').trim()
}

/** Pisah argumen dengan "|" dan rapikan spasi. */
function splitPipe(text) {
    return String(text || '').split('|').map(s => s.trim())
}

/** Ambil teks dari pesan yang di-reply (kode plugin). */
function quotedText(m) {
    const q = m.quoted
    if (!q) return null
    return q.text || q.body || q.message?.conversation || q.message?.extendedTextMessage?.text || null
}

/** Ubah nomor / jid / "here" menjadi jid WhatsApp. */
function toJid(input, here) {
    const v = String(input || '').trim()
    if (!v || v.toLowerCase() === 'here') return here || null
    if (v.includes('@')) return v
    const digits = v.replace(/[^0-9]/g, '')
    if (!digits) return null
    return `${digits}@s.whatsapp.net`
}

/** Ambil kode dari reply, atau dari argumen berisi ``` ... ``` */
function extractCode(m) {
    const q = quotedText(m)
    if (q && q.trim()) {
        const fenced = q.match(/```(?:js|javascript)?\n?([\s\S]*?)```/)
        return fenced ? fenced[1] : q
    }
    const t = argText(m)
    const fenced = t.match(/```(?:js|javascript)?\n?([\s\S]*?)```/)
    return fenced ? fenced[1] : null
}

module.exports = { argText, splitPipe, quotedText, toJid, extractCode }
