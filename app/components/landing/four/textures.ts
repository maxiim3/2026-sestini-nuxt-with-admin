import * as THREE from 'three'

/** Textures procédurales (canvas) : aucune image téléchargée */

type Rand = () => number

/** Générateur pseudo-aléatoire déterministe (mulberry32) */
export function seeded(seed: number): Rand {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function canvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = c.height = size
  return [c, c.getContext('2d')!]
}

function toTexture(c: HTMLCanvasElement, repeat = false, srgb = true): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(c)
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace
  if (repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 4
  return tex
}

/** Petites taches, pour salir une surface */
function speckle(ctx: CanvasRenderingContext2D, rand: Rand, size: number, count: number, color: string, min: number, max: number) {
  ctx.fillStyle = color
  for (let i = 0; i < count; i++) {
    ctx.globalAlpha = 0.15 + rand() * 0.5
    ctx.beginPath()
    ctx.arc(rand() * size, rand() * size, min + rand() * (max - min), 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

/** Marbrure douce, multipliée sur la couleur des briques */
export function mottleTexture(size = 256): THREE.CanvasTexture {
  const [c, ctx] = canvas(size)
  const rand = seeded(7)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < 260; i++) {
    const x = rand() * size
    const y = rand() * size
    const r = 4 + rand() * 26
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    const v = 200 + Math.floor(rand() * 40)
    g.addColorStop(0, `rgba(${v},${v - 8},${v - 20},0.35)`)
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }
  speckle(ctx, rand, size, 900, '#8c8070', 0.4, 1.4)
  return toTexture(c, true)
}

/** Appareil de briques en panneresse (façade, fond du four) */
export function brickTexture(size = 512, base = '#2a2623', mortar = '#121110'): THREE.CanvasTexture {
  const [c, ctx] = canvas(size)
  const rand = seeded(11)
  ctx.fillStyle = mortar
  ctx.fillRect(0, 0, size, size)
  const rows = 8
  const h = size / rows
  const w = size / 4
  const joint = Math.max(2, size / 160)
  const baseColor = new THREE.Color(base)
  for (let r = 0; r < rows; r++) {
    const offset = r % 2 ? w / 2 : 0
    for (let k = -1; k < 5; k++) {
      const x = k * w + offset
      const tint = baseColor.clone().offsetHSL((rand() - 0.5) * 0.02, (rand() - 0.5) * 0.06, (rand() - 0.5) * 0.05)
      ctx.fillStyle = `#${tint.getHexString()}`
      ctx.fillRect(x + joint, r * h + joint, w - joint * 2, h - joint * 2)
    }
  }
  speckle(ctx, rand, size, 1400, '#000000', 0.5, 2.2)
  speckle(ctx, rand, size, 500, '#6b5a48', 0.5, 1.6)
  return toTexture(c, true)
}

/** Sole du four : grandes tomettes réfractaires, noircies près du feu */
export function soleTexture(size = 512): THREE.CanvasTexture {
  const [c, ctx] = canvas(size)
  const rand = seeded(23)
  ctx.fillStyle = '#100d0b'
  ctx.fillRect(0, 0, size, size)
  const n = 5
  const s = size / n
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const l = 0.16 + rand() * 0.06
      ctx.fillStyle = `hsl(${18 + rand() * 10}, ${28 + rand() * 12}%, ${l * 100}%)`
      ctx.fillRect(i * s + 2, j * s + 2, s - 4, s - 4)
    }
  }
  speckle(ctx, rand, size, 1800, '#050403', 0.6, 2.6)
  speckle(ctx, rand, size, 400, '#d8c7a8', 0.4, 1.1) // farine
  // Le haut de la texture (fond du four) est plus brûlé
  const g = ctx.createLinearGradient(0, 0, 0, size)
  g.addColorStop(0, 'rgba(0,0,0,0.7)')
  g.addColorStop(0.45, 'rgba(0,0,0,0.1)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return toTexture(c)
}

/** Point lumineux doux (braises, halos) */
export function glowTexture(size = 128, inner = 'rgba(255,236,200,1)', mid = 'rgba(224,170,62,0.45)'): THREE.CanvasTexture {
  const [c, ctx] = canvas(size)
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, inner)
  g.addColorStop(0.25, mid)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return toTexture(c)
}

/** Ombre de contact sous la pizza */
export function shadowTexture(size = 128): THREE.CanvasTexture {
  const [c, ctx] = canvas(size)
  const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.3, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(0,0,0,0.85)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return toTexture(c)
}

/**
 * Dessus de la pâte vu de haut. `baked` ajoute la dorure et le « léopard »
 * (taches de cuisson) sur le cornicione. Coordonnées : centre = pizza, bord = 0.94 * size/2.
 */
export function doughTexture(size: number, baked: boolean): THREE.CanvasTexture {
  const [c, ctx] = canvas(size)
  const rand = seeded(baked ? 101 : 100)
  const cx = size / 2
  const R = size * 0.47
  ctx.fillStyle = baked ? '#d9a560' : '#ecdcbc'
  ctx.fillRect(0, 0, size, size)

  // Variations de surface
  for (let i = 0; i < 160; i++) {
    const a = rand() * Math.PI * 2
    const d = Math.sqrt(rand()) * R
    const x = cx + Math.cos(a) * d
    const y = cx + Math.sin(a) * d
    const r = 6 + rand() * 30
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, baked ? 'rgba(170,96,36,0.3)' : 'rgba(255,250,238,0.16)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }

  if (baked) {
    // Dorure plus marquée sur le bord
    const ring = ctx.createRadialGradient(cx, cx, R * 0.74, cx, cx, R)
    ring.addColorStop(0, 'rgba(160,82,24,0)')
    ring.addColorStop(0.55, 'rgba(184,108,38,0.45)')
    ring.addColorStop(1, 'rgba(140,72,24,0.7)')
    ctx.fillStyle = ring
    ctx.fillRect(0, 0, size, size)
    // Léopard : taches sombres, cerclées de brun
    for (let i = 0; i < 170; i++) {
      const a = rand() * Math.PI * 2
      const d = R * (0.8 + rand() * 0.2)
      const x = cx + Math.cos(a) * d
      const y = cx + Math.sin(a) * d
      const r = size * (0.003 + rand() * 0.008)
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.2)
      g.addColorStop(0, 'rgba(36,18,8,0.85)')
      g.addColorStop(0.45, 'rgba(72,34,12,0.55)')
      g.addColorStop(1, 'rgba(90,44,14,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, r * 2.2, 0, Math.PI * 2)
      ctx.fill()
    }
    speckle(ctx, rand, size, 260, '#2a1408', 0.6, 2)
  }
  else {
    speckle(ctx, rand, size, 900, '#ffffff', 0.5, 1.8) // farine
  }
  return toTexture(c)
}

/** Sauce tomate : rouge profond, quelques reflets et grains */
export function sauceTexture(size = 256): THREE.CanvasTexture {
  const [c, ctx] = canvas(size)
  const rand = seeded(5)
  ctx.fillStyle = '#a3260f'
  ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < 120; i++) {
    const x = rand() * size
    const y = rand() * size
    const r = 4 + rand() * 18
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    const light = rand() > 0.5
    g.addColorStop(0, light ? 'rgba(214,72,34,0.55)' : 'rgba(96,16,6,0.5)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }
  speckle(ctx, rand, size, 260, '#5a0f04', 0.4, 1.4)
  return toTexture(c, true)
}
