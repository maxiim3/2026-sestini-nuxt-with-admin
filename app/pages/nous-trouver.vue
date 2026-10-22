<script setup lang="ts">
import type { SiteDay } from '~/composables/useSite'

definePageMeta({
  i18n: { paths: { fr: '/nous-trouver', en: '/find-us', es: '/encuentranos', it: '/dove-siamo' } },
})

const { t } = useI18n()
const { hour, date, relativeDay, tr } = useLocalized()
const { data } = await useSite()

usePageSeo({
  title: () => `${t('findUs.title')} · Sestini Pizza`,
  description: () => `${t('findUs.subtitle')} : ${t('brand.area')}. ${t('tonight.orderByPhone')}.`,
  og: 'nous-trouver',
})

const days = computed(() => data.value?.week ?? [])
const today = computed(() => data.value?.tonight.today.date ?? '')
const selectedDate = ref<string | null>(null)
const selected = computed(() => {
  const list = days.value
  return list.find(d => d.date === selectedDate.value)
    ?? list.find(d => d.date === today.value && d.open)
    ?? list.find(d => d.open)
    ?? null
})

/** Les lignes du planning : un jour ouvert, une fermeture exceptionnelle, ou plusieurs jours de repos regroupés */
type Row
  = | { kind: 'open', day: SiteDay }
    | { kind: 'exception', day: SiteDay }
    | { kind: 'rest', days: SiteDay[] }
const rows = computed(() => {
  const out: Row[] = []
  for (const d of days.value) {
    if (d.open) out.push({ kind: 'open', day: d })
    else if (d.exception) out.push({ kind: 'exception', day: d })
    else {
      const last = out.at(-1)
      if (last?.kind === 'rest') last.days.push(d)
      else out.push({ kind: 'rest', days: [d] })
    }
  }
  return out
})

/** Par défaut, les 7 prochaines soirées ; le reste à la demande */
const showAll = ref(false)
const visibleRows = computed(() => {
  if (showAll.value) return rows.value
  let open = 0
  const end = rows.value.findIndex(r => r.kind === 'open' && ++open > 7)
  return end === -1 ? rows.value : rows.value.slice(0, end)
})

