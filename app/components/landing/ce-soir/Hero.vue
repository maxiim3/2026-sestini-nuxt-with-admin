<script setup lang="ts">
import { capitalize, useCeSoir } from './useCeSoir'

defineProps<{ source: string }>()

const { c, hour, date, kind, day, today, when, headline } = useCeSoir()
const contact = useContact()

/**
 * Découpe d'un nom composé en morceaux insécables : on coupe après les traits d'union,
 * mais jamais après un mot court (« lès- », « la- »), pour éviter « Villeneuve- / lès- / Maguelone ».
 */
function chunks(text: string): string[] {
  const parts = text.split(/(?<=-)/)
  const out: string[] = []
  let carry = ''
  for (const part of parts) {
    const word = carry + part
    if (part.endsWith('-') && part.length <= 4) carry = word
    else {
      out.push(word)
      carry = ''
    }
  }
  if (carry) out.push(carry)
  // Un morceau encore très long (« Vic-la-Gardiole ») peut couper à son dernier trait d'union
  return out
    .flatMap((c) => {
      const at = c.lastIndexOf('-', c.length - 2) + 1
      return c.length > 12 && at >= 5 && c.length - at >= 5 ? [c.slice(0, at), c.slice(at)] : [c]
    })
    .flatMap(c => c.split(/(?<=\s)/))
}

const lines = computed(() => headline.value.lines.map(l => ({ ...l, chunks: chunks(l.text) })))

/** Taille des lignes calculée d'après leur longueur, pour remplir la colonne sans déborder */
const fit = computed(() => {
  const all = lines.value
  const caps = Math.max(8, ...all.map((l, i) => l.tone === 'caps' ? l.text.length + (i === all.length - 1 ? 3 : 0) : 0))
  const star = all.find(l => l.tone === 'star')
  const starLen = Math.max(6, ...(star?.chunks ?? []).map(c => c.trim().length))
  return { '--caps': (140 / caps).toFixed(2), '--star': (196 / starLen).toFixed(2) }
})

const masthead = computed(() => today.value ? date(today.value, { weekday: 'long', day: 'numeric', month: 'long' }) : '')
const dayLabel = computed(() => kind.value === 'live' || kind.value === 'later' ? c.value.week.tonight : capitalize(when.value))
/** Chiffre fantôme en arrière-plan : l'heure d'ouverture */
const ghost = computed(() => day.value?.opensAt?.slice(0, 2) ?? '')
</script>

