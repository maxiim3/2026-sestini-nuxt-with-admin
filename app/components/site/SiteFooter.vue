<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const contact = useContact()
const year = new Date().getFullYear()
</script>

<template>
  <footer class="grain border-t border-white/5 bg-charbon-950 pb-28 pt-16 text-farine-200 md:pb-12">
    <div class="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
      <div class="space-y-5">
        <img
          src="/brand/logo.svg"
          alt="Sestini Pizza, la pizza au feu de bois"
          width="220"
          height="97"
          class="h-auto w-52"
          loading="lazy"
        >
        <p class="max-w-sm text-sm leading-relaxed text-farine-200/70">
          {{ t('brand.pitch') }}
        </p>
      </div>

      <div>
        <h2 class="eyebrow mb-4 text-braise-300">
          {{ t('footer.contact') }}
        </h2>
        <ul class="space-y-2 text-sm">
          <li>
            <a
              :href="contact.phoneHref"
              class="hover:text-braise-300"
              data-track="call_clicked"
              data-track-source="footer"
            >{{ contact.phone }}</a>
          </li>
          <li>
            <a
              :href="`mailto:${contact.email}`"
              class="hover:text-braise-300"
            >{{ contact.email }}</a>
          </li>
          <li class="text-farine-200/60">
            {{ t('brand.area') }}
          </li>
        </ul>
      </div>

      <div>
        <h2 class="eyebrow mb-4 text-braise-300">
          {{ t('footer.follow') }}
        </h2>
        <div class="flex gap-3">
          <a
            :href="contact.instagram"
            target="_blank"
            rel="noopener"
            aria-label="Instagram"
            class="grid size-11 place-items-center rounded-full border border-white/10 hover:border-braise-300 hover:text-braise-300"
          >
            <UIcon
              name="i-simple-icons-instagram"
              class="size-5"
            />
          </a>
          <a
            :href="contact.facebook"
            target="_blank"
            rel="noopener"
            aria-label="Facebook"
            class="grid size-11 place-items-center rounded-full border border-white/10 hover:border-braise-300 hover:text-braise-300"
          >
            <UIcon
              name="i-simple-icons-facebook"
              class="size-5"
            />
          </a>
        </div>
      </div>
    </div>

    <div class="mx-auto mt-14 flex max-w-7xl flex-col gap-3 border-t border-white/5 px-4 pt-6 text-xs text-farine-200/50 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
      <p>© {{ year }} Sestini Pizza · {{ t('footer.madeWith') }}</p>
      <NuxtLink
        :to="localePath('mentions-legales')"
        class="hover:text-farine-100"
      >
        {{ t('footer.legal') }}
      </NuxtLink>
    </div>
  </footer>
</template>
