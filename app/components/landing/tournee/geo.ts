/**
 * Géographie stylisée de la tournée : projection locale, trait de côte, étangs,
 * routes et calcul d'itinéraires. Coordonnées réelles (lat/lng), simplifiées à la main.
 */

export interface Pt { x: number, y: number }
type LatLng = readonly [lat: number, lng: number]

// Projection équirectangulaire locale centrée sur l'étang de Vic (1 unité ≈ 28 m)
const K = 4000
const LAT0 = 43.64
const LNG0 = 3.66
const COS = Math.cos((43.53 * Math.PI) / 180)

// Arrondi au centième : mêmes chaînes au rendu serveur et à l'hydratation
const r2 = (n: number) => Math.round(n * 100) / 100

export function project(lat: number, lng: number): Pt {
  return { x: r2((lng - LNG0) * COS * K), y: r2((LAT0 - lat) * K) }
}

const P = (ll: LatLng) => project(ll[0], ll[1])

/** Distance au sol approximative (en km) pour une longueur en unités de carte */
export const KM = K / 111.2

// --- Courbes -----------------------------------------------------------------

const r1 = (n: number) => Math.round(n * 10) / 10

/** Catmull-Rom → Bézier cubiques, ouvert ou fermé */
export function smoothPath(pts: Pt[], closed = false): string {
  if (pts.length < 2) return ''
  const n = pts.length
  const at = (i: number): Pt => closed ? pts[(i + n) % n]! : pts[Math.max(0, Math.min(n - 1, i))]!
  let d = `M${r1(pts[0]!.x)} ${r1(pts[0]!.y)}`
  const last = closed ? n : n - 1
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2)
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }
    d += `C${r1(c1.x)} ${r1(c1.y)} ${r1(c2.x)} ${r1(c2.y)} ${r1(p2.x)} ${r1(p2.y)}`
  }
  return closed ? `${d}Z` : d
}

/** Échantillonne la même courbe en polyligne dense (pour mesurer et suivre le tracé) */
export function sampleSmooth(pts: Pt[], step = 4): Pt[] {
  if (pts.length < 2) return pts.slice()
  const n = pts.length
  const at = (i: number): Pt => pts[Math.max(0, Math.min(n - 1, i))]!
  const out: Pt[] = [pts[0]!]
  for (let i = 0; i < n - 1; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2)
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }
    const segs = Math.max(2, Math.ceil(Math.hypot(p2.x - p1.x, p2.y - p1.y) / step))
    for (let s = 1; s <= segs; s++) {
      const t = s / segs, u = 1 - t
      out.push({
        x: u * u * u * p1.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p2.x,
        y: u * u * u * p1.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p2.y,
      })
    }
  }
  return out
}

/** Décale une polyligne vers sa droite (sens de circulation) : aller et retour ne se superposent pas */
export function offsetLine(pts: Pt[], by: number): Pt[] {
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)]!, b = pts[Math.min(pts.length - 1, i + 1)]!
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1
    // Atténue le décalage aux extrémités pour arriver pile sur le point d'étape
    const fade = Math.min(1, i / 6, (pts.length - 1 - i) / 6)
    return { x: p.x - ((b.y - a.y) / len) * by * fade, y: p.y + ((b.x - a.x) / len) * by * fade }
  })
}

export function linePath(pts: Pt[]): string {
  return pts.map((p, i) => `${i ? 'L' : 'M'}${r1(p.x)} ${r1(p.y)}`).join('')
}

// --- Trait de côte et eaux ----------------------------------------------------

/** Lido du sud-ouest (Sète) au nord-est (Carnon) */
const COAST: LatLng[] = [
  [43.386, 3.6], [43.395, 3.655], [43.401, 3.69], [43.411, 3.712], [43.423, 3.736], [43.434, 3.758],
  [43.446, 3.778], [43.458, 3.796], [43.47, 3.815], [43.482, 3.835], [43.494, 3.855], [43.505, 3.874],
  [43.513, 3.893], [43.52, 3.912], [43.527, 3.93], [43.535, 3.948], [43.544, 3.966], [43.553, 3.986], [43.562, 4.01],
]

