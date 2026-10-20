// Captures d'écran du manifeste PWA. Nécessite le site lancé (BASE_URL, défaut http://localhost:3000).
import { chromium } from '@playwright/test'

const base = process.env.BASE_URL ?? 'http://localhost:3000'
const out = new URL('../public/screenshots/', import.meta.url).pathname
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})

async function shot(path, file, viewport, scale) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: scale, reducedMotion: 'reduce' })
  const page = await context.newPage()
  // Modale d'accueil déjà vue
  await page.addInitScript(() => {
    const original = Storage.prototype.getItem
    Storage.prototype.getItem = function (key) {
      return key.startsWith('sestini:modal:') ? '1' : original.call(this, key)
    }
  })
  await page.goto(base + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await page.screenshot({ path: out + file, type: 'jpeg', quality: 82 })
  await context.close()
  console.log('✓', file)
}

await shot('/la-carte', 'mobile-carte.jpg', { width: 390, height: 844 }, 2)
await shot('/nous-trouver', 'mobile-nous-trouver.jpg', { width: 390, height: 844 }, 2)
await shot('/la-carte', 'desktop-carte.jpg', { width: 1440, height: 900 }, 1)
await browser.close()
