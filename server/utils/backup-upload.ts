import type { H3Event } from 'h3'
import { exportBackup, planImport, readBackupFile } from '../services/backup'

/** Fichier de sauvegarde envoyé par l'atelier (multipart : file), validé et comparé à la base */
export async function readBackupUpload(event: H3Event) {
  const parts = await readMultipartFormData(event)
  const file = parts?.find(p => p.name === 'file' && p.filename)
  if (!file) throw createError({ statusCode: 400, statusMessage: 'Aucun fichier reçu' })
  const result = await readBackupFile(file.data)
  if (!result.ok) throw createError({ statusCode: 422, statusMessage: 'Fichier refusé', data: { errors: result.errors } })
  const db = await readyDb()
  const plan = planImport(await exportBackup(db), result.backup)
  const field = (name: string) => parts?.find(p => p.name === name)?.data.toString('utf8') ?? null
  return { db, plan, filename: file.filename!, field }
}
