<script setup lang="ts">
import { LANDING_VARIANTS, type LandingVariant } from '~~/shared/domain/constants'

const { t } = useI18n()
const route = useRoute()
const { data } = await useSite()

/** Variante choisie dans les réglages (admin / MCP), surchargeable par ?variante= pour comparer */
const variant = computed<LandingVariant>(() => {
  const forced = route.query.variante
  if (typeof forced === 'string' && (LANDING_VARIANTS as readonly string[]).includes(forced)) return forced as LandingVariant
  const settings = (data.value?.settings ?? {}) as Record<string, { variant?: LandingVariant } | undefined>
  return settings['site.landing']?.variant ?? 'four'
})

useSeoMeta({
  title: 'Sestini Pizza · Pizza au feu de bois près de Montpellier',
  description: () => t('brand.pitch'),
})
</script>

<template>
  <LazyLandingFour v-if="variant === 'four'" />
  <LazyLandingCeSoir v-else-if="variant === 'ce-soir'" />
  <LazyLandingTournee v-else />
</template>
