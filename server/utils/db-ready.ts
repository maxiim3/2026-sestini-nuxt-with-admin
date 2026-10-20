import { runMigrations } from '../database/migrate'
import { seedDatabase } from '../database/seed'

let ready: Promise<Database> | undefined

/** Base migrée et initialisée. À attendre avant toute requête. */
export function readyDb(): Promise<Database> {
  ready ??= (async () => {
    const storage = useStorage('assets:migrations')
    const read = async (name: string) => {
      const value = await storage.getItem<unknown>(name)
      if (value === null || value === undefined) return null
      return typeof value === 'string' ? value : JSON.stringify(value)
    }
    const applied = await runMigrations(useDbClient(), read)
    if (applied.length) console.info(`[db] migrations appliquées : ${applied.join(', ')}`)
    if (await seedDatabase(useDb())) console.info('[db] base initialisée avec les données Sestini')
    return useDb()
  })().catch((error) => {
    ready = undefined
    throw error
  })
  return ready
}
