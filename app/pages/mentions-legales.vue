<script setup lang="ts">
definePageMeta({
  i18n: { paths: { fr: '/mentions-legales', en: '/legal-notice', es: '/aviso-legal', it: '/note-legali' } },
})
const { t } = useI18n()
const contact = useContact()
useSeoMeta({ title: () => `${t('legal.title')} · Sestini Pizza`, robots: 'noindex' })
</script>

<template>
  <div class="mx-auto max-w-3xl px-5 pb-24 pt-10 md:pt-16">
    <h1 class="title-display font-title text-[clamp(48px,10vw,80px)] leading-[0.95]">
      <SiteDecoText
        :text="t('legal.title')"
        letters="ends"
      />
    </h1>
    <div class="mt-10 space-y-7 leading-relaxed">
      <section>
        <h2 class="kicker mb-2 text-rosso">
          Éditeur
        </h2>
        <p>
          Sestini Pizza, camion pizza au feu de bois<template v-if="contact.company">
            , {{ contact.company }}
          </template>. Téléphone : {{ contact.phone }}. E-mail : {{ contact.email }}.
        </p>
        <p class="text-sm text-fumo">
          Adresse du siège à compléter.
        </p>
      </section>
      <section>
        <h2 class="kicker mb-2 text-rosso">
          Hébergement
        </h2>
        <p>Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.</p>
      </section>
      <section>
        <h2 class="kicker mb-2 text-rosso">
          Crédits
        </h2>
        <p>Design et développement : Maxime Tamburrini, Digital Solution Studio. Photo d'accueil provisoire : Unsplash.</p>
      </section>
      <section>
        <h2 class="kicker mb-2 text-rosso">
          Données personnelles
        </h2>
        <p>Ce site ne dépose aucun cookie publicitaire. La mesure d'audience (PostHog) fonctionne sans cookie et sans identifiant persistant.</p>
      </section>
    </div>
  </div>
</template>
