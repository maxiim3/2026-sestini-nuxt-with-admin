<script setup lang="ts">
import type { SitePizza } from '~/composables/useSite'
import PizzaEngraving from './PizzaEngraving.vue'
import { fill, useTourCopy } from './copy'

const { t } = useI18n()
const localePath = useLocalePath()
const { data } = useSite()
const { tr, price } = useLocalized()
const c = useTourCopy()

const sections = computed(() => data.value?.menu?.sections ?? [])
const count = computed(() => sections.value.reduce((n, s) => n + s.pizzas.length, 0))

/** Pizza mise en avant : celle du moment si elle existe, sinon la première spéciale de saison */
const star = computed(() => {
  const list = data.value?.featured ?? []
  const f = list.find(x => x.showOnHome) ?? list[0]
  if (f) return { pizza: f.pizza as SitePizza, label: tr(f, 'title'), pitch: f.pitch ? tr(f, 'pitch') : null }
  const pizza = sections.value.find(s => s.section === 'speciales')?.pizzas[0] ?? sections.value[0]?.pizzas[0]
  return pizza ? { pizza, label: c.value.seasonal, pitch: null } : null
})

/** Deux pizzas par famille, pour donner le ton de la carte */
const picks = computed(() => sections.value
  .map(s => ({ section: s.section, pizzas: s.pizzas.filter(p => p.id !== star.value?.pizza.id).slice(0, 2) }))
  .filter(s => s.pizzas.length))

const ingredients = (p: SitePizza) => [...p.avant, ...p.apres].map(i => tr(i, 'name')).join(', ')
</script>

<template>
  <section
    v-if="star"
    class="relative px-4 py-20 sm:px-8 lg:py-32"
    aria-labelledby="tournee-menu"
  >
    <div class="mx-auto max-w-6xl">
      <header class="max-w-2xl">
        <p class="eyebrow text-braise-300">
          {{ c.menuEyebrow }}
        </p>
        <h2
          id="tournee-menu"
          class="mt-4 font-display text-3xl font-semibold text-farine-50 sm:text-5xl"
        >
          {{ c.menuTitle }}
        </h2>
        <p class="mt-5 font-serif text-lg leading-relaxed text-farine-100/70 italic">
          {{ fill(c.menuLead, { n: count }) }}
        </p>
      </header>

      <div class="mt-12 grid gap-12 lg:mt-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-20">
        <!-- Pizza à la une -->
        <article class="relative">
          <div class="relative mx-auto aspect-square w-full max-w-md">
            <img
              v-if="star.pizza.imageUrl"
              :src="star.pizza.imageUrl"
              :alt="star.pizza.imageAlt ?? star.pizza.name"
              class="size-full rounded-full object-cover"
              loading="lazy"
            >
            <PizzaEngraving v-else />
            <span class="absolute top-4 -left-1 rotate-[-8deg] border border-braise-300/60 bg-charbon-950 px-3 py-1.5 font-display text-[0.65rem] font-semibold tracking-[0.22em] text-braise-300 uppercase sm:left-2">
              {{ star.label }}
            </span>
          </div>
          <div class="mt-8 text-center">
            <h3 class="font-display text-2xl font-semibold text-farine-50 sm:text-3xl">
              {{ star.pizza.name }}
            </h3>
            <p class="mt-1 font-deco text-xl text-braise-300">
              {{ price(star.pizza.priceCents) }}
            </p>
            <p class="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-farine-100/70">
              <span class="text-farine-100/90">{{ tr(star.pizza, 'baseLabel') }}</span> · {{ ingredients(star.pizza) }}
            </p>
            <p
              v-if="star.pitch"
              class="mx-auto mt-3 max-w-sm font-serif text-farine-100/70 italic"
            >
              {{ star.pitch }}
            </p>
          </div>
        </article>

        <!-- Extrait de la carte, façon ardoise -->
        <div class="lg:pt-6">
          <div
            v-for="s in picks"
            :key="s.section"
            class="mb-10 last:mb-0"
          >
            <h3 class="ruled eyebrow text-farine-100/60">
              {{ t(`menu.sections.${s.section}`) }}
            </h3>
            <ul class="mt-4 space-y-5">
              <li
                v-for="p in s.pizzas"
                :key="p.id"
              >
                <div class="flex items-baseline gap-3">
                  <span class="font-display text-lg font-semibold text-farine-50">{{ p.name }}</span>
                  <span
                    class="leader min-w-6 flex-1"
                    aria-hidden="true"
                  />
                  <span class="font-deco text-lg text-braise-300 tabular-nums">{{ price(p.priceCents) }}</span>
                </div>
                <p class="mt-1 text-sm leading-relaxed text-farine-100/60">
                  <span class="text-farine-100/80">{{ tr(p, 'baseLabel') }}</span> · {{ ingredients(p) }}
                </p>
              </li>
            </ul>
          </div>

          <div class="mt-12 flex flex-wrap items-center gap-4">
            <NuxtLink
              :to="localePath('la-carte')"
              class="btn-ghost min-h-11 text-farine-100"
            >
              {{ c.menuAll }}
              <UIcon
                name="i-lucide-arrow-right"
                class="size-4"
              />
            </NuxtLink>
            <p class="text-sm text-farine-100/50">
              {{ t('tonight.orderByPhone') }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.leader {
  border-bottom: 1px dotted rgb(241 232 214 / 0.28);
  transform: translateY(-4px);
}
</style>
