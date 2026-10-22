<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { data } = useSite()
const { hour, relativeDay } = useLocalized()

/** Ouvert (vert), ce soir plus tard (abricot) ou fermé (gris), avec une version courte pour le mobile */
const state = computed(() => {
  const tonight = data.value?.tonight
  if (!tonight) return null
  const { today, status, next } = tonight
  if (today.open && today.location && status !== 'closed-now') {
    const city = today.location.city
    if (status === 'open-now') {
      return { tone: 'open', long: `${t('tonight.openNowLong')} · ${city}`, short: `${t('tonight.openShort')} · ${city}` }
    }
    const from = t('tonight.tonightFrom', { time: hour(today.opensAt) })
    return { tone: 'later', long: `${from} · ${city}`, short: `${from} · ${city}` }
  }
  const back = next?.location ? t('tonight.backOn', { day: relativeDay(next.date, today.date), place: next.location.city }) : ''
  return {
    tone: 'closed',
    long: back ? `${t('tonight.closedTonight')} · ${back}` : t('tonight.closedTonight'),
    short: t('tonight.closedShort'),
  }
})
</script>

<template>
  <ClientOnly>
    <NuxtLink
      v-if="state"
      :to="localePath('nous-trouver')"
      class="inline-flex min-w-0 items-center gap-2.5 text-[13px] font-medium text-crema"
    >
      <span
        class="relative flex size-2 shrink-0"
        aria-hidden="true"
      >
        <span
          v-if="state.tone === 'open'"
          class="absolute inline-flex size-full animate-ping rounded-full bg-ouvert opacity-60 motion-reduce:hidden"
        />
        <span
          class="relative inline-flex size-2 rounded-full"
          :class="{ 'bg-ouvert': state.tone === 'open', 'bg-abricot': state.tone === 'later', 'bg-fumo-dark': state.tone === 'closed' }"
        />
      </span>
      <span class="min-w-0 truncate">
        <span class="hidden lg:inline">{{ state.long }}</span>
        <span class="lg:hidden">{{ state.short }}</span>
      </span>
    </NuxtLink>
  </ClientOnly>
</template>
