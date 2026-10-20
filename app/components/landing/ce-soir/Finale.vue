<script setup lang="ts">
import { capitalize, useCeSoir } from './useCeSoir'
import { useReveal } from './useReveal'

defineProps<{ source: string }>()

const { c, kind, day, weekday } = useCeSoir()
const contact = useContact()
const localePath = useLocalePath()

const title = computed(() => {
  const city = day.value?.location?.city
  if (!city || !day.value) return c.value.finale.none
  if (kind.value === 'live' || kind.value === 'later') return c.value.finale.tonight(city)
  return capitalize(c.value.finale.next(weekday(day.value.date), city))
})

/** Le numéro découpé en groupes, pour une composition « affiche » */
const groups = computed(() => contact.value.phone.split(/\s+/))

const root = ref<HTMLElement | null>(null)
useReveal(root, (gsap) => {
  gsap.from('.cs-group', {
    yPercent: 110,
    duration: 1,
    ease: 'expo.out',
    stagger: 0.08,
    scrollTrigger: { trigger: '.cs-number', start: 'top 85%', once: true },
  })
})
</script>

<template>
  <section
    ref="root"
    class="cs-finale grain relative isolate overflow-hidden bg-charbon-950 pb-28 pt-24 text-center sm:pb-32 lg:pb-40 lg:pt-36"
  >
    <div
      class="cs-glow pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[70%]"
      aria-hidden="true"
    />
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <img
        src="/brand/emblem.svg"
        alt=""
        width="120"
        height="70"
        loading="lazy"
        class="mx-auto h-auto w-20 sm:w-24"
      >
      <p class="eyebrow mt-8 text-braise-300">
        {{ c.finale.eyebrow }}
      </p>
      <h2 class="mx-auto mt-5 max-w-4xl font-serif text-[clamp(2.5rem,7vw,5.5rem)] leading-[1.02] text-farine-50 italic">
        {{ title }}
      </h2>

      <a
        :href="contact.phoneHref"
        class="cs-number group mt-12 block lg:mt-16"
        data-track="call_clicked"
        :data-track-source="source"
        :aria-label="`${c.hero.call} : ${contact.phone}`"
      >
        <span class="eyebrow block text-farine-200/55">{{ c.finale.number }}</span>
        <span class="mt-4 flex flex-wrap justify-center gap-x-[0.28em] font-display text-[clamp(2.6rem,10.5vw,9.5rem)] font-semibold leading-none tracking-wide text-farine-50 transition-colors group-hover:text-braise-200">
          <span
            v-for="(g, i) in groups"
            :key="i"
            class="block overflow-hidden pb-[0.06em]"
          >
            <span class="cs-group block">{{ g }}</span>
          </span>
        </span>
        <span
          class="cs-trace mx-auto mt-6 block h-px w-full max-w-4xl bg-gradient-to-r from-transparent via-braise-400 to-transparent"
          aria-hidden="true"
        />
      </a>

      <div class="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a
          :href="contact.phoneHref"
          class="btn-fire min-h-12 w-full max-w-xs sm:w-auto"
          data-track="call_clicked"
          :data-track-source="source"
        >
          <UIcon
            name="i-lucide-phone"
            class="size-4"
          />
          {{ c.hero.call }}
        </a>
        <NuxtLink
          :to="localePath('la-carte')"
          class="btn-ghost min-h-12 w-full max-w-xs text-farine-100 sm:w-auto"
          data-track="menu_clicked"
          :data-track-source="source"
        >
          {{ c.finale.seeMenu }}
        </NuxtLink>
      </div>
      <p class="mt-6 text-sm text-farine-200/55">
        {{ $t('tonight.orderByPhone') }}
      </p>
    </div>
  </section>
</template>

<style scoped>
.cs-glow {
  background:
    radial-gradient(50% 60% at 50% 100%, rgb(224 170 62 / 0.22), transparent 70%),
    radial-gradient(70% 50% at 50% 100%, rgb(209 59 36 / 0.12), transparent 70%);
}
@media (prefers-reduced-motion: no-preference) {
  .cs-glow {
    animation: cs-ember 6s ease-in-out infinite alternate;
  }
}
@keyframes cs-ember {
  to {
    opacity: 0.7;
    transform: scaleY(1.06);
  }
}
</style>
