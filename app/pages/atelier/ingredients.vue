<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { ALLERGENS, INGREDIENT_KINDS, type Allergen, type IngredientKind } from '~~/shared/domain/constants'
import { slugify } from '~~/shared/domain/text'
import type { AdminRows } from '../../composables/useAdminEntity'

definePageMeta({ layout: 'admin', middleware: 'admin', i18n: false })
useHead({ title: 'Ingrédients · Atelier' })

type Ingredient = AdminRows['ingredient']
type Tr = Partial<Record<'en' | 'es' | 'it', Record<string, string>>>

const { data: ingredients, status } = await useAdminEntity('ingredient')
const { data: pizzas } = await useFetch('/api/admin/pizzas', { key: 'admin-pizzas' })
const { apply, pending } = useAdminWrite()

const KIND_LABELS: Record<IngredientKind, string> = {
  fromage: 'Fromage',
  viande: 'Viande',
  poisson: 'Poisson',
  legume: 'Légume',
  sauce: 'Sauce',
  herbe: 'Herbe',
  autre: 'Autre',
}
const KIND_ITEMS = INGREDIENT_KINDS.map(k => ({ label: KIND_LABELS[k], value: k }))
const ALLERGEN_ITEMS = ALLERGENS.map(a => ({ label: allergenLabel(a), value: a }))

function kindLabel(kind: IngredientKind) {
  return KIND_LABELS[kind]
}

