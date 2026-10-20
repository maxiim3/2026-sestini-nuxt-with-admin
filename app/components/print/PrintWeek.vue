<script setup lang="ts">
import type { PrintText } from '~/utils/print-text'

interface Slot {
  weekday: number
  opensAt: string
  location: { id: string, name: string, city: string } | null
}

/** Semaine type regroupée par lieu : « Mer. · Ven. — Pignan » */
const props = defineProps<{ text: PrintText, slots: Slot[], rows?: boolean }>()

const groups = computed(() => {
  const map = new Map<string, { city: string, name: string, days: number[], opensAt: string }>()
  for (const slot of props.slots) {
    if (!slot.location) continue
    const g = map.get(slot.location.id) ?? { city: slot.location.city, name: slot.location.name, days: [], opensAt: slot.opensAt }
    g.days.push(slot.weekday)
    if (slot.opensAt < g.opensAt) g.opensAt = slot.opensAt
    map.set(slot.location.id, g)
  }
  return [...map.values()].sort((a, b) => a.days[0]! - b.days[0]!)
})
const opensAt = computed(() => {
  const hours = new Set(groups.value.map(g => g.opensAt))
  return hours.size === 1 ? [...hours][0] : null
})
</script>

<template>
  <div
    class="pr-week"
    :class="{ 'pr-week--rows': rows }"
  >
    <p class="pr-eyebrow pr-week__label">
      <span class="pr-rule" />
      {{ text.t('whereToFind') }}<template v-if="opensAt">
        · {{ text.t('from') }} {{ text.hour(opensAt) }}
      </template>
      <span class="pr-rule" />
    </p>
    <ul class="pr-week__list">
      <li
        v-for="g in groups"
        :key="g.city + g.name"
        class="pr-week__item"
      >
        <span class="pr-week__days">{{ g.days.map(d => text.weekday(d, rows ? 'short' : 'long')).join(' · ') }}</span>
        <span class="pr-week__city">{{ g.city }}</span>
        <span class="pr-week__place">{{ g.name }}</span>
      </li>
    </ul>
  </div>
</template>
