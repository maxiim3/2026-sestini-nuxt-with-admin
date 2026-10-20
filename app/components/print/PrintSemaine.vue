<script setup lang="ts">
/** La tournée de la semaine : sept jours, lieux, adresses, heure d'ouverture */
const props = defineProps<PrintProps<'semaine'>>()

const t = computed(() => props.text)
const sameMonth = computed(() => props.data.from.slice(0, 7) === props.data.to.slice(0, 7))
const rangeParts = computed(() => {
  const from = t.value.date(props.data.from, sameMonth.value ? { weekday: 'long', day: 'numeric' } : { weekday: 'long', day: 'numeric', month: 'long' })
  const to = t.value.date(props.data.to, { weekday: 'long', day: 'numeric', month: 'long' })
  return t.value.t('weekRange', { from, to })
})
const landscape = computed(() => props.options.orientation === 'landscape')
</script>

<template>
  <div class="pr-page pr-semaine">
    <header class="pr-semaine__head">
      <PrintEmblem
        :theme="options.theme"
        class="pr-brand__emblem"
      />
      <PrintWordmark
        :theme="options.theme"
        class="pr-brand__wordmark"
      />
      <p
        class="pr-eyebrow pr-ruled"
        :style="{ width: '100%', marginTop: '0.8em' }"
      >
        {{ t.t('weekEyebrow') }}
      </p>
      <h1 class="pr-semaine__title">
        {{ t.t('weekTitle') }}
      </h1>
      <p class="pr-semaine__range">
        {{ rangeParts }}
      </p>
    </header>

    <ol
      class="pr-days"
      data-fit
    >
      <li
        v-for="day in data.days"
        :key="day.date"
        class="pr-day"
        :class="{ 'pr-day--closed': !day.open }"
      >
        <div class="pr-day__when">
          <span class="pr-day__weekday">{{ t.weekday(day.weekday, landscape ? 'short' : 'long') }}</span>
          <span class="pr-day__date">{{ t.date(day.date, { day: 'numeric', month: 'long' }) }}</span>
        </div>
        <div>
          <template v-if="day.open && day.location">
            <p class="pr-day__city">
              {{ day.location.city }}
              <span
                v-if="day.exception"
                class="pr-day__badge"
              >{{ t.site.findUs.exception }}</span>
            </p>
            <p class="pr-day__spot">
              {{ day.location.name }}<template v-if="!landscape">
                <span> · {{ day.location.address }}</span>
              </template>
            </p>
          </template>
          <template v-else>
            <p class="pr-day__city">
              {{ day.exception ? t.site.findUs.closed : t.t('dayOff') }}
            </p>
          </template>
          <p
            v-if="day.exception?.note && !landscape"
            class="pr-day__note"
          >
            {{ t.tr(day.exception, 'note') }}
          </p>
        </div>
        <span
          v-if="day.open"
          class="pr-day__time"
        ><small>{{ t.t('from') }}</small>{{ t.hour(day.opensAt) }}</span>
        <span v-else />
      </li>
    </ol>

    <div class="pr-poster__foot">
      <PrintContact
        :text="text"
        :contact="data.common.contact"
      />
    </div>
  </div>
</template>
