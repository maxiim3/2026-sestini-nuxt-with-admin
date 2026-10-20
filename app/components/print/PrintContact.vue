<script setup lang="ts">
import type { PrintText } from '~/utils/print-text'

/** Pied de document : téléphone en grand, conditions de retrait, site et Instagram */
const props = defineProps<{
  text: PrintText
  contact: { phone: string, instagram: string }
  size?: 'sm' | 'md' | 'lg'
}>()

const handle = computed(() => {
  const slug = props.contact.instagram.replace(/\/+$/, '').split('/').pop()
  return slug ? `@${slug}` : ''
})
</script>

<template>
  <div
    class="pr-contact"
    :class="`pr-contact--${size ?? 'md'}`"
  >
    <p class="pr-eyebrow pr-contact__label">
      {{ text.t('orderByPhone') }}
    </p>
    <p class="pr-contact__phone">
      {{ contact.phone }}
    </p>
    <p class="pr-contact__meta">
      <span>{{ text.t('pickup') }}</span>
      <span class="pr-dot" />
      <span>{{ PRINT_SITE_HOST }}</span>
      <template v-if="handle">
        <span class="pr-dot" />
        <span>{{ handle }}</span>
      </template>
    </p>
  </div>
</template>
