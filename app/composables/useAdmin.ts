import type { Operation } from '~~/shared/schemas'

/**
 * Écritures de l'atelier. Tout passe par /api/admin/operations : publication
 * directe (avec historique) ou brouillon à valider.
 */
export function useAdminWrite() {
  const toast = useToast()
  const pending = ref(false)

  async function apply(title: string, operations: Operation[], options: { mode?: 'publish' | 'draft', silent?: boolean } = {}) {
    pending.value = true
    try {
      const result = await $fetch('/api/admin/operations', {
        method: 'POST',
        body: { title, operations, mode: options.mode ?? 'publish' },
      })
      if (!options.silent) {
        toast.add({
          title: options.mode === 'draft' ? 'Brouillon créé' : 'Publié',
          description: title,
          color: 'success',
          icon: options.mode === 'draft' ? 'i-lucide-file-pen' : 'i-lucide-check',
        })
      }
      await refreshNuxtData()
      return result
    }
    catch (error) {
      const err = error as { data?: { data?: { message?: string }, statusMessage?: string } }
      toast.add({
        title: 'Impossible d\'enregistrer',
        description: err.data?.data?.message ?? err.data?.statusMessage ?? String(error),
        color: 'error',
        icon: 'i-lucide-triangle-alert',
      })
      throw error
    }
    finally {
      pending.value = false
    }
  }

  return { apply, pending }
}

export const ADMIN_NAV = [
  { label: 'Tableau de bord', icon: 'i-lucide-layout-dashboard', to: '/atelier' },
  { label: 'La carte', icon: 'i-lucide-pizza', to: '/atelier/carte' },
  { label: 'Pizza du moment', icon: 'i-lucide-flame', to: '/atelier/pizza-du-moment' },
  { label: 'Ingrédients', icon: 'i-lucide-carrot', to: '/atelier/ingredients' },
  { label: 'Boissons & suppléments', icon: 'i-lucide-wine', to: '/atelier/boissons' },
  { label: 'Lieux & horaires', icon: 'i-lucide-calendar-clock', to: '/atelier/horaires' },
  { label: 'Messages', icon: 'i-lucide-megaphone', to: '/atelier/messages' },
  { label: 'Impression', icon: 'i-lucide-printer', to: '/atelier/impression' },
  { label: 'Brouillons', icon: 'i-lucide-file-pen', to: '/atelier/brouillons' },
  { label: 'Historique', icon: 'i-lucide-history', to: '/atelier/historique' },
  { label: 'IA & MCP', icon: 'i-lucide-bot', to: '/atelier/ia' },
  { label: 'Sauvegarde', icon: 'i-lucide-database-backup', to: '/atelier/sauvegarde' },
  { label: 'Réglages', icon: 'i-lucide-settings', to: '/atelier/reglages' },
]

export function euros(cents: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

export function dateTimeFr(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Paris' }).format(new Date(iso))
}

export function dateFr(iso: string | null | undefined) {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number) as [number, number, number]
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)))
}
