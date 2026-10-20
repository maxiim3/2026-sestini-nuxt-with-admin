import type { TokenScope } from '../database/schema'
import * as s from '../database/schema'
import { commitOperations, proposeChangeset } from '../services/operations'
import type { McpAuth } from './mcp-auth'

interface ToolContext {
  auth: McpAuth
  db: Database
}

type ToolResult = { content: { type: 'text', text: string }[], isError?: boolean }

/**
 * Exécute un outil MCP : vérifie la portée du jeton, journalise l'appel
 * (audit_log) et transforme le résultat ou l'erreur en réponse MCP.
 */
export async function mcpCall(tool: string, input: unknown, scope: TokenScope, fn: (ctx: ToolContext) => Promise<unknown>): Promise<ToolResult> {
  const auth = useMcpAuth()
  const db = await readyDb()
  try {
    requireScope(auth, scope)
    const result = await fn({ auth, db })
    await db.insert(s.auditLog).values({ tokenId: auth.tokenId, userId: auth.userId, tool, input: input as object, ok: true })
    return { content: [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }] }
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await db.insert(s.auditLog).values({ tokenId: auth.tokenId, userId: auth.userId, tool, input: input as object, ok: false, error: message })
    return { content: [{ type: 'text', text: `Erreur : ${message}` }], isError: true }
  }
}

/**
 * Écriture depuis l'IA : brouillon par défaut (à valider dans l'atelier),
 * publication directe seulement si demandée ET autorisée par le jeton.
 */
export async function mcpWrite(ctx: ToolContext, title: string, operations: unknown[], publish = false) {
  const actor = mcpActor(ctx.auth)
  const origin = getRequestURL(useEvent()).origin
  if (publish) {
    requireScope(ctx.auth, 'publish')
    const result = await commitOperations(ctx.db, title, operations, actor)
    return {
      status: 'published',
      message: `Publié : ${title}. Visible sur le site d'ici une minute (cache).`,
      changesetId: result.changesetId,
      created: result.created,
      revisions: result.revisions,
    }
  }
  const changeset = await proposeChangeset(ctx.db, title, operations, actor)
  return {
    status: 'draft',
    message: `Brouillon créé : ${title}. Il doit être validé dans l'atelier (${origin}/atelier/brouillons), ou publié avec l'outil decide_draft si votre jeton a la portée « publish ».`,
    changesetId: changeset.id,
    reviewUrl: `${origin}/atelier/brouillons`,
  }
}

export const publishFlag = {
  describe: 'true = publier immédiatement (jeton avec portée « publish » requis). Par défaut : brouillon à valider par un humain dans l\'atelier.',
}
