<script setup lang="ts">
import { richText } from '~/utils/rich-text'

/** Annonce d'un événement : lieu ponctuel ou ouverture exceptionnelle */
const props = defineProps<PrintProps<'evenement'> & { overrides?: Record<string, string> }>()

const t = computed(() => props.text)
const event = computed(() => props.data.event)
const message = computed(() => props.data.message)

const title = computed(() => props.overrides?.title
  || (message.value ? t.value.tr(message.value, 'title') : t.value.t('eventTitle')))

const body = computed(() => {
  const source = props.overrides?.body
    || (message.value ? t.value.tr(message.value, 'body') : null)
    || (event.value?.note ? t.value.tr(event.value, 'note') : null)
  return source ? richText(source) : null
})

const date = computed(() => {
  const e = event.value
  if (!e) return null
  return {
    weekday: t.value.date(e.startsOn, { weekday: 'long' }),
    day: t.value.date(e.startsOn, { day: 'numeric' }),
    month: t.value.date(e.startsOn, { month: 'long', year: 'numeric' }),
    until: e.endsOn !== e.startsOn ? t.value.t('until', { date: t.value.date(e.endsOn) }) : null,
  }
})

const address = computed(() => {
  const l = event.value?.location
  if (!l) return ''
  return [l.address, `${l.zip} ${l.city}`].filter(part => part && !l.name.toLowerCase().includes(part.toLowerCase())).join(', ')
})
</script>

<template>
  <div class="pr-page pr-poster pr-event">
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
      v-if="!event || !date"
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
        {{ t.t('eventEyebrow') }}
      </p>
      <h1
        class="pr-poster__title"
        :style="{ fontSize: '3.4em' }"
      >
        {{ title }}
      </h1>

      <div class="pr-event__grid">
        <div class="pr-event__date">
          <span class="pr-event__weekday">{{ date.weekday }}</span>
          <span class="pr-event__day">{{ date.day }}</span>
          <span class="pr-event__month">{{ date.month }}</span>
          <span class="pr-event__time">{{ t.t('from') }} {{ t.hour(event.opensAt) }}<template v-if="date.until"> · {{ date.until }}</template></span>
        </div>

        <div
          v-if="event.location"
          class="pr-cartouche pr-event__place"
        >
          <p class="pr-event__city">
            {{ event.location.city }}
          </p>
          <p class="pr-event__spot">
            {{ event.location.name }}
          </p>
          <p
            v-if="address"
            class="pr-event__address"
          >
            {{ address }}
          </p>
        </div>
      </div>

      <div
        v-if="body"
        class="pr-poster__body pr-rich"
        v-html="body"
      />
    </div>

    <div class="pr-poster__foot">
      <span class="pr-ornament"><span>◆</span></span>
      <PrintContact
        :text="text"
        :contact="data.common.contact"
      />
    </div>
  </div>
</template>
