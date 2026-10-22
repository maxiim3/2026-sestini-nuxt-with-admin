import { ALLERGENS, type Allergen, type Locale } from '~~/shared/domain/constants'
import { formatHour } from '~~/shared/domain/dates'
import { translated, type Translations } from '~~/shared/domain/i18n'

/**
 * Textes et formats des documents imprimables. Les pages /print n'utilisent
 * pas @nuxtjs/i18n (langue choisie par paramètre) : les textes sont ici, dans
 * les quatre langues, en reprenant les libellés du site.
 */

/** Libellés repris des fichiers de traduction du site (non importables ici : @nuxtjs/i18n les compile) */
const SITE = {
  fr: {
    brand: {
      tagline: 'La pizza au feu de bois',
    },
    menu: {
      title: 'La carte',
      sections: {
        rouges: 'Les rouges',
        blanches: 'Les blanches',
        speciales: 'Les spéciales',
      },
      sectionsHint: {
        rouges: 'Base sauce tomate',
        blanches: 'Base crème fraîche',
        speciales: 'Bases du moment',
      },
      categories: {
        pizzas: 'Pizzas',
        drinks: 'Boissons',
        desserts: 'Desserts',
        supplements: 'Suppléments',
      },
      afterBaking: 'Après cuisson',
      allergens: 'Allergènes',
      allergensNote: 'La pâte contient du gluten. Signalez toute allergie au moment de la commande.',
      pricesNote: 'Prix TTC. Paiement sur place.',
      featured: 'Pizza du moment',
      vegetarian: 'Végétarien',
    },
    findUs: {
      exception: 'Exceptionnel',
      closed: 'Fermé',
    },
    allergens: {
      'gluten': 'Gluten',
      'crustaces': 'Crustacés',
      'oeufs': 'Œufs',
      'poissons': 'Poissons',
      'arachides': 'Arachides',
      'soja': 'Soja',
      'lait': 'Lait',
      'fruits-a-coque': 'Fruits à coque',
      'celeri': 'Céleri',
      'moutarde': 'Moutarde',
      'sesame': 'Sésame',
      'sulfites': 'Sulfites',
      'lupin': 'Lupin',
      'mollusques': 'Mollusques',
    },
    drinks: {
      soft: 'Softs',
      eau: 'Eaux',
      biere: 'Bières',
      vin: 'Vins',
    },
  },
  en: {
    brand: {
      tagline: 'Wood-fired pizza',
    },
    menu: {
      title: 'Menu',
      sections: {
        rouges: 'The reds',
        blanches: 'The whites',
        speciales: 'The specials',
      },
      sectionsHint: {
        rouges: 'Tomato sauce base',
        blanches: 'Crème fraîche base',
        speciales: 'Seasonal bases',
      },
      categories: {
        pizzas: 'Pizzas',
        drinks: 'Drinks',
        desserts: 'Desserts',
        supplements: 'Extras',
      },
      afterBaking: 'After baking',
      allergens: 'Allergens',
      allergensNote: 'The dough contains gluten. Please mention any allergy when you order.',
      pricesNote: 'Prices include tax. Payment on site.',
      featured: 'Pizza of the moment',
      vegetarian: 'Vegetarian',
    },
    findUs: {
      exception: 'Special date',
      closed: 'Closed',
    },
    allergens: {
      'gluten': 'Gluten',
      'crustaces': 'Crustaceans',
      'oeufs': 'Eggs',
      'poissons': 'Fish',
      'arachides': 'Peanuts',
      'soja': 'Soybeans',
      'lait': 'Milk',
      'fruits-a-coque': 'Tree nuts',
      'celeri': 'Celery',
      'moutarde': 'Mustard',
      'sesame': 'Sesame seeds',
      'sulfites': 'Sulphites',
      'lupin': 'Lupin',
      'mollusques': 'Molluscs',
    },
    drinks: {
      soft: 'Soft drinks',
      eau: 'Water',
      biere: 'Beers',
      vin: 'Wines',
    },
  },
  es: {
    brand: {
      tagline: 'Pizza al horno de leña',
    },
    menu: {
      title: 'La carta',
      sections: {
        rouges: 'Las rojas',
        blanches: 'Las blancas',
        speciales: 'Las especiales',
      },
      sectionsHint: {
        rouges: 'Base de salsa de tomate',
        blanches: 'Base de crème fraîche',
        speciales: 'Bases de temporada',
      },
      categories: {
        pizzas: 'Pizzas',
        drinks: 'Bebidas',
        desserts: 'Postres',
        supplements: 'Extras',
      },
      afterBaking: 'Tras la cocción',
      allergens: 'Alérgenos',
      allergensNote: 'La masa contiene gluten. Indique cualquier alergia al hacer su pedido.',
      pricesNote: 'Precios con impuestos incluidos. Pago en el local.',
      featured: 'Pizza del momento',
      vegetarian: 'Vegetariana',
    },
    findUs: {
      exception: 'Excepcional',
      closed: 'Cerrado',
    },
    allergens: {
      'gluten': 'Gluten',
      'crustaces': 'Crustáceos',
      'oeufs': 'Huevos',
      'poissons': 'Pescado',
      'arachides': 'Cacahuetes',
      'soja': 'Soja',
      'lait': 'Leche',
      'fruits-a-coque': 'Frutos de cáscara',
      'celeri': 'Apio',
      'moutarde': 'Mostaza',
      'sesame': 'Granos de sésamo',
      'sulfites': 'Sulfitos',
      'lupin': 'Altramuces',
      'mollusques': 'Moluscos',
    },
    drinks: {
      soft: 'Refrescos',
      eau: 'Aguas',
      biere: 'Cervezas',
      vin: 'Vinos',
    },
  },
  it: {
    brand: {
      tagline: 'La pizza al forno a legna',
    },
    menu: {
      title: 'Il menù',
      sections: {
        rouges: 'Le rosse',
        blanches: 'Le bianche',
        speciales: 'Le speciali',
      },
      sectionsHint: {
        rouges: 'Base di salsa di pomodoro',
        blanches: 'Base di crème fraîche',
        speciales: 'Basi del momento',
      },
      categories: {
        pizzas: 'Pizze',
        drinks: 'Bevande',
        desserts: 'Dolci',
        supplements: 'Aggiunte',
      },
      afterBaking: 'Dopo la cottura',
      allergens: 'Allergeni',
      allergensNote: 'L\'impasto contiene glutine. Segnalate eventuali allergie al momento dell\'ordine.',
      pricesNote: 'Prezzi IVA inclusa. Pagamento sul posto.',
      featured: 'Pizza del momento',
      vegetarian: 'Vegetariana',
    },
    findUs: {
      exception: 'Eccezionale',
      closed: 'Chiuso',
    },
    allergens: {
      'gluten': 'Glutine',
      'crustaces': 'Crostacei',
      'oeufs': 'Uova',
      'poissons': 'Pesce',
      'arachides': 'Arachidi',
      'soja': 'Soia',
      'lait': 'Latte',
      'fruits-a-coque': 'Frutta a guscio',
      'celeri': 'Sedano',
      'moutarde': 'Senape',
      'sesame': 'Semi di sesamo',
      'sulfites': 'Solfiti',
      'lupin': 'Lupini',
      'mollusques': 'Molluschi',
    },
    drinks: {
      soft: 'Bibite',
      eau: 'Acque',
      biere: 'Birre',
      vin: 'Vini',
    },
  },
} as const

