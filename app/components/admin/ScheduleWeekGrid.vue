<script setup lang="ts">
import type { Weekday } from '~~/shared/domain/constants'

export interface DayState {
  weekday: Weekday
  open: boolean
  locationId: string
  opensAt: string
  closesAt: string | null
}

/** Semaine type : chaque jour est fermé ou ouvert (lieu, ouverture, fermeture facultative) */
const props = defineProps<{ locations: { id: string, name: string, city: string }[] }>()
const model = defineModel<DayState[]>({ required: true })

const items = computed(() => props.locations.map(l => ({ label: `${l.name} · ${l.city}`, value: l.id })))

function patch(index: number, change: Partial<DayState>) {
  model.value = model.value.map((d, i) => (i === index ? { ...d, ...change } : d))
}

function toggle(index: number, open: boolean) {
  if (!open) return patch(index, { open })
  const day = model.value[index]!
  const fallback = model.value.find(d => d.open && d.locationId)
  patch(index, {
    open,
    locationId: day.locationId || fallback?.locationId || props.locations[0]?.id || '',
    opensAt: day.opensAt || fallback?.opensAt || '18:00',
    closesAt: day.closesAt ?? fallback?.closesAt ?? null,
  })
}
</script>

<template>
  <div class="divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200 bg-white">
    <div
      v-for="(day, i) in model"
      :key="day.weekday"
      class="grid items-center gap-x-3 gap-y-2 p-3 sm:grid-cols-[9rem_minmax(0,1fr)_7.5rem_7.5rem]"
      :class="!day.open && 'bg-stone-50'"
    >
      <label class="flex items-center gap-3">
        <USwitch
          :model-value="day.open"
          :aria-label="`${WEEKDAY_LABELS[day.weekday]} ouvert`"
          @update:model-value="v => toggle(i, v)"
        />
        <span
          class="font-medium"
          :class="!day.open && 'text-stone-400'"
        >{{ WEEKDAY_LABELS[day.weekday] }}</span>
      </label>

      <template v-if="day.open">
        <USelect
          :model-value="day.locationId"
          :items="items"
          class="w-full"
          placeholder="Lieu"
          @update:model-value="v => patch(i, { locationId: String(v) })"
        />
        <div class="grid grid-cols-2 gap-3 sm:contents">
          <label class="space-y-0.5">
            <span class="text-xs text-stone-500 sm:hidden">Ouverture</span>
            <UInput
              :model-value="day.opensAt"
              type="time"
              class="w-full"
              aria-label="Ouverture"
              @update:model-value="v => patch(i, { opensAt: String(v) })"
            />
          </label>
          <label class="space-y-0.5">
            <span class="text-xs text-stone-500 sm:hidden">Fermeture (facultatif)</span>
            <UInput
              :model-value="day.closesAt ?? ''"
              type="time"
              class="w-full"
              aria-label="Fermeture (facultatif)"
              @update:model-value="v => patch(i, { closesAt: v ? String(v) : null })"
            />
          </label>
        </div>
      </template>
      <p
        v-else
        class="text-sm text-stone-400 sm:col-span-3"
      >
        Fermé
      </p>
    </div>
  </div>
</template>
