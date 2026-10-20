<script setup lang="ts">
import { LOCALES, type Locale } from '~~/shared/domain/constants'
import {
  FORMAT_SCALE,
  isPrintModel,
  modelParams,
  pageSize,
  parsePrintOptions,
  PRINT_MODEL_SPECS,
  type PrintFormat,
  type PrintModel,
  type PrintOrientation,
  type PrintTheme,
} from '~~/shared/domain/print'

/**
 * Documents imprimables : /print/<modele>?format=A4&orientation=portrait&theme=clair&lang=fr
 * À l'écran : la feuille à l'échelle, sur fond gris, avec une barre d'outils.
 * À l'impression (ou en PDF headless) : une page au format exact, sans marge.
 */
definePageMeta({ layout: false, i18n: false })

const route = useRoute()
const router = useRouter()
const modelParam = route.params.modele
if (!isPrintModel(modelParam)) throw createError({ statusCode: 404, statusMessage: 'Modèle d\'impression inconnu', fatal: true })
const model: PrintModel = modelParam

const spec = PRINT_MODEL_SPECS[model]
const options = computed(() => parsePrintOptions(model, route.query))
const params = computed(() => modelParams(model, route.query))
const embed = computed(() => route.query.embed === '1')
const text = computed(() => printText(options.value.lang))
const size = computed(() => pageSize(options.value.format, options.value.orientation))

const { data } = await useFetch(`/api/print/${model}`, { query: params, key: `print-${model}` })

// ─── Page, thème et métadonnées ─────────────────────────────────────────
useHead(() => ({
  title: `${spec.label} · ${options.value.format} · Sestini Pizza`,
  htmlAttrs: { lang: options.value.lang, class: `pr-html pr-theme-${options.value.theme}` },
  bodyAttrs: { class: 'pr-body' },
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
  style: [{
    key: 'print-page',
    innerHTML: `@page { size: ${options.value.format} ${options.value.orientation}; margin: 0 }`,
  }],
}))

// ─── Ajustement : la feuille ne déborde jamais ──────────────────────────
// On réduit légèrement la typographie tant que le contenu dépasse (jusqu'à -30 %).
const sheet = ref<HTMLElement | null>(null)
const fit = ref(1)
const ready = ref(false)

const sheetStyle = computed(() => ({
  'width': `${size.value.width}mm`,
  'height': `${size.value.height}mm`,
  '--scale': String(FORMAT_SCALE[options.value.format]),
  '--fit': String(fit.value),
}))

/** Modèles d'affiche : la typographie grandit jusqu'à remplir la page */
const GROW = new Set<PrintModel>(['pizza-du-moment', 'fermeture', 'evenement', 'semaine'])

function overflows(el: HTMLElement) {
  const nodes = [el, ...el.querySelectorAll<HTMLElement>('[data-fit]')]
  return nodes.some(n => n.scrollHeight > n.clientHeight + 1 || n.scrollWidth > n.clientWidth + 1)
}

async function adjust() {
  if (!import.meta.client || !sheet.value) return
  ready.value = false
  await document.fonts.ready
  await Promise.all([...sheet.value.querySelectorAll('img')].map(img => img.decode().catch(() => null)))
  fit.value = 1
  await nextTick()
  // Les affiches s'agrandissent pour occuper la feuille…
  if (GROW.has(model)) {
    while (!overflows(sheet.value) && fit.value < 2) {
      fit.value = Math.round((fit.value + 0.05) * 100) / 100
      await nextTick()
    }
  }
  // … puis tout document se réduit jusqu'à ne plus déborder
  while (overflows(sheet.value) && fit.value > 0.7) {
    fit.value = Math.round((fit.value - 0.01) * 100) / 100
    await nextTick()
  }
  ready.value = true
  // Depuis l'atelier : « Imprimer / PDF » ouvre la page et lance l'impression
  if (route.query.autoprint === '1' && !autoprinted) {
    autoprinted = true
    window.print()
  }
}
let autoprinted = false

// ─── Mise à l'échelle à l'écran ─────────────────────────────────────────
const MM = 96 / 25.4
const viewport = ref({ w: 1280, h: 900 })
const zoom = computed(() => {
  const pad = embed.value ? 0 : 48
  const bar = embed.value ? 0 : 88
  const w = (viewport.value.w - pad) / (size.value.width * MM)
  const h = (viewport.value.h - pad - bar) / (size.value.height * MM)
  return Math.min(w, h, embed.value ? 10 : 1.25)
})
function measure() {
  viewport.value = { w: window.innerWidth, h: window.innerHeight }
}

