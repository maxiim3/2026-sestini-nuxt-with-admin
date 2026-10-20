import { loadPublicSnapshot } from '../../services/catalog'
import { formatHour } from '../../../shared/domain/dates'

/** Données du widget PWA « Ce soir » (Adaptive Card) */
export default defineEventHandler(async (event) => {
  const snap = await loadPublicSnapshot(await readyDb())
  setResponseHeader(event, 'Cache-Control', 'public, max-age=0, s-maxage=300')
  const { today, next, status } = snap.tonight
  const day = today.open && status !== 'closed-now' ? today : next
  const contact = (snap.settings['site.contact'] ?? {}) as { phone?: string }
  const phone = (contact.phone ?? '07 88 52 91 78').replace(/\D/g, '').replace(/^0/, '+33')
  return {
    label: day === today ? 'CE SOIR' : 'PROCHAINE OUVERTURE',
    title: day?.location?.city ?? 'Fermé',
    detail: day?.location ? `${day.location.name} · dès ${formatHour(day.opensAt ?? '18:00')}` : 'À très vite !',
    phoneHref: `tel:${phone}`,
    directions: day?.location ? `https://www.google.com/maps/dir/?api=1&destination=${day.location.lat},${day.location.lng}` : 'https://www.sestini-pizza.fr/nous-trouver',
  }
})
