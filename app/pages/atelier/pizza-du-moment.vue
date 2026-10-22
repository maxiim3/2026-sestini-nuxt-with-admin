<script setup lang="ts">
import { BASE_KINDS, type BaseKind } from '~~/shared/domain/constants'
import { isoDateInParis, addDays } from '~~/shared/domain/dates'
import { slugify } from '~~/shared/domain/text'
import type { Operation } from '~~/shared/schemas'

definePageMeta({ layout: 'admin', middleware: 'admin', i18n: false })
useHead({ title: 'Pizza du moment · Atelier' })

type Tr = Partial<Record<'en' | 'es' | 'it', Record<string, string>>>

const { data: featured, status: featuredStatus } = await useAdminEntity('featured')
const { data: pizzas } = await useFetch('/api/admin/pizzas', { key: 'admin-pizzas' })
const { apply, pending } = useAdminWrite()

const today = isoDateInParis()
const byId = computed(() => new Map((pizzas.value ?? []).map(p => [p.id, p])))

type Featured = NonNullable<typeof featured.value>[number]

function timing(f: Featured): 'current' | 'scheduled' | 'ended' {
  if (f.startsOn && f.startsOn > today) return 'scheduled'
  if (f.endsOn && f.endsOn < today) return 'ended'
  return 'current'
}
const TIMING = {
  current: { label: 'En ce moment', color: 'success' as const },
  scheduled: { label: 'Programmée', color: 'info' as const },
  ended: { label: 'Terminée', color: 'neutral' as const },
}

const live = computed(() => (featured.value ?? [])
  .filter(f => !f.archivedAt)
  .map(f => ({ ...f, pizza: byId.value.get(f.pizzaId), timing: timing(f) }))
  .sort((a, b) => b.priority - a.priority || (b.startsOn ?? '').localeCompare(a.startsOn ?? '')))
const archives = computed(() => (featured.value ?? [])
  .filter(f => f.archivedAt)
  .map(f => ({ ...f, pizza: byId.value.get(f.pizzaId) }))
  .sort((a, b) => (b.archivedAt ?? '').localeCompare(a.archivedAt ?? '')))

function period(f: { startsOn: string | null, endsOn: string | null }) {
  if (f.startsOn && f.endsOn) return `Du ${dateFr(f.startsOn)} au ${dateFr(f.endsOn)}`
  if (f.startsOn) return `À partir du ${dateFr(f.startsOn)}`
  if (f.endsOn) return `Jusqu'au ${dateFr(f.endsOn)}`
  return 'Sans limite de dates'
}

// ─── Édition ───
interface Form {
  id?: string
  source: 'existing' | 'new'
  pizzaId?: string
  fresh: { name: string, baseKind: BaseKind, baseLabel: string, euros: number, avant: string[], apres: string[] }
  title: string
  pitch: string
  startsOn: string
  endsOn: string
  showOnHome: boolean
  showOnMenu: boolean
  showInModal: boolean
  priority: number
  i18n: Tr | null
}

const BASE_LABELS: Record<BaseKind, string> = { tomate: 'Sauce tomate', creme: 'Crème fraîche', speciale: 'Base spéciale', sans: 'Sans base' }

function blank(): Form {
  return {
    source: 'existing',
    fresh: { name: '', baseKind: 'creme', baseLabel: 'Crème fraîche', euros: 16, avant: ['Mozzarella Fior di Latte'], apres: [] },
    title: 'La Pizza du Moment',
    pitch: '',
    startsOn: '',
    endsOn: '',
    showOnHome: true,
    showOnMenu: true,
    showInModal: false,
    priority: 0,
    i18n: null,
  }
}

const open = ref(false)
const form = ref<Form>(blank())

function openNew() {
  form.value = blank()
  open.value = true
}
function openEdit(f: Featured) {
  form.value = {
    ...blank(),
    id: f.id,
    pizzaId: f.pizzaId,
    title: f.title,
    pitch: f.pitch ?? '',
    startsOn: f.startsOn ?? '',
    endsOn: f.endsOn ?? '',
    showOnHome: f.showOnHome,
    showOnMenu: f.showOnMenu,
    showInModal: f.showInModal,
    priority: f.priority,
    i18n: (f.i18n as Tr | null) ?? null,
  }
  open.value = true
}
function reuse(f: Featured) {
  openEdit(f)
  form.value.id = undefined
  form.value.startsOn = ''
  form.value.endsOn = ''
}

watch(() => form.value.fresh.baseKind, (kind, old) => {
  if (old && form.value.fresh.baseLabel === BASE_LABELS[old]) form.value.fresh.baseLabel = BASE_LABELS[kind]
})