export const coastPts = COAST.map(P)
export const coastPath = smoothPath(coastPts)
export const seaPath = `${smoothPath(coastPts)}L${r1(project(43.6, 4.1).x)} ${r1(project(43.6, 4.1).y)}L${r1(project(43.2, 4.1).x)} ${r1(project(43.2, 4.1).y)}L${r1(project(43.2, 3.5).x)} ${r1(project(43.2, 3.5).y)}L${r1(project(43.386, 3.5).x)} ${r1(project(43.386, 3.5).y)}Z`

export interface Water { id: string, d: string, label?: { text: string, at: Pt, size: number, rotate: number } }

const lagoon = (pts: LatLng[]) => smoothPath(pts.map(P), true)

/** Polyligne dense du trait de côte, paramétrée par la longitude */
const coastDense = sampleSmooth(coastPts, 3)

/**
 * Étang de lido : une bande qui épouse le cordon littoral, côté terre.
 * `gap` = largeur du lido, `width` = largeur maximale de l'étang (unités de carte).
 */
function lidoLagoon(fromLng: number, toLng: number, gap: number, width: number, skew = 0): string {
  const x0 = project(43.5, fromLng).x, x1 = project(43.5, toLng).x
  const along = coastDense.filter(p => p.x >= x0 && p.x <= x1)
  const n = Math.max(2, Math.round(along.length / 4))
  const inner: Pt[] = [], outer: Pt[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const k = Math.min(along.length - 1, Math.round(t * (along.length - 1)))
    const p = along[k]!, a = along[Math.max(0, k - 1)]!, b = along[Math.min(along.length - 1, k + 1)]!
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1
    // Normale côté terre (le lido court du sud-ouest au nord-est)
    const nx = (b.y - a.y) / len, ny = -(b.x - a.x) / len
    const bulge = Math.sin(Math.PI * Math.min(1, Math.max(0, t + skew * (t - t * t)))) ** 0.45
    const w = gap + width * bulge * (0.92 + 0.08 * Math.sin(t * 9))
    inner.push({ x: p.x + nx * gap, y: p.y + ny * gap })
    outer.push({ x: p.x + nx * w, y: p.y + ny * w })
  }
  return smoothPath([...inner, ...outer.reverse().slice(1, -1)], true)
}

export const lagoons: Water[] = [
  {
    id: 'thau',
    d: lagoon([[43.425, 3.6], [43.45, 3.62], [43.458, 3.66], [43.452, 3.685], [43.437, 3.698], [43.42, 3.68], [43.41, 3.64]]),
  },
  {
    id: 'ingril',
    d: lidoLagoon(3.752, 3.802, 9, 38, 0.3),
    label: { text: 'Étang d’Ingril', at: project(43.4635, 3.7775), size: 9, rotate: 42 },
  },
  {
    id: 'vic',
    d: lidoLagoon(3.806, 3.858, 11, 88, -0.25),
    label: { text: 'Étang de Vic', at: project(43.4885, 3.8275), size: 11, rotate: 40 },
  },
  {
    id: 'pierre-blanche',
    d: lidoLagoon(3.861, 3.889, 9, 50),
    label: { text: 'Pierre-Blanche', at: project(43.5145, 3.8745), size: 8.5, rotate: 42 },
  },
  {
    id: 'arnel',
    d: lidoLagoon(3.893, 3.922, 9, 52),
    label: { text: 'Étang de l’Arnel', at: project(43.5405, 3.899), size: 8.5, rotate: 0 },
  },
  {
    id: 'prevost',
    d: lidoLagoon(3.926, 3.962, 8, 38),
  },
  {
    id: 'mejean',
    d: lagoon([[43.557, 3.925], [43.563, 3.93], [43.569, 3.946], [43.567, 3.96], [43.561, 3.96], [43.557, 3.944]]),
  },
]

export const rivers: string[] = [
  // Le Lez, de Montpellier à Palavas
  smoothPath(([[43.66, 3.865], [43.625, 3.878], [43.6, 3.888], [43.578, 3.897], [43.56, 3.91], [43.545, 3.922], [43.528, 3.932]] as LatLng[]).map(P)),
  // La Mosson, à l'ouest de Montpellier, jusqu'à l'étang de l'Arnel
  smoothPath(([[43.66, 3.79], [43.635, 3.806], [43.612, 3.815], [43.592, 3.828], [43.572, 3.842], [43.553, 3.866], [43.538, 3.884], [43.53, 3.895]] as LatLng[]).map(P)),
]

