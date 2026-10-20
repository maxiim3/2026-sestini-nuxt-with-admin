<script setup lang="ts">
import { useCeSoir } from './useCeSoir'
import { useReveal } from './useReveal'

defineProps<{ source: string }>()

const { t } = useI18n()
const { c, data, today } = useCeSoir()
const { tr, price } = useLocalized()
const contact = useContact()
const localePath = useLocalePath()

type Section = 'rouges' | 'blanches' | 'speciales'

/** Graine stable pour la journée : même suggestion au rendu serveur et côté client */
const seed = computed(() => {
  const [y, m, d] = (today.value || '2026-01-01').split('-').map(Number) as [number, number, number]
  return Math.floor(Date.UTC(y, m - 1, d) / 864e5)
})

const sections = computed(() => data.value?.menu?.sections ?? [])
const all = computed(() => sections.value.flatMap(s => s.pizzas.map(pizza => ({ pizza, section: s.section as Section }))))

/** Pizza du moment si elle est mise en avant, sinon une pizza de la carte qui change chaque jour */
const pick = computed(() => {
  const featured = data.value?.featured.find(f => f.showOnHome && f.pizza)
  if (featured) {
    const section = all.value.find(e => e.pizza.id === featured.pizza.id)?.section ?? null
    return { pizza: featured.pizza, section, eyebrow: tr(featured, 'title') || c.value.poster.featured, pitch: featured.pitch ? tr(featured, 'pitch') : '' }
  }
  const entry = all.value.length ? all.value[seed.value % all.value.length]! : null
  return entry ? { ...entry, eyebrow: c.value.poster.pick, pitch: '' } : null
})

const others = computed(() => sections.value
  .map((s) => {
    const list = s.pizzas.filter(p => p.id !== pick.value?.pizza.id)
    return list.length ? { pizza: list[(seed.value + 1) % list.length]!, section: s.section as Section } : null
  })
  .filter(e => e !== null)
  .slice(0, 3))

