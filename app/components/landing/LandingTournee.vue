<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <section class="grain relative grid min-h-dvh place-items-center overflow-hidden px-4 pt-20">
    <div class="relative text-center">
      <img
        src="/brand/logo.svg"
        alt="Sestini Pizza, la pizza au feu de bois"
        width="560"
        height="247"
        class="mx-auto h-auto w-[min(560px,85vw)]"
      >
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
      </div>
    </div>
  </section>
</template>
