import type { Client } from '@libsql/client'

interface Journal {
  entries: { idx: number, tag: string }[]
}

/**
 * Migrateur minimal : lit les migrations générées par drizzle-kit (embarquées
 * comme assets serveur) et applique celles qui manquent, dans l'ordre.
 */
export async function runMigrations(client: Client, read: (name: string) => Promise<string | null>) {
  await client.execute('CREATE TABLE IF NOT EXISTS __migrations (tag TEXT PRIMARY KEY, applied_at TEXT NOT NULL)')
  const applied = new Set((await client.execute('SELECT tag FROM __migrations')).rows.map(r => String(r.tag)))

  const journalRaw = await read('meta/_journal.json')
  if (!journalRaw) throw new Error('Journal de migrations introuvable')
  const journal = JSON.parse(journalRaw) as Journal

  const done: string[] = []
  for (const { tag } of journal.entries.sort((a, b) => a.idx - b.idx)) {
    if (applied.has(tag)) continue
    const sqlText = await read(`${tag}.sql`)
    if (!sqlText) throw new Error(`Migration ${tag} introuvable`)
    const statements = sqlText.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean)
    await client.batch([
      ...statements,
      { sql: 'INSERT INTO __migrations (tag, applied_at) VALUES (?, ?)', args: [tag, new Date().toISOString()] },
    ], 'write')
    done.push(tag)
  }
  return done
}
