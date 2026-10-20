import { loadPublicSnapshot } from '../services/catalog'
import { llmsTxt } from '../services/seo'

export default defineEventHandler(async (event) => {
  const snap = await loadPublicSnapshot(await readyDb())
  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=0, s-maxage=600')
  return llmsTxt(snap, getSiteConfig(event).url ?? getRequestURL(event).origin)
})
