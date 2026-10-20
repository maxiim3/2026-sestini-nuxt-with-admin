<script setup lang="ts">
/**
 * Variante C — « La Tournée » : récit cartographique de la semaine.
 * Le camion Sestini voyage de village en village au fil du défilement.
 */
import TourStory from './tournee/TourStory.vue'
import TourMenu from './tournee/TourMenu.vue'
import TourFinale from './tournee/TourFinale.vue'
</script>

<template>
  <div class="overflow-x-clip bg-charbon-950">
    <TourStory />
    <TourMenu />
    <TourFinale />
  </div>
</template>
