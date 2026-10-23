<script setup lang="ts">
/**
 * Essai (bêta) : police des titres. « Hybride » par défaut (titres de page et noms en Cinzel),
 * « Instrument » (refonte) ou « Cinzel » (tout comme le site d'origine). Les niveaux de titres sont décrits dans main.css.
 * Le choix est gardé dans le navigateur ; `?titres=instrument|hybride|cinzel` dans l'adresse le force.
 */
type TitleFont = 'instrument' | 'hybride' | 'cinzel'
const STORAGE_KEY = 'sestini:titres'
const MODES: TitleFont[] = ['instrument', 'hybride', 'cinzel']
const DEFAULT_MODE: TitleFont = 'hybride'
const LABELS: Record<TitleFont, string> = { instrument: 'Instrument', hybride: 'Hybride', cinzel: 'Cinzel' }

// Appliqué avant l'affichage, pour éviter de voir les titres changer de police au chargement
useHead({
  script: [{
    key: 'sestini-titres',
    tagPosition: 'head',
    innerHTML: `try{var m=${JSON.stringify(MODES)},q=new URLSearchParams(location.search).get('titres');if(m.indexOf(q)>-1)localStorage.setItem('${STORAGE_KEY}',q);var v=localStorage.getItem('${STORAGE_KEY}');if(m.indexOf(v)<0)v='${DEFAULT_MODE}';if(v!=='instrument')document.documentElement.dataset.titres=v}catch(e){}`,
  }],
})

const font = ref<TitleFont>(DEFAULT_MODE)
onMounted(() => {
  const current = document.documentElement.dataset.titres as TitleFont | undefined
  font.value = current && MODES.includes(current) ? current : 'instrument'
})

function choose(next: TitleFont) {
  font.value = next
  if (next === 'instrument') delete document.documentElement.dataset.titres
  else document.documentElement.dataset.titres = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  }
  catch { /* stockage indisponible : le choix vaut pour cette page */ }
}
</script>

<template>
  <ClientOnly>
    <div
      class="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom)+0.625rem)] right-3 z-50 flex items-center gap-0.5 rounded-full border border-nero-line bg-nero/90 p-1 text-[11px] font-semibold text-crema shadow-lg backdrop-blur md:bottom-4 md:right-4"
      role="group"
      aria-label="Police des titres (essai)"
    >
      <UIcon
        name="i-lucide-type"
        class="mx-1.5 size-3.5 text-fumo-dark"
      />
      <button
        v-for="m in MODES"
        :key="m"
        class="rounded-full px-2.5 py-1 transition-colors"
        :class="font === m ? 'bg-crema text-nero' : 'hover:text-abricot'"
        :aria-pressed="font === m"
        @click="choose(m)"
      >
        {{ LABELS[m] }}
      </button>
    </div>
  </ClientOnly>
</template>
