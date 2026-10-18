// Render kartu AM Finder dari HTML jadi PNG memakai puppeteer-core + @sparticuz/chromium
// (sudah ada di package.json bot). Dipanggil dari plugin amfind.

const puppeteer = require('puppeteer-core')
const chromium = require('@sparticuz/chromium')

let browserPromise = null

function getBrowser() {
    if (!browserPromise) {
        browserPromise = chromium.executablePath()
            .then((executablePath) => puppeteer.launch({
                executablePath,
                args: chromium.args,
                headless: true,
                defaultViewport: { width: 420, height: 800, deviceScaleFactor: 2 }
            }))
            .catch((err) => {
                browserPromise = null
                throw err
            })
    }
    return browserPromise
}

async function renderHtmlToPng(html, { width = 420 } = {}) {
    const browser = await getBrowser()
    const page = await browser.newPage()
    try {
        await page.setViewport({ width, height: 800, deviceScaleFactor: 2 })
        await page.setContent(html, { waitUntil: 'load', timeout: 15000 })
        const el = await page.$('#card')
        return await el.screenshot({ type: 'png' })
    } finally {
        await page.close().catch(() => {})
    }
}

module.exports = { renderHtmlToPng }
