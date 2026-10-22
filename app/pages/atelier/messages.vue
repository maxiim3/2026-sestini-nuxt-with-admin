<script setup lang="ts">
import { MODAL_KINDS, type ModalKind } from '~~/shared/domain/constants'
import { pickModalMessage } from '~~/shared/domain/modal'
import type { AdminRows } from '../../composables/useAdminEntity'

definePageMeta({ layout: 'admin', middleware: 'admin', i18n: false })
useHead({ title: 'Messages · Atelier' })

type Tr = Partial<Record<'en' | 'es' | 'it', Record<string, string>>>
type Message = AdminRows['modalMessage']
type Cta = { label: string, href: string, variant?: 'primary' | 'secondary' }

const { data: messages, status } = await useAdminEntity('modalMessage')
const { apply, pending } = useAdminWrite()

const KINDS: Record<ModalKind, { label: string, icon: string }> = {
  menu: { label: 'Nouvelle carte', icon: 'i-lucide-book-open' },
  featured: { label: 'Pizza du moment', icon: 'i-lucide-flame' },
  closure: { label: 'Fermeture', icon: 'i-lucide-door-closed' },
  event: { label: 'Événement', icon: 'i-lucide-party-popper' },
  info: { label: 'Information', icon: 'i-lucide-info' },
}
const KIND_ITEMS = MODAL_KINDS.map(k => ({ label: KINDS[k].label, value: k }))

// ─── Statuts ───
const now = ref(new Date().toISOString())
const live = computed(() => (messages.value ?? []).filter(m => !m.archivedAt))
const archived = computed(() => (messages.value ?? []).filter(m => m.archivedAt))
const shownId = computed(() => pickModalMessage(live.value, now.value)?.id)

type StatusKey = 'active' | 'waiting' | 'scheduled' | 'expired' | 'disabled'
const STATUS: Record<StatusKey, { label: string, color: 'success' | 'warning' | 'info' | 'neutral' }> = {
  active: { label: 'Actif maintenant', color: 'success' },
  waiting: { label: 'Dans sa période, mais une autre est prioritaire', color: 'warning' },
  scheduled: { label: 'Programmé', color: 'info' },
  expired: { label: 'Expiré', color: 'neutral' },
  disabled: { label: 'Désactivé', color: 'neutral' },
}
function statusOf(m: Message): StatusKey {
  if (!m.enabled) return 'disabled'
  if (m.endsAt && now.value >= m.endsAt) return 'expired'
  if (m.startsAt && m.startsAt > now.value) return 'scheduled'
  return m.id === shownId.value ? 'active' : 'waiting'
}
const ORDER: Record<StatusKey, number> = { active: 0, waiting: 1, scheduled: 2, disabled: 3, expired: 4 }
const rows = computed(() => live.value
  .map(m => ({ ...m, status: statusOf(m) }))
  .sort((a, b) => ORDER[a.status] - ORDER[b.status] || b.priority - a.priority || b.updatedAt.localeCompare(a.updatedAt)))

function period(m: { startsAt: string | null, endsAt: string | null }) {
  if (m.startsAt && m.endsAt) return `Du ${dateTimeFr(m.startsAt)} au ${dateTimeFr(m.endsAt)}`
  if (m.startsAt) return `À partir du ${dateTimeFr(m.startsAt)}`
  if (m.endsAt) return `Jusqu'au ${dateTimeFr(m.endsAt)}`
  return 'Sans limite de dates'
}

// ─── Modèles rapides ───
const TEMPLATES: { label: string, icon: string, form: Partial<Form> }[] = [
  {
    label: 'Fermeture exceptionnelle',
    icon: 'i-lucide-door-closed',
    form: {
      kind: 'closure',
      title: 'Fermeture exceptionnelle',
      body: 'Le camion ne sera pas là **[date]**.\n\nMerci de votre compréhension, nous vous retrouvons très vite !',
      priority: 20,
      ctas: [{ label: 'Voir les horaires', href: '/nous-trouver', variant: 'primary' }],
    },
  },
  {
    label: 'Vacances',
    icon: 'i-lucide-sun',
    form: {
      kind: 'closure',
      title: 'Nous partons en vacances',
      body: 'Le camion fait une pause du **[date]** au **[date]**.\n\nRendez-vous à notre retour pour de nouvelles pizzas au feu de bois !',
      priority: 15,
      ctas: [{ label: 'Voir les horaires', href: '/nous-trouver', variant: 'primary' }],
    },
  },
  {
    label: 'Nouvelle carte',
    icon: 'i-lucide-book-open',
    form: {
      kind: 'menu',
      title: 'Découvrez la nouvelle carte !',
      body: 'Une **toute nouvelle carte**, faite maison, pour accompagner [la saison].\n\nRetrouvez toutes nos pizzas, rouges, blanches et spéciales.',
      priority: 10,
      ctas: [{ label: 'Voir la carte', href: '/la-carte', variant: 'primary' }, { label: 'Nous trouver', href: '/nous-trouver', variant: 'secondary' }],
    },
  },
  {
    label: 'Événement',
    icon: 'i-lucide-party-popper',
    form: {
      kind: 'event',
      title: 'Retrouvez-nous à [lieu]',
      body: '**[Date]** : le camion s\'installe à **[lieu]**.\n\nCarte réduite, commande par téléphone ou au camion.',
      priority: 12,
      ctas: [{ label: 'Nous trouver', href: '/nous-trouver', variant: 'primary' }, { label: 'Appeler', href: 'tel:', variant: 'secondary' }],
    },
  },
]

