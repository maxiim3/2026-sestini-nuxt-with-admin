<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { tr, price, date } = useLocalized()
const { data } = await useSite()
const contact = useContact()

usePageSeo({
  title: () => `Sestini Pizza · ${t('brand.tagline')}, ${t('brand.area')}`,
  description: () => `${t('brand.pitch')} ${t('tonight.orderByPhone')}.`,
  og: 'home',
})

const features = computed(() => ((data.value?.settings ?? {}) as Record<string, { featuredOnHome?: boolean } | undefined>)['site.features'] ?? {})

/** La pizza du moment mise en avant sur l'accueil */
const featured = computed(() => features.value.featuredOnHome === false ? null : data.value?.featured.find(f => f.showOnHome) ?? null)

/** La semaine qui vient, en bandeau sous la photo */
const week = computed(() => (data.value?.week ?? []).slice(0, 7))
const today = computed(() => data.value?.tonight.today.date ?? '')

const pizzaCount = computed(() => data.value?.menu?.sections.reduce((n, s) => n + s.pizzas.length, 0) ?? 0)

/** Sans photos : les deux premières pizzas de chaque section de la carte */
const highlights = computed(() => (data.value?.menu?.sections ?? []).flatMap(s => s.pizzas.slice(0, 2)).slice(0, 6))

/** Les pizzas de la carte qui ont une photo (4 au plus), chacune menant à sa fiche sur la carte */
const tiles = computed(() => (data.value?.menu?.sections ?? [])
  .flatMap(s => s.pizzas)
  .filter(p => p.imageUrl)
  .slice(0, 4))
</script>

