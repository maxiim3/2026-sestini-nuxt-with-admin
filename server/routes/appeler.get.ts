import { loadSettings } from '../services/catalog'

/** Raccourci PWA « Appeler » : redirige vers le numéro */
export default defineEventHandler(async (event) => {
  const contact = ((await loadSettings(await readyDb()))['site.contact'] ?? {}) as { phone?: string }
  const phone = (contact.phone ?? '07 88 52 91 78').replace(/\D/g, '').replace(/^0/, '+33')
  return sendRedirect(event, `tel:${phone}`, 302)
})
