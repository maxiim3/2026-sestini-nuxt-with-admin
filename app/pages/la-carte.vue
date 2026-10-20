<script setup lang="ts">
import { BASE_KINDS, type BaseKind } from '~~/shared/domain/constants'

definePageMeta({
  i18n: { paths: { fr: '/la-carte', en: '/menu', es: '/carta', it: '/menu' } },
})

const { t } = useI18n()
const { tr, price } = useLocalized()
const { data } = await useSite()

usePageSeo({
  title: () => `${t('menu.title')} · Sestini Pizza`,
  description: () => `${t('menu.subtitle')}. ${t('brand.pitch')}`,
  og: 'carte',
})
await useJsonLd('menu')

type Category = 'pizzas' | 'drinks' | 'supplements' | 'desserts'
const category = ref<Category>('pizzas')
const categories = computed(() => [
  { id: 'pizzas' as const, icon: 'i-lucide-pizza' },
  { id: 'drinks' as const, icon: 'i-lucide-wine' },
  { id: 'supplements' as const, icon: 'i-lucide-plus' },
  ...(data.value?.desserts.length ? [{ id: 'desserts' as const, icon: 'i-lucide-cake-slice' }] : []),
])

const bases = ref<BaseKind[]>([])
type Diet = 'vegetarian' | 'meat' | 'fish'
const diet = ref<Diet | null>(null)

function toggleBase(b: BaseKind) {
  bases.value = bases.value.includes(b) ? bases.value.filter(x => x !== b) : [...bases.value, b]
}

const availableBases = computed(() => {
  const all = data.value?.menu?.sections.flatMap(s => s.pizzas.map(p => p.baseKind)) ?? []
  return BASE_KINDS.filter(b => all.includes(b))
})

const sections = computed(() => (data.value?.menu?.sections ?? [])
  .map(section => ({
    ...section,
    pizzas: section.pizzas.filter(p =>
      (!bases.value.length || bases.value.includes(p.baseKind))
      && (!diet.value || p.tags[diet.value])),
  }))
  .filter(s => s.pizzas.length))

const featured = computed(() => data.value?.featured.filter(f => f.showOnMenu) ?? [])
const drinkGroups = computed(() => {
  const groups = new Map<string, NonNullable<typeof data.value>['drinks']>()
  for (const d of data.value?.drinks ?? []) groups.set(d.category, [...(groups.get(d.category) ?? []), d])
  return [...groups.entries()]
})
</script>