// ─── Édition ───
interface Form {
  id?: string
  kind: ModalKind
  title: string
  body: string
  imageUrl: string
  ctas: Cta[]
  startsAt: string
  endsAt: string
  priority: number
  enabled: boolean
  i18n: Tr | null
}
function blank(): Form {
  return { kind: 'info', title: '', body: '', imageUrl: '', ctas: [], startsAt: '', endsAt: '', priority: 0, enabled: true, i18n: null }
}
const open = ref(false)
const form = ref<Form>(blank())

function openNew(template?: Partial<Form>) {
  form.value = { ...blank(), ...structuredClone(template ?? {}) }
  open.value = true
}
function fromMessage(m: Message): Form {
  return {
    id: m.id,
    kind: m.kind,
    title: m.title,
    body: m.body,
    imageUrl: m.imageUrl ?? '',
    ctas: m.ctas.map(c => ({ ...c })),
    startsAt: isoToParisInput(m.startsAt),
    endsAt: isoToParisInput(m.endsAt),
    priority: m.priority,
    enabled: m.enabled,
    i18n: (m.i18n as Tr | null) ?? null,
  }
}
function openEdit(m: Message) {
  form.value = fromMessage(m)
  open.value = true
}
function reuse(m: Message) {
  form.value = { ...fromMessage(m), id: undefined, startsAt: '', endsAt: '', enabled: true }
  open.value = true
}

function addCta(href = '') {
  form.value.ctas.push({ label: '', href, variant: form.value.ctas.length ? 'secondary' : 'primary' })
}
function removeCta(i: number) {
  form.value.ctas.splice(i, 1)
}
const HREF_SUGGESTIONS = [
  { label: 'La carte', href: '/la-carte' },
  { label: 'Nous trouver', href: '/nous-trouver' },
  { label: 'Appeler', href: 'tel:' },
]
function applySuggestion(i: number, s: { label: string, href: string }) {
  const cta = form.value.ctas[i]!
  cta.href = s.href
  if (!cta.label) cta.label = s.label
}

const cleanCtas = computed(() => form.value.ctas.filter(c => c.label.trim() && c.href.trim()))
const datesInvalid = computed(() => {
  const start = parisInputToIso(form.value.startsAt)
  const end = parisInputToIso(form.value.endsAt)
  return Boolean(start && end && start >= end)
})
const valid = computed(() => Boolean(form.value.title.trim() && form.value.body.trim() && !datesInvalid.value))
const previewCtas = computed(() => cleanCtas.value.length ? cleanCtas.value : form.value.ctas)

async function save(mode: 'publish' | 'draft') {
  const f = form.value
  const data = {
    kind: f.kind,
    title: f.title.trim(),
    body: f.body.trim(),
    imageUrl: f.imageUrl.trim() || null,
    ctas: cleanCtas.value.map(c => ({ label: c.label.trim(), href: c.href.trim(), variant: c.variant ?? 'primary' })),
    startsAt: parisInputToIso(f.startsAt),
    endsAt: parisInputToIso(f.endsAt),
    priority: f.priority,
    enabled: f.enabled,
    i18n: f.i18n,
  }
  await apply(
    f.id ? `Message modifié : ${data.title}` : `Nouveau message : ${data.title}`,
    [f.id ? { op: 'update', entity: 'modalMessage', id: f.id, data } : { op: 'create', entity: 'modalMessage', data }],
    { mode },
  )
  now.value = new Date().toISOString()
  open.value = false
}

async function toggle(m: Message, enabled: boolean) {
  await apply(`Message ${enabled ? 'activé' : 'désactivé'} : ${m.title}`, [{ op: 'update', entity: 'modalMessage', id: m.id, data: { enabled } }], { silent: true })
  now.value = new Date().toISOString()
}

