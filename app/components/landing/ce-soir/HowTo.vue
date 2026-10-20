<script setup lang="ts">
import { useCeSoir } from './useCeSoir'
import { useReveal } from './useReveal'

defineProps<{ source: string }>()

const { c, day } = useCeSoir()
const contact = useContact()
const localePath = useLocalePath()

const NUMERALS = ['I', 'II', 'III'] as const

const root = ref<HTMLElement | null>(null)
useReveal(root, (gsap) => {
  gsap.from('.cs-numeral > span', {
    yPercent: 105,
    duration: 1.1,
    ease: 'expo.out',
    stagger: 0.15,
    scrollTrigger: { trigger: '.cs-steps', start: 'top 78%', once: true },
  })
})
</script>

<template>
  <section
    ref="root"
    class="grain relative bg-farine-50 pb-24 pt-8 text-charbon-950 sm:pb-32 lg:pb-40"
  >
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="grid gap-6 lg:grid-cols-12 lg:items-end">
        <div class="lg:col-span-7">
          <p class="eyebrow text-braise-700">
            {{ c.howto.eyebrow }}
          </p>
          <h2 class="mt-5">
            <span class="block font-display text-[clamp(2.75rem,7vw,6rem)] font-semibold uppercase leading-[0.95] tracking-wide">{{ c.howto.title }}</span>
            <span class="block font-serif text-[clamp(3rem,7.6vw,6.5rem)] leading-[0.95] text-braise-700 italic">{{ c.howto.titleEm }}</span>
          </h2>
        </div>
        <p class="font-serif text-lg text-charbon-700 italic lg:col-span-4 lg:col-start-9 lg:pb-3">
          {{ $t('tonight.orderByPhone') }}.
        </p>
      </div>

      <div class="relative mt-16 lg:mt-24">
        <span
          class="cs-trace absolute inset-x-0 top-0 h-px bg-charbon-950/25"
          aria-hidden="true"
        />
        <ol class="cs-steps grid md:grid-cols-3">
          <li
            v-for="(step, i) in c.howto.steps"
            :key="step.title"
            class="relative flex flex-col border-b border-charbon-950/15 py-9 md:border-b-0 md:border-l md:px-8 md:py-12 md:first:border-l-0 md:first:pl-0 lg:px-10"
          >
            <span
              class="cs-numeral block overflow-hidden pb-1 font-display text-6xl font-semibold leading-none text-braise-600 md:text-[6.5rem]"
              aria-hidden="true"
            >
              <span class="block">{{ NUMERALS[i] }}</span>
            </span>
            <h3 class="mt-4 font-display md:mt-6 text-2xl font-semibold uppercase tracking-[0.14em]">
              <span class="sr-only">{{ i + 1 }}. </span>{{ step.title }}
            </h3>
            <p class="mt-3 max-w-xs text-[15px] leading-relaxed text-charbon-700">
              {{ step.text }}
            </p>

            <div class="mt-6 md:mt-auto md:pt-8">
              <a
                v-if="i === 0"
                :href="contact.phoneHref"
                class="group inline-flex min-h-11 items-center gap-3 font-display text-xl font-bold tracking-wider text-charbon-950"
                data-track="call_clicked"
                :data-track-source="source"
              >
                <span class="grid size-10 place-items-center rounded-full bg-charbon-950 text-braise-300 transition-transform group-hover:scale-105">
                  <UIcon
                    name="i-lucide-phone"
                    class="size-4"
                  />
                </span>
                {{ contact.phone }}
              </a>
              <NuxtLink
                v-else-if="i === 1"
                :to="localePath('la-carte')"
                class="group inline-flex min-h-11 items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-charbon-950"
                data-track="menu_clicked"
                :data-track-source="source"
              >
                <span class="underline decoration-braise-500 decoration-2 underline-offset-[6px]">{{ c.howto.seeMenu }}</span>
                <UIcon
                  name="i-lucide-arrow-right"
                  class="size-4 transition-transform group-hover:translate-x-1"
                />
              </NuxtLink>
              <a
                v-else-if="day?.location"
                :href="directionsUrl(day.location)"
                target="_blank"
                rel="noopener"
                class="group inline-flex min-h-11 items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-charbon-950"
                data-track="directions_clicked"
                :data-track-source="source"
              >
                <UIcon
                  name="i-lucide-navigation"
                  class="size-4 text-braise-700"
                />
                <span class="underline decoration-braise-500 decoration-2 underline-offset-[6px]">{{ c.hero.itinerary }} · {{ day.location.city }}</span>
              </a>
            </div>
          </li>
        </ol>
      </div>
    </div>
  </section>
</template>