<template>
  <div class="grain min-h-dvh overflow-x-clip bg-charbon-950">
    <section class="relative overflow-hidden pb-10 pt-32 lg:pt-40">
      <div
        class="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(224,170,62,0.18),transparent)]"
        aria-hidden="true"
      />
      <div class="relative mx-auto max-w-5xl px-4 text-center sm:px-6">
        <p
          v-if="data?.menu"
          class="eyebrow text-braise-300"
        >
          {{ tr(data.menu, 'name') }}
        </p>
        <h1 class="mt-4 font-display text-5xl font-semibold tracking-wider text-farine-50 sm:text-7xl">
          {{ t('menu.title') }}
        </h1>
        <p
          v-if="data?.menu?.tagline"
          class="mx-auto mt-5 max-w-xl font-serif text-lg italic text-farine-200/75"
        >
          {{ tr(data.menu, 'tagline') }}
        </p>
        <div class="mt-8 flex justify-center">
          <SiteTonightPill />
        </div>
      </div>
    </section>

    <nav
      class="sticky top-16 z-30 border-y border-white/5 bg-charbon-950/85 backdrop-blur-xl lg:top-20"
      :aria-label="t('menu.title')"
    >
      <div class="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 py-2 sm:justify-center sm:px-6">
        <button
          v-for="c in categories"
          :key="c.id"
          class="flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors"
          :class="category === c.id ? 'bg-farine-50 text-charbon-950' : 'text-farine-200/75 hover:bg-white/5 hover:text-farine-50'"
          :aria-pressed="category === c.id"
          @click="category = c.id"
        >
          <UIcon
            :name="c.icon"
            class="size-4"
          />
          {{ t(`menu.categories.${c.id}`) }}
        </button>
      </div>
    </nav>

    <div class="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
      <!-- Pizzas -->
      <div v-show="category === 'pizzas'">
        <div
          class="flex flex-wrap items-center justify-center gap-2 py-8"
          role="group"
          :aria-label="t('menu.filters.title')"
        >
          <button
            v-for="b in availableBases"
            :key="b"
            class="rounded-full border px-3.5 py-1.5 text-sm transition-colors"
            :class="bases.includes(b) ? 'border-braise-300 bg-braise-300/15 text-braise-200' : 'border-white/10 text-farine-200/70 hover:border-white/25'"
            :aria-pressed="bases.includes(b)"
            data-track="menu_filter_toggled"
            :data-track-filter="b"
            @click="toggleBase(b)"
          >
            {{ t(`menu.filters.${b}`) }}
          </button>
          <span
            class="mx-1 hidden h-5 w-px bg-white/10 sm:block"
            aria-hidden="true"
          />
          <button
            v-for="d in (['vegetarian', 'meat', 'fish'] as const)"
            :key="d"
            class="rounded-full border px-3.5 py-1.5 text-sm transition-colors"
            :class="diet === d ? 'border-braise-300 bg-braise-300/15 text-braise-200' : 'border-white/10 text-farine-200/70 hover:border-white/25'"
            :aria-pressed="diet === d"
            data-track="menu_filter_toggled"
            :data-track-filter="d"
            @click="diet = diet === d ? null : d"
          >
            {{ t(`menu.filters.${d}`) }}
          </button>
          <button
            v-if="bases.length || diet"
            class="px-2 text-sm text-farine-200/60 underline underline-offset-4 hover:text-farine-50"
            @click="bases = []; diet = null"
          >
            {{ t('menu.filters.reset') }}
          </button>
        </div>

        <section
          v-for="f in featured"
          :key="f.id"
          class="relative mb-12 overflow-hidden rounded-3xl border border-braise-400/30 bg-gradient-to-br from-braise-950/60 via-charbon-900 to-charbon-900 px-6 py-2 sm:px-10"
        >
          <p class="eyebrow pt-6 text-braise-300">
            <UIcon
              name="i-lucide-flame"
              class="mr-1 inline size-4 align-[-3px]"
            />
            {{ tr(f, 'title') }}
          </p>
          <MenuPizza
            :pizza="f.pizza"
            featured
          />
        </section>

        <section
          v-for="section in sections"
          :key="section.section"
          class="mb-14"
        >
          <header class="mb-2 text-center">
            <h2 class="ruled font-display text-2xl font-semibold uppercase tracking-[0.2em] text-farine-50 sm:text-3xl">
              {{ t(`menu.sections.${section.section}`) }}
            </h2>
            <p class="mt-2 font-serif text-sm italic text-farine-200/55">
              {{ t(`menu.sectionsHint.${section.section}`) }}
            </p>
          </header>
          <div class="grid gap-x-14 divide-y divide-white/5 md:grid-cols-2 md:divide-y-0">
            <MenuPizza
              v-for="pizza in section.pizzas"
              :key="pizza.id"
              :pizza="pizza"
            />
          </div>
        </section>

        <p
          v-if="!sections.length"
          class="py-16 text-center text-farine-200/60"
        >
          {{ t('menu.filters.empty') }}
        </p>

        <p class="mx-auto max-w-xl border-t border-white/5 pt-6 text-center text-sm text-farine-200/55">
          {{ t('menu.allergensNote') }} {{ t('menu.pricesNote') }}
        </p>
      </div>

      <!-- Boissons -->
      <div
        v-show="category === 'drinks'"
        class="grid gap-12 py-12 md:grid-cols-2"
      >
        <section
          v-for="[cat, items] in drinkGroups"
          :key="cat"
        >
          <h2 class="eyebrow mb-4 text-braise-300">
            {{ t(`drinks.${cat}`) }}
          </h2>
          <ul class="divide-y divide-white/5">
            <li
              v-for="d in items"
              :key="d.id"
              class="flex items-baseline gap-3 py-3"
            >
              <span class="text-farine-50">{{ tr(d, 'name') }}</span>
              <span class="text-sm text-farine-200/50">{{ d.volume }}</span>
              <span class="flex-1 border-b border-dotted border-farine-200/20" />
              <span class="font-deco font-bold text-braise-300">{{ price(d.priceCents) }}</span>
            </li>
          </ul>
        </section>
      </div>

      <!-- Suppléments -->
      <div
        v-show="category === 'supplements'"
        class="mx-auto max-w-2xl py-12"
      >
        <p class="mb-8 text-center font-serif italic text-farine-200/70">
          {{ t('menu.supplementsNote') }}
        </p>
        <ul class="divide-y divide-white/5">
          <li
            v-for="s in data?.supplements"
            :key="s.id"
            class="flex items-start gap-5 py-4"
          >
            <span class="w-16 shrink-0 font-deco text-lg font-bold text-braise-300">+{{ price(s.priceCents) }}</span>
            <span class="text-farine-100/90">{{ tr(s, 'label') }}</span>
          </li>
        </ul>
      </div>

      <!-- Desserts -->
      <div
        v-show="category === 'desserts'"
        class="mx-auto max-w-2xl py-12"
      >
        <ul class="divide-y divide-white/5">
          <li
            v-for="d in data?.desserts"
            :key="d.id"
            class="flex items-baseline gap-3 py-4"
          >
            <span class="text-farine-50">{{ tr(d, 'name') }}</span>
            <span class="flex-1 border-b border-dotted border-farine-200/20" />
            <span class="font-deco font-bold text-braise-300">{{ price(d.priceCents) }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
