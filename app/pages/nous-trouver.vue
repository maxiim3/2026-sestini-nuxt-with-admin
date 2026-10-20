<script setup lang="ts">
definePageMeta({
  i18n: { paths: { fr: '/nous-trouver', en: '/find-us', es: '/encuentranos', it: '/dove-siamo' } },
})

const { t } = useI18n()
const { hour, date, relativeDay, tr } = useLocalized()
const { data } = await useSite()
const contact = useContact()

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

const card = ref<HTMLElement | null>(null)
function select(day: string) {
  selectedDate.value = day
  if (window.matchMedia('(max-width: 1023px)').matches) {
    nextTick(() => card.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
}

/** Lieux de la semaine, regroupés par emplacement */
const places = computed(() => {
  const map = new Map<string, { location: NonNullable<typeof days.value[number]['location']>, days: string[] }>()
  for (const d of days.value.slice(0, 7)) {
    if (!d.open || !d.location || d.exception) continue
    const entry = map.get(d.location.id) ?? { location: d.location, days: [] }
    entry.days.push(date(d.date, { weekday: 'long' }))
    map.set(d.location.id, entry)
  }
  return [...map.values()]
})
</script>

<template>
  <div class="grain min-h-dvh overflow-x-clip bg-charbon-950">
    <section class="relative overflow-hidden pb-12 pt-32 lg:pt-40">
      <div
        class="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(224,170,62,0.16),transparent)]"
        aria-hidden="true"
      />
      <div class="relative mx-auto max-w-5xl px-4 text-center sm:px-6">
        <p class="eyebrow text-braise-300">
          {{ t('brand.area') }}
        </p>
        <h1 class="mt-4 font-display text-5xl font-semibold tracking-wider text-farine-50 sm:text-7xl">
          {{ t('findUs.title') }}
        </h1>
        <p class="mx-auto mt-5 max-w-xl font-serif text-lg italic text-farine-200/75">
          {{ t('findUs.subtitle') }}
        </p>
        <div class="mt-8 flex justify-center">
          <SiteTonightPill />
        </div>
      </div>
    </section>

    <div class="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 pb-24 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:px-8">
      <section>
        <h2 class="eyebrow mb-4 text-braise-300">
          {{ t('findUs.thisWeek') }}
        </h2>
        <ol class="divide-y divide-white/5 rounded-3xl border border-white/5 bg-white/[0.02]">
          <li
            v-for="d in days"
            :key="d.date"
          >
            <button
              class="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors sm:gap-4 sm:px-5"
              :class="[
                selected?.date === d.date ? 'bg-braise-300/10' : 'hover:bg-white/[0.03]',
                !d.open && 'opacity-45',
              ]"
              :disabled="!d.open"
              :aria-pressed="selected?.date === d.date"
              data-track="location_day_selected"
              :data-track-day="d.date"
              @click="select(d.date)"
            >
              <span class="w-24 shrink-0 sm:w-32">
                <span
                  class="block text-sm font-semibold capitalize"
                  :class="d.date === today ? 'text-braise-300' : 'text-farine-50'"
                >{{ date(d.date, { weekday: 'long' }) }}</span>
                <span class="block text-xs text-farine-200/50">{{ d.date === today ? t('days.today') : date(d.date, { day: 'numeric', month: 'short' }) }}</span>
              </span>
              <span class="min-w-0 flex-1">
                <template v-if="d.open && d.location">
                  <span class="block truncate text-farine-50">{{ d.location.city }}</span>
                  <span class="block truncate text-xs text-farine-200/55">{{ d.location.name }}</span>
                </template>
                <span
                  v-else
                  class="text-farine-200/70"
                >{{ d.exception?.note || t('findUs.closed') }}</span>
              </span>
              <span
                v-if="d.exception && d.open"
                class="rounded-full bg-braise-400/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-braise-200"
              >{{ t('findUs.exception') }}</span>
              <span
                v-if="d.open"
                class="shrink-0 text-sm text-farine-200/70"
              >{{ t('tonight.from', { time: hour(d.opensAt) }) }}</span>
            </button>
          </li>
        </ol>
      </section>

      <section
        v-if="selected?.location"
        ref="card"
        class="scroll-mt-24 lg:sticky lg:top-28 lg:self-start"
      >
        <div class="overflow-hidden rounded-3xl border border-white/10 bg-charbon-900">
          <div class="relative aspect-[4/3] w-full bg-charbon-800">
            <iframe
              :key="selected.location.id"
              :src="osmEmbedUrl(selected.location)"
              :title="t('findUs.mapTitle', { place: selected.location.city })"
              class="absolute inset-0 h-full w-full grayscale-[35%] contrast-[1.05]"
              loading="lazy"
            />
          </div>
          <div class="space-y-5 p-6 sm:p-8">
            <div>
              <p class="eyebrow text-braise-300">
                {{ relativeDay(selected.date, today) }} · {{ t('tonight.from', { time: hour(selected.opensAt) }) }}
              </p>
              <h2 class="mt-2 font-display text-3xl font-semibold tracking-wide text-farine-50">
                {{ selected.location.city }}
              </h2>
              <p class="mt-1 text-farine-200/75">
                {{ selected.location.name }}<br>
                {{ selected.location.address }}, {{ selected.location.zip }} {{ selected.location.city }}
              </p>
              <p
                v-if="selected.exception?.note"
                class="mt-3 rounded-xl bg-braise-400/10 px-4 py-3 text-sm text-braise-100"
              >
                {{ tr(selected.exception, 'note') }}
              </p>
            </div>
            <div class="flex flex-col gap-3 sm:flex-row">
              <a
                :href="directionsUrl(selected.location)"
                target="_blank"
                rel="noopener"
                class="btn-ghost flex-1 text-farine-100"
                data-track="directions_clicked"
              >
                <UIcon
                  name="i-lucide-navigation"
                  class="size-4"
                />
                {{ t('tonight.itinerary') }}
              </a>
              <a
                :href="contact.phoneHref"
                class="btn-fire flex-1"
                data-track="call_clicked"
                data-track-source="find-us"
              >
                <UIcon
                  name="i-lucide-phone"
                  class="size-4"
                />
                {{ contact.phone }}
              </a>
            </div>
            <p class="text-center text-xs text-farine-200/50">
              {{ t('tonight.orderByPhone') }}
            </p>
          </div>
        </div>
      </section>
    </div>

    <section class="border-t border-white/5 bg-farine-100 py-20 text-charbon-950">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 class="ruled mb-12 font-display text-2xl font-semibold uppercase tracking-[0.2em] text-charbon-900">
          {{ t('findUs.typicalWeek') }}
        </h2>
        <div class="grid gap-6 md:grid-cols-3">
          <article
            v-for="p in places"
            :key="p.location.id"
            class="rounded-3xl bg-farine-50 p-7 shadow-[0_30px_60px_-40px_rgba(14,16,17,0.5)] ring-1 ring-charbon-950/5"
          >
            <p class="eyebrow text-braise-700">
              {{ p.days.join(' · ') }}
            </p>
            <h3 class="mt-3 font-display text-2xl font-semibold">
              {{ p.location.city }}
            </h3>
            <p class="mt-2 text-sm text-charbon-700">
              {{ p.location.name }}<br>{{ p.location.address }}
            </p>
            <a
              :href="mapsUrl(p.location)"
              target="_blank"
              rel="noopener"
              class="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-braise-800 underline-offset-4 hover:underline"
            >
              {{ t('findUs.openInMaps') }}
              <UIcon
                name="i-lucide-arrow-up-right"
                class="size-4"
              />
            </a>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>
