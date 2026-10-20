<script setup lang="ts">
import {
  coastPath, coastPts, gardioleLabel, graticule, hills, KM, lagoons, maguelone, montpellier,
  rivers, roads, seaLabel, seaPath, smoothPath, towns, type Pt,
} from './geo'
import { pointAt, ROMAN, type TourRoute, type TourStop } from './useTour'

export interface MapView { x: number, y: number, w: number, h: number }

const props = withDefaults(defineProps<{
  view: MapView
  stops: TourStop[]
  route?: TourRoute | null
  /** Notes sous chaque étape (« mer. · ven. ») */
  notes?: Record<string, string>
  activeKey?: string | null
  resting?: boolean
  /** Dessin progressif du trait au chargement */
  draw?: boolean
  truck?: boolean
  /** Position initiale du camion (sinon début du tracé) */
  truckAt?: Pt | null
  seaText: string
  scaleText: string
  label: string
  minor?: boolean
  /** Cadrage serré (mobile) : étiquettes sous les étapes, habillage allégé */
  compact?: boolean
}>(), {
  route: null,
  notes: () => ({}),
  activeKey: null,
  resting: false,
  draw: false,
  truck: true,
  truckAt: null,
  minor: true,
  compact: false,
})

const uid = useId()
const svg = useTemplateRef<SVGSVGElement>('svg')
const truckEl = useTemplateRef<SVGGElement>('truckEl')
const flipEl = useTemplateRef<SVGGElement>('flipEl')
const traveledEl = useTemplateRef<SVGPathElement>('traveledEl')

/** Unités de carte par pixel CSS : garde traits et textes à taille constante quel que soit le cadrage */
const u = ref(1)
function measure() {
  const el = svg.value
  if (!el) return
  const { width, height } = el.getBoundingClientRect()
  if (!width || !height) return
  u.value = Math.max(props.view.w / width, props.view.h / height)
}

let ro: ResizeObserver | null = null
onMounted(() => {
  measure()
  ro = new ResizeObserver(measure)
  if (svg.value) ro.observe(svg.value)
})
onBeforeUnmount(() => ro?.disconnect())
watch(() => props.view, measure)

const viewBox = computed(() => `${props.view.x} ${props.view.y} ${props.view.w} ${props.view.h}`)
const fs = (px: number) => px * u.value
const sw = (px: number) => px * u.value

// Étiquettes des étapes : côté opposé au centre de gravité de la tournée
const centroid = computed(() => {
  const n = props.stops.length || 1
  return {
    x: props.stops.reduce((s, p) => s + p.at.x, 0) / n,
    y: props.stops.reduce((s, p) => s + p.at.y, 0) / n,
  }
})
/** Coupe les noms longs au premier trait d'union (« Villeneuve- / lès-Maguelone ») */
const cityLines = (city: string) => {
  const up = city.toUpperCase()
  const i = up.indexOf('-')
  return up.length > 14 && i > 0 ? [up.slice(0, i + 1), up.slice(i + 1)] : [up]
}
/** En cadrage serré, une étape trop basse garde son étiquette à côté plutôt que dessous */
const lowStop = (s: TourStop) => s.at.y > props.view.y + props.view.h * 0.8
const stopSide = (s: TourStop) => {
  if (props.compact) return s.at.x > props.view.x + props.view.w * 0.6 ? -1 : 1
  return props.stops.length > 1 && s.at.x < centroid.value.x - 4 ? -1 : 1
}

// Ondes côtières, façon carte gravée
const ripples = [5, 10, 16, 24]
const coastOffset = (dy: number) => smoothPath(coastPts.map(p => ({ x: p.x, y: p.y + dy })))

const scaleBar = computed(() => {
  const len = 2 * KM
  return { x: props.view.x + 22 * u.value, y: props.view.y + props.view.h - 22 * u.value, len }
})
const compass = computed(() => ({ x: props.view.x + props.view.w - 34 * u.value, y: props.view.y + props.view.h - 44 * u.value }))

const startPt = computed(() => props.truckAt ?? props.route?.pts[0] ?? props.stops[0]?.at ?? montpellier)

