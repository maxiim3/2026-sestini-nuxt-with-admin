import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Le bandeau de message est testé à part : on le considère déjà fermé
  await page.addInitScript(() => {
    const getItem = Storage.prototype.getItem
    Storage.prototype.getItem = function (key: string) {
      return key.startsWith('sestini:notice:') ? '1' : getItem.call(this, key)
    }
  })
})

test('accueil', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(String(e)))
  await page.goto('/')
  await expect(page.locator('h1')).toHaveCount(1)
  // Au moins un lien d'appel visible (en-tête sur ordinateur, barre d'appel sur mobile)
  await expect(page.locator('a[href^="tel:"]:visible').first()).toBeVisible()
  expect(errors).toEqual([])
})

test('la carte : sections, filtres et allergènes', async ({ page }) => {
  await page.goto('/la-carte')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/la carte/i)
  const pizzas = page.locator('article[aria-labelledby^="pizza-"]')
  await expect(pizzas).toHaveCount(16)
  // Aucune pizza sans base n'est végétarienne : la liste se vide
  await page.getByRole('button', { name: 'Sans base' }).click()
  await page.getByRole('button', { name: 'Végétarien' }).click()
  await expect(pizzas).toHaveCount(0)
  await expect(page.getByText('Aucune pizza ne correspond')).toBeVisible()
  await page.getByRole('button', { name: 'Réinitialiser' }).click()
  await page.getByRole('button', { name: 'Végétarien' }).click()
  expect(await pizzas.count()).toBeLessThan(16)
  // Les allergènes de la pâte sont rappelés une fois en tête de carte, pas sur chaque pizza
  await expect(page.getByText(/contiennent du soja, du gluten et du lait/)).toBeVisible()
  await expect(page.getByText(/soja, gluten, lait/)).toHaveCount(0)
})

test('versions traduites', async ({ page }) => {
  await page.goto('/en/menu')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/menu/i)
  await expect(page.locator('html')).toHaveAttribute('lang', /en/)
  await page.goto('/it/dove-siamo')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/dove siamo/i)
})

test('nous trouver : planning et jamais d’heure de fermeture', async ({ page }) => {
  await page.goto('/nous-trouver', { waitUntil: 'networkidle' })
  const rows = page.locator('ol > li')
  const first = await rows.count()
  expect(first).toBeGreaterThan(0)
  const more = page.getByRole('button', { name: 'Voir les deux semaines suivantes' })
  // En émulation mobile, le défilement automatique de Playwright juste avant le clic perd l'événement
  // (iframe de la carte sur la page) : on fait défiler d'abord, comme le ferait un visiteur
  await more.scrollIntoViewIfNeeded()
  await more.click()
  await expect.poll(() => rows.count()).toBeGreaterThan(first)
  await expect(page.locator('body')).not.toContainText(/jusqu/i)
})

test('bandeau de message programmé', async ({ browser }, testInfo) => {
  const page = await browser.newPage({ baseURL: testInfo.project.use.baseURL })
  await page.goto('/', { waitUntil: 'networkidle' })
  const notice = page.locator('[role="status"]')
  await expect(notice).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: 'Fermer le message' }).click()
  await page.reload()
  await page.waitForTimeout(1200)
  await expect(notice).toHaveCount(0)
})

test('SEO : données structurées, llms.txt, manifeste', async ({ page, request }) => {
  await page.goto('/la-carte')
  const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents()
  expect(jsonLd.join('')).toContain('"Menu"')
  expect((await request.get('/llms.txt')).ok()).toBe(true)
  const manifest = await (await request.get('/manifest.webmanifest')).json()
  expect(manifest.shortcuts).toHaveLength(3)
})

test('impression : la carte A4 est prête à imprimer', async ({ page }) => {
  await page.goto('/print/carte?format=A4')
  await expect(page.locator('[data-print-ready="1"]')).toHaveCount(1, { timeout: 15_000 })
  await expect(page.getByText('07 88 52 91 78').first()).toBeVisible()
})
