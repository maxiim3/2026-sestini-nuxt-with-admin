/** Textes propres à la landing « La Tournée », en quatre langues */

interface Copy {
  eyebrow: string
  titleA: string
  /** {n} = nombre de villages, écrit en toutes lettres */
  titleB: string
  numbers: Record<number, string>
  lead: string
  tonightAt: string
  tonightOpenNow: string
  tonightRest: string
  tonightOver: string
  nextAt: string
  noDate: string
  until: string
  scroll: string
  week: string
  day: string
  restTitle: string
  restText: string
  restNext: string
  exception: Record<'closed' | 'relocated' | 'hours' | 'extra', string>
  villages: Record<string, string>
  sea: string
  mapLabel: string
  scale: string
  menuEyebrow: string
  menuTitle: string
  menuLead: string
  menuAll: string
  seasonal: string
  finaleEyebrow: string
  finaleEyebrowNext: string
  finaleRest: string
  legend: string
  everyWeek: string
  callLead: string
  goTo: string
}

export const COPY: Record<'fr' | 'en' | 'es' | 'it', Copy> = {
  fr: {
    eyebrow: 'La tournée de la semaine',
    titleA: 'Un four à\u00A0bois,',
    titleB: '{n} villages.',
    numbers: { 1: 'un', 2: 'deux', 3: 'trois', 4: 'quatre', 5: 'cinq', 6: 'six' },
    lead: 'Chaque soir, le camion Sestini allume son four dans un village autour de Montpellier. Vous appelez, on enfourne, vous passez la chercher.',
    tonightAt: 'Ce soir, on est à {city}',
    tonightOpenNow: 'En ce moment, on est à {city}',
    tonightRest: 'Ce soir, le four se repose.',
    tonightOver: 'C’est fini pour ce soir.',
    nextAt: '{day}, on est à {city}',
    noDate: 'Les prochaines dates arrivent très vite.',
    until: 'jusqu’à {time}',
    scroll: 'Suivez la tournée',
    week: 'La semaine',
    day: 'Étape {n} sur {total}',
    restTitle: 'Le four se repose',
    restText: 'Jour de relâche. La pâte, elle, continue de reposer.',
    restNext: 'Prochain arrêt : {day}, à {city}.',
    exception: {
      closed: 'Fermeture exceptionnelle',
      relocated: 'Lieu exceptionnel',
      hours: 'Horaires exceptionnels',
      extra: 'Soirée en plus',
    },
    villages: {
      'pignan': 'Village de garrigue à l’ouest de Montpellier, entre oliviers et vignes. On se gare devant la coopérative oléicole.',
      'vic-la-gardiole': 'Blotti entre le massif de la Gardiole et l’étang de Vic, à deux pas des plages des Aresquiers.',
      'villeneuve-les-maguelone': 'Entre Montpellier et la mer, aux portes des étangs et de la cathédrale de Maguelone.',
    },
    sea: 'Mer Méditerranée',
    mapLabel: 'Carte de la tournée autour de Montpellier : {places}.',
    scale: '2 km',
    menuEyebrow: 'Au four cette semaine',
    menuTitle: 'La carte du moment',
    menuLead: '{n} pizzas, une pâte maison reposée plusieurs jours, des produits frais et de saison, cuites au feu de bois devant vous.',
    menuAll: 'Voir toute la carte',
    seasonal: 'Spéciale du moment',
    finaleEyebrow: 'Trouvez-nous ce soir',
    finaleEyebrowNext: 'Prochain arrêt',
    finaleRest: 'Ce soir, le four se repose. On vous attend ici :',
    legend: 'Les étapes de la tournée',
    everyWeek: 'Cette semaine',
    callLead: 'Commandez par téléphone, on vous donne l’heure de retrait.',
    goTo: 'Aller à {day}',
  },
  en: {
    eyebrow: 'This week’s round',
    titleA: 'One wood-fired oven,',
    titleB: '{n} villages.',
    numbers: { 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six' },
    lead: 'Every evening, the Sestini truck lights its oven in a village around Montpellier. You call, we bake, you pick it up.',
    tonightAt: 'Tonight, we’re in {city}',
    tonightOpenNow: 'Right now, we’re in {city}',
    tonightRest: 'Tonight, the oven is resting.',
    tonightOver: 'That’s it for tonight.',
    nextAt: '{day}, we’re in {city}',
    noDate: 'New dates are coming very soon.',
    until: 'until {time}',
    scroll: 'Follow the round',
    week: 'The week',
    day: 'Stop {n} of {total}',
    restTitle: 'The oven is resting',
    restText: 'Day off. The dough, meanwhile, keeps resting.',
    restNext: 'Next stop: {day}, in {city}.',
    exception: {
      closed: 'Exceptionally closed',
      relocated: 'Special location',
      hours: 'Special hours',
      extra: 'Extra evening',
    },
    villages: {
      'pignan': 'A garrigue village west of Montpellier, among olive groves and vineyards. We park in front of the olive cooperative.',
      'vic-la-gardiole': 'Tucked between the Gardiole hills and the Étang de Vic lagoon, a stone’s throw from Les Aresquiers beaches.',
      'villeneuve-les-maguelone': 'Between Montpellier and the sea, at the edge of the lagoons and Maguelone Cathedral.',
    },
    sea: 'Mediterranean Sea',
    mapLabel: 'Map of the round around Montpellier: {places}.',
    scale: '2 km',
    menuEyebrow: 'In the oven this week',
    menuTitle: 'The menu right now',
    menuLead: '{n} pizzas, house dough rested for several days, fresh seasonal produce, baked over wood fire right in front of you.',
    menuAll: 'See the full menu',
    seasonal: 'Seasonal special',
    finaleEyebrow: 'Find us tonight',
    finaleEyebrowNext: 'Next stop',
    finaleRest: 'Tonight, the oven is resting. Here’s where we’ll be:',
    legend: 'Stops on the round',
    everyWeek: 'This week',
    callLead: 'Order by phone and we’ll give you a pick-up time.',
    goTo: 'Go to {day}',
  },
  es: {
    eyebrow: 'La ruta de la semana',
    titleA: 'Un horno de\u00A0leña,',
    titleB: '{n} pueblos.',
    numbers: { 1: 'un', 2: 'dos', 3: 'tres', 4: 'cuatro', 5: 'cinco', 6: 'seis' },
    lead: 'Cada tarde, el camión Sestini enciende su horno en un pueblo cerca de Montpellier. Usted llama, nosotros horneamos, usted pasa a recogerla.',
    tonightAt: 'Esta noche estamos en {city}',
    tonightOpenNow: 'Ahora mismo estamos en {city}',
    tonightRest: 'Esta noche, el horno descansa.',
    tonightOver: 'Por esta noche, hemos terminado.',
    nextAt: '{day}, estamos en {city}',
    noDate: 'Las próximas fechas llegan muy pronto.',
    until: 'hasta las {time}',
    scroll: 'Siga la ruta',
    week: 'La semana',
    day: 'Parada {n} de {total}',
    restTitle: 'El horno descansa',
    restText: 'Día de descanso. La masa, mientras tanto, sigue reposando.',
    restNext: 'Próxima parada: {day}, en {city}.',
    exception: {
      closed: 'Cierre excepcional',
      relocated: 'Lugar excepcional',
      hours: 'Horario excepcional',
      extra: 'Noche extra',
    },
    villages: {
      'pignan': 'Pueblo de garriga al oeste de Montpellier, entre olivos y viñedos. Aparcamos frente a la cooperativa oleícola.',
      'vic-la-gardiole': 'Entre el macizo de la Gardiole y el estanque de Vic, a un paso de las playas de Les Aresquiers.',
      'villeneuve-les-maguelone': 'Entre Montpellier y el mar, a las puertas de los estanques y de la catedral de Maguelone.',
    },
    sea: 'Mar Mediterráneo',
    mapLabel: 'Mapa de la ruta alrededor de Montpellier: {places}.',
    scale: '2 km',
    menuEyebrow: 'En el horno esta semana',
    menuTitle: 'La carta del momento',
    menuLead: '{n} pizzas, masa casera reposada varios días, productos frescos y de temporada, horneadas a la leña delante de usted.',
    menuAll: 'Ver toda la carta',
    seasonal: 'Especial del momento',
    finaleEyebrow: 'Encuéntrenos esta noche',
    finaleEyebrowNext: 'Próxima parada',
    finaleRest: 'Esta noche, el horno descansa. Le esperamos aquí:',
    legend: 'Las paradas de la ruta',
    everyWeek: 'Esta semana',
    callLead: 'Pida por teléfono y le diremos a qué hora recogerla.',
    goTo: 'Ir a {day}',
  },
  it: {
    eyebrow: 'Il giro della settimana',
    titleA: 'Un forno a\u00A0legna,',
    titleB: '{n} paesi.',
    numbers: { 1: 'un', 2: 'due', 3: 'tre', 4: 'quattro', 5: 'cinque', 6: 'sei' },
    lead: 'Ogni sera il camion Sestini accende il forno in un paese intorno a Montpellier. Voi chiamate, noi inforniamo, voi passate a ritirarla.',
    tonightAt: 'Stasera siamo a {city}',
    tonightOpenNow: 'In questo momento siamo a {city}',
    tonightRest: 'Stasera il forno riposa.',
    tonightOver: 'Per stasera abbiamo finito.',
    nextAt: '{day} siamo a {city}',
    noDate: 'Le prossime date arrivano prestissimo.',
    until: 'fino alle {time}',
    scroll: 'Seguite il giro',
    week: 'La settimana',
    day: 'Tappa {n} di {total}',
    restTitle: 'Il forno riposa',
    restText: 'Giorno di riposo. L’impasto, intanto, continua a riposare.',
    restNext: 'Prossima tappa: {day}, a {city}.',
    exception: {
      closed: 'Chiusura straordinaria',
      relocated: 'Luogo straordinario',
      hours: 'Orari straordinari',
      extra: 'Serata in più',
    },
    villages: {
      'pignan': 'Paese di gariga a ovest di Montpellier, tra ulivi e vigne. Parcheggiamo davanti alla cooperativa olearia.',
      'vic-la-gardiole': 'Raccolto tra il massiccio della Gardiole e lo stagno di Vic, a due passi dalle spiagge delle Aresquiers.',
      'villeneuve-les-maguelone': 'Tra Montpellier e il mare, alle porte degli stagni e della cattedrale di Maguelone.',
    },
    sea: 'Mar Mediterraneo',
    mapLabel: 'Mappa del giro intorno a Montpellier: {places}.',
    scale: '2 km',
    menuEyebrow: 'Nel forno questa settimana',
    menuTitle: 'Il menù del momento',
    menuLead: '{n} pizze, impasto della casa lasciato riposare per diversi giorni, prodotti freschi e di stagione, cotte a legna davanti a voi.',
    menuAll: 'Vedi tutto il menù',
    seasonal: 'Speciale del momento',
    finaleEyebrow: 'Trovateci stasera',
    finaleEyebrowNext: 'Prossima tappa',
    finaleRest: 'Stasera il forno riposa. Vi aspettiamo qui:',
    legend: 'Le tappe del giro',
    everyWeek: 'Questa settimana',
    callLead: 'Ordinate per telefono, vi diciamo l’orario di ritiro.',
    goTo: 'Vai a {day}',
  },
}

/** Remplace les {clés} d'un gabarit */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? ''))
}

export function useTourCopy() {
  const { locale } = useI18n()
  return computed(() => COPY[locale.value as keyof typeof COPY] ?? COPY.fr)
}

/** Première lettre en capitale (« demain » → « Demain ») */
export function capitalize(s: string): string {
  return s ? s.charAt(0).toLocaleUpperCase() + s.slice(1) : s
}

/** Clé stable d'une ville (« Villeneuve-lès-Maguelone » → « villeneuve-les-maguelone ») */
export function cityKey(city: string): string {
  return city.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/** Heure lisible : « 18 h » en français, « 18:00 » plutôt qu'un « 18 » nu ailleurs */
export function useHour() {
  const { hour } = useLocalized()
  return (hhmm: string | null | undefined) => {
    const out = hour(hhmm)
    return /^\d+$/.test(out) ? `${out}:00` : out
  }
}