const pizzaItems = computed(() => (pizzas.value ?? []).map(p => ({
  label: p.archived ? `${p.name} (archivée)` : p.name,
  value: p.id,
})))

const datesInvalid = computed(() => Boolean(form.value.startsOn && form.value.endsOn && form.value.startsOn > form.value.endsOn))
const valid = computed(() => {
  const f = form.value
  if (!f.title.trim() || datesInvalid.value) return false
  if (f.id || f.source === 'existing') return Boolean(f.pizzaId)
  return Boolean(f.fresh.name.trim() && f.fresh.baseLabel.trim() && f.fresh.euros > 0)
})

async function save(mode: 'publish' | 'draft') {
  const f = form.value
  const ops: Operation[] = []
  let pizzaRef = f.pizzaId ?? ''
  let pizzaName = byId.value.get(pizzaRef)?.name ?? ''

  if (!f.id && f.source === 'new') {
    const name = f.fresh.name.trim()
    const taken = new Set((pizzas.value ?? []).map(p => p.slug))
    let slug = slugify(name)
    if (taken.has(slug)) slug = `${slug}-${today}`
    ops.push({
      op: 'create',
      entity: 'pizza',
      ref: '$p',
      data: { slug, name, baseKind: f.fresh.baseKind, baseLabel: f.fresh.baseLabel.trim(), priceCents: Math.round(f.fresh.euros * 100), extraAllergens: [] },
    })
    ops.push({ op: 'setPizzaIngredients', pizzaId: '$p', avant: f.fresh.avant, apres: f.fresh.apres })
    pizzaRef = '$p'
    pizzaName = name
  }
  else if (byId.value.get(pizzaRef)?.archived) {
    ops.push({ op: 'restore', entity: 'pizza', id: pizzaRef })
  }

  const data = {
    pizzaId: pizzaRef,
    title: f.title.trim(),
    pitch: f.pitch.trim() || null,
    startsOn: f.startsOn || null,
    endsOn: f.endsOn || null,
    showOnHome: f.showOnHome,
    showOnMenu: f.showOnMenu,
    showInModal: f.showInModal,
    priority: f.priority,
    i18n: f.i18n,
  }
  ops.push(f.id
    ? { op: 'update', entity: 'featured', id: f.id, data }
    : { op: 'create', entity: 'featured', data })

  await apply(f.id ? `Pizza du moment modifiée : ${pizzaName}` : `Nouvelle pizza du moment : ${pizzaName}`, ops, { mode })
  open.value = false
}

async function toggle(f: Featured, key: 'showOnHome' | 'showOnMenu' | 'showInModal', value: boolean) {
  await apply(`Pizza du moment : ${key === 'showOnHome' ? 'accueil' : key === 'showOnMenu' ? 'carte' : 'bandeau'}`, [
    { op: 'update', entity: 'featured', id: f.id, data: { [key]: value } },
  ], { silent: true })
}

// ─── Archivage ───
const toArchive = ref<(Featured & { pizza?: { name: string } }) | null>(null)
const confirmOpen = computed({
  get: () => Boolean(toArchive.value),
  set: (v) => {
    if (!v) toArchive.value = null
  },
})
async function archive() {
  const f = toArchive.value
  if (!f) return
  await apply(`Pizza du moment archivée : ${f.pizza?.name ?? f.title}`, [{ op: 'archive', entity: 'featured', id: f.id }])
  toArchive.value = null
}

const stopAt = addDays(today, -1)
async function endNow(f: Featured) {
  await apply('Pizza du moment terminée', [{ op: 'update', entity: 'featured', id: f.id, data: { endsOn: stopAt } }])
}
</script>

