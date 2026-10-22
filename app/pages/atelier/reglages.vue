<script setup lang="ts">
import type { Operation } from '~~/shared/schemas'

definePageMeta({ layout: 'admin', middleware: 'admin', i18n: false })
useHead({ title: 'Réglages · Atelier' })

const { user } = useUserSession()
const toast = useToast()
const { data: settings, status } = await useFetch<Record<string, unknown>>('/api/admin/settings', { key: 'admin-settings' })
const { data: users, refresh: refreshUsers } = await useFetch('/api/admin/users', { key: 'admin-users' })
const { apply, pending } = useAdminWrite()

interface Form {
  contact: { phone: string, email: string, instagram: string, facebook: string, company: string }
  features: { desserts: boolean, reviews: boolean, featuredOnHome: boolean }
  pitch: { title: string, text: string }
}

function read<T extends object>(key: string): Partial<T> {
  return (settings.value?.[key] ?? {}) as Partial<T>
}
function fromSettings(): Form {
  const contact = read<Form['contact']>('site.contact')
  const features = read<Form['features']>('site.features')
  const pitch = read<Form['pitch']>('site.pitch')
  return {
    contact: { phone: contact.phone ?? '', email: contact.email ?? '', instagram: contact.instagram ?? '', facebook: contact.facebook ?? '', company: contact.company ?? '' },
    features: { desserts: features.desserts ?? false, reviews: features.reviews ?? true, featuredOnHome: features.featuredOnHome ?? true },
    pitch: { title: pitch.title ?? '', text: pitch.text ?? '' },
  }
}

const form = ref<Form>(fromSettings())
watch(settings, () => {
  form.value = fromSettings()
})

const KEYS = { contact: 'site.contact', features: 'site.features', pitch: 'site.pitch' } as const
type Section = keyof typeof KEYS
const changed = computed(() => {
  const base = fromSettings()
  return (Object.keys(KEYS) as Section[]).filter(k => JSON.stringify(form.value[k]) !== JSON.stringify(base[k]))
})

const FEATURES = [
  { key: 'featuredOnHome', label: 'Pizza du moment sur l\'accueil', description: 'Met en avant la pizza du moment en page d\'accueil.' },
  { key: 'reviews', label: 'Avis clients', description: 'Affiche la section des avis Google.' },
  { key: 'desserts', label: 'Desserts', description: 'Affiche la catégorie desserts sur la carte (à activer quand elle est prête).' },
] as const

