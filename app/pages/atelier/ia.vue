<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin', i18n: false })
useHead({ title: 'IA & MCP · Atelier' })

const toast = useToast()
const { data: tokens, refresh } = await useFetch('/api/admin/tokens', { key: 'admin-tokens' })
const { data: audit } = await useFetch('/api/admin/audit', { key: 'admin-audit' })
const origin = useRequestURL().origin
const endpoint = `${origin}/mcp`

const form = reactive({ name: '', scopes: ['read', 'write'] as ('read' | 'write' | 'publish')[], expiresInDays: 90 })
const created = ref<string | null>(null)
const creating = ref(false)

async function create() {
  creating.value = true
  try {
    const res = await $fetch('/api/admin/tokens', { method: 'POST', body: form })
    created.value = res.token
    form.name = ''
    await refresh()
  }
  finally {
    creating.value = false
  }
}

async function revoke(id: string) {
  await $fetch(`/api/admin/tokens/${id}`, { method: 'DELETE' })
  toast.add({ title: 'Jeton révoqué', color: 'neutral' })
  await refresh()
}

async function copy(text: string) {
  await navigator.clipboard.writeText(text)
  toast.add({ title: 'Copié', color: 'success', icon: 'i-lucide-clipboard-check' })
}

const claudeCommand = computed(() => `claude mcp add --transport http sestini ${endpoint} --header "Authorization: Bearer ${created.value ?? '<VOTRE_JETON>'}"`)
const jsonConfig = computed(() => JSON.stringify({ mcpServers: { sestini: { type: 'http', url: endpoint, headers: { Authorization: `Bearer ${created.value ?? '<VOTRE_JETON>'}` } } } }, null, 2))

const SCOPES = [
  { value: 'read', label: 'Lecture', description: 'Consulter la carte, les horaires, l\'audience.' },
  { value: 'write', label: 'Propositions', description: 'Créer des brouillons que vous validez ici.' },
  { value: 'publish', label: 'Publication directe', description: 'Publier sans validation (à réserver à un agent de confiance).' },
] as const
</script>

