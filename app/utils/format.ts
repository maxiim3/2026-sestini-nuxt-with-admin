export function internationalPhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  return digits.startsWith('0') ? `+33${digits.slice(1)}` : `+${digits}`
}

export function mapsUrl(place: { lat: number, lng: number }): string {
  return `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`
}

export function directionsUrl(place: { lat: number, lng: number }): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`
}

export function osmEmbedUrl(place: { lat: number, lng: number }, zoom = 0.006): string {
  const bbox = [place.lng - zoom, place.lat - zoom / 1.6, place.lng + zoom, place.lat + zoom / 1.6].join(',')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${place.lat},${place.lng}`
}
