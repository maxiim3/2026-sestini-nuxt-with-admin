<script setup lang="ts">
const { data } = useSite()
const { tr } = useLocalized()
const { t } = useI18n()
const localePath = useLocalePath()
const contact = useContact()

const message = computed(() => data.value?.modal ?? null)
const open = ref(false)
const storageKey = computed(() => message.value ? `sestini:modal:${message.value.id}:${message.value.updatedAt}` : '')

onMounted(() => {
  if (!message.value) return
  try {
    if (localStorage.getItem(storageKey.value)) return
  }
  catch { /* stockage indisponible : on affiche quand même */ }
  setTimeout(() => (open.value = true), 600)
})

function close() {
  open.value = false
  try {
    localStorage.setItem(storageKey.value, '1')
  }
  catch { /* rien à faire */ }
}

function ctaHref(href: string) {
  if (href.startsWith('tel:')) return contact.value.phoneHref
  if (href.startsWith('/')) return localePath(href)
  return href
}
</script>

<template>
  <!-- eslint-disable vue/no-v-html -- le corps est échappé par richText() -->
  <UModal
    v-if="message"
    v-model:open="open"
    :ui="{
      overlay: 'bg-charbon-950/70 backdrop-blur-md',
      content: 'max-w-lg overflow-hidden rounded-3xl bg-charbon-900 ring-1 ring-braise-400/30 text-farine-100 divide-y-0',
    }"
    :title="tr(message, 'title')"
    @update:open="v => !v && close()"
  >
    <template #content>
      <div class="grain relative">
        <div
          class="pointer-events-none absolute inset-x-0 -top-24 h-64 bg-[radial-gradient(closest-side,rgba(224,170,62,0.35),transparent)]"
          aria-hidden="true"
        />
        <button
          class="absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-full bg-white/5 text-farine-100 hover:bg-white/10"
          :aria-label="t('modal.close')"
          @click="close"
        >
          <UIcon
            name="i-lucide-x"
            class="size-5"
          />
        </button>
        <div class="relative px-7 pb-8 pt-10 text-center sm:px-10">
          <img
            src="/brand/emblem.svg"
            alt=""
            width="80"
            height="47"
            class="mx-auto mb-6 h-12 w-auto"
          >
          <p class="eyebrow mb-3 text-braise-300">
            Sestini Pizza
          </p>
          <h2 class="font-display text-2xl font-semibold leading-tight tracking-wide text-farine-50 sm:text-3xl">
            {{ tr(message, 'title') }}
          </h2>
          <img
            v-if="message.imageUrl"
            :src="message.imageUrl"
            alt=""
            class="mx-auto mt-6 max-h-64 rounded-2xl object-cover"
          >
          <div
            class="prose-modal mt-5 space-y-3 text-[15px] leading-relaxed text-farine-200/85 [&_strong]:font-semibold [&_strong]:text-farine-50"
            v-html="richText(tr(message, 'body'))"
          />
          <div
            v-if="message.ctas.length"
            class="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"
          >
            <a
              v-for="cta in message.ctas"
              :key="cta.href"
              :href="ctaHref(cta.href)"
              :class="cta.variant === 'secondary' ? 'btn-ghost text-farine-100' : 'btn-fire'"
              @click="close"
            >
              {{ cta.label }}
            </a>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
