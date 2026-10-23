/**
 * Texte de titre dont chaque mot commence par une lettre isolée (.deco-initial) :
 * en mode de titres « cinzel », elle passe en Cinzel Decorative, comme sur la carte du site d'origine.
 * Sans effet visible dans les autres modes.
 */
export default defineComponent({
  props: { text: { type: String, required: true } },
  setup(props) {
    return () => props.text.split(/(\s+)/).flatMap(word =>
      !word || /^\s+$/.test(word) ? [word] : [h('span', { class: 'deco-initial' }, word.charAt(0)), word.slice(1)])
  },
})
