<script setup lang="ts">
const { t, locale, locales } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const contact = useContact()
const year = new Date().getFullYear()

function changeLocale(event: Event) {
  navigateTo(switchLocalePath((event.target as HTMLSelectElement).value as typeof locale.value))
}
</script>

<template>
  <footer class="border-t border-nero-line bg-nero pb-[calc(4.25rem+env(safe-area-inset-bottom))] text-[14.5px] leading-relaxed text-fumo-dark md:pb-0">
    <div class="mx-auto max-w-[1200px] px-5 lg:px-10">
      <div class="grid gap-9 py-14 md:grid-cols-[1.3fr_1fr_1fr] md:gap-14 md:py-18">
        <div>
          <NuxtLink
            :to="localePath('index')"
            class="flex items-center gap-2.5 text-crema"
            aria-label="Sestini Pizza"
          >
            <img
              src="/brand/emblem.svg"
              alt=""
              width="44"
              height="26"
              class="h-8 w-auto"
              loading="lazy"
            >
            <span class="font-display text-[22px] font-semibold leading-none">Sestini<small class="ml-1 text-[0.72em] tracking-[0.06em]">PIZZA</small></span>
          </NuxtLink>
          <p class="mt-3 max-w-[30ch]">
            {{ t('brand.pitch') }}
          </p>
          <div class="mt-5 flex gap-2.5">
            <a
              :href="contact.facebook"
              target="_blank"
              rel="noopener"
              aria-label="Facebook"
              class="grid size-10 place-items-center border border-nero-line text-crema transition hover:border-abricot"
            >
              <UIcon
                name="i-simple-icons-facebook"
                class="size-4"
              />
            </a>
            <a
              :href="contact.instagram"
              target="_blank"
              rel="noopener"
              aria-label="Instagram"
              class="grid size-10 place-items-center border border-nero-line text-crema transition hover:border-abricot"
            >
              <UIcon
                name="i-simple-icons-instagram"
                class="size-4"
              />
            </a>
          </div>
        </div>

        <div>
          <h2 class="kicker mb-2.5 text-crema">
            {{ t('footer.order') }}
          </h2>
          <a
            :href="contact.phoneHref"
            class="mb-1 inline-block font-title text-[26px] leading-tight text-crema tabular-nums"
            data-track="call_clicked"
            data-track-source="footer"
          >{{ contact.phone }}</a>
          <p>{{ t('footer.orderText') }}</p>
        </div>

        <div>
          <h2 class="kicker mb-2.5 text-crema">
            {{ t('footer.findUs') }}
          </h2>
          <p>{{ t('brand.area') }}</p>
          <p class="mt-2">
            <NuxtLink
              :to="localePath('nous-trouver')"
              class="text-crema"
            >
              {{ t('footer.planning') }} →
            </NuxtLink>
          </p>
        </div>
      </div>

      <div class="grid gap-3 border-t border-nero-line pb-7 pt-5 text-[13px] md:grid-cols-[1fr_auto_auto] md:items-center md:gap-8">
        <div class="flex flex-wrap gap-x-4.5 gap-y-1.5">
          <span>© {{ year }} Sestini Pizza</span>
          <span v-if="contact.company">{{ contact.company }}</span>
          <NuxtLink
            :to="localePath('mentions-legales')"
            class="text-crema"
          >
            {{ t('footer.legal') }}
          </NuxtLink>
        </div>
        <span class="inline-flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <span>{{ t('footer.design') }} : <b class="font-semibold text-crema">Maxime Tamburrini</b>, Digital Solution Studio</span>
          <span class="inline-flex gap-2">
            <a
              href="https://github.com/maxiim3"
              target="_blank"
              rel="noopener"
              aria-label="GitHub de Maxime Tamburrini"
              class="opacity-70 transition hover:text-crema hover:opacity-100"
            >
              <UIcon
                name="i-simple-icons-github"
                class="size-4"
              />
            </a>
            <a
              href="https://www.linkedin.com/in/maximetamburrini/"
              target="_blank"
              rel="noopener"
              aria-label="LinkedIn de Maxime Tamburrini"
              class="opacity-70 transition hover:text-crema hover:opacity-100"
            >
              <UIcon
                name="i-simple-icons-linkedin"
                class="size-4"
              />
            </a>
          </span>
        </span>
        <label class="inline-flex items-center gap-2">
          {{ t('nav.language') }}
          <select
            :value="locale"
            class="border border-nero-line bg-nero-2 px-2 py-1 text-crema"
            @change="changeLocale"
          >
            <option
              v-for="l in locales"
              :key="l.code"
              :value="l.code"
            >{{ l.name }}</option>
          </select>
        </label>
      </div>
    </div>
  </footer>
</template>
