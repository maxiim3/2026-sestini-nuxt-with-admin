<script setup lang="ts">
/** Visuel statique du four : affiché avant la 3D, sans WebGL, ou si l'on réduit les animations */
</script>

<template>
  <div
    class="absolute inset-0 overflow-hidden"
    aria-hidden="true"
  >
    <div class="four-still absolute left-1/2 top-[30%] w-[min(88vw,560px)] -translate-x-1/2 -translate-y-1/2 sm:top-[40%] lg:left-[65%] lg:top-1/2 lg:w-[min(46vw,760px)]">
      <!-- Lueur du foyer, posée sur la flamme de l'emblème -->
      <div class="four-glow absolute left-[48.8%] top-[70%] aspect-square w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(224,170,62,0.42),rgba(208,139,31,0.14)_45%,transparent)]" />
      <div class="absolute left-1/2 top-[98%] h-[18%] w-[110%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(224,170,62,0.16),transparent)]" />
      <img
        src="/brand/emblem.svg"
        alt=""
        width="1450"
        height="860"
        class="relative h-auto w-full drop-shadow-[0_20px_60px_rgba(224,170,62,0.18)]"
      >
    </div>
  </div>
</template>

<style scoped>
.four-glow {
  animation: four-flicker 3.2s ease-in-out infinite alternate;
}

@keyframes four-flicker {
  0% { opacity: 0.85; transform: translate(-50%, -50%) scale(0.97); }
  35% { opacity: 1; transform: translate(-50%, -50%) scale(1.02); }
  60% { opacity: 0.9; transform: translate(-50%, -50%) scale(0.99); }
  100% { opacity: 1; transform: translate(-50%, -50%) scale(1.03); }
}
</style>
