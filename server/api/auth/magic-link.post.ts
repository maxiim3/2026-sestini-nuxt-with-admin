import { and, eq, gt, sql } from 'drizzle-orm'
import { z } from 'zod'
import * as s from '../../database/schema'

const body = z.object({
  email: z.string().email().transform(v => v.trim().toLowerCase()),
  redirect: z.string().startsWith('/atelier').optional(),
})

const TTL_MINUTES = 15
const MAX_PER_WINDOW = 3

/**
 * Demande de lien magique. Répond toujours la même chose, que l'adresse soit
 * autorisée ou non, pour ne pas révéler la liste des utilisateurs.
 */
export default defineEventHandler(async (event) => {
  const { email, redirect } = await readValidatedBody(event, body.parse)
  const db = await readyDb()
  const ok = { ok: true, message: 'Si cette adresse est autorisée, un lien de connexion vient d\'être envoyé.' }

  const [user] = await db.select().from(s.users).where(eq(s.users.email, email))
  if (!user) return ok

  const since = new Date(Date.now() - TTL_MINUTES * 60_000).toISOString()
  const [recent] = await db.select({ n: sql<number>`count(*)` }).from(s.magicLinks)
    .where(and(eq(s.magicLinks.email, email), gt(s.magicLinks.createdAt, since)))
  if ((recent?.n ?? 0) >= MAX_PER_WINDOW) {
    throw createError({ statusCode: 429, statusMessage: 'Trop de demandes. Réessayez dans quelques minutes.' })
  }

  const token = randomToken()
  await db.insert(s.magicLinks).values({
    email,
    tokenHash: await sha256(token),
    redirect: redirect ?? '/atelier',
    expiresAt: new Date(Date.now() + TTL_MINUTES * 60_000).toISOString(),
  })

  const url = `${getRequestURL(event).origin}/api/auth/verify?token=${token}`
  const name = user.name ?? ''
  await sendMail({
    to: email,
    subject: 'Connexion à l\'atelier Sestini Pizza',
    text: `Bonjour ${name},\n\nVoici votre lien de connexion (valable ${TTL_MINUTES} minutes, utilisable une seule fois) :\n${url}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.`,
    html: `<div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#0e1011;color:#fcf7ee;border-radius:16px">
<p style="letter-spacing:.28em;text-transform:uppercase;font-size:12px;color:#e0aa3e;margin:0 0 16px">Sestini Pizza · Atelier</p>
<p>Bonjour ${name},</p>
<p>Voici votre lien de connexion, valable ${TTL_MINUTES} minutes et utilisable une seule fois.</p>
<p style="margin:28px 0"><a href="${url}" style="background:#e0aa3e;color:#0e1011;padding:14px 22px;border-radius:999px;text-decoration:none;font-weight:600">Se connecter</a></p>
<p style="font-size:12px;color:#a9a49b">Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p></div>`,
  })

  return ok
})
