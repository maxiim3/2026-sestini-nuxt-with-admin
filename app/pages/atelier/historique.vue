<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin', i18n: false })
useHead({ title: 'Historique · Atelier' })

const entity = ref<string | undefined>(undefined)
const { data } = await useFetch('/api/admin/revisions', { query: { entity, limit: 200 }, key: 'admin-revisions' })
const { apply } = useAdminWrite()

const FILTERS = [
  { label: 'Tout', value: undefined },
  { label: 'Pizzas', value: 'pizza' },
  { label: 'Cartes', value: 'menuItems' },
  { label: 'Pizza du moment', value: 'featured' },
  { label: 'Horaires', value: 'scheduleSlots' },
  { label: 'Exceptions', value: 'scheduleException' },
  { label: 'Messages', value: 'modalMessage' },
  { label: 'Réglages', value: 'setting' },
]

async function restore(id: string) {
  await apply('Restauration d\'une version précédente', [{ op: 'restoreRevision', revisionId: id }])
}
</script>

<template>
  <AdminPage
    title="Historique"
    description="Chaque modification est conservée. « Restaurer » remet l'élément dans l'état d'avant cette modification (et crée elle-même une entrée d'historique)."
  >
    <div class="flex flex-wrap gap-2">
      <UButton
        v-for="f in FILTERS"
        :key="f.label"
        size="sm"
        :variant="entity === f.value ? 'solid' : 'outline'"
        :color="entity === f.value ? 'primary' : 'neutral'"
        :label="f.label"
        @click="entity = f.value"
      />
    </div>
    <UCard>
      <AdminRevisionList
        :revisions="data ?? []"
        restorable
        @restore="restore"
      />
    </UCard>
  </AdminPage>
</template>