const PRINT = {
  fr: {
    orderByPhone: 'Commande par téléphone ou au camion',
    pickup: 'Retrait au camion · Paiement sur place',
    whereToFind: 'Où nous trouver',
    dayOff: 'Repos',
    from: 'dès',
    until: 'Jusqu\'au {date}',
    vegetarianShort: 'végétarienne',
    closureEyebrow: 'Information',
    closureOne: 'Fermeture exceptionnelle',
    closureMany: 'En congés',
    closedOn: 'Le camion sera fermé',
    range: 'du {from} au {to}',
    reopening: 'On vous retrouve',
    reopeningAt: 'à {place}',
    closureThanks: 'Merci de votre compréhension, à très vite autour du four !',
    eventEyebrow: 'Événement',
    eventTitle: 'Soirée exceptionnelle',
    weekEyebrow: 'Cette semaine',
    weekTitle: 'La tournée',
    weekRange: 'Du {from} au {to}',
    exceptional: 'Exceptionnel',
    empty: 'Rien à imprimer : choisissez un élément dans l\'atelier.',
    allergensKey: 'Allergènes',
    perIngredient: 'Prix par ingrédient',
  },
  en: {
    orderByPhone: 'Order by phone or at the truck',
    pickup: 'Pick up at the truck · Pay on site',
    whereToFind: 'Where to find us',
    dayOff: 'Day off',
    from: 'from',
    until: 'Until {date}',
    vegetarianShort: 'vegetarian',
    closureEyebrow: 'Notice',
    closureOne: 'Exceptionally closed',
    closureMany: 'On holiday',
    closedOn: 'The truck will be closed',
    range: 'from {from} to {to}',
    reopening: 'See you again',
    reopeningAt: 'in {place}',
    closureThanks: 'Thank you for your understanding, see you soon by the oven!',
    eventEyebrow: 'Event',
    eventTitle: 'A special evening',
    weekEyebrow: 'This week',
    weekTitle: 'On tour',
    weekRange: 'From {from} to {to}',
    exceptional: 'Special date',
    empty: 'Nothing to print: pick an item in the workshop.',
    allergensKey: 'Allergens',
    perIngredient: 'Price per ingredient',
  },
  es: {
    orderByPhone: 'Pedidos por teléfono o en el camión',
    pickup: 'Recogida en el camión · Pago en el sitio',
    whereToFind: 'Dónde encontrarnos',
    dayOff: 'Descanso',
    from: 'desde las',
    until: 'Hasta el {date}',
    vegetarianShort: 'vegetariana',
    closureEyebrow: 'Aviso',
    closureOne: 'Cierre excepcional',
    closureMany: 'De vacaciones',
    closedOn: 'El camión estará cerrado',
    range: 'del {from} al {to}',
    reopening: 'Volvemos',
    reopeningAt: 'en {place}',
    closureThanks: 'Gracias por su comprensión, ¡hasta muy pronto junto al horno!',
    eventEyebrow: 'Evento',
    eventTitle: 'Una noche excepcional',
    weekEyebrow: 'Esta semana',
    weekTitle: 'La ruta',
    weekRange: 'Del {from} al {to}',
    exceptional: 'Excepcional',
    empty: 'Nada que imprimir: elija un elemento en el taller.',
    allergensKey: 'Alérgenos',
    perIngredient: 'Precio por ingrediente',
  },
  it: {
    orderByPhone: 'Ordina per telefono o al furgone',
    pickup: 'Ritiro al furgone · Pagamento sul posto',
    whereToFind: 'Dove trovarci',
    dayOff: 'Riposo',
    from: 'dalle',
    until: 'Fino al {date}',
    vegetarianShort: 'vegetariana',
    closureEyebrow: 'Avviso',
    closureOne: 'Chiusura eccezionale',
    closureMany: 'In ferie',
    closedOn: 'Il furgone sarà chiuso',
    range: 'dal {from} al {to}',
    reopening: 'Ci rivediamo',
    reopeningAt: 'a {place}',
    closureThanks: 'Grazie per la comprensione, a presto intorno al forno!',
    eventEyebrow: 'Evento',
    eventTitle: 'Una serata speciale',
    weekEyebrow: 'Questa settimana',
    weekTitle: 'Il giro',
    weekRange: 'Dal {from} al {to}',
    exceptional: 'Eccezionale',
    empty: 'Niente da stampare: scegli un elemento nel laboratorio.',
    allergensKey: 'Allergeni',
    perIngredient: 'Prezzo per ingrediente',
  },
} satisfies Record<Locale, Record<string, string>>

