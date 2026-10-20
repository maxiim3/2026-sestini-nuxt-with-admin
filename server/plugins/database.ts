/** Lance les migrations dès le démarrage, sans bloquer le serveur */
export default defineNitroPlugin(() => {
  readyDb().catch(error => console.error('[db] initialisation impossible', error))
})
