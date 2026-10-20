<script setup lang="ts">
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Locale } from '~~/shared/domain/constants'

/**
 * Variante A — « Le Four » : récit au défilement autour du four à bois.
 * La scène 3D est chargée après le premier rendu ; le texte reste en HTML, lisible tout de suite.
 */

const COPY = {
  fr: {
    eyebrow: 'Près de Montpellier',
    scrollCue: 'Entrez dans le four',
    steps: [
      { kicker: 'La pâte', title: 'Elle prend son temps', body: 'Notre pâte maison repose plusieurs jours avant d’être façonnée. Le temps lui donne sa légèreté, son goût, et ce cornicione qui gonfle au feu.' },
      { kicker: 'Les produits', title: 'Frais, d’ici et de saison', body: 'Nous choisissons des produits frais, locaux et de saison, et nous les posons avec retenue : chaque ingrédient doit se goûter.' },
      { kicker: 'Le feu', title: 'Cuite au feu de bois, devant vous', body: 'Le bois crépite, la voûte rayonne. La pâte gonfle, les bords dorent et se tachent de brun : c’est le léopard, la signature d’une vraie cuisson au feu de bois.' },
    ],
    outroKicker: 'À la sortie du four',
    outroTitle: 'Il ne manque plus que vous',
    outroBody: 'Quelques feuilles de basilic frais, un filet d’huile d’olive… Appelez, on la prépare, vous passez la chercher.',
    restTitle: 'Le four se repose',
    nextLabel: 'Prochaine fournée',
    upcoming: 'Les prochains soirs',
    weekLink: 'Toute la semaine',
    classicsEyebrow: 'Un avant-goût de la carte',
    classicsTitle: 'Une rouge, une blanche, une spéciale',
    classicsLead: 'Trois pizzas pour faire connaissance. Toute la carte vous attend, avec les prix et les allergènes.',
    featuredCta: 'Appeler pour la commander',
    menuBody: 'Les rouges, les blanches et les spéciales du moment, avec les prix et les allergènes.',
    findBody: 'Le camion change de village selon le soir. Retrouvez la semaine, les adresses et l’itinéraire.',
    closing: 'À très vite, autour du four.',
  },
  en: {
    eyebrow: 'Near Montpellier',
    scrollCue: 'Step inside the oven',
    steps: [
      { kicker: 'The dough', title: 'It takes its time', body: 'Our house dough rests for several days before it is shaped. Time gives it lightness, flavour, and that cornicione which puffs up in the fire.' },
      { kicker: 'The produce', title: 'Fresh, local, in season', body: 'We choose fresh, local, seasonal produce and use it with restraint: every ingredient should come through.' },
      { kicker: 'The fire', title: 'Wood-fired, right in front of you', body: 'The wood crackles, the vault glows. The dough rises, the crust turns golden and freckles with dark spots: the leopard pattern, hallmark of true wood-fired baking.' },
    ],
    outroKicker: 'Straight from the oven',
    outroTitle: 'All that’s missing is you',
    outroBody: 'A few leaves of fresh basil, a drizzle of olive oil… Call us, we bake it, you pick it up.',
    restTitle: 'The oven is resting',
    nextLabel: 'Next bake',
    upcoming: 'The next evenings',
    weekLink: 'The whole week',
    classicsEyebrow: 'A taste of the menu',
    classicsTitle: 'One red, one white, one special',
    classicsLead: 'Three pizzas to get acquainted. The full menu awaits, with prices and allergens.',
    featuredCta: 'Call to order it',
    menuBody: 'The reds, the whites and the specials of the moment, with prices and allergens.',
    findBody: 'The truck moves from village to village depending on the evening. Find the week, the addresses and directions.',
    closing: 'See you soon, by the oven.',
  },
  es: {
    eyebrow: 'Cerca de Montpellier',
    scrollCue: 'Entra en el horno',
    steps: [
      { kicker: 'La masa', title: 'Se toma su tiempo', body: 'Nuestra masa casera reposa varios días antes de formarse. El tiempo le da ligereza, sabor y ese cornicione que se hincha con el fuego.' },
      { kicker: 'Los productos', title: 'Frescos, locales y de temporada', body: 'Elegimos productos frescos, locales y de temporada, y los usamos con mesura: cada ingrediente tiene que notarse.' },
      { kicker: 'El fuego', title: 'Cocida a la leña, delante de ti', body: 'La leña crepita, la bóveda irradia calor. La masa sube, los bordes se doran y se motean de oscuro: el «leopardo», sello de una verdadera cocción a la leña.' },
    ],
    outroKicker: 'Recién salida del horno',
    outroTitle: 'Solo faltas tú',
    outroBody: 'Unas hojas de albahaca fresca, un hilo de aceite de oliva… Llámanos, la preparamos y pasas a recogerla.',
    restTitle: 'El horno descansa',
    nextLabel: 'Próxima hornada',
    upcoming: 'Las próximas noches',
    weekLink: 'Toda la semana',
    classicsEyebrow: 'Un anticipo de la carta',
    classicsTitle: 'Una roja, una blanca, una especial',
    classicsLead: 'Tres pizzas para conocernos. Toda la carta te espera, con precios y alérgenos.',
    featuredCta: 'Llamar para pedirla',
    menuBody: 'Las rojas, las blancas y las especiales del momento, con precios y alérgenos.',
    findBody: 'El camión cambia de pueblo según la noche. Consulta la semana, las direcciones y cómo llegar.',
    closing: 'Hasta pronto, junto al horno.',
  },
  it: {
    eyebrow: 'Vicino a Montpellier',
    scrollCue: 'Entra nel forno',
    steps: [
      { kicker: 'L’impasto', title: 'Si prende il suo tempo', body: 'Il nostro impasto fatto in casa riposa diversi giorni prima di essere steso. Il tempo gli dà leggerezza, sapore e quel cornicione che si gonfia nel fuoco.' },
      { kicker: 'Gli ingredienti', title: 'Freschi, locali e di stagione', body: 'Scegliamo prodotti freschi, locali e di stagione, e li usiamo con misura: ogni ingrediente deve farsi sentire.' },
      { kicker: 'Il fuoco', title: 'Cotta a legna, davanti a te', body: 'La legna crepita, la volta irradia calore. L’impasto cresce, i bordi si dorano e si macchiano di bruno: la leopardatura, firma di una vera cottura a legna.' },
    ],
    outroKicker: 'Appena sfornata',
    outroTitle: 'Manchi solo tu',
    outroBody: 'Qualche foglia di basilico fresco, un filo d’olio d’oliva… Chiamaci, la prepariamo, passi a ritirarla.',
    restTitle: 'Il forno riposa',
    nextLabel: 'Prossima infornata',
    upcoming: 'Le prossime serate',
    weekLink: 'Tutta la settimana',
    classicsEyebrow: 'Un assaggio del menu',
    classicsTitle: 'Una rossa, una bianca, una speciale',
    classicsLead: 'Tre pizze per conoscerci. Il menu completo ti aspetta, con prezzi e allergeni.',
    featuredCta: 'Chiama per ordinarla',
    menuBody: 'Le rosse, le bianche e le speciali del momento, con prezzi e allergeni.',
    findBody: 'Il furgone cambia paese a seconda della sera. Trova la settimana, gli indirizzi e le indicazioni.',
    closing: 'A presto, accanto al forno.',
  },
} satisfies Record<Locale, unknown>

