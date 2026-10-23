import type { VNode } from 'vue'

/**
 * Titre de page dont la première et la dernière lettre passent en Cinzel Decorative, comme le logo (S…A).
 * Une ponctuation finale éventuelle est sautée pour trouver la dernière lettre.
 */
export default defineComponent({
  props: { text: { type: String, required: true } },
  setup(props) {
    const deco = (letter: string) => h('span', { class: 'deco-letter' }, letter)
    return () => {
      const { text } = props
      const last = text.search(/\p{L}[^\p{L}]*$/u)
      if (last <= 0) return text ? [deco(text.charAt(0)), text.slice(1)] : []
      const out: (string | VNode)[] = [deco(text.charAt(0)), text.slice(1, last), deco(text.charAt(last)), text.slice(last + 1)]
      return out.filter(part => part !== '')
    }
  },
})
