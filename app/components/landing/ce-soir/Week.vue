<script setup lang="ts">
import { useCeSoir } from './useCeSoir'

const { c, hour, date, weekday, data, today } = useCeSoir()
const { tr } = useLocalized()
const localePath = useLocalePath()

const days = computed(() => (data.value?.week ?? []).slice(0, 7).map((d, i) => ({
  ...d,
  index: String(i + 1).padStart(2, '0'),
  isToday: d.date === today.value,
  name: weekday(d.date),
  short: date(d.date, { weekday: 'short' }).replace('.', ''),
  num: date(d.date, { day: 'numeric' }),
  month: date(d.date, { month: 'long' }),
  hours: d.open ? c.value.week.hours(hour(d.opensAt), d.closesAt ? hour(d.closesAt) : null) : '',
  note: d.exception?.note ? tr(d.exception, 'note') : '',
})))
</script>

<template>
  <section
    class="cs-week grain relative bg-farine-100 text-charbon-950"
    :style="{ '--panels': days.length }"
  >
    <!-- Mobile et tablette : liste verticale -->
    <div class="mx-auto max-w-2xl px-4 py-20 sm:px-6 sm:py-24 lg:hidden">
      <p class="eyebrow ruled text-braise-700">
        {{ c.week.eyebrow }}
      </p>
      <h2 class="mt-6 text-center">
        <span class="block font-display text-5xl font-semibold uppercase tracking-wide">{{ c.week.title }}</span>
        <span class="block font-serif text-5xl text-braise-700 italic">{{ c.week.titleEm }}</span>
      </h2>
      <p class="mx-auto mt-5 max-w-md text-center font-serif text-lg text-charbon-700 italic">
        {{ c.week.intro }}
      </p>

      <ol class="mt-12 border-t border-charbon-950/15">
        <li
          v-for="d in days"
          :key="d.date"
          class="cs-reveal grid grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-4 border-b border-charbon-950/15 py-4"
          :class="d.isToday ? '-mx-4 bg-charbon-950 px-4 text-farine-50 sm:-mx-6 sm:px-6' : ''"
          :aria-current="d.isToday ? 'date' : undefined"
        >
          <div class="text-center">
            <span
              class="block font-deco text-3xl font-bold leading-none"
              :class="d.isToday ? 'text-braise-300' : d.open ? 'text-charbon-950' : 'text-charbon-400'"
            >{{ d.num }}</span>
            <span
              class="mt-1 block text-[10px] font-semibold uppercase tracking-[0.2em]"
              :class="d.isToday ? 'text-farine-200/70' : 'text-charbon-500'"
            >{{ d.short }}</span>
          </div>
          <div class="min-w-0">
            <template v-if="d.open && d.location">
              <p class="font-serif text-[1.4rem] leading-tight break-words italic sm:text-2xl">
                {{ d.location.city }}
              </p>
              <p
                class="truncate text-xs"
                :class="d.isToday ? 'text-farine-200/65' : 'text-charbon-600'"
              >
                {{ d.location.name }}
              </p>
            </template>
            <p
              v-else
              class="font-serif text-xl italic"
              :class="d.isToday ? 'text-farine-200/70' : 'text-charbon-500'"
            >
              {{ d.note || c.week.closed }}
            </p>
          </div>
          <div class="text-right">
            <span
              v-if="d.isToday"
              class="mb-1 inline-block rounded-full bg-braise-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-charbon-950"
            >{{ c.week.tonight }}</span>
            <span
              v-else-if="d.exception && d.open"
              class="mb-1 inline-block rounded-full bg-braise-700/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-braise-800"
            >{{ c.week.exception }}</span>
            <span
              v-if="d.hours"
              class="block text-sm tabular-nums"
              :class="d.isToday ? 'text-farine-100' : 'text-charbon-700'"
            >{{ d.hours }}</span>
          </div>
        </li>
      </ol>

      <div class="mt-10 text-center">
        <NuxtLink
          :to="localePath('nous-trouver')"
          class="btn-ghost min-h-11 text-charbon-950"
        >
          {{ c.week.seeAll }}
          <UIcon
            name="i-lucide-arrow-right"
            class="size-4"
          />
        </NuxtLink>
      </div>
    </div>

    <!-- Desktop : défilement horizontal épinglé (animation pilotée par le défilement, CSS pur) -->
    <div class="cs-pin hidden lg:block">
      <div class="cs-sticky">
        <div class="cs-track flex h-full w-max">
          <header class="cs-panel cs-panel--intro flex h-full shrink-0 flex-col justify-between py-12 pl-[max(2rem,calc((100vw-80rem)/2+2rem))] pr-14">
            <p class="eyebrow text-braise-700">
              {{ c.week.eyebrow }}
            </p>
            <div>
              <h2>
                <span class="block font-display text-[clamp(3rem,4.4vw,4.75rem)] font-semibold uppercase leading-[0.95] tracking-wide">{{ c.week.title }}</span>
                <span class="-mt-1 block font-serif text-[clamp(3.5rem,5.4vw,6rem)] leading-[0.95] text-braise-700 italic">{{ c.week.titleEm }}</span>
              </h2>
              <p class="mt-6 max-w-sm font-serif text-xl text-charbon-700 italic">
                {{ c.week.intro }}
              </p>
            </div>
            <div class="flex items-center gap-6">
              <NuxtLink
                :to="localePath('nous-trouver')"
                class="btn-ghost text-charbon-950"
              >
                {{ c.week.seeAll }}
                <UIcon
                  name="i-lucide-arrow-right"
                  class="size-4"
                />
              </NuxtLink>
              <span
                class="cs-hint flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-charbon-500"
                aria-hidden="true"
              >
                <span class="h-px w-10 bg-current" />
                <UIcon
                  name="i-lucide-arrow-down-right"
                  class="size-4"
                />
              </span>
            </div>
          </header>

          <article
            v-for="d in days"
            :key="d.date"
            class="cs-panel cs-panel--day relative flex h-full shrink-0 flex-col border-l px-9 py-12"
            :class="[
              d.isToday ? 'border-charbon-950 bg-charbon-950 text-farine-50' : 'border-charbon-950/15',
            ]"
            :aria-current="d.isToday ? 'date' : undefined"
          >
            <div class="flex items-baseline justify-between gap-3">
              <span
                class="eyebrow"
                :class="d.isToday ? 'text-braise-300' : 'text-charbon-700'"
              >{{ d.name }}</span>
              <span
                v-if="d.isToday"
                class="rounded-full bg-braise-400 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-charbon-950"
              >{{ c.week.tonight }}</span>
              <span
                v-else
                class="font-display text-xs tabular-nums text-charbon-400"
              >{{ d.index }}</span>
            </div>

            <p
              class="mt-8 font-deco text-[clamp(7rem,12.5vw,13rem)] font-bold leading-[0.85]"
              :class="d.isToday ? 'cs-gold' : d.open ? 'text-charbon-950' : 'text-charbon-950/20'"
            >
              {{ d.num }}
            </p>
            <p
              class="eyebrow mt-3"
              :class="d.isToday ? 'text-farine-200/60' : 'text-charbon-500'"
            >
              {{ d.month }}
            </p>

            <div class="mt-auto">
              <span
                class="mb-5 block h-px w-12"
                :class="d.isToday ? 'bg-braise-400' : 'bg-charbon-950/30'"
              />
              <template v-if="d.open && d.location">
                <p
                  v-if="d.exception"
                  class="mb-2 text-[10px] font-bold uppercase tracking-[0.2em]"
                  :class="d.isToday ? 'text-braise-300' : 'text-braise-800'"
                >
                  {{ c.week.exception }}
                </p>
                <p class="font-serif text-[clamp(1.75rem,2.4vw,2.4rem)] leading-[1.05] italic">
                  {{ d.location.city }}
                </p>
                <p
                  class="mt-2 text-sm"
                  :class="d.isToday ? 'text-farine-200/70' : 'text-charbon-600'"
                >
                  {{ d.location.name }}
                </p>
                <p
                  class="mt-4 font-display text-lg font-semibold tabular-nums tracking-wider"
                  :class="d.isToday ? 'text-farine-50' : 'text-charbon-900'"
                >
                  {{ d.hours }}
                </p>
              </template>
              <p
                v-else
                class="font-serif text-[clamp(1.75rem,2.4vw,2.4rem)] italic"
                :class="d.isToday ? 'text-farine-200/60' : 'text-charbon-400'"
              >
                {{ d.note || c.week.closed }}
              </p>
            </div>
          </article>
          <div
            class="cs-panel--end h-full shrink-0 border-l border-charbon-950/15"
            aria-hidden="true"
          />
        </div>
        <div
          class="cs-progress absolute inset-x-0 bottom-0 h-[3px] bg-braise-500"
          aria-hidden="true"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.cs-gold {
  background: linear-gradient(160deg, var(--color-braise-200), var(--color-braise-500));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* Repli (sans animation pilotée par le défilement) : rangée défilable à la main */
.cs-sticky {
  position: relative;
  height: 40rem;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  overscroll-behavior-x: contain;
}
.cs-panel {
  scroll-snap-align: start;
}
.cs-panel--intro {
  width: 40rem;
}
.cs-panel--day {
  width: 22rem;
}
.cs-panel--end {
  width: 4rem;
}
.cs-progress {
  display: none;
}

@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) and (min-width: 1024px) {
    .cs-pin {
      view-timeline: --cs-week block;
      /* Hauteur = un écran + la distance horizontale à parcourir */
      height: calc(100vh + (40vw + var(--panels) * 25vw + 6vw - 100vw));
    }
    .cs-sticky {
      position: sticky;
      top: 0;
      height: 100vh;
      padding-top: 5rem;
      overflow: hidden;
    }
    .cs-panel--intro {
      width: 40vw;
    }
    .cs-panel--day {
      width: 25vw;
    }
    .cs-panel--end {
      width: 6vw;
    }
    .cs-track {
      animation: cs-slide linear both;
      animation-timeline: --cs-week;
      animation-range: contain 0% contain 100%;
    }
    .cs-progress {
      display: block;
      transform-origin: left;
      animation: cs-grow linear both;
      animation-timeline: --cs-week;
      animation-range: contain 0% contain 100%;
    }
  }
}

@keyframes cs-slide {
  to {
    transform: translateX(calc(-100% + 100vw));
  }
}
@keyframes cs-grow {
  from {
    transform: scaleX(0);
  }
}
</style>
