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
    <!-- Sur mobile, la photo et la semaine tiennent pile entre l'en-tête (et le bandeau) et la barre d'appel,
         mesuré sur le plus petit écran (svh : barre de Safari visible) ; quand elle se replie, la section suivante affleure -->
    <section class="relative flex min-h-[calc(100svh-3.75rem-4.25rem-env(safe-area-inset-bottom)-var(--notice-h,0px))] flex-col justify-end overflow-hidden bg-nero text-crema md:min-h-[720px]">
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
      <div class="relative mx-auto w-full max-w-[1200px] px-5 pb-5 pt-14 md:pb-12 md:pt-30 lg:px-10">
        <p class="kicker flex items-center gap-2.5 text-[0.66rem] tracking-[0.14em] text-abricot md:text-[0.72rem] md:tracking-[0.18em]">
          <img
            src="/brand/emblem.svg"
            alt=""
            width="30"
            height="18"
            class="hidden h-[1.6em] w-auto md:block"
          >
          {{ t('home.heroKicker') }}
        </p>
        <h1 class="title-hero mb-3 mt-3 font-title text-[clamp(52px,12vw,112px)] leading-[0.9] tracking-[-0.025em] md:mb-4 md:mt-3.5">
          <SiteDecoText
            :text="t('home.heroTitleStart')"
            letters="first"
          /><br>{{ t('home.heroTitleMiddle') }} <i class="text-abricot"><SiteDecoText
            :text="t('home.heroTitleEnd')"
            letters="last"
          /></i>.
        </h1>
        <p class="max-w-[42ch] text-[15.5px] leading-relaxed text-crema/85 md:text-[19px] md:leading-normal">
          {{ t('home.heroLead') }}
        </p>
        <NuxtLink
          :to="localePath('la-carte')"
          class="link-arrow mt-4 md:mt-6"
        >
          {{ t('home.seeMenu') }} <span>→</span>
        </NuxtLink>
      </div>
      <div class="relative mx-auto w-full max-w-[1200px] px-5 lg:px-10">
        <ol class="grid auto-cols-[minmax(136px,1fr)] grid-flow-col overflow-x-auto border-t border-nero-line [scrollbar-width:none]">
          <li
            v-for="(d, i) in week"
            :key="d.date"
            class="pb-4 pr-4 pt-3.5 md:pb-5 md:pt-4"
            :class="i > 0 && 'border-l border-nero-line pl-4'"
          >
            <p
              class="kicker whitespace-nowrap"
              :class="d.date === today ? 'text-abricot' : 'text-fumo-dark'"
            >
              {{ date(d.date, { weekday: 'short' }) }}<template v-if="d.date === today">
                · {{ t('home.tonight') }}
              </template>
            </p>
            <p
              class="title-item mt-1 font-title text-[22px] leading-tight"
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
          <h2 class="title-item mt-3 font-title text-[clamp(44px,9vw,96px)] leading-[0.92] tracking-[-0.02em]">
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
            <h2 class="title-section mt-3 font-title text-[clamp(44px,9vw,96px)] leading-[0.92] tracking-[-0.02em]">
              <SiteDecoText :text="t('home.seasonTitle')" />
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
                class="title-item flex items-baseline gap-1.5 font-title leading-tight"
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
            <span class="title-item font-title text-[26px] leading-tight md:text-[32px]">{{ t('home.allPizzas') }}</span>
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
                  <span class="title-item inline-flex items-baseline gap-2 font-title text-[27px] leading-[1.05] transition-colors group-hover:text-rosso">
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
                  <b class="font-semibold">{{ tr(p, 'baseLabel') }}</b><template v-if="p.avant.length">, {{ p.avant.map(i => tr(i, 'name')).join(', ') }}</template>
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

    <!-- Commander : trois étapes à la verticale, avec l'appel en évidence -->
    <section class="py-18 md:py-30">
      <div class="mx-auto grid max-w-[1200px] gap-9 px-5 md:grid-cols-[1fr_1.1fr] md:items-start md:gap-18 lg:px-10">
        <div>
          <p class="kicker text-rosso">
            {{ t('home.orderTitle') }}
          </p>
          <h2 class="title-section mt-3 font-title text-[clamp(44px,9vw,96px)] leading-[0.92] tracking-[-0.02em]">
            <SiteDecoText :text="t('home.orderHeading')" />
          </h2>
          <a
            :href="contact.phoneHref"
            class="btn mt-7 bg-nero text-crema hover:bg-nero-2"
            data-track="call_clicked"
            data-track-source="home-order"
          >
            <UIcon
              name="i-lucide-phone"
              class="size-4"
            />
            <span class="tabular-nums">{{ contact.phone }}</span>
          </a>
        </div>
        <ol class="border-t border-nero">
          <li
            v-for="n in 3"
            :key="n"
            class="grid grid-cols-[52px_1fr] items-baseline gap-4 border-b border-pietra py-6 md:grid-cols-[64px_1fr] md:py-7"
          >
            <span class="font-title text-[44px] leading-none text-rosso md:text-[52px]">{{ n }}</span>
            <div>
              <p class="text-lg font-semibold md:text-xl">
                {{ t(`home.order${n}`) }}
              </p>
              <i18n-t
                v-if="n === 1"
                keypath="home.order1Text"
                tag="p"
                class="mt-1 text-[15px] text-fumo"
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
              <p
                v-else
                class="mt-1 text-[15px] text-fumo"
              >
                {{ t(`home.order${n}Text`) }}
              </p>
              <p
                v-if="n === 3"
                class="mt-1.5 text-[13px] text-fumo"
              >
                {{ t('home.order3Note') }}
              </p>
            </div>
          </li>
        </ol>
      </div>
      <!-- Le camion change de village selon le soir : on le rappelle avant que le client ne se déplace -->
      <div class="mx-auto mt-8 max-w-[1200px] px-5 md:mt-10 lg:px-10">
        <p class="flex items-start gap-3 border-l-2 border-rosso bg-lino px-4 py-3.5 text-[15px] md:items-center">
          <UIcon
            name="i-lucide-map-pin"
            class="mt-0.5 size-4 shrink-0 text-rosso md:mt-0"
          />
          <span>
            {{ t('home.orderPlace') }}
            <NuxtLink
              :to="localePath('nous-trouver')"
              class="ml-1 whitespace-nowrap font-semibold underline underline-offset-3"
            >{{ t('home.orderPlaceLink') }} →</NuxtLink>
          </span>
        </p>
      </div>
    </section>
  </div>
</template>
