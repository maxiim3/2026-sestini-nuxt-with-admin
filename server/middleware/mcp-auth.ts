/**
 * Protège le serveur MCP : seuls les jetons personnels créés dans l'atelier
 * par un utilisateur autorisé donnent accès aux outils.
 */
export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  if (path !== '/mcp' && !path.startsWith('/mcp/')) return
  // Un navigateur qui ouvre /mcp est redirigé par le module : on laisse passer les GET sans jeton
  if (event.method === 'GET' && !getHeader(event, 'authorization')) return

  const auth = await authenticateMcp(event)
  if (!auth) {
    setResponseHeader(event, 'WWW-Authenticate', 'Bearer realm="sestini-mcp"')
    throw createError({ statusCode: 401, statusMessage: 'Jeton MCP invalide, expiré ou révoqué' })
  }
  event.context.mcpAuth = auth
})
