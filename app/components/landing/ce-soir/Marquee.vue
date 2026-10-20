<script setup lang="ts">
import { useCeSoir } from './useCeSoir'

const { data } = useCeSoir()
const { tr } = useLocalized()

const names = computed(() => (data.value?.menu?.sections ?? []).flatMap(s => s.pizzas.map(p => tr(p, 'name'))))
/** Deuxième bandeau : même liste, dans l'autre sens et décalée */
const reversed = computed(() => [...names.value].reverse())
</script>

<template>
  <div
    v-if="names.length"
    class="cs-marquee relative overflow-hidden bg-farine-50 py-16 sm:py-20"
    aria-hidden="true"
  >
    <div class="cs-band cs-band--back bg-charbon-950 py-3 text-farine-200/40">
      <div class="cs-runner cs-runner--reverse flex w-max">
        <span
          v-for="copy in 2"
          :key="copy"
          class="flex shrink-0 items-center"
        >
          <span
            v-for="name in reversed"
            :key="name"
            class="flex items-center font-serif text-2xl italic sm:text-3xl"
          >
            <span class="px-6">{{ name }}</span>
            <span class="text-braise-400/60">✦</span>
          </span>
        </span>
      </div>
    </div>

    <div class="cs-band cs-band--front relative bg-braise-400 py-4 text-charbon-950 shadow-[0_20px_50px_-20px_rgba(14,16,17,0.55)] sm:py-5">
      <div class="cs-runner flex w-max">
        <span
          v-for="copy in 2"
          :key="copy"
          class="flex shrink-0 items-center"
        >
          <span
            v-for="name in names"
            :key="name"
            class="flex items-center font-display text-4xl font-semibold uppercase tracking-wide sm:text-5xl"
          >
            <span class="px-7 sm:px-10">{{ name }}</span>
            <img
              src="/brand/emblem.svg"
              alt=""
              width="48"
              height="28"
              loading="lazy"
              class="cs-emblem h-6 w-auto sm:h-8"
            >
          </span>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cs-band--back {
  transform: rotate(3deg) scale(1.1);
  margin-bottom: 0.25rem;
}
.cs-band--front {
  transform: rotate(-2.5deg) scale(1.1);
}
/* L'emblème crème devient sombre sur le bandeau doré */
.cs-emblem {
  filter: brightness(0) opacity(0.8);
}

@media (prefers-reduced-motion: no-preference) {
  .cs-runner {
    animation: cs-run 60s linear infinite;
  }
  .cs-runner--reverse {
    animation-direction: reverse;
    animation-duration: 80s;
  }
}
@keyframes cs-run {
  to {
    transform: translateX(-50%);
  }
}
</style>
