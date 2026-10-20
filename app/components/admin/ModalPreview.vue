<script setup lang="ts">
/* eslint-disable vue/no-v-html -- le corps est échappé par richText() */
/** Aperçu fidèle de la modale d'accueil du site public */
defineProps<{
  title: string
  body: string
  imageUrl?: string | null
  ctas: { label: string, href: string, variant?: 'primary' | 'secondary' }[]
}>()
</script>

<template>
  <div class="grain relative mx-auto w-full max-w-md overflow-hidden rounded-3xl bg-charbon-900 text-center text-farine-100 ring-1 ring-braise-400/30">
    <div
      class="pointer-events-none absolute inset-x-0 -top-24 h-64 bg-[radial-gradient(closest-side,rgba(224,170,62,0.35),transparent)]"
      aria-hidden="true"
    />
    <div class="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-full bg-white/5">
      <UIcon
        name="i-lucide-x"
        class="size-4"
      />
    </div>
    <div class="relative px-6 pb-7 pt-9">
      <img
        src="/brand/emblem.svg"
        alt=""
        width="80"
        height="47"
        class="mx-auto mb-5 h-10 w-auto"
      >
      <p class="eyebrow mb-2 text-braise-300">
        Sestini Pizza
      </p>
      <h2 class="font-display text-2xl font-semibold leading-tight tracking-wide text-farine-50">
        {{ title || 'Titre du message' }}
      </h2>
      <img
        v-if="imageUrl"
        :src="imageUrl"
        alt=""
        class="mx-auto mt-5 max-h-48 rounded-2xl object-cover"
      >
      <div
        class="mt-4 space-y-3 text-[15px] leading-relaxed text-farine-200/85 [&_strong]:font-semibold [&_strong]:text-farine-50"
        v-html="richText(body || 'Le texte de votre message apparaîtra ici.')"
      />
      <div
        v-if="ctas.length"
        class="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center"
      >
        <span
          v-for="(cta, i) in ctas"
          :key="i"
          :class="cta.variant === 'secondary' ? 'btn-ghost text-farine-100' : 'btn-fire'"
        >
          {{ cta.label || 'Bouton' }}
        </span>
      </div>
    </div>
  </div>
</template>
