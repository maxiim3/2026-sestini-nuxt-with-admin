import { summarize } from '../../../services/backup'

/** Aperçu d'un import : ajouts, modifications et suppressions, sans rien écrire (propriétaire seulement, comme l'import) */
export default defineEventHandler(async (event) => {
  await requireOwner(event)
  const { plan } = await readBackupUpload(event)
  return summarize(plan)
})
