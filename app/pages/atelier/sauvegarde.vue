<script setup lang="ts">
import { type BackupChange, CHANGE_LABELS, type ChangeKind } from '~~/shared/backup'

definePageMeta({ layout: 'admin', middleware: 'admin', i18n: false })
useHead({ title: 'Sauvegarde · Atelier' })

interface Summary {
  sections: { section: string, label: string, changes: BackupChange[] }[]
  total: number
  warnings: string[]
  fingerprint: string
}

const toast = useToast()
const { user } = useUserSession()
/** L'import peut archiver toute la carte : il est réservé au propriétaire */
const isOwner = computed(() => user.value?.role === 'owner')
const file = ref<File | null>(null)
const input = useTemplateRef<HTMLInputElement>('input')
const summary = ref<Summary | null>(null)
const errors = ref<string[]>([])
const reading = ref(false)
const importing = ref(false)
const confirmOpen = ref(false)

const KIND_COLORS: Record<ChangeKind, 'success' | 'info' | 'warning' | 'error' | 'neutral'> = {
  create: 'success',
  update: 'info',
  restore: 'neutral',
  archive: 'warning',
  delete: 'error',
}

const counts = computed(() => {
  const all = summary.value?.sections.flatMap(s => s.changes) ?? []
  return (Object.keys(CHANGE_LABELS) as ChangeKind[])
    .map(kind => ({ kind, n: all.filter(c => c.kind === kind).length }))
    .filter(c => c.n)
})

function body() {
  const data = new FormData()
  data.append('file', file.value!)
  if (summary.value) data.append('fingerprint', summary.value.fingerprint)
  return data
}

function reset() {
  file.value = null
  summary.value = null
  errors.value = []
  if (input.value) input.value.value = ''
}

async function pick(event: Event) {
  const picked = (event.target as HTMLInputElement).files?.[0]
  if (!picked) return
  file.value = picked
  summary.value = null
  errors.value = []
  reading.value = true
  try {
    summary.value = await $fetch<Summary>('/api/admin/backup/preview', { method: 'POST', body: body() })
  }
  catch (e) {
    const err = e as { data?: { data?: { errors?: string[] }, statusMessage?: string } }
    errors.value = err.data?.data?.errors ?? [err.data?.statusMessage ?? String(e)]
  }
  finally {
    reading.value = false
  }
}

async function confirmImport() {
  importing.value = true
  try {
    const result = await $fetch('/api/admin/backup/import', { method: 'POST', body: body() })
    confirmOpen.value = false
    toast.add({
      title: 'Import publié',
      description: `${result?.revisions ?? 0} modification${(result?.revisions ?? 0) > 1 ? 's' : ''} enregistrée${(result?.revisions ?? 0) > 1 ? 's' : ''} dans l'historique.`,
      color: 'success',
      icon: 'i-lucide-check',
    })
    reset()
    await refreshNuxtData()
  }
  catch (e) {
    confirmOpen.value = false
    const err = e as { data?: { data?: { message?: string }, statusMessage?: string } }
    toast.add({ title: 'Import impossible', description: err.data?.data?.message ?? err.data?.statusMessage ?? String(e), color: 'error', icon: 'i-lucide-triangle-alert' })
  }
  finally {
    importing.value = false
  }
}
</script>

