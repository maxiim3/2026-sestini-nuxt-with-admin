<script setup lang="ts">
import { ALLERGENS, type Allergen } from '~~/shared/domain/constants'

/** La carte complète, sur une page */
const props = defineProps<PrintProps<'carte'>>()

const t = computed(() => props.text)
const site = computed(() => props.text.site)

const sections = computed(() => props.data.menu?.sections ?? [])

/** Allergènes présents sur la carte, numérotés selon le règlement UE */
const usedAllergens = computed(() => {
  const set = new Set<Allergen>()
  for (const s of sections.value) for (const p of s.pizzas) for (const a of p.allergens) set.add(a)
  for (const f of props.data.featured) for (const a of f.pizza.allergens) set.add(a)
  return ALLERGENS.filter(a => set.has(a))
})

const drinkGroups = computed(() => {
  const groups = new Map<string, typeof props.data.drinks>()
  for (const d of props.data.drinks) groups.set(d.category, [...(groups.get(d.category) ?? []), d])
  return [...groups.entries()].map(([category, drinks]) => ({
    category,
    label: site.value.drinks[category as keyof typeof site.value.drinks] ?? category,
    drinks,
  }))
})
</script>

<template>
  <div class="pr-page pr-carte">
    <header class="pr-carte__head">
      <PrintEmblem
        :theme="options.theme"
        class="pr-brand__emblem"
      />
      <PrintWordmark
        :theme="options.theme"
        class="pr-brand__wordmark"
      />
      <p class="pr-eyebrow pr-brand__tagline">
        {{ site.brand.tagline }}
      </p>
      <div class="pr-carte__title pr-ruled">
        <p class="pr-eyebrow">
          {{ site.menu.title }}<template v-if="data.menu">
            · {{ t.tr(data.menu, 'name') }}
          </template>
        </p>
      </div>
      <p
        v-if="data.menu?.tagline"
        class="pr-carte__tagline pr-italic"
      >
        {{ t.tr(data.menu, 'tagline') }}
      </p>
    </header>

    <p
      v-if="!data.menu"
      class="pr-empty"
    >
      {{ t.t('empty') }}
    </p>

    <div
      v-else
      class="pr-carte__main"
    >
      <div
        class="pr-carte__body"
        data-fit
      >
        <section
          v-for="f in data.featured"
          :key="f.id"
          class="pr-featured"
        >
          <p class="pr-eyebrow">
            {{ t.tr(f, 'title') }}
          </p>
          <PrintMenuPizza
            :pizza="f.pizza"
            :text="text"
            :name="displayPizzaName(t.tr(f.pizza, 'name'), t.tr(f, 'title'))"
          />
        </section>
        <section
          v-for="section in sections"
          :key="section.section"
          class="pr-section"
        >
          <header class="pr-section__head">
            <h2 class="pr-section__title pr-ruled">
              {{ site.menu.sections[section.section] }}
            </h2>
            <p class="pr-section__hint">
              {{ site.menu.sectionsHint[section.section] }}
            </p>
          </header>
          <PrintMenuPizza
            v-for="pizza in section.pizzas"
            :key="pizza.id"
            :pizza="pizza"
            :text="text"
            :name="t.tr(pizza, 'name')"
          />
        </section>
      </div>
      <div
        v-if="data.supplements.length || data.drinks.length"
        class="pr-carte__extras"
      >
        <section v-if="data.supplements.length">
          <h2 class="pr-extras__title">
            {{ site.menu.categories.supplements }}
          </h2>
          <p class="pr-extras__note">
            {{ t.t('perIngredient') }}
          </p>
          <div
            v-for="s in data.supplements"
            :key="s.id"
            class="pr-line pr-supplement"
          >
            <span class="pr-line__price">{{ t.price(s.priceCents) }}</span>
            <span class="pr-line__label">{{ t.tr(s, 'label') }}</span>
          </div>
        </section>
        <section v-if="data.drinks.length">
          <h2 class="pr-extras__title">
            {{ site.menu.categories.drinks }}
          </h2>
          <div
            v-for="g in drinkGroups"
            :key="g.category"
            class="pr-drink-group"
          >
            <p class="pr-drink-group__name">
              {{ g.label }}
            </p>
            <div
              v-for="d in g.drinks"
              :key="d.id"
              class="pr-line"
            >
              <span class="pr-line__label">{{ t.tr(d, 'name') }} <span
                v-if="d.volume"
                class="pr-line__volume"
              >{{ d.volume }}</span></span>
              <span class="pr-leader" />
              <span class="pr-line__price">{{ t.price(d.priceCents) }}</span>
            </div>
          </div>
        </section>
        <section v-if="data.desserts.length">
          <h2 class="pr-extras__title">
            {{ site.menu.categories.desserts }}
          </h2>
          <div
            v-for="d in data.desserts"
            :key="d.id"
            class="pr-line"
          >
            <span class="pr-line__label">{{ t.tr(d, 'name') }}</span>
            <span class="pr-leader" />
            <span class="pr-line__price">{{ t.price(d.priceCents) }}</span>
          </div>
        </section>
      </div>
    </div>

    <footer class="pr-carte__foot">
      <p class="pr-carte__legal">
        <b>{{ t.t('allergensKey') }}</b>
        <template
          v-for="a in usedAllergens"
          :key="a"
        >
          <span class="pr-dot" /><b>{{ allergenNumber(a) }}</b> {{ t.allergen(a) }}
        </template>
        <span class="pr-dot" />{{ site.menu.allergensNote }} {{ site.menu.pricesNote }}
      </p>
      <div class="pr-carte__bottom">
        <PrintWeek
          :text="text"
          :slots="data.common.typicalWeek"
          rows
        />
        <PrintContact
          :text="text"
          :contact="data.common.contact"
          size="sm"
        />
      </div>
    </footer>
  </div>
</template>
