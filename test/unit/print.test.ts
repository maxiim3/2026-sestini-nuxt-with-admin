import { describe, expect, it } from 'vitest'
import { modelParams, pageSize, parsePrintOptions, printPath } from '../../shared/domain/print'

describe('atelier d’impression', () => {
  it('applique les valeurs par défaut du modèle', () => {
    expect(parsePrintOptions('pizza-du-moment', {})).toEqual({ format: 'A5', orientation: 'portrait', theme: 'clair', lang: 'fr' })
    expect(parsePrintOptions('carte', { format: 'a3', theme: 'sombre', lang: 'it', orientation: 'landscape' }))
      .toEqual({ format: 'A3', orientation: 'landscape', theme: 'sombre', lang: 'it' })
  })

  it('ignore les valeurs inconnues', () => {
    expect(parsePrintOptions('carte', { format: 'A0', theme: 'rose', lang: 'de' })).toMatchObject({ format: 'A4', theme: 'clair', lang: 'fr' })
  })

  it('inverse les dimensions en paysage', () => {
    expect(pageSize('A4', 'landscape')).toEqual({ width: 297, height: 210 })
  })

  it('construit le chemin sans paramètres vides et ne garde que ceux du modèle', () => {
    expect(printPath('fermeture', { format: 'A4', from: '2026-11-02', to: '', title: undefined })).toBe('/print/fermeture?format=A4&from=2026-11-02')
    expect(modelParams('semaine', { from: '2026-10-21', exception: 'x', format: 'A3' })).toEqual({ from: '2026-10-21' })
  })
})