const NUMERALS = ['I', 'II', 'III']

const { t, locale } = useI18n()
const c = computed(() => COPY[locale.value as Locale] ?? COPY.fr)
const localePath = useLocalePath()
const contact = useContact()
const { data } = useSite()
const { tr, price, hour, date, relativeDay } = useLocalized()

// ── Ce soir ───────────────────────────────────────────────
const todayIso = computed(() => data.value?.tonight.today.date ?? '')
const tonight = computed(() => {
  const tn = data.value?.tonight
  if (!tn) return null
  const isToday = Boolean(tn.today.open && tn.today.location && tn.status !== 'closed-now')
  const day = isToday ? tn.today : tn.next
  const title = isToday
    ? t('tonight.weAreAt', { place: tn.today.location!.city })
    : tn.status === 'closed-now' ? t('tonight.closedNow') : c.value.restTitle
  return { isToday, live: tn.status === 'open-now', day, title }
})
const upcoming = computed(() => {
  const after = tonight.value?.day?.date ?? todayIso.value
  return (data.value?.week ?? []).filter(d => d.open && d.location && d.date > after).slice(0, 4)
})

// ── Pizzas ────────────────────────────────────────────────
type Pizza = NonNullable<NonNullable<typeof data.value>['menu']>['sections'][number]['pizzas'][number]
const featured = computed(() => (data.value?.featured ?? []).find(f => f.showOnHome) ?? null)
const classics = computed(() => (data.value?.menu?.sections ?? [])
  .map(s => ({ section: s.section, pizza: s.pizzas[0] }))
  .filter((x): x is { section: typeof x.section, pizza: Pizza } => Boolean(x.pizza))
  .slice(0, 3))
