import { expect, test } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

test('l’atelier refuse l’accès sans session', async ({ page, request }) => {
  await page.goto('/atelier/carte')
  await expect(page).toHaveURL(/\/atelier\/connexion/)
  expect((await request.get('/api/admin/pizzas')).status()).toBe(401)
  expect((await request.post('/mcp', { data: {} })).status()).toBe(401)
})

test('connexion par lien magique puis modification publiée sur le site', async ({ page, request }) => {
  await page.goto('/atelier/connexion')
  await page.waitForLoadState('networkidle')
  await page.getByPlaceholder('vous@exemple.fr').fill('maxiim3@proton.me')
  await page.getByRole('button', { name: /recevoir un lien/i }).click()
  await expect(page.getByText('Vérifiez votre boîte mail')).toBeVisible()

  const outbox = await (await request.get('/api/auth/dev-outbox')).json()
  const link = outbox[0].text.match(/https?:\/\/\S+/)[0]
  await page.goto(link)
  await expect(page).toHaveURL(/\/atelier$/)
  await expect(page.getByText('Carte active')).toBeVisible()

  await page.goto('/atelier/carte')
  await page.locator('li', { hasText: 'La Margherita' }).getByRole('button', { name: 'Modifier' }).click()
  const price = page.getByRole('spinbutton').first()
  await price.fill('12')
  await price.press('Tab')
  await page.getByRole('button', { name: 'Publier' }).click()
  await expect(page.getByText('Publié').first()).toBeVisible()

  const site = await (await request.get('/api/public/site')).json()
  const margherita = site.menu.sections[0].pizzas.find((p: { slug: string }) => p.slug === 'la-margherita')
  expect(margherita.priceCents).toBe(1200)
})
