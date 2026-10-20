import posthog from 'posthog-js'

/**
 * Mesure d'audience PostHog, sans cookie ni stockage persistant (pas de bandeau RGPD).
 * Les clics sur les éléments [data-track] deviennent des événements (call_clicked, menu_filter_toggled…).
 */
export default defineNuxtPlugin(() => {
  const { key, host } = useRuntimeConfig().public.posthog
  const router = useRouter()
  if (!key) return

  posthog.init(key, {
    api_host: host,
    persistence: 'memory',
    disable_persistence: true,
    capture_pageview: false,
    autocapture: false,
    person_profiles: 'never',
  })

  const track = (path: string) => !path.startsWith('/atelier') && !path.startsWith('/print')
  if (track(router.currentRoute.value.path)) posthog.capture('$pageview')
  router.afterEach((to, from) => {
    if (to.path !== from.path && track(to.path)) nextTick(() => posthog.capture('$pageview'))
  })

  document.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-track]')
    if (!el || !track(router.currentRoute.value.path)) return
    const props = Object.fromEntries(
      Object.entries(el.dataset)
        .filter(([k]) => k.startsWith('track') && k !== 'track')
        .map(([k, v]) => [k.slice(5).toLowerCase(), v]),
    )
    posthog.capture(el.dataset.track!, { ...props, path: router.currentRoute.value.path })
  }, { capture: true })
})
