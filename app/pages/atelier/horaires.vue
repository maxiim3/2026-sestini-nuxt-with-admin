<script setup lang="ts">
import { EXCEPTION_KINDS, WEEKDAYS, type ExceptionKind } from '~~/shared/domain/constants'
import { addDays, formatHour, isoDateInParis } from '~~/shared/domain/dates'
import { activeSeason, type ScheduleData, type ScheduleException } from '~~/shared/domain/schedule'
import { slugify } from '~~/shared/domain/text'
import type { Operation } from '~~/shared/schemas'
import type { DayState } from '~/components/admin/ScheduleWeekGrid.vue'

definePageMeta({ layout: 'admin', middleware: 'admin', i18n: false })
useHead({ title: 'Lieux & horaires · Atelier' })

type Tr = Partial<Record<'en' | 'es' | 'it', Record<string, string>>>

const { data: schedule, status } = await useFetch('/api/admin/schedule', { key: 'admin-schedule' })
const { apply, pending } = useAdminWrite()

type Loc = NonNullable<typeof schedule.value>['locations'][number]
type Season = NonNullable<typeof schedule.value>['seasons'][number]
type Exc = NonNullable<typeof schedule.value>['exceptions'][number]

const today = isoDateInParis()
const tab = ref<'seasons' | 'exceptions' | 'locations'>('seasons')

const locations = computed(() => schedule.value?.locations ?? [])
const liveLocations = computed(() => locations.value.filter(l => !l.archivedAt))
const seasons = computed(() => schedule.value?.seasons ?? [])
const exceptions = computed(() => schedule.value?.exceptions ?? [])

function range(start: string | null, end: string | null) {
  if (start && end && start !== end) return `du ${dateFr(start)} au ${dateFr(end)}`
  if (start) return `le ${dateFr(start)}`
  return ''
}

// ═══ Semaines types ═══════════════════════════════════════════════════════

function weekFromSlots(season: Season): DayState[] {
  return WEEKDAYS.map((weekday) => {
    const slot = season.slots.find(s => s.weekday === weekday)
    return { weekday, open: Boolean(slot), locationId: slot?.locationId ?? '', opensAt: slot?.opensAt ?? '18:00', closesAt: slot?.closesAt ?? null }
  })
}

const edits = ref<Record<string, DayState[]>>({})
function clearEdit(id: string) {
  edits.value = Object.fromEntries(Object.entries(edits.value).filter(([key]) => key !== id))
}
function weekFor(season: Season) {
  return edits.value[season.id] ?? weekFromSlots(season)
}
function slotsOf(week: DayState[]) {
  return week.filter(d => d.open && d.locationId).map(d => ({ weekday: d.weekday, locationId: d.locationId, opensAt: d.opensAt || '18:00', closesAt: d.closesAt || null }))
}
function isDirty(season: Season) {
  const edited = edits.value[season.id]
  return Boolean(edited) && JSON.stringify(slotsOf(edited!)) !== JSON.stringify(slotsOf(weekFromSlots(season)))
}
function weekProblem(week: DayState[]) {
  return week.some(d => d.open && !d.locationId) ? 'Choisissez un lieu pour chaque jour ouvert.' : null
}

async function saveWeek(season: Season, mode: 'publish' | 'draft') {
  await apply(`Semaine type modifiée : ${season.name}`, [{ op: 'setScheduleSlots', seasonId: season.id, slots: slotsOf(weekFor(season)) }], { mode })
  clearEdit(season.id)
}

const activeId = computed(() => activeSeason(
  seasons.value.filter(s => !s.archivedAt).map(s => ({ ...s, slots: [] })),
  today,
)?.id)

const openSeasons = ref<Record<string, boolean>>({})
function isOpenSeason(s: Season) {
  return openSeasons.value[s.id] ?? (s.id === activeId.value)
}
const orderedSeasons = computed(() => seasons.value
  .filter(s => !s.archivedAt)
  .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || (a.startsOn ?? '').localeCompare(b.startsOn ?? '')))
const archivedSeasons = computed(() => seasons.value.filter(s => s.archivedAt))

function summary(season: Season) {
  const week = weekFor(season)
  const names = [...new Set(week.filter(d => d.open).map(d => locations.value.find(l => l.id === d.locationId)?.name).filter(Boolean))]
  const openDays = week.filter(d => d.open).length
  return openDays ? `${openDays} jour${openDays > 1 ? 's' : ''} par semaine · ${names.join(', ')}` : 'Fermé toute la semaine'
}

// ─── Création / duplication / renommage d'une saison ───
interface SeasonForm {
  id?: string
  name: string
  startsOn: string
  endsOn: string
  priority: number
  isDefault: boolean
  source: string
}
const seasonOpen = ref(false)
const seasonForm = ref<SeasonForm>({ name: '', startsOn: '', endsOn: '', priority: 10, isDefault: false, source: 'empty' })

