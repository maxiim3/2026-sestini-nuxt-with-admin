<script setup lang="ts">
import { ALLERGENS, DRINK_CATEGORIES, type Allergen, type DrinkCategory } from '~~/shared/domain/constants'
import type { Operation } from '~~/shared/schemas'
import type { AdminRows } from '../../composables/useAdminEntity'

definePageMeta({ layout: 'admin', middleware: 'admin', i18n: false })
useHead({ title: 'Boissons & suppléments · Atelier' })

type Tr = Partial<Record<'en' | 'es' | 'it', Record<string, string>>>
type Kind = 'drink' | 'supplement' | 'dessert'
type Row = { id: string, position: number, priceCents: number, archivedAt: string | null }

const { data: drinks, status: drinksStatus } = await useAdminEntity('drink')
const { data: supplements } = await useAdminEntity('supplement')
const { data: desserts } = await useAdminEntity('dessert')
const { data: settings } = await useFetch<Record<string, unknown>>('/api/admin/settings', { key: 'admin-settings' })
const { apply, pending } = useAdminWrite()

const showArchived = ref(false)
const dessertsEnabled = computed(() => Boolean((settings.value?.['site.features'] as { desserts?: boolean } | undefined)?.desserts))

const CATEGORY_LABELS: Record<DrinkCategory, string> = { soft: 'Soft', eau: 'Eau', biere: 'Bière', vin: 'Vin' }
const CATEGORY_ITEMS = DRINK_CATEGORIES.map(c => ({ label: CATEGORY_LABELS[c], value: c }))
const ALLERGEN_ITEMS = ALLERGENS.map(a => ({ label: allergenLabel(a), value: a }))
function categoryLabel(c: DrinkCategory) {
  return CATEGORY_LABELS[c]
}

function ordered<T extends Row & { name?: string, label?: string }>(rows: T[] | null | undefined) {
  return [...(rows ?? [])]
    .filter(r => showArchived.value || !r.archivedAt)
    .sort((a, b) => a.position - b.position || (a.name ?? a.label ?? '').localeCompare(b.name ?? b.label ?? '', 'fr'))
}
const drinkRows = computed(() => ordered(drinks.value))
const supplementRows = computed(() => ordered(supplements.value))
const dessertRows = computed(() => ordered(desserts.value))

// ─── Ordre ───
async function move(kind: Kind, list: Row[], index: number, delta: -1 | 1) {
  const live = list.filter(r => !r.archivedAt)
  const from = live.findIndex(r => r.id === list[index]!.id)
  const to = from + delta
  if (from < 0 || to < 0 || to >= live.length) return
  const next = [...live]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item!)
  const ops: Operation[] = next
    .map((r, position) => ({ r, position }))
    .filter(({ r, position }) => r.position !== position)
    .map(({ r, position }) => ({ op: 'update', entity: kind, id: r.id, data: { position } }))
  if (ops.length) await apply('Ordre modifié', ops, { silent: true })
}

// ─── Édition ───
interface Form {
  kind: Kind
  id?: string
  name: string
  volume: string
  category: DrinkCategory
  description: string
  euros: number
  allergens: Allergen[]
  i18n: Tr | null
}
const open = ref(false)
const form = ref<Form>(blank('drink'))

function blank(kind: Kind): Form {
  return { kind, name: '', volume: '', category: 'soft', description: '', euros: kind === 'supplement' ? 1 : 3, allergens: [], i18n: null }
}
function openNew(kind: Kind) {
  form.value = blank(kind)
  open.value = true
}
function openDrink(d: AdminRows['drink']) {
  form.value = { ...blank('drink'), id: d.id, name: d.name, volume: d.volume ?? '', category: d.category, euros: d.priceCents / 100, i18n: (d.i18n as Tr | null) ?? null }
  open.value = true
}
function openSupplement(s: AdminRows['supplement']) {
  form.value = { ...blank('supplement'), id: s.id, name: s.label, euros: s.priceCents / 100, i18n: (s.i18n as Tr | null) ?? null }
  open.value = true
}
function openDessert(d: AdminRows['dessert']) {
  form.value = { ...blank('dessert'), id: d.id, name: d.name, description: d.description ?? '', euros: d.priceCents / 100, allergens: [...d.allergens], i18n: (d.i18n as Tr | null) ?? null }
  open.value = true
}

const TITLES: Record<Kind, [string, string]> = {
  drink: ['Nouvelle boisson', 'Modifier la boisson'],
  supplement: ['Nouveau supplément', 'Modifier le supplément'],
  dessert: ['Nouveau dessert', 'Modifier le dessert'],
}
const valid = computed(() => Boolean(form.value.name.trim() && form.value.euros >= 0))

