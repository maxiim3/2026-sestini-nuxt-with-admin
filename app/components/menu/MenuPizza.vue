<script setup lang="ts">
import type { SitePizza } from '~/composables/useSite'

const props = defineProps<{ pizza: SitePizza, featured?: boolean }>()
const { t } = useI18n()
const { tr, price } = useLocalized()

const avant = computed(() => props.pizza.avant.map(i => tr(i, 'name')))
const apres = computed(() => props.pizza.apres.map(i => tr(i, 'name')))
</script>

<template>
  <article
    class="group relative py-5"
    :aria-labelledby="`pizza-${pizza.slug}`"
  >
    <header class="flex items-baseline gap-3">
      <h3
        :id="`pizza-${pizza.slug}`"
        class="font-display text-lg font-semibold tracking-wide text-farine-50 sm:text-xl"
      >
        {{ tr(pizza, 'name') }}
      </h3>
      <span
        v-if="pizza.tags.vegetarian"
        class="text-emerald-300/80"
        :title="t('menu.filters.vegetarian')"
      >
        <UIcon
          name="i-lucide-leaf"
          class="size-4"
        />
        <span class="sr-only">{{ t('menu.filters.vegetarian') }}</span>
      </span>
      <span
        aria-hidden="true"
        class="min-w-6 flex-1 translate-y-[-4px] border-b border-dotted border-farine-200/25"
      />
      <span class="font-deco text-lg font-bold text-braise-300 sm:text-xl">{{ price(pizza.priceCents) }}</span>
    </header>

    <p class="mt-1.5 text-[15px] leading-relaxed text-farine-200/80">
      <span class="text-braise-200/90">{{ tr(pizza, 'baseLabel') }}</span>
      <template v-if="avant.length">
        · {{ avant.join(', ') }}
      </template>
    </p>
    <p
      v-if="apres.length"
      class="mt-1 font-serif text-[15px] italic leading-relaxed text-farine-200/70"
    >
      <span class="not-italic text-farine-200/50">{{ t('menu.afterBaking') }} —</span> {{ apres.join(', ') }}
    </p>

    <p class="mt-2 flex flex-wrap gap-x-2 text-xs text-farine-200/45">
      <span class="sr-only">{{ t('menu.allergens') }} :</span>
      <span
        v-for="a in pizza.allergens"
        :key="a"
      >{{ t(`allergens.${a}`) }}</span>
    </p>
  </article>
</template>
