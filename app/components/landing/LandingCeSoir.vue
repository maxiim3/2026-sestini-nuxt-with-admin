<script setup lang="ts">
/**
 * Variante B, « Ce soir » : page éditoriale, typographie géante, aucune 3D.
 * Tout part du statut du soir (ouvert, ouvre plus tard, fermé) calculé côté serveur.
 * Animations : CSS pilotées par le défilement (avec repli), GSAP chargé à la demande.
 */
const SOURCE = 'landing-ce-soir'
</script>

<template>
  <div class="landing-ce-soir overflow-x-clip bg-charbon-950 text-farine-100">
    <LandingCeSoirHero :source="SOURCE" />
    <LandingCeSoirWeek />
    <LandingCeSoirPoster :source="SOURCE" />
    <LandingCeSoirMarquee />
    <LandingCeSoirHowTo :source="SOURCE" />
    <LandingCeSoirFinale :source="SOURCE" />
  </div>
</template>

<style scoped>
/* Révélations au défilement, en CSS pur quand le navigateur sait faire ; sinon tout reste visible */
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .landing-ce-soir :deep(.cs-reveal) {
      animation: cs-reveal linear both;
      animation-timeline: view();
      animation-range: entry 0% cover 30%;
    }
    .landing-ce-soir :deep(.cs-trace) {
      transform-origin: left;
      animation: cs-trace linear both;
      animation-timeline: view();
      animation-range: entry 10% cover 40%;
    }
  }
}

@keyframes cs-reveal {
  from {
    opacity: 0;
    transform: translateY(2.5rem);
  }
}
@keyframes cs-trace {
  from {
    transform: scaleX(0);
  }
}
</style>
