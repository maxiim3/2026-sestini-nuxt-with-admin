<script setup lang="ts">
/** Petite confirmation avant une action destructrice (archivage, suppression) */
withDefaults(defineProps<{
  title: string
  description?: string
  confirmLabel?: string
  color?: 'error' | 'warning' | 'primary'
  loading?: boolean
}>(), { confirmLabel: 'Confirmer', color: 'error' })
const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ confirm: [] }>()
</script>

<template>
  <UModal
    v-model:open="open"
    :title="title"
    :description="description"
  >
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="outline"
          label="Annuler"
          @click="open = false"
        />
        <UButton
          :color="color"
          :label="confirmLabel"
          :loading="loading"
          @click="emit('confirm')"
        />
      </div>
    </template>
  </UModal>
</template>
