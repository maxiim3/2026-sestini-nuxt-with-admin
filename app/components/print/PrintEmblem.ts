import { computed, defineComponent, h, type PropType } from 'vue'
import emblemSvg from '~~/public/brand/emblem.svg?raw'
import type { PrintTheme } from '~~/shared/domain/print'

/**
 * Emblème du four (SVG de la marque, fichier du dépôt), recoloré selon le
 * thème : sur fond farine, la voûte passe en charbon et les veines des bûches
 * prennent la couleur du papier ; le cœur de la flamme reste crème.
 */
export default defineComponent({
  name: 'PrintEmblem',
  props: { theme: { type: String as PropType<PrintTheme>, required: true } },
  setup(props) {
    const svg = computed(() => {
      if (props.theme === 'sombre') return emblemSvg
      const flameCore = emblemSvg.lastIndexOf('#FCF7EE')
      return (emblemSvg.slice(0, flameCore).replaceAll('#FCF7EE', '#23211F') + emblemSvg.slice(flameCore))
        .replaceAll('#444444', '#A9A49B')
        .replaceAll('#0E1011', '#FCF7EE')
    })
    return () => h('span', { 'class': 'pr-svg', 'aria-hidden': 'true', 'innerHTML': svg.value })
  },
})
