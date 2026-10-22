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

const availableDiets = computed(() => {
  const all = data.value?.menu?.sections.flatMap(s => s.pizzas) ?? []
  return (['vegetarian', 'meat', 'fish'] as const).filter(d => all.some(p => p.tags[d]))
})

const featured = computed(() => data.value?.featured.filter(f => f.showOnMenu) ?? [])
const drinkGroups = computed(() => {
  const groups = new Map<string, NonNullable<typeof data.value>['drinks']>()
  for (const d of data.value?.drinks ?? []) groups.set(d.category, [...(groups.get(d.category) ?? []), d])
  return [...groups.entries()]
})

const { hash } = useRoute()
/** Arrivée depuis une tuile de l'accueil (#slug) : on amène la pizza à l'écran et on la met en évidence */
onMounted(() => {
  if (!hash) return
  const el = document.getElementById(decodeURIComponent(hash.slice(1)))
  if (!el) return
  el.scrollIntoView({ block: 'start' })
  el.classList.add('bg-lino')
  setTimeout(() => el.classList.remove('bg-lino'), 2500)
})
</script>

<template>
  <div class="overflow-x-clip">
    <section class="mx-auto grid max-w-[1200px] gap-2.5 px-5 pb-7 pt-9 md:grid-cols-[1fr_auto] md:items-end md:pb-10 md:pt-16 lg:px-10">
      <div>
        <p
          v-if="data?.menu"
          class="kicker text-rosso"
        >
          {{ tr(data.menu, 'name') }}
        </p>
        <h1 class="mt-2.5 font-title text-[clamp(56px,14vw,104px)] leading-[0.92] tracking-[-0.02em]">
          {{ t('menu.title') }}
        </h1>
      </div>
      <p
        v-if="data?.menu?.tagline"
        class="max-w-[34ch] font-title text-xl italic text-fumo md:text-right md:text-[22px]"
      >
        {{ tr(data.menu, 'tagline') }}
      </p>
    </section>

    <div class="border-y border-b-pietra border-t-nero bg-crema md:sticky md:top-19 md:z-30">
      <div class="mx-auto max-w-[1200px] px-5 lg:px-10">
        <div
          class="flex gap-7"
          role="tablist"
          :aria-label="t('menu.title')"
        >
          <button
            v-for="c in categories"
            :key="c.id"
            role="tab"
            :aria-selected="category === c.id"
            class="-mb-px border-b-2 pb-3.5 pt-4 text-[15px] font-semibold transition-colors"
            :class="category === c.id ? 'border-nero text-nero' : 'border-transparent text-fumo hover:text-nero'"
            @click="category = c.id"
          >
            {{ t(`menu.categories.${c.id}`) }}
          </button>
        </div>
        <div
          v-show="category === 'pizzas'"
          class="-mx-5 flex gap-2 overflow-x-auto px-5 pb-3.5 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0 md:pb-4"
          role="group"
          :aria-label="t('menu.filters.title')"
        >
          <button
            v-for="b in availableBases"
            :key="b"
            class="shrink-0 border px-3.5 py-1.5 text-[13px] font-medium transition-colors"
            :class="bases.includes(b) ? 'border-nero bg-nero text-crema' : 'border-pietra hover:border-fumo'"
            :aria-pressed="bases.includes(b)"
            data-track="menu_filter_toggled"
            :data-track-filter="b"
            @click="toggleBase(b)"
          >
            {{ t(`menu.filters.${b}`) }}
          </button>
          <span
            class="mx-1 my-1 w-px shrink-0 bg-pietra"
            aria-hidden="true"
          />
          <button
            v-for="d in availableDiets"
            :key="d"
            class="inline-flex shrink-0 items-center gap-1.5 border px-3.5 py-1.5 text-[13px] font-medium transition-colors"
            :class="diet === d ? 'border-nero bg-nero text-crema' : 'border-pietra hover:border-fumo'"
            :aria-pressed="diet === d"
            data-track="menu_filter_toggled"
            :data-track-filter="d"
            @click="diet = diet === d ? null : d"
          >
            <UIcon
              v-if="d === 'vegetarian'"
              name="i-lucide-leaf"
              class="size-3.5"
            />
            {{ t(`menu.filters.${d}`) }}
          </button>
          <!-- Toujours présent, pour que les filtres ne bougent pas quand il apparaît -->
          <button
            class="shrink-0 px-2 text-[13px] text-rosso underline underline-offset-3"
            :class="{ invisible: !bases.length && !diet }"
            :tabindex="bases.length || diet ? 0 : -1"
            @click="bases = []; diet = null"
          >
            {{ t('menu.filters.reset') }}
          </button>
        </div>
      </div>
    </div>

    <div class="mx-auto max-w-[1200px] px-5 pb-18 lg:px-10">
      <!-- Pizzas -->
      <div v-show="category === 'pizzas'">
        <p class="max-w-[70ch] pt-4 text-sm text-fumo">
          {{ t('menu.allergensNote') }}
        </p>

        <template v-if="!bases.length && !diet">
          <section
            v-for="f in featured"
            :key="f.id"
            class="mt-7 grid gap-5 bg-lino p-4.5 md:mt-10 md:gap-9 md:p-5.5"
            :class="f.pizza.imageUrl ? 'md:grid-cols-[300px_1fr] md:items-center' : ''"
            :aria-label="tr(f, 'title')"
          >
            <img
              v-if="f.pizza.imageUrl"
              :src="f.pizza.imageUrl"
              :alt="f.pizza.imageAlt ?? tr(f.pizza, 'name')"
              class="aspect-[16/10] w-full rounded-[10px] object-cover md:aspect-square"
              loading="lazy"
            >
            <div>
              <p class="kicker text-rosso">
                {{ tr(f, 'title') }}
              </p>
              <MenuPizza :pizza="f.pizza" />
            </div>
          </section>
        </template>

        <section
          v-for="section in sections"
          :key="section.section"
        >
          <header class="flex flex-wrap items-baseline gap-x-4 gap-y-1.5 border-b border-nero pb-3.5 pt-11 md:pt-18">
            <h2 class="font-title text-[clamp(38px,8vw,56px)] leading-none">
              {{ t(`menu.sections.${section.section}`) }}
            </h2>
            <span class="ml-auto text-[13px] text-fumo">{{ t('menu.count', { n: section.pizzas.length }, section.pizzas.length) }}</span>
          </header>
          <div class="grid md:grid-cols-2 md:gap-x-18">
            <MenuPizza
              v-for="pizza in section.pizzas"
              :key="pizza.id"
              :pizza="pizza"
            />
          </div>
        </section>

        <p
          v-if="!sections.length"
          class="py-12 font-title text-[26px] text-fumo"
        >
          {{ t('menu.filters.empty') }}
        </p>

        <p class="pt-9 text-[13px] text-fumo">
          {{ t('menu.pricesNote') }}
        </p>
      </div>

      <!-- Boissons -->
      <div v-show="category === 'drinks'">
        <section
          v-for="[cat, items] in drinkGroups"
          :key="cat"
        >
          <h2 class="border-b border-nero pb-3.5 pt-11 font-title text-[clamp(34px,6vw,48px)] leading-none">
            {{ t(`drinks.${cat}`) }}
          </h2>
          <ul>
            <li
              v-for="d in items"
              :key="d.id"
              class="flex items-baseline gap-2.5 border-b border-pietra py-4"
            >
              <span class="font-title text-2xl">{{ tr(d, 'name') }}</span>
              <span class="text-[13px] text-fumo">{{ d.volume }}</span>
              <span
                class="leader"
                aria-hidden="true"
              />
              <span class="whitespace-nowrap font-semibold tabular-nums">{{ price(d.priceCents) }}</span>
            </li>
          </ul>
        </section>
      </div>

      <!-- Suppléments -->
      <div v-show="category === 'supplements'">
        <p class="pt-6 text-fumo">
          {{ t('menu.supplementsNote') }}
        </p>
        <ul class="mt-4 border-t border-nero">
          <li
            v-for="s in data?.supplements"
            :key="s.id"
            class="flex items-baseline gap-2.5 border-b border-pietra py-4"
          >
            <span class="max-w-[52ch] text-[15px]">{{ tr(s, 'label') }}</span>
            <span
              class="leader"
              aria-hidden="true"
            />
            <span class="whitespace-nowrap font-semibold tabular-nums">+{{ price(s.priceCents) }}</span>
          </li>
        </ul>
      </div>

      <!-- Desserts -->
      <div v-show="category === 'desserts'">
        <ul class="mt-6 border-t border-nero">
          <li
            v-for="d in data?.desserts"
            :key="d.id"
            class="flex items-baseline gap-2.5 border-b border-pietra py-4"
          >
            <span class="font-title text-2xl">{{ tr(d, 'name') }}</span>
            <span
              class="leader"
              aria-hidden="true"
            />
            <span class="whitespace-nowrap font-semibold tabular-nums">{{ price(d.priceCents) }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
