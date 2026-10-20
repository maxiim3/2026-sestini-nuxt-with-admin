<script setup lang="ts">
import { MENU_SECTIONS, type MenuSection } from '~~/shared/domain/constants'
import type { Operation } from '~~/shared/schemas'
import type { EditablePizza } from '~/components/admin/PizzaEditor.vue'

definePageMeta({ layout: 'admin', middleware: 'admin', i18n: false })
useHead({ title: 'La carte · Atelier' })

const { data: menus } = await useFetch('/api/admin/menus', { key: 'admin-menus' })
const { data: pizzas } = await useFetch('/api/admin/pizzas', { key: 'admin-pizzas' })
const { apply, pending } = useAdminWrite()

const SECTION_LABELS: Record<MenuSection, string> = { rouges: 'Les rouges', blanches: 'Les blanches', speciales: 'Les spéciales' }
const STATUS: Record<string, { label: string, color: 'success' | 'neutral' | 'warning' | 'info' }> = {
  active: { label: 'En ligne', color: 'success' },
  draft: { label: 'En préparation', color: 'info' },
  scheduled: { label: 'Programmée', color: 'warning' },
  archived: { label: 'Archivée', color: 'neutral' },
}

const selectedId = ref<string | undefined>(menus.value?.find(m => m.status === 'active')?.id ?? menus.value?.[0]?.id)
const menu = computed(() => menus.value?.find(m => m.id === selectedId.value))
const byId = computed(() => new Map((pizzas.value ?? []).map(p => [p.id, p])))

const sections = computed(() => MENU_SECTIONS.map(section => ({
  section,
  items: (menu.value?.items ?? [])
    .filter(i => i.section === section)
    .sort((a, b) => a.position - b.position)
    .map(i => ({ ...i, pizza: byId.value.get(i.pizzaId)! }))
    .filter(i => i.pizza),
})))

const ingredientNames = computed(() => [...new Set((pizzas.value ?? []).flatMap(p => [...p.avant, ...p.apres].map(i => i.name)))].sort())

// ─── Édition d'une pizza ───
const editorOpen = ref(false)
const editing = ref<EditablePizza | null>(null)
const addTo = ref<{ menuId: string, section: MenuSection, position: number } | null>(null)

function edit(p: NonNullable<typeof pizzas.value>[number]) {
  editing.value = {
    id: p.id,
    slug: p.slug,
    name: p.name,
    baseKind: p.baseKind,
    baseLabel: p.baseLabel,
    priceCents: p.priceCents,
    imageUrl: p.imageUrl,
    extraAllergens: p.extraAllergens,
    avant: p.avant.map(i => i.name),
    apres: p.apres.map(i => i.name),
    i18n: p.i18n ?? null,
  }
  addTo.value = null
  editorOpen.value = true
}

function createIn(section: MenuSection) {
  editing.value = null
  addTo.value = menu.value ? { menuId: menu.value.id, section, position: sections.value.find(s => s.section === section)!.items.length } : null
  editorOpen.value = true
}

// ─── Composition de la carte ───
function itemsPayload(mutate: (items: { pizzaId: string, section: MenuSection, position: number }[]) => void) {
  const items = (menu.value?.items ?? []).map(i => ({ pizzaId: i.pizzaId, section: i.section, position: i.position }))
  mutate(items)
  // Renumérote proprement chaque section
  for (const section of MENU_SECTIONS) {
    items.filter(i => i.section === section).sort((a, b) => a.position - b.position).forEach((i, idx) => (i.position = idx))
  }
  return items
}

async function move(pizzaId: string, delta: -1 | 1) {
  const items = itemsPayload((list) => {
    const item = list.find(i => i.pizzaId === pizzaId)!
    const sibling = list.find(i => i.section === item.section && i.position === item.position + delta)
    if (!sibling) return
    sibling.position = item.position
    item.position += delta
  })
  await apply('Ordre de la carte', [{ op: 'setMenuItems', menuId: menu.value!.id, items }], { silent: true })
}

