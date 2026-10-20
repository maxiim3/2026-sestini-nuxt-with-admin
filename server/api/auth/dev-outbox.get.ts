/** Boîte d'envoi de test (Resend non configuré) : développement, ou tests e2e explicitement activés */
export default defineEventHandler(() => {
  const enabled = import.meta.dev || (process.env.NUXT_E2E_OUTBOX === '1' && !process.env.VERCEL)
  if (!enabled) throw createError({ statusCode: 404 })
  return devOutbox
})
