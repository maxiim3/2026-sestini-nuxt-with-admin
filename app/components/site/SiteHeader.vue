<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const contact = useContact()

const links = computed(() => [
  { label: t('nav.menu'), to: localePath('la-carte') },
  { label: t('nav.findUs'), to: localePath('nous-trouver') },
])
</script>

<template>
  <header class="sticky top-0 z-40 h-15 border-b border-nero-line bg-nero text-crema lg:h-19">
    <a
      href="#contenu"
      class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:bg-crema focus:px-3 focus:py-2 focus:text-nero"
    >{{ t('nav.skip') }}</a>
    <div class="mx-auto flex h-full max-w-[1200px] items-center justify-between gap-4 px-5 lg:px-10">
      <NuxtLink
        :to="localePath('index')"
        class="flex shrink-0 items-center gap-2.5"
        aria-label="Sestini Pizza"
      >
        <img
          src="/brand/emblem.svg"
          alt=""
          width="44"
          height="26"
          class="h-6.5 w-auto lg:h-8"
        >
        <span class="font-display text-[19px] font-semibold leading-none tracking-[0.02em] lg:text-[22px]">Sestini<small class="ml-1 text-[0.72em] tracking-[0.06em]">PIZZA</small></span>
      </NuxtLink>

      <nav
        class="hidden gap-8 text-sm font-medium md:flex"
        aria-label="Navigation principale"
      >
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="border-b border-transparent py-1.5 opacity-80 transition hover:border-abricot hover:opacity-100"
          active-class="!border-abricot !opacity-100"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <div class="flex min-w-0 items-center gap-7">
        <SiteTonightPill />
        <a
          :href="contact.phoneHref"
          class="btn btn-crema btn-sm hidden md:inline-flex"
          data-track="call_clicked"
          data-track-source="header"
        >
          <UIcon
            name="i-lucide-phone"
            class="size-4"
          />
          <span class="tabular-nums">{{ contact.phone }}</span>
        </a>
      </div>
    </div>
  </header>
</template>
