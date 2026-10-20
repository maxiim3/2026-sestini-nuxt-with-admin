/** Développement uniquement : derniers e-mails non envoyés (Resend non configuré) */
export default defineEventHandler(() => {
  if (!import.meta.dev) throw createError({ statusCode: 404 })
  return devOutbox
})
