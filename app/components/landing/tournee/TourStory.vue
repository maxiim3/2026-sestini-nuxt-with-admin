<script setup lang="ts">
import type { SiteDay } from '~/composables/useSite'
import TourMap, { type MapView } from './TourMap.vue'
import { capitalize, fill, useTourCopy, useHour } from './copy'
import { ROMAN, useTour } from './useTour'

const { t } = useI18n()
const localePath = useLocalePath()
const contact = useContact()
const { date, relativeDay } = useLocalized()
const hour = useHour()
const c = useTourCopy()
const { stops, tourDays, route, tonight, today } = useTour()

// --- Cadrages de la carte -------------------------------------------------------
const WIDE: MapView = { x: 105, y: 55, w: 790, h: 790 }
const NARROW: MapView = { x: 200, y: 72, w: 500, h: 556 }
const isWide = ref(true)

// --- Textes dérivés des données -------------------------------------------------
const nWord = computed(() => {
  const n = stops.value.length
  return c.value.numbers[n] ?? String(n)
})

function cityParts(template: string, city: string) {
  const [before = '', after = ''] = template.split('{city}')
  return { before, city, after }
}

const hero = computed(() => {
  const { mode, day } = tonight.value
  const city = day?.location?.city ?? ''
  const relDay = day ? capitalize(relativeDay(day.date, today.value)) : ''
  const pre = mode === 'rest' ? c.value.tonightRest : mode === 'over' ? c.value.tonightOver : mode === 'none' ? c.value.tonightRest : ''
  const main = mode === 'later'
    ? cityParts(c.value.tonightAt, city)
    : mode === 'open-now'
      ? cityParts(c.value.tonightOpenNow, city)
      : mode === 'none' ? null : cityParts(fill(c.value.nextAt, { day: relDay, city: '{city}' }), city)
  return { pre, main, day, hours: day ? hoursOf(day) : '' }
})

function hoursOf(day: SiteDay) {
  const from = capitalize(t('tonight.from', { time: hour(day.opensAt ?? '18:00') }))
  return day.closesAt ? `${from} · ${fill(c.value.until, { time: hour(day.closesAt) })}` : from
}

function dayTitle(iso: string) {
  const rel = relativeDay(iso, today.value)
  const long = date(iso)
  return rel === long ? capitalize(long) : `${capitalize(rel)} · ${long}`
}

const notes = computed(() => Object.fromEntries(stops.value.map(s => [s.key, s.dates.map(d => date(d, { weekday: 'short' })).join(' · ')])))

const mapLabel = computed(() => fill(c.value.mapLabel, { places: stops.value.map(s => s.city).join(', ') }))

const weekRange = computed(() => {
  const list = tourDays.value
  if (!list.length) return ''
  const first = date(list[0]!.day.date, { day: 'numeric', month: 'short' })
  const last = date(list[list.length - 1]!.day.date, { day: 'numeric', month: 'short' })
  return `${first} → ${last}`
})

// --- Défilement -------------------------------------------------------------------
/** 0 = introduction, puis un panneau par jour */
const active = ref(0)
const STEP_VH = 68
const span = computed(() => tourDays.value.length + 0.6)

const activeDay = computed(() => (active.value > 0 ? tourDays.value[active.value - 1] ?? null : null))
const activeKey = computed(() => {
  if (activeDay.value) return activeDay.value.stop?.key ?? null
  const key = tonight.value.day?.location?.city
  return stops.value.find(s => s.city === key)?.key ?? null
})
const resting = computed(() => Boolean(activeDay.value && !activeDay.value.day.open))

const section = useTemplateRef<HTMLElement>('section')
const map = useTemplateRef<InstanceType<typeof TourMap>>('map')

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2)

/** Position de lecture s → panneau actif et distance parcourue par le camion */
function render(s: number) {
  const days = tourDays.value
  const panel = Math.max(0, Math.min(days.length, Math.floor(s + 0.15)))
  if (panel !== active.value) active.value = panel
  const { arrivals } = route.value
  const k = Math.max(0, Math.min(days.length - 1, Math.floor(s - 0.85)))
  let dist = arrivals[0] ?? 0
  let moving = false
  if (s >= 0.85 && k >= 1) {
    const from = arrivals[k - 1] ?? 0, to = arrivals[k] ?? 0
    const p = Math.max(0, Math.min(1, (s - (k + 0.85)) / 0.5))
    dist = from + (to - from) * ease(p)
    moving = p > 0 && p < 1 && to !== from
  }
  map.value?.setProgress(dist, moving)
}

let ctx: { revert: () => void } | null = null
let trigger: { start: number, end: number } | null = null
const reduced = ref(false)