// ─── Archivage ───
const toArchive = ref<Message | null>(null)
const confirmOpen = computed({
  get: () => Boolean(toArchive.value),
  set: (v) => {
    if (!v) toArchive.value = null
  },
})
async function archive() {
  const m = toArchive.value
  if (!m) return
  await apply(`Message archivé : ${m.title}`, [{ op: 'archive', entity: 'modalMessage', id: m.id }])
  toArchive.value = null
}
async function restore(m: Message) {
  await apply(`Message restauré : ${m.title}`, [{ op: 'restore', entity: 'modalMessage', id: m.id }])
}
</script>

<template>
  <AdminPage
    title="Messages"
    description="Le bandeau affiché sous l'en-tête du site : fermeture, nouvelle carte, événement… Un seul message s'affiche à la fois, le plus prioritaire."
  >
    <template #actions>
      <UButton
        icon="i-lucide-plus"
        label="Nouveau message"
        @click="openNew()"
      />
    </template>

    <section class="space-y-3">
      <h2 class="font-display text-lg font-semibold tracking-wide">
        Démarrer à partir d'un modèle
      </h2>
      <div class="flex flex-wrap gap-2">
        <UButton
          v-for="t in TEMPLATES"
          :key="t.label"
          color="neutral"
          variant="outline"
          :icon="t.icon"
          :label="t.label"
          @click="openNew(t.form)"
        />
      </div>
    </section>

    <section class="space-y-3">
      <h2 class="font-display text-lg font-semibold tracking-wide">
        Vos messages
        <span class="ml-1 font-sans text-sm font-normal text-stone-500">{{ rows.length }}</span>
      </h2>

      <div
        v-if="status === 'pending'"
        class="space-y-2"
      >
        <USkeleton
          v-for="n in 3"
          :key="n"
          class="h-20"
        />
      </div>
      <div
        v-else-if="!rows.length"
        class="rounded-xl border border-dashed border-stone-300 p-8 text-center"
      >
        <UIcon
          name="i-lucide-megaphone"
          class="mx-auto size-8 text-stone-400"
        />
        <p class="mt-2 font-medium">
          Aucun message pour l'instant
        </p>
        <p class="mt-1 text-sm text-stone-500">
          Choisissez un modèle ci-dessus pour écrire le premier.
        </p>
      </div>
      <ul
        v-else
        class="divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200"
      >
        <li
          v-for="m in rows"
          :key="m.id"
          class="flex flex-wrap items-start gap-3 bg-white p-4"
          :class="(m.status === 'expired' || m.status === 'disabled') && 'bg-stone-50'"
        >
          <UIcon
            :name="KINDS[m.kind].icon"
            class="mt-1 size-5 shrink-0 text-stone-500"
          />
          <div class="min-w-0 flex-1 space-y-1">
            <p class="font-semibold">
              {{ m.title }}
            </p>
            <div class="flex flex-wrap items-center gap-1.5">
              <UBadge
                :color="STATUS[m.status].color"
                variant="subtle"
                :label="STATUS[m.status].label"
              />
              <UBadge
                color="neutral"
                variant="outline"
                :label="KINDS[m.kind].label"
              />
              <UBadge
                color="neutral"
                variant="outline"
                :label="`priorité ${m.priority}`"
              />
            </div>
            <p class="text-sm text-stone-500">
              {{ period(m) }}
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-1">
            <USwitch
              :model-value="m.enabled"
              :aria-label="m.enabled ? 'Désactiver' : 'Activer'"
              @update:model-value="v => toggle(m, v)"
            />
            <UButton
              size="sm"
              color="neutral"
              variant="outline"
              icon="i-lucide-pencil"
              aria-label="Modifier"
              @click="openEdit(m)"
            />
            <UButton
              size="sm"
              color="neutral"
              variant="ghost"
              icon="i-lucide-archive"
              aria-label="Archiver"
              @click="toArchive = m"
            />
          </div>
        </li>
      </ul>
    </section>

    <UCollapsible v-if="archived.length">
      <UButton
        color="neutral"
        variant="ghost"
        trailing-icon="i-lucide-chevron-down"
        :label="`Archives (${archived.length})`"
      />
      <template #content>
        <ul class="mt-2 divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200">
          <li
            v-for="m in archived"
            :key="m.id"
            class="flex flex-wrap items-center justify-between gap-3 bg-white p-3"
          >
            <span class="text-sm">
              <span class="font-medium">{{ m.title }}</span>
              <span class="text-stone-500"> · {{ KINDS[m.kind].label }}</span>
            </span>
            <span class="flex gap-1">
              <UButton
                size="sm"
                color="neutral"
                variant="outline"
                icon="i-lucide-rotate-ccw"
                label="Réutiliser"
                @click="reuse(m)"
              />
              <UButton
                size="sm"
                color="neutral"
                variant="ghost"
                icon="i-lucide-archive-restore"
                label="Restaurer"
                @click="restore(m)"
              />
            </span>
          </li>
        </ul>
      </template>
    </UCollapsible>

    <USlideover
      v-model:open="open"
      :title="form.id ? 'Modifier le message' : 'Nouveau message'"
      description="L'aperçu montre le bandeau tel que vos visiteurs le verront."
      :ui="{ content: 'sm:max-w-5xl' }"
    >
      <template #body>
        <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
          <div class="min-w-0 space-y-5">
            <UFormField label="Type">
              <USelect
                v-model="form.kind"
                :items="KIND_ITEMS"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Titre"
              required
            >
              <UInput
                v-model="form.title"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Texte"
              required
              help="Séparez les paragraphes par une ligne vide. Entourez un mot de **deux étoiles** pour le mettre en gras."
            >
              <UTextarea
                v-model="form.body"
                :rows="6"
                autoresize
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Image"
              help="Facultatif."
            >
              <AdminMediaPicker
                :model-value="form.imageUrl || null"
                tag="message"
                @update:model-value="v => form.imageUrl = v ?? ''"
              />
            </UFormField>

            <div class="space-y-3">
              <p class="text-sm font-medium">
                Boutons
              </p>
              <div
                v-for="(cta, i) in form.ctas"
                :key="i"
                class="space-y-2 rounded-lg border border-stone-200 p-3"
              >
                <div class="grid gap-2 sm:grid-cols-2">
                  <UInput
                    v-model="cta.label"
                    placeholder="Texte du bouton"
                    class="w-full"
                  />
                  <UInput
                    v-model="cta.href"
                    placeholder="/la-carte, /nous-trouver, tel:…"
                    class="w-full"
                  />
                </div>
                <div class="flex flex-wrap items-center gap-1.5">
                  <UButton
                    v-for="s in HREF_SUGGESTIONS"
                    :key="s.href"
                    size="xs"
                    color="neutral"
                    variant="soft"
                    :label="s.label"
                    @click="applySuggestion(i, s)"
                  />
                  <span class="flex-1" />
                  <USelect
                    v-model="cta.variant"
                    :items="[{ label: 'Bouton principal', value: 'primary' }, { label: 'Bouton discret', value: 'secondary' }]"
                    size="xs"
                  />
                  <UButton
                    size="xs"
                    color="neutral"
                    variant="ghost"
                    icon="i-lucide-trash-2"
                    aria-label="Retirer ce bouton"
                    @click="removeCta(i)"
                  />
                </div>
              </div>
              <UButton
                size="sm"
                color="neutral"
                variant="outline"
                icon="i-lucide-plus"
                label="Ajouter un bouton"
                @click="addCta()"
              />
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField
                label="Début"
                help="Heure de Paris. Vide = tout de suite."
              >
                <UInput
                  v-model="form.startsAt"
                  type="datetime-local"
                  class="w-full"
                />
              </UFormField>
              <UFormField
                label="Fin"
                help="Vide = jusqu'à désactivation."
                :error="datesInvalid ? 'La fin précède le début' : undefined"
              >
                <UInput
                  v-model="form.endsAt"
                  type="datetime-local"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="grid items-end gap-4 sm:grid-cols-2">
              <UFormField
                label="Priorité"
                help="Le plus haut passe en premier."
              >
                <UInputNumber
                  v-model="form.priority"
                  class="w-32"
                />
              </UFormField>
              <label class="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2 text-sm">
                Message actif
                <USwitch v-model="form.enabled" />
              </label>
            </div>

            <AdminTranslationsField
              v-model="form.i18n"
              :fields="[{ key: 'title', label: 'Titre' }, { key: 'body', label: 'Texte', multiline: true }]"
            />
          </div>

          <div class="min-w-0">
            <div class="space-y-2 lg:sticky lg:top-0">
              <p class="text-sm font-medium">
                Aperçu
              </p>
              <div class="rounded-2xl bg-charbon-950/90 p-4">
                <AdminModalPreview
                  :title="form.title"
                  :body="form.body"
                  :image-url="form.imageUrl || null"
                  :ctas="previewCtas"
                />
              </div>
            </div>
          </div>
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
      title="Archiver ce message ?"
      :description="`« ${toArchive?.title} » ne s'affichera plus sur le site. Vous pourrez le réutiliser depuis les archives.`"
      confirm-label="Archiver"
      color="warning"
      :loading="pending"
      @confirm="archive"
    />
  </AdminPage>
</template>
