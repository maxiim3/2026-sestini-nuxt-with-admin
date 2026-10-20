<script setup lang="ts">
const { t } = useI18n()
const contact = useContact()
const localePath = useLocalePath()
</script>

<template>
  <div class="fixed inset-x-0 bottom-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
    <div class="flex items-center gap-2 rounded-full border border-white/10 bg-charbon-950/85 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl">
      <NuxtLink
        :to="localePath('nous-trouver')"
        class="flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-sm font-medium text-farine-100"
      >
        <UIcon
          name="i-lucide-map-pin"
          class="size-4 text-braise-300"
        />
        {{ t('nav.findUs') }}
      </NuxtLink>
      <a
        :href="contact.phoneHref"
        class="btn-fire flex-[1.3] !py-3 text-sm"
        data-track="call_clicked"
        data-track-source="call-bar"
      >
        <UIcon
          name="i-lucide-phone"
          class="size-4"
        />
        {{ t('nav.call') }}
      </a>
    </div>
  </div>
</template>