const truckScale = computed(() => (props.compact ? 1.05 : 1.25) * u.value)
let facing: 1 | -1 = 1
/** Place le camion à une distance donnée du tracé (appelé à chaque image par le défilement) */
function setProgress(dist: number, moving: boolean) {
  if (!props.route) return
  const { p, dir } = pointAt(props.route, dist)
  if (dir) facing = dir
  truckEl.value?.setAttribute('transform', `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`)
  flipEl.value?.setAttribute('transform', `scale(${facing * truckScale.value} ${truckScale.value})`)
  truckEl.value?.classList.toggle('is-moving', moving)
  traveledEl.value?.setAttribute('stroke-dasharray', `${Math.max(0, dist).toFixed(1)} ${(props.route.total + 10).toFixed(0)}`)
}

watch(truckScale, k => flipEl.value?.setAttribute('transform', `scale(${facing * k} ${k})`))

defineExpose({ setProgress })
</script>

<template>
  <svg
    ref="svg"
    class="tour-map block size-full select-none"
    :class="{ 'is-drawing': draw, 'is-resting': resting }"
    :viewBox="viewBox"
    preserveAspectRatio="xMidYMid meet"
    role="img"
    :aria-label="label"
    :style="{ '--u': u }"
  >
    <defs>
      <pattern
        :id="`${uid}-sea`"
        patternUnits="userSpaceOnUse"
        :width="sw(6)"
        :height="sw(4.5)"
      >
        <path
          :d="`M0 ${sw(2.25)}H${sw(6)}`"
          class="stroke-farine-200/14"
          :stroke-width="sw(0.6)"
        />
      </pattern>
      <pattern
        :id="`${uid}-lagoon`"
        patternUnits="userSpaceOnUse"
        :width="sw(3)"
        :height="sw(3)"
        patternTransform="rotate(-30)"
      >
        <path
          :d="`M0 ${sw(1.5)}H${sw(3)}`"
          class="stroke-farine-200/25"
          :stroke-width="sw(0.55)"
        />
      </pattern>
      <clipPath :id="`${uid}-seaclip`">
        <path :d="seaPath" />
      </clipPath>
      <mask
        :id="`${uid}-roads`"
        maskUnits="userSpaceOnUse"
        x="-500"
        y="-500"
        width="2000"
        height="2000"
      >
        <path
          v-for="(d, i) in roads"
          :key="i"
          :d="d"
          pathLength="1"
          fill="none"
          stroke="#fff"
          :stroke-width="sw(8)"
          class="draw"
          :style="{ animationDelay: `${0.9 + i * 0.08}s` }"
        />
      </mask>
      <radialGradient :id="`${uid}-glow`">
        <stop
          offset="0"
          stop-color="#E0AA3E"
          stop-opacity=".55"
        />
        <stop
          offset="1"
          stop-color="#E0AA3E"
          stop-opacity="0"
        />
      </radialGradient>
    </defs>

    <!-- Fond -->
    <rect
      x="-500"
      y="-500"
      width="2000"
      height="2000"
      class="fill-charbon-900"
    />

    <!-- Graticule -->
    <g
      class="fade"
      style="animation-delay: .2s"
    >
      <line
        v-for="l in graticule.lat"
        :key="l.label"
        x1="-500"
        :x2="1500"
        :y1="l.y"
        :y2="l.y"
        class="stroke-farine-200/7"
        :stroke-width="sw(0.6)"
      />
      <line
        v-for="l in graticule.lng"
        :key="l.label"
        :x1="l.x"
        :x2="l.x"
        y1="-500"
        y2="1500"
        class="stroke-farine-200/7"
        :stroke-width="sw(0.6)"
      />
      <template v-if="minor && !compact">
        <text
          v-for="l in graticule.lat"
          :key="`t${l.label}`"
          :x="view.x + sw(10)"
          :y="l.y - sw(4)"
          class="fill-farine-200/35 font-sans tabular-nums"
          :font-size="fs(9)"
        >{{ l.label }}</text>
        <text
          v-for="l in graticule.lng"
          :key="`t${l.label}`"
          :x="l.x + sw(4)"
          :y="view.y + sw(16)"
          class="fill-farine-200/35 font-sans tabular-nums"
          :font-size="fs(9)"
        >{{ l.label }}</text>
      </template>
    </g>

    <!-- Mer : hachures et ondes côtières -->
    <path
      :d="seaPath"
      :fill="`url(#${uid}-sea)`"
      class="fade"
      style="animation-delay: .4s"
    />
    <g
      :clip-path="`url(#${uid}-seaclip)`"
      fill="none"
    >
      <path
        v-for="(dy, i) in ripples"
        :key="dy"
        :d="coastOffset(sw(dy))"
        pathLength="1"
        class="draw stroke-farine-200"
        :stroke-opacity="0.32 - i * 0.07"
        :stroke-width="sw(0.7)"
        :style="{ animationDelay: `${0.25 + i * 0.12}s` }"
      />
    </g>
    <path
      :d="coastPath"
      pathLength="1"
      fill="none"
      class="draw stroke-farine-100"
      :stroke-width="sw(1.4)"
      stroke-linecap="round"
    />

    <!-- Étangs -->
    <g
      v-for="(w, i) in lagoons"
      :key="w.id"
    >
      <path
        :d="w.d"
        :fill="`url(#${uid}-lagoon)`"
        class="fade"
        :style="{ animationDelay: `${0.8 + i * 0.06}s` }"
      />
      <path
        :d="w.d"
        pathLength="1"
        fill="none"
        class="draw stroke-farine-200/75"
        :stroke-width="sw(0.9)"
        :style="{ animationDelay: `${0.5 + i * 0.1}s` }"
      />
    </g>

    <!-- Rivières -->
    <path
      v-for="(d, i) in rivers"
      :key="`r${i}`"
      :d="d"
      pathLength="1"
      fill="none"
      class="draw stroke-farine-200/30"
      :stroke-width="sw(0.8)"
      :style="{ animationDelay: `${0.7 + i * 0.2}s` }"
    />

    <!-- Massif de la Gardiole -->
    <g
      class="fade stroke-farine-200/30"
      fill="none"
      :stroke-width="sw(0.75)"
      style="animation-delay: 1.1s"
    >
      <path
        v-for="(d, i) in hills"
        :key="i"
        :d="d"
      />
    </g>

    <!-- Routes (pointillés révélés par un masque) -->
    <g
      :mask="draw ? `url(#${uid}-roads)` : undefined"
      fill="none"
      class="stroke-farine-200/35"
      :stroke-width="sw(0.9)"
      :stroke-dasharray="`${sw(3.5)} ${sw(3)}`"
    >
      <path
        v-for="(d, i) in roads"
        :key="i"
        :d="d"
      />
    </g>

    <!-- Toponymes -->
    <g
      class="fade font-serif italic"
      style="animation-delay: 1.4s"
    >
      <template
        v-for="w in lagoons"
        :key="w.id"
      >
        <text
          v-if="w.label && minor && !compact"
          :transform="`translate(${w.label.at.x} ${w.label.at.y}) rotate(${w.label.rotate})`"
          text-anchor="middle"
          class="halo fill-farine-200/60"
          :font-size="fs(w.label.size)"
        >{{ w.label.text }}</text>
      </template>
      <text
        v-if="minor && !compact"
        :x="gardioleLabel.x"
        :y="gardioleLabel.y"
        text-anchor="middle"
        class="halo fill-farine-200/50"
        :font-size="fs(11)"
      >Massif de la Gardiole</text>
      <text
        :x="seaLabel.x"
        :y="seaLabel.y"
        text-anchor="middle"
        class="fill-farine-200/45"
        :font-size="fs(15)"
        :letter-spacing="fs(5)"
      >{{ seaText }}</text>
    </g>

    <!-- Villes de repère -->
    <g
      v-if="minor"
      class="fade"
      style="animation-delay: 1.6s"
    >
      <g
        v-for="t in towns.filter(x => !compact || !x.wideOnly)"
        :key="t.id"
        :transform="`translate(${t.at.x} ${t.at.y})`"
      >
        <circle
          :r="sw(2)"
          class="fill-farine-200/55"
        />
        <text
          :x="sw(t.dx ?? 0)"
          :y="sw(t.dy ?? 0)"
          :text-anchor="t.anchor ?? 'start'"
          class="halo fill-farine-200/55 font-sans uppercase"
          :font-size="fs(8.5)"
          :letter-spacing="fs(1.2)"
        >{{ t.name }}</text>
      </g>
      <g :transform="`translate(${maguelone.x} ${maguelone.y})`">
        <path
          :d="`M0 ${-sw(5)}V${sw(5)}M${-sw(3)} ${-sw(1.5)}H${sw(3)}`"
          class="stroke-farine-200/60"
          :stroke-width="sw(1)"
        />
        <text
          v-if="!compact"
          :x="sw(7)"
          :y="sw(12)"
          class="halo fill-farine-200/55 font-serif italic"
          :font-size="fs(10)"
        >Maguelone</text>
      </g>
    </g>

    <!-- Montpellier -->
    <g
      class="fade"
      style="animation-delay: 1.2s"
      :transform="`translate(${montpellier.x} ${montpellier.y})`"
    >
      <circle
        :r="sw(9)"
        fill="none"
        class="stroke-farine-200/40"
        :stroke-width="sw(0.8)"
        :stroke-dasharray="`${sw(1.5)} ${sw(1.5)}`"
      />
      <path
        :d="`M0 ${-sw(4.5)}L${sw(1.3)} ${-sw(1.3)}L${sw(4.5)} 0L${sw(1.3)} ${sw(1.3)}L0 ${sw(4.5)}L${-sw(1.3)} ${sw(1.3)}L${-sw(4.5)} 0L${-sw(1.3)} ${-sw(1.3)}Z`"
        class="fill-farine-100"
      />
      <text
        :x="compact ? -sw(15) : sw(15)"
        :y="sw(4.5)"
        :text-anchor="compact ? 'end' : 'start'"
        class="halo fill-farine-100/85 font-display"
        :font-size="fs(compact ? 11 : 13)"
        :letter-spacing="fs(2.5)"
      >MONTPELLIER</text>
    </g>

    <!-- Tracé de la semaine -->
    <g
      v-if="route"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path
        :d="route.d"
        class="stroke-braise-400/30 fade"
        style="animation-delay: 1.8s"
        :stroke-width="sw(1.2)"
      />
      <path
        ref="traveledEl"
        :d="route.d"
        class="traveled stroke-braise-300"
        :stroke-width="sw(2.4)"
        :stroke-dasharray="`0 ${route.total + 10}`"
      />
    </g>

    <!-- Étapes -->
    <g
      class="fade"
      style="animation-delay: 1.5s"
    >
      <g
        v-for="s in stops"
        :key="s.key"
        class="stop"
        :class="{ 'is-active': s.key === activeKey }"
        :transform="`translate(${s.at.x} ${s.at.y})`"
      >
        <circle
          :r="sw(26)"
          :fill="`url(#${uid}-glow)`"
          class="stop-glow"
        />
        <circle
          :r="sw(13)"
          fill="none"
          class="stop-ring stroke-braise-300"
          :stroke-width="sw(1)"
        />
        <circle
          :r="sw(7.5)"
          class="fill-charbon-900 stroke-braise-300"
          :stroke-width="sw(1.6)"
        />
        <circle
          :r="sw(2.8)"
          class="fill-braise-300"
        />
        <g
          v-if="compact && !lowStop(s)"
          :transform="`translate(0 ${sw(26)})`"
        >
          <text
            text-anchor="middle"
            class="halo stop-name fill-farine-50 font-display font-semibold"
            :font-size="fs(11.5)"
            :letter-spacing="fs(1)"
          ><tspan
            v-for="(line, li) in cityLines(s.city)"
            :key="li"
            x="0"
            :dy="li ? fs(13) : 0"
          >{{ line }}</tspan></text>
          <text
            v-if="notes[s.key]"
            text-anchor="middle"
            :y="sw(13 * cityLines(s.city).length + 2)"
            class="halo fill-braise-200 font-serif italic"
            :font-size="fs(10.5)"
          >{{ notes[s.key] }}</text>
        </g>
        <g
          v-else
          :transform="`translate(${stopSide(s) * sw(compact ? 15 : 22)} 0)`"
        >
          <text
            :text-anchor="stopSide(s) < 0 ? 'end' : 'start'"
            :y="sw(-3)"
            class="halo stop-name fill-farine-50 font-display font-semibold"
            :font-size="fs(compact ? 11.5 : 15)"
            :letter-spacing="fs(compact ? 1 : 1.4)"
          ><tspan
            class="fill-braise-300"
            :font-size="fs(10)"
          >{{ ROMAN[s.order - 1] }}&#8202;·&#8202;</tspan>{{ s.city.toUpperCase() }}</text>
          <text
            v-if="notes[s.key]"
            :text-anchor="stopSide(s) < 0 ? 'end' : 'start'"
            :y="sw(13)"
            class="halo fill-braise-200 font-serif italic"
            :font-size="fs(11.5)"
          >{{ notes[s.key] }}</text>
        </g>
      </g>
    </g>

    <!-- Camion -->
    <g
      v-if="truck"
      ref="truckEl"
      class="truck"
      :transform="`translate(${startPt.x} ${startPt.y})`"
    >
      <g :transform="`translate(0 ${-sw(7)})`">
        <g class="truck-bob">
          <g
            ref="flipEl"
            :transform="`scale(${truckScale} ${truckScale})`"
          >
            <ellipse
              cx="0"
              cy="0.6"
              rx="18"
              ry="2"
              fill="#000"
              opacity=".5"
            />
            <g class="smoke fill-farine-200">
              <circle
                cx="-9.8"
                cy="-25"
                r="1.5"
              />
              <circle
                cx="-9"
                cy="-25"
                r="2"
              />
              <circle
                cx="-10.4"
                cy="-25"
                r="1.7"
              />
            </g>
            <rect
              x="-11"
              y="-22"
              width="2.4"
              height="5"
              class="fill-farine-200"
            />
            <rect
              x="-11.7"
              y="-22.8"
              width="3.8"
              height="1.3"
              rx=".4"
              class="fill-farine-200"
            />
            <path
              d="M-17.5 -4.2V-15.6Q-17.5 -17.8 -15.3 -17.8H7.4V-4.2Z"
              class="fill-farine-50"
            />
            <path
              d="M7 -14.6H12.6Q13.7 -14.6 14.3 -13.7L17.2 -9.4Q17.7 -8.7 17.7 -7.8V-5.4Q17.7 -4.2 16.5 -4.2H7Z"
              class="fill-farine-50"
            />
            <path
              d="M8.6 -13.1H12.2L14.9 -9.3H8.6Z"
              class="fill-charbon-900"
            />
            <rect
              x="-14.6"
              y="-14.3"
              width="16"
              height="6.4"
              rx=".8"
              class="fill-charbon-900"
            />
            <ellipse
              class="ember"
              cx="-6.6"
              cy="-9.6"
              rx="4.6"
              ry="2.1"
              fill="#E0AA3E"
            />
            <path
              d="M-15.6 -15.6H2.8L1.8 -13.7H-14.6Z"
              fill="#E0AA3E"
            />
            <path
              d="M-17.5 -6.4H17.7"
              class="stroke-charbon-900/40"
              stroke-width=".6"
            />
            <g
              class="fill-charbon-950 stroke-farine-100"
              stroke-width="1"
            >
              <circle
                cx="-10"
                cy="-3.3"
                r="3.2"
              />
              <circle
                cx="11"
                cy="-3.3"
                r="3.2"
              />
            </g>
            <circle
              cx="-10"
              cy="-3.3"
              r=".9"
              class="fill-farine-100"
            />
            <circle
              cx="11"
              cy="-3.3"
              r=".9"
              class="fill-farine-100"
            />
          </g>
        </g>
      </g>
    </g>

    <!-- Échelle et rose des vents -->
    <g
      v-if="minor && !compact"
      class="fade font-sans"
      style="animation-delay: 2s"
    >
      <g :transform="`translate(${scaleBar.x} ${scaleBar.y})`">
        <path
          :d="`M0 0H${scaleBar.len}M0 ${-sw(4)}V${sw(1)}M${scaleBar.len / 2} ${-sw(2.5)}V0M${scaleBar.len} ${-sw(4)}V${sw(1)}`"
          class="stroke-farine-200/60"
          :stroke-width="sw(1)"
          fill="none"
        />
        <text
          :x="scaleBar.len + sw(6)"
          :y="sw(1)"
          class="fill-farine-200/60"
          :font-size="fs(9)"
          :letter-spacing="fs(1)"
        >{{ scaleText }}</text>
      </g>
      <g :transform="`translate(${compass.x} ${compass.y})`">
        <circle
          :r="sw(13)"
          fill="none"
          class="stroke-farine-200/30"
          :stroke-width="sw(0.7)"
        />
        <path
          :d="`M0 ${-sw(17)}L${sw(3.2)} 0L0 ${sw(17)}L${-sw(3.2)} 0Z`"
          class="fill-farine-200/25"
        />
        <path
          :d="`M0 ${-sw(17)}L${sw(3.2)} 0H${-sw(3.2)}Z`"
          class="fill-braise-300"
        />
        <text
          :y="-sw(21)"
          text-anchor="middle"
          class="fill-farine-200/70 font-display"
          :font-size="fs(9)"
        >N</text>
      </g>
    </g>

    <!-- Relâche : la carte s'assoupit -->
    <rect
      x="-500"
      y="-500"
      width="2000"
      height="2000"
      class="night pointer-events-none fill-charbon-950"
    />
  </svg>
