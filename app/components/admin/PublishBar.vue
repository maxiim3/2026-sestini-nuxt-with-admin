<script setup lang="ts">
/** Boutons d'enregistrement : publication directe ou brouillon à valider */
defineProps<{ loading?: boolean, disabled?: boolean }>()
const emit = defineEmits<{ save: [mode: 'publish' | 'draft'] }>()
</script>

<template>
  <div class="flex flex-wrap justify-end gap-2">
    <UButton
      color="neutral"
      variant="outline"
      icon="i-lucide-file-pen"
      label="Enregistrer en brouillon"
      :loading="loading"
      :disabled="disabled"
      @click="emit('save', 'draft')"
    />
    <UButton
      icon="i-lucide-send"
      label="Publier"
      :loading="loading"
      :disabled="disabled"
      @click="emit('save', 'publish')"
    />
  </div>
</template>