function nextPosition(kind: Kind) {
  const rows: Row[] = (kind === 'drink' ? drinks.value : kind === 'supplement' ? supplements.value : desserts.value) ?? []
  return rows.length ? Math.max(...rows.map(r => r.position)) + 1 : 0
}

async function save(mode: 'publish' | 'draft') {
  const f = form.value
  const priceCents = Math.round(f.euros * 100)
  const name = f.name.trim()
  const data: Record<string, unknown> = f.kind === 'drink'
    ? { name, volume: f.volume.trim() || null, category: f.category, priceCents, i18n: f.i18n }
    : f.kind === 'supplement'
      ? { label: name, priceCents, i18n: f.i18n }
      : { name, description: f.description.trim() || null, priceCents, allergens: f.allergens, i18n: f.i18n }
  if (!f.id) data.position = nextPosition(f.kind)
  await apply(
    f.id ? `Modifié : ${name}` : `Ajouté : ${name}`,
    [f.id ? { op: 'update', entity: f.kind, id: f.id, data } : { op: 'create', entity: f.kind, data }],
    { mode },
  )
  open.value = false
}

// ─── Archivage ───
const toArchive = ref<{ kind: Kind, id: string, name: string } | null>(null)
const confirmOpen = computed({
  get: () => Boolean(toArchive.value),
  set: (v) => {
    if (!v) toArchive.value = null
  },
})
async function archive() {
  const t = toArchive.value
  if (!t) return
  await apply(`Archivé : ${t.name}`, [{ op: 'archive', entity: t.kind, id: t.id }])
  toArchive.value = null
}
async function restore(kind: Kind, id: string, name: string) {
  await apply(`Restauré : ${name}`, [{ op: 'restore', entity: kind, id }])
}
</script>