</template>

<style scoped>
.tour-map :deep(text) {
  font-kerning: normal;
}

.halo {
  paint-order: stroke;
  stroke: var(--color-charbon-900);
  stroke-width: calc(3.5px * var(--u));
  stroke-linejoin: round;
}

/* Dessin progressif au chargement : pur CSS, donc aucun délai d'hydratation */
.is-drawing .draw {
  stroke-dasharray: 1;
  animation: draw 2.6s cubic-bezier(.45, .05, .2, 1) both;
}
.is-drawing .fade {
  animation: fade 1.2s ease both;
}
@keyframes draw {
  from { stroke-dashoffset: 1; }
  to { stroke-dashoffset: 0; }
}
@keyframes fade {
  from { opacity: 0; }
}

.traveled {
  filter: drop-shadow(0 0 calc(3px * var(--u)) rgb(224 170 62 / 0.55));
}

.stop-ring,
.stop-glow {
  opacity: 0;
  transform-box: fill-box;
  transform-origin: center;
  transition: opacity .5s ease;
}
.stop.is-active .stop-glow {
  opacity: 1;
}
.stop.is-active .stop-ring {
  opacity: 1;
  animation: ring 2.4s ease-out infinite;
}
@keyframes ring {
  from { transform: scale(.6); opacity: .9; }
  to { transform: scale(1.9); opacity: 0; }
}

