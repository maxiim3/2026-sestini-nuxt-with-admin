/**
 * Textes propres à la variante « Ce soir », en 4 langues.
 * Les fonctions reçoivent des valeurs déjà formatées (heure, lieu, jour).
 */
export interface CeSoirCopy {
  masthead: string
  hero: {
    kicker: { live: string, later: string, after: string, rest: string, none: string }
    tonight: string
    from: (h: string) => string
    until: (h: string) => string
    seeYou: string
    weekday: (day: string) => string
    at: (city: string) => string
    restLines: [string, string, string]
    lead: {
      live: string
      later: string
      after: (when: string, h: string) => string
      rest: (when: string, h: string) => string
      none: string
    }
    tomorrow: string
    truck: string
    call: string
    itinerary: string
    countdown: string
    countdownDone: string
    liveUntil: (h: string) => string
    facts: [string, string, string, string]
  }
  week: {
    eyebrow: string
    title: string
    titleEm: string
    intro: string
    tonight: string
    closed: string
    exception: string
    hours: (from: string, to: string | null) => string
    seeAll: string
  }
  poster: {
    featured: string
    pick: string
    base: string
    after: string
    order: string
    seeMenu: string
    alsoTitle: string
    count: (n: number) => string
    imageSoon: string
  }
  howto: {
    eyebrow: string
    title: string
    titleEm: string
    steps: [{ title: string, text: string }, { title: string, text: string }, { title: string, text: string }]
    seeMenu: string
  }
  finale: {
    eyebrow: string
    tonight: (city: string) => string
    /** Le composant met la capitale initiale */
    next: (day: string, city: string) => string
    none: string
    number: string
    seeMenu: string
  }
}

