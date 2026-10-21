<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin', i18n: false })
useHead({ title: 'Tableau de bord · Atelier' })

const { data } = await useFetch('/api/admin/overview')

const statusLabel: Record<string, string> = {
  'open-now': 'Ouvert en ce moment',
  'opens-later': 'Ouvre ce soir',
  'closed-now': 'Fermé pour ce soir',
  'closed-today': 'Fermé aujourd\'hui',
}
const weekday = (iso: string) => new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`))
const maxDaily = computed(() => Math.max(1, ...(data.value?.analytics.daily.map(d => d.pageviews) ?? [1])))
</script>

<template>
  <AdminPage
    title="Tableau de bord"
    description="Tout ce qui est en ligne en ce moment, et ce qui attend votre validation."
  >
    <UAlert
      v-if="data?.demoDatabase"
      color="warning"
      variant="subtle"
      icon="i-lucide-database"
      title="Base de démonstration"
      description="Aucune base Turso n'est configurée : les modifications seront perdues au prochain redémarrage du serveur."
    />

    <div
      v-if="data"
      class="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
    >
      <UCard>
        <p class="text-xs font-medium uppercase tracking-wider text-stone-500">
          Ce soir
        </p>
        <p class="mt-2 text-lg font-semibold">
          {{ data.tonight.today.location?.city ?? 'Fermé' }}
        </p>
        <p class="text-sm text-stone-500">
          {{ statusLabel[data.tonight.status] }}<template v-if="data.tonight.today.opensAt">
            · dès {{ data.tonight.today.opensAt.replace(':00', 'h') }}
          </template>
        </p>
      </UCard>
      <UCard>
        <p class="text-xs font-medium uppercase tracking-wider text-stone-500">
          Carte active
        </p>
        <p class="mt-2 text-lg font-semibold">
          {{ data.menu?.name ?? 'Aucune' }}
        </p>
        <p class="text-sm text-stone-500">
          {{ data.menu?.count ?? 0 }} pizzas
        </p>
      </UCard>
      <UCard>
        <p class="text-xs font-medium uppercase tracking-wider text-stone-500">
          Pizza du moment
        </p>
        <p class="mt-2 text-lg font-semibold">
          {{ data.featured[0]?.pizza ?? 'Aucune' }}
        </p>
        <p class="text-sm text-stone-500">
          Bandeau : {{ data.modal?.title ?? 'aucun message' }}
        </p>
      </UCard>
      <UCard :class="data.draftCount ? 'ring-2 ring-braise-400' : ''">
        <p class="text-xs font-medium uppercase tracking-wider text-stone-500">
          Brouillons à valider
        </p>
        <p class="mt-2 text-lg font-semibold">
          {{ data.draftCount }}
        </p>
        <UButton
          to="/atelier/brouillons"
          size="xs"
          variant="link"
          class="px-0"
          :label="data.draftCount ? 'Relire et publier' : 'Voir les brouillons'"
          trailing-icon="i-lucide-arrow-right"
        />
      </UCard>
    </div>

    <div
      v-if="data"
      class="grid gap-6 xl:grid-cols-[1.4fr_1fr]"
    >
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold">
              Audience, 7 derniers jours
            </h2>
            <UBadge
              :color="data.analytics.source === 'demo' ? 'warning' : 'success'"
              variant="subtle"
              :label="data.analytics.source === 'demo' ? 'Données de démo' : 'PostHog'"
            />
          </div>
        </template>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p class="text-2xl font-semibold">
              {{ data.analytics.visitors }}
            </p>
            <p class="text-xs text-stone-500">
              visiteurs
            </p>
          </div>
          <div>
            <p class="text-2xl font-semibold">
              {{ data.analytics.pageviews }}
            </p>
            <p class="text-xs text-stone-500">
              pages vues
            </p>
          </div>
          <div>
            <p class="text-2xl font-semibold text-braise-600">
              {{ data.analytics.callClicks }}
            </p>
            <p class="text-xs text-stone-500">
              clics « Appeler »
            </p>
          </div>
          <div>
            <p class="text-2xl font-semibold">
              {{ data.analytics.menuViews }}
            </p>
            <p class="text-xs text-stone-500">
              vues de la carte
            </p>
          </div>
        </div>
        <div
          class="mt-6 flex h-36 gap-2"
          role="img"
          aria-label="Pages vues par jour"
        >
          <div
            v-for="d in data.analytics.daily"
            :key="d.date"
            class="flex flex-1 flex-col items-center gap-1"
          >
            <div class="flex w-full flex-1 items-end">
              <div
                class="w-full rounded-t-md bg-braise-300"
                :style="{ height: `${(d.pageviews / maxDaily) * 100}%` }"
                :title="`${d.pageviews} pages vues, ${d.callClicks} appels`"
              />
            </div>
            <span class="text-[10px] text-stone-500">{{ weekday(d.date) }}</span>
          </div>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="font-semibold">
            Les 7 prochains jours
          </h2>
        </template>
        <ul class="divide-y divide-stone-100 text-sm">
          <li
            v-for="d in data.week"
            :key="d.date"
            class="flex items-center justify-between py-2"
          >
            <span class="capitalize text-stone-600">{{ weekday(d.date) }}</span>
            <span :class="d.open ? 'font-medium' : 'text-stone-400'">
              {{ d.open ? d.location?.city : 'Fermé' }}
              <UBadge
                v-if="d.exception"
                size="sm"
                color="warning"
                variant="subtle"
                label="exception"
                class="ml-1"
              />
            </span>
          </li>
        </ul>
        <template #footer>
          <UButton
            to="/atelier/horaires"
            variant="link"
            class="px-0"
            label="Gérer les horaires"
            trailing-icon="i-lucide-arrow-right"
          />
        </template>
      </UCard>
    </div>

    <UCard v-if="data">
      <template #header>
        <h2 class="font-semibold">
          Dernières modifications
        </h2>
      </template>
      <AdminRevisionList :revisions="data.recentRevisions" />
    </UCard>
  </AdminPage>
</template>