onMounted(() => {
  measure()
  window.addEventListener('resize', measure)
  adjust()
})
onBeforeUnmount(() => window.removeEventListener('resize', measure))
watch([() => route.fullPath, data], () => nextTick(adjust))

// ─── Barre d'outils ─────────────────────────────────────────────────────
function set(key: 'format' | 'orientation' | 'theme' | 'lang', value: string) {
  router.replace({ query: { ...route.query, [key]: value } })
}
const ORIENTATIONS: { value: PrintOrientation, label: string }[] = [
  { value: 'portrait', label: 'Portrait' },
  { value: 'landscape', label: 'Paysage' },
]
const THEMES: { value: PrintTheme, label: string }[] = [
  { value: 'clair', label: 'Clair' },
  { value: 'sombre', label: 'Sombre' },
]
const formats = computed<PrintFormat[]>(() => spec.formats)
const langs: readonly Locale[] = LOCALES

function print() {
  window.print()
}
</script>

<template>
  <div
    class="pr-stage"
    :class="{ 'pr-stage--embed': embed }"
  >
    <div
      class="pr-frame"
      :style="{ width: `${size.width * MM * zoom}px`, height: `${size.height * MM * zoom}px` }"
    >
      <article
        ref="sheet"
        class="pr-sheet"
        :class="[`pr-sheet--${options.orientation}`, `pr-sheet--${options.format.toLowerCase()}`, `pr-model--${model}`]"
        :style="[sheetStyle, { '--zoom': String(zoom) }]"
        :data-print-ready="ready ? '1' : undefined"
      >
        <template v-if="data">
          <PrintCarte
            v-if="data.model === 'carte'"
            :data="data"
            :text="text"
            :options="options"
          />
          <PrintPizzaDuMoment
            v-else-if="data.model === 'pizza-du-moment'"
            :data="data"
            :text="text"
            :options="options"
            :overrides="params"
          />
          <PrintFermeture
            v-else-if="data.model === 'fermeture'"
            :data="data"
            :text="text"
            :options="options"
            :overrides="params"
          />
          <PrintEvenement
            v-else-if="data.model === 'evenement'"
            :data="data"
            :text="text"
            :options="options"
            :overrides="params"
          />
          <PrintSemaine
            v-else-if="data.model === 'semaine'"
            :data="data"
            :text="text"
            :options="options"
          />
        </template>
      </article>
    </div>

    <nav
      v-if="!embed"
      class="pr-toolbar"
      aria-label="Options d'impression"
    >
      <div
        class="pr-toolbar__group"
        role="group"
        aria-label="Format"
      >
        <button
          v-for="f in formats"
          :key="f"
          type="button"
          :aria-pressed="options.format === f"
          @click="set('format', f)"
        >
          {{ f }}
        </button>
      </div>
      <div
        class="pr-toolbar__group"
        role="group"
        aria-label="Orientation"
      >
        <button
          v-for="o in ORIENTATIONS"
          :key="o.value"
          type="button"
          :aria-pressed="options.orientation === o.value"
          @click="set('orientation', o.value)"
        >
          {{ o.label }}
        </button>
      </div>
      <div
        class="pr-toolbar__group"
        role="group"
        aria-label="Thème"
      >
        <button
          v-for="th in THEMES"
          :key="th.value"
          type="button"
          :aria-pressed="options.theme === th.value"
          @click="set('theme', th.value)"
        >
          {{ th.label }}
        </button>
      </div>
      <div
        class="pr-toolbar__group"
        role="group"
        aria-label="Langue"
      >
        <button
          v-for="l in langs"
          :key="l"
          type="button"
          :aria-pressed="options.lang === l"
          @click="set('lang', l)"
        >
          {{ l.toUpperCase() }}
        </button>
      </div>
      <button
        type="button"
        class="pr-toolbar__print"
        @click="print"
      >
        Imprimer / Enregistrer en PDF
      </button>
    </nav>
  </div>
</template>

<style src="~/assets/css/print.css"></style>