<template>
  <section class="cs-hero relative isolate overflow-hidden bg-charbon-950 pb-12 pt-20 lg:pb-16 lg:pt-24">
    <div
      class="pointer-events-none absolute -right-48 -top-56 -z-10 size-[46rem] rounded-full bg-[radial-gradient(closest-side,rgba(224,170,62,0.17),transparent)]"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute -bottom-72 -left-40 -z-10 size-[40rem] rounded-full bg-[radial-gradient(closest-side,rgba(209,59,36,0.09),transparent)]"
      aria-hidden="true"
    />
    <span
      v-if="ghost"
      class="cs-ghost pointer-events-none absolute -z-10 select-none font-deco font-bold leading-none"
      aria-hidden="true"
    >{{ ghost }}</span>

    <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <!-- Bandeau façon une de journal -->
      <div class="cs-masthead flex items-center justify-between gap-4 py-2.5 text-farine-200/70">
        <span class="eyebrow !text-[10px] sm:!text-[11px]">{{ masthead }}</span>
        <img
          src="/brand/emblem.svg"
          alt=""
          width="48"
          height="28"
          class="h-4 w-auto opacity-80 sm:h-5"
        >
        <span class="eyebrow hidden !text-[11px] sm:inline">{{ c.masthead }}</span>
      </div>

      <div class="mt-9 grid gap-9 lg:mt-14 lg:grid-cols-12 lg:items-end lg:gap-12">
        <div
          class="cs-fit lg:col-span-8"
          :style="fit"
        >
          <p class="cs-kicker eyebrow flex items-center gap-3 text-braise-300">
            <span class="relative flex size-2.5">
              <span
                v-if="kind === 'live'"
                class="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75"
              />
              <span
                class="relative inline-flex size-2.5 rounded-full"
                :class="kind === 'live' ? 'bg-emerald-400' : 'bg-braise-400'"
              />
            </span>
            {{ headline.kicker }}
          </p>
          <h1 class="mt-5 text-farine-50 lg:mt-7">
            <span
              v-for="(line, i) in lines"
              :key="i"
              class="cs-line block"
              :class="`cs-line--${line.tone}`"
              :style="{ '--i': i }"
            >
              <span class="cs-line-inner flex items-center gap-[0.35em]">
                <span
                  v-if="i === lines.length - 1 && line.tone === 'caps'"
                  class="cs-rule h-px w-[1.6em] shrink-0 bg-braise-400"
                  aria-hidden="true"
                />
                <span :class="line.tone === 'star' ? 'cs-star' : ''"><template
                  v-for="(chunk, j) in line.chunks"
                  :key="j"
                ><wbr v-if="j"><span class="whitespace-nowrap">{{ chunk }}</span></template></span>
              </span>
            </span>
          </h1>
        </div>

        <aside class="cs-aside lg:col-span-4 lg:pb-3">
          <p class="font-serif text-xl leading-snug text-farine-100/85 italic lg:text-[1.4rem]">
            {{ headline.lead }}
          </p>

          <div
            v-if="day?.location"
            class="mt-7 border-t border-farine-100/15 pt-5"
          >
            <p class="eyebrow text-braise-300">
              {{ c.hero.truck }} · {{ dayLabel }}
            </p>
            <p class="mt-2 font-display text-lg font-semibold tracking-wide text-farine-50">
              {{ day.location.name }}
            </p>
            <p class="text-sm text-farine-200/70">
              {{ day.location.address }}, {{ day.location.zip }} {{ day.location.city }}
            </p>
          </div>

          <div
            v-if="kind === 'later' && day?.opensAt"
            class="mt-4 min-h-7"
          >
            <LazyLandingCeSoirCountdown
              :opens-at="day.opensAt"
              :label="c.hero.countdown"
              :done="c.hero.countdownDone"
            />
          </div>
          <p
            v-else-if="kind === 'live' && day?.closesAt"
            class="eyebrow mt-4 text-emerald-300"
          >
            {{ c.hero.liveUntil(hour(day.closesAt)) }}
          </p>

          <div class="mt-6 flex flex-col gap-2">
            <a
              :href="contact.phoneHref"
              class="btn-fire cs-call w-full !justify-start !gap-4 !rounded-2xl !py-3 !pl-3 !pr-6"
              data-track="call_clicked"
              :data-track-source="source"
            >
              <span class="grid size-11 shrink-0 place-items-center rounded-xl bg-charbon-950/90 text-braise-300">
                <UIcon
                  name="i-lucide-phone"
                  class="size-5"
                />
              </span>
              <span class="flex flex-col text-left leading-tight">
                <span class="text-[11px] font-semibold uppercase tracking-[0.18em] text-charbon-950/70">{{ c.hero.call }}</span>
                <span class="font-display text-xl font-bold tracking-wider sm:text-2xl">{{ contact.phone }}</span>
              </span>
            </a>
            <a
              v-if="day?.location"
              :href="directionsUrl(day.location)"
              target="_blank"
              rel="noopener"
              class="group inline-flex min-h-11 items-center gap-2 self-start text-sm font-medium text-farine-100/85 hover:text-farine-50"
              data-track="directions_clicked"
              :data-track-source="source"
            >
              <UIcon
                name="i-lucide-navigation"
                class="size-4 text-braise-300"
              />
              <span class="underline decoration-braise-400/50 underline-offset-4 group-hover:decoration-braise-300">{{ c.hero.itinerary }} · {{ day.location.city }}</span>
            </a>
          </div>
        </aside>
      </div>

      <ul class="mt-12 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-farine-100/10 pt-5 lg:mt-16 lg:grid-cols-4">
        <li
          v-for="fact in c.hero.facts"
          :key="fact"
          class="flex items-start gap-2 text-xs leading-snug text-farine-200/65 sm:text-[13px]"
        >
          <span
            class="mt-[0.3em] size-1.5 shrink-0 rotate-45 bg-braise-400/80"
            aria-hidden="true"
          />
          {{ fact }}
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.cs-masthead {
  position: relative;
  border-top: 1px solid rgb(252 247 238 / 0.18);
  border-bottom: 1px solid rgb(252 247 238 / 0.18);
}
.cs-masthead::before {
  content: "";
  position: absolute;
  inset: -4px 0 auto;
  height: 1px;
  background: rgb(252 247 238 / 0.1);
}

.cs-fit {
  container-type: inline-size;
}

.cs-line {
  /* Masque de révélation : on laisse de la place aux jambages et à l'italique */
  overflow: hidden;
  padding: 0.02em 0.14em 0.12em 0;
  margin-bottom: -0.1em;
}
.cs-line--caps {
  font-family: var(--font-display);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.015em;
  line-height: 1;
  font-size: min(calc(var(--caps) * 1cqi), 6.25rem);
}
.cs-line--star {
  font-family: var(--font-serif);
  font-style: italic;
  font-weight: 380;
  letter-spacing: -0.025em;
  line-height: 0.86;
  font-size: min(calc(var(--star) * 1cqi), 12.5rem);
  margin: -0.02em 0 -0.2em -0.04em;
  padding-bottom: 0.24em;
}
.cs-star {
  /* La zone peinte du dégradé doit couvrir jambages et débords de l'italique */
  display: inline-block;
  padding: 0.04em 0.12em 0.24em 0.02em;
  margin: -0.04em -0.12em -0.24em -0.02em;
  background: linear-gradient(100deg, var(--color-braise-200) 0%, var(--color-braise-300) 35%, var(--color-braise-500) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.cs-ghost {
  right: -0.06em;
  bottom: -0.2em;
  font-size: clamp(16rem, 42vw, 40rem);
  color: transparent;
  -webkit-text-stroke: 1px rgb(224 170 62 / 0.12);
}

@media (prefers-reduced-motion: no-preference) {
  .cs-line-inner {
    animation: cs-rise 1s cubic-bezier(0.16, 0.8, 0.12, 1) both;
    animation-delay: calc(var(--i) * 110ms + 60ms);
  }
  .cs-rule {
    transform-origin: left;
    animation: cs-draw 1.1s cubic-bezier(0.6, 0, 0.2, 1) 0.55s both;
  }
  .cs-kicker,
  .cs-aside {
    animation: cs-fade 0.9s ease-out 0.35s both;
  }
  .cs-ghost {
    animation: cs-fade 2.4s ease-out 0.2s both;
  }
}

@keyframes cs-rise {
  from {
    transform: translateY(105%);
  }
}
@keyframes cs-draw {
  from {
    transform: scaleX(0);
  }
}
@keyframes cs-fade {
  from {
    opacity: 0;
    transform: translateY(0.75rem);
  }
}
</style>
