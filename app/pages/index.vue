<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
await useSite()

useSeoMeta({
  title: 'Sestini Pizza · Pizza au feu de bois près de Montpellier',
  description: () => t('brand.pitch'),
})
</script>

<template>
  <section class="grain relative grid min-h-dvh place-items-center overflow-hidden px-4 pt-20">
    <div
      class="pointer-events-none absolute inset-x-0 bottom-0 h-[70vh] bg-[radial-gradient(ellipse_at_bottom,rgba(224,170,62,0.28),transparent_60%)]"
      aria-hidden="true"
    />
    <div class="relative text-center">
      <img
        src="/brand/logo.svg"
        alt="Sestini Pizza, la pizza au feu de bois"
        width="560"
        height="247"
        class="mx-auto h-auto w-[min(560px,85vw)]"
      >
      <p class="mx-auto mt-8 max-w-lg font-serif text-xl italic text-farine-200/80">
        {{ t('home.heroLead') }}
      </p>
      <div class="mt-8 flex justify-center">
        <SiteTonightPill />
      </div>
      <div class="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
        <NuxtLink
          :to="localePath('la-carte')"
          class="btn-fire"
        >
          {{ t('home.seeMenu') }}
        </NuxtLink>
        <NuxtLink
          :to="localePath('nous-trouver')"
          class="btn-ghost text-farine-100"
        >
          {{ t('home.findUs') }}
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
