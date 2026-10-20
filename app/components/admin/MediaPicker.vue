<script setup lang="ts">
/** Choix ou import d'une photo ; le modèle est l'URL de l'image */
const model = defineModel<string | null | undefined>({ required: true })
const props = withDefaults(defineProps<{ tag?: string }>(), { tag: '' })
const toast = useToast()
const open = ref(false)
const uploading = ref(false)
const { data: media, refresh } = useFetch('/api/admin/media', { key: 'admin-media', immediate: false })

watch(open, v => v && refresh())

/** Lit les dimensions avant l'envoi, pour réserver la place à l'affichage */
function dimensions(file: File) {
  return new Promise<{ width: number, height: number }>((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve({ width: 0, height: 0 })
    img.src = URL.createObjectURL(file)
  })
}

async function upload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const { width, height } = await dimensions(file)
    const body = new FormData()
    body.append('file', file)
    body.append('width', String(width))
    body.append('height', String(height))
    if (props.tag) body.append('tags', props.tag)
    const row = await $fetch('/api/admin/media', { method: 'POST', body })
    model.value = row!.url
    open.value = false
    toast.add({ title: 'Photo importée', color: 'success' })
  }
  catch (e) {
    const err = e as { data?: { statusMessage?: string } }
    toast.add({ title: 'Import impossible', description: err.data?.statusMessage, color: 'error' })
  }
  finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="flex items-center gap-3">
    <div class="grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
      <img
        v-if="model"
        :src="model"
        alt=""
        class="size-full object-cover"
      >
      <UIcon
        v-else
        name="i-lucide-image"
        class="size-6 text-stone-300"
      />
    </div>
    <div class="flex flex-wrap gap-2">
      <UButton
        size="sm"
        color="neutral"
        variant="outline"
        icon="i-lucide-images"
        :label="model ? 'Changer' : 'Choisir une photo'"
        @click="open = true"
      />
      <UButton
        v-if="model"
        size="sm"
        color="neutral"
        variant="ghost"
        icon="i-lucide-x"
        label="Retirer"
        @click="model = null"
      />
    </div>

    <UModal
      v-model:open="open"
      title="Photos"
      description="Choisissez une photo existante ou importez-en une (JPEG, PNG, WebP, 8 Mo max)."
      :ui="{ content: 'max-w-3xl' }"
    >
      <template #body>
        <label class="mb-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 p-6 text-sm text-stone-600 hover:border-braise-400 hover:bg-braise-50">
          <UIcon
            :name="uploading ? 'i-lucide-loader-circle' : 'i-lucide-upload'"
            :class="uploading && 'animate-spin'"
            class="size-5"
          />
          {{ uploading ? 'Import…' : 'Importer une photo' }}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            class="sr-only"
            :disabled="uploading"
            @change="upload"
          >
        </label>
        <div
          v-if="media?.length"
          class="grid grid-cols-3 gap-3 sm:grid-cols-4"
        >
          <button
            v-for="m in media"
            :key="m.id"
            class="aspect-square overflow-hidden rounded-lg ring-2 ring-transparent hover:ring-braise-400"
            :class="model === m.url && '!ring-braise-500'"
            @click="model = m.url; open = false"
          >
            <img
              :src="m.url"
              :alt="m.alt ?? ''"
              class="size-full object-cover"
              loading="lazy"
            >
          </button>
        </div>
        <p
          v-else
          class="text-center text-sm text-stone-500"
        >
          Aucune photo pour l'instant.
        </p>
      </template>
    </UModal>
  </div>
</template>
