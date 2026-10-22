<script setup lang="ts">
import { richText } from '~/utils/rich-text'

/** Affiche de fermeture exceptionnelle ou de congés */
const props = defineProps<PrintProps<'fermeture'> & { overrides?: Record<string, string> }>()

const t = computed(() => props.text)
const closure = computed(() => props.data.closure)
const message = computed(() => props.data.message)
const reopening = computed(() => props.data.reopening)
/** Une affiche s'imprime dès qu'il y a des dates, un message ou un titre / texte saisi à la main */
const hasContent = computed(() => Boolean(closure.value || message.value || props.overrides?.title || props.overrides?.body))

const days = computed(() => {
  if (!closure.value) return 0
  const ms = Date.parse(closure.value.endsOn) - Date.parse(closure.value.startsOn)
  return Math.round(ms / 86_400_000) + 1
})

const title = computed(() => props.overrides?.title
  || (message.value ? t.value.tr(message.value, 'title') : t.value.t(days.value > 3 ? 'closureMany' : 'closureOne')))

const body = computed(() => {
  const source = props.overrides?.body
    || (message.value ? t.value.tr(message.value, 'body') : null)
    || (closure.value?.note ? t.value.tr(closure.value, 'note') : null)
    || t.value.t('closureThanks')
  return richText(source)
})

const long = { weekday: 'long', day: 'numeric', month: 'long' } as const
const dates = computed(() => {
  const c = closure.value
  if (!c) return null
  const sameYear = c.startsOn.slice(0, 4) === c.endsOn.slice(0, 4)
  const year = c.endsOn.slice(0, 4) !== props.data.common.today.slice(0, 4) || !sameYear
  if (c.startsOn === c.endsOn) return { single: capitalize(t.value.date(c.startsOn, year ? { ...long, year: 'numeric' } : long)) }
  return {
    from: t.value.date(c.startsOn, sameYear ? long : { ...long, year: 'numeric' }),
    to: t.value.date(c.endsOn, year ? { ...long, year: 'numeric' } : long),
  }
})
const rangeParts = computed(() => t.value.raw('range').split(/(\{\w+\})/).filter(Boolean))
</script>

<template>
  <div class="pr-page pr-poster pr-closure">
    <!-- eslint-disable vue/no-v-html -- texte échappé par richText() -->
    <div class="pr-brand">
      <PrintEmblem
        :theme="options.theme"
        class="pr-brand__emblem"
      />
      <PrintWordmark
        :theme="options.theme"
        class="pr-brand__wordmark"
      />
    </div>

    <p
      v-if="!hasContent"
      class="pr-empty"
    >
      {{ t.t('empty') }}
    </p>

    <div
      v-else
      class="pr-poster__main"
      data-fit
    >
      <p class="pr-eyebrow pr-poster__eyebrow pr-ruled">
        {{ t.t('closureEyebrow') }}
      </p>
      <h1 class="pr-poster__title">
        {{ title }}
      </h1>
      <p
        v-if="dates"
        class="pr-closure__intro"
      >
        {{ t.t('closedOn') }}
      </p>
      <p
        v-if="dates"
        class="pr-closure__dates"
      >
        <template v-if="dates.single">
          <b>{{ dates.single }}</b>
        </template>
        <template v-else>
          <template
            v-for="(part, i) in rangeParts"
            :key="i"
          >
            <b v-if="part === '{from}'">{{ dates.from }}</b>
            <b v-else-if="part === '{to}'">{{ dates.to }}</b>
            <template v-else>
              {{ part }}
            </template>
          </template>
        </template>
      </p>
      <span class="pr-ornament"><span>◆</span></span>
      <div
        class="pr-poster__body pr-rich"
        v-html="body"
      />
      <div
        v-if="reopening?.location"
        class="pr-cartouche pr-reopen"
      >
        <p class="pr-eyebrow">
          {{ t.t('reopening') }}
        </p>
        <p class="pr-reopen__day">
          {{ capitalize(t.date(reopening.date)) }}
        </p>
        <p class="pr-reopen__place">
          {{ t.t('reopeningAt', { place: reopening.location.city }) }}, {{ t.t('from') }} {{ t.hour(reopening.opensAt) }}
          <br>
          <span :style="{ fontSize: '0.8em', color: 'var(--muted)' }">{{ reopening.location.name }}</span>
        </p>
      </div>
    </div>

    <div class="pr-poster__foot">
      <PrintContact
        :text="text"
        :contact="data.common.contact"
      />
    </div>
  </div>
</template>