<template>
  <AdminPage
    title="Sauvegarde"
    description="Téléchargez tout le contenu du site pour le garder de côté ou le modifier dans un tableur, puis réimportez-le. Les comptes, les jetons d'accès et le journal ne sont jamais exportés."
  >
    <div class="grid shrink-0 items-start gap-6 xl:grid-cols-2 [&>*]:min-w-0">
      <UCard>
        <template #header>
          <h2 class="font-display text-lg font-semibold tracking-wide">
            Exporter
          </h2>
          <p class="text-xs text-stone-500">
            Cartes et pizzas, ingrédients et allergènes, pizzas du moment, boissons, suppléments, desserts, lieux et horaires, exceptions, messages du bandeau et réglages, archives comprises.
          </p>
        </template>
        <div class="space-y-4">
          <div class="flex flex-wrap gap-2">
            <UButton
              to="/api/admin/backup?format=xlsx"
              external
              download
              icon="i-lucide-file-spreadsheet"
              label="Télécharger en Excel"
            />
            <UButton
              to="/api/admin/backup?format=json"
              external
              download
              color="neutral"
              variant="outline"
              icon="i-lucide-file-json"
              label="Télécharger en JSON"
            />
          </div>
          <ul class="list-disc space-y-1 pl-5 text-sm text-stone-500">
            <li>
              <strong class="font-medium text-stone-700">Excel</strong> : un onglet par type de données, à ouvrir et modifier dans un tableur. L'onglet « Lisez-moi » rappelle les règles.
            </li>
            <li>
              <strong class="font-medium text-stone-700">JSON</strong> : la sauvegarde complète, pour restaurer le site à l'identique.
            </li>
          </ul>
        </div>
      </UCard>

      <UCard v-if="isOwner">
        <template #header>
          <h2 class="font-display text-lg font-semibold tracking-wide">
            Importer
          </h2>
          <p class="text-xs text-stone-500">
            Déposez un fichier exporté ici (Excel ou JSON). Un récapitulatif des changements s'affiche ; rien n'est modifié avant votre confirmation.
          </p>
        </template>
        <div class="space-y-4">
          <div class="flex flex-wrap items-center gap-3">
            <UButton
              icon="i-lucide-upload"
              color="neutral"
              variant="outline"
              :label="file ? 'Choisir un autre fichier' : 'Choisir un fichier'"
              :loading="reading"
              @click="input?.click()"
            />
            <span
              v-if="file"
              class="min-w-0 truncate text-sm text-stone-600"
            >{{ file.name }}</span>
            <input
              ref="input"
              type="file"
              accept=".xlsx,.json,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              class="hidden"
              @change="pick"
            >
          </div>
          <p class="text-xs text-stone-500">
            Une ligne retirée du fichier est archivée sur le site (supprimée pour les pizzas du moment, exceptions et messages). Chaque changement importé est enregistré dans l'<NuxtLink
              to="/atelier/historique"
              class="underline"
            >historique</NuxtLink> et peut y être annulé.
          </p>
        </div>
      </UCard>
      <UAlert
        v-else
        icon="i-lucide-lock"
        color="neutral"
        variant="subtle"
        title="Import réservé au propriétaire"
        description="Un import peut modifier ou archiver toute la carte. Demandez au propriétaire de l'atelier de l'effectuer."
      />
    </div>

    <UAlert
      v-if="errors.length"
      class="shrink-0"
      color="error"
      variant="subtle"
      icon="i-lucide-file-x"
      title="Ce fichier ne peut pas être importé"
    >
      <template #description>
        <ul class="mt-1 list-disc space-y-1 pl-5">
          <li
            v-for="(e, i) in errors"
            :key="i"
          >
            {{ e }}
          </li>
        </ul>
      </template>
    </UAlert>

    <UCard
      v-if="summary"
      class="shrink-0"
    >
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="font-display text-lg font-semibold tracking-wide">
              Récapitulatif avant import
            </h2>
            <p class="text-xs text-stone-500">
              {{ file?.name }}
            </p>
          </div>
          <div
            v-if="summary.total"
            class="flex flex-wrap gap-2"
          >
            <UBadge
              v-for="c in counts"
              :key="c.kind"
              :color="KIND_COLORS[c.kind]"
              variant="subtle"
              :label="`${CHANGE_LABELS[c.kind]}${c.n > 1 ? 's' : ''} : ${c.n}`"
            />
          </div>
        </div>
      </template>

      <p
        v-if="!summary.total"
        class="py-6 text-center text-stone-500"
      >
        Ce fichier est identique au contenu du site : rien à importer.
      </p>

      <div
        v-else
        class="space-y-5"
      >
        <section
          v-for="group in summary.sections"
          :key="group.section"
        >
          <h3 class="mb-2 text-sm font-semibold">
            {{ group.label }}
            <span class="font-normal text-stone-500">· {{ group.changes.length }}</span>
          </h3>
          <ul class="divide-y divide-stone-100 rounded-lg border border-stone-200">
            <li
              v-for="(c, i) in group.changes"
              :key="i"
              class="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-3 py-2 text-sm"
            >
              <UBadge
                :color="KIND_COLORS[c.kind]"
                variant="subtle"
                size="sm"
                :label="CHANGE_LABELS[c.kind]"
                class="shrink-0"
              />
              <span class="font-medium">{{ c.label }}</span>
              <span
                v-if="c.fields?.length"
                class="text-stone-500"
              >{{ c.fields.join(', ') }}</span>
            </li>
          </ul>
        </section>
      </div>

      <UAlert
        v-for="(w, i) in summary.warnings"
        :key="i"
        class="mt-4"
        color="neutral"
        variant="subtle"
        icon="i-lucide-info"
        :description="w"
      />

      <template #footer>
        <div class="flex flex-wrap justify-end gap-2">
          <UButton
            color="neutral"
            variant="outline"
            label="Annuler"
            @click="reset"
          />
          <UButton
            v-if="summary.total"
            icon="i-lucide-send"
            :label="`Importer ${summary.total} changement${summary.total > 1 ? 's' : ''}`"
            @click="confirmOpen = true"
          />
        </div>
      </template>
    </UCard>

    <AdminConfirm
      v-model:open="confirmOpen"
      title="Importer ce fichier ?"
      :description="`${summary?.total ?? 0} changement${(summary?.total ?? 0) > 1 ? 's' : ''} seront publiés sur le site. Ils restent annulables depuis l'historique.`"
      confirm-label="Importer"
      color="primary"
      :loading="importing"
      @confirm="confirmImport"
    />
  </AdminPage>
</template>