const pizzaCount = computed(() => (data.value?.menu?.sections ?? []).reduce((n, s) => n + s.pizzas.length, 0))
const ingredients = (p: Pizza) => [tr(p, 'baseLabel'), ...p.avant.map(i => tr(i, 'name'))].join(' · ')
const after = (p: Pizza) => p.apres.map(i => tr(i, 'name')).join(', ')
const kinds = (p: Pizza) => [...p.avant, ...p.apres].map(i => i.kind)

// ── Récit au défilement et 3D différée ───────────────────
const root = ref<HTMLElement | null>(null)
const story = ref<HTMLElement | null>(null)
const progress = ref(0)
const use3d = ref(false)
const sceneReady = ref(false)
const step = computed(() => Math.round(progress.value * 4) - 1) // -1 héros, 0..2 étapes, 3 sortie

function supportsWebGL() {
  try {
    const probe = document.createElement('canvas')
    const gl = probe.getContext('webgl2') ?? probe.getContext('webgl')
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return Boolean(gl)
  }
  catch {
    return false
  }
}

function onLost() {
  use3d.value = false
  sceneReady.value = false
}

let ctx: gsap.Context | null = null
let idle = 0

onMounted(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  gsap.registerPlugin(ScrollTrigger)
  ctx = gsap.context(() => {
    // Avancement du récit, lissé (scrub) : pilote la caméra et la pizza
    const state = { p: 0 }
    gsap.to(state, {
      p: 1,
      ease: 'none',
      scrollTrigger: { trigger: story.value, start: 'top top', end: 'bottom bottom', scrub: reduced ? true : 0.8 },
      onUpdate: () => (progress.value = state.p),
    })
    if (reduced) return
    for (const el of gsap.utils.toArray<HTMLElement>('[data-reveal]')) {
      gsap.from(el, {
        autoAlpha: 0,
        y: 36,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' },
      })
    }
  }, root.value ?? undefined)

  // La 3D attend que la page soit posée et que le navigateur respire
  if (!reduced && supportsWebGL()) {
    const go = () => (use3d.value = true)
    idle = typeof window.requestIdleCallback === 'function'
      ? window.requestIdleCallback(go, { timeout: 1200 })
      : setTimeout(go, 300) as unknown as number
  }
})

onBeforeUnmount(() => {
  if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idle)
  clearTimeout(idle)
  ctx?.revert()
})
</script>

