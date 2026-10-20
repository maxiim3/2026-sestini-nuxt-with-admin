import { Resend } from 'resend'

export interface Mail {
  to: string
  subject: string
  html: string
  text: string
}

/** Dernier lien magique émis en développement (affiché dans la console et l'écran de connexion) */
export const devOutbox: { to: string, subject: string, text: string, at: string }[] = []

/**
 * Envoi d'e-mail : Resend si NUXT_RESEND_API_KEY est défini, sinon console (développement / démo).
 */
export async function sendMail(mail: Mail): Promise<{ delivered: boolean }> {
  const config = useRuntimeConfig()
  if (!config.resend.apiKey) {
    console.info(`[mail] (non envoyé, Resend non configuré) → ${mail.to} : ${mail.subject}\n${mail.text}`)
    devOutbox.unshift({ to: mail.to, subject: mail.subject, text: mail.text, at: new Date().toISOString() })
    devOutbox.length = Math.min(devOutbox.length, 10)
    return { delivered: false }
  }
  const resend = new Resend(config.resend.apiKey)
  const { error } = await resend.emails.send({ from: config.resend.from, to: mail.to, subject: mail.subject, html: mail.html, text: mail.text })
  if (error) throw createError({ statusCode: 502, statusMessage: `Envoi de l'e-mail impossible : ${error.message}` })
  return { delivered: true }
}
