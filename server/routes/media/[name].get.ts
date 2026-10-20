const TYPES: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif', gif: 'image/gif' }

/** Médias stockés localement (sans Vercel Blob) */
export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name') ?? ''
  const data = await readLocalMedia(name)
  if (!data) throw createError({ statusCode: 404 })
  setResponseHeader(event, 'Content-Type', TYPES[name.split('.').pop() ?? ''] ?? 'application/octet-stream')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  return data
})