<template>
  <AdminPage
    title="Pizza du moment"
    description="Mettez une pizza en avant sur l'accueil, la carte ou dans le bandeau du site, pour les dates de votre choix."
  >
    <template #actions>
      <UButton
        icon="i-lucide-plus"
        label="Nouvelle pizza du moment"
        @click="openNew"
      />
    </template>

    <section class="space-y-3">
      <h2 class="font-display text-lg font-semibold tracking-wide">
        En cours et à venir
        <span class="ml-1 font-sans text-sm font-normal text-stone-500">{{ live.length }}</span>
      </h2>

      <div
        v-if="featuredStatus === 'pending'"
        class="grid gap-4 lg:grid-cols-2"
      >
        <USkeleton
          v-for="n in 2"
          :key="n"
          class="h-48"
        />
      </div>

      <div
        v-else-if="!live.length"
        class="rounded-xl border border-dashed border-stone-300 p-8 text-center"
      >
        <UIcon
          name="i-lucide-flame"
          class="mx-auto size-8 text-stone-400"
        />
        <p class="mt-2 font-medium">
          Aucune pizza du moment pour l'instant
        </p>
        <p class="mt-1 text-sm text-stone-500">
          Choisissez une pizza de la carte, ou inventez-en une nouvelle.
        </p>
        <UButton
          class="mt-4"
          icon="i-lucide-plus"
          label="Ajouter une pizza du moment"
          @click="openNew"
        />
      </div>

      <div
        v-else
        class="grid gap-4 lg:grid-cols-2"
      >
        <UCard
          v-for="f in live"
          :key="f.id"
          :ui="{ body: 'space-y-4' }"
        >
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="text-xs font-semibold uppercase tracking-wider text-braise-700">
                {{ f.title }}
              </p>
              <h3 class="font-display text-xl font-semibold">
                {{ f.pizza?.name ?? 'Pizza introuvable' }}
                <span
                  v-if="f.pizza"
                  class="ml-1 font-sans text-base font-medium text-stone-600"
                >{{ euros(f.pizza.priceCents) }}</span>
              </h3>
            </div>
            <UBadge
              :color="TIMING[f.timing].color"
              variant="subtle"
              :label="TIMING[f.timing].label"
            />
          </div>

          <p
            v-if="f.pizza"
            class="text-sm text-stone-600"
          >
            <span class="text-braise-700">{{ f.pizza.baseLabel }}</span><template v-if="f.pizza.avant.length">
              · {{ f.pizza.avant.map(i => i.name).join(', ') }}
            </template>
            <template v-if="f.pizza.apres.length">
              <span class="italic"> — après cuisson : {{ f.pizza.apres.map(i => i.name).join(', ') }}</span>
            </template>
          </p>
          <p
            v-if="f.pizza?.archived"
            class="flex items-center gap-1.5 text-sm text-amber-700"
          >
            <UIcon
              name="i-lucide-triangle-alert"
              class="size-4"
            />
            Cette pizza est archivée : elle sera remise en service à l'enregistrement.
          </p>
          <p
            v-if="f.pitch"
            class="rounded-lg bg-stone-50 p-3 text-sm italic text-stone-700"
          >
            « {{ f.pitch }} »
          </p>
          <p class="flex items-center gap-1.5 text-sm text-stone-600">
            <UIcon
              name="i-lucide-calendar-range"
              class="size-4 text-stone-400"
            />
            {{ period(f) }}
          </p>

          <div class="grid gap-2 sm:grid-cols-3">
            <label class="flex items-center justify-between gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm">
              Accueil
              <USwitch
                :model-value="f.showOnHome"
                @update:model-value="v => toggle(f, 'showOnHome', v)"
              />
            </label>
            <label class="flex items-center justify-between gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm">
              Carte
              <USwitch
                :model-value="f.showOnMenu"
                @update:model-value="v => toggle(f, 'showOnMenu', v)"
              />
            </label>
            <label class="flex items-center justify-between gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm">
              Bandeau
              <USwitch
                :model-value="f.showInModal"
                @update:model-value="v => toggle(f, 'showInModal', v)"
              />
            </label>
          </div>
          <template #footer>
            <div class="flex flex-wrap justify-end gap-1">
              <UButton
                size="sm"
                color="neutral"
                variant="outline"
                icon="i-lucide-pencil"
                label="Modifier"
                @click="openEdit(f)"
              />
              <UButton
                v-if="f.timing === 'current'"
                size="sm"
                color="neutral"
                variant="ghost"
                icon="i-lucide-circle-stop"
                label="Terminer"
                @click="endNow(f)"
              />
              <UButton
                size="sm"
                color="neutral"
                variant="ghost"
                icon="i-lucide-archive"
                label="Archiver"
                @click="toArchive = f"
              />
            </div>
          </template>
        </UCard>
      </div>
    </section>

    <section class="space-y-3">
      <h2 class="font-display text-lg font-semibold tracking-wide">
        Archives
        <span class="ml-1 font-sans text-sm font-normal text-stone-500">{{ archives.length }}</span>
      </h2>
      <p class="-mt-1 text-sm text-stone-500">
        Les pizzas du moment passées servent de modèles : « Réutiliser » reprend le texte et les réglages, vous choisissez les nouvelles dates.
      </p>
      <p
        v-if="!archives.length"
        class="rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500"
      >
        Rien dans les archives pour l'instant.
      </p>
      <ul
        v-else
        class="divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200"
      >
        <li
          v-for="f in archives"
          :key="f.id"
          class="flex flex-wrap items-center justify-between gap-3 bg-white p-4"
        >
          <div class="min-w-0">
            <p class="font-semibold">
              {{ f.pizza?.name ?? 'Pizza supprimée' }}
              <UBadge
                v-if="f.pizza?.archived"
                class="ml-1"
                size="sm"
                color="neutral"
                variant="subtle"
                label="pizza archivée"
              />
            </p>
            <p class="text-sm text-stone-500">
              {{ period(f) }}<template v-if="f.pitch">
                · « {{ f.pitch }} »
              </template>
            </p>
          </div>
          <UButton
            size="sm"
            color="neutral"
            variant="outline"
            icon="i-lucide-rotate-ccw"
            label="Réutiliser"
            :disabled="!f.pizza"
            @click="reuse(f)"
          />
        </li>
      </ul>
    </section>

    <USlideover
      v-model:open="open"
      :title="form.id ? 'Modifier la pizza du moment' : 'Nouvelle pizza du moment'"
      description="Choisissez la pizza, le texte et les dates. Sans dates, elle reste en avant jusqu'à ce que vous l'archiviez."
      :ui="{ content: 'sm:max-w-xl' }"
    >
      <template #body>
        <div class="space-y-5">
          <UTabs
            v-if="!form.id"
            v-model="form.source"
            :items="[
              { label: 'Pizza existante', value: 'existing', icon: 'i-lucide-pizza' },
              { label: 'Nouvelle pizza', value: 'new', icon: 'i-lucide-sparkles' },
            ]"
            :content="false"
            class="w-full"
          />

          <UFormField
            v-if="form.id || form.source === 'existing'"
            label="Pizza"
            help="Les pizzas archivées sont proposées : elles seront remises en service."
            required
          >
            <USelectMenu
              v-model="form.pizzaId"
              :items="pizzaItems"
              value-key="value"
              placeholder="Choisir une pizza"
              class="w-full"
            />
          </UFormField>

          <template v-else>
            <UFormField
              label="Nom de la pizza"
              required
            >
              <UInput
                v-model="form.fresh.name"
                placeholder="La Châtaigne"
                class="w-full"
              />
            </UFormField>
            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Base">
                <USelect
                  v-model="form.fresh.baseKind"
                  :items="BASE_KINDS.map(b => ({ label: BASE_LABELS[b], value: b }))"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Prix (€)">
                <UInputNumber
                  v-model="form.fresh.euros"
                  :step="0.5"
                  :min="0"
                  :format-options="{ style: 'currency', currency: 'EUR' }"
                  class="w-full"
                />
              </UFormField>
            </div>
            <UFormField label="Libellé de la base">
              <UInput
                v-model="form.fresh.baseLabel"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Avant cuisson"
              help="Entrée pour ajouter. Un ingrédient inconnu est créé automatiquement."
            >
              <UInputTags
                v-model="form.fresh.avant"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Après cuisson">
              <UInputTags
                v-model="form.fresh.apres"
                class="w-full"
              />
            </UFormField>
          </template>

          <USeparator />

          <UFormField
            label="Titre de l'encart"
            required
          >
            <UInput
              v-model="form.title"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Accroche"
            help="Une phrase qui donne envie."
          >
            <UTextarea
              v-model="form.pitch"
              :rows="3"
              autoresize
              class="w-full"
              placeholder="Crème de châtaigne, lard fumé, noisettes torréfiées : l'automne sur une pizza."
            />
          </UFormField>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Du">
              <UInput
                v-model="form.startsOn"
                type="date"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Au (inclus)"
              :error="datesInvalid ? 'La fin précède le début' : undefined"
            >
              <UInput
                v-model="form.endsOn"
                type="date"
                class="w-full"
              />
            </UFormField>
          </div>

          <div class="space-y-2">
            <p class="text-sm font-medium">
              Où l'afficher ?
            </p>
            <label class="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2 text-sm">
              Sur l'accueil
              <USwitch v-model="form.showOnHome" />
            </label>
            <label class="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2 text-sm">
              Sur la carte
              <USwitch v-model="form.showOnMenu" />
            </label>
            <label class="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2 text-sm">
              Dans le bandeau du site
              <USwitch v-model="form.showInModal" />
            </label>
          </div>

          <UFormField
            label="Priorité"
            help="Si plusieurs pizzas sont en avant, la plus haute passe en premier."
          >
            <UInputNumber
              v-model="form.priority"
              class="w-32"
            />
          </UFormField>

          <AdminTranslationsField
            v-model="form.i18n"
            :fields="[{ key: 'title', label: 'Titre' }, { key: 'pitch', label: 'Accroche', multiline: true }]"
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
      title="Archiver cette pizza du moment ?"
      description="Elle ne sera plus affichée sur le site mais restera dans les archives, réutilisable à tout moment."
      confirm-label="Archiver"
      color="warning"
      :loading="pending"
      @confirm="archive"
    />
  </AdminPage>
</template>
