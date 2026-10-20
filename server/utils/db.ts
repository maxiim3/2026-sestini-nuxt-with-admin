import { createClient, type Client } from '@libsql/client'
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql'
import * as schema from '../database/schema'

export { schema }
export type Database = LibSQLDatabase<typeof schema>

let client: Client | undefined
let db: Database | undefined

/**
 * URL de la base : Turso en production (NUXT_DB_URL + NUXT_DB_AUTH_TOKEN),
 * fichier local en développement. Sans configuration sur Vercel, on tombe sur
 * une base de démonstration dans /tmp, recréée à chaque démarrage à froid.
 */
export function databaseUrl(): string {
  const config = useRuntimeConfig()
  if (config.db.url) return config.db.url
  return process.env.VERCEL ? 'file:/tmp/sestini.db' : 'file:.data/sestini.db'
}

export function isDemoDatabase(): boolean {
  return databaseUrl().startsWith('file:/tmp')
}

export function useDb(): Database {
  if (!db) {
    const config = useRuntimeConfig()
    client = createClient({ url: databaseUrl(), authToken: config.db.authToken || undefined })
    db = drizzle(client, { schema })
  }
  return db
}

export function useDbClient(): Client {
  useDb()
  return client!
}
