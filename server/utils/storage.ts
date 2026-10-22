import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { put } from '@vercel/blob'

const LOCAL_DIR = process.env.VERCEL ? '/tmp/sestini-uploads' : '.data/uploads'

/**
 * Stockage des médias : Vercel Blob si NUXT_BLOB_TOKEN est défini (ou BLOB_READ_WRITE_TOKEN,
 * créé automatiquement par Vercel quand on relie un store au projet),
 * sinon disque local servi par /media/… (développement / démo).
 */
export async function storeMedia(file: { filename: string, type: string, data: Buffer }) {
  const safe = file.filename.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '') || 'image'
  const pathname = `medias/${crypto.randomUUID().slice(0, 8)}-${safe}`
  const token = useRuntimeConfig().blob.token || process.env.BLOB_READ_WRITE_TOKEN
  if (token) {
    const blob = await put(pathname, file.data, { access: 'public', contentType: file.type, token })
    return { url: blob.url, pathname: blob.pathname }
  }
  await mkdir(join(LOCAL_DIR, 'medias'), { recursive: true })
  await writeFile(join(LOCAL_DIR, pathname), file.data)
  return { url: `/media/${pathname.slice('medias/'.length)}`, pathname }
}

export async function readLocalMedia(name: string) {
  if (!/^[a-z0-9.-]+$/.test(name)) return null
  return readFile(join(LOCAL_DIR, 'medias', name)).catch(() => null)
}
