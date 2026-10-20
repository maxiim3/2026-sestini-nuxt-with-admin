<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin', i18n: false })
useHead({ title: 'Brouillons · Atelier' })

const toast = useToast()
const tab = ref<'draft' | 'published' | 'discarded'>('draft')
const { data, refresh } = await useFetch('/api/admin/changesets', { query: { status: tab }, key: 'admin-changesets' })
const busy = ref<string | null>(null)

async function decide(id: string, action: 'publish' | 'discard') {
  busy.value = id
  try {
    await $fetch(`/api/admin/changesets/${id}`, { method: 'POST', body: { action } })
    toast.add({ title: action === 'publish' ? 'Brouillon publié' : 'Brouillon rejeté', color: action === 'publish' ? 'success' : 'neutral' })
    await refresh()
    await refreshNuxtData('admin-drafts')
  }
  catch (e) {
    const err = e as { data?: { data?: { message?: string }, statusMessage?: string } }
    toast.add({ title: 'Échec', description: err.data?.data?.message ?? err.data?.statusMessage, color: 'error' })
    await refresh()
  }
  finally {
    busy.value = null
  }
}

const OP_LABELS: Record<string, string> = {
  create: 'Créer',
  update: 'Modifier',
  archive: 'Archiver',
  restore: 'Désarchiver',
  delete: 'Supprimer',
  setPizzaIngredients: 'Ingrédients de la pizza',
  setScheduleSlots: 'Semaine type',
  setMenuItems: 'Composition de la carte',
  activateMenu: 'Mettre une carte en ligne',
  setSetting: 'Réglage',
  restoreRevision: 'Restaurer une révision',
}
function describe(op: Record<string, unknown>) {
  const label = OP_LABELS[String(op.op)] ?? String(op.op)
  return op.entity ? `${label} · ${op.entity}` : label
}
</script>

<template>
  <AdminPage
    title="Brouillons"
    description="Les modifications proposées (par l'IA ou mises de côté) attendent ici votre validation. Rien n'est en ligne tant que ce n'est pas publié."
  >
    <UTabs
      v-model="tab"
      :items="[
        { label: 'À valider', value: 'draft', icon: 'i-lucide-inbox' },
        { label: 'Publiés', value: 'published', icon: 'i-lucide-check' },
        { label: 'Rejetés', value: 'discarded', icon: 'i-lucide-x' },
      ]"
      :content="false"
      class="w-full max-w-md"
    />

    <div class="space-y-4">
      <UCard
        v-for="cs in data"
        :key="cs.id"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="font-semibold">
              {{ cs.title }}
            </p>
            <p class="text-sm text-stone-500">
              <UIcon
                :name="cs.authorType === 'token' ? 'i-lucide-bot' : 'i-lucide-user'"
                class="mr-1 inline size-3.5 align-[-2px]"
              />
              {{ cs.authorLabel }} · {{ dateTimeFr(cs.createdAt) }}
              <template v-if="cs.decidedAt">
                · {{ cs.status === 'published' ? 'publié' : 'rejeté' }} par {{ cs.decidedBy }}
              </template>
            </p>
          </div>
          <div
            v-if="cs.status === 'draft'"
            class="flex gap-2"
          >
            <UButton
              color="neutral"
              variant="outline"
              label="Rejeter"
              :loading="busy === cs.id"
              @click="decide(cs.id, 'discard')"
            />
            <UButton
              icon="i-lucide-send"
              label="Publier"
              :loading="busy === cs.id"
              @click="decide(cs.id, 'publish')"
            />
          </div>
        </div>
        <UAlert
          v-if="cs.error"
          class="mt-3"
          color="error"
          variant="subtle"
          :description="cs.error"
        />
        <details class="mt-3">
          <summary class="cursor-pointer text-sm text-stone-600">
            {{ cs.operations.length }} opération{{ cs.operations.length > 1 ? 's' : '' }}
          </summary>
          <ol class="mt-2 space-y-2">
            <li
              v-for="(op, i) in cs.operations as Record<string, unknown>[]"
              :key="i"
              class="rounded-lg bg-stone-50 p-3 text-sm"
            >
              <p class="font-medium">
                {{ describe(op) }}
              </p>
              <pre class="mt-1 overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs text-stone-600">{{ JSON.stringify(op.data ?? op, null, 2) }}</pre>
            </li>
          </ol>
        </details>
      </UCard>
      <p
        v-if="!data?.length"
        class="py-12 text-center text-stone-500"
      >
        Rien ici pour le moment.
      </p>
    </div>
  </AdminPage>
</template>
