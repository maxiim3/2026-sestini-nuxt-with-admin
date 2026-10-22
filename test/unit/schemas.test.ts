import { describe, expect, it } from 'vitest'
import { imageUrl } from '../../shared/schemas'

describe('adresse d’image', () => {
  it('accepte une adresse complète ou un chemin du site', () => {
    for (const v of ['https://abc.public.blob.vercel-storage.com/medias/a.jpg', 'http://localhost:3000/x.png', '/images/provisoire/la-margherita.jpg', '/media/a1b2-pizza.jpg']) {
      expect(imageUrl.safeParse(v).success, v).toBe(true)
    }
  })

  it('refuse le reste', () => {
    for (const v of ['', 'images/a.jpg', '//evil.example/a.jpg', 'javascript:alert(1)', '/images/a b.jpg']) {
      expect(imageUrl.safeParse(v).success, v).toBe(false)
    }
  })
})