function goTo(index: number) {
  if (!trigger || reduced.value) return
  const s = index === 0 ? 0 : index - 1 + 1.4
  const top = trigger.start + (trigger.end - trigger.start) * (s / span.value)
  window.scrollTo({ top, behavior: 'smooth' })
}

onMounted(async () => {
  const wide = window.matchMedia('(min-width: 1024px)')
  const syncWide = () => (isWide.value = wide.matches)
  syncWide()
  wide.addEventListener('change', syncWide)
  onBeforeUnmount(() => wide.removeEventListener('change', syncWide))

  reduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  await nextTick()
  render(0)
  if (reduced.value || !section.value) return

  // GSAP chargé à la demande : le premier écran n'en dépend pas
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
  gsap.registerPlugin(ScrollTrigger)
  const state = { s: 0 }
  ctx = gsap.context(() => {
    gsap.to(state, {
      s: span.value,
      ease: 'none',
      onUpdate: () => render(state.s),
      scrollTrigger: {
        trigger: section.value,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.7,
        onRefresh: self => (trigger = { start: self.start, end: self.end }),
      },
    })
  })
  watch(route, () => render(state.s))
})

onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <section
    ref="section"
    class="story relative pt-16 lg:pt-20"
    :style="{ height: `calc(100svh + ${Math.round(span * STEP_VH)}svh)` }"
  >
    <div class="sticky top-16 flex h-[calc(100svh-4rem)] flex-col lg:top-20 lg:grid lg:h-[calc(100svh-5rem)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <!-- Carte -->
      <div class="relative min-h-[38%] flex-1 lg:order-2 lg:p-6 lg:pl-0">
        <div class="map-frame relative size-full overflow-hidden lg:rounded-sm">
          <TourMap
            ref="map"
            :view="isWide ? WIDE : NARROW"
            :stops="stops"
            :route="route"
            :notes="notes"
            :active-key="activeKey"
            :resting="resting"
            :truck-at="tourDays[0]?.at ?? null"
            :sea-text="c.sea"
            :scale-text="c.scale"
            :label="mapLabel"
            :compact="!isWide"
            draw
          />
          <!-- Cartouche -->
          <div class="pointer-events-none absolute top-3 left-3 hidden border border-farine-200/15 bg-charbon-900/85 px-4 py-3 backdrop-blur-sm sm:block lg:top-5 lg:left-5">
            <p class="eyebrow text-[0.62rem] text-braise-300">
              {{ c.eyebrow }}
            </p>
            <p class="mt-1 font-serif text-sm text-farine-100/80 italic tabular-nums">
              {{ weekRange }}
            </p>
          </div>
          <div class="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-charbon-950 to-transparent lg:hidden" />
        </div>
      </div>

      <!-- Panneaux -->
      <div class="relative flex shrink-0 flex-col justify-end px-4 pt-1 pb-[calc(env(safe-area-inset-bottom)+5.75rem)] sm:px-8 md:pb-6 lg:order-1 lg:justify-center lg:py-10 lg:pr-10 lg:pl-[max(2rem,calc((100vw-80rem)/2+2rem))]">
        <div class="panels grid">
          <!-- Introduction : lisible immédiatement, sans attendre l'animation -->
          <div
            class="panel"
            :class="{ 'is-active': active === 0 }"
          >
            <p class="eyebrow text-[0.68rem] text-braise-300">
              {{ c.eyebrow }}
            </p>
            <h1 class="mt-3 font-display text-[2rem] leading-[1.02] font-semibold tracking-tight text-farine-50 sm:text-5xl lg:mt-5 lg:text-[3.4rem] xl:text-6xl">
              {{ c.titleA }}
              <span class="block font-serif font-normal tracking-normal text-braise-300 italic">
                {{ fill(c.titleB, { n: nWord }) }}
              </span>
            </h1>
            <p class="mt-5 hidden max-w-md text-[0.95rem] leading-relaxed text-farine-100/70 lg:block">
              {{ c.lead }}
            </p>

            <div class="mt-4 border-l border-braise-400/50 pl-4 lg:mt-7">
              <p
                v-if="hero.pre"
                class="font-serif text-[0.95rem] text-farine-100/65 italic lg:text-lg"
              >
                {{ hero.pre }}
              </p>
              <p
                v-if="hero.main"
                class="font-serif text-xl leading-snug text-farine-50 lg:text-[1.65rem]"
              >
                {{ hero.main.before }}<span class="text-braise-300">{{ hero.main.city }}</span>{{ hero.main.after }}
              </p>
              <p
                v-else
                class="font-serif text-xl text-farine-50"
              >
                {{ c.noDate }}
              </p>
              <p
                v-if="hero.day?.location"
                class="mt-1 text-sm text-farine-100/60"
              >
                <span class="font-medium text-farine-100/85">{{ hero.hours }}</span>
                <span class="hidden sm:inline"> · {{ hero.day.location.name }}</span>
              </p>
            </div>

            <div class="mt-5 flex flex-wrap items-center gap-3 lg:mt-8">
              <a
                :href="contact.phoneHref"
                class="btn-fire min-h-11"
                data-track="call_clicked"
                data-track-source="landing-tournee"
              >
                <UIcon
                  name="i-lucide-phone"
                  class="size-4"
                />
                {{ t('nav.call') }}
                <span class="hidden font-normal tabular-nums opacity-80 sm:inline">{{ contact.phone }}</span>
              </a>
              <NuxtLink
                :to="localePath('la-carte')"
                class="btn-ghost min-h-11 text-farine-100"
              >
                {{ t('home.seeMenu') }}
              </NuxtLink>
            </div>
          </div>

          <!-- Une étape par jour -->
          <div
            v-for="(d, i) in tourDays"
            :key="d.day.date"
            class="panel motion-reduce:hidden"
            :class="{ 'is-active': active === i + 1 }"
            aria-hidden="true"
          >
            <p class="eyebrow text-[0.62rem] text-braise-300">
              {{ fill(c.day, { n: i + 1, total: tourDays.length }) }}
            </p>
            <p class="mt-2 font-serif text-lg text-farine-100/80 italic lg:text-xl">
              {{ dayTitle(d.day.date) }}
            </p>
            <template v-if="d.day.open && d.day.location">
              <p class="mt-1 font-display text-[1.9rem] leading-tight font-semibold text-farine-50 sm:text-4xl lg:mt-2 lg:text-5xl">
                <span
                  v-if="d.stop"
                  class="mr-2 align-middle font-display text-base text-braise-300 lg:text-xl"
                >{{ ROMAN[d.stop.order - 1] }}</span>{{ d.day.location.city }}
              </p>
              <p
                v-if="d.day.exception"
                class="mt-2 inline-flex rounded-full border border-tomate-400/50 bg-tomate-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-tomate-400 uppercase"
              >
                {{ c.exception[d.day.exception.kind] }}
              </p>
              <dl class="mt-3 grid gap-1.5 text-sm text-farine-100/75 lg:mt-5 lg:text-base">
                <div class="flex items-center gap-2.5">
                  <dt class="sr-only">
                    {{ t('tonight.label') }}
                  </dt>
                  <UIcon
                    name="i-lucide-flame"
                    class="size-4 shrink-0 text-braise-300"
                  />
                  <dd class="font-medium text-farine-50">
                    {{ hoursOf(d.day) }}
                  </dd>
                </div>
                <div class="flex items-start gap-2.5">
                  <dt class="sr-only">
                    {{ t('nav.findUs') }}
                  </dt>
                  <UIcon
                    name="i-lucide-map-pin"
                    class="mt-0.5 size-4 shrink-0 text-braise-300"
                  />
                  <dd>{{ d.day.location.name }} <span class="text-farine-100/50">· {{ d.day.location.address }}</span></dd>
                </div>
              </dl>
              <p
                v-if="d.day.exception?.note"
                class="mt-3 max-w-md text-sm text-tomate-400"
              >
                {{ d.day.exception.note }}
              </p>
              <p
                v-if="d.stop && c.villages[d.stop.key]"
                class="mt-3 max-w-md font-serif text-[0.95rem] leading-relaxed text-farine-100/65 italic lg:mt-6 lg:text-lg"
              >
                {{ c.villages[d.stop.key] }}
              </p>
            </template>
            <template v-else>
              <p class="mt-1 font-display text-[1.9rem] leading-tight font-semibold text-farine-100/80 sm:text-4xl lg:mt-2 lg:text-5xl">
                {{ c.restTitle }}
              </p>
              <p
                v-if="d.day.exception"
                class="mt-2 inline-flex rounded-full border border-tomate-400/50 bg-tomate-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-tomate-400 uppercase"
              >
                {{ c.exception[d.day.exception.kind] }}
              </p>
              <p class="mt-3 max-w-md font-serif text-[0.95rem] leading-relaxed text-farine-100/65 italic lg:mt-5 lg:text-lg">
                {{ d.day.exception?.note || c.restText }}
              </p>
              <p
                v-if="d.next?.location"
                class="mt-3 flex items-center gap-2.5 text-sm text-farine-100/80 lg:mt-5 lg:text-base"
              >
                <UIcon
                  name="i-lucide-moon"
                  class="size-4 shrink-0 text-braise-300"
                />
                {{ fill(c.restNext, { day: relativeDay(d.next.date, today).toLocaleLowerCase(), city: d.next.location.city }) }}
              </p>
            </template>
          </div>
        </div>

        <!-- Frise de la semaine -->
        <nav
          class="ruler mt-5 motion-reduce:hidden lg:mt-10"
          :aria-label="c.week"
        >
          <ol class="grid grid-cols-7 border-t border-farine-200/15">
            <li
              v-for="(d, i) in tourDays"
              :key="d.day.date"
            >
              <button
                type="button"
                class="group relative flex min-h-11 w-full flex-col items-center pt-2 pb-1 text-center transition-colors"
                :class="active === i + 1 ? 'text-farine-50' : 'text-farine-100/45 hover:text-farine-100/80'"
                :aria-label="fill(c.goTo, { day: date(d.day.date) })"
                :aria-current="active === i + 1 ? 'step' : undefined"
                @click="goTo(i + 1)"
              >
                <span
                  class="absolute -top-px right-1 left-1 h-0.5 origin-left transition-transform duration-500"
                  :class="active > i ? 'scale-x-100 bg-braise-300' : 'scale-x-0 bg-braise-300'"
                />
                <span class="text-[0.65rem] tracking-[0.14em] uppercase">{{ date(d.day.date, { weekday: 'short' }).replace('.', '') }}</span>
                <span
                  class="mt-0.5 font-display text-[0.7rem]"
                  :class="d.stop ? 'text-braise-300' : 'text-farine-100/30'"
                >{{ d.stop ? ROMAN[d.stop.order - 1] : '—' }}</span>
              </button>
            </li>
          </ol>
        </nav>
        <p
          class="mt-3 hidden items-center gap-2 text-xs tracking-[0.2em] text-farine-100/45 uppercase transition-opacity duration-500 motion-reduce:hidden lg:flex"
          :class="active === 0 ? 'opacity-100' : 'opacity-0'"
        >
          <UIcon
            name="i-lucide-arrow-down"
            class="size-3.5 animate-bounce"
          />
          {{ c.scroll }}
        </p>
      </div>
    </div>

    <!-- Semaine en clair : lecteurs d'écran, et liste visible si les animations sont réduites -->
    <div class="sr-only motion-reduce:not-sr-only motion-reduce:mx-auto motion-reduce:max-w-6xl motion-reduce:px-4 motion-reduce:pt-10 motion-reduce:pb-4 sm:motion-reduce:px-8">
      <h2 class="eyebrow mb-4 text-braise-300">
        {{ c.week }}
      </h2>
      <ol class="divide-y divide-farine-200/10 border-y border-farine-200/10">
        <li
          v-for="d in tourDays"
          :key="d.day.date"
          class="grid grid-cols-[7rem_1fr] gap-3 py-3 text-sm"
        >
          <span class="text-farine-100/60">{{ capitalize(date(d.day.date, { weekday: 'long', day: 'numeric' })) }}</span>
          <span v-if="d.day.open && d.day.location">
            <strong class="font-display text-farine-50">{{ d.day.location.city }}</strong>
            · {{ hoursOf(d.day) }} · {{ d.day.location.name }}
            <em
              v-if="d.day.exception"
              class="text-tomate-400"
            > · {{ c.exception[d.day.exception.kind] }}</em>
          </span>
          <span
            v-else
            class="font-serif text-farine-100/60 italic"
          >{{ c.restTitle }}</span>
        </li>
      </ol>
    </div>
  </section>
