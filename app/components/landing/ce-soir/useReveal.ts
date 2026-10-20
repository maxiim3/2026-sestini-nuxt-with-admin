import type { Ref } from 'vue'

type Gsap = typeof import('gsap')['gsap']

/**
 * GSAP chargé à la demande, après l'affichage, et seulement si les animations sont permises.
 * `setup` reçoit gsap (ScrollTrigger déjà enregistré) ; tout est annulé au démontage.
 */
export function useReveal(scope: Ref<HTMLElement | null>, setup: (gsap: Gsap) => void) {
  let ctx: { revert: () => void } | null = null
  let alive = true

  onMounted(async () => {
    if (!scope.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
    if (!alive || !scope.value) return
    gsap.registerPlugin(ScrollTrigger)
    ctx = gsap.context(() => setup(gsap), scope.value)
  })

  onBeforeUnmount(() => {
    alive = false
    ctx?.revert()
  })
}
