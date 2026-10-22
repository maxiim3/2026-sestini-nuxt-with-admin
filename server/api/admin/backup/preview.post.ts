import { summarize } from '../../../services/backup'

/** Aperçu d'un import : ajouts, modifications et suppressions, sans rien écrire */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { plan } = await readBackupUpload(event)
  return summarize(plan)
})