</template>

<style scoped>
.map-frame {
  background: var(--color-charbon-900);
}
@media (min-width: 1024px) {
  .map-frame {
    box-shadow: 0 0 0 1px rgb(241 232 214 / 0.14), 0 0 0 6px var(--color-charbon-950), 0 0 0 7px rgb(241 232 214 / 0.08);
  }
}

.panels > .panel {
  grid-area: 1 / 1;
  align-self: end;
  opacity: 0;
  visibility: hidden;
  transform: translateY(14px);
  transition: opacity .45s ease, transform .6s cubic-bezier(.2, .7, .2, 1), visibility 0s linear .45s;
}
.panels > .panel.is-active {
  opacity: 1;
  visibility: visible;
  transform: none;
  transition: opacity .55s ease .1s, transform .7s cubic-bezier(.2, .7, .2, 1) .1s, visibility 0s;
}
@media (min-width: 1024px) {
  .panels > .panel {
    align-self: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .story {
    height: auto !important;
  }
  .story > .sticky {
    position: relative;
    top: 0;
    height: auto;
  }
  .story > .sticky > div:first-child {
    aspect-ratio: 1;
    flex: none;
  }
  .panels > .panel {
    transform: none;
  }
}
@media (prefers-reduced-motion: reduce) and (min-width: 1024px) {
  .story > .sticky {
    height: calc(100svh - 5rem);
  }
  .story > .sticky > div:first-child {
    aspect-ratio: auto;
  }
}
</style>
