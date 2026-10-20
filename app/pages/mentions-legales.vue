<script setup lang="ts">
definePageMeta({
  i18n: { paths: { fr: '/mentions-legales', en: '/legal-notice', es: '/aviso-legal', it: '/note-legali' } },
})
const { t } = useI18n()
const contact = useContact()
useSeoMeta({ title: () => `${t('legal.title')} · Sestini Pizza`, robots: 'noindex' })
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 pb-24 pt-36 sm:px-6">
    <h1 class="font-display text-4xl font-semibold tracking-wide text-farine-50">
      {{ t('legal.title') }}
    </h1>
    <div class="mt-10 space-y-6 leading-relaxed text-farine-200/80">
      <section>
        <h2 class="eyebrow mb-2 text-braise-300">
          Éditeur
        </h2>
        <p>Sestini Pizza, camion pizza au feu de bois. Téléphone : {{ contact.phone }}. E-mail : {{ contact.email }}.</p>
        <p class="text-sm text-farine-200/50">
          Raison sociale, SIRET et adresse du siège à compléter.
        </p>
      </section>
      <section>
        <h2 class="eyebrow mb-2 text-braise-300">
          Hébergement
        </h2>
        <p>Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.</p>
      </section>
      <section>
        <h2 class="eyebrow mb-2 text-braise-300">
          Données personnelles
        </h2>
        <p>Ce site ne dépose aucun cookie publicitaire. La mesure d'audience (PostHog) fonctionne sans cookie et sans identifiant persistant.</p>
      </section>
    </div>
  </div>
</template>
