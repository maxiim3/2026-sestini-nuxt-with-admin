import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // La modale d'accueil est testée à part : on la considère déjà vue
  await page.addInitScript(() => {
    const getItem = Storage.prototype.getItem
    Storage.prototype.getItem = function (key: string) {
      return key.startsWith('sestini:modal:') ? '1' : getItem.call(this, key)
    }
  })
})

for (const variant of ['four', 'ce-soir', 'tournee']) {
  test(`accueil, variante ${variant}`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(String(e)))
    await page.goto(`/?variante=${variant}`)
    await expect(page.locator('h1')).toHaveCount(1)
    // Au moins un lien d'appel visible (en-tête sur ordinateur, barre d'appel sur mobile)
    await expect(page.locator('a[href^="tel:"]:visible').first()).toBeVisible()
    expect(errors).toEqual([])
  })
}

test('la carte : sections, filtres et allergènes', async ({ page }) => {
  await page.goto('/la-carte')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/la carte/i)
  const pizzas = page.locator('article[aria-labelledby^="pizza-"]')
  await expect(pizzas).toHaveCount(16)
  await page.getByRole('button', { name: 'Avec poisson' }).click()
  await expect(pizzas).toHaveCount(0)
  await expect(page.getByText('Aucune pizza ne correspond')).toBeVisible()
  await page.getByRole('button', { name: 'Réinitialiser' }).click()
  await page.getByRole('button', { name: 'Végétarien' }).click()
  expect(await pizzas.count()).toBeLessThan(16)
  await expect(page.getByText('Gluten').first()).toBeVisible()
})

test('versions traduites', async ({ page }) => {
  await page.goto('/en/menu')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/menu/i)
  await expect(page.locator('html')).toHaveAttribute('lang', /en/)
  await page.goto('/it/dove-siamo')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/dove siamo/i)
})

test('nous trouver : 14 jours et jamais d’heure de fermeture', async ({ page }) => {
  await page.goto('/nous-trouver')
  await expect(page.locator('ol > li')).toHaveCount(14)
  await expect(page.locator('body')).not.toContainText(/jusqu/i)
})

test('modale d’accueil programmée', async ({ browser }, testInfo) => {
  const page = await browser.newPage({ baseURL: testInfo.project.use.baseURL })
  // Variante légère : la 3D en rendu logiciel ralentit l'hydratation en CI
  await page.goto('/?variante=ce-soir', { waitUntil: 'networkidle' })
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: 'Fermer' }).click()
  await page.reload()
  await page.waitForTimeout(1200)
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('SEO : données structurées, llms.txt, manifeste', async ({ page, request }) => {
  await page.goto('/la-carte')
  const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents()
  expect(jsonLd.join('')).toContain('"Menu"')
  expect((await request.get('/llms.txt')).ok()).toBe(true)
  const manifest = await (await request.get('/manifest.webmanifest')).json()
  expect(manifest.shortcuts).toHaveLength(3)
})