type PrintKey = keyof typeof PRINT.fr

const TAGS: Record<Locale, string> = { fr: 'fr-FR', en: 'en-GB', es: 'es-ES', it: 'it-IT' }

function fill(template: string, vars: Record<string, string> = {}) {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '')
}

function utcDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number]
  return new Date(Date.UTC(y, m - 1, d))
}

/** Numéro réglementaire de l'allergène (ordre de l'annexe II du règlement UE 1169/2011) */
export function allergenNumber(a: Allergen): number {
  return ALLERGENS.indexOf(a) + 1
}

export function printText(lang: Locale) {
  const site = SITE[lang]
  const tag = TAGS[lang]

  return {
    lang,
    site,
    t: (key: PrintKey, vars?: Record<string, string>) => fill(PRINT[lang][key], vars),
    /** Gabarit brut, pour mettre en forme les variables (« du {from} au {to} ») */
    raw: (key: PrintKey) => PRINT[lang][key],
    tr: <T extends Record<string, unknown> & { i18n?: Translations | null }, K extends keyof T & string>(entity: T, field: K): T[K] => translated(entity, field, lang),
    allergen: (a: Allergen) => site.allergens[a] ?? a,
    price: (cents: number) => new Intl.NumberFormat(tag, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    }).format(cents / 100),
    /** Prix sans symbole, pour les colonnes de la carte : « 11,50 » */
    amount: (cents: number) => new Intl.NumberFormat(tag, { minimumFractionDigits: cents % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 }).format(cents / 100),
    hour: (hhmm: string | null | undefined) => {
      if (!hhmm) return ''
      if (lang === 'fr') return formatHour(hhmm)
      const [h, m] = hhmm.split(':').map(Number) as [number, number]
      if (lang === 'en') return new Intl.DateTimeFormat(tag, { hour: 'numeric', minute: m ? '2-digit' : undefined, hour12: true, timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 0, 1, h, m))).replace(' ', '').toLowerCase()
      return m ? `${h}:${String(m).padStart(2, '0')}` : `${h}:00`
    },
    date: (iso: string, options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' }) =>
      new Intl.DateTimeFormat(tag, { ...options, timeZone: 'UTC' }).format(utcDate(iso)),
    weekday: (weekday: number, style: 'long' | 'short' = 'long') =>
      // 2026-01-05 est un lundi
      new Intl.DateTimeFormat(tag, { weekday: style, timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 0, 4 + weekday))),
  }
}

export type PrintText = ReturnType<typeof printText>

/** « La Pizza du Moment — Ricotta & courgette » → « Ricotta & courgette » quand le surtitre le dit déjà */
export function displayPizzaName(name: string, title?: string | null): string {
  const [head, ...rest] = name.split(/\s+[—–-]\s+/)
  if (rest.length && title && head!.trim().toLowerCase() === title.trim().toLowerCase()) return rest.join(' — ')
  return name
}

/** Premier caractère en capitale (les dates Intl sont en minuscules en français) */
export function capitalize(value: string): string {
  return value.charAt(0).toLocaleUpperCase() + value.slice(1)
}

/** Adresse du site imprimée sur les documents */
export const PRINT_SITE_HOST = 'sestini-pizza.fr'
