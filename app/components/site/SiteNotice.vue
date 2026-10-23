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

/** Hauteur du bandeau exposée en --notice-h : la photo de l'accueil la retire pour tenir dans l'écran */
const el = useTemplateRef<HTMLElement>('el')
let observer: ResizeObserver | undefined
watch(el, (node) => {
  observer?.disconnect()
  const root = document.documentElement
  if (!node) {
    root.style.removeProperty('--notice-h')
    return
  }
  const update = () => root.style.setProperty('--notice-h', `${node.offsetHeight}px`)
  update()
  observer = new ResizeObserver(update)
  observer.observe(node)
}, { flush: 'post' })
onBeforeUnmount(() => {
  observer?.disconnect()
  document.documentElement.style.removeProperty('--notice-h')
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
    ref="el"
    class="bg-rosso text-[13px] text-crema md:text-sm"
    role="status"
  >
    <div class="mx-auto flex max-w-[1200px] items-center gap-x-3 px-5 py-2 md:py-2.5 lg:px-10">
      <!-- Sur mobile, le titre et le lien seulement : le bandeau tient sur une ou deux lignes -->
      <p class="min-w-0 flex-1">
        <b class="font-semibold">{{ tr(message, 'title') }}</b>
        <span
          v-if="summary"
          class="ml-1 hidden opacity-90 md:inline"
        >{{ summary }}</span>
      </p>
      <NuxtLink
        v-if="link"
        :to="link.to"
        class="shrink-0 font-semibold underline underline-offset-3"
      >
        {{ link.label }} →
      </NuxtLink>
      <button
        class="-mr-1.5 grid size-7 shrink-0 place-items-center"
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
