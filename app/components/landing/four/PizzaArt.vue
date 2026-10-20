<script setup lang="ts">
/**
 * Pizza vue de dessus, dessinée en SVG à partir de la base et des types d'ingrédients.
 * Sert d'emplacement d'image tant qu'il n'y a pas de photo.
 */
const props = defineProps<{ seed: string, baseKind: string, kinds: string[] }>()
const uid = useId()

function rng(text: string) {
  let a = 2166136261
  for (let i = 0; i < text.length; i++) a = Math.imul(a ^ text.charCodeAt(i), 16777619)
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const round = (n: number) => Math.round(n * 100) / 100

const BASES: Record<string, [string, string]> = {
  tomate: ['#c8401f', '#8f200c'],
  creme: ['#faf3e2', '#e6d4ae'],
  speciale: ['#e2a447', '#b46e22'],
  sans: ['#efd29a', '#d6a35c'],
}

/** Contour irrégulier autour du centre */
function blob(rand: () => number, cx: number, cy: number, r: number, wobble: number, points = 14) {
  const pts: [number, number][] = []
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2
    const k = r * (1 + (rand() - 0.5) * wobble)
    pts.push([cx + Math.cos(a) * k, cy + Math.sin(a) * k])
  }
  // Courbe lissée par milieux
  const mid = (p: [number, number], q: [number, number]) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2].map(n => n.toFixed(1)).join(' ')
  let d = `M ${mid(pts[pts.length - 1]!, pts[0]!)}`
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]!
    d += ` Q ${p[0].toFixed(1)} ${p[1].toFixed(1)} ${mid(p, pts[(i + 1) % pts.length]!)}`
  }
  return `${d} Z`
}

const art = computed(() => {
  const rand = rng(props.seed)
  const has = (k: string) => props.kinds.includes(k)
  const polar = (rMin: number, rMax: number) => {
    const a = rand() * Math.PI * 2
    const d = rMin + Math.sqrt(rand()) * (rMax - rMin)
    // Arrondi : le serveur et le navigateur ne calculent pas cos/sin au dernier bit près
    return [round(100 + Math.cos(a) * d), round(100 + Math.sin(a) * d)] as const
  }
  const leopard = Array.from({ length: 34 }, () => {
    const [x, y] = polar(80, 90)
    return { x, y, r: round(0.8 + rand() * 2.6), o: round(0.45 + rand() * 0.45) }
  })
  const base = blob(rand, 100, 100, 72, 0.08, 18)
  const cheese = has('fromage') || props.baseKind === 'creme'
    ? Array.from({ length: 8 }, (_, i) => {
        const [x, y] = i === 0 ? [100 + rand() * 6, 100 + rand() * 6] : polar(22, 56)
        return { d: blob(rand, x, y, 9 + rand() * 6, 0.45), x, y }
      })
    : []
  const meat = has('viande')
    ? Array.from({ length: 6 }, () => {
        const [x, y] = polar(16, 58)
        return { x, y, r: round(6.5 + rand() * 2) }
      })
    : []
  const veg = has('legume')
    ? Array.from({ length: 9 }, () => {
        const [x, y] = polar(10, 60)
        return { x, y, olive: rand() > 0.5, rot: round(rand() * 180) }
      })
    : []
  const herbs = has('herbe')
    ? Array.from({ length: 4 }, () => {
        const [x, y] = polar(8, 50)
        return { x, y, rot: round(rand() * 360), s: round(0.85 + rand() * 0.4) }
      })
    : []
  return { leopard, base, cheese, meat, veg, herbs, colors: BASES[props.baseKind] ?? BASES.sans! }
})
</script>

<template>
  <svg
    viewBox="0 0 200 200"
    aria-hidden="true"
    class="block size-full"
  >
    <defs>
      <radialGradient
        :id="`${uid}-crust`"
        cx="50%"
        cy="45%"
        r="55%"
      >
        <stop
          offset="70%"
          stop-color="#e9b86c"
        />
        <stop
          offset="88%"
          stop-color="#d0893a"
        />
        <stop
          offset="100%"
          stop-color="#8f4e1c"
        />
      </radialGradient>
      <radialGradient
        :id="`${uid}-base`"
        cx="45%"
        cy="40%"
        r="65%"
      >
        <stop
          offset="0%"
          :stop-color="art.colors[0]"
        />
        <stop
          offset="100%"
          :stop-color="art.colors[1]"
        />
      </radialGradient>
      <radialGradient
        :id="`${uid}-cheese`"
        cx="40%"
        cy="35%"
        r="70%"
      >
        <stop
          offset="0%"
          stop-color="#fffdf6"
        />
        <stop
          offset="100%"
          stop-color="#efdcb2"
        />
      </radialGradient>
      <radialGradient
        :id="`${uid}-light`"
        cx="35%"
        cy="30%"
        r="75%"
      >
        <stop
          offset="0%"
          stop-color="#fff6e0"
          stop-opacity="0.22"
        />
        <stop
          offset="60%"
          stop-color="#fff6e0"
          stop-opacity="0"
        />
        <stop
          offset="100%"
          stop-color="#000"
          stop-opacity="0.25"
        />
      </radialGradient>
    </defs>
    <ellipse
      cx="100"
      cy="106"
      rx="94"
      ry="92"
      fill="#000"
      opacity="0.45"
    />
    <circle
      cx="100"
      cy="100"
      r="92"
      :fill="`url(#${uid}-crust)`"
    />
    <circle
      v-for="(s, i) in art.leopard"
      :key="`l${i}`"
      :cx="s.x"
      :cy="s.y"
      :r="s.r"
      fill="#3a1a08"
      :opacity="s.o"
    />
    <path
      :d="art.base"
      :fill="`url(#${uid}-base)`"
    />
    <g
      v-for="(c, i) in art.cheese"
      :key="`c${i}`"
    >
      <path
        :d="c.d"
        :fill="`url(#${uid}-cheese)`"
      />
      <circle
        :cx="c.x + 2"
        :cy="c.y + 1"
        r="1.6"
        fill="#c9893d"
        opacity="0.55"
      />
    </g>
    <g
      v-for="(mt, i) in art.meat"
      :key="`m${i}`"
    >
      <circle
        :cx="mt.x"
        :cy="mt.y"
        :r="mt.r"
        fill="#a33a26"
      />
      <circle
        :cx="mt.x - 1"
        :cy="mt.y - 1"
        :r="mt.r * 0.6"
        fill="#c4553a"
        opacity="0.7"
      />
    </g>
    <g
      v-for="(vg, i) in art.veg"
      :key="`v${i}`"
      :transform="`translate(${vg.x} ${vg.y}) rotate(${vg.rot})`"
    >
      <circle
        v-if="vg.olive"
        r="3.6"
        fill="none"
        stroke="#231b16"
        stroke-width="2.4"
      />
      <ellipse
        v-else
        rx="5"
        ry="2.4"
        fill="#c98a57"
      />
    </g>
    <g
      v-for="(h, i) in art.herbs"
      :key="`h${i}`"
      :transform="`translate(${h.x} ${h.y}) rotate(${h.rot}) scale(${h.s})`"
    >
      <path
        d="M0 -11 C 7 -6, 7 6, 0 11 C -7 6, -7 -6, 0 -11 Z"
        fill="#3a7a2a"
      />
      <path
        d="M0 -10 L0 10"
        stroke="#2a5c1e"
        stroke-width="0.8"
      />
    </g>
    <circle
      cx="100"
      cy="100"
      r="92"
      :fill="`url(#${uid}-light)`"
    />
  </svg>
</template>