<template>
  <AdminPage
    title="Boissons & suppléments"
    description="Les boissons, les suppléments de pizza et leurs prix. L'ordre ici est l'ordre d'affichage sur la carte."
  >
    <template #actions>
      <label class="hidden items-center gap-2 text-sm text-stone-600 sm:flex">
        <USwitch v-model="showArchived" />
        Voir les archives
      </label>
    </template>

    <label class="flex items-center gap-2 text-sm text-stone-600 sm:hidden">
      <USwitch v-model="showArchived" />
      Voir les archives
    </label>

    <div class="grid grid-cols-1 items-start gap-6 xl:grid-cols-2 [&>*]:min-w-0">
      <!-- Boissons -->
      <UCard :ui="{ body: 'p-0 sm:p-0', header: 'flex items-center justify-between gap-2' }">
        <template #header>
          <div>
            <h2 class="font-display text-lg font-semibold tracking-wide">
              Boissons
            </h2>
            <p class="text-xs text-stone-500">
              {{ drinkRows.length }} au total
            </p>
          </div>
          <UButton
            size="sm"
            icon="i-lucide-plus"
            label="Ajouter"
            @click="openNew('drink')"
          />
        </template>

        <div
          v-if="drinksStatus === 'pending'"
          class="space-y-2 p-4"
        >
          <USkeleton
            v-for="n in 4"
            :key="n"
            class="h-12"
          />
        </div>
        <p
          v-else-if="!drinkRows.length"
          class="p-8 text-center text-sm text-stone-500"
        >
          Aucune boisson pour l'instant.
        </p>
        <ul
          v-else
          class="divide-y divide-stone-100"
        >
          <li
            v-for="(d, idx) in drinkRows"
            :key="d.id"
            class="flex items-center gap-2 p-3 sm:gap-3 sm:px-4"
            :class="d.archivedAt && 'bg-stone-50 opacity-70'"
          >
            <div class="flex flex-col">
              <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                icon="i-lucide-chevron-up"
                aria-label="Monter"
                :disabled="idx === 0 || Boolean(d.archivedAt)"
                @click="move('drink', drinkRows, idx, -1)"
              />
              <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                icon="i-lucide-chevron-down"
                aria-label="Descendre"
                :disabled="idx === drinkRows.length - 1 || Boolean(d.archivedAt)"
                @click="move('drink', drinkRows, idx, 1)"
              />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate font-medium">
                {{ d.name }}
                <span
                  v-if="d.volume"
                  class="font-normal text-stone-500"
                >· {{ d.volume }}</span>
              </p>
              <div class="mt-0.5 flex items-center gap-2">
                <UBadge
                  size="sm"
                  color="neutral"
                  variant="subtle"
                  :label="categoryLabel(d.category)"
                />
                <UBadge
                  v-if="d.archivedAt"
                  size="sm"
                  color="neutral"
                  variant="outline"
                  label="archivée"
                />
              </div>
            </div>
            <span class="shrink-0 text-sm font-semibold text-braise-700">{{ euros(d.priceCents) }}</span>
            <div class="flex shrink-0">
              <UButton
                size="sm"
                color="neutral"
                variant="outline"
                icon="i-lucide-pencil"
                aria-label="Modifier"
                @click="openDrink(d)"
              />
              <UButton
                v-if="d.archivedAt"
                size="sm"
                color="neutral"
                variant="ghost"
                icon="i-lucide-archive-restore"
                aria-label="Restaurer"
                @click="restore('drink', d.id, d.name)"
              />
              <UButton
                v-else
                size="sm"
                color="neutral"
                variant="ghost"
                icon="i-lucide-archive"
                aria-label="Archiver"
                @click="toArchive = { kind: 'drink', id: d.id, name: d.name }"
              />
            </div>
          </li>
        </ul>
      </UCard>

      <div class="min-w-0 space-y-6">
        <!-- Suppléments -->
        <UCard :ui="{ body: 'p-0 sm:p-0', header: 'flex items-center justify-between gap-2' }">
          <template #header>
            <div>
              <h2 class="font-display text-lg font-semibold tracking-wide">
                Suppléments
              </h2>
              <p class="text-xs text-stone-500">
                Ce que l'on peut ajouter sur une pizza
              </p>
            </div>
            <UButton
              size="sm"
              icon="i-lucide-plus"
              label="Ajouter"
              @click="openNew('supplement')"
            />
          </template>
          <p
            v-if="!supplementRows.length"
            class="p-8 text-center text-sm text-stone-500"
          >
            Aucun supplément pour l'instant.
          </p>
          <ul
            v-else
            class="divide-y divide-stone-100"
          >
            <li
              v-for="(s, idx) in supplementRows"
              :key="s.id"
              class="flex items-center gap-2 p-3 sm:gap-3 sm:px-4"
              :class="s.archivedAt && 'bg-stone-50 opacity-70'"
            >
              <div class="flex flex-col">
                <UButton
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-chevron-up"
                  aria-label="Monter"
                  :disabled="idx === 0 || Boolean(s.archivedAt)"
                  @click="move('supplement', supplementRows, idx, -1)"
                />
                <UButton
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-chevron-down"
                  aria-label="Descendre"
                  :disabled="idx === supplementRows.length - 1 || Boolean(s.archivedAt)"
                  @click="move('supplement', supplementRows, idx, 1)"
                />
              </div>
              <p class="min-w-0 flex-1 truncate font-medium">
                {{ s.label }}
                <UBadge
                  v-if="s.archivedAt"
                  size="sm"
                  color="neutral"
                  variant="outline"
                  label="archivé"
                />
              </p>
              <span class="shrink-0 text-sm font-semibold text-braise-700">{{ euros(s.priceCents) }}</span>
              <div class="flex shrink-0">
                <UButton
                  size="sm"
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-pencil"
                  aria-label="Modifier"
                  @click="openSupplement(s)"
                />
                <UButton
                  v-if="s.archivedAt"
                  size="sm"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-archive-restore"
                  aria-label="Restaurer"
                  @click="restore('supplement', s.id, s.label)"
                />
                <UButton
                  v-else
                  size="sm"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-archive"
                  aria-label="Archiver"
                  @click="toArchive = { kind: 'supplement', id: s.id, name: s.label }"
                />
              </div>
            </li>
          </ul>
        </UCard>

        <!-- Desserts -->
        <UCard :ui="{ body: 'p-0 sm:p-0', header: 'flex items-center justify-between gap-2' }">
          <template #header>
            <div>
              <h2 class="font-display text-lg font-semibold tracking-wide">
                Desserts
              </h2>
              <p class="text-xs text-stone-500">
                Préparés à l'avance, visibles quand la catégorie est activée
              </p>
            </div>
            <UButton
              size="sm"
              icon="i-lucide-plus"
              label="Ajouter"
              @click="openNew('dessert')"
            />
          </template>
          <div
            v-if="!dessertsEnabled"
            class="m-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"
          >
            <UIcon
              name="i-lucide-eye-off"
              class="mt-0.5 size-4 shrink-0"
            />
            <p>
              La catégorie « Desserts » est désactivée dans les
              <NuxtLink
                to="/atelier/reglages"
                class="font-medium underline"
              >
                Réglages
              </NuxtLink>
              : rien n'est affiché sur le site, mais vous pouvez déjà la préparer.
            </p>
          </div>
          <p
            v-if="!dessertRows.length"
            class="p-6 text-center text-sm text-stone-500"
          >
            Aucun dessert pour l'instant.
          </p>
          <ul
            v-else
            class="divide-y divide-stone-100"
          >
            <li
              v-for="(d, idx) in dessertRows"
              :key="d.id"
              class="flex items-center gap-2 p-3 sm:gap-3 sm:px-4"
              :class="d.archivedAt && 'bg-stone-50 opacity-70'"
            >
              <div class="flex flex-col">
                <UButton
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-chevron-up"
                  aria-label="Monter"
                  :disabled="idx === 0 || Boolean(d.archivedAt)"
                  @click="move('dessert', dessertRows, idx, -1)"
                />
                <UButton
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-chevron-down"
                  aria-label="Descendre"
                  :disabled="idx === dessertRows.length - 1 || Boolean(d.archivedAt)"
                  @click="move('dessert', dessertRows, idx, 1)"
                />
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate font-medium">
                  {{ d.name }}
                </p>
                <p
                  v-if="d.description"
                  class="truncate text-xs text-stone-500"
                >
                  {{ d.description }}
                </p>
              </div>
              <span class="shrink-0 text-sm font-semibold text-braise-700">{{ euros(d.priceCents) }}</span>
              <div class="flex shrink-0">
                <UButton
                  size="sm"
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-pencil"
                  aria-label="Modifier"
                  @click="openDessert(d)"
                />
                <UButton
                  v-if="d.archivedAt"
                  size="sm"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-archive-restore"
                  aria-label="Restaurer"
                  @click="restore('dessert', d.id, d.name)"
                />
                <UButton
                  v-else
                  size="sm"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-archive"
                  aria-label="Archiver"
                  @click="toArchive = { kind: 'dessert', id: d.id, name: d.name }"
                />
              </div>
            </li>
          </ul>
        </UCard>
      </div>
    </div>

    <USlideover
      v-model:open="open"
      :title="TITLES[form.kind][form.id ? 1 : 0]"
      :ui="{ content: 'max-w-md' }"
    >
      <template #body>
        <div class="space-y-5">
          <UFormField
            :label="form.kind === 'supplement' ? 'Libellé' : 'Nom'"
            required
          >
            <UInput
              v-model="form.name"
              class="w-full"
              :placeholder="form.kind === 'drink' ? 'Coca-Cola' : form.kind === 'supplement' ? 'Jambon cru' : 'Tiramisu'"
            />
          </UFormField>

          <template v-if="form.kind === 'drink'">
            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Catégorie">
                <USelect
                  v-model="form.category"
                  :items="CATEGORY_ITEMS"
                  class="w-full"
                />
              </UFormField>
              <UFormField
                label="Contenance"
                help="Ex. 33 cl, 75 cl"
              >
                <UInput
                  v-model="form.volume"
                  class="w-full"
                />
              </UFormField>
            </div>
          </template>

          <template v-if="form.kind === 'dessert'">
            <UFormField label="Description">
              <UTextarea
                v-model="form.description"
                :rows="2"
                autoresize
                class="w-full"
              />
            </UFormField>
            <UFormField label="Allergènes">
              <USelectMenu
                v-model="form.allergens"
                :items="ALLERGEN_ITEMS"
                value-key="value"
                multiple
                placeholder="Aucun"
                class="w-full"
              />
            </UFormField>
          </template>

          <UFormField label="Prix (€)">
            <UInputNumber
              v-model="form.euros"
              :step="0.5"
              :min="0"
              :format-options="{ style: 'currency', currency: 'EUR' }"
              class="w-full"
            />
          </UFormField>

          <AdminTranslationsField
            v-model="form.i18n"
            :fields="form.kind === 'dessert'
              ? [{ key: 'name', label: 'Nom' }, { key: 'description', label: 'Description', multiline: true }]
              : [{ key: form.kind === 'supplement' ? 'label' : 'name', label: form.kind === 'supplement' ? 'Libellé' : 'Nom' }]"
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
      title="Archiver cet élément ?"
      :description="`« ${toArchive?.name} » disparaîtra de la carte, mais vous pourrez le restaurer à tout moment.`"
      confirm-label="Archiver"
      color="warning"
      :loading="pending"
      @confirm="archive"
    />
  </AdminPage>
</template>
