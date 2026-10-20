import { and, eq, isNull } from 'drizzle-orm'
import type { H3Event } from 'h3'
import * as s from '../database/schema'
import type { Actor } from '../services/operations'

export interface McpAuth {
  tokenId: string
  userId: string
  label: string
  scopes: s.TokenScope[]
}

export const TOKEN_PREFIX = 'sestini_'

/** Crée un jeton personnel ; la valeur en clair n'est montrée qu'une fois */
export async function createApiToken(userId: string, name: string, scopes: s.TokenScope[], expiresInDays: number | null) {
  const secret = randomToken(32)
  const value = `${TOKEN_PREFIX}${secret}`
  const [row] = await (await readyDb()).insert(s.apiTokens).values({
    userId,
    name,
    prefix: value.slice(0, TOKEN_PREFIX.length + 6),
    tokenHash: await sha256(value),
    scopes,
    expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * 86_400_000).toISOString() : null,
  }).returning()
  return { token: value, row: row! }
}

/** Valide l'en-tête Authorization: Bearer … et renvoie le contexte du jeton, ou null */
export async function authenticateMcp(event: H3Event): Promise<McpAuth | null> {
  const header = getHeader(event, 'authorization') ?? ''
  const match = /^Bearer\s+(\S+)$/i.exec(header)
  if (!match?.[1]?.startsWith(TOKEN_PREFIX)) return null

  const db = await readyDb()
  const [row] = await db.select({ token: s.apiTokens, user: s.users })
    .from(s.apiTokens)
    .innerJoin(s.users, eq(s.users.id, s.apiTokens.userId))
    .where(and(eq(s.apiTokens.tokenHash, await sha256(match[1])), isNull(s.apiTokens.revokedAt)))
  if (!row) return null
  if (row.token.expiresAt && row.token.expiresAt < new Date().toISOString()) return null

  // Mise à jour de « dernière utilisation » au plus une fois par minute
  const now = new Date()
  if (!row.token.lastUsedAt || now.getTime() - new Date(row.token.lastUsedAt).getTime() > 60_000) {
    await db.update(s.apiTokens).set({ lastUsedAt: now.toISOString() }).where(eq(s.apiTokens.id, row.token.id))
  }
  return {
    tokenId: row.token.id,
    userId: row.user.id,
    label: `IA (${row.token.name}) · ${row.user.name ?? row.user.email}`,
    scopes: row.token.scopes,
  }
}

/** Contexte d'authentification MCP de la requête en cours (posé par le middleware) */
export function useMcpAuth(): McpAuth {
  const auth = useEvent().context.mcpAuth as McpAuth | undefined
  if (!auth) throw createError({ statusCode: 401, statusMessage: 'Jeton MCP manquant' })
  return auth
}

export function mcpActor(auth: McpAuth): Actor {
  return { type: 'token', id: auth.tokenId, label: auth.label }
}

export function requireScope(auth: McpAuth, scope: s.TokenScope) {
  if (!auth.scopes.includes(scope)) {
    throw new Error(`Ce jeton n'a pas la permission « ${scope} ». Demandez à un administrateur d'en créer un avec cette portée dans l'atelier (IA & MCP).`)
  }
}
