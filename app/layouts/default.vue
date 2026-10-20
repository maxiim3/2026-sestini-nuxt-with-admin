<script setup lang="ts">
const head = useLocaleHead()
useHead(() => ({
  htmlAttrs: { lang: head.value.htmlAttrs.lang },
  link: head.value.link,
  meta: head.value.meta,
}))
</script>

<template>
  <div class="min-h-dvh bg-charbon-950 font-sans text-farine-100 antialiased">
    <SiteHeader />
    <main id="contenu">
      <slot />
    </main>
    <SiteFooter />
    <SiteCallBar />
    <SiteWelcomeModal />
  </div>
</template>
