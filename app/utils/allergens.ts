import { ALLERGEN_LABELS, type Allergen } from '~~/shared/domain/constants'

/** Libellé français d'un allergène (atelier) */
export function allergenLabel(code: Allergen): string {
  return ALLERGEN_LABELS[code]
}