function newSeason(source?: Season) {
  seasonForm.value = {
    name: source && !source.isDefault ? `${source.name} (copie)` : '',
    startsOn: '',
    endsOn: '',
    priority: source && !source.isDefault ? source.priority : 10,
    isDefault: false,
    source: source?.id ?? 'empty',
  }
  seasonOpen.value = true
}
function editSeason(s: Season) {
  seasonForm.value = { id: s.id, name: s.name, startsOn: s.startsOn ?? '', endsOn: s.endsOn ?? '', priority: s.priority, isDefault: s.isDefault, source: 'empty' }
  seasonOpen.value = true
}
const seasonDatesInvalid = computed(() => !seasonForm.value.isDefault && Boolean(seasonForm.value.startsOn && seasonForm.value.endsOn && seasonForm.value.startsOn > seasonForm.value.endsOn))
const seasonValid = computed(() => {
  const f = seasonForm.value
  if (!f.name.trim() || seasonDatesInvalid.value) return false
  return f.isDefault || Boolean(f.startsOn && f.endsOn)
})
const sourceItems = computed(() => [
  { label: 'Semaine vide (tout fermé)', value: 'empty' },
  ...orderedSeasons.value.map(s => ({ label: `Copier : ${s.name}`, value: s.id })),
])

async function saveSeason(mode: 'publish' | 'draft') {
  const f = seasonForm.value
  const name = f.name.trim()
  if (f.id) {
    await apply(`Saison modifiée : ${name}`, [{
      op: 'update',
      entity: 'season',
      id: f.id,
      data: f.isDefault ? { name } : { name, startsOn: f.startsOn, endsOn: f.endsOn, priority: f.priority },
    }], { mode })
  }
  else {
    const taken = new Set(seasons.value.map(s => s.slug))
    let slug = slugify(name) || 'saison'
    for (let n = 2; taken.has(slug); n++) slug = `${slugify(name)}-${n}`
    const source = seasons.value.find(s => s.id === f.source)
    const ops: Operation[] = [{
      op: 'create',
      entity: 'season',
      ref: '$season',
      data: { slug, name, startsOn: f.startsOn, endsOn: f.endsOn, priority: f.priority, isDefault: false },
    }]
    if (source) ops.push({ op: 'setScheduleSlots', seasonId: '$season', slots: slotsOf(weekFor(source)) })
    await apply(source ? `Saison dupliquée : ${name}` : `Nouvelle saison : ${name}`, ops, { mode })
  }
  seasonOpen.value = false
}

// ═══ Exceptions ═══════════════════════════════════════════════════════════

const upcoming = computed(() => exceptions.value
  .filter(e => e.endsOn >= today)
  .sort((a, b) => a.startsOn.localeCompare(b.startsOn)))
const past = computed(() => exceptions.value
  .filter(e => e.endsOn < today)
  .sort((a, b) => b.startsOn.localeCompare(a.startsOn)))

function locationName(id: string | null) {
  return locations.value.find(l => l.id === id)?.name ?? null
}
function excHours(e: Exc) {
  if (e.kind === 'closed') return ''
  if (e.opensAt && e.closesAt) return `${formatHour(e.opensAt)} – ${formatHour(e.closesAt)}`
  if (e.opensAt) return `dès ${formatHour(e.opensAt)}`
  if (e.closesAt) return `jusqu'à ${formatHour(e.closesAt)}`
  return ''
}

interface LocForm {
  id?: string
  slug: string
  name: string
  address: string
  zip: string
  city: string
  lat: string
  lng: string
  notes: string
  i18n: Tr | null
}
function blankLoc(): LocForm {
  return { slug: '', name: '', address: '', zip: '', city: '', lat: '', lng: '', notes: '', i18n: null }
}
interface ExcForm {
  id?: string
  kind: ExceptionKind
  startsOn: string
  endsOn: string
  locationId: string
  newLocation: boolean
  loc: LocForm
  opensAt: string
  closesAt: string
  note: string
  i18n: Tr | null
}
function blankExc(kind: ExceptionKind = 'closed'): ExcForm {
  return { kind, startsOn: today, endsOn: today, locationId: '', newLocation: false, loc: blankLoc(), opensAt: kind === 'closed' ? '' : '18:00', closesAt: '', note: '', i18n: null }
}
const excOpen = ref(false)
const exc = ref<ExcForm>(blankExc())

function openNewException(kind: ExceptionKind = 'closed') {
  exc.value = blankExc(kind)
  excOpen.value = true
}
function openEditException(e: Exc) {
  exc.value = {
    id: e.id,
    kind: e.kind,
    startsOn: e.startsOn,
    endsOn: e.endsOn,
    locationId: e.locationId ?? '',
    newLocation: false,
    loc: blankLoc(),
    opensAt: e.opensAt ?? '',
    closesAt: e.closesAt ?? '',
    note: e.note ?? '',
    i18n: (e.i18n as Tr | null) ?? null,
  }
  excOpen.value = true
}
watch(() => exc.value.startsOn, (start, old) => {
  if (!excOpen.value) return
  if (!exc.value.endsOn || exc.value.endsOn === old || exc.value.endsOn < start) exc.value.endsOn = start
})
watch(() => exc.value.kind, (kind) => {
  if (!excOpen.value) return
  if (kind !== 'closed' && !exc.value.opensAt) exc.value.opensAt = '18:00'
})

const needsLocation = computed(() => exc.value.kind === 'relocated' || exc.value.kind === 'extra')
const showTimes = computed(() => exc.value.kind !== 'closed')
const excDatesInvalid = computed(() => Boolean(exc.value.startsOn && exc.value.endsOn && exc.value.startsOn > exc.value.endsOn))

