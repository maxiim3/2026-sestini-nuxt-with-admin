<script setup lang="ts">
import { DOUGH_ALLERGENS } from '~~/shared/domain/constants'
import type { SitePizza } from '~/composables/useSite'

const props = defineProps<{ pizza: SitePizza }>()
const { t } = useI18n()
const { tr, price } = useLocalized()

const avant = computed(() => props.pizza.avant.map(i => tr(i, 'name')))
const apres = computed(() => props.pizza.apres.map(i => tr(i, 'name')))
/** Les allergènes communs à toutes les pizzas d'abord, puis ceux en plus */
const common = computed(() => DOUGH_ALLERGENS.map(a => t(`allergens.${a}`).toLowerCase()).join(', '))
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
        class="inline-flex items-baseline gap-2 font-title text-[27px] leading-[1.05] md:text-[30px]"
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

    <p class="mt-1.5 text-[15px] leading-normal">
      <b class="font-semibold text-oro-ink">{{ tr(pizza, 'baseLabel') }}</b>
      <template v-if="avant.length">
        · {{ avant.join(', ') }}
      </template>
    </p>
    <p
      v-if="apres.length"
      class="mt-0.5 text-[15px] leading-normal"
    >
      <span class="text-fumo">{{ t('menu.afterBaking') }} —</span> <i>{{ apres.join(', ') }}</i>
    </p>

    <p class="mt-2 text-[12.5px] text-fumo">
      {{ t('menu.allergens') }} : {{ common }}<template v-if="extra.length">
        · <b class="font-semibold text-nero">{{ t('menu.allergensMore') }} : {{ extra.join(', ') }}</b>
      </template>
    </p>
  </article>
</template>
