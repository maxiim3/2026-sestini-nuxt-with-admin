<script setup lang="ts">
import { ALLERGENS, BASE_KINDS, type Allergen, type BaseKind, type MenuSection } from '~~/shared/domain/constants'
import { slugify } from '~~/shared/domain/text'
import type { Operation } from '~~/shared/schemas'

export interface EditablePizza {
  id?: string
  slug: string
  name: string
  baseKind: BaseKind
  baseLabel: string
  priceCents: number
  imageUrl: string | null
  extraAllergens: Allergen[]
  avant: string[]
  apres: string[]
  i18n: Partial<Record<'en' | 'es' | 'it', Record<string, string>>> | null
}

const props = defineProps<{
  pizza: EditablePizza | null
  /** Carte et section où ajouter une nouvelle pizza */
  addTo?: { menuId: string, section: MenuSection, position: number } | null
  ingredientNames: string[]
}>()
const open = defineModel<boolean>('open', { required: true })
const { apply, pending } = useAdminWrite()

const BASE_LABELS: Record<BaseKind, string> = { tomate: 'Sauce tomate', creme: 'Crème fraîche', speciale: 'Base spéciale', sans: 'Sans base' }
const SECTION_FOR_BASE: Record<BaseKind, MenuSection> = { tomate: 'rouges', creme: 'blanches', speciale: 'speciales', sans: 'speciales' }

const form = ref<EditablePizza>(blank())
const euros = ref(0)
const slugTouched = ref(false)

function blank(): EditablePizza {
  return { slug: '', name: '', baseKind: 'tomate', baseLabel: 'Sauce tomate', priceCents: 1500, imageUrl: null, extraAllergens: [], avant: ['Mozzarella Fior di Latte'], apres: [], i18n: null }
}

watch(() => [open.value, props.pizza] as const, ([isOpen]) => {
  if (!isOpen) return
  form.value = props.pizza ? structuredClone(toRaw(props.pizza)) : blank()
  euros.value = form.value.priceCents / 100
  slugTouched.value = Boolean(props.pizza)
}, { immediate: true })

watch(() => form.value.name, (name) => {
  if (!slugTouched.value) form.value.slug = slugify(name)
})
watch(() => form.value.baseKind, (kind, old) => {
  if (old && form.value.baseLabel === BASE_LABELS[old]) form.value.baseLabel = BASE_LABELS[kind]
})

const isNew = computed(() => !form.value.id)
const valid = computed(() => form.value.name.trim() && form.value.slug && form.value.baseLabel.trim() && euros.value > 0)

async function save(mode: 'publish' | 'draft') {
  const f = form.value
  const data = {
    slug: f.slug,
    name: f.name.trim(),
    baseKind: f.baseKind,
    baseLabel: f.baseLabel.trim(),
    priceCents: Math.round(euros.value * 100),
    imageUrl: f.imageUrl || null,
    extraAllergens: f.extraAllergens,
    i18n: f.i18n,
  }
  const ref = f.id ?? '$pizza'
  const ops: Operation[] = isNew.value
    ? [{ op: 'create', entity: 'pizza', ref: '$pizza', data }]
    : [{ op: 'update', entity: 'pizza', id: f.id!, data }]
  ops.push({ op: 'setPizzaIngredients', pizzaId: ref, avant: f.avant, apres: f.apres })
  if (isNew.value && props.addTo) {
    const menus = await $fetch('/api/admin/menus')
    const menu = menus.find(m => m.id === props.addTo!.menuId)
    const items = (menu?.items ?? []).map(i => ({ pizzaId: i.pizzaId, section: i.section, position: i.position }))
    items.push({ pizzaId: '$pizza', section: props.addTo.section ?? SECTION_FOR_BASE[f.baseKind], position: props.addTo.position })
    ops.push({ op: 'setMenuItems', menuId: props.addTo.menuId, items })
  }
  await apply(isNew.value ? `Nouvelle pizza : ${data.name}` : `Pizza modifiée : ${data.name}`, ops, { mode })
  open.value = false
}
</script>

<template>
  <USlideover
    v-model:open="open"
    :title="isNew ? 'Nouvelle pizza' : `Modifier ${form.name}`"
    description="Les allergènes sont calculés depuis les ingrédients ; ajoutez ici ceux qui manqueraient."
    :ui="{ content: 'max-w-xl' }"
  >
    <template #body>
      <div class="space-y-5">
        <UFormField
          label="Nom"
          required
        >
          <UInput
            v-model="form.name"
            placeholder="La Regina"
            class="w-full"
            autofocus
          />
        </UFormField>
        <UFormField
          label="Identifiant (URL)"
          help="Généré à partir du nom."
        >
          <UInput
            v-model="form.slug"
            class="w-full font-mono text-sm"
            @update:model-value="slugTouched = true"
          />
        </UFormField>
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Base">
            <USelect
              v-model="form.baseKind"
              :items="BASE_KINDS.map(b => ({ label: BASE_LABELS[b], value: b }))"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Prix (€)">
            <UInputNumber
              v-model="euros"
              :step="0.5"
              :min="0"
              :format-options="{ style: 'currency', currency: 'EUR' }"
              class="w-full"
            />
          </UFormField>
        </div>
        <UFormField
          label="Libellé de la base"
          help="Affiché sur la carte, ex. « Crème de potimarron »."
        >
          <UInput
            v-model="form.baseLabel"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Avant cuisson"
          help="Entrée pour ajouter. Un ingrédient inconnu est créé automatiquement."
        >
          <UInputTags
            v-model="form.avant"
            class="w-full"
            placeholder="Ajouter un ingrédient"
          />
        </UFormField>
        <UFormField label="Après cuisson">
          <UInputTags
            v-model="form.apres"
            class="w-full"
            placeholder="Ajouter un ingrédient"
          />
        </UFormField>
        <p
          v-if="ingredientNames.length"
          class="-mt-3 text-xs text-stone-500"
        >
          Ingrédients connus : {{ ingredientNames.slice(0, 12).join(', ') }}…
        </p>
        <UFormField label="Allergènes supplémentaires">
          <USelectMenu
            v-model="form.extraAllergens"
            :items="ALLERGENS.map(a => ({ label: allergenLabel(a), value: a }))"
            value-key="value"
            multiple
            placeholder="Aucun"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Photo (URL)"
          help="Optionnel. Les photos importées dans l'atelier seront proposées ici."
        >
          <UInput
            v-model="form.imageUrl as string"
            placeholder="https://…"
            class="w-full"
          />
        </UFormField>
        <AdminTranslationsField
          v-model="form.i18n"
          :fields="[{ key: 'name', label: 'Nom' }, { key: 'baseLabel', label: 'Libellé de la base' }]"
        />
      </div>
    </template>
    <template #footer>
      <AdminPublishBar
        class="w-full"
        :loading="pending"
        :disabled="!valid"
        @save="save"
      />
    </template>
  </USlideover>
</template>