async function removeFromMenu(pizzaId: string, name: string) {
  const items = itemsPayload(list => list.splice(list.findIndex(i => i.pizzaId === pizzaId), 1))
  await apply(`${name} retirée de la carte`, [{ op: 'setMenuItems', menuId: menu.value!.id, items }])
}

const addExisting = ref<{ section: MenuSection, pizzaId?: string } | null>(null)
const addCandidates = computed(() => {
  const inMenu = new Set(menu.value?.items.map(i => i.pizzaId))
  return (pizzas.value ?? []).filter(p => !inMenu.has(p.id)).map(p => ({
    label: p.name,
    value: p.id,
    suffix: p.archived ? 'archivée' : euros(p.priceCents),
  }))
})
async function confirmAddExisting() {
  if (!addExisting.value?.pizzaId || !menu.value) return
  const { section, pizzaId } = addExisting.value
  const items = itemsPayload(list => list.push({ pizzaId, section, position: 999 }))
  const ops: Operation[] = [{ op: 'setMenuItems', menuId: menu.value.id, items }]
  if (byId.value.get(pizzaId)?.archived) ops.unshift({ op: 'restore', entity: 'pizza', id: pizzaId })
  await apply(`${byId.value.get(pizzaId)?.name} ajoutée à la carte`, ops)
  addExisting.value = null
}

// ─── Cartes ───
const newMenuOpen = ref(false)
const newMenuName = ref('')
async function duplicateMenu() {
  if (!menu.value || !newMenuName.value.trim()) return
  const name = newMenuName.value.trim()
  const slug = name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  await apply(`Nouvelle carte : ${name}`, [
    { op: 'create', entity: 'menu', ref: '$menu', data: { slug, name, status: 'draft', tagline: menu.value.tagline } },
    { op: 'setMenuItems', menuId: '$menu', items: menu.value.items.map(i => ({ pizzaId: i.pizzaId, section: i.section, position: i.position })) },
  ])
  await refreshNuxtData('admin-menus')
  selectedId.value = menus.value?.find(m => m.slug === slug)?.id ?? selectedId.value
  newMenuOpen.value = false
  newMenuName.value = ''
}

async function activate(mode: 'publish' | 'draft') {
  if (!menu.value) return
  await apply(`Mise en ligne de la carte ${menu.value.name}`, [{ op: 'activateMenu', menuId: menu.value.id }], { mode })
}
</script>

