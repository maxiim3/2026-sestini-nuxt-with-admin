<script setup lang="ts">
import type { Locale } from '~~/shared/domain/constants'
import {
  pageSize,
  PRINT_MODEL_SPECS,
  PRINT_MODELS,
  printPath,
  type PrintFormat,
  type PrintModel,
  type PrintOrientation,
  type PrintTheme,
} from '~~/shared/domain/print'

definePageMeta({ layout: 'admin', middleware: 'admin', i18n: false })
useHead({ title: 'Impression · Atelier' })

const { data: schedule } = await useFetch('/api/admin/schedule', { key: 'admin-schedule' })
// Les listes d'entités ne sont pas typées par l'API générique : on décrit les champs utilisés
interface MessageRow { id: string, kind: string, title: string, startsAt: string | null, archivedAt: string | null }
interface FeaturedRow { id: string, pizzaId: string, archivedAt: string | null }
const { data: messages } = await useFetch<MessageRow[]>('/api/admin/entities/modalMessage', { key: 'admin-modal-messages' })
const { data: featured } = await useFetch<FeaturedRow[]>('/api/admin/entities/featured', { key: 'admin-featured' })
const { data: pizzas } = await useFetch('/api/admin/pizzas', { key: 'admin-pizzas' })
const { data: menus } = await useFetch('/api/admin/menus', { key: 'admin-menus' })

const model = ref<PrintModel>('carte')
const spec = computed(() => PRINT_MODEL_SPECS[model.value])
const common = reactive({
  format: 'A4' as PrintFormat,
  orientation: 'portrait' as PrintOrientation,
  theme: 'clair' as PrintTheme,
  lang: 'fr' as Locale,
})
/** Paramètres propres à chaque modèle, conservés quand on passe de l'un à l'autre */
const params = reactive<Record<PrintModel, Record<string, string>>>({
  'carte': {},
  'pizza-du-moment': {},
  'fermeture': {},
  'evenement': {},
  'semaine': {},
})

function choose(m: PrintModel) {
  model.value = m
  if (!PRINT_MODEL_SPECS[m].formats.includes(common.format)) common.format = PRINT_MODEL_SPECS[m].defaultFormat
}

const NONE = '__none'
const DEFAULT = '__default'

function url(m: PrintModel, extra: Record<string, string> = {}) {
  const own = Object.fromEntries(Object.entries(params[m]).filter(([, v]) => v && v !== DEFAULT).map(([k, v]) => [k, v === NONE ? 'none' : v]))
  return printPath(m, { ...common, ...own, ...extra })
}
const current = computed(() => url(model.value))
const thumbAspect = computed(() => {
  const { width, height } = pageSize(common.format, common.orientation)
  return `${width} / ${height}`
})

function openDoc() {
  window.open(current.value, '_blank')
}
function printDoc() {
  window.open(url(model.value, { autoprint: '1' }), '_blank')
}

// ─── Listes de choix ───────────────────────────────────────────────────
const dateFmt = (iso: string) => dateFr(iso)
const locationName = (id: string | null) => schedule.value?.locations.find(l => l.id === id)?.city ?? ''

