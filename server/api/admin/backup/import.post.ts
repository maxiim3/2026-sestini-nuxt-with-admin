import { applyImport, planFingerprint } from '../../../services/backup'

/**
 * Import confirmé : le fichier est relu et comparé de nouveau à la base. Si le
 * résultat diffère de l'aperçu validé (contenu modifié entre-temps), rien
 * n'est écrit. Réservé au propriétaire : un import peut archiver toute la carte.
 */
export default defineEventHandler(async (event) => {
  const { actor } = await requireOwner(event)
  const { db, plan, filename, field } = await readBackupUpload(event)
  if (field('fingerprint') !== planFingerprint(plan)) {
    throw createError({ statusCode: 409, statusMessage: 'Le contenu du site a changé depuis l\'aperçu : relancez l\'aperçu avant d\'importer.' })
  }
  try {
    return await applyImport(db, plan, `Import du fichier « ${filename} »`, actor)
  }
  catch (error) {
    asHttpError(error)
  }
})
