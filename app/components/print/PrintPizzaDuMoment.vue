<script setup lang="ts">
/** Flyer / affiche de la pizza du moment */
const props = defineProps<PrintProps<'pizza-du-moment'> & { overrides?: Record<string, string> }>()

const t = computed(() => props.text)
const pizza = computed(() => props.data.pizza)
const featured = computed(() => props.data.featured)

const title = computed(() => props.overrides?.title
  || (featured.value ? t.value.tr(featured.value, 'title') : t.value.site.menu.featured))
const pitch = computed(() => props.overrides?.body
  || (featured.value?.pitch ? t.value.tr(featured.value, 'pitch') : null))
const name = computed(() => pizza.value
  ? displayPizzaName(t.value.tr(pizza.value, 'name'), featured.value?.title ?? t.value.site.menu.featured)
  : '')
const avant = computed(() => pizza.value?.avant.map(i => t.value.tr(i, 'name')).join(' · ') ?? '')
const apres = computed(() => pizza.value?.apres.map(i => t.value.tr(i, 'name')).join(' · ') ?? '')
const allergens = computed(() => pizza.value?.allergens.map(a => t.value.allergen(a)).join(', ') ?? '')
const landscape = computed(() => props.options.orientation === 'landscape')
</script>

<template>
  <div class="pr-page pr-poster pr-pdm">
    <div class="pr-brand">
      <PrintWordmark
        :theme="options.theme"
        class="pr-brand__wordmark"
        :style="{ width: '19em' }"
      />
      <p class="pr-eyebrow pr-brand__tagline">
        {{ t.site.brand.tagline }}
      </p>
    </div>

    <p
      v-if="!pizza"
      class="pr-empty"
    >
      {{ t.t('empty') }}
    </p>

    <div
      v-else
      class="pr-poster__main pr-pdm__main"
      data-fit
    >
      <div :class="{ 'pr-pdm__col': landscape }">
        <div class="pr-pdm__visual">
          <img
            v-if="pizza.imageUrl"
            :src="pizza.imageUrl"
            :alt="pizza.imageAlt ?? name"
            class="pr-pdm__photo"
          >
          <div
            v-else
            class="pr-pdm__halo"
          >
            <PrintEmblem :theme="options.theme" />
          </div>
        </div>
        <div
          v-if="landscape"
          class="pr-medallion"
        >
          <span>{{ t.price(pizza.priceCents) }}</span>
        </div>
      </div>

      <div
        class="pr-poster__main"
        :class="{ 'pr-pdm__col': landscape }"
        :style="landscape ? undefined : { flex: 'none' }"
      >
        <p class="pr-eyebrow pr-poster__eyebrow pr-ruled">
          {{ title }}
        </p>
        <h1 class="pr-poster__title pr-pdm__name">
          {{ name }}
        </h1>
        <p class="pr-pdm__ingredients">
          <span class="pr-pdm__base">{{ t.tr(pizza, 'baseLabel') }}</span>
          <template v-if="avant">
            · {{ avant }}
          </template>
        </p>
        <p
          v-if="apres"
          class="pr-pdm__after"
        >
          <span class="pr-pdm__after-label">{{ t.site.menu.afterBaking }}</span><br>{{ apres }}
        </p>
        <p
          v-if="pitch"
          class="pr-poster__lead"
        >
          {{ pitch }}
        </p>
        <div
          v-if="!landscape"
          class="pr-medallion"
        >
          <span>{{ t.price(pizza.priceCents) }}</span>
        </div>
        <p
          v-if="featured?.endsOn && !featured.archived"
          class="pr-eyebrow pr-pdm__until"
        >
          {{ t.t('until', { date: t.date(featured.endsOn, { day: 'numeric', month: 'long' }) }) }}
        </p>
        <p class="pr-pdm__allergens">
          {{ t.site.menu.allergens }} : {{ allergens }}
        </p>
      </div>
    </div>

    <div class="pr-poster__foot">
      <span class="pr-ornament"><span>◆</span></span>
      <PrintContact
        :text="text"
        :contact="data.common.contact"
      />
    </div>
  </div>
</template>