<template>
  <AdminPage
    title="La carte"
    description="Composez la carte en ligne, préparez la prochaine saison à l'avance et mettez-la en ligne le jour venu."
  >
    <template #actions>
      <UButton
        icon="i-lucide-copy-plus"
        color="neutral"
        variant="outline"
        label="Préparer une nouvelle carte"
        @click="newMenuOpen = true"
      />
    </template>

    <div class="flex flex-wrap items-center gap-3">
      <USelect
        v-model="selectedId"
        :items="(menus ?? []).map(m => ({ label: `${m.name} · ${STATUS[m.status]?.label}`, value: m.id }))"
        class="min-w-72"
      />
      <UBadge
        v-if="menu"
        :color="STATUS[menu.status]?.color"
        variant="subtle"
        :label="STATUS[menu.status]?.label"
      />
      <UButton
        v-if="menu && menu.status !== 'active'"
        icon="i-lucide-rocket"
        label="Mettre cette carte en ligne"
        :loading="pending"
        @click="activate('publish')"
      />
    </div>

    <section
      v-for="s in sections"
      :key="s.section"
      class="space-y-3"
    >
      <div class="flex items-center justify-between">
        <h2 class="font-display text-lg font-semibold tracking-wide">
          {{ SECTION_LABELS[s.section] }}
          <span class="ml-1 font-sans text-sm font-normal text-stone-500">{{ s.items.length }}</span>
        </h2>
        <div class="flex gap-2">
          <UButton
            size="sm"
            color="neutral"
            variant="ghost"
            icon="i-lucide-list-plus"
            label="Ajouter une pizza existante"
            @click="addExisting = { section: s.section }"
          />
          <UButton
            size="sm"
            variant="soft"
            icon="i-lucide-plus"
            label="Nouvelle pizza"
            @click="createIn(s.section)"
          />
        </div>
      </div>

      <ul class="divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200">
        <li
          v-for="(item, idx) in s.items"
          :key="item.pizzaId"
          class="flex items-start gap-4 bg-white p-4 hover:bg-stone-50"
        >
          <div class="flex flex-col">
            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              icon="i-lucide-chevron-up"
              aria-label="Monter"
              :disabled="idx === 0"
              @click="move(item.pizzaId, -1)"
            />
            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              icon="i-lucide-chevron-down"
              aria-label="Descendre"
              :disabled="idx === s.items.length - 1"
              @click="move(item.pizzaId, 1)"
            />
          </div>
          <div class="min-w-0 flex-1">
            <p class="flex flex-wrap items-baseline gap-x-3">
              <span class="font-semibold">{{ item.pizza.name }}</span>
              <span class="text-sm font-medium text-braise-700">{{ euros(item.pizza.priceCents) }}</span>
              <UBadge
                v-if="item.pizza.tags.vegetarian"
                size="sm"
                color="success"
                variant="subtle"
                label="végé"
              />
            </p>
            <p class="mt-0.5 text-sm text-stone-600">
              <span class="text-braise-700">{{ item.pizza.baseLabel }}</span><template v-if="item.pizza.avant.length">
                · {{ item.pizza.avant.map(i => i.name).join(', ') }}
              </template>
            </p>
            <p
              v-if="item.pizza.apres.length"
              class="text-sm italic text-stone-500"
            >
              Après cuisson : {{ item.pizza.apres.map(i => i.name).join(', ') }}
            </p>
            <p class="mt-1 text-xs text-stone-400">
              {{ item.pizza.allergens.map(a => allergenLabel(a)).join(' · ') }}
            </p>
          </div>
          <div class="flex shrink-0 gap-1">
            <UButton
              size="sm"
              color="neutral"
              variant="outline"
              icon="i-lucide-pencil"
              label="Modifier"
              @click="edit(item.pizza)"
            />
            <UButton
              size="sm"
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              aria-label="Retirer de la carte"
              @click="removeFromMenu(item.pizzaId, item.pizza.name)"
            />
          </div>
        </li>
        <li
          v-if="!s.items.length"
          class="p-6 text-center text-sm text-stone-500"
        >
          Aucune pizza dans cette section.
        </li>
      </ul>
    </section>

    <AdminPizzaEditor
      v-model:open="editorOpen"
      :pizza="editing"
      :add-to="addTo"
      :ingredient-names="ingredientNames"
    />

    <UModal
      :open="Boolean(addExisting)"
      title="Ajouter une pizza existante"
      description="Les pizzas archivées (anciennes cartes) peuvent être remises à la carte."
      @update:open="v => !v && (addExisting = null)"
    >
      <template #body>
        <USelectMenu
          v-if="addExisting"
          v-model="addExisting.pizzaId"
          :items="addCandidates"
          value-key="value"
          placeholder="Choisir une pizza"
          class="w-full"
        />
      </template>
      <template #footer>
        <UButton
          label="Ajouter"
          :disabled="!addExisting?.pizzaId"
          :loading="pending"
          @click="confirmAddExisting"
        />
      </template>
    </UModal>

    <UModal
      v-model:open="newMenuOpen"
      title="Préparer une nouvelle carte"
      :description="`Copie de « ${menu?.name} », en préparation. Elle ne sera visible qu'une fois mise en ligne.`"
    >
      <template #body>
        <UFormField label="Nom de la carte">
          <UInput
            v-model="newMenuName"
            placeholder="Printemps-Été 2027"
            class="w-full"
          />
        </UFormField>
      </template>
      <template #footer>
        <UButton
          label="Créer la carte"
          :disabled="!newMenuName.trim()"
          :loading="pending"
          @click="duplicateMenu"
        />
      </template>
    </UModal>
  </AdminPage>
</template>
