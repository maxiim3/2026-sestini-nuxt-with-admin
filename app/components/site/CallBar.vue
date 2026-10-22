<script setup lang="ts">
const { t } = useI18n()
const contact = useContact()
const localePath = useLocalePath()
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-40 grid grid-cols-[1fr_1fr_1.3fr] border-t border-nero-line bg-nero pb-[env(safe-area-inset-bottom)] text-crema md:hidden"
    :aria-label="t('nav.callFull')"
  >
    <NuxtLink
      :to="localePath('la-carte')"
      class="flex h-17 flex-col items-center justify-center gap-1 text-xs font-semibold"
      active-class="text-abricot"
    >
      <UIcon
        name="i-lucide-menu"
        class="size-[18px]"
      />
      {{ t('nav.menu') }}
    </NuxtLink>
    <NuxtLink
      :to="localePath('nous-trouver')"
      class="flex h-17 flex-col items-center justify-center gap-1 text-xs font-semibold"
      active-class="text-abricot"
    >
      <UIcon
        name="i-lucide-map-pin"
        class="size-[18px]"
      />
      {{ t('nav.findUs') }}
    </NuxtLink>
    <a
      :href="contact.phoneHref"
      class="flex h-17 items-center justify-center gap-2 bg-rosso text-[15px] font-semibold"
      data-track="call_clicked"
      data-track-source="call-bar"
    >
      <UIcon
        name="i-lucide-phone"
        class="size-[18px]"
      />
      {{ t('nav.call') }}
    </a>
  </nav>
</template>