<template>
  <div
    ref="root"
    class="relative overflow-x-clip bg-charbon-950 text-farine-100"
  >
    <!-- ════ Récit : le four, la pâte, les produits, le feu ════ -->
    <div
      ref="story"
      class="relative"
    >
      <div
        class="sticky top-0 h-lvh w-full overflow-hidden"
        aria-hidden="true"
      >
        <LandingFourOvenStill
          class="transition-opacity duration-1000"
          :class="sceneReady ? 'opacity-0' : 'opacity-100'"
        />
        <ClientOnly>
          <LazyLandingFourOvenCanvas
            v-if="use3d"
            :progress="progress"
            class="absolute inset-0 transition-opacity duration-[1400ms]"
            :class="sceneReady ? 'opacity-100' : 'opacity-0'"
            @ready="sceneReady = true"
            @lost="onLost"
          />
        </ClientOnly>
        <!-- Voiles pour la lisibilité du texte -->
        <div class="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-charbon-950/80 to-transparent" />
        <div class="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-charbon-950 via-charbon-950/75 to-transparent lg:hidden" />
        <div class="pointer-events-none absolute inset-y-0 left-0 hidden w-[58%] bg-gradient-to-r from-charbon-950/90 via-charbon-950/50 to-transparent lg:block" />
        <div class="pointer-events-none absolute inset-0 shadow-[inset_0_0_180px_rgba(0,0,0,0.65)]" />

        <!-- Fil du récit (grand écran) -->
        <ol
          class="absolute right-8 top-1/2 hidden -translate-y-1/2 flex-col gap-5 transition-opacity duration-500 xl:flex"
          :class="step >= 0 && step <= 2 ? 'opacity-100' : 'opacity-0'"
        >
          <li
            v-for="(s, i) in c.steps"
            :key="s.kicker"
            class="flex items-center justify-end gap-3 text-xs transition-colors duration-500"
            :class="step === i ? 'text-braise-300' : 'text-farine-200/35'"
          >
            <span class="eyebrow !text-[10px]">{{ s.kicker }}</span>
            <span
              class="block h-px transition-all duration-500"
              :class="step === i ? 'w-10 bg-braise-300' : 'w-5 bg-farine-200/30'"
            />
          </li>
        </ol>
      </div>

      <div class="relative -mt-[100lvh]">
        <!-- Premier écran -->
        <section class="relative flex min-h-lvh flex-col justify-end px-4 pb-28 pt-24 sm:px-6 md:pb-20 lg:justify-center lg:px-8 lg:pb-0">
          <div class="mx-auto w-full max-w-7xl">
            <div class="max-w-xl">
              <SiteTonightPill />
              <p class="eyebrow mt-6 text-braise-300">
                {{ c.eyebrow }}
              </p>
              <h1 class="mt-3 text-balance font-display text-[2.6rem] font-semibold leading-[1.04] tracking-wide text-farine-50 sm:text-6xl lg:text-7xl">
                {{ t('home.heroTitle') }}
              </h1>
              <p class="mt-5 max-w-md text-pretty font-serif text-lg italic leading-relaxed text-farine-200/85 sm:text-xl">
                {{ t('home.heroLead') }}
              </p>
              <div class="mt-8 flex flex-wrap items-center gap-3">
                <a
                  :href="contact.phoneHref"
                  class="btn-fire min-h-12 px-6 text-base"
                  data-track="call_clicked"
                  data-track-source="landing-four"
                >
                  <UIcon
                    name="i-lucide-phone"
                    class="size-4"
                  />
                  {{ t('nav.call') }}
                  <span class="hidden font-normal opacity-75 sm:inline">· {{ contact.phone }}</span>
                </a>
                <NuxtLink
                  :to="localePath('la-carte')"
                  class="btn-ghost min-h-12 text-farine-100"
                >
                  {{ t('home.seeMenu') }}
                </NuxtLink>
              </div>
              <p class="mt-4 text-sm text-farine-200/55">
                {{ t('tonight.orderByPhone') }}
              </p>
            </div>
          </div>
          <div
            class="pointer-events-none mx-auto mt-10 hidden items-center gap-3 text-farine-200/60 lg:absolute lg:inset-x-0 lg:bottom-8 lg:flex lg:justify-center"
            aria-hidden="true"
          >
            <span class="eyebrow !text-[10px]">{{ c.scrollCue }}</span>
            <span class="four-cue relative block h-10 w-px overflow-hidden bg-farine-200/15" />
          </div>
        </section>

        <!-- Les trois étapes du savoir-faire -->
        <section
          v-for="(s, i) in c.steps"
          :key="s.kicker"
          class="flex min-h-lvh items-end px-4 pb-28 sm:px-6 md:pb-16 lg:items-center lg:px-8 lg:pb-0"
          :aria-labelledby="`four-step-${i}`"
        >
          <div class="mx-auto w-full max-w-7xl">
            <div
              data-reveal
              class="max-w-md rounded-[28px] border border-white/10 bg-charbon-950/55 p-6 shadow-2xl shadow-black/40 backdrop-blur-md sm:p-8"
            >
              <div class="flex items-baseline gap-4">
                <span class="font-deco text-3xl font-bold text-braise-400 sm:text-4xl">{{ NUMERALS[i] }}</span>
                <span class="eyebrow text-braise-300">{{ s.kicker }}</span>
              </div>
              <h2
                :id="`four-step-${i}`"
                class="mt-3 text-balance font-display text-2xl font-semibold leading-tight tracking-wide text-farine-50 sm:text-3xl"
              >
                {{ s.title }}
              </h2>
              <p class="mt-3 text-pretty leading-relaxed text-farine-200/80">
                {{ s.body }}
              </p>
            </div>
          </div>
        </section>

        <!-- Sortie du four -->
        <section
          class="flex min-h-lvh items-end px-4 pb-28 sm:px-6 md:pb-16 lg:items-center lg:px-8 lg:pb-0"
          aria-labelledby="four-outro"
        >
          <div class="mx-auto w-full max-w-7xl">
            <div
              data-reveal
              class="max-w-md"
            >
              <p class="eyebrow text-braise-300">
                {{ c.outroKicker }}
              </p>
              <h2
                id="four-outro"
                class="mt-3 text-balance font-display text-3xl font-semibold leading-tight tracking-wide text-farine-50 sm:text-5xl"
              >
                {{ c.outroTitle }}
              </h2>
              <p class="mt-4 text-pretty font-serif text-lg italic leading-relaxed text-farine-200/80">
                {{ c.outroBody }}
              </p>
              <a
                :href="contact.phoneHref"
                class="btn-fire mt-7 min-h-12 px-6"
                data-track="call_clicked"
                data-track-source="landing-four"
              >
                <UIcon
                  name="i-lucide-phone"
                  class="size-4"
                />
                {{ t('nav.callFull') }}
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- ════ Ce soir ════ -->
    <section
      id="ce-soir"
      class="grain relative scroll-mt-20 border-t border-white/5 px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
      aria-labelledby="four-tonight"
    >
      <div
        class="pointer-events-none absolute left-1/2 top-0 h-[460px] w-[min(900px,100%)] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(224,170,62,0.13),transparent)]"
        aria-hidden="true"
      />
      <div class="relative mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-8">
        <div
          data-reveal
          class="relative overflow-hidden rounded-[32px] border border-braise-400/20 bg-gradient-to-br from-braise-950/70 via-charbon-900 to-charbon-900 p-7 sm:p-10"
        >
          <img
            src="/brand/emblem.svg"
            alt=""
            aria-hidden="true"
            width="1450"
            height="860"
            class="pointer-events-none absolute -bottom-10 -right-16 w-[340px] opacity-[0.06] sm:w-[440px]"
          >
          <p class="eyebrow flex items-center gap-2.5 text-braise-300">
            <span class="relative flex size-2.5">
              <span
                v-if="tonight?.live"
                class="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75"
              />
              <span
                class="relative inline-flex size-2.5 rounded-full"
                :class="tonight?.live ? 'bg-emerald-400' : 'bg-braise-400'"
              />
            </span>
            {{ t('tonight.label') }}
          </p>
          <h2
            id="four-tonight"
            class="relative mt-4 text-balance font-display text-4xl font-semibold leading-[1.05] tracking-wide text-farine-50 sm:text-6xl"
          >
            {{ tonight?.title ?? t('tonight.label') }}
          </h2>

          <div
            v-if="tonight?.day?.location"
            class="relative mt-6"
          >
            <p
              v-if="!tonight.isToday"
              class="text-farine-200/70"
            >
              {{ c.nextLabel }} :
              <span class="font-semibold text-farine-50">{{ relativeDay(tonight.day.date, todayIso) }} · {{ tonight.day.location.city }}</span>
            </p>
            <p class="mt-1 text-lg text-farine-100">
              {{ tonight.day.location.name }}
            </p>
            <p class="text-farine-200/65">
              {{ tonight.day.location.address }}, {{ tonight.day.location.zip }} {{ tonight.day.location.city }}
            </p>
            <p class="mt-3 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-sm text-braise-200">
              <UIcon
                name="i-lucide-clock"
                class="size-4"
              />
              {{ tonight.live ? t('tonight.openNow') : t('tonight.from', { time: hour(tonight.day.opensAt) }) }}
            </p>
            <p
              v-if="tonight.day.exception?.note"
              class="mt-4 rounded-xl bg-braise-400/10 px-4 py-3 text-sm text-braise-100"
            >
              {{ tr(tonight.day.exception, 'note') }}
            </p>
          </div>

          <div class="relative mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              :href="contact.phoneHref"
              class="btn-fire min-h-14 flex-1 text-lg"
              data-track="call_clicked"
              data-track-source="landing-four"
            >
              <UIcon
                name="i-lucide-phone"
                class="size-5"
              />
              {{ t('nav.call') }} · {{ contact.phone }}
            </a>
            <a
              v-if="tonight?.day?.location"
              :href="directionsUrl(tonight.day.location)"
              target="_blank"
              rel="noopener"
              class="btn-ghost min-h-14 text-farine-100"
              data-track="directions_clicked"
            >
              <UIcon
                name="i-lucide-navigation"
                class="size-4"
              />
              {{ t('tonight.itinerary') }}
            </a>
          </div>
          <p class="relative mt-4 text-sm text-farine-200/55">
            {{ t('tonight.orderByPhone') }}
          </p>
        </div>

        <aside
          data-reveal
          class="rounded-[32px] border border-white/5 bg-white/[0.02] p-7 sm:p-10"
          aria-labelledby="four-upcoming"
        >
          <h3
            id="four-upcoming"
            class="eyebrow text-farine-200/60"
          >
            {{ c.upcoming }}
          </h3>
          <ol class="mt-5 divide-y divide-white/5">
            <li
              v-for="d in upcoming"
              :key="d.date"
              class="flex items-center gap-4 py-4"
            >
              <span class="w-28 shrink-0">
                <span class="block text-sm font-semibold capitalize text-farine-50">{{ date(d.date, { weekday: 'long' }) }}</span>
                <span class="block text-xs text-farine-200/50">{{ date(d.date, { day: 'numeric', month: 'long' }) }}</span>
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-farine-100">{{ d.location?.city }}</span>
                <span class="block truncate text-xs text-farine-200/50">{{ d.location?.name }}</span>
              </span>
              <span class="shrink-0 text-sm text-farine-200/65">{{ hour(d.opensAt) }}</span>
            </li>
          </ol>
          <NuxtLink
            :to="localePath('nous-trouver')"
            class="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-braise-300 transition-colors hover:text-braise-200"
          >
            {{ c.weekLink }}
            <UIcon
              name="i-lucide-arrow-right"
              class="size-4"
            />
          </NuxtLink>
        </aside>
      </div>
    </section>

    <!-- ════ Pizza du moment, ou un avant-goût de la carte ════ -->
    <section
      class="relative border-t border-white/5 bg-farine-100 px-4 py-20 text-charbon-950 sm:px-6 sm:py-28 lg:px-8"
      aria-labelledby="four-pizzas"
    >
      <div class="mx-auto max-w-7xl">
        <template v-if="featured">
          <div class="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div
              data-reveal
              class="relative mx-auto aspect-square w-full max-w-[520px]"
            >
              <div
                class="absolute inset-[6%] rounded-full bg-[radial-gradient(closest-side,rgba(224,170,62,0.35),transparent)] blur-2xl"
                aria-hidden="true"
              />
              <img
                v-if="featured.pizza.imageUrl"
                :src="featured.pizza.imageUrl"
                :alt="featured.pizza.imageAlt || tr(featured.pizza, 'name')"
                loading="lazy"
                class="relative size-full rounded-full object-cover shadow-2xl shadow-charbon-950/40"
              >
              <LandingFourPizzaArt
                v-else
                class="relative"
                :seed="featured.pizza.slug"
                :base-kind="featured.pizza.baseKind"
                :kinds="kinds(featured.pizza)"
              />
            </div>
            <div data-reveal>
              <p class="eyebrow flex items-center gap-2 text-braise-700">
                <UIcon
                  name="i-lucide-flame"
                  class="size-4"
                />
                {{ tr(featured, 'title') }}
              </p>
              <h2
                id="four-pizzas"
                class="mt-4 font-display text-4xl font-semibold tracking-wide text-charbon-950 sm:text-6xl"
              >
                {{ tr(featured.pizza, 'name') }}
              </h2>
              <p
                v-if="featured.pitch"
                class="mt-5 font-serif text-xl italic leading-relaxed text-charbon-700"
              >
                {{ tr(featured, 'pitch') }}
              </p>
              <p class="mt-5 leading-relaxed text-charbon-700">
                {{ ingredients(featured.pizza) }}
              </p>
              <p
                v-if="featured.pizza.apres.length"
                class="mt-1 font-serif italic text-charbon-600"
              >
                {{ t('menu.afterBaking') }} — {{ after(featured.pizza) }}
              </p>
              <div class="mt-8 flex flex-wrap items-center gap-5">
                <span class="font-deco text-4xl font-bold text-braise-700">{{ price(featured.pizza.priceCents) }}</span>
                <a
                  :href="contact.phoneHref"
                  class="btn-fire min-h-12 px-6"
                  data-track="call_clicked"
                  data-track-source="landing-four"
                >
                  <UIcon
                    name="i-lucide-phone"
                    class="size-4"
                  />
                  {{ c.featuredCta }}
                </a>
              </div>
            </div>
          </div>
        </template>

        <template v-else>
          <header
            data-reveal
            class="mx-auto max-w-2xl text-center"
          >
            <p class="eyebrow text-braise-700">
              {{ c.classicsEyebrow }}
            </p>
            <h2
              id="four-pizzas"
              class="mt-4 text-balance font-display text-3xl font-semibold tracking-wide text-charbon-950 sm:text-5xl"
            >
              {{ c.classicsTitle }}
            </h2>
            <p class="mt-4 text-pretty font-serif text-lg italic text-charbon-600">
              {{ c.classicsLead }}
            </p>
          </header>
          <div class="mt-14 grid gap-12 md:grid-cols-3 md:gap-8">
            <article
              v-for="item in classics"
              :key="item.pizza.id"
              data-reveal
              class="group text-center"
              :aria-labelledby="`four-pizza-${item.pizza.slug}`"
            >
              <div class="relative mx-auto aspect-square w-[min(260px,72vw)] transition-transform duration-700 ease-out group-hover:rotate-12">
                <img
                  v-if="item.pizza.imageUrl"
                  :src="item.pizza.imageUrl"
                  :alt="item.pizza.imageAlt || tr(item.pizza, 'name')"
                  loading="lazy"
                  class="size-full rounded-full object-cover"
                >
                <LandingFourPizzaArt
                  v-else
                  :seed="item.pizza.slug"
                  :base-kind="item.pizza.baseKind"
                  :kinds="kinds(item.pizza)"
                />
              </div>
              <p class="eyebrow mt-7 text-braise-700">
                {{ t(`menu.sections.${item.section}`) }}
              </p>
              <h3
                :id="`four-pizza-${item.pizza.slug}`"
                class="mt-2 font-display text-2xl font-semibold tracking-wide text-charbon-950"
              >
                {{ tr(item.pizza, 'name') }}
              </h3>
              <p class="mx-auto mt-2 max-w-xs text-pretty text-[15px] leading-relaxed text-charbon-600">
                {{ ingredients(item.pizza) }}
              </p>
              <p
                v-if="item.pizza.apres.length"
                class="mx-auto mt-1 max-w-xs text-pretty font-serif text-[15px] italic text-charbon-500"
              >
                {{ t('menu.afterBaking') }} — {{ after(item.pizza) }}
              </p>
              <p class="mt-3 font-deco text-2xl font-bold text-braise-700">
                {{ price(item.pizza.priceCents) }}
              </p>
            </article>
          </div>
          <div class="mt-14 flex justify-center">
            <NuxtLink
              :to="localePath('la-carte')"
              class="btn-ghost min-h-12 text-charbon-950"
            >
              {{ t('home.seeMenu') }}
              <UIcon
                name="i-lucide-arrow-right"
                class="size-4"
              />
            </NuxtLink>
          </div>
        </template>
      </div>
    </section>

    <!-- ════ La carte · Nous trouver ════ -->
    <section class="grain relative px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div class="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-2">
        <NuxtLink
          :to="localePath('la-carte')"
          data-reveal
          class="group relative flex min-h-72 flex-col justify-between overflow-hidden rounded-[32px] border border-white/10 bg-charbon-900 p-7 transition-colors hover:border-braise-400/40 sm:p-10"
        >
          <div
            class="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-[radial-gradient(closest-side,rgba(224,170,62,0.18),transparent)] transition-transform duration-700 group-hover:scale-125"
            aria-hidden="true"
          />
          <div class="relative">
            <p class="eyebrow text-braise-300">
              {{ t('menu.title') }}
            </p>
            <h2 class="mt-4 font-display text-3xl font-semibold tracking-wide text-farine-50 sm:text-4xl">
              {{ t('menu.count', pizzaCount) }}
            </h2>
            <p class="mt-3 max-w-sm text-pretty text-farine-200/70">
              {{ c.menuBody }}
            </p>
          </div>
          <span class="relative mt-8 inline-flex items-center gap-2 font-semibold text-braise-300">
            {{ t('home.seeMenu') }}
            <UIcon
              name="i-lucide-arrow-right"
              class="size-4 transition-transform group-hover:translate-x-1"
            />
          </span>
        </NuxtLink>
        <NuxtLink
          :to="localePath('nous-trouver')"
          data-reveal
          class="group relative flex min-h-72 flex-col justify-between overflow-hidden rounded-[32px] border border-white/10 bg-charbon-900 p-7 transition-colors hover:border-braise-400/40 sm:p-10"
        >
          <div
            class="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-[radial-gradient(closest-side,rgba(224,170,62,0.12),transparent)] transition-transform duration-700 group-hover:scale-125"
            aria-hidden="true"
          />
          <div class="relative">
            <p class="eyebrow text-braise-300">
              {{ t('nav.findUs') }}
            </p>
            <h2 class="mt-4 text-balance font-display text-2xl font-semibold leading-snug tracking-wide text-farine-50 sm:text-3xl">
              <span
                v-for="city in t('brand.area').split('·')"
                :key="city"
                class="block"
              >{{ city.trim() }}</span>
            </h2>
            <p class="mt-3 max-w-sm text-pretty text-farine-200/70">
              {{ c.findBody }}
            </p>
          </div>
          <span class="relative mt-8 inline-flex items-center gap-2 font-semibold text-braise-300">
            {{ t('home.findUs') }}
            <UIcon
              name="i-lucide-arrow-right"
              class="size-4 transition-transform group-hover:translate-x-1"
            />
          </span>
        </NuxtLink>
      </div>

      <div
        data-reveal
        class="mx-auto mt-20 max-w-3xl text-center"
      >
        <img
          src="/brand/emblem.svg"
          alt=""
          aria-hidden="true"
          width="1450"
          height="860"
          class="mx-auto w-28 opacity-90"
        >
        <p class="mt-6 font-serif text-2xl italic text-farine-200/85 sm:text-3xl">
          {{ c.closing }}
        </p>
        <a
          :href="contact.phoneHref"
          class="mt-6 inline-flex min-h-12 items-center font-deco text-3xl font-bold tracking-wide text-braise-300 transition-colors hover:text-braise-200 sm:text-4xl"
          data-track="call_clicked"
          data-track-source="landing-four"
        >
          {{ contact.phone }}
        </a>
        <p class="mt-2 text-sm text-farine-200/50">
          {{ t('tonight.orderByPhone') }}
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Fil lumineux qui descend : invitation à défiler */
.four-cue::after {
  content: "";
  position: absolute;
  inset-inline: 0;
  top: -40%;
  height: 40%;
  background: linear-gradient(to bottom, transparent, var(--color-braise-300));
  animation: four-cue 2.2s cubic-bezier(0.6, 0, 0.4, 1) infinite;
}

@keyframes four-cue {
  to { top: 100%; }
}
</style>
