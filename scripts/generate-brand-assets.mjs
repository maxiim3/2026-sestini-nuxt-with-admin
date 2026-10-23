// Génère les icônes PWA et les images de partage (Open Graph) à partir du logo vectoriel.
// Usage : node scripts/generate-brand-assets.mjs [--icons-only | --og-only]  (CHROMIUM_PATH pour un Chromium précis)
import { readFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const root = new URL('..', import.meta.url)
const read = path => readFile(new URL(path, root), 'utf8')
const fontData = async path => `data:font/woff2;base64,${(await readFile(new URL(path, root))).toString('base64')}`

const emblemRond = await read('public/brand/emblem-rond.svg')
const logo = await read('public/brand/logo.svg')
const cinzel = await fontData('node_modules/@fontsource/cinzel/files/cinzel-latin-600-normal.woff2')
const fraunces = await fontData('node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-italic.woff2')
const inter = await fontData('node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2')

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
const page = await browser.newPage()

const base = `
  @font-face { font-family: Cinzel; src: url(${cinzel}); font-weight: 600; }
  @font-face { font-family: Fraunces; src: url(${fraunces}); font-style: italic; font-weight: 100 900; }
  @font-face { font-family: Inter; src: url(${inter}); font-weight: 100 900; }
  * { margin: 0; box-sizing: border-box; }
  body { background: #0e1011; }
`

async function render(html, width, height, out) {
  await page.setViewportSize({ width, height })
  await page.setContent(`<!doctype html><html><head><style>${base}</style></head><body>${html}</body></html>`)
  await page.evaluate(() => document.fonts.ready)
  const jpeg = out.endsWith('.jpg')
  await page.screenshot({ path: new URL(out, root).pathname, type: jpeg ? 'jpeg' : 'png', ...(jpeg ? { quality: 86 } : {}) })
  console.log('✓', out)
}

// Icônes : le logo rond du site d'origine (four dans sa couronne de briques), centré sur fond charbon
const icon = (size, scale) => `
  <div style="width:${size}px;height:${size}px;display:grid;place-items:center;background:#0e1011">
    <div style="width:${Math.round(size * scale)}px;height:${Math.round(size * scale)}px">${emblemRond.replace('<svg', '<svg width="100%" height="100%"')}</div>
  </div>`

if (!process.argv.includes('--og-only')) {
  for (const size of [192, 512]) await render(icon(size, 0.8), size, size, `public/icons/icon-${size}.png`)
  await render(icon(512, 0.66), 512, 512, 'public/icons/maskable-512.png')
  await render(icon(180, 0.78), 180, 180, 'public/apple-touch-icon.png')
  await render(icon(48, 0.92), 48, 48, 'public/icons/favicon-48.png')
}
if (process.argv.includes('--icons-only')) {
  await browser.close()
  process.exit(0)
}

// Images de partage 1200×630, par page et par langue
const COPY = {
  fr: { 'home': ['Pizzas à emporter', 'Pâte maison, produits de saison, cuisson au feu de bois.'], 'carte': ['La carte', 'Pizzas au feu de bois, à emporter.'], 'nous-trouver': ['Nous trouver', 'Un camion, trois villages, toute la semaine.'], 'call': 'Commande par téléphone' },
  en: { 'home': ['Pizza to take away', 'House-made dough, seasonal produce, baked over wood fire.'], 'carte': ['The menu', 'Wood-fired pizzas to take away.'], 'nous-trouver': ['Find us', 'One truck, three villages, all week long.'], 'call': 'Order by phone' },
  es: { 'home': ['Pizzas para llevar', 'Masa casera, productos de temporada, horno de leña.'], 'carte': ['La carta', 'Pizzas al horno de leña, para llevar.'], 'nous-trouver': ['Dónde estamos', 'Un camión, tres pueblos, toda la semana.'], 'call': 'Pedidos por teléfono' },
  it: { 'home': ['Pizze da asporto', 'Impasto della casa, prodotti di stagione, forno a legna.'], 'carte': ['Il menù', 'Pizze cotte a legna, da asporto.'], 'nous-trouver': ['Dove siamo', 'Un furgone, tre paesi, tutta la settimana.'], 'call': 'Ordina al telefono' },
}

const og = (title, lead, call) => `
  <div style="position:relative;width:1200px;height:630px;overflow:hidden;color:#fcf7ee;font-family:Inter;
              background:radial-gradient(ellipse 70% 60% at 50% 115%, rgba(224,170,62,.45), transparent 70%), radial-gradient(circle at 15% 10%, rgba(224,170,62,.10), transparent 40%), #0e1011">
    <div style="position:absolute;inset:28px;border:1px solid rgba(224,170,62,.35);border-radius:6px"></div>
    <div style="position:absolute;inset:36px;border:1px solid rgba(224,170,62,.15);border-radius:4px"></div>
    <div style="position:absolute;left:0;right:0;top:92px;display:flex;justify-content:center">
      <div style="width:520px">${logo.replace('<svg', '<svg width="100%" height="100%"')}</div>
    </div>
    <div style="position:absolute;left:0;right:0;top:372px;text-align:center">
      <div style="font-family:Cinzel;font-weight:600;font-size:54px;letter-spacing:.08em;text-transform:uppercase">${title}</div>
      <div style="margin-top:14px;font-family:Fraunces;font-style:italic;font-size:28px;color:rgba(252,247,238,.78)">${lead}</div>
      <div style="margin-top:34px;font-size:18px;letter-spacing:.28em;text-transform:uppercase;color:#e0aa3e">Pignan · Vic-la-Gardiole · Villeneuve-lès-Maguelone</div>
      <div style="margin-top:12px;font-size:20px;color:rgba(252,247,238,.7)">${call} · 07 88 52 91 78</div>
    </div>
  </div>`

for (const [lang, copy] of Object.entries(COPY)) {
  for (const key of ['home', 'carte', 'nous-trouver']) {
    const [title, lead] = copy[key]
    await render(og(title, lead, copy.call), 1200, 630, `public/og/${key}-${lang}.jpg`)
  }
}

await browser.close()
