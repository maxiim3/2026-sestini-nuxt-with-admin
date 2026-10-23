import { computed, defineComponent, h, type PropType } from 'vue'
import wordmarkSvg from '~~/public/brand/wordmark.svg?raw'
import type { PrintTheme } from '~~/shared/domain/print'

/**
 * Logotype « Sestini Pizza » (SVG de la marque), couleur de l'encre du thème.
 * Les gabarits sont calés sur le cadre serré d'origine : on le garde, en laissant dépasser le S et le A ornés.
 */
const printSvg = wordmarkSvg.replace(/viewBox="[^"]*"/, 'viewBox="160 820 3200 360" overflow="visible"')

export default defineComponent({
  name: 'PrintWordmark',
  props: { theme: { type: String as PropType<PrintTheme>, required: true } },
  setup(props) {
    const svg = computed(() => props.theme === 'sombre' ? printSvg : printSvg.replaceAll('#FCF7EE', '#161514'))
    return () => h('span', { 'class': 'pr-svg', 'role': 'img', 'aria-label': 'Sestini Pizza', 'innerHTML': svg.value })
  },
})