<template>
  <AdminPage
    title="IA & MCP"
    description="Confiez les mises à jour du site à votre agent IA (Claude, Cursor…). Il se connecte au serveur MCP du site avec un jeton personnel que vous créez ici et pouvez révoquer à tout moment."
  >
    <div class="grid gap-6 xl:grid-cols-2">
      <UCard>
        <template #header>
          <h2 class="font-semibold">
            Nouveau jeton
          </h2>
        </template>
        <div class="space-y-4">
          <UFormField label="Nom">
            <UInput
              v-model="form.name"
              placeholder="Claude Code sur mon Mac"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Permissions">
            <div class="space-y-2">
              <label
                v-for="scope in SCOPES"
                :key="scope.value"
                class="flex items-start gap-3 rounded-lg border border-stone-200 p-3"
              >
                <UCheckbox
                  :model-value="form.scopes.includes(scope.value)"
                  :disabled="scope.value === 'read'"
                  @update:model-value="v => form.scopes = v ? [...form.scopes, scope.value] : form.scopes.filter(s => s !== scope.value)"
                />
                <span>
                  <span class="block text-sm font-medium">{{ scope.label }}</span>
                  <span class="block text-xs text-stone-500">{{ scope.description }}</span>
                </span>
              </label>
            </div>
          </UFormField>
          <UFormField label="Expiration">
            <USelect
              v-model="form.expiresInDays"
              :items="[{ label: '30 jours', value: 30 }, { label: '90 jours', value: 90 }, { label: '1 an', value: 365 }]"
              class="w-full"
            />
          </UFormField>
          <UButton
            icon="i-lucide-key-round"
            label="Créer le jeton"
            :disabled="!form.name.trim()"
            :loading="creating"
            @click="create"
          />
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="font-semibold">
            Connecter un agent
          </h2>
        </template>
        <div class="space-y-4 text-sm">
          <UAlert
            v-if="created"
            color="success"
            variant="subtle"
            icon="i-lucide-shield-check"
            title="Copiez ce jeton maintenant : il ne sera plus affiché."
          >
            <template #description>
              <div class="mt-2 flex items-center gap-2">
                <code class="min-w-0 flex-1 truncate rounded bg-white px-2 py-1 font-mono text-xs">{{ created }}</code>
                <UButton
                  size="xs"
                  icon="i-lucide-copy"
                  @click="copy(created)"
                />
              </div>
            </template>
          </UAlert>
          <div>
            <p class="mb-1 font-medium">
              Adresse du serveur
            </p>
            <code class="block rounded-lg bg-stone-100 px-3 py-2 font-mono text-xs">{{ endpoint }}</code>
          </div>
          <div>
            <p class="mb-1 flex items-center justify-between font-medium">
              Claude Code
              <UButton
                size="xs"
                variant="ghost"
                icon="i-lucide-copy"
                @click="copy(claudeCommand)"
              />
            </p>
            <pre class="overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-charbon-950 p-3 font-mono text-xs text-farine-100">{{ claudeCommand }}</pre>
          </div>
          <div>
            <p class="mb-1 flex items-center justify-between font-medium">
              Configuration JSON (Claude Desktop, Cursor…)
              <UButton
                size="xs"
                variant="ghost"
                icon="i-lucide-copy"
                @click="copy(jsonConfig)"
              />
            </p>
            <pre class="overflow-x-auto rounded-lg bg-charbon-950 p-3 font-mono text-xs text-farine-100">{{ jsonConfig }}</pre>
          </div>
          <p class="text-stone-500">
            Exemples à demander : « Mets la pizza du moment sur une truffe à 19,50 € dès vendredi », « On ferme du 21 décembre au 5 janvier, préviens les clients », « Quelles pages ont le plus de visites cette semaine ? ».
          </p>
        </div>
      </UCard>
    </div>

    <UCard>
      <template #header>
        <h2 class="font-semibold">
          Jetons
        </h2>
      </template>
      <ul class="divide-y divide-stone-100">
        <li
          v-for="t in tokens"
          :key="t.id"
          class="flex flex-wrap items-center gap-3 py-3 text-sm"
          :class="t.revokedAt && 'opacity-50'"
        >
          <UIcon
            name="i-lucide-key-round"
            class="size-4 text-stone-400"
          />
          <div class="min-w-0 flex-1">
            <p class="font-medium">
              {{ t.name }} <code class="ml-1 font-mono text-xs text-stone-500">{{ t.prefix }}…</code>
            </p>
            <p class="text-xs text-stone-500">
              {{ t.owner }} · {{ t.scopes.join(', ') }} · créé {{ dateTimeFr(t.createdAt) }} · utilisé {{ dateTimeFr(t.lastUsedAt) }}
              <template v-if="t.expiresAt">
                · expire {{ dateFr(t.expiresAt) }}
              </template>
            </p>
          </div>
          <UBadge
            v-if="t.revokedAt"
            color="neutral"
            variant="subtle"
            label="révoqué"
          />
          <UButton
            v-else
            size="xs"
            color="error"
            variant="outline"
            label="Révoquer"
            @click="revoke(t.id)"
          />
        </li>
        <li
          v-if="!tokens?.length"
          class="py-6 text-center text-sm text-stone-500"
        >
          Aucun jeton pour l'instant.
        </li>
      </ul>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="font-semibold">
          Journal des appels de l'IA
        </h2>
      </template>
      <ul class="divide-y divide-stone-100 text-sm">
        <li
          v-for="a in audit"
          :key="a.id"
          class="flex items-start gap-3 py-2"
        >
          <UIcon
            :name="a.ok ? 'i-lucide-circle-check' : 'i-lucide-circle-x'"
            :class="a.ok ? 'text-emerald-600' : 'text-red-600'"
            class="mt-0.5 size-4 shrink-0"
          />
          <div class="min-w-0 flex-1">
            <p>
              <code class="font-mono">{{ a.tool }}</code>
              <span class="text-xs text-stone-500"> · {{ dateTimeFr(a.createdAt) }}</span>
            </p>
            <p
              v-if="a.error"
              class="text-xs text-red-600"
            >
              {{ a.error }}
            </p>
          </div>
        </li>
        <li
          v-if="!audit?.length"
          class="py-6 text-center text-stone-500"
        >
          Aucun appel pour l'instant.
        </li>
      </ul>
    </UCard>
  </AdminPage>
</template>