const problems = computed(() => {
  const list: string[] = []
  const c = form.value.contact
  if (c.email && !/^\S+@\S+\.\S+$/.test(c.email)) list.push('L\'adresse e-mail ne semble pas valide.')
  for (const [label, value] of [['Instagram', c.instagram], ['Facebook', c.facebook]] as const) {
    if (value && !/^https?:\/\//.test(value)) list.push(`Le lien ${label} doit commencer par https://`)
  }
  if (!form.value.pitch.title.trim()) list.push('Le titre de présentation ne peut pas être vide.')
  return list
})

async function save(mode: 'publish' | 'draft') {
  const ops: Operation[] = changed.value.map(section => ({
    op: 'setSetting',
    key: KEYS[section],
    value: { ...read<Record<string, unknown>>(KEYS[section]), ...form.value[section] },
  }))
  if (!ops.length) return
  await apply('Réglages du site', ops, { mode })
}

// ─── Équipe ───
const isOwner = computed(() => user.value?.role === 'owner')
const ROLE_LABELS = { owner: 'Propriétaire', editor: 'Éditeur' } as const
const newUser = ref<{ email: string, name: string, role: 'owner' | 'editor' }>({ email: '', name: '', role: 'editor' })
const adding = ref(false)
const emailOk = computed(() => /^\S+@\S+\.\S+$/.test(newUser.value.email.trim()))

async function addUser() {
  adding.value = true
  try {
    await $fetch('/api/admin/users', {
      method: 'POST',
      body: { email: newUser.value.email.trim(), name: newUser.value.name.trim() || undefined, role: newUser.value.role },
    })
    toast.add({ title: 'Personne ajoutée', description: `${newUser.value.email.trim()} peut maintenant se connecter à l'atelier.`, color: 'success', icon: 'i-lucide-user-plus' })
    newUser.value = { email: '', name: '', role: 'editor' }
    await refreshUsers()
  }
  catch (error) {
    const err = error as { data?: { statusMessage?: string } }
    toast.add({ title: 'Impossible d\'ajouter cette personne', description: err.data?.statusMessage ?? String(error), color: 'error', icon: 'i-lucide-triangle-alert' })
  }
  finally {
    adding.value = false
  }
}
</script>

<template>
  <AdminPage
    title="Réglages"
    description="Les coordonnées affichées sur le site, la page d'accueil choisie, les modules visibles et les personnes qui ont accès à l'atelier."
  >
    <div
      v-if="status === 'pending'"
      class="space-y-4"
    >
      <USkeleton
        v-for="n in 3"
        :key="n"
        class="h-40"
      />
    </div>

    <template v-else>
      <div class="grid items-start gap-6 xl:grid-cols-2 [&>*]:min-w-0">
        <UCard>
          <template #header>
            <h2 class="font-display text-lg font-semibold tracking-wide">
              Contact
            </h2>
            <p class="text-xs text-stone-500">
              Affiché dans le bandeau d'appel, le pied de page et la page « Nous trouver ».
            </p>
          </template>
          <div class="space-y-4">
            <UFormField label="Téléphone">
              <UInput
                v-model="form.contact.phone"
                type="tel"
                icon="i-lucide-phone"
                placeholder="07 88 52 91 78"
                class="w-full"
              />
            </UFormField>
            <UFormField label="E-mail">
              <UInput
                v-model="form.contact.email"
                type="email"
                icon="i-lucide-mail"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Instagram">
              <UInput
                v-model="form.contact.instagram"
                icon="i-simple-icons-instagram"
                placeholder="https://www.instagram.com/…"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Facebook">
              <UInput
                v-model="form.contact.facebook"
                icon="i-simple-icons-facebook"
                placeholder="https://www.facebook.com/…"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Société"
              help="Affiché en bas du site, par exemple « SARL 10558442XD »."
            >
              <UInput
                v-model="form.contact.company"
                icon="i-lucide-building-2"
                class="w-full"
              />
            </UFormField>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-display text-lg font-semibold tracking-wide">
              Présentation
            </h2>
            <p class="text-xs text-stone-500">
              Le titre et le texte qui présentent Sestini Pizza.
            </p>
          </template>
          <div class="space-y-4">
            <UFormField label="Titre">
              <UInput
                v-model="form.pitch.title"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Texte">
              <UTextarea
                v-model="form.pitch.text"
                :rows="5"
                autoresize
                class="w-full"
              />
            </UFormField>
          </div>
        </UCard>

        <UCard class="xl:col-span-2">
          <template #header>
            <h2 class="font-display text-lg font-semibold tracking-wide">
              Modules visibles
            </h2>
            <p class="text-xs text-stone-500">
              Activez ou masquez des parties du site sans rien supprimer.
            </p>
          </template>
          <ul class="divide-y divide-stone-100">
            <li
              v-for="f in FEATURES"
              :key="f.key"
              class="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div>
                <p class="font-medium">
                  {{ f.label }}
                </p>
                <p class="text-sm text-stone-500">
                  {{ f.description }}
                </p>
              </div>
              <USwitch v-model="form.features[f.key]" />
            </li>
          </ul>
        </UCard>
      </div>

      <div
        class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3"
      >
        <p
          class="text-sm"
          :class="problems.length ? 'text-red-600' : 'text-stone-500'"
        >
          <template v-if="problems.length">
            {{ problems[0] }}
          </template>
          <template v-else-if="changed.length">
            Modifications non enregistrées.
          </template>
          <template v-else>
            Tout est à jour.
          </template>
        </p>
        <AdminPublishBar
          :loading="pending"
          :disabled="!changed.length || problems.length > 0"
          @save="save"
        />
      </div>
    </template>

    <UCard class="shrink-0">
      <template #header>
        <h2 class="font-display text-lg font-semibold tracking-wide">
          Accès à l'atelier
        </h2>
        <p class="text-xs text-stone-500">
          Les personnes autorisées à se connecter (par lien reçu par e-mail).
        </p>
      </template>

      <ul class="divide-y divide-stone-100">
        <li
          v-for="u in users"
          :key="u.id"
          class="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0"
        >
          <div class="min-w-0">
            <p class="truncate font-medium">
              {{ u.name || u.email }}
            </p>
            <p class="truncate text-sm text-stone-500">
              <template v-if="u.name">
                {{ u.email }} ·
              </template>
              {{ u.lastLoginAt ? `Dernière connexion le ${dateTimeFr(u.lastLoginAt)}` : 'Jamais connecté' }}
            </p>
          </div>
          <UBadge
            :color="u.role === 'owner' ? 'primary' : 'neutral'"
            variant="subtle"
            :label="ROLE_LABELS[u.role]"
          />
        </li>
      </ul>

      <div
        v-if="isOwner"
        class="mt-5 space-y-3 border-t border-stone-100 pt-5"
      >
        <p class="text-sm font-medium">
          Ajouter une personne
        </p>
        <div class="grid gap-3 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.8fr)_auto]">
          <UInput
            v-model="newUser.email"
            type="email"
            placeholder="E-mail"
            aria-label="E-mail"
            class="w-full"
          />
          <UInput
            v-model="newUser.name"
            placeholder="Prénom (facultatif)"
            aria-label="Prénom"
            class="w-full"
          />
          <USelect
            v-model="newUser.role"
            :items="[{ label: 'Éditeur', value: 'editor' }, { label: 'Propriétaire', value: 'owner' }]"
            aria-label="Rôle"
            class="w-full"
          />
          <UButton
            icon="i-lucide-user-plus"
            label="Ajouter"
            :disabled="!emailOk"
            :loading="adding"
            @click="addUser"
          />
        </div>
        <p class="text-xs text-stone-500">
          Un éditeur peut modifier le contenu. Un propriétaire peut en plus ajouter des personnes.
        </p>
      </div>
      <p
        v-else
        class="mt-4 text-sm text-stone-500"
      >
        Seul un propriétaire peut ajouter des personnes.
      </p>
    </UCard>
  </AdminPage>
</template>
