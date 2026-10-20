import type { ExceptionKind, Weekday } from '~~/shared/domain/constants'

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  1: 'Lundi',
  2: 'Mardi',
  3: 'Mercredi',
  4: 'Jeudi',
  5: 'Vendredi',
  6: 'Samedi',
  7: 'Dimanche',
}

export const EXCEPTION_LABELS: Record<ExceptionKind, { label: string, description: string, icon: string, color: 'error' | 'info' | 'warning' | 'success' }> = {
  closed: { label: 'Fermeture', description: 'Congés, vacances, jour de repos : le camion ne sort pas.', icon: 'i-lucide-door-closed', color: 'error' },
  relocated: { label: 'Autre lieu', description: 'Le camion s\'installe ailleurs (événement, marché…).', icon: 'i-lucide-map-pin', color: 'info' },
  hours: { label: 'Horaires spéciaux', description: 'Un jour d\'ouverture habituel, mais à d\'autres heures.', icon: 'i-lucide-clock', color: 'warning' },
  extra: { label: 'Ouverture exceptionnelle', description: 'Le camion ouvre un jour où il est normalement fermé.', icon: 'i-lucide-sparkles', color: 'success' },
}
