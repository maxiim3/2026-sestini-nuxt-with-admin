<script setup lang="ts">
import { smoothPath } from './geo'

/** Pizza dessinée au trait, façon gravure : remplace la photo tant qu'il n'y en a pas */
const props = withDefaults(defineProps<{ seed?: number }>(), { seed: 7 })

function rng(seed: number) {
  let s = seed >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}

// Arrondi : mêmes valeurs au rendu serveur et à l'hydratation
const r1 = (n: number) => Math.round(n * 10) / 10

const art = computed(() => {
  const rand = rng(props.seed)
  // Cornicione : hachures rayonnantes irrégulières
  const crust: string[] = []
  for (let i = 0; i < 150; i++) {
    const a = (i / 150) * Math.PI * 2 + rand() * 0.02
    const ra = 150 + rand() * 4, rb = 166 + rand() * 6
    crust.push(`M${(200 + Math.cos(a) * ra).toFixed(1)} ${(200 + Math.sin(a) * ra).toFixed(1)}L${(200 + Math.cos(a) * rb).toFixed(1)} ${(200 + Math.sin(a) * rb).toFixed(1)}`)
  }
  // Brûlures du feu de bois sur la croûte
  const char = Array.from({ length: 9 }, () => {
    const a = rand() * Math.PI * 2
    return { x: r1(200 + Math.cos(a) * 161), y: r1(200 + Math.sin(a) * 161), r: r1(3 + rand() * 5) }
  })
  // Fromage : taches irrégulières
  const cheese = Array.from({ length: 11 }, () => {
    const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * 112
    const cx = 200 + Math.cos(a) * d, cy = 200 + Math.sin(a) * d, r = 16 + rand() * 14
    const pts = Array.from({ length: 7 }, (_, k) => {
      const t = (k / 7) * Math.PI * 2, rr = r * (0.75 + rand() * 0.4)
      return [cx + Math.cos(t) * rr, cy + Math.sin(t) * rr] as const
    })
    return smoothPath(pts.map(p => ({ x: p[0], y: p[1] })), true)
  })
  // Feuilles de basilic
  const leaves = Array.from({ length: 6 }, () => {
    const a = rand() * Math.PI * 2, d = 30 + rand() * 90
    return { x: r1(200 + Math.cos(a) * d), y: r1(200 + Math.sin(a) * d), rot: r1(rand() * 360), s: r1(0.8 + rand() * 0.5) }
  })
  // Pointillé de la sauce
  const dots = Array.from({ length: 220 }, () => {
    const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * 142
    return { x: r1(200 + Math.cos(a) * d), y: r1(200 + Math.sin(a) * d) }
  })
  return { crust: crust.join(''), char, cheese, leaves, dots }
})
</script>

<template>
  <svg
    viewBox="0 0 400 400"
    aria-hidden="true"
    class="block size-full"
  >
    <circle
      cx="200"
      cy="200"
      r="190"
      fill="none"
      class="stroke-farine-200/15"
      stroke-dasharray="2 5"
    />
    <circle
      cx="200"
      cy="200"
      r="172"
      class="fill-braise-950/50 stroke-farine-200/70"
      stroke-width="1.2"
    />
    <path
      :d="art.crust"
      class="stroke-braise-300/45"
      stroke-width=".8"
    />
    <circle
      v-for="(c, i) in art.char"
      :key="`c${i}`"
      :cx="c.x"
      :cy="c.y"
      :r="c.r"
      class="fill-charbon-950/70"
    />
    <circle
      cx="200"
      cy="200"
      r="150"
      class="fill-tomate-600/30 stroke-farine-200/60"
      stroke-width="1"
    />
    <circle
      v-for="(d, i) in art.dots"
      :key="`d${i}`"
      :cx="d.x"
      :cy="d.y"
      r=".9"
      class="fill-tomate-400/50"
    />
    <path
      v-for="(d, i) in art.cheese"
      :key="`f${i}`"
      :d="d"
      class="fill-farine-100/75 stroke-farine-50/90"
      stroke-width=".8"
      stroke-linejoin="round"
    />
    <g
      v-for="(l, i) in art.leaves"
      :key="`l${i}`"
      :transform="`translate(${l.x} ${l.y}) rotate(${l.rot}) scale(${l.s})`"
    >
      <path
        d="M-14 0Q0 -11 14 0Q0 11 -14 0Z"
        class="fill-charbon-950 stroke-braise-200"
        stroke-width="1"
      />
      <path
        d="M-14 0H12M-4 0L2 -5M2 0L7 -4M-4 0L2 5M2 0L7 4"
        class="stroke-braise-200/70"
        stroke-width=".7"
        fill="none"
      />
    </g>
  </svg>
</template>
