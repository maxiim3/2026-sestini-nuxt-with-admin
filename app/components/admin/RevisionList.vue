<script setup lang="ts">
interface Revision {
  id: string
  entity: string
  entityId: string
  action: string
  authorType: string
  authorLabel: string | null
  message: string | null
  createdAt: string
  after: Record<string, unknown> | null
  before: Record<string, unknown> | null
}

defineProps<{ revisions: Revision[], restorable?: boolean }>()
const emit = defineEmits<{ restore: [id: string] }>()

const ENTITY_LABELS: Record<string, string> = {
  pizza: 'Pizza',
  pizzaIngredients: 'Ingrédients d\'une pizza',
  ingredient: 'Ingrédient',
  menu: 'Carte',
  menuItems: 'Composition de carte',
  featured: 'Pizza du moment',
  drink: 'Boisson',
  supplement: 'Supplément',
  dessert: 'Dessert',
  location: 'Lieu',
  season: 'Saison',
  scheduleSlots: 'Semaine type',
  scheduleException: 'Exception d\'horaires',
  modalMessage: 'Message',
  setting: 'Réglage',
}
const ACTION_LABELS: Record<string, string> = {
  create: 'création',
  update: 'modification',
  archive: 'archivage',
  restore: 'restauration',
  delete: 'suppression',
}

function label(r: Revision) {
  const data = (r.after ?? r.before ?? {}) as Record<string, unknown>
  return String(data.name ?? data.title ?? data.label ?? data.note ?? (r.entity === 'setting' ? r.entityId : ''))
}
</script>

<template>
  <ul class="divide-y divide-stone-100">
    <li
      v-for="r in revisions"
      :key="r.id"
      class="flex items-center gap-3 py-2.5 text-sm"
    >
      <UIcon
        :name="r.authorType === 'token' ? 'i-lucide-bot' : 'i-lucide-user'"
        class="size-4 shrink-0 text-stone-400"
      />
      <div class="min-w-0 flex-1">
        <p class="truncate">
          <span class="font-medium">{{ ENTITY_LABELS[r.entity] ?? r.entity }}</span>
          <span class="text-stone-500"> · {{ ACTION_LABELS[r.action] ?? r.action }}</span>
          <span
            v-if="label(r)"
            class="text-stone-700"
          > · {{ label(r) }}</span>
        </p>
        <p class="truncate text-xs text-stone-500">
          {{ dateTimeFr(r.createdAt) }} · {{ r.authorLabel }}<template v-if="r.message">
            · « {{ r.message }} »
          </template>
        </p>
      </div>
      <UButton
        v-if="restorable && r.before"
        size="xs"
        color="neutral"
        variant="outline"
        icon="i-lucide-undo-2"
        label="Restaurer"
        @click="emit('restore', r.id)"
      />
    </li>
    <li
      v-if="!revisions.length"
      class="py-6 text-center text-sm text-stone-500"
    >
      Aucune modification pour l'instant.
    </li>
  </ul>
</template>
