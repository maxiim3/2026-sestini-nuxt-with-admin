<script setup lang="ts">
import { DOUGH_ALLERGENS } from '~~/shared/domain/constants'
import type { SitePizza } from '~/composables/useSite'

const props = defineProps<{ pizza: SitePizza }>()
const { t } = useI18n()
const { tr, price } = useLocalized()

const avant = computed(() => props.pizza.avant.map(i => tr(i, 'name')))
const apres = computed(() => props.pizza.apres.map(i => tr(i, 'name')))
/** Les allergènes de la pâte (soja, gluten, lait) sont rappelés une fois en tête de carte : ici, seulement ceux en plus */
const extra = computed(() => props.pizza.allergens.filter(a => !DOUGH_ALLERGENS.includes(a)).map(a => t(`allergens.${a}`).toLowerCase()))
</script>

<template>
  <article
    :id="pizza.slug"
    class="scroll-mt-40 border-b border-pietra py-5.5 transition-colors duration-700"
    :aria-labelledby="`pizza-${pizza.slug}`"
  >
    <header class="flex items-baseline gap-2.5">
      <h3
        :id="`pizza-${pizza.slug}`"
        class="title-item inline-flex items-baseline gap-2 font-title text-[27px] leading-[1.05] md:text-[30px]"
      >
        {{ tr(pizza, 'name') }}
        <span
          v-if="pizza.tags.vegetarian"
          class="text-oliva"
          :title="t('menu.filters.vegetarian')"
        >
          <UIcon
            name="i-lucide-leaf"
            class="size-4"
          />
          <span class="sr-only">{{ t('menu.filters.vegetarian') }}</span>
        </span>
      </h3>
      <span
        aria-hidden="true"
        class="leader"
      />
      <span class="whitespace-nowrap font-semibold tabular-nums">{{ price(pizza.priceCents) }}</span>
    </header>

    <!-- Une seule couleur et un seul accent : les intitulés en gras, comme sur la carte d'origine -->
    <p class="mt-1.5 text-[15px] leading-normal">
      <b class="font-semibold">{{ tr(pizza, 'baseLabel') }}</b>{{ avant.length ? `, ${avant.join(', ')}` : '' }}
    </p>
    <p
      v-if="apres.length"
      class="mt-0.5 text-[15px] leading-normal"
    >
      <b class="font-semibold">{{ t('menu.afterBaking') }}{{ t('menu.colon') }}</b> {{ apres.join(', ') }}
    </p>

    <p
      v-if="extra.length"
      class="mt-1.5 text-[13px] text-fumo"
    >
      {{ t('menu.allergens') }} {{ t('menu.allergensMore') }}{{ t('menu.colon') }} {{ extra.join(', ') }}
    </p>
  </article>
</template>