function restLabel(list: SiteDay[]) {
  const names = list.map(d => date(d.date, { weekday: 'short', day: 'numeric' }))
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} – ${names.at(-1)}` : names[0]
}

/** Choisir un jour : la ligne touchée garde sa place à l'écran (le détail d'un autre jour peut se refermer au-dessus) */
function select(day: string, event: Event) {
  const row = event.currentTarget as HTMLElement
  const before = row.getBoundingClientRect().top
  selectedDate.value = day
  nextTick(() => window.scrollBy({ top: row.getBoundingClientRect().top - before, behavior: 'instant' }))
}
</script>

<template>
  <div class="bg-nero text-crema">
    <section class="mx-auto max-w-[1200px] px-5 pb-7 pt-8 md:pb-11 md:pt-15 lg:px-10">
      <h1 class="font-title text-[clamp(56px,14vw,104px)] leading-[0.92] tracking-[-0.02em]">
        {{ t('findUs.title') }}
      </h1>
      <p class="mt-2.5 font-title text-[21px] italic text-abricot md:text-[26px]">
        {{ t('brand.area').replaceAll(' · ', ', ') }}
      </p>
    </section>

    <div class="mx-auto grid max-w-[1200px] gap-7 px-5 pb-18 md:pb-30 lg:grid-cols-2 lg:items-start lg:gap-16 lg:px-10">
      <aside
        v-if="selected?.location"
        class="lg:sticky lg:top-25 lg:order-2"
      >
        <div class="relative aspect-[4/3] border border-nero-line bg-nero-2 lg:aspect-auto lg:h-[min(420px,calc(100vh-24rem))] lg:min-h-55">
          <iframe
            :key="selected.location.id"
            :src="osmEmbedUrl(selected.location)"
            :title="t('findUs.mapTitle', { place: selected.location.city })"
            class="absolute inset-0 size-full grayscale-[55%] sepia-[12%]"
            loading="lazy"
          />
        </div>
        <div class="grid gap-4.5 border border-t-0 border-nero-line bg-nero-2 p-5.5">
          <div>
            <p class="kicker text-abricot">
              {{ relativeDay(selected.date, today) }} · {{ t('tonight.from', { time: hour(selected.opensAt) }) }}
            </p>
            <h2 class="mt-2 font-title text-[40px] leading-none">
              {{ selected.location.city }}
            </h2>
            <p class="mt-2 text-[15px] text-fumo-dark">
              {{ selected.location.name }}<br>
              {{ selected.location.address }}, {{ selected.location.zip }} {{ selected.location.city }}
            </p>
            <p
              v-if="selected.exception?.note"
              class="mt-3 text-sm text-abricot"
            >
              {{ tr(selected.exception, 'note') }}
            </p>
          </div>
          <a
            :href="directionsUrl(selected.location)"
            target="_blank"
            rel="noopener"
            class="btn btn-line h-12"
            data-track="directions_clicked"
          >
            <UIcon
              name="i-lucide-map-pin"
              class="size-4"
            />
            {{ t('tonight.itinerary') }}
          </a>
          <p class="text-center text-xs text-fumo-dark">
            {{ t('tonight.orderByPhone') }}
          </p>
        </div>
      </aside>

      <section>
        <div class="flex items-baseline justify-between gap-4 border-b border-nero-line pb-3">
          <h2 class="kicker text-fumo-dark">
            {{ t('findUs.thisWeek') }}
          </h2>
        </div>
        <ol>
          <li
            v-for="(r, i) in visibleRows"
            :key="r.kind === 'rest' ? `rest-${i}` : r.day.date"
          >
            <p
              v-if="r.kind === 'rest'"
              class="border-b border-nero-line py-3 font-title text-lg italic text-fumo-dark"
            >
              <span class="kicker mr-2.5 not-italic">{{ restLabel(r.days) }}</span>{{ t('findUs.rest') }}
            </p>

            <div
              v-else-if="r.kind === 'exception'"
              class="grid grid-cols-[84px_1fr] items-baseline gap-3.5 border-b border-nero-line py-4.5 lg:grid-cols-[110px_1fr]"
            >
              <span class="text-[13px] text-fumo-dark"><b class="block text-sm font-semibold capitalize text-crema">{{ date(r.day.date, { weekday: 'long' }) }}</b>{{ date(r.day.date, { day: 'numeric', month: 'short' }) }}</span>
              <span class="font-title text-[26px] leading-tight text-[#e2836f] lg:text-3xl">
                {{ r.day.exception?.note ? tr(r.day.exception, 'note') : t('findUs.closed') }}
              </span>
            </div>

            <div
              v-else-if="r.day.location"
              role="button"
              tabindex="0"
              class="group relative grid w-full cursor-pointer grid-cols-[84px_1fr_auto] items-baseline gap-3.5 border-b border-nero-line py-4.5 text-left lg:grid-cols-[110px_1fr_auto]"
              :aria-pressed="selected?.date === r.day.date"
              data-track="location_day_selected"
              :data-track-day="r.day.date"
              @click="select(r.day.date, $event)"
              @keydown.enter.space.prevent="select(r.day.date, $event)"
            >
              <span
                v-if="selected?.date === r.day.date"
                class="absolute -left-3.5 bottom-5 top-5 w-0.5 bg-abricot"
                aria-hidden="true"
              />
              <span class="text-[13px] text-fumo-dark">
                <b
                  class="block text-sm font-semibold capitalize"
                  :class="selected?.date === r.day.date ? 'text-abricot' : 'text-crema'"
                >{{ r.day.date === today ? t('days.today') : date(r.day.date, { weekday: 'long' }) }}</b>
                {{ date(r.day.date, { day: 'numeric', month: 'short' }) }}
              </span>
              <span class="font-title text-[26px] leading-tight transition-colors group-hover:text-abricot lg:text-3xl">
                {{ r.day.location.city }}
                <small class="mt-0.5 block font-body text-[13px] text-fumo-dark">{{ r.day.location.name }}</small>
              </span>
              <span
                class="whitespace-nowrap text-[13.5px]"
                :class="selected?.date === r.day.date ? 'text-abricot' : 'text-fumo-dark'"
              >{{ t('findUs.fromTime', { time: hour(r.day.opensAt) }) }}</span>
              <!-- Sur mobile, le détail du jour choisi s'ouvre sur place : pas de saut vers la carte -->
              <span
                v-if="selected?.date === r.day.date"
                class="col-start-2 col-end-4 mt-2 text-sm text-fumo-dark lg:hidden"
              >
                {{ r.day.location.address }}, {{ r.day.location.city }}
                <a
                  :href="directionsUrl(r.day.location)"
                  target="_blank"
                  rel="noopener"
                  class="mt-2 flex w-max items-center gap-1.5 border-b border-current font-semibold text-crema"
                  @click.stop
                >{{ t('tonight.itinerary') }} →</a>
              </span>
            </div>
          </li>
        </ol>
        <button
          v-if="visibleRows.length < rows.length || showAll"
          class="link-arrow mt-6 text-crema"
          @click="showAll = !showAll"
        >
          {{ showAll ? t('findUs.less') : t('findUs.more') }} <span>{{ showAll ? '↑' : '↓' }}</span>
        </button>
      </section>
    </div>
  </div>
</template>
