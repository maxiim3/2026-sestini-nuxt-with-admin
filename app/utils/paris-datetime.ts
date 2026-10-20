const TZ = 'Europe/Paris'

const PARTS = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

function wallClock(ms: number) {
  const p = Object.fromEntries(PARTS.formatToParts(new Date(ms)).map(part => [part.type, part.value]))
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}`, asUtc: Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second)) }
}

/** « 2026-12-24T18:30 » (heure de Paris, champ datetime-local) → ISO UTC. Chaîne vide → null. */
export function parisInputToIso(local: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local)
  if (!match) return null
  const [y, mo, d, h, mi] = match.slice(1).map(Number) as [number, number, number, number, number]
  const guess = Date.UTC(y, mo - 1, d, h, mi)
  let ms = guess - (wallClock(guess).asUtc - guess)
  ms = guess - (wallClock(ms).asUtc - ms)
  return new Date(ms).toISOString()
}

/** ISO UTC → valeur de champ datetime-local à l'heure de Paris */
export function isoToParisInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const { date, time } = wallClock(Date.parse(iso))
  return `${date}T${time}`
}
