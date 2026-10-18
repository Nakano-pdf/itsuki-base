/**
 * COPYWEB — Public Website Snapshot / Static Copier
 * Compatible with Itsuki-style plugin loader:
 *   pluginConfig + handler + module.exports
 *
 * Commands:
 *   .copyweb <url>
 *   .copyweb <url> --html
 *   .copyweb <url> --assets
 *   .copyweb <url> --zip
 *
 * Or reply to a message containing a public URL:
 *   .copyweb
 *
 * Scope:
 * - Copies public, unauthenticated pages only.
 * - Does NOT copy cookies, sessions, login credentials, private data,
 *   paywall bypasses, robots.txt bypasses, or authenticated content.
 * - Designed for creating a local static snapshot for development,
 *   archival, testing, or redesign work.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { URL } = require('url');
const http = require('http');
const https = require('https');
const { execFile } = require('child_process');

let cheerio = null;
try { cheerio = require('cheerio'); } catch (_) {}

const pluginConfig = {
  name: 'copyweb',
  command: ['copyweb', 'webcopy', 'sitecopy'],
  aliases: ['copyweb', 'webcopy', 'sitecopy'],
  category: 'tools',
  description: 'Membuat snapshot statis website publik beserta asset yang dapat diunduh.',
  usage: '.copyweb <url>',
  version: '2.0.0',
  ownerOnly: false,
  limit: true
};

const MAX_HTML = 5 * 1024 * 1024;
const MAX_ASSET = 15 * 1024 * 1024;
const MAX_ASSETS = 80;
const TIMEOUT = 15000;
const JOB_TTL = 10 * 60 * 1000;

const jobs = new Map();

function cleanText(v, max = 1000) {
  return String(v || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function reply(ctx, text, extra) {
  if (typeof ctx.reply === 'function') return ctx.reply(text, extra);
  if (typeof ctx.sendMessage === 'function') return ctx.sendMessage(text, extra);
  if (typeof ctx.send === 'function') return ctx.send(text, extra);
  throw new Error('Context tidak menyediakan reply/sendMessage/send.');
}

function getText(ctx) {
  return ctx?.text || ctx?.body || ctx?.message?.conversation ||
    ctx?.message?.extendedTextMessage?.text || '';
}

function getQuotedText(ctx) {
  const q = ctx?.quoted || ctx?.quotedMessage || ctx?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (!q) return '';
  return q.text || q.body || q.conversation ||
    q?.extendedTextMessage?.text || '';
}

function extractUrl(text) {
  const m = String(text || '').match(/https?:\/\/[^\s<>"']+/i);
  return m ? m[0].replace(/[),.;]+$/, '') : null;
}

function safeName(s, fallback = 'asset') {
  return String(s || fallback)
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 100) || fallback;
}

function sha1(s) {
  return crypto.createHash('sha1').update(s).digest('hex').slice(0, 12);
}

function extFromType(type, fallback = '.bin') {
  const t = String(type || '').split(';')[0].toLowerCase();
  const map = {
    'text/css': '.css',
    'text/javascript': '.js',
    'application/javascript': '.js',
    'application/x-javascript': '.js',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'font/woff': '.woff',
    'font/woff2': '.woff2',
    'application/font-woff': '.woff',
    'application/vnd.ms-fontobject': '.eot',
    'font/ttf': '.ttf',
    'font/otf': '.otf',
    'application/json': '.json',
    'text/html': '.html'
  };
  return map[t] || fallback;
}

function isPrivateHost(hostname) {
  const h = String(hostname || '').toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost') || h === '::1') return true;
  if (/^(127|10)\./.test(h)) return true;
  if (/^192\.168\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(h)) return true;
  if (/^169\.254\./.test(h)) return true;
  if (h === '0.0.0.0') return true;
  return false;
}

function validatePublicUrl(raw) {
  let u;
  try { u = new URL(raw); } catch { throw new Error('URL tidak valid.'); }
  if (!/^https?:$/.test(u.protocol)) throw new Error('Hanya URL HTTP/HTTPS yang didukung.');
  if (u.username || u.password) throw new Error('URL dengan username/password tidak diperbolehkan.');
  if (isPrivateHost(u.hostname)) throw new Error('Host lokal/private tidak diperbolehkan.');
  return u;
}

function requestBuffer(urlObj, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('Terlalu banyak redirect.'));
    const u = validatePublicUrl(urlObj.toString());
    const lib = u.protocol === 'https:' ? https : http;

    const req = lib.get(u, {
      headers: {
        'User-Agent': 'Itsuki-CopyWeb/2.0 (+public-static-snapshot)',
        'Accept': '*/*',
        'Accept-Encoding': 'identity'
      },
      timeout: TIMEOUT
    }, res => {
      const status = res.statusCode || 0;
      const loc = res.headers.location;
      if ([301,302,303,307,308].includes(status) && loc) {
        res.resume();
        try {
          const next = new URL(loc, u);
          return requestBuffer(next, redirects + 1).then(resolve, reject);
        } catch {
          return reject(new Error('Redirect tidak valid.'));
        }
      }
      if (status < 200 || status >= 400) {
        res.resume();
        return reject(new Error(`HTTP ${status}`));
      }

      const chunks = [];
      let total = 0;
      const limit = MAX_ASSET;
      res.on('data', c => {
        total += c.length;
        if (total > limit) {
          req.destroy();
          return reject(new Error('File terlalu besar.'));
        }
        chunks.push(c);
      });
      res.on('end', () => resolve({
        url: u.toString(),
        status,
        type: res.headers['content-type'] || 'application/octet-stream',
        buffer: Buffer.concat(chunks)
      }));
    });
    req.on('timeout', () => req.destroy(new Error('Request timeout.')));
    req.on('error', reject);
  });
}

