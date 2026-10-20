<script setup lang="ts">
const { t, locale, locales } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const contact = useContact()
const route = useRoute()
const open = ref(false)

watch(() => route.fullPath, () => (open.value = false))

const links = computed(() => [
  { label: t('nav.menu'), to: localePath('la-carte') },
  { label: t('nav.findUs'), to: localePath('nous-trouver') },
])

const scrolled = ref(false)
onMounted(() => {
  const onScroll = () => (scrolled.value = window.scrollY > 24)
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
})
</script>

<template>
  <header
    class="fixed inset-x-0 top-0 z-40 transition-[background-color,backdrop-filter,border-color] duration-300"
    :class="scrolled || open ? 'border-b border-white/5 bg-charbon-950/80 backdrop-blur-xl' : 'border-b border-transparent'"
  >
    <a
      href="#contenu"
      class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded focus:bg-farine-50 focus:px-3 focus:py-2 focus:text-charbon-950"
    >{{ t('nav.skip') }}</a>
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:h-20 lg:px-8">
      <NuxtLink
        :to="localePath('index')"
        class="group flex items-center gap-3"
        aria-label="Sestini Pizza"
      >
        <img
          src="/brand/emblem.svg"
          alt=""
          width="48"
          height="28"
          class="h-7 w-auto transition-transform duration-500 group-hover:-rotate-3 lg:h-8"
        >
        <img
          src="/brand/wordmark.svg"
          alt="Sestini Pizza"
          width="160"
          height="18"
          class="hidden h-4 w-auto sm:block lg:h-[18px]"
        >
      </NuxtLink>

      <nav
        class="hidden items-center gap-8 md:flex"
        aria-label="Navigation principale"
      >
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="eyebrow text-farine-200/80 transition-colors hover:text-braise-300"
          active-class="!text-braise-300"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <div class="flex items-center gap-2">
        <UDropdownMenu
          :items="locales.map(l => ({ label: l.name, to: switchLocalePath(l.code), active: l.code === locale }))"
          :content="{ align: 'end' }"
        >
          <button
            class="eyebrow flex h-10 items-center gap-1 rounded-full px-3 text-farine-200/80 hover:text-farine-50"
            :aria-label="t('nav.language')"
          >
            <UIcon
              name="i-lucide-globe"
              class="size-4"
            />
            {{ locale }}
          </button>
        </UDropdownMenu>
        <a
          :href="contact.phoneHref"
          class="btn-fire hidden !py-2.5 text-sm sm:inline-flex"
          data-track="call_clicked"
          data-track-source="header"
        >
          <UIcon
            name="i-lucide-phone"
            class="size-4"
          />
          {{ contact.phone }}
        </a>
        <button
          class="grid size-10 place-items-center rounded-full text-farine-100 md:hidden"
          :aria-label="open ? t('nav.closeMenu') : t('nav.openMenu')"
          :aria-expanded="open"
          @click="open = !open"
        >
          <UIcon
            :name="open ? 'i-lucide-x' : 'i-lucide-menu'"
            class="size-6"
          />
        </button>
      </div>
    </div>

    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      leave-active-class="transition duration-200 ease-in"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <nav
        v-if="open"
        class="border-t border-white/5 px-4 pb-8 pt-4 md:hidden"
        aria-label="Navigation mobile"
      >
        <ul class="space-y-1">
          <li
            v-for="link in links"
            :key="link.to"
          >
            <NuxtLink
              :to="link.to"
              class="block py-3 font-display text-2xl tracking-wider text-farine-50"
            >
              {{ link.label }}
            </NuxtLink>
          </li>
        </ul>
        <a
          :href="contact.phoneHref"
          class="btn-fire mt-6 w-full"
          data-track="call_clicked"
          data-track-source="mobile-nav"
        >
          <UIcon
            name="i-lucide-phone"
            class="size-5"
          />
          {{ t('nav.callFull') }}
        </a>
      </nav>
    </Transition>
  </header>
</template>
