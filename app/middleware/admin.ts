/** Protège les pages de l'atelier : sans session, direction l'écran de connexion */
export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, fetch } = useUserSession()
  if (!loggedIn.value) await fetch()
  if (!loggedIn.value && to.path !== '/atelier/connexion') {
    return navigateTo({ path: '/atelier/connexion', query: { redirect: to.fullPath } })
  }
})