/** Massif de la Gardiole : petites hachures en chevrons, façon gravure */
export const hills: string[] = (() => {
  const c = project(43.497, 3.742)
  const out: string[] = []
  for (let row = -4; row <= 4; row++) {
    for (let col = -6; col <= 6; col++) {
      const x = c.x + col * 15 + (row % 2 ? 7.5 : 0)
      const y = c.y + row * 13
      // Ellipse inclinée comme le massif (nord-est → sud-ouest)
      const dx = x - c.x, dy = y - c.y
      const a = (-35 * Math.PI) / 180
      const u = (dx * Math.cos(a) - dy * Math.sin(a)) / 92
      const v = (dx * Math.sin(a) + dy * Math.cos(a)) / 46
      if (u * u + v * v > 1) continue
      const h = 4.5 * (1 - (u * u + v * v)) + 2
      out.push(`M${r1(x - 5)} ${r1(y + 2)}Q${r1(x)} ${r1(y - h * 1.4)} ${r1(x + 5)} ${r1(y + 2)}`)
    }
  }
  return out
})()

/** Graticule tous les 5′ d'arc */
export const graticule = (() => {
  const lats = [43.4167, 43.5, 43.5833, 43.6667]
  const lngs = [3.6667, 3.75, 3.8333, 3.9167, 4]
  const fmt = (deg: number, hemi: string) => {
    const d = Math.floor(deg)
    const m = Math.round((deg - d) * 60)
    return `${d}°${String(m).padStart(2, '0')}′ ${hemi}`
  }
  return {
    lat: lats.map(lat => ({ y: project(lat, LNG0).y, label: fmt(lat, 'N') })),
    lng: lngs.map(lng => ({ x: project(LAT0, lng).x, label: fmt(lng, 'E') })),
  }
})()

// --- Lieux et routes -----------------------------------------------------------

export interface Town { id: string, name: string, at: Pt, minor?: boolean, wideOnly?: boolean, anchor?: 'start' | 'end' | 'middle', dx?: number, dy?: number }

const NODES = {
  'montpellier': [43.6108, 3.8767],
  'pignan': [43.57884, 3.75509],
  'fabregues': [43.5508, 3.7769],
  'saint-jean': [43.5767, 3.8261],
  'lattes': [43.5675, 3.9006],
  'palavas': [43.5283, 3.93],
  'villeneuve': [43.53764, 3.85798],
  'mireval': [43.5089, 3.8017],
  'vic': [43.4986, 3.78784],
  'frontignan': [43.4485, 3.7543],
  'maguelone': [43.5125, 3.8907],
} as const satisfies Record<string, LatLng>

type NodeId = keyof typeof NODES

/** Villes de repère (les étapes de la tournée sont dessinées à part, depuis les données) */
export const towns: Town[] = [
  { id: 'fabregues', name: 'Fabrègues', at: P(NODES.fabregues), minor: true, anchor: 'end', dx: -8, dy: 4 },
  { id: 'saint-jean', name: 'Saint-Jean-de-Védas', at: P(NODES['saint-jean']), minor: true, anchor: 'middle', dy: -10 },
  { id: 'lattes', name: 'Lattes', at: P(NODES.lattes), minor: true, wideOnly: true, anchor: 'start', dx: 8, dy: 4 },
  { id: 'mireval', name: 'Mireval', at: P(NODES.mireval), minor: true, wideOnly: true, anchor: 'start', dx: 8, dy: -4 },
  { id: 'frontignan', name: 'Frontignan', at: P(NODES.frontignan), minor: true, wideOnly: true, anchor: 'end', dx: -8, dy: 4 },
  { id: 'palavas', name: 'Palavas-les-Flots', at: P(NODES.palavas), minor: true, wideOnly: true, anchor: 'start', dx: 8, dy: 12 },
]

