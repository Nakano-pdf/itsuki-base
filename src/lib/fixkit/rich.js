/**
 * Fixkit rich — ubah plugin biasa menjadi versi "Rich":
 * setiap balasan m.reply(...) dikirim sebagai panel interaktif dengan tombol
 * (📋 Salin, 🔄 Ulangi, 📁 Kirim .txt).
 */
const { checkSyntax } = require('./codegen')

const IMPORT_LINE = "const { richReply } = require('../../src/lib/fixkit/ui')"

/**
 * @returns {{ code, count, changes: string[], syntax: {ok, error} }}
 */
function richify(raw) {
    const changes = []
    let code = String(raw).replace(/\r\n/g, '\n')

    if (code.includes('richReply(')) {
        return { code, count: 0, changes: ['sudah rich — tidak ada perubahan'], syntax: checkSyntax(code) }
    }

    // m.reply(x) → richReply(m, x); juga menangkap "await m.reply("
    let count = 0
    code = code.replace(/\bm\.reply\(/g, () => { count++; return 'richReply(m, ' })
    if (count) changes.push(`${count}× m.reply → richReply (panel + tombol)`)

    // sisipkan import setelah baris require terakhir di bagian atas file
    const lines = code.split('\n')
    let lastReq = -1
    for (let i = 0; i < lines.length && i < 60; i++) {
        if (/^\s*(const|let|var)\s+.*require\(/.test(lines[i]) || /^\s*const\s*\{.*\}\s*=\s*require/.test(lines[i])) lastReq = i
    }
    lines.splice(lastReq + 1, 0, IMPORT_LINE)
    code = lines.join('\n')
    changes.push('menambah import richReply')

    return { code, count, changes, syntax: checkSyntax(code) }
}

module.exports = { richify, IMPORT_LINE }
