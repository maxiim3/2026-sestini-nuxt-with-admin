<script setup lang="ts">
type Pizza = NonNullable<PrintPayloadOf<'carte'>['menu']>['sections'][number]['pizzas'][number]

/** Une ligne de la carte imprimée : nom, prix, base et ingrédients, après cuisson, allergènes */
const props = defineProps<{ pizza: Pizza, name: string, text: PrintText }>()

const avant = computed(() => props.pizza.avant.map(i => props.text.tr(i, 'name')).join(', '))
const apres = computed(() => props.pizza.apres.map(i => props.text.tr(i, 'name')).join(', '))
const allergens = computed(() => props.pizza.allergens.map(allergenNumber).sort((a, b) => a - b).join('·'))
</script>

<template>
  <div class="pr-pizza">
    <div class="pr-pizza__head">
      <span class="pr-pizza__name">{{ name }}</span>
      <span
        v-if="pizza.tags.vegetarian"
        class="pr-pizza__veg"
      >{{ text.t('vegetarianShort') }}</span>
      <span class="pr-leader" />
      <span class="pr-pizza__price">{{ text.price(pizza.priceCents) }}</span>
    </div>
    <p class="pr-pizza__desc">
      <span class="pr-pizza__base">{{ text.tr(pizza, 'baseLabel') }}</span>
      <template v-if="avant">
        · {{ avant }}
      </template>
      <span
        v-if="!apres"
        class="pr-allergens"
      >{{ allergens }}</span>
    </p>
    <p
      v-if="apres"
      class="pr-pizza__after"
    >
      <span class="pr-pizza__after-label">{{ text.site.menu.afterBaking }}</span> — {{ apres }}
      <span class="pr-allergens">{{ allergens }}</span>
    </p>
  </div>
</template>
