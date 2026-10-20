<script setup lang="ts">
/** Saisie des traductions EN / ES / IT d'une liste de champs */
type Tr = Partial<Record<'en' | 'es' | 'it', Record<string, string>>>
const props = defineProps<{ fields: { key: string, label: string, multiline?: boolean }[] }>()
const model = defineModel<Tr | null | undefined>({ required: true })

const LANGS = [
  { code: 'en', label: 'Anglais' },
  { code: 'es', label: 'Espagnol' },
  { code: 'it', label: 'Italien' },
] as const

function get(lang: 'en' | 'es' | 'it', key: string) {
  return model.value?.[lang]?.[key] ?? ''
}
function set(lang: 'en' | 'es' | 'it', key: string, value: string) {
  const next: Tr = structuredClone(toRaw(model.value) ?? {})
  const entries = Object.entries({ ...(next[lang] ?? {}), [key]: value }).filter(([, v]) => v)
  next[lang] = Object.fromEntries(entries)
  model.value = next
}
const filled = computed(() => LANGS.filter(l => props.fields.some(f => get(l.code, f.key))).length)
</script>

<template>
  <UCollapsible class="rounded-lg border border-stone-200">
    <UButton
      color="neutral"
      variant="ghost"
      block
      class="justify-between"
      trailing-icon="i-lucide-chevron-down"
    >
      <span class="flex items-center gap-2">
        <UIcon
          name="i-lucide-languages"
          class="size-4"
        />
        Traductions
        <UBadge
          size="sm"
          variant="subtle"
          :color="filled === 3 ? 'success' : 'neutral'"
          :label="`${filled}/3`"
        />
      </span>
    </UButton>
    <template #content>
      <div class="space-y-4 p-3 pt-1">
        <div
          v-for="lang in LANGS"
          :key="lang.code"
          class="space-y-2"
        >
          <p class="text-xs font-semibold uppercase tracking-wider text-stone-500">
            {{ lang.label }}
          </p>
          <template
            v-for="f in fields"
            :key="f.key"
          >
            <UTextarea
              v-if="f.multiline"
              :model-value="get(lang.code, f.key)"
              :placeholder="f.label"
              :rows="3"
              autoresize
              class="w-full"
              @update:model-value="v => set(lang.code, f.key, String(v))"
            />
            <UInput
              v-else
              :model-value="get(lang.code, f.key)"
              :placeholder="f.label"
              class="w-full"
              @update:model-value="v => set(lang.code, f.key, String(v))"
            />
          </template>
        </div>
      </div>
    </template>
  </UCollapsible>
</template>