<template>
  <div>
    <!-- Photo plein écran et semaine -->
    <section class="relative flex min-h-[calc(100svh-3.75rem-4.25rem-4rem)] flex-col justify-end overflow-hidden bg-nero text-crema md:min-h-[720px]">
      <img
        src="/images/accueil-four.jpg"
        alt=""
        class="absolute inset-0 size-full object-cover object-[65%_60%] md:object-[center_60%]"
        fetchpriority="high"
      >
      <div
        class="absolute inset-0 bg-[linear-gradient(0deg,rgb(19_17_16/.96)_8%,rgb(19_17_16/.55)_50%,rgb(19_17_16/.15)_100%)] md:bg-[linear-gradient(90deg,rgb(19_17_16/.92)_0%,rgb(19_17_16/.6)_40%,rgb(19_17_16/.05)_78%),linear-gradient(0deg,rgb(19_17_16/.9)_0%,transparent_35%)]"
        aria-hidden="true"
      />
      <div class="relative mx-auto w-full max-w-[1200px] px-5 pb-6 pt-30 md:pb-12 lg:px-10">
        <p class="kicker flex items-center gap-2.5 text-abricot">
          <img
            src="/brand/emblem.svg"
            alt=""
            width="30"
            height="18"
            class="h-[1.6em] w-auto"
          >
          {{ t('home.heroKicker') }}
        </p>
        <h1 class="mb-4 mt-3.5 max-w-[10ch] font-title text-[clamp(52px,12vw,112px)] leading-[0.9] tracking-[-0.025em]">
          {{ t('home.heroTitleStart') }} <i class="text-abricot">{{ t('home.heroTitleEnd') }}</i>.
        </h1>
        <p class="max-w-[42ch] text-[17px] text-crema/85 md:text-[19px]">
          {{ t('home.heroLead') }}
        </p>
        <NuxtLink
          :to="localePath('la-carte')"
          class="link-arrow mt-6"
        >
          {{ t('home.seeMenu') }} <span>→</span>
        </NuxtLink>
      </div>
      <div class="relative mx-auto w-full max-w-[1200px] px-5 lg:px-10">
        <ol class="grid auto-cols-[minmax(118px,1fr)] grid-flow-col overflow-x-auto border-t border-nero-line [scrollbar-width:none]">
          <li
            v-for="(d, i) in week"
            :key="d.date"
            class="pb-5 pr-4 pt-4"
            :class="i > 0 && 'border-l border-nero-line pl-4'"
          >
            <p
              class="kicker"
              :class="d.date === today ? 'text-abricot' : 'text-fumo-dark'"
            >
              {{ date(d.date, { weekday: 'short' }) }}<template v-if="d.date === today">
                · {{ t('home.tonight') }}
              </template>
            </p>
            <p
              class="mt-1 font-title text-[22px] leading-tight"
              :class="!d.open && 'italic text-fumo-dark'"
            >
              {{ d.open && d.location ? d.location.city.replace(/-lès-.*$/, '') : t('home.rest') }}
            </p>
          </li>
        </ol>
      </div>
    </section>

    <!-- La pizza du moment -->
    <section
      v-if="featured"
      class="py-18 md:py-30"
    >
      <div
        class="mx-auto grid max-w-[1200px] gap-7 px-5 lg:px-10"
        :class="featured.pizza.imageUrl && 'md:grid-cols-2 md:items-center md:gap-18'"
      >
        <img
          v-if="featured.pizza.imageUrl"
          :src="featured.pizza.imageUrl"
          :alt="featured.pizza.imageAlt ?? tr(featured.pizza, 'name')"
          class="aspect-square w-full rounded-[10px] object-cover"
          loading="lazy"
        >
        <div :class="!featured.pizza.imageUrl && 'max-w-[680px]'">
          <p class="kicker text-rosso">
            {{ tr(featured, 'title') }}
          </p>
          <h2 class="mt-3 font-title text-[clamp(44px,9vw,96px)] leading-[0.92] tracking-[-0.02em]">
            {{ tr(featured.pizza, 'name') }}
          </h2>
          <dl class="mt-5.5 border-t border-pietra">
            <div class="grid grid-cols-[110px_1fr] gap-3 border-b border-pietra py-3 text-[15px]">
              <dt class="pt-px text-[13px] text-fumo">
                {{ t('home.compoBase') }}
              </dt>
              <dd>{{ tr(featured.pizza, 'baseLabel') }}</dd>
            </div>
            <div
              v-if="featured.pizza.avant.length"
              class="grid grid-cols-[110px_1fr] gap-3 border-b border-pietra py-3 text-[15px]"
            >
              <dt class="pt-px text-[13px] text-fumo">
                {{ t('home.compoOven') }}
              </dt>
              <dd>{{ featured.pizza.avant.map(i => tr(i, 'name')).join(', ') }}</dd>
            </div>
            <div
              v-if="featured.pizza.apres.length"
              class="grid grid-cols-[110px_1fr] gap-3 border-b border-pietra py-3 text-[15px]"
            >
              <dt class="pt-px text-[13px] text-fumo">
                {{ t('home.compoAfter') }}
              </dt>
              <dd>{{ featured.pizza.apres.map(i => tr(i, 'name')).join(', ') }}</dd>
            </div>
          </dl>
          <div class="mt-5.5 flex items-center gap-7">
            <span class="font-title text-[40px] leading-none tabular-nums">{{ price(featured.pizza.priceCents) }}</span>
            <NuxtLink
              :to="localePath('la-carte')"
              class="link-arrow"
            >
              {{ t('home.allPizzas') }} <span>→</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- La carte en images -->
    <section class="bg-lino py-18 md:py-30">
      <div class="mx-auto max-w-[1200px] px-5 lg:px-10">
        <div class="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p
              v-if="data?.menu"
              class="kicker text-fumo"
            >
              {{ tr(data.menu, 'name') }}
            </p>
            <h2 class="mt-3 font-title text-[clamp(44px,9vw,96px)] leading-[0.92] tracking-[-0.02em]">
              {{ t('home.seasonTitle') }}
            </h2>
          </div>
          <NuxtLink
            :to="localePath('la-carte')"
            class="link-arrow"
          >
            {{ t('menu.count', { n: pizzaCount }, pizzaCount) }} <span>→</span>
          </NuxtLink>
        </div>
        <div
          v-if="tiles.length"
          class="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"
        >
          <NuxtLink
            v-for="(p, i) in tiles"
            :key="p.id"
            :to="`${localePath('la-carte')}#${p.slug}`"
            class="group relative aspect-square overflow-hidden rounded-[10px] bg-nero-2 text-crema"
            :class="i === 0 && 'col-span-2 md:row-span-2'"
          >
            <img
              :src="p.imageUrl!"
              :alt="p.imageAlt ?? ''"
              class="size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              loading="lazy"
            >
            <span class="absolute inset-x-0 bottom-0 bg-[linear-gradient(0deg,rgb(19_17_16/.85),transparent)] px-3.5 pb-3 pt-10 md:px-5 md:pb-4 md:pt-15">
              <span
                class="flex items-baseline gap-1.5 font-title leading-tight"
                :class="i === 0 ? 'text-[34px] md:text-5xl' : 'text-[21px] md:text-[26px]'"
              >
                {{ tr(p, 'name') }}
                <UIcon
                  v-if="p.tags.vegetarian"
                  name="i-lucide-leaf"
                  class="size-4 text-[#c9cd95]"
                />
              </span>
              <span class="mt-0.5 block text-[13px] font-semibold tabular-nums">{{ price(p.priceCents) }}</span>
            </span>
          </NuxtLink>
          <NuxtLink
            :to="localePath('la-carte')"
            class="flex aspect-square flex-col justify-end rounded-[10px] bg-nero p-4 text-crema md:p-5.5"
          >
            <span class="font-title text-[26px] leading-tight md:text-[32px]">{{ t('home.allPizzas') }}</span>
            <span class="mt-1.5 text-sm font-semibold text-abricot">{{ t('home.allPizzasHint') }} →</span>
          </NuxtLink>
        </div>

        <!-- Sans photos : quelques pizzas de la saison, en texte, comme sur la carte -->
        <template v-else>
          <ul class="mt-8 grid border-t border-nero md:grid-cols-3 md:gap-x-12">
            <li
              v-for="p in highlights"
              :key="p.id"
              class="border-b border-pietra"
            >
              <NuxtLink
                :to="`${localePath('la-carte')}#${p.slug}`"
                class="group block py-5"
              >
                <span class="flex items-baseline gap-2.5">
                  <span class="inline-flex items-baseline gap-2 font-title text-[27px] leading-[1.05] transition-colors group-hover:text-rosso">
                    {{ tr(p, 'name') }}
                    <UIcon
                      v-if="p.tags.vegetarian"
                      name="i-lucide-leaf"
                      class="size-4 text-oliva"
                    />
                  </span>
                  <span
                    class="leader"
                    aria-hidden="true"
                  />
                  <span class="whitespace-nowrap font-semibold tabular-nums">{{ price(p.priceCents) }}</span>
                </span>
                <span class="mt-1.5 block text-[15px] leading-normal">
                  <b class="font-semibold text-oro-ink">{{ tr(p, 'baseLabel') }}</b><template v-if="p.avant.length"> · {{ p.avant.map(i => tr(i, 'name')).join(', ') }}</template>
                </span>
              </NuxtLink>
            </li>
          </ul>
          <NuxtLink
            :to="localePath('la-carte')"
            class="link-arrow mt-8"
          >
            {{ t('home.allPizzas') }} <span>→</span>
          </NuxtLink>
        </template>
      </div>
    </section>

    <!-- Commander -->
    <section class="py-10 md:py-11">
      <div class="mx-auto grid max-w-[1200px] gap-4.5 px-5 md:grid-cols-[auto_1fr_1fr_1fr] md:items-start md:gap-10 lg:px-10">
        <h2 class="kicker text-rosso">
          {{ t('home.orderTitle') }}
        </h2>
        <div class="grid grid-cols-[34px_1fr] items-baseline gap-3">
          <span class="font-title text-3xl leading-none text-rosso">1</span>
          <div>
            <p class="font-semibold">
              {{ t('home.order1') }}
            </p>
            <i18n-t
              keypath="home.order1Text"
              tag="p"
              class="text-[14.5px] text-fumo"
              scope="global"
            >
              <template #phone>
                <a
                  :href="contact.phoneHref"
                  class="font-semibold text-nero underline underline-offset-3"
                  data-track="call_clicked"
                  data-track-source="home-order"
                >{{ contact.phone }}</a>
              </template>
            </i18n-t>
          </div>
        </div>
        <div class="grid grid-cols-[34px_1fr] items-baseline gap-3">
          <span class="font-title text-3xl leading-none text-rosso">2</span>
          <div>
            <p class="font-semibold">
              {{ t('home.order2') }}
            </p>
            <p class="text-[14.5px] text-fumo">
              {{ t('home.order2Text') }}
            </p>
          </div>
        </div>
        <div class="grid grid-cols-[34px_1fr] items-baseline gap-3">
          <span class="font-title text-3xl leading-none text-rosso">3</span>
          <div>
            <p class="font-semibold">
              {{ t('home.order3') }}
            </p>
            <p class="text-[14.5px] text-fumo">
              {{ t('home.order3Text') }}
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
