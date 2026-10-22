<script setup lang="ts">
/** Aperçu fidèle du bandeau de message du site public (voir SiteNotice) */
const props = defineProps<{
  title: string
  body: string
  imageUrl?: string | null
  ctas: { label: string, href: string, variant?: 'primary' | 'secondary' }[]
}>()

const summary = computed(() => (props.body.split(/\n\s*\n/)[0] ?? '').replace(/\*\*|__|\*|_/g, '').trim())
const link = computed(() => props.ctas.find(c => !c.href.startsWith('tel:')))
</script>

<template>
  <div class="w-full overflow-hidden rounded-xl ring-1 ring-stone-200">
    <div class="flex h-10 items-center gap-2 bg-[#131110] px-4">
      <img
        src="/brand/emblem.svg"
        alt=""
        width="30"
        height="18"
        class="h-4 w-auto"
      >
      <span class="font-display text-xs font-semibold text-[#f4efe6]">Sestini PIZZA</span>
    </div>
    <div class="grid grid-cols-[1fr_auto] items-start gap-x-3 gap-y-1.5 bg-[#9e2b1e] px-4 py-2.5 text-sm text-[#f4efe6]">
      <p>
        <b class="font-semibold">{{ title || 'Titre du message' }}</b>
        <span class="ml-1 opacity-90">{{ summary || 'Le premier paragraphe de votre message apparaîtra ici.' }}</span>
      </p>
      <UIcon
        name="i-lucide-x"
        class="mt-0.5 size-4"
      />
      <span
        v-if="link"
        class="font-semibold underline underline-offset-3"
      >{{ link.label || 'Lien' }} →</span>
    </div>
    <div class="h-16 bg-[#f4efe6]" />
    <p
      v-if="imageUrl"
      class="bg-stone-50 px-4 py-2 text-xs text-stone-500"
    >
      L'image n'apparaît pas dans le bandeau du site.
    </p>
  </div>
</template>