.night {
  opacity: 0;
  transition: opacity .6s ease;
}
.is-resting .night {
  opacity: .38;
}

/* Fumée du four et léger roulis en marche */
.smoke circle {
  transform-box: fill-box;
  transform-origin: center;
  opacity: 0;
  animation: puff 2.4s ease-out infinite;
}
.smoke circle:nth-child(2) { animation-delay: .8s; }
.smoke circle:nth-child(3) { animation-delay: 1.6s; }
@keyframes puff {
  0% { transform: translate(0, 4px) scale(.5); opacity: 0; }
  20% { opacity: .55; }
  100% { transform: translate(-3px, -9px) scale(1.8); opacity: 0; }
}
.is-resting .smoke circle,
.is-resting .ember {
  animation: none;
  opacity: 0;
}
.ember {
  animation: ember 1.6s ease-in-out infinite alternate;
}
@keyframes ember {
  from { opacity: .65; }
  to { opacity: 1; }
}
.truck.is-moving .truck-bob {
  animation: bob .32s ease-in-out infinite alternate;
}
@keyframes bob {
  from { transform: translateY(0); }
  to { transform: translateY(-0.8px); }
}

@media (prefers-reduced-motion: reduce) {
  .smoke circle,
  .stop.is-active .stop-ring {
    animation: none;
  }
}
</style>
