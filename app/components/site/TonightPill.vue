<script setup lang="ts">
const props = withDefaults(defineProps<{ tone?: 'dark' | 'light' }>(), { tone: 'dark' })
const { t } = useI18n()
const { data } = useSite()
const { hour, relativeDay } = useLocalized()

const state = computed(() => {
  const tonight = data.value?.tonight
  if (!tonight) return null
  const { today, status, next } = tonight
  if (today.open && today.location && status !== 'closed-now') {
    return {
      live: status === 'open-now',
      title: status === 'open-now' ? t('tonight.openNow') : t('tonight.from', { time: hour(today.opensAt) }),
      place: today.location.city,
    }
  }
  if (next?.location) {
    return {
      live: false,
      title: status === 'closed-now' ? t('tonight.closedNow') : t('tonight.closedToday'),
      place: `${relativeDay(next.date, today.date)} · ${next.location.city}`,
    }
  }
  return { live: false, title: t('tonight.closedToday'), place: '' }
})
</script>

<template>
  <ClientOnly>
    <div
      v-if="state"
      class="inline-flex items-center gap-3 rounded-full border px-4 py-2 text-sm backdrop-blur"
      :class="props.tone === 'dark' ? 'border-white/10 bg-white/5 text-farine-100' : 'border-charbon-950/10 bg-charbon-950/5 text-charbon-900'"
    >
      <span class="relative flex size-2.5">
        <span
          v-if="state.live"
          class="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75"
        />
        <span
          class="relative inline-flex size-2.5 rounded-full"
          :class="state.live ? 'bg-emerald-400' : 'bg-braise-400'"
        />
      </span>
      <span class="font-medium">{{ state.title }}</span>
      <span
        v-if="state.place"
        class="opacity-70"
      >{{ state.place }}</span>
    </div>
  </ClientOnly>
</template>
