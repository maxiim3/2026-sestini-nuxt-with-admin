import { loadPublicSnapshot } from '../../services/catalog'

export default defineEventHandler(async (event) => {
  const db = await readyDb()
  setResponseHeader(event, 'Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=600')
  return loadPublicSnapshot(db)
})
