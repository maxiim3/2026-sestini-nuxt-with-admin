<script setup lang="ts">
const head = useLocaleHead()
await useJsonLd('restaurant')
useHead(() => ({
  htmlAttrs: { lang: head.value.htmlAttrs.lang },
  link: head.value.link,
  meta: head.value.meta,
}))
</script>

<template>
  <div class="min-h-dvh bg-crema font-body text-nero antialiased">
    <SiteHeader />
    <SiteNotice />
    <main id="contenu">
      <slot />
    </main>
    <SiteFooter />
    <SiteCallBar />
    <SiteTitleFontSwitch />
  </div>
</template>
