<script setup lang="ts">
import { formatHour, isoDateInParis } from '~~/shared/domain/dates'
import { resolveRange, type ScheduleData } from '~~/shared/domain/schedule'

/** Aperçu du calendrier tel que le verront les clients, calculé avec la même logique que le site */
const props = withDefaults(defineProps<{ data: ScheduleData, from?: string, days?: number }>(), { days: 14 })

const today = isoDateInParis()
const range = computed(() => resolveRange(props.data, props.from ?? today, props.days))

function dayLabel(date: string) {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number]
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)))
}
function hours(opens: string | null, closes: string | null) {
  if (!opens) return ''
  return closes ? `${formatHour(opens)} – ${formatHour(closes)}` : `dès ${formatHour(opens)}`
}
</script>

<template>
  <ol class="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
    <li
      v-for="day in range"
      :key="day.date"
      class="min-w-0 space-y-1 rounded-lg border p-2.5 text-sm"
      :class="[
        day.open ? 'border-braise-300 bg-braise-50' : 'border-stone-200 bg-stone-50 text-stone-400',
        day.date === today && 'ring-2 ring-stone-900/70',
      ]"
    >
      <p class="flex items-center justify-between gap-1">
        <span
          class="text-xs font-semibold uppercase tracking-wide"
          :class="day.open ? 'text-braise-800' : 'text-stone-500'"
        >{{ dayLabel(day.date) }}</span>
        <UIcon
          v-if="day.exception"
          :name="EXCEPTION_LABELS[day.exception.kind].icon"
          class="size-3.5 shrink-0"
          :class="{
            'text-red-600': day.exception.kind === 'closed',
            'text-sky-600': day.exception.kind === 'relocated',
            'text-amber-600': day.exception.kind === 'hours',
            'text-emerald-600': day.exception.kind === 'extra',
          }"
          :title="EXCEPTION_LABELS[day.exception.kind].label"
        />
      </p>
      <template v-if="day.open">
        <p class="font-medium text-stone-900">
          {{ hours(day.opensAt, day.closesAt) }}
        </p>
        <p class="truncate text-xs text-stone-600">
          {{ day.location?.name ?? 'Lieu à préciser' }}
        </p>
      </template>
      <template v-else>
        <p class="font-medium">
          Fermé
        </p>
        <p
          v-if="day.exception"
          class="truncate text-xs"
        >
          {{ day.exception.note || EXCEPTION_LABELS[day.exception.kind].label }}
        </p>
      </template>
    </li>
  </ol>
</template>
