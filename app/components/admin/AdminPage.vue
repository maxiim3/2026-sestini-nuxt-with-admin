<script setup lang="ts">
defineProps<{ title: string, description?: string }>()
</script>

<template>
  <UDashboardPanel :ui="{ body: 'gap-6 sm:gap-8' }">
    <template #header>
      <UDashboardNavbar
        :title="title"
        :ui="{ root: 'border-stone-200' }"
      >
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <slot name="actions" />
          <UButton
            to="/"
            target="_blank"
            icon="i-lucide-external-link"
            color="neutral"
            variant="ghost"
            label="Voir le site"
            class="hidden sm:inline-flex"
          />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <p
        v-if="description"
        class="-mb-2 max-w-3xl text-sm text-stone-500"
      >
        {{ description }}
      </p>
      <slot />
    </template>
  </UDashboardPanel>
</template>
