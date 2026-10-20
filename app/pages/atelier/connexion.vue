<script setup lang="ts">
definePageMeta({ layout: false, i18n: false })
useHead({ title: 'Connexion · Atelier Sestini', htmlAttrs: { lang: 'fr' }, meta: [{ name: 'robots', content: 'noindex, nofollow' }] })

const route = useRoute()
const email = ref('')
const state = ref<'idle' | 'sending' | 'sent'>('idle')
const error = ref<string | null>(null)
const devLink = ref<string | null>(null)

const linkErrors: Record<string, string> = {
  lien: 'Ce lien de connexion n\'est pas valide.',
  expire: 'Ce lien a expiré ou a déjà été utilisé. Demandez-en un nouveau.',
}
const linkError = computed(() => linkErrors[String(route.query.erreur ?? '')] ?? null)

async function submit() {
  error.value = null
  state.value = 'sending'
  try {
    await $fetch('/api/auth/magic-link', {
      method: 'POST',
      body: { email: email.value, redirect: typeof route.query.redirect === 'string' ? route.query.redirect : undefined },
    })
    state.value = 'sent'
    if (import.meta.dev) {
      const outbox = await $fetch<{ text: string }[]>('/api/auth/dev-outbox').catch(() => [])
      devLink.value = outbox[0]?.text.match(/https?:\/\/\S+/)?.[0] ?? null
    }
  }
  catch (e) {
    const err = e as { data?: { statusMessage?: string } }
    error.value = err.data?.statusMessage ?? 'Une erreur est survenue.'
    state.value = 'idle'
  }
}
</script>

<template>
  <div class="grain grid min-h-dvh place-items-center bg-charbon-950 px-4 text-farine-100">
    <div class="w-full max-w-sm">
      <div class="mb-10 text-center">
        <img
          src="/brand/emblem.svg"
          alt=""
          class="mx-auto h-12 w-auto"
        >
        <p class="eyebrow mt-6 text-braise-300">
          Sestini Pizza
        </p>
        <h1 class="mt-2 font-display text-3xl font-semibold tracking-wider">
          Atelier
        </h1>
      </div>

      <div class="rounded-3xl border border-white/10 bg-white/[0.03] p-7 shadow-2xl shadow-black/40">
        <p
          v-if="linkError"
          class="mb-5 rounded-xl bg-tomate-500/15 px-4 py-3 text-sm text-tomate-400"
        >
          {{ linkError }}
        </p>

        <form
          v-if="state !== 'sent'"
          class="space-y-4"
          @submit.prevent="submit"
        >
          <label class="block">
            <span class="mb-2 block text-sm text-farine-200/80">Adresse e-mail</span>
            <input
              v-model="email"
              type="email"
              required
              autocomplete="email"
              placeholder="vous@exemple.fr"
              class="w-full rounded-xl border border-white/10 bg-charbon-900 px-4 py-3 text-farine-50 outline-none placeholder:text-farine-200/30 focus:border-braise-300"
            >
          </label>
          <p
            v-if="error"
            class="text-sm text-tomate-400"
          >
            {{ error }}
          </p>
          <button
            type="submit"
            class="btn-fire w-full"
            :disabled="state === 'sending'"
          >
            {{ state === 'sending' ? 'Envoi…' : 'Recevoir un lien de connexion' }}
          </button>
          <p class="text-center text-xs text-farine-200/45">
            Pas de mot de passe : un lien valable 15 minutes est envoyé aux adresses autorisées.
          </p>
        </form>

        <div
          v-else
          class="space-y-3 text-center"
        >
          <UIcon
            name="i-lucide-mail-check"
            class="mx-auto size-10 text-braise-300"
          />
          <p class="font-medium">
            Vérifiez votre boîte mail
          </p>
          <p class="text-sm text-farine-200/70">
            Si {{ email }} est autorisée, un lien de connexion vient d'être envoyé.
          </p>
          <a
            v-if="devLink"
            :href="devLink"
            class="mt-4 block rounded-xl border border-dashed border-braise-300/50 px-4 py-3 text-sm text-braise-200 hover:bg-braise-300/10"
          >
            Développement : ouvrir le lien
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
