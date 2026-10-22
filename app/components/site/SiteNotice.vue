<script setup lang="ts">
const { data } = useSite()
const { tr } = useLocalized()
const { t } = useI18n()
const localePath = useLocalePath()

/** Message programmé dans l'atelier (« Messages »), affiché en bandeau sous l'en-tête */
const message = computed(() => data.value?.modal ?? null)
const dismissed = ref(true)
const storageKey = computed(() => message.value ? `sestini:notice:${message.value.id}:${message.value.updatedAt}` : '')

/** Une ligne lisible : le premier paragraphe du message, sans mise en forme */
const summary = computed(() => {
  if (!message.value) return ''
  const first = tr(message.value, 'body').split(/\n\s*\n/)[0] ?? ''
  return first.replace(/\*\*|__|\*|_/g, '').trim()
})

/** Premier bouton du message qui mène à une page du site (l'appel est déjà dans la barre et l'en-tête) */
const link = computed(() => {
  const cta = message.value?.ctas.find(c => !c.href.startsWith('tel:'))
  if (!cta) return null
  return { label: cta.label, to: cta.href.startsWith('/') ? localePath(cta.href) : cta.href }
})

onMounted(() => {
  if (!message.value) return
  try {
    dismissed.value = Boolean(localStorage.getItem(storageKey.value))
  }
  catch {
    dismissed.value = false
  }
})

function close() {
  dismissed.value = true
  try {
    localStorage.setItem(storageKey.value, '1')
  }
  catch { /* stockage indisponible : le bandeau reviendra à la prochaine visite */ }
}
</script>

<template>
  <div
    v-if="message && !dismissed"
    class="bg-rosso text-sm text-crema"
    role="status"
  >
    <div class="mx-auto grid max-w-[1200px] grid-cols-[1fr_auto] items-start gap-x-3 gap-y-1.5 px-5 py-2.5 md:flex md:items-center lg:px-10">
      <p class="md:flex-1">
        <b class="font-semibold">{{ tr(message, 'title') }}</b>
        <span
          v-if="summary"
          class="ml-1 opacity-90"
        >{{ summary }}</span>
      </p>
      <NuxtLink
        v-if="link"
        :to="link.to"
        class="col-start-1 row-start-2 w-max font-semibold underline underline-offset-3 md:shrink-0"
      >
        {{ link.label }} →
      </NuxtLink>
      <button
        class="col-start-2 row-start-1 grid size-7 place-items-center"
        :aria-label="t('notice.close')"
        @click="close"
      >
        <UIcon
          name="i-lucide-x"
          class="size-4"
        />
      </button>
    </div>
  </div>
</template>
