import { computed, defineComponent, h, type PropType } from 'vue'
import wordmarkSvg from '~~/public/brand/wordmark.svg?raw'
import type { PrintTheme } from '~~/shared/domain/print'

/** Logotype « Sestini Pizza » (SVG de la marque), couleur de l'encre du thème */
export default defineComponent({
  name: 'PrintWordmark',
  props: { theme: { type: String as PropType<PrintTheme>, required: true } },
  setup(props) {
    const svg = computed(() => props.theme === 'sombre' ? wordmarkSvg : wordmarkSvg.replaceAll('#FCF7EE', '#161514'))
    return () => h('span', { 'class': 'pr-svg', 'role': 'img', 'aria-label': 'Sestini Pizza', 'innerHTML': svg.value })
  },
})