function locProblem(l: LocForm) {
  if (!l.name.trim() || !l.address.trim() || !l.city.trim()) return 'Renseignez le nom, l\'adresse et la ville.'
  if (!/^\d{5}$/.test(l.zip)) return 'Le code postal comporte 5 chiffres.'
  const lat = Number(l.lat)
  const lng = Number(l.lng)
  if (!l.lat || !l.lng || Number.isNaN(lat) || Number.isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return 'Renseignez la latitude et la longitude (ex. 43.5361 et 3.8523).'
  return null
}
const excProblem = computed(() => {
  const e = exc.value
  if (!e.startsOn || !e.endsOn) return 'Choisissez les dates.'
  if (excDatesInvalid.value) return 'La date de fin précède la date de début.'
  if (needsLocation.value) {
    if (e.newLocation) return locProblem(e.loc)
    if (!e.locationId) return 'Choisissez un lieu.'
  }
  if (e.kind === 'hours' && !e.opensAt && !e.closesAt) return 'Indiquez au moins une heure.'
  return null
})

function uniqueLocationSlug(name: string) {
  const taken = new Set(locations.value.map(l => l.slug))
  const base = slugify(name) || 'lieu'
  let slug = base
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`
  return slug
}
function locationData(l: LocForm, slug: string) {
  return {
    slug,
    name: l.name.trim(),
    address: l.address.trim(),
    city: l.city.trim(),
    zip: l.zip,
    lat: Number(l.lat),
    lng: Number(l.lng),
    notes: l.notes.trim() || null,
    i18n: l.i18n,
  }
}

async function saveException(mode: 'publish' | 'draft') {
  const e = exc.value
  const ops: Operation[] = []
  let locationId: string | null = needsLocation.value ? e.locationId : null
  if (needsLocation.value && e.newLocation) {
    ops.push({ op: 'create', entity: 'location', ref: '$loc', data: locationData(e.loc, uniqueLocationSlug(e.loc.name)) })
    locationId = '$loc'
  }
  const data = {
    kind: e.kind,
    startsOn: e.startsOn,
    endsOn: e.endsOn,
    locationId,
    opensAt: showTimes.value ? e.opensAt || null : null,
    closesAt: showTimes.value ? e.closesAt || null : null,
    note: e.note.trim() || null,
    i18n: e.i18n,
  }
  ops.push(e.id ? { op: 'update', entity: 'scheduleException', id: e.id, data } : { op: 'create', entity: 'scheduleException', data })
  await apply(`${EXCEPTION_LABELS[e.kind].label} ${range(e.startsOn, e.endsOn)}`, ops, { mode })
  excOpen.value = false
}

const toRemove = ref<{ exc: Exc, mode: 'archive' | 'delete' } | null>(null)
const removeOpen = computed({
  get: () => Boolean(toRemove.value),
  set: (v) => {
    if (!v) toRemove.value = null
  },
})
async function remove() {
  if (!toRemove.value) return
  const { exc: e, mode } = toRemove.value
  await apply(
    mode === 'delete' ? `Exception supprimée : ${EXCEPTION_LABELS[e.kind].label}` : `Exception archivée : ${EXCEPTION_LABELS[e.kind].label}`,
    [{ op: mode, entity: 'scheduleException', id: e.id } as Operation],
  )
  toRemove.value = null
}

// ═══ Lieux ════════════════════════════════════════════════════════════════

const locOpen = ref(false)
const loc = ref<LocForm>(blankLoc())
const locSlugTouched = ref(false)
function openNewLocation() {
  loc.value = blankLoc()
  locSlugTouched.value = false
  locOpen.value = true
}
function openEditLocation(l: Loc) {
  loc.value = { id: l.id, slug: l.slug, name: l.name, address: l.address, zip: l.zip, city: l.city, lat: String(l.lat), lng: String(l.lng), notes: l.notes ?? '', i18n: (l.i18n as Tr | null) ?? null }
  locSlugTouched.value = true
  locOpen.value = true
}
watch(() => loc.value.name, (name) => {
  if (!locSlugTouched.value) loc.value.slug = slugify(name)
})
const locError = computed(() => locProblem(loc.value))

async function saveLocation(mode: 'publish' | 'draft') {
  const l = loc.value
  const slug = l.id ? l.slug : uniqueLocationSlug(l.name)
  const data = locationData(l, slug)
  await apply(
    l.id ? `Lieu modifié : ${data.name}` : `Nouveau lieu : ${data.name}`,
    [l.id ? { op: 'update', entity: 'location', id: l.id, data } : { op: 'create', entity: 'location', data }],
    { mode },
  )
  locOpen.value = false
}

function usageOf(l: Loc) {
  return seasons.value.filter(s => !s.archivedAt).reduce((n, s) => n + s.slots.filter(sl => sl.locationId === l.id).length, 0)
}
const locToArchive = ref<Loc | null>(null)
const locArchiveOpen = computed({
  get: () => Boolean(locToArchive.value),
  set: (v) => {
    if (!v) locToArchive.value = null
  },
})
async function archiveLocation() {
  const l = locToArchive.value
  if (!l) return
  await apply(`Lieu archivé : ${l.name}`, [{ op: 'archive', entity: 'location', id: l.id }])
  locToArchive.value = null
}
async function restoreLocation(l: Loc) {
  await apply(`Lieu restauré : ${l.name}`, [{ op: 'restore', entity: 'location', id: l.id }])
}

const seasonToArchive = ref<Season | null>(null)
const seasonArchiveOpen = computed({
  get: () => Boolean(seasonToArchive.value),
  set: (v) => {
    if (!v) seasonToArchive.value = null
  },
})
async function archiveSeason() {
  const s = seasonToArchive.value
  if (!s) return
  await apply(`Saison archivée : ${s.name}`, [{ op: 'archive', entity: 'season', id: s.id }])
  seasonToArchive.value = null
}
async function restoreSeason(s: Season) {
  await apply(`Saison restaurée : ${s.name}`, [{ op: 'restore', entity: 'season', id: s.id }])
}

// ═══ Aperçu ═══════════════════════════════════════════════════════════════

/** Planning tel qu'il serait avec les modifications en cours (non enregistrées) */
const previewData = computed<ScheduleData>(() => {
  const locs = locations.value.map(l => ({ id: l.id, slug: l.slug, name: l.name, address: l.address, city: l.city, zip: l.zip, lat: l.lat, lng: l.lng }))
  let draft: ScheduleException | null = null
  if (excOpen.value && exc.value.startsOn && exc.value.endsOn && !excDatesInvalid.value) {
    const e = exc.value
    let locationId: string | null = needsLocation.value ? e.locationId || null : null
    if (needsLocation.value && e.newLocation) {
      locationId = '__new__'
      locs.push({ id: '__new__', slug: '', name: e.loc.name || 'Nouveau lieu', address: e.loc.address, city: e.loc.city, zip: e.loc.zip, lat: 0, lng: 0 })
    }
    draft = {
      id: e.id ?? '__draft__',
      kind: e.kind,
      startsOn: e.startsOn,
      endsOn: e.endsOn,
      locationId,
      opensAt: showTimes.value ? e.opensAt || null : null,
      closesAt: showTimes.value ? e.closesAt || null : null,
      note: e.note || null,
    }
  }
  return {
    locations: locs,
    seasons: seasons.value.filter(s => !s.archivedAt).map(s => ({
      id: s.id,
      name: s.name,
      startsOn: s.startsOn,
      endsOn: s.endsOn,
      priority: s.priority,
      isDefault: s.isDefault,
      slots: slotsOf(weekFor(s)),
    })),
    exceptions: [
      ...exceptions.value.filter(e => e.id !== draft?.id).map(e => ({ id: e.id, kind: e.kind, startsOn: e.startsOn, endsOn: e.endsOn, locationId: e.locationId, opensAt: e.opensAt, closesAt: e.closesAt, note: e.note })),
      ...(draft ? [draft] : []),
    ],
  }
})
const hasUnsaved = computed(() => excOpen.value || seasons.value.some(isDirty))

/** Aperçu ciblé dans le formulaire d'exception : de la veille au lendemain de la période (14 jours maximum) */
const excPreviewFrom = computed(() => addDays(exc.value.startsOn || today, -1))
const excPreviewDays = computed(() => {
  const start = exc.value.startsOn || today
  const end = exc.value.endsOn || start
  const length = Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000) + 3
  return Math.min(14, Math.max(3, Number.isFinite(length) ? length : 3))
})

const TABS = [
  { label: 'Saisons', value: 'seasons', icon: 'i-lucide-calendar-range' },
  { label: 'Exceptions', value: 'exceptions', icon: 'i-lucide-calendar-x' },
  { label: 'Lieux', value: 'locations', icon: 'i-lucide-map-pin' },
]
const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const KIND_ITEMS = EXCEPTION_KINDS.map(k => ({ value: k, label: EXCEPTION_LABELS[k].label, description: EXCEPTION_LABELS[k].description }))
const locationItems = computed(() => liveLocations.value.map(l => ({ label: `${l.name} · ${l.city}`, value: l.id })))
</script>

<template>
  <AdminPage
    title="Lieux & horaires"
    description="Où et quand le camion est là. Le planning de la semaine dépend de la saison ; les exceptions (vacances, événements) passent par-dessus."
  >
    <section class="space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="font-display text-lg font-semibold tracking-wide">
          Les 14 prochains jours
        </h2>
        <UBadge
          v-if="hasUnsaved"
          color="warning"
          variant="subtle"
          icon="i-lucide-eye"
          label="Aperçu avec vos modifications non enregistrées"
        />
      </div>
      <USkeleton
        v-if="status === 'pending'"
        class="h-40"
      />
      <AdminSchedulePreview
        v-else
        :data="previewData"
      />
      <p class="text-xs text-stone-500">
        Sur le site, seule l'heure d'ouverture est affichée (« dès 18h »). L'heure de fermeture sert à indiquer si le camion est encore ouvert ce soir.
      </p>
    </section>

    <UTabs
      v-model="tab"
      :items="TABS"
      :content="false"
      class="w-full max-w-lg"
    />

    <!-- ═══ Saisons ═══ -->
    <section
      v-if="tab === 'seasons'"
      class="space-y-4"
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="max-w-2xl text-sm text-stone-500">
          La saison « par défaut » s'applique toute l'année. Une saison datée (été, vacances scolaires…) prend le dessus pendant ses dates ; en cas de chevauchement, la priorité la plus haute gagne.
        </p>
        <UButton
          icon="i-lucide-plus"
          label="Nouvelle saison"
          @click="newSeason()"
        />
      </div>

      <UCard
        v-for="s in orderedSeasons"
        :key="s.id"
        :ui="{ body: 'space-y-4' }"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0 space-y-1">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="font-display text-lg font-semibold">
                {{ s.name }}
              </h3>
              <UBadge
                v-if="s.isDefault"
                color="neutral"
                variant="subtle"
                label="Par défaut"
              />
              <UBadge
                v-if="s.id === activeId"
                color="success"
                variant="subtle"
                label="En ce moment"
              />
            </div>
            <p class="text-sm text-stone-500">
              <template v-if="s.isDefault">
                Utilisée quand aucune saison datée ne couvre le jour.
              </template>
              <template v-else>
                Du {{ dateFr(s.startsOn) }} au {{ dateFr(s.endsOn) }} · priorité {{ s.priority }}
              </template>
            </p>
          </div>
          <div class="flex flex-wrap gap-1">
            <UButton
              size="sm"
              color="neutral"
              variant="outline"
              :icon="isOpenSeason(s) ? 'i-lucide-chevron-up' : 'i-lucide-calendar-days'"
              :label="isOpenSeason(s) ? 'Replier' : 'Modifier la semaine'"
              @click="openSeasons[s.id] = !isOpenSeason(s)"
            />
            <UButton
              size="sm"
              color="neutral"
              variant="ghost"
              icon="i-lucide-pencil"
              aria-label="Renommer ou changer les dates"
              @click="editSeason(s)"
            />
            <UButton
              size="sm"
              color="neutral"
              variant="ghost"
              icon="i-lucide-copy"
              aria-label="Dupliquer"
              @click="newSeason(s)"
            />
            <UButton
              v-if="!s.isDefault"
              size="sm"
              color="neutral"
              variant="ghost"
              icon="i-lucide-archive"
              aria-label="Archiver"
              @click="seasonToArchive = s"
            />
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <div class="flex gap-1">
            <span
              v-for="(letter, idx) in DAY_LETTERS"
              :key="idx"
              class="grid size-7 place-items-center rounded-full text-xs font-semibold"
              :class="weekFor(s)[idx]?.open ? 'bg-braise-500 text-white' : 'bg-stone-100 text-stone-400'"
            >{{ letter }}</span>
          </div>
          <p class="text-sm text-stone-600">
            {{ summary(s) }}
          </p>
        </div>

        <template v-if="isOpenSeason(s)">
          <AdminScheduleWeekGrid
            :model-value="weekFor(s)"
            :locations="liveLocations"
            @update:model-value="v => edits[s.id] = v"
          />
          <p
            v-if="weekProblem(weekFor(s))"
            class="text-sm text-red-600"
          >
            {{ weekProblem(weekFor(s)) }}
          </p>
        </template>

        <template
          v-if="isDirty(s)"
          #footer
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-undo-2"
              label="Annuler les modifications"
              @click="clearEdit(s.id)"
            />
            <AdminPublishBar
              :loading="pending"
              :disabled="Boolean(weekProblem(weekFor(s)))"
              @save="m => saveWeek(s, m)"
            />
          </div>
        </template>
      </UCard>

      <UCollapsible v-if="archivedSeasons.length">
        <UButton
          color="neutral"
          variant="ghost"
          trailing-icon="i-lucide-chevron-down"
          :label="`Saisons archivées (${archivedSeasons.length})`"
        />
        <template #content>
          <ul class="mt-2 divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200">
            <li
              v-for="s in archivedSeasons"
              :key="s.id"
              class="flex items-center justify-between gap-3 bg-white p-3"
            >
              <span class="text-sm text-stone-600">{{ s.name }} · {{ s.startsOn ? `${dateFr(s.startsOn)} → ${dateFr(s.endsOn)}` : 'par défaut' }}</span>
              <UButton
                size="sm"
                color="neutral"
                variant="outline"
                icon="i-lucide-archive-restore"
                label="Restaurer"
                @click="restoreSeason(s)"
              />
            </li>
          </ul>
        </template>
      </UCollapsible>
    </section>

    <!-- ═══ Exceptions ═══ -->
    <section
      v-if="tab === 'exceptions'"
      class="space-y-4"
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="max-w-2xl text-sm text-stone-500">
          Une exception remplace le planning habituel pour un jour ou une période : fermeture, autre lieu, horaires spéciaux, ouverture en plus.
        </p>
        <UButton
          icon="i-lucide-plus"
          label="Nouvelle exception"
          @click="openNewException()"
        />
      </div>

      <div class="flex flex-wrap gap-2">
        <UButton
          v-for="k in EXCEPTION_KINDS"
          :key="k"
          size="sm"
          color="neutral"
          variant="outline"
          :icon="EXCEPTION_LABELS[k].icon"
          :label="EXCEPTION_LABELS[k].label"
          @click="openNewException(k)"
        />
      </div>

      <p
        v-if="!upcoming.length"
        class="rounded-xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500"
      >
        Aucune exception à venir. Le planning habituel s'applique.
      </p>
      <ul
        v-else
        class="divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200"
      >
        <li
          v-for="e in upcoming"
          :key="e.id"
          class="flex flex-wrap items-start gap-3 bg-white p-4"
        >
          <UIcon
            :name="EXCEPTION_LABELS[e.kind].icon"
            class="mt-1 size-5 shrink-0 text-stone-500"
          />
          <div class="min-w-0 flex-1 space-y-1">
            <p class="flex flex-wrap items-center gap-2">
              <UBadge
                :color="EXCEPTION_LABELS[e.kind].color"
                variant="subtle"
                :label="EXCEPTION_LABELS[e.kind].label"
              />
              <span class="font-semibold">{{ e.startsOn === e.endsOn ? dateFr(e.startsOn) : `${dateFr(e.startsOn)} → ${dateFr(e.endsOn)}` }}</span>
              <UBadge
                v-if="e.startsOn <= today"
                color="neutral"
                variant="outline"
                label="en cours"
              />
            </p>
            <p
              v-if="locationName(e.locationId) || excHours(e)"
              class="text-sm text-stone-700"
            >
              <template v-if="locationName(e.locationId)">
                {{ locationName(e.locationId) }}
              </template>
              <template v-if="locationName(e.locationId) && excHours(e)">
                ·
              </template>
              {{ excHours(e) }}
            </p>
            <p
              v-if="e.note"
              class="text-sm italic text-stone-500"
            >
              « {{ e.note }} »
            </p>
          </div>
          <div class="flex shrink-0 gap-1">
            <UButton
              size="sm"
              color="neutral"
              variant="outline"
              icon="i-lucide-pencil"
              aria-label="Modifier"
              @click="openEditException(e)"
            />
            <UButton
              size="sm"
              color="neutral"
              variant="ghost"
              icon="i-lucide-archive"
              aria-label="Archiver"
              @click="toRemove = { exc: e, mode: 'archive' }"
            />
            <UButton
              size="sm"
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              aria-label="Supprimer"
              @click="toRemove = { exc: e, mode: 'delete' }"
            />
          </div>
        </li>
      </ul>

      <UCollapsible v-if="past.length">
        <UButton
          color="neutral"
          variant="ghost"
          trailing-icon="i-lucide-chevron-down"
          :label="`Exceptions passées (${past.length})`"
        />
        <template #content>
          <ul class="mt-2 divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200">
            <li
              v-for="e in past"
              :key="e.id"
              class="flex flex-wrap items-center justify-between gap-3 bg-stone-50 p-3 text-sm text-stone-600"
            >
              <span>
                <UBadge
                  :color="EXCEPTION_LABELS[e.kind].color"
                  variant="subtle"
                  size="sm"
                  :label="EXCEPTION_LABELS[e.kind].label"
                />
                {{ e.startsOn === e.endsOn ? dateFr(e.startsOn) : `${dateFr(e.startsOn)} → ${dateFr(e.endsOn)}` }}
                <template v-if="e.note">· {{ e.note }}</template>
              </span>
              <span class="flex gap-1">
                <UButton
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-archive"
                  aria-label="Archiver"
                  @click="toRemove = { exc: e, mode: 'archive' }"
                />
                <UButton
                  size="xs"
                  color="error"
                  variant="ghost"
                  icon="i-lucide-trash-2"
                  aria-label="Supprimer"
                  @click="toRemove = { exc: e, mode: 'delete' }"
                />
              </span>
            </li>
          </ul>
        </template>
      </UCollapsible>
    </section>

    <!-- ═══ Lieux ═══ -->
    <section
      v-if="tab === 'locations'"
      class="space-y-4"
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="max-w-2xl text-sm text-stone-500">
          Les emplacements où le camion s'installe. Les clients voient le nom, l'adresse et le plan d'accès.
        </p>
        <UButton
          icon="i-lucide-plus"
          label="Nouveau lieu"
          @click="openNewLocation"
        />
      </div>
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <UCard
          v-for="l in locations"
          :key="l.id"
          :ui="{ body: 'space-y-2' }"
          :class="l.archivedAt && 'opacity-70'"
        >
          <div class="flex items-start justify-between gap-2">
            <h3 class="font-semibold">
              {{ l.name }}
            </h3>
            <UBadge
              v-if="l.archivedAt"
              color="neutral"
              variant="outline"
              label="archivé"
            />
          </div>
          <p class="text-sm text-stone-600">
            {{ l.address }}<br>{{ l.zip }} {{ l.city }}
          </p>
          <p
            v-if="l.notes"
            class="text-sm italic text-stone-500"
          >
            {{ l.notes }}
          </p>
          <p class="text-xs text-stone-400">
            {{ l.lat.toFixed(4) }}, {{ l.lng.toFixed(4) }} · {{ usageOf(l) }} jour{{ usageOf(l) > 1 ? 's' : '' }} de planning
          </p>
          <div class="flex flex-wrap gap-1 pt-1">
            <UButton
              size="sm"
              color="neutral"
              variant="outline"
              icon="i-lucide-pencil"
              label="Modifier"
              @click="openEditLocation(l)"
            />
            <UButton
              size="sm"
              color="neutral"
              variant="ghost"
              icon="i-lucide-map"
              label="Plan"
              :to="mapsUrl(l)"
              target="_blank"
            />
            <UButton
              v-if="l.archivedAt"
              size="sm"
              color="neutral"
              variant="ghost"
              icon="i-lucide-archive-restore"
              label="Restaurer"
              @click="restoreLocation(l)"
            />
            <UButton
              v-else
              size="sm"
              color="neutral"
              variant="ghost"
              icon="i-lucide-archive"
              aria-label="Archiver"
              @click="locToArchive = l"
            />
          </div>
        </UCard>
      </div>
    </section>

    <!-- ═══ Formulaire de saison ═══ -->
    <UModal
      v-model:open="seasonOpen"
      :title="seasonForm.id ? 'Modifier la saison' : seasonForm.source !== 'empty' ? 'Dupliquer une saison' : 'Nouvelle saison'"
      :description="seasonForm.isDefault ? 'La saison par défaut n\'a pas de dates : elle couvre toute l\'année.' : 'Par exemple « Été 2027 » du 1er juillet au 31 août.'"
    >
      <template #body>
        <div class="space-y-4">
          <UFormField
            label="Nom"
            required
          >
            <UInput
              v-model="seasonForm.name"
              placeholder="Été 2027"
              class="w-full"
            />
          </UFormField>
          <template v-if="!seasonForm.isDefault">
            <div class="grid grid-cols-2 gap-4">
              <UFormField
                label="Début"
                required
              >
                <UInput
                  v-model="seasonForm.startsOn"
                  type="date"
                  class="w-full"
                />
              </UFormField>
              <UFormField
                label="Fin (incluse)"
                required
                :error="seasonDatesInvalid ? 'La fin précède le début' : undefined"
              >
                <UInput
                  v-model="seasonForm.endsOn"
                  type="date"
                  class="w-full"
                />
              </UFormField>
            </div>
            <UFormField
              label="Priorité"
              help="Si deux saisons se chevauchent, la plus haute l'emporte."
            >
              <UInputNumber
                v-model="seasonForm.priority"
                class="w-32"
              />
            </UFormField>
          </template>
          <UFormField
            v-if="!seasonForm.id"
            label="Semaine type"
            help="Vous pourrez ajuster chaque jour ensuite."
          >
            <USelect
              v-model="seasonForm.source"
              :items="sourceItems"
              class="w-full"
            />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <AdminPublishBar
          class="w-full"
          :loading="pending"
          :disabled="!seasonValid"
          @save="saveSeason"
        />
      </template>
    </UModal>

    <!-- ═══ Formulaire d'exception ═══ -->
    <USlideover
      v-model:open="excOpen"
      :title="exc.id ? 'Modifier l\'exception' : 'Nouvelle exception'"
      description="Elle remplace le planning habituel sur les dates choisies."
      :ui="{ content: 'sm:max-w-xl' }"
    >
      <template #body>
        <div class="space-y-5">
          <URadioGroup
            v-model="exc.kind"
            :items="KIND_ITEMS"
            variant="card"
            legend="Que se passe-t-il ?"
          />

          <div class="grid grid-cols-2 gap-4">
            <UFormField
              label="Du"
              required
            >
              <UInput
                v-model="exc.startsOn"
                type="date"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Au (inclus)"
              required
              :error="excDatesInvalid ? 'La fin précède le début' : undefined"
            >
              <UInput
                v-model="exc.endsOn"
                type="date"
                class="w-full"
              />
            </UFormField>
          </div>

          <template v-if="needsLocation">
            <UFormField
              v-if="!exc.newLocation"
              label="Lieu"
              required
            >
              <USelect
                v-model="exc.locationId"
                :items="locationItems"
                placeholder="Choisir un lieu"
                class="w-full"
              />
            </UFormField>
            <UButton
              size="sm"
              color="neutral"
              variant="soft"
              :icon="exc.newLocation ? 'i-lucide-list' : 'i-lucide-plus'"
              :label="exc.newLocation ? 'Choisir un lieu existant' : 'Ajouter un nouveau lieu'"
              @click="exc.newLocation = !exc.newLocation"
            />
            <div
              v-if="exc.newLocation"
              class="space-y-3 rounded-lg border border-stone-200 bg-stone-50 p-3"
            >
              <UFormField
                label="Nom du lieu"
                required
              >
                <UInput
                  v-model="exc.loc.name"
                  placeholder="Salle des fêtes"
                  class="w-full"
                />
              </UFormField>
              <UFormField
                label="Adresse"
                required
              >
                <UInput
                  v-model="exc.loc.address"
                  class="w-full"
                />
              </UFormField>
              <div class="grid grid-cols-3 gap-3">
                <UFormField
                  label="Code postal"
                  required
                >
                  <UInput
                    v-model="exc.loc.zip"
                    inputmode="numeric"
                    maxlength="5"
                    class="w-full"
                  />
                </UFormField>
                <UFormField
                  label="Ville"
                  required
                  class="col-span-2"
                >
                  <UInput
                    v-model="exc.loc.city"
                    class="w-full"
                  />
                </UFormField>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <UFormField
                  label="Latitude"
                  required
                >
                  <UInput
                    v-model="exc.loc.lat"
                    inputmode="decimal"
                    placeholder="43.5361"
                    class="w-full"
                  />
                </UFormField>
                <UFormField
                  label="Longitude"
                  required
                >
                  <UInput
                    v-model="exc.loc.lng"
                    inputmode="decimal"
                    placeholder="3.8523"
                    class="w-full"
                  />
                </UFormField>
              </div>
              <p class="text-xs text-stone-500">
                Astuce : dans Google Maps, un appui long sur le lieu affiche ses coordonnées.
              </p>
            </div>
          </template>

          <div
            v-if="showTimes"
            class="grid grid-cols-2 gap-4"
          >
            <UFormField label="Ouverture">
              <UInput
                v-model="exc.opensAt"
                type="time"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Fermeture"
              help="Facultatif."
            >
              <UInput
                v-model="exc.closesAt"
                type="time"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField
            label="Message affiché au public"
            help="Facultatif, ex. « Congés annuels, retour le 3 septembre »."
          >
            <UTextarea
              v-model="exc.note"
              :rows="2"
              autoresize
              class="w-full"
            />
          </UFormField>
          <AdminTranslationsField
            v-model="exc.i18n"
            :fields="[{ key: 'note', label: 'Message', multiline: true }]"
          />

          <div class="space-y-2">
            <p class="text-sm font-medium">
              Aperçu
            </p>
            <AdminSchedulePreview
              :data="previewData"
              :from="excPreviewFrom"
              :days="excPreviewDays"
            />
          </div>

          <p
            v-if="excProblem"
            class="text-sm text-red-600"
          >
            {{ excProblem }}
          </p>
        </div>
      </template>
      <template #footer>
        <AdminPublishBar
          class="w-full"
          :loading="pending"
          :disabled="Boolean(excProblem)"
          @save="saveException"
        />
      </template>
    </USlideover>

    <!-- ═══ Formulaire de lieu ═══ -->
    <USlideover
      v-model:open="locOpen"
      :title="loc.id ? `Modifier ${loc.name}` : 'Nouveau lieu'"
      :ui="{ content: 'sm:max-w-lg' }"
    >
      <template #body>
        <div class="space-y-5">
          <UFormField
            label="Nom du lieu-dit"
            required
          >
            <UInput
              v-model="loc.name"
              placeholder="Parking Intermarché"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Adresse"
            required
          >
            <UInput
              v-model="loc.address"
              class="w-full"
            />
          </UFormField>
          <div class="grid grid-cols-3 gap-4">
            <UFormField
              label="Code postal"
              required
            >
              <UInput
                v-model="loc.zip"
                inputmode="numeric"
                maxlength="5"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Ville"
              required
              class="col-span-2"
            >
              <UInput
                v-model="loc.city"
                class="w-full"
              />
            </UFormField>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <UFormField
              label="Latitude"
              required
            >
              <UInput
                v-model="loc.lat"
                inputmode="decimal"
                placeholder="43.5361"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Longitude"
              required
            >
              <UInput
                v-model="loc.lng"
                inputmode="decimal"
                placeholder="3.8523"
                class="w-full"
              />
            </UFormField>
          </div>
          <p class="-mt-3 text-xs text-stone-500">
            Astuce : dans Google Maps, un appui long sur le lieu affiche ses coordonnées.
          </p>
          <UFormField
            label="Précisions"
            help="Facultatif, ex. « Au fond du parking, côté boulangerie »."
          >
            <UTextarea
              v-model="loc.notes"
              :rows="2"
              autoresize
              class="w-full"
            />
          </UFormField>
          <AdminTranslationsField
            v-model="loc.i18n"
            :fields="[{ key: 'name', label: 'Nom' }, { key: 'notes', label: 'Précisions', multiline: true }]"
          />
          <p
            v-if="locError"
            class="text-sm text-red-600"
          >
            {{ locError }}
          </p>
        </div>
      </template>
      <template #footer>
        <AdminPublishBar
          class="w-full"
          :loading="pending"
          :disabled="Boolean(locError)"
          @save="saveLocation"
        />
      </template>
    </USlideover>

    <AdminConfirm
      v-model:open="removeOpen"
      :title="toRemove?.mode === 'delete' ? 'Supprimer cette exception ?' : 'Archiver cette exception ?'"
      :description="toRemove?.mode === 'delete' ? 'Elle sera définitivement supprimée (la suppression reste visible dans l\'historique).' : 'Elle ne s\'appliquera plus au planning mais restera consultable dans l\'historique.'"
      :confirm-label="toRemove?.mode === 'delete' ? 'Supprimer' : 'Archiver'"
      :color="toRemove?.mode === 'delete' ? 'error' : 'warning'"
      :loading="pending"
      @confirm="remove"
    />
    <AdminConfirm
      v-model:open="locArchiveOpen"
      title="Archiver ce lieu ?"
      :description="locToArchive && usageOf(locToArchive) ? `« ${locToArchive.name} » est utilisé dans ${usageOf(locToArchive)} jour(s) de planning : ils resteront inchangés, mais le lieu ne sera plus proposé.` : `« ${locToArchive?.name} » ne sera plus proposé dans les formulaires.`"
      confirm-label="Archiver"
      color="warning"
      :loading="pending"
      @confirm="archiveLocation"
    />
    <AdminConfirm
      v-model:open="seasonArchiveOpen"
      title="Archiver cette saison ?"
      :description="`« ${seasonToArchive?.name} » ne s'appliquera plus au planning. Vous pourrez la restaurer.`"
      confirm-label="Archiver"
      color="warning"
      :loading="pending"
      @confirm="archiveSeason"
    />
  </AdminPage>
</template>
