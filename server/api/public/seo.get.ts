import { loadPublicSnapshot } from '../../services/catalog'
import { menuJsonLd, restaurantJsonLd } from '../../services/seo'

export default defineEventHandler(async (event) => {
  const snap = await loadPublicSnapshot(await readyDb())
  const siteUrl = getSiteConfig(event).url ?? getRequestURL(event).origin
  setResponseHeader(event, 'Cache-Control', 'public, max-age=0, s-maxage=300')
  return { restaurant: restaurantJsonLd(snap, siteUrl), menu: menuJsonLd(snap, siteUrl) }
})
