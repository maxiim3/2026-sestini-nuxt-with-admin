<script setup lang="ts">
/**
 * Essai (bêta) : bascule la police des titres entre Instrument Serif et Cinzel, celle du site en ligne.
 * Le choix est gardé dans le navigateur ; `?titres=cinzel` ou `?titres=instrument` dans l'adresse le force.
 */
type TitleFont = 'instrument' | 'cinzel'
const STORAGE_KEY = 'sestini:titres'

// Appliqué avant l'affichage, pour éviter de voir les titres changer de police au chargement
useHead({
  script: [{
    key: 'sestini-titres',
    tagPosition: 'head',
    innerHTML: `try{var q=new URLSearchParams(location.search).get('titres');if(q==='cinzel'||q==='instrument')localStorage.setItem('${STORAGE_KEY}',q);if(localStorage.getItem('${STORAGE_KEY}')==='cinzel')document.documentElement.dataset.titres='cinzel'}catch(e){}`,
  }],
})

const font = ref<TitleFont>('instrument')
onMounted(() => {
  font.value = document.documentElement.dataset.titres === 'cinzel' ? 'cinzel' : 'instrument'
})

function choose(next: TitleFont) {
  font.value = next
  if (next === 'cinzel') document.documentElement.dataset.titres = 'cinzel'
  else delete document.documentElement.dataset.titres
  try {
    localStorage.setItem(STORAGE_KEY, next)
  }
  catch { /* stockage indisponible : le choix vaut pour cette page */ }
}
</script>

<template>
  <ClientOnly>
    <button
      class="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom)+0.625rem)] right-3 z-50 flex items-center gap-1.5 rounded-full border border-nero-line bg-nero/90 py-1.5 pl-2.5 pr-3 text-[11px] font-semibold text-crema shadow-lg backdrop-blur transition-colors hover:text-abricot md:bottom-4 md:right-4"
      :aria-label="`Police des titres (essai) : ${font === 'cinzel' ? 'Cinzel' : 'Instrument Serif'}. Changer`"
      @click="choose(font === 'cinzel' ? 'instrument' : 'cinzel')"
    >
      <UIcon
        name="i-lucide-type"
        class="size-3.5 text-fumo-dark"
      />
      Titres : {{ font === 'cinzel' ? 'Cinzel' : 'Instrument' }}
      <UIcon
        name="i-lucide-arrow-left-right"
        class="size-3 text-fumo-dark"
      />
    </button>
  </ClientOnly>
</template>