/** « La Zucca » → article « La » + « Zucca », pour la mise en page d'affiche */
const title = computed(() => {
  const name = pick.value ? tr(pick.value.pizza, 'name') : ''
  const m = name.match(/^(La|Le|Les|L['’])\s*(.+)$/)
  return m ? { article: m[1]!, main: m[2]! } : { article: '', main: name }
})

const mainSize = computed(() => {
  const longest = Math.max(5, ...title.value.main.split(/\s+/).map(w => w.length))
  return `min(${(150 / longest).toFixed(2)}cqi, 8.5rem)`
})

const avant = computed(() => pick.value?.pizza.avant.map(i => tr(i, 'name')) ?? [])
const apres = computed(() => pick.value?.pizza.apres.map(i => tr(i, 'name')) ?? [])
const priceChars = computed(() => (pick.value ? price(pick.value.pizza.priceCents) : '').split(''))
const count = computed(() => all.value.length)

const root = ref<HTMLElement | null>(null)
useReveal(root, (gsap) => {
  const trigger = { trigger: '.cs-poster', start: 'top 72%', once: true }
  const tl = gsap.timeline({ scrollTrigger: trigger })
  tl.from('.cs-title-line > span', { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.12 })
    .from('.cs-ingredients', { opacity: 0, y: 24, duration: 0.8, ease: 'power2.out' }, '-=0.6')
  gsap.from('.cs-digit', {
    yPercent: -130,
    rotate: () => gsap.utils.random(-12, 12),
    opacity: 0,
    duration: 0.9,
    ease: 'back.out(1.7)',
    stagger: 0.07,
    scrollTrigger: { trigger: '.cs-price', start: 'top 88%', once: true },
  })
})
</script>

<template>
  <section
    v-if="pick"
    ref="root"
    class="grain relative bg-charbon-950 py-24 lg:py-36"
  >
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <p class="eyebrow ruled text-braise-300">
        {{ pick.eyebrow }}
      </p>

      <article class="cs-poster relative mt-10 border border-braise-400/30 p-2 sm:p-2.5 lg:mt-14">
        <div class="relative grid gap-10 border border-braise-400/15 px-5 py-8 sm:px-10 sm:py-12 lg:grid-cols-12 lg:gap-14 lg:px-14 lg:py-16">
          <span
            v-for="corner in ['left-3 top-3', 'right-3 top-3', 'left-3 bottom-3', 'right-3 bottom-3']"
            :key="corner"
            class="absolute size-1.5 rotate-45 bg-braise-400/70"
            :class="corner"
            aria-hidden="true"
          />

          <!-- Emplacement photo en arche, comme la bouche du four -->
          <figure class="cs-reveal relative mx-auto w-full max-w-sm lg:col-span-5 lg:max-w-none">
            <div class="cs-arch relative aspect-[4/5] overflow-hidden rounded-t-full border border-braise-400/35 bg-charbon-900">
              <img
                v-if="pick.pizza.imageUrl"
                :src="pick.pizza.imageUrl"
                :alt="pick.pizza.imageAlt || tr(pick.pizza, 'name')"
                class="absolute inset-0 size-full object-cover"
                loading="lazy"
                decoding="async"
              >
              <div
                v-else
                class="absolute inset-0"
                aria-hidden="true"
              >
                <div class="cs-embers absolute inset-0" />
                <div class="absolute inset-x-[9%] bottom-0 top-[9%] rounded-t-full border border-b-0 border-braise-400/20" />
                <div class="absolute inset-x-[18%] bottom-0 top-[18%] rounded-t-full border border-b-0 border-braise-400/12" />
                <div class="absolute inset-x-[27%] bottom-0 top-[27%] rounded-t-full border border-b-0 border-braise-400/8" />
                <img
                  src="/brand/emblem.svg"
                  alt=""
                  width="160"
                  height="94"
                  loading="lazy"
                  class="absolute bottom-[14%] left-1/2 w-[46%] -translate-x-1/2 drop-shadow-[0_10px_40px_rgba(224,170,62,0.35)]"
                >
              </div>
            </div>
            <figcaption
              v-if="pick.pizza.imageUrl"
              class="mt-3 text-center font-serif text-sm text-farine-200/55 italic"
            >
              {{ c.poster.imageSoon }}
            </figcaption>
          </figure>

          <div class="cs-poster-body flex min-w-0 flex-col lg:col-span-7">
            <p class="eyebrow text-farine-200/60">
              <template v-if="pick.section">
                {{ t(`menu.sections.${pick.section}`) }} ·
              </template>
              {{ c.poster.base }} : {{ tr(pick.pizza, 'baseLabel') }}
              <template v-if="pick.pizza.tags.vegetarian">
                · <span class="text-emerald-300/90">{{ t('menu.filters.vegetarian') }}</span>
              </template>
            </p>

            <h2 class="mt-5 text-farine-50">
              <span
                v-if="title.article"
                class="cs-title-line block overflow-hidden pb-[0.08em]"
              >
                <span class="block font-serif text-[clamp(2.25rem,5vw,4rem)] leading-none text-braise-300 italic">{{ title.article }}</span>
              </span>
              <span class="cs-title-line block overflow-hidden pb-[0.06em]">
                <span
                  class="block font-display font-semibold uppercase leading-[0.95] tracking-wide"
                  :style="{ fontSize: mainSize }"
                >{{ title.main }}</span>
              </span>
            </h2>

            <p
              v-if="pick.pitch"
              class="mt-6 max-w-xl font-serif text-xl text-farine-100/85 italic"
            >
              {{ pick.pitch }}
            </p>

            <div class="cs-ingredients mt-8 space-y-5">
              <p class="font-serif text-2xl leading-snug text-farine-100 italic sm:text-[1.7rem]">
                <template
                  v-for="(name, i) in avant"
                  :key="name"
                >
                  <span
                    v-if="i"
                    class="mx-2 text-braise-400 not-italic"
                    aria-hidden="true"
                  >·</span>{{ name }}
                </template>
              </p>
              <p
                v-if="apres.length"
                class="text-sm text-farine-200/70"
              >
                <span class="eyebrow mr-2 text-braise-300">{{ c.poster.after }}</span>
                {{ apres.join(', ') }}
              </p>
            </div>

            <!-- Filet qui se trace jusqu'au prix -->
            <div class="cs-price mt-10 flex items-end gap-5 lg:mt-auto lg:pt-12">
              <span
                class="cs-trace mb-[0.9em] h-px flex-1 bg-gradient-to-r from-braise-400/10 via-braise-400/60 to-braise-400"
                aria-hidden="true"
              />
              <p
                class="flex overflow-hidden whitespace-pre font-deco text-[clamp(4rem,10vw,8.5rem)] font-bold leading-[1.05] text-braise-300"
                :aria-label="price(pick.pizza.priceCents)"
              >
                <span
                  v-for="(ch, i) in priceChars"
                  :key="i"
                  class="cs-digit inline-block"
                  aria-hidden="true"
                >{{ ch }}</span>
              </p>
            </div>

            <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                :href="contact.phoneHref"
                class="btn-fire min-h-12"
                data-track="call_clicked"
                :data-track-source="source"
              >
                <UIcon
                  name="i-lucide-phone"
                  class="size-4"
                />
                {{ c.poster.order }}
              </a>
              <NuxtLink
                :to="localePath('la-carte')"
                class="btn-ghost min-h-12 text-farine-100"
                data-track="menu_clicked"
                :data-track-source="source"
              >
                {{ c.poster.seeMenu }}
                <UIcon
                  name="i-lucide-arrow-right"
                  class="size-4"
                />
              </NuxtLink>
            </div>
          </div>
        </div>
      </article>

      <!-- Trois autres pizzas, une par famille -->
      <div
        v-if="others.length"
        class="mt-20 lg:mt-24"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-farine-100/15 pb-4">
          <h3 class="font-display text-lg font-semibold uppercase tracking-[0.18em] text-farine-50 sm:text-xl">
            {{ c.poster.alsoTitle }}
          </h3>
          <span class="font-serif text-sm text-farine-200/55 italic">{{ c.poster.count(count) }}</span>
        </div>
        <ul class="grid md:grid-cols-3">
          <li
            v-for="o in others"
            :key="o.pizza.id"
            class="cs-reveal border-b border-farine-100/10 py-7 md:border-b-0 md:border-l md:px-8 md:first:border-l-0 md:first:pl-0"
          >
            <p class="eyebrow text-braise-300/80">
              {{ t(`menu.sections.${o.section}`) }}
            </p>
            <div class="mt-3 flex items-baseline gap-3">
              <span class="font-display text-xl font-semibold tracking-wide text-farine-50">{{ tr(o.pizza, 'name') }}</span>
              <span
                class="min-w-6 flex-1 -translate-y-1 border-b border-dotted border-farine-200/25"
                aria-hidden="true"
              />
              <span class="font-deco text-xl font-bold text-braise-300">{{ price(o.pizza.priceCents) }}</span>
            </div>
            <p class="mt-2 font-serif text-[15px] leading-relaxed text-farine-200/65 italic">
              {{ [...o.pizza.avant, ...o.pizza.apres].map(i => tr(i, 'name')).join(', ') }}
            </p>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cs-poster-body {
  container-type: inline-size;
}

.cs-embers {
  background:
    radial-gradient(60% 38% at 50% 92%, rgb(224 170 62 / 0.38), transparent 70%),
    radial-gradient(90% 60% at 50% 100%, rgb(209 59 36 / 0.22), transparent 70%),
    linear-gradient(180deg, #0e1011 0%, #161514 60%, #23211f 100%);
}

@media (prefers-reduced-motion: no-preference) {
  .cs-embers {
    animation: cs-breathe 5s ease-in-out infinite alternate;
  }
}
@keyframes cs-breathe {
  to {
    filter: brightness(1.18) saturate(1.1);
  }
}
</style>