export const montpellier = P(NODES.montpellier)
export const maguelone = P(NODES.maguelone)
export const gardioleLabel = project(43.526, 3.718)
export const seaLabel = project(43.452, 3.89)

/** Réseau routier simplifié : arêtes avec points de passage */
const EDGES: [NodeId, NodeId, LatLng[]][] = [
  ['pignan', 'saint-jean', [[43.5795, 3.79]]],
  ['saint-jean', 'montpellier', [[43.594, 3.852]]],
  ['pignan', 'fabregues', [[43.566, 3.762]]],
  ['fabregues', 'saint-jean', [[43.562, 3.8]]],
  ['fabregues', 'vic', [[43.531, 3.775], [43.513, 3.777]]],
  ['vic', 'mireval', []],
  ['mireval', 'villeneuve', [[43.518, 3.824], [43.528, 3.843]]],
  ['villeneuve', 'saint-jean', [[43.556, 3.84]]],
  ['villeneuve', 'montpellier', [[43.56, 3.866], [43.586, 3.872]]],
  ['villeneuve', 'maguelone', [[43.524, 3.877]]],
  ['montpellier', 'lattes', [[43.59, 3.889]]],
  ['lattes', 'palavas', [[43.548, 3.917]]],
  ['vic', 'frontignan', [[43.474, 3.768]]],
]

const edgePts = (a: NodeId, b: NodeId, via: LatLng[]) => [P(NODES[a]), ...via.map(P), P(NODES[b])]

export const roads: string[] = EDGES.map(([a, b, via]) => smoothPath(edgePts(a, b, via)))

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y)

function nearestNode(p: Pt): NodeId {
  let best: NodeId = 'montpellier', bestD = Infinity
  for (const id of Object.keys(NODES) as NodeId[]) {
    const d = dist(p, P(NODES[id]))
    if (d < bestD) {
      best = id
      bestD = d
    }
  }
  return best
}

/** Plus court chemin (Dijkstra) sur le réseau, renvoyé comme liste de points de passage */
function shortestPath(from: NodeId, to: NodeId): Pt[] {
  const ids = Object.keys(NODES) as NodeId[]
  const cost = new Map<NodeId, number>(ids.map(id => [id, Infinity]))
  const prev = new Map<NodeId, { node: NodeId, pts: Pt[] }>()
  const todo = new Set(ids)
  cost.set(from, 0)
  while (todo.size) {
    let cur: NodeId | null = null
    for (const id of todo) if (cur === null || cost.get(id)! < cost.get(cur)!) cur = id
    if (cur === null || cost.get(cur) === Infinity || cur === to) break
    todo.delete(cur)
    for (const [a, b, via] of EDGES) {
      if (a !== cur && b !== cur) continue
      const other = a === cur ? b : a
      const pts = a === cur ? edgePts(a, b, via) : edgePts(a, b, via).reverse()
      const len = pts.slice(1).reduce((s, p, i) => s + dist(pts[i]!, p), 0)
      if (cost.get(cur)! + len < cost.get(other)!) {
        cost.set(other, cost.get(cur)! + len)
        prev.set(other, { node: cur, pts })
      }
    }
  }
  const chain: Pt[][] = []
  let node: NodeId = to
  while (node !== from) {
    const step = prev.get(node)
    if (!step) return [P(NODES[from]), P(NODES[to])]
    chain.unshift(step.pts)
    node = step.node
  }
  return chain.flatMap((pts, i) => (i ? pts.slice(1) : pts))
}

/** Itinéraire routier entre deux points de la carte (polyligne dense) */
export function routeBetween(a: Pt, b: Pt): Pt[] {
  const na = nearestNode(a), nb = nearestNode(b)
  let pts = na === nb ? [a, b] : shortestPath(na, nb)
  // Raccorde au point exact de l'étape (parkings légèrement à l'écart du centre)
  if (na !== nb) {
    pts = [a, ...pts.slice(dist(pts[0]!, a) < 14 ? 1 : 0)]
    pts = [...pts.slice(0, dist(pts[pts.length - 1]!, b) < 14 ? -1 : undefined), b]
  }
  return sampleSmooth(pts, 3)
}
