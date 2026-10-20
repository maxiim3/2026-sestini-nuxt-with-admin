<script setup lang="ts">
const { user, clear } = useUserSession()
const { data: drafts } = await useFetch('/api/admin/changesets', { query: { status: 'draft' }, key: 'admin-drafts' })

const items = computed(() => ADMIN_NAV.map(item => ({
  ...item,
  badge: item.to === '/atelier/brouillons' && drafts.value?.length ? String(drafts.value.length) : undefined,
})))

async function logout() {
  await clear()
  await navigateTo('/atelier/connexion')
}

useHead({ htmlAttrs: { lang: 'fr' }, meta: [{ name: 'robots', content: 'noindex, nofollow' }] })
</script>

<template>
  <UDashboardGroup class="bg-white font-sans text-stone-900">
    <UDashboardSidebar
      collapsible
      resizable
      :ui="{ root: 'bg-stone-50 border-stone-200', footer: 'border-t border-stone-200' }"
    >
      <template #header="{ collapsed }">
        <NuxtLink
          to="/atelier"
          class="flex items-center gap-2.5"
        >
          <span class="grid size-8 shrink-0 place-items-center rounded-lg bg-charbon-950">
            <img
              src="/brand/emblem.svg"
              alt=""
              class="h-4 w-auto"
            >
          </span>
          <span
            v-if="!collapsed"
            class="leading-tight"
          >
            <span class="block font-display text-sm font-semibold tracking-wider">Sestini</span>
            <span class="block text-xs text-stone-500">Atelier</span>
          </span>
        </NuxtLink>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="items"
          orientation="vertical"
        />
      </template>

      <template #footer="{ collapsed }">
        <div class="flex w-full items-center gap-2">
          <UAvatar
            :alt="user?.name ?? user?.email"
            size="sm"
          />
          <div
            v-if="!collapsed"
            class="min-w-0 flex-1"
          >
            <p class="truncate text-sm font-medium">
              {{ user?.name ?? 'Connecté' }}
            </p>
            <p class="truncate text-xs text-stone-500">
              {{ user?.email }}
            </p>
          </div>
          <UButton
            icon="i-lucide-log-out"
            color="neutral"
            variant="ghost"
            aria-label="Se déconnecter"
            @click="logout"
          />
        </div>
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
