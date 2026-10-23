import type { PropType, VNode } from 'vue'

/**
 * Texte de titre dont certaines lettres sont isolées (.deco-letter) pour passer en Cinzel Decorative
 * quand le titre est en Cinzel (voir main.css) ; sans effet visible en Instrument Serif.
 * - `words` : l'initiale de chaque mot, comme les titres de section du site d'origine ;
 * - `ends` : la première et la dernière lettre, comme le logo (S…A) ;
 * - `first` / `last` : seulement la première ou la dernière (titre coupé en plusieurs morceaux).
 */
export default defineComponent({
  props: {
    text: { type: String, required: true },
    letters: { type: String as PropType<'words' | 'ends' | 'first' | 'last'>, default: 'words' },
  },
  setup(props) {
    const deco = (letter: string) => h('span', { class: 'deco-letter' }, letter)
    return () => {
      const { text, letters } = props
      if (letters === 'words') {
        return text.split(/(\s+)/).flatMap(word =>
          !word || /^\s+$/.test(word) ? [word] : [deco(word.charAt(0)), word.slice(1)])
      }
      // Dernière lettre : on saute une ponctuation finale éventuelle
      const first = letters === 'last' ? -1 : 0
      const last = letters === 'first' ? -1 : text.search(/\p{L}[^\p{L}]*$/u)
      const cuts = [...new Set([first, last])].filter(i => i >= 0).sort((a, b) => a - b)
      const out: (string | VNode)[] = []
      let pos = 0
      for (const i of cuts) {
        out.push(text.slice(pos, i), deco(text.charAt(i)))
        pos = i + 1
      }
      out.push(text.slice(pos))
      return out.filter(part => part !== '')
    }
  },
})
