<script setup lang="ts">
/** Compte à rebours jusqu'à l'ouverture du soir (heure de Paris), calculé côté client uniquement */
const props = defineProps<{ opensAt: string, label: string, done: string }>()

const remaining = ref<number | null>(null)

const parisClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Paris',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

function tick() {
  const parts = Object.fromEntries(parisClock.formatToParts(new Date()).map(p => [p.type, p.value]))
  const now = Number(parts.hour) * 3600 + Number(parts.minute) * 60 + Number(parts.second)
  const [h, m] = props.opensAt.split(':').map(Number) as [number, number]
  remaining.value = Math.max(0, h * 3600 + m * 60 - now)
}

let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  tick()
  timer = setInterval(tick, 1000)
})
onBeforeUnmount(() => clearInterval(timer))

const units = computed(() => {
  const s = remaining.value ?? 0
  return [
    { value: Math.floor(s / 3600), unit: 'h' },
    { value: Math.floor((s % 3600) / 60), unit: 'min' },
    { value: s % 60, unit: 's' },
  ].map(u => ({ ...u, value: String(u.value).padStart(2, '0') }))
})
</script>

<template>
  <p
    v-if="remaining !== null"
    class="flex flex-wrap items-baseline gap-x-3 gap-y-1"
  >
    <template v-if="remaining > 0">
      <span class="eyebrow text-farine-200/60">{{ label }}</span>
      <span
        class="font-display text-xl font-semibold tabular-nums tracking-wider text-farine-50"
        role="timer"
        aria-live="off"
      >
        <template
          v-for="u in units"
          :key="u.unit"
        >
          {{ u.value }}<span class="mr-2 ml-0.5 font-sans text-xs font-normal tracking-normal text-farine-200/55 last:mr-0">{{ u.unit }}</span>
        </template>
      </span>
    </template>
    <span
      v-else
      class="eyebrow text-emerald-300"
    >{{ done }}</span>
  </p>
</template>