// Nombre de pizzas (non archivées) qui utilisent chaque ingrédient
const usage = computed(() => {
  const counts = new Map<string, number>()
  for (const p of pizzas.value ?? []) {
    if (p.archived) continue
    for (const id of new Set([...p.avant, ...p.apres].map(i => i.id))) counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  return counts
})

// ─── Filtres ───
const search = ref('')
const kindFilter = ref<IngredientKind | 'all'>('all')
const onlyMissing = ref(false)
const showArchived = ref(false)

function fold(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

const rows = computed(() => (ingredients.value ?? [])
  .filter(i => showArchived.value || !i.archivedAt)
  .filter(i => kindFilter.value === 'all' || i.kind === kindFilter.value)
  .filter(i => !onlyMissing.value || !i.allergens.length)
  .filter(i => !search.value || fold(i.name).includes(fold(search.value)))
  .sort((a, b) => a.name.localeCompare(b.name, 'fr')))

const missingCount = computed(() => (ingredients.value ?? []).filter(i => !i.archivedAt && !i.allergens.length).length)

const columns: TableColumn<Ingredient>[] = [
  { id: 'name', header: 'Ingrédient' },
  { id: 'kind', header: 'Type' },
  { id: 'allergens', header: 'Allergènes' },
  { id: 'origin', header: 'Origine' },
  { id: 'usage', header: 'Pizzas' },
  { id: 'actions', header: '' },
]

// ─── Édition ───
interface Form {
  id?: string
  slug: string
  name: string
  kind: IngredientKind
  allergens: Allergen[]
  origin: string
  i18n: Tr | null
}
const open = ref(false)
const form = ref<Form>(blank())
const slugTouched = ref(false)

function blank(): Form {
  return { slug: '', name: '', kind: 'autre', allergens: [], origin: '', i18n: null }
}
function openNew() {
  form.value = blank()
  slugTouched.value = false
  open.value = true
}
function openEdit(i: Ingredient) {
  form.value = { id: i.id, slug: i.slug, name: i.name, kind: i.kind, allergens: [...i.allergens], origin: i.origin ?? '', i18n: (i.i18n as Tr | null) ?? null }
  slugTouched.value = true
  open.value = true
}
watch(() => form.value.name, (name) => {
  if (!slugTouched.value) form.value.slug = slugify(name)
})

const slugTaken = computed(() => (ingredients.value ?? []).some(i => i.slug === form.value.slug && i.id !== form.value.id))
const valid = computed(() => Boolean(form.value.name.trim() && form.value.slug && !slugTaken.value))

async function save(mode: 'publish' | 'draft') {
  const f = form.value
  const data = {
    slug: f.slug,
    name: f.name.trim(),
    kind: f.kind,
    allergens: f.allergens,
    origin: f.origin.trim() || null,
    i18n: f.i18n,
  }
  await apply(
    f.id ? `Ingrédient modifié : ${data.name}` : `Nouvel ingrédient : ${data.name}`,
    [f.id ? { op: 'update', entity: 'ingredient', id: f.id, data } : { op: 'create', entity: 'ingredient', data }],
    { mode },
  )
  open.value = false
}

// ─── Archivage ───
const toArchive = ref<Ingredient | null>(null)
const confirmOpen = computed({
  get: () => Boolean(toArchive.value),
  set: (v) => {
    if (!v) toArchive.value = null
  },
})
async function archive() {
  const i = toArchive.value
  if (!i) return
  await apply(`Ingrédient archivé : ${i.name}`, [{ op: 'archive', entity: 'ingredient', id: i.id }])
  toArchive.value = null
}
async function restore(i: Ingredient) {
  await apply(`Ingrédient restauré : ${i.name}`, [{ op: 'restore', entity: 'ingredient', id: i.id }])
}
</script>

<template>
  <AdminPage
    title="Ingrédients"
    description="La liste de tous les ingrédients et leurs allergènes. Les allergènes de chaque pizza en découlent automatiquement : un ingrédient bien renseigné, c'est une carte fiable."
  >
    <template #actions>
      <UButton
        icon="i-lucide-plus"
        label="Nouvel ingrédient"
        @click="openNew"
      />
    </template>

    <div class="flex flex-wrap items-center gap-3">
      <div class="w-full sm:w-72">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Rechercher un ingrédient"
          class="w-full"
        />
      </div>
      <div class="w-full sm:w-48">
        <USelect
          v-model="kindFilter"
          :items="[{ label: 'Tous les types', value: 'all' }, ...KIND_ITEMS]"
          class="w-full"
        />
      </div>
      <UButton
        :color="onlyMissing ? 'warning' : 'neutral'"
        :variant="onlyMissing ? 'soft' : 'outline'"
        icon="i-lucide-triangle-alert"
        :label="`Sans allergène renseigné (${missingCount})`"
        @click="onlyMissing = !onlyMissing"
      />
      <label class="flex items-center gap-2 text-sm text-stone-600">
        <USwitch v-model="showArchived" />
        Voir les archives
      </label>
    </div>

    <p
      v-if="onlyMissing"
      class="-mt-3 text-sm text-stone-500"
    >
      Certains ingrédients n'ont vraiment aucun allergène (tomate, basilic…) : ouvrez la fiche pour vérifier, vous pouvez la laisser telle quelle.
    </p>

    <div
      v-if="status === 'pending'"
      class="space-y-2"
    >
      <USkeleton
        v-for="n in 6"
        :key="n"
        class="h-12"
      />
    </div>

    <UTable
      v-else
      :data="rows"
      :columns="columns"
      class="hidden shrink-0 rounded-xl border border-stone-200 md:block"
      :ui="{ th: 'bg-stone-50 text-stone-600', td: 'align-top' }"
    >
      <template #empty>
        <div class="py-8 text-center text-sm text-stone-500">
          Aucun ingrédient ne correspond.
        </div>
      </template>
      <template #name-cell="{ row }">
        <div class="min-w-36">
          <p
            class="font-medium"
            :class="row.original.archivedAt && 'text-stone-400 line-through'"
          >
            {{ row.original.name }}
          </p>
          <UBadge
            v-if="row.original.archivedAt"
            size="sm"
            color="neutral"
            variant="subtle"
            label="archivé"
          />
        </div>
      </template>
      <template #kind-cell="{ row }">
        {{ kindLabel(row.original.kind) }}
      </template>
      <template #allergens-cell="{ row }">
        <div
          v-if="row.original.allergens.length"
          class="flex min-w-40 flex-wrap gap-1"
        >
          <UBadge
            v-for="a in row.original.allergens"
            :key="a"
            size="sm"
            color="warning"
            variant="subtle"
            :label="allergenLabel(a)"
          />
        </div>
        <span
          v-else
          class="text-xs text-stone-400"
        >Aucun renseigné</span>
      </template>
      <template #origin-cell="{ row }">
        <span class="text-stone-600">{{ row.original.origin ?? '—' }}</span>
      </template>
      <template #usage-cell="{ row }">
        <span
          class="whitespace-nowrap text-sm"
          :class="usage.get(row.original.id) ? 'text-stone-700' : 'text-stone-400'"
        >
          {{ usage.get(row.original.id) ?? 0 }} pizza{{ (usage.get(row.original.id) ?? 0) > 1 ? 's' : '' }}
        </span>
      </template>
      <template #actions-cell="{ row }">
        <div class="flex justify-end gap-1">
          <UButton
            size="sm"
            color="neutral"
            variant="outline"
            icon="i-lucide-pencil"
            aria-label="Modifier"
            @click="openEdit(row.original)"
          />
          <UButton
            v-if="row.original.archivedAt"
            size="sm"
            color="neutral"
            variant="ghost"
            icon="i-lucide-archive-restore"
            aria-label="Restaurer"
            @click="restore(row.original)"
          />
          <UButton
            v-else
            size="sm"
            color="neutral"
            variant="ghost"
            icon="i-lucide-archive"
            aria-label="Archiver"
            @click="toArchive = row.original"
          />
        </div>
      </template>
    </UTable>

    <ul
      v-if="status !== 'pending'"
      class="shrink-0 divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200 md:hidden"
    >
      <li
        v-for="i in rows"
        :key="i.id"
        class="space-y-2 bg-white p-4"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <p
              class="font-medium"
              :class="i.archivedAt && 'text-stone-400 line-through'"
            >
              {{ i.name }}
            </p>
            <p class="text-xs text-stone-500">
              {{ kindLabel(i.kind) }}<template v-if="i.origin">
                · {{ i.origin }}
              </template> · {{ usage.get(i.id) ?? 0 }} pizza{{ (usage.get(i.id) ?? 0) > 1 ? 's' : '' }}
            </p>
          </div>
          <div class="flex shrink-0 gap-1">
            <UButton
              size="sm"
              color="neutral"
              variant="outline"
              icon="i-lucide-pencil"
              aria-label="Modifier"
              @click="openEdit(i)"
            />
            <UButton
              v-if="i.archivedAt"
              size="sm"
              color="neutral"
              variant="ghost"
              icon="i-lucide-archive-restore"
              aria-label="Restaurer"
              @click="restore(i)"
            />
            <UButton
              v-else
              size="sm"
              color="neutral"
              variant="ghost"
              icon="i-lucide-archive"
              aria-label="Archiver"
              @click="toArchive = i"
            />
          </div>
        </div>
        <div
          v-if="i.allergens.length"
          class="flex flex-wrap gap-1"
        >
          <UBadge
            v-for="a in i.allergens"
            :key="a"
            size="sm"
            color="warning"
            variant="subtle"
            :label="allergenLabel(a)"
          />
        </div>
        <p
          v-else
          class="text-xs text-stone-400"
        >
          Aucun allergène renseigné
        </p>
      </li>
      <li
        v-if="!rows.length"
        class="p-6 text-center text-sm text-stone-500"
      >
        Aucun ingrédient ne correspond.
      </li>
    </ul>

    <USlideover
      v-model:open="open"
      :title="form.id ? `Modifier ${form.name}` : 'Nouvel ingrédient'"
      description="Cochez tous les allergènes présents dans l'ingrédient tel qu'il est acheté."
      :ui="{ content: 'sm:max-w-lg' }"
    >
      <template #body>
        <div class="space-y-5">
          <UFormField
            label="Nom"
            required
          >
            <UInput
              v-model="form.name"
              placeholder="Mozzarella Fior di Latte"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Identifiant"
            help="Généré à partir du nom."
            :error="slugTaken ? 'Cet identifiant existe déjà' : undefined"
          >
            <UInput
              v-model="form.slug"
              class="w-full font-mono text-sm"
              @update:model-value="slugTouched = true"
            />
          </UFormField>
          <UFormField label="Type">
            <USelect
              v-model="form.kind"
              :items="KIND_ITEMS"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Allergènes"
            help="Les 14 allergènes à déclaration obligatoire."
          >
            <USelectMenu
              v-model="form.allergens"
              :items="ALLERGEN_ITEMS"
              value-key="value"
              multiple
              placeholder="Aucun allergène"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Origine"
            help="Optionnel, ex. « Italie » ou « Lozère »."
          >
            <UInput
              v-model="form.origin"
              class="w-full"
            />
          </UFormField>
          <AdminTranslationsField
            v-model="form.i18n"
            :fields="[{ key: 'name', label: 'Nom' }]"
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

    <AdminConfirm
      v-model:open="confirmOpen"
      title="Archiver cet ingrédient ?"
      :description="`« ${toArchive?.name} » ne sera plus proposé. Les pizzas qui l'utilisent déjà ne changent pas.`"
      confirm-label="Archiver"
      color="warning"
      :loading="pending"
      @confirm="archive"
    />
  </AdminPage>
</template>