const closures = computed(() => [
  { label: 'La prochaine fermeture programmée', value: DEFAULT },
  ...(schedule.value?.exceptions ?? [])
    .filter(e => e.kind === 'closed')
    .map(e => ({ label: `${dateFmt(e.startsOn)} → ${dateFmt(e.endsOn)}${e.note ? ` · ${e.note}` : ''}`, value: e.id })),
])
const events = computed(() => [
  { label: 'Le prochain événement (sinon le dernier)', value: DEFAULT },
  ...(schedule.value?.exceptions ?? [])
    .filter(e => e.kind === 'relocated' || e.kind === 'extra')
    .map(e => ({ label: `${dateFmt(e.startsOn)} · ${locationName(e.locationId)}${e.note ? ` · ${e.note}` : ''}`, value: e.id })),
])
function messageItems(kind: string) {
  return [
    { label: 'Automatique (message de la même période)', value: DEFAULT },
    { label: 'Aucun message', value: NONE },
    ...(messages.value ?? [])
      .filter(m => !m.archivedAt)
      .sort((a, b) => Number(b.kind === kind) - Number(a.kind === kind))
      .map(m => ({ label: `${m.title}${m.startsAt ? ` · ${dateFmt(m.startsAt)}` : ''}`, value: m.id })),
  ]
}
const pizzaName = (id: string) => pizzas.value?.find(p => p.id === id)?.name ?? 'Pizza'
const featuredItems = computed(() => [
  { label: 'La pizza du moment en cours (sinon la plus récente)', value: DEFAULT },
  ...(featured.value ?? []).map(f => ({ label: `${pizzaName(f.pizzaId)}${f.archivedAt ? ' (archive)' : ''}`, value: f.id })),
])
const menuItems = computed(() => [
  { label: 'La carte en ligne', value: DEFAULT },
  ...(menus.value ?? []).map(m => ({ label: `${m.name}${m.status === 'archived' ? ' (archive)' : ''}`, value: m.id })),
])

const FORMATS = computed(() => spec.value.formats.map(f => ({ label: f, value: f })))
const ORIENTATIONS = [{ label: 'Portrait', value: 'portrait' }, { label: 'Paysage', value: 'landscape' }]
const THEMES = [{ label: 'Clair · économe en encre', value: 'clair' }, { label: 'Sombre · affichage', value: 'sombre' }]
const LANGS = [{ label: 'Français', value: 'fr' }, { label: 'English', value: 'en' }, { label: 'Español', value: 'es' }, { label: 'Italiano', value: 'it' }]

const ICONS: Record<PrintModel, string> = {
  'carte': 'i-lucide-book-open',
  'pizza-du-moment': 'i-lucide-flame',
  'fermeture': 'i-lucide-calendar-off',
  'evenement': 'i-lucide-party-popper',
  'semaine': 'i-lucide-map-pinned',
}
</script>

