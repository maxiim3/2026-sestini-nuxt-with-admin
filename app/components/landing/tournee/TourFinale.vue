<script setup lang="ts">
import TourMap from './TourMap.vue'
import { capitalize, fill, useTourCopy, useHour } from './copy'
import { ROMAN, useTour } from './useTour'
import { project } from './geo'

const { t } = useI18n()
const contact = useContact()
const { date, relativeDay } = useLocalized()
const hour = useHour()
const c = useTourCopy()
const { stops, tonight, today } = useTour()

const day = computed(() => tonight.value.day)
const place = computed(() => day.value?.location ?? null)
const focus = computed(() => (place.value ? project(place.value.lat, place.value.lng) : null))
const view = computed(() => focus.value
  ? (() => {
      // Cadré sur l'étape, légèrement attiré vers le reste de la tournée pour donner du contexte
      const all = stops.value.length ? stops.value : []
      const cx = all.reduce((n, s) => n + s.at.x, 0) / (all.length || 1)
      const cy = all.reduce((n, s) => n + s.at.y, 0) / (all.length || 1)
      const x = focus.value.x * 0.65 + (all.length ? cx : focus.value.x) * 0.35
      const y = focus.value.y * 0.65 + (all.length ? cy : focus.value.y) * 0.35
      return { x: x - 300, y: y - 225, w: 600, h: 450 }
    })()
  : { x: 175, y: 80, w: 550, h: 530 })
/** Étapes dans le cadre du plan de situation (les autres sont hors champ) */
const inView = computed(() => stops.value.filter(s => s.at.x > view.value.x + 90 && s.at.x < view.value.x + view.value.w - 90 && s.at.y > view.value.y + 20 && s.at.y < view.value.y + view.value.h - 50))
const focusKey = computed(() => stops.value.find(s => s.city === place.value?.city)?.key ?? null)
const notes = computed(() => Object.fromEntries(stops.value.map(s => [s.key, s.dates.map(d => date(d, { weekday: 'short' })).join(' · ')])))

const eyebrow = computed(() => {
  const mode = tonight.value.mode
  if (mode === 'later' || mode === 'open-now') return c.value.finaleEyebrow
  return day.value ? `${c.value.finaleEyebrowNext} · ${capitalize(relativeDay(day.value.date, today.value))}` : c.value.finaleEyebrowNext
})

const hours = computed(() => {
  if (!day.value) return ''
  const from = capitalize(t('tonight.from', { time: hour(day.value.opensAt ?? '18:00') }))
  return day.value.closesAt ? `${from} · ${fill(c.value.until, { time: hour(day.value.closesAt) })}` : from
})

const mapLabel = computed(() => place.value ? `${place.value.name}, ${place.value.address}, ${place.value.zip} ${place.value.city}` : '')
</script>

<template>
  <section
    class="relative border-t border-farine-200/10 bg-charbon-900/60 px-4 py-20 sm:px-8 lg:py-28"
    aria-labelledby="tournee-finale"
  >
    <div class="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
      <div
        v-if="place"
        class="relative aspect-[4/3] overflow-hidden rounded-sm ring-1 ring-farine-200/15 lg:order-2"
      >
        <TourMap
          :view="view"
          :stops="inView"
          :notes="notes"
          :active-key="focusKey"
          :truck-at="focus"
          :sea-text="c.sea"
          :scale-text="c.scale"
          :label="mapLabel"
          compact
        />
      </div>

      <div class="lg:order-1">
        <p class="eyebrow text-braise-300">
          {{ eyebrow }}
        </p>
        <h2
          id="tournee-finale"
          class="mt-4 font-display text-4xl font-semibold text-farine-50 sm:text-6xl"
        >
          {{ place?.city ?? c.restTitle }}
        </h2>
        <p
          v-if="tonight.mode === 'rest'"
          class="mt-3 font-serif text-farine-100/60 italic"
        >
          {{ c.finaleRest }}
        </p>
        <dl
          v-if="place"
          class="mt-6 space-y-2 text-farine-100/80"
        >
          <div class="flex items-start gap-3">
            <dt class="sr-only">
              {{ t('nav.findUs') }}
            </dt>
            <UIcon
              name="i-lucide-map-pin"
              class="mt-1 size-4 shrink-0 text-braise-300"
            />
            <dd>
              <span class="font-medium text-farine-50">{{ place.name }}</span><br>
              {{ place.address }}, {{ place.zip }} {{ place.city }}
            </dd>
          </div>
          <div class="flex items-center gap-3">
            <dt class="sr-only">
              {{ t('tonight.label') }}
            </dt>
            <UIcon
              name="i-lucide-flame"
              class="size-4 shrink-0 text-braise-300"
            />
            <dd>{{ hours }}</dd>
          </div>
        </dl>
        <p
          v-else
          class="mt-4 text-farine-100/70"
        >
          {{ c.noDate }}
        </p>

        <div class="mt-8 flex flex-wrap gap-3">
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
            <span class="font-normal tabular-nums opacity-80">{{ contact.phone }}</span>
          </a>
          <a
            v-if="place"
            :href="directionsUrl(place)"
            target="_blank"
            rel="noopener"
            class="btn-ghost min-h-11 text-farine-100"
          >
            <UIcon
              name="i-lucide-navigation"
              class="size-4"
            />
            {{ t('tonight.itinerary') }}
          </a>
        </div>
        <p class="mt-4 text-sm text-farine-100/50">
          {{ c.callLead }}
        </p>

        <div class="mt-12">
          <h3 class="eyebrow text-farine-100/55">
            {{ c.legend }}
          </h3>
          <ul class="mt-4 divide-y divide-farine-200/10 border-y border-farine-200/10">
            <li
              v-for="s in stops"
              :key="s.key"
              class="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-baseline gap-3 py-3"
            >
              <span class="font-display text-sm text-braise-300">{{ ROMAN[s.order - 1] }}</span>
              <span class="min-w-0">
                <span class="font-display font-semibold text-farine-50">{{ s.city }}</span>
                <span class="block truncate text-xs text-farine-100/50">{{ s.location.name }}</span>
              </span>
              <span class="font-serif text-sm text-braise-200 italic">{{ s.dates.map(d => date(d, { weekday: 'short' })).join(' · ') }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
