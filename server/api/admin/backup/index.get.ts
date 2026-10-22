import { z } from 'zod'
import { exportBackup } from '../../../services/backup'
import { backupToSheets } from '../../../services/backup-sheets'

const query = z.object({ format: z.enum(['json', 'xlsx']).default('json') })

/** Téléchargement de toutes les données de contenu (ni comptes, ni jetons, ni journal) */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { format } = await getValidatedQuery(event, query.parse)
  const backup = await exportBackup(await readyDb())
  const name = `sestini-sauvegarde-${backup.exportedAt!.slice(0, 10)}.${format}`
  setHeader(event, 'Content-Disposition', `attachment; filename="${name}"`)
  setHeader(event, 'Cache-Control', 'no-store')
  if (format === 'json') {
    setHeader(event, 'Content-Type', 'application/json; charset=utf-8')
    return JSON.stringify(backup, null, 2)
  }
  setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  return writeWorkbook(backupToSheets(backup))
})