function parseHtml(buffer, type) {
  const text = buffer.toString('utf8');
  if (!/text\/html|application\/xhtml\+xml/i.test(type)) return text;
  return text;
}

function absoluteUrl(base, raw) {
  try {
    if (!raw || /^(data:|javascript:|mailto:|tel:|#)/i.test(raw.trim())) return null;
    return new URL(raw.trim(), base).toString();
  } catch { return null; }
}

function collectAssets(html, baseUrl) {
  const found = new Set();
  if (!cheerio) {
    const re = /(?:src|href|poster|content)\s*=\s*["']([^"']+)["']/gi;
    let m;
    while ((m = re.exec(html)) && found.size < MAX_ASSETS) {
      const a = absoluteUrl(baseUrl, m[1]);
      if (a && /\.(css|js|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|otf)(?:[?#].*)?$/i.test(a))
        found.add(a);
    }
    return [...found];
  }

  const $ = cheerio.load(html, { decodeEntities: false });
  const attrs = [
    ['link[rel="stylesheet"]', 'href'],
    ['script[src]', 'src'],
    ['img[src]', 'src'],
    ['img[data-src]', 'data-src'],
    ['source[src]', 'src'],
    ['source[srcset]', 'srcset'],
    ['video[poster]', 'poster'],
    ['audio[src]', 'src'],
    ['video[src]', 'src'],
    ['link[rel="icon"]', 'href'],
    ['link[rel="shortcut icon"]', 'href']
  ];

  for (const [sel, attr] of attrs) {
    $(sel).each((_, el) => {
      if (found.size >= MAX_ASSETS) return false;
      const raw = $(el).attr(attr);
      if (!raw) return;
      if (attr === 'srcset') {
        raw.split(',').forEach(x => {
          const u = absoluteUrl(baseUrl, x.trim().split(/\s+/)[0]);
          if (u) found.add(u);
        });
      } else {
        const u = absoluteUrl(baseUrl, raw);
        if (u) found.add(u);
      }
    });
  }
  return [...found].slice(0, MAX_ASSETS);
}

function rewriteAssetReferences(html, mapping) {
  if (!cheerio) {
    for (const [remote, local] of mapping) {
      const esc = remote.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      html = html.replace(new RegExp(esc, 'g'), local);
    }
    return html;
  }

  const $ = cheerio.load(html, { decodeEntities: false });
  const map = new Map(mapping);

  $('link[href], script[src], img[src], img[data-src], source[src], video[src], audio[src], video[poster]').each((_, el) => {
    for (const attr of ['href','src','data-src','poster']) {
      const v = $(el).attr(attr);
      if (v && map.has(v)) $(el).attr(attr, map.get(v));
      else {
        const resolved = v ? [...map.keys()].find(k => k === v) : null;
        if (resolved) $(el).attr(attr, map.get(resolved));
      }
    }
  });

  return $.html();
}

async function buildSnapshot(targetUrl, options = {}) {
  const root = await requestBuffer(new URL(targetUrl));
  if (!/text\/html|application\/xhtml\+xml/i.test(root.type)) {
    throw new Error('URL tersebut bukan halaman HTML publik.');
  }
  if (root.buffer.length > MAX_HTML) throw new Error('HTML terlalu besar.');

  const html = parseHtml(root.buffer, root.type);
  const assets = collectAssets(html, root.url);
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'itsuki-copyweb-'));
  const assetDir = path.join(work, 'assets');
  fs.mkdirSync(assetDir, { recursive: true });

  const manifest = {
    tool: 'Itsuki CopyWeb',
    version: pluginConfig.version,
    source: root.url,
    createdAt: new Date().toISOString(),
    assets: [],
    notes: [
      'Public unauthenticated static snapshot.',
      'Dynamic server-side functionality is not copied.'
    ]
  };

  const mapping = [];
  let downloaded = 0;

  for (const assetUrl of assets) {
    try {
      const r = await requestBuffer(new URL(assetUrl));
      const u = new URL(r.url);
      const base = path.basename(u.pathname) || 'asset';
      const ext = path.extname(base) || extFromType(r.type);
      const name = `${safeName(path.basename(base, ext), 'asset')}-${sha1(r.url)}${ext}`;
      const rel = path.join('assets', name).replace(/\\/g, '/');
      fs.writeFileSync(path.join(work, rel), r.buffer);
      mapping.push([assetUrl, rel]);
      mapping.push([r.url, rel]);
      manifest.assets.push({ url: r.url, local: rel, type: r.type, bytes: r.buffer.length });
      downloaded++;
    } catch (e) {
      manifest.assets.push({ url: assetUrl, error: cleanText(e.message, 200) });
    }
  }

  const finalHtml = rewriteAssetReferences(html, mapping);
  fs.writeFileSync(path.join(work, 'index.html'), finalHtml, 'utf8');

  const meta = [
    '# Itsuki CopyWeb Snapshot',
    '',
    `Source: ${root.url}`,
    `Created: ${manifest.createdAt}`,
    `HTML bytes: ${root.buffer.length}`,
    `Assets found: ${assets.length}`,
    `Assets downloaded: ${downloaded}`,
    '',
    'This is a static public-page snapshot. Server-side APIs, databases, authentication,',
    'private content and user sessions are intentionally not copied.'
  ].join('\n');
  fs.writeFileSync(path.join(work, 'README.txt'), meta, 'utf8');
  fs.writeFileSync(path.join(work, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  return { work, root, assetsFound: assets.length, downloaded, manifest };
}

function zipDir(sourceDir, outFile) {
  return new Promise((resolve, reject) => {
    // Prefer system zip if available. It is standard on most Pterodactyl Linux images.
    execFile('zip', ['-qr', outFile, '.'], { cwd: sourceDir, timeout: 60000 }, err => {
      if (!err) return resolve(outFile);
      reject(new Error('Gagal membuat ZIP. Pastikan utilitas "zip" tersedia di server.'));
    });
  });
}

function cleanupLater(work) {
  setTimeout(() => {
    try { fs.rmSync(work, { recursive: true, force: true }); } catch {}
  }, JOB_TTL);
}

function menuText() {
  return [
    '╭─❖ *COPYWEB* ❖─╮',
    '│',
    '│ 🌐 *Public Website Snapshot*',
    '│',
    '│ Pilih mode:',
    '│',
    '│ 1. 📄 HTML — ambil halaman',
    '│ 2. 🎨 ASSETS — HTML + CSS/JS/media',
    '│ 3. 📦 ZIP — snapshot lengkap',
    '│ 4. 🔍 ANALYZE — detail halaman',
    '│',
    '╰─────────────────╯',
    '',
    'Kirim URL publik, contoh:',
    '.copyweb https://example.com',
  ].join('\n');
}

function buttonRows() {
  return [{
    title: 'COPYWEB',
    rows: [
      { title: '📄 HTML', rowId: 'copyweb:html', description: 'Ambil HTML halaman publik' },
      { title: '🎨 ASSETS', rowId: 'copyweb:assets', description: 'HTML + asset yang ditemukan' },
      { title: '📦 ZIP', rowId: 'copyweb:zip', description: 'Buat snapshot siap diunduh' },
      { title: '🔍 ANALYZE', rowId: 'copyweb:analyze', description: 'Analisis struktur halaman' }
    ]
  }];
}

async function run(ctx, url, mode = 'zip') {
  const u = validatePublicUrl(url);
  await reply(ctx, `⏳ *COPYWEB*\n\nMenganalisis:\n${u.toString()}\n\nMohon tunggu...`);

  const result = await buildSnapshot(u.toString(), { mode });
  const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  jobs.set(id, result.work);
  cleanupLater(result.work);

  const htmlPath = path.join(result.work, 'index.html');
  if (mode === 'html') {
    const stat = fs.statSync(htmlPath);
    if (stat.size > 7 * 1024 * 1024) throw new Error('index.html terlalu besar untuk dikirim sebagai dokumen.');
    if (typeof ctx.sendFile === 'function') {
      await ctx.sendFile(htmlPath, 'index.html', 'HTML snapshot');
    } else {
      await reply(ctx, `✅ HTML selesai.\n\nAsset ditemukan: ${result.assetsFound}\nAsset diunduh: ${result.downloaded}\n\nPath sementara: ${htmlPath}`);
    }
    return;
  }

  if (mode === 'analyze') {
    const m = result.manifest;
    const lines = [
      '╭─❖ *COPYWEB ANALYZE* ❖─╮',
      `│ 🌐 URL: ${m.source}`,
      `│ 📄 HTML: ${result.root.buffer.length.toLocaleString()} bytes`,
      `│ 📦 Asset ditemukan: ${result.assetsFound}`,
      `│ ✅ Asset berhasil: ${result.downloaded}`,
      '│',
      '│ File:',
      '│ • index.html',
      '│ • manifest.json',
      '│ • README.txt',
      '│ • assets/*',
      '╰────────────────────────╯'
    ];
    await reply(ctx, lines.join('\n'));
    return;
  }

  const out = path.join(os.tmpdir(), `copyweb-${Date.now()}.zip`);
  await zipDir(result.work, out);

  if (typeof ctx.sendFile === 'function') {
    await ctx.sendFile(out, path.basename(out), `COPYWEB selesai • ${result.downloaded} asset`);
  } else {
    await reply(ctx, `✅ Snapshot selesai.\nAsset: ${result.downloaded}/${result.assetsFound}\nZIP: ${out}`);
  }
  try { fs.unlinkSync(out); } catch {}
}

async function handler(ctx, { args = [], command = '', text = '' } = {}) {
  try {
    const input = [args.join(' '), text, getText(ctx), getQuotedText(ctx)].filter(Boolean).join(' ');
    const url = extractUrl(input);

    if (!url) {
      return reply(ctx, menuText(), {
        buttons: buttonRows()
      }).catch(() => reply(ctx, menuText()));
    }

    // Optional suffix:
    // .copyweb URL --html / --assets / --analyze / --zip
    const lower = input.toLowerCase();
    let mode = 'zip';
    if (lower.includes('--html')) mode = 'html';
    else if (lower.includes('--assets')) mode = 'zip';
    else if (lower.includes('--analyze')) mode = 'analyze';

    await run(ctx, url, mode);
  } catch (err) {
    return reply(ctx,
      `❌ *COPYWEB ERROR*\n\n> ${cleanText(err.message || err, 600)}\n\n` +
      `Pastikan URL adalah website publik HTTP/HTTPS dan tidak membutuhkan login.`
    );
  }
}

module.exports = {
  config: pluginConfig,
  handler
};
