import * as s from '../../../database/schema'

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
const MAX_BYTES = 8 * 1024 * 1024

/** Vérifie la signature du fichier plutôt que le type déclaré par le navigateur */
function sniff(data: Buffer): string | null {
  if (data[0] === 0xFF && data[1] === 0xD8 && data[2] === 0xFF) return 'image/jpeg'
  if (data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))) return 'image/png'
  if (data.subarray(0, 4).toString('latin1') === 'RIFF' && data.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp'
  if (data.subarray(4, 12).toString('latin1').startsWith('ftypavi')) return 'image/avif'
  return null
}

/** Import d'une photo (multipart : file, alt, tags séparés par des virgules) */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const parts = await readMultipartFormData(event)
  const file = parts?.find(p => p.name === 'file' && p.filename)
  const type = file ? sniff(file.data) : null
  if (!file || !type || !ALLOWED.includes(type)) throw createError({ statusCode: 400, statusMessage: 'Formats acceptés : JPEG, PNG, WebP, AVIF' })
  if (file.data.length > MAX_BYTES) throw createError({ statusCode: 413, statusMessage: 'Image trop lourde (8 Mo maximum)' })
  const field = (name: string) => parts?.find(p => p.name === name)?.data.toString('utf8').trim() || null

  const stored = await storeMedia({ filename: file.filename!, type, data: file.data })
  const [row] = await (await readyDb()).insert(s.media).values({
    url: stored.url,
    pathname: stored.pathname,
    alt: field('alt'),
    contentType: type,
    width: Number(field('width')) || null,
    height: Number(field('height')) || null,
    tags: (field('tags') ?? '').split(',').map(t => t.trim()).filter(Boolean),
  }).returning()
  return row
})
