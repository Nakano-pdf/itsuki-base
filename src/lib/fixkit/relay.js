/**
 * Fixkit relay — meneruskan (forward) pesan dari satu chat ke chat lain.
 * Aturan disimpan di database/fixkit/relay.json. Dipanggil dari handler untuk setiap pesan masuk.
 */
const store = require('./store')

const LOOP_GUARD_TAG = '[Relay]'

/** Forward pesan asli (media, teks, dokumen) ke semua tujuan yang aktif. */
async function forward(m, sock, rawMsg) {
    if (!m || !sock || !m.chat) return 0
    if (m.fromMe) return 0
    if (typeof m.text === 'string' && m.text.startsWith(LOOP_GUARD_TAG)) return 0

    const rules = store.getRelays()
    const targets = rules.filter(r => r.active && r.from === m.chat && r.to !== m.chat)
    if (!targets.length) return 0

    let sent = 0
    for (const rule of targets) {
        try {
            if (rawMsg) {
                await sock.sendMessage(rule.to, { forward: rawMsg, force: true })
            } else {
                await sock.sendMessage(rule.to, { text: `${LOOP_GUARD_TAG} ${m.text || ''}`.trim() })
            }
            rule.count = (rule.count || 0) + 1
            rule.lastAt = new Date().toISOString()
            sent++
        } catch (e) {
            rule.lastError = e.message
        }
    }
    store.saveRelays(rules)
    return sent
}

function addRule({ from, to }) {
    const rules = store.getRelays()
    const id = (rules.reduce((n, r) => Math.max(n, r.id), 0) || 0) + 1
    const rule = { id, from, to, active: true, count: 0, createdAt: new Date().toISOString() }
    rules.push(rule)
    store.saveRelays(rules)
    return rule
}

function setActive(id, active) {
    const rules = store.getRelays()
    const r = rules.find(x => x.id === Number(id))
    if (!r) return null
    r.active = active
    store.saveRelays(rules)
    return r
}

function deleteRule(id) {
    const rules = store.getRelays()
    const idx = rules.findIndex(x => x.id === Number(id))
    if (idx < 0) return false
    rules.splice(idx, 1)
    store.saveRelays(rules)
    return true
}

module.exports = { forward, addRule, setActive, deleteRule, store, LOOP_GUARD_TAG }