<template>
  <AdminPage
    title="Impression"
    description="Carte, flyers et affiches prêts à imprimer, générés à partir du contenu du site. Choisissez un modèle, réglez le format, puis ouvrez-le ou enregistrez-le en PDF (Imprimer → Enregistrer au format PDF, marges « Aucune », graphiques d'arrière-plan cochés)."
  >
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
      <button
        v-for="m in PRINT_MODELS"
        :key="m"
        type="button"
        class="group overflow-hidden rounded-xl border text-left transition"
        :class="model === m ? 'border-braise-500 ring-2 ring-braise-400/50' : 'border-stone-200 hover:border-stone-300'"
        @click="choose(m)"
      >
        <div class="relative bg-stone-100 p-3">
          <iframe
            :src="url(m, { embed: '1', format: PRINT_MODEL_SPECS[m].formats.includes(common.format) ? common.format : PRINT_MODEL_SPECS[m].defaultFormat })"
            :title="`Aperçu : ${PRINT_MODEL_SPECS[m].label}`"
            loading="lazy"
            tabindex="-1"
            class="pointer-events-none mx-auto block w-full bg-white shadow-sm"
            :style="{ aspectRatio: thumbAspect }"
          />
        </div>
        <div class="flex items-start gap-2 p-3">
          <UIcon
            :name="ICONS[m]"
            class="mt-0.5 size-4 shrink-0 text-braise-600"
          />
          <div>
            <p class="text-sm font-semibold">
              {{ PRINT_MODEL_SPECS[m].label }}
            </p>
            <p class="text-xs text-stone-500">
              {{ PRINT_MODEL_SPECS[m].formats.join(' · ') }}
            </p>
          </div>
        </div>
      </button>
    </div>

    <div class="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
      <UCard>
        <template #header>
          <h2 class="font-semibold">
            {{ spec.label }}
          </h2>
          <p class="mt-1 text-sm text-stone-500">
            {{ spec.description }}
          </p>
        </template>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Format">
              <USelect
                v-model="common.format"
                :items="FORMATS"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Orientation">
              <USelect
                v-model="common.orientation"
                :items="ORIENTATIONS"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Thème">
              <USelect
                v-model="common.theme"
                :items="THEMES"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Langue">
              <USelect
                v-model="common.lang"
                :items="LANGS"
                class="w-full"
              />
            </UFormField>
          </div>

          <template v-if="model === 'carte'">
            <UFormField label="Carte">
              <USelect
                v-model="params.carte.menu"
                :items="menuItems"
                placeholder="La carte en ligne"
                class="w-full"
              />
            </UFormField>
          </template>

          <template v-else-if="model === 'pizza-du-moment'">
            <UFormField label="Pizza du moment">
              <USelect
                v-model="params['pizza-du-moment'].featured"
                :items="featuredItems"
                placeholder="La pizza du moment en cours"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Surtitre"
              hint="Facultatif"
            >
              <UInput
                v-model="params['pizza-du-moment'].title"
                placeholder="La Pizza du Moment"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Accroche"
              hint="Facultatif"
            >
              <UTextarea
                v-model="params['pizza-du-moment'].body"
                :rows="2"
                class="w-full"
              />
            </UFormField>
          </template>

          <template v-else-if="model === 'fermeture'">
            <UFormField
              label="Fermeture"
              help="Les fermetures se créent dans Lieux & horaires (ou par l'IA). Vous pouvez aussi saisir des dates."
            >
              <USelect
                v-model="params.fermeture.exception"
                :items="closures"
                placeholder="La prochaine fermeture programmée"
                class="w-full"
              />
            </UFormField>
            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Du">
                <UInput
                  v-model="params.fermeture.from"
                  type="date"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Au">
                <UInput
                  v-model="params.fermeture.to"
                  type="date"
                  class="w-full"
                />
              </UFormField>
            </div>
            <UFormField label="Message">
              <USelect
                v-model="params.fermeture.message"
                :items="messageItems('closure')"
                placeholder="Automatique"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Titre"
              hint="Facultatif"
            >
              <UInput
                v-model="params.fermeture.title"
                placeholder="En congés"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Texte"
              hint="**gras** accepté"
            >
              <UTextarea
                v-model="params.fermeture.body"
                :rows="3"
                class="w-full"
              />
            </UFormField>
          </template>

          <template v-else-if="model === 'evenement'">
            <UFormField label="Événement">
              <USelect
                v-model="params.evenement.exception"
                :items="events"
                placeholder="Le prochain événement"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Message">
              <USelect
                v-model="params.evenement.message"
                :items="messageItems('event')"
                placeholder="Automatique"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Titre"
              hint="Facultatif"
            >
              <UInput
                v-model="params.evenement.title"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Texte"
              hint="**gras** accepté"
            >
              <UTextarea
                v-model="params.evenement.body"
                :rows="3"
                class="w-full"
              />
            </UFormField>
          </template>

          <template v-else-if="model === 'semaine'">
            <UFormField
              label="Semaine du"
              help="N'importe quel jour de la semaine voulue (par défaut : cette semaine)."
            >
              <UInput
                v-model="params.semaine.from"
                type="date"
                class="w-full"
              />
            </UFormField>
          </template>

          <div class="flex flex-wrap gap-2 border-t border-stone-200 pt-4">
            <UButton
              icon="i-lucide-printer"
              label="Imprimer / PDF"
              @click="printDoc"
            />
            <UButton
              icon="i-lucide-external-link"
              label="Ouvrir"
              color="neutral"
              variant="outline"
              @click="openDoc"
            />
          </div>
          <p class="text-xs text-stone-500">
            Lien direct, aussi utilisable par votre agent IA :
            <code class="break-all rounded bg-stone-100 px-1 py-0.5">{{ current }}</code>
          </p>
        </div>
      </UCard>

      <div class="flex min-h-[480px] items-start justify-center rounded-xl bg-stone-200/70 p-4 sm:p-6">
        <iframe
          :key="current"
          :src="`${current}${current.includes('?') ? '&' : '?'}embed=1`"
          :title="`Aperçu : ${spec.label}`"
          class="block w-full max-w-[640px] bg-white shadow-xl"
          :style="{ aspectRatio: thumbAspect }"
        />
      </div>
    </div>
  </AdminPage>
</template>