export const COPY: Record<'fr' | 'en' | 'es' | 'it', CeSoirCopy> = {
  fr: {
    masthead: 'Pizza au feu de bois',
    hero: {
      kicker: {
        live: 'Le four est allumé',
        later: 'Ce soir, on vous attend',
        after: 'C’est fini pour ce soir',
        rest: 'Ce soir, le four se repose',
        none: 'Le camion fait une pause',
      },
      tonight: 'Ce soir,',
      from: h => `Dès ${h}.`,
      until: h => `Jusqu’à ${h}.`,
      seeYou: 'Rendez-vous',
      weekday: d => `${d},`,
      at: c => `à ${c}.`,
      restLines: ['Le four', 'se repose,', 'à bientôt.'],
      lead: {
        live: 'Les braises sont prêtes. Un coup de fil, on enfourne, et votre pizza vous attend au camion.',
        later: 'Commandez par téléphone, récupérez au camion. La pâte a pris son temps ; les braises aussi.',
        after: (when, h) => `Merci d’être passés. Le feu se rallume ${when}, dès ${h}.`,
        rest: (when, h) => `Le camion reprend la route ${when}, dès ${h}. Gardez le numéro sous la main.`,
        none: 'Les prochaines dates arrivent très vite. Gardez le numéro sous la main.',
      },
      tomorrow: 'demain',
      truck: 'Le camion',
      call: 'Appeler pour commander',
      itinerary: 'Itinéraire',
      countdown: 'Ouverture dans',
      countdownDone: 'Le four est allumé',
      liveUntil: h => `Ouvert jusqu’à ${h}`,
      facts: ['Cuite au feu de bois', 'Pâte maison, reposée plusieurs jours', 'Produits frais, locaux et de saison', 'Commande par téléphone, retrait sur place'],
    },
    week: {
      eyebrow: 'Nous trouver',
      title: 'La semaine',
      titleEm: 'du camion',
      intro: 'Un camion, trois villages. Voici où le four s’allume ces sept prochains soirs.',
      tonight: 'Ce soir',
      closed: 'Relâche',
      exception: 'Exceptionnel',
      hours: (a, b) => (b ? `${a} – ${b}` : `Dès ${a}`),
      seeAll: 'Lieux et horaires',
    },
    poster: {
      featured: 'Pizza du moment',
      pick: 'Ce soir, pourquoi pas…',
      base: 'Base',
      after: 'Après cuisson',
      order: 'La commander',
      seeMenu: 'Voir toute la carte',
      alsoTitle: 'Aussi à la carte',
      count: n => `${n} pizzas à la carte`,
      imageSoon: 'Sortie du four',
    },
    howto: {
      eyebrow: 'Mode d’emploi',
      title: 'Commander,',
      titleEm: 'en trois temps',
      steps: [
        { title: 'Appeler', text: 'Un coup de fil et c’est parti : la commande se fait uniquement par téléphone.' },
        { title: 'Choisir', text: 'Rouges, blanches ou spéciales, prenez le temps de lire la carte. Signalez toute allergie en commandant.' },
        { title: 'Récupérer', text: 'Passez au camion : votre pizza sort du feu de bois, bien chaude. Paiement sur place.' },
      ],
      seeMenu: 'Lire la carte',
    },
    finale: {
      eyebrow: 'Il ne reste qu’à appeler',
      tonight: c => `Ce soir, à ${c}.`,
      next: (d, c) => `${d}, à ${c}.`,
      none: 'À très bientôt.',
      number: 'Le numéro',
      seeMenu: 'Voir la carte',
    },
  },
  en: {
    masthead: 'Wood-fired pizza',
    hero: {
      kicker: {
        live: 'The oven is lit',
        later: 'Tonight, we’re expecting you',
        after: 'That’s it for tonight',
        rest: 'Tonight, the oven rests',
        none: 'The truck is taking a break',
      },
      tonight: 'Tonight,',
      from: h => `From ${h}.`,
      until: h => `Until ${h}.`,
      seeYou: 'See you',
      weekday: d => `${d},`,
      at: c => `in ${c}.`,
      restLines: ['The oven', 'is resting,', 'see you soon.'],
      lead: {
        live: 'The embers are ready. One call, into the oven it goes, and your pizza is waiting at the truck.',
        later: 'Order by phone, pick up at the truck. The dough took its time; so did the embers.',
        after: (when, h) => `Thanks for stopping by. The fire is lit again ${when}, from ${h}.`,
        rest: (when, h) => `The truck is back on the road ${when}, from ${h}. Keep the number handy.`,
        none: 'New dates are coming very soon. Keep the number handy.',
      },
      tomorrow: 'tomorrow',
      truck: 'The truck',
      call: 'Call to order',
      itinerary: 'Directions',
      countdown: 'Opening in',
      countdownDone: 'The oven is lit',
      liveUntil: h => `Open until ${h}`,
      facts: ['Baked in a wood-fired oven', 'House dough, rested for days', 'Fresh, local, seasonal produce', 'Order by phone, pick up on site'],
    },
    week: {
      eyebrow: 'Find us',
      title: 'The truck’s',
      titleEm: 'week',
      intro: 'One truck, three villages. Here is where the oven lights up over the next seven evenings.',
      tonight: 'Tonight',
      closed: 'Day off',
      exception: 'Special',
      hours: (a, b) => (b ? `${a} – ${b}` : `From ${a}`),
      seeAll: 'Places & hours',
    },
    poster: {
      featured: 'Pizza of the moment',
      pick: 'Tonight, why not…',
      base: 'Base',
      after: 'After baking',
      order: 'Order it',
      seeMenu: 'See the full menu',
      alsoTitle: 'Also on the menu',
      count: n => `${n} pizzas on the menu`,
      imageSoon: 'Fresh from the oven',
    },
    howto: {
      eyebrow: 'How it works',
      title: 'Ordering,',
      titleEm: 'in three steps',
      steps: [
        { title: 'Call', text: 'One phone call and you’re set: orders are taken by phone only.' },
        { title: 'Choose', text: 'Reds, whites or specials, take your time with the menu. Let us know about any allergy when ordering.' },
        { title: 'Collect', text: 'Come to the truck: your pizza leaves the wood fire piping hot. Pay on site.' },
      ],
      seeMenu: 'Read the menu',
    },
    finale: {
      eyebrow: 'All that’s left is to call',
      tonight: c => `Tonight, in ${c}.`,
      next: (d, c) => `${d}, in ${c}.`,
      none: 'See you very soon.',
      number: 'The number',
      seeMenu: 'See the menu',
    },
  },
  es: {
    masthead: 'Pizza al horno de leña',
    hero: {
      kicker: {
        live: 'El horno está encendido',
        later: 'Esta noche te esperamos',
        after: 'Por hoy hemos terminado',
        rest: 'Esta noche, el horno descansa',
        none: 'El camión hace una pausa',
      },
      tonight: 'Esta noche,',
      from: h => `Desde las ${h}.`,
      until: h => `Hasta las ${h}.`,
      seeYou: 'Nos vemos',
      weekday: d => `el ${d},`,
      at: c => `en ${c}.`,
      restLines: ['El horno', 'descansa,', 'hasta pronto.'],
      lead: {
        live: 'Las brasas están listas. Una llamada, al horno, y tu pizza te espera en el camión.',
        later: 'Pide por teléfono y recógela en el camión. La masa se tomó su tiempo; las brasas también.',
        after: (when, h) => `Gracias por venir. El fuego vuelve a encenderse ${when}, desde las ${h}.`,
        rest: (when, h) => `El camión vuelve a la carretera ${when}, desde las ${h}. Ten el número a mano.`,
        none: 'Muy pronto, nuevas fechas. Ten el número a mano.',
      },
      tomorrow: 'mañana',
      truck: 'El camión',
      call: 'Llamar para pedir',
      itinerary: 'Cómo llegar',
      countdown: 'Abrimos en',
      countdownDone: 'El horno está encendido',
      liveUntil: h => `Abierto hasta las ${h}`,
      facts: ['Cocida al horno de leña', 'Masa casera, reposada varios días', 'Productos frescos, locales y de temporada', 'Pedido por teléfono, recogida en el camión'],
    },
    week: {
      eyebrow: 'Dónde estamos',
      title: 'La semana',
      titleEm: 'del camión',
      intro: 'Un camión, tres pueblos. Aquí se enciende el horno en las próximas siete noches.',
      tonight: 'Esta noche',
      closed: 'Descanso',
      exception: 'Excepcional',
      hours: (a, b) => (b ? `${a} – ${b}` : `Desde las ${a}`),
      seeAll: 'Lugares y horarios',
    },
    poster: {
      featured: 'Pizza del momento',
      pick: 'Esta noche, ¿por qué no…',
      base: 'Base',
      after: 'Tras la cocción',
      order: 'Pedirla',
      seeMenu: 'Ver toda la carta',
      alsoTitle: 'También en la carta',
      count: n => `${n} pizzas en la carta`,
      imageSoon: 'Recién salida del horno',
    },
    howto: {
      eyebrow: 'Cómo funciona',
      title: 'Pedir,',
      titleEm: 'en tres tiempos',
      steps: [
        { title: 'Llamar', text: 'Una llamada y listo: los pedidos se hacen solo por teléfono.' },
        { title: 'Elegir', text: 'Rojas, blancas o especiales, tómate tu tiempo con la carta. Avísanos de cualquier alergia al pedir.' },
        { title: 'Recoger', text: 'Pasa por el camión: tu pizza sale del horno de leña bien caliente. Pago en el lugar.' },
      ],
      seeMenu: 'Leer la carta',
    },
    finale: {
      eyebrow: 'Solo queda llamar',
      tonight: c => `Esta noche, en ${c}.`,
      next: (d, c) => `el ${d}, en ${c}.`,
      none: 'Hasta muy pronto.',
      number: 'El número',
      seeMenu: 'Ver la carta',
    },
  },
  it: {
    masthead: 'Pizza cotta a legna',
    hero: {
      kicker: {
        live: 'Il forno è acceso',
        later: 'Stasera vi aspettiamo',
        after: 'Per stasera abbiamo finito',
        rest: 'Stasera il forno riposa',
        none: 'Il furgone si prende una pausa',
      },
      tonight: 'Stasera,',
      from: h => `Dalle ${h}.`,
      until: h => `Fino alle ${h}.`,
      seeYou: 'Ci vediamo',
      weekday: d => `${d},`,
      at: c => `a ${c}.`,
      restLines: ['Il forno', 'riposa,', 'a presto.'],
      lead: {
        live: 'Le braci sono pronte. Una telefonata, si inforna, e la vostra pizza vi aspetta al furgone.',
        later: 'Ordinate al telefono, ritirate al furgone. L’impasto si è preso il suo tempo; le braci anche.',
        after: (when, h) => `Grazie della visita. Il fuoco si riaccende ${when}, dalle ${h}.`,
        rest: (when, h) => `Il furgone riparte ${when}, dalle ${h}. Tenete il numero a portata di mano.`,
        none: 'Le prossime date arrivano presto. Tenete il numero a portata di mano.',
      },
      tomorrow: 'domani',
      truck: 'Il furgone',
      call: 'Chiama per ordinare',
      itinerary: 'Indicazioni',
      countdown: 'Apertura tra',
      countdownDone: 'Il forno è acceso',
      liveUntil: h => `Aperto fino alle ${h}`,
      facts: ['Cotta nel forno a legna', 'Impasto della casa, riposato per giorni', 'Prodotti freschi, locali e di stagione', 'Ordine al telefono, ritiro sul posto'],
    },
    week: {
      eyebrow: 'Dove siamo',
      title: 'La settimana',
      titleEm: 'del furgone',
      intro: 'Un furgone, tre paesi. Ecco dove si accende il forno nelle prossime sette sere.',
      tonight: 'Stasera',
      closed: 'Riposo',
      exception: 'Eccezionale',
      hours: (a, b) => (b ? `${a} – ${b}` : `Dalle ${a}`),
      seeAll: 'Luoghi e orari',
    },
    poster: {
      featured: 'Pizza del momento',
      pick: 'Stasera, perché non…',
      base: 'Base',
      after: 'Dopo la cottura',
      order: 'Ordinarla',
      seeMenu: 'Vedi tutto il menu',
      alsoTitle: 'Anche nel menu',
      count: n => `${n} pizze nel menu`,
      imageSoon: 'Appena sfornata',
    },
    howto: {
      eyebrow: 'Come funziona',
      title: 'Ordinare,',
      titleEm: 'in tre tempi',
      steps: [
        { title: 'Chiamare', text: 'Una telefonata e ci siamo: gli ordini si fanno solo al telefono.' },
        { title: 'Scegliere', text: 'Rosse, bianche o speciali, prendetevi il tempo di leggere il menu. Segnalate eventuali allergie all’ordine.' },
        { title: 'Ritirare', text: 'Passate al furgone: la pizza esce dal forno a legna bella calda. Pagamento sul posto.' },
      ],
      seeMenu: 'Leggere il menu',
    },
    finale: {
      eyebrow: 'Non resta che chiamare',
      tonight: c => `Stasera, a ${c}.`,
      next: (d, c) => `${d}, a ${c}.`,
      none: 'A prestissimo.',
      number: 'Il numero',
      seeMenu: 'Vedi il menu',
    },
  },
}
