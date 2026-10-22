# Cahier des charges — Sestini Pizza 2026 (Nuxt + admin pilotable par IA)

> Version 1.0 — 20 octobre 2026
> Porteur : Maxime (maxiim3@proton.me) — second utilisateur prévu : Jérémy
> Remplace : `maxiim3/sestini-pizza-2023-nextjs-tailwind-vercel` (Next.js 15)

---

## 1. Contexte

Sestini Pizza est un camion pizza au feu de bois qui tourne autour de Montpellier
(Pignan, Vic-la-Gardiole, Villeneuve-lès-Maguelone). Commande **par téléphone ou
directement au camion**, retrait et paiement sur place, **ni commande ni paiement en ligne**.

### 1.1 Comment le site est mis à jour aujourd'hui

Toutes les données vivent dans le code (`lib/pizzas.tsx`, `lib/pizzaDuMoment.tsx`,
`lib/boissons.tsx`, `lib/supplements.tsx`, `lib/emplacements.ts`) et chaque
changement passe par une PR rédigée par un agent IA.

Le **code mort est volontaire** : anciennes cartes, anciennes pizzas du moment,
anciens messages de modale restent commentés pour que l'agent s'en inspire. C'est
un historique et une bibliothèque de modèles, mais tenus à la main, fragiles, et
qui alourdissent le code.

La modale d'accueil est un **aiguillage manuel** (commenter `DisplayMenu`,
décommenter `ClosureMessage`…), avec un début de programmation par date
(`TEMPORARY_MESSAGE_DATE`). Les horaires suivent un schéma figé « un jour = un
lieu », réécrit à chaque saison, vacances ou événement.

### 1.2 Ce que la refonte change

| Avant (code) | Après (données) |
|---|---|
| Code commenté pour garder l'historique | Statut `actif / archivé` + **historique des versions restaurables** |
| Modale aiguillée à la main | **Messages programmés** (début, fin, priorité, langue) choisis automatiquement |
| Horaires réécrits chaque saison | **Planning en couches** : saisons → semaine type → exceptions |
| Carte = fichier TS | **Cartes saisonnières** (objets) duplicables, activables à une date |
| PR à chaque modification | **Admin + MCP** : l'IA modifie les données, avec brouillon ou publication directe |

## 2. Objectifs

1. Porter le site sur **Nuxt 4** (dernière stable : 4.6.x) sans perte de SEO.
2. Une **administration simple** dont **tout est pilotable par IA** (serveur MCP + skill).
3. **Un accueil** centré sur la pizza, au design « Crema & Nero » (voir § 4).
4. Une **PWA** complète et professionnelle.
5. Un **atelier d'impression** : flyers, menus, annonces en PDF A4/A3.
6. Un site **multilingue** : FR (défaut), EN, ES, IT.
7. Un projet **propre** : commits conventionnels, branches, versions semver, releases.

## 3. Périmètre fonctionnel

### 3.1 Site public

| Page | Route FR | Contenu |
|---|---|---|
| Accueil | `/` | Photo et semaine, pizza du moment, mosaïque de la carte, commander, avis Google |
| La carte | `/la-carte` | Catégories (pizzas, boissons ; desserts désactivables), filtres (base tomate / crème / sans base, viande, poisson, végétarien), suppléments, allergènes |
| Nous trouver | `/nous-trouver` | Semaine type, lieu par jour, carte, exceptions à venir |
| Mentions légales | `/mentions-legales` | Obligatoire |
| Pages print publiques | `/print/...` | Rendu imprimable des documents (non indexé) |

- Les URLs historiques `/la-carte` et `/nous-trouver` sont **conservées** (SEO).
- Les autres langues sont préfixées : `/en/menu`, `/es/carta`, `/it/menu`, etc.
- **Bandeau de message** : affiche le message programmé actif le plus prioritaire
  (carte de saison, pizza du moment, fermeture, vacances, événement exceptionnel).
  Fermeture mémorisée par message (on ne la remontre pas pour le même message).
- **Appel** : barre d'appel fixe sur mobile, `tel:` partout. Événements PostHog
  `call_clicked`, `menu_viewed`, etc. (on garde la nomenclature actuelle).

### 3.2 Domaine métier (ce que l'admin et l'IA gèrent)

- **Infos générales** : téléphone, e-mail, réseaux, textes de présentation.
- **Lieux** : nom du lieu-dit, adresse, ville, CP, coordonnées GPS.
- **Saisons / plannings** : ex. « Hors saison » (mer → dim) et « Été » (7j/7),
  avec dates de validité. Chaque planning = 7 lignes (jour → lieu, ouverture,
  fermeture optionnelle). **Public : on n'affiche que « dès 18h »** (règle actuelle).
- **Exceptions** : fermeture (un jour ou une période : vacances), changement de
  lieu ponctuel (ex. 26/09 au centre culturel), horaires spéciaux.
- **Résolution** : `ce soir = exception du jour ?? planning de la saison active`.
  Fonction pure, testée, utilisée partout (site, JSON-LD, MCP, PDF).
- **Ingrédients** : nom (traduit), type (fromage, viande, poisson, légume,
  sauce, autre), allergènes (14 allergènes réglementaires UE), origine optionnelle.
- **Bases** : tomate, crème, spéciale (crème de potimarron, ricotta…), sans base.
- **Pizzas** : nom, base, ingrédients avant cuisson, ingrédients après cuisson,
  prix, photo, tags dérivés (végétarienne, viande, poisson), allergènes dérivés
  des ingrédients (+ surcharge manuelle).
- **Cartes (menus)** : « Automne-Hiver 2026 », etc. Une carte regroupe des
  pizzas ordonnées par catégorie. Une seule carte active ; on peut en préparer
  une et programmer sa date d'activation. Dupliquer une carte = point de départ
  de la suivante.
- **Pizza du moment** : une ou plusieurs pizzas mises en avant, avec dates,
  visibles sur l'accueil, la carte et/ou le bandeau (choix par case à cocher).
- **Suppléments** : groupes de prix (0,50 €, 1 €…) avec leurs ingrédients.
- **Boissons** : nom, contenance, prix, catégorie, actif.
- **Desserts** : modèle prêt mais catégorie **désactivée** pour l'instant.
- **Messages du bandeau** : type, titre, texte riche, image, CTA, début, fin,
  priorité, traductions.
- **Avis Google** : **mockés** pour l'instant (adaptateur), branchement Places API plus tard.
- **Réglages** : coordonnées (dont la société), accroche, modules visibles.

### 3.3 Historique, brouillons, archivage

- Chaque écriture crée une **révision** (snapshot JSON avant/après, auteur
  humain ou jeton IA, date, message). On peut **restaurer** n'importe quelle révision.
- Un élément n'est jamais supprimé par défaut : il est **archivé** (remplace le
  code mort). L'IA peut lister les archives et s'en servir comme modèle
  (« reprends la PDM d'automne dernier »).
- Les écritures peuvent passer par un **brouillon** (changeset) : l'IA propose,
  un humain valide dans l'admin (aperçu avant/après), ou l'IA publie directement
  si le jeton y est autorisé (`publish` bypass), comme demandé.

### 3.4 Administration

- **URL cachée** (`/atelier`, non liée, `noindex`, exclue du sitemap). La
  sécurité ne repose **pas** sur l'URL : tout est protégé par session.
- **Connexion par lien magique** envoyé par e-mail (Resend), valable 15 min,
  usage unique, limité en fréquence. **Liste blanche** en base :
  `maxiim3@proton.me` (Jérémy ajouté plus tard). En développement, le lien est
  affiché dans la console (pas d'envoi).
- Écrans : Tableau de bord (ce soir, brouillons en attente, stats 7 jours),
  Carte & pizzas, Ingrédients, Boissons & suppléments, Lieux & horaires,
  Messages, Atelier d'impression, Historique, Jetons IA, Réglages.
- Interface : Nuxt UI, simple, mobile-friendly (mise à jour depuis le téléphone).

### 3.5 Pilotage par IA (MCP)

- **Serveur MCP intégré** au site (`/mcp`, Streamable HTTP, `@nuxtjs/mcp-toolkit`).
- **Authentification** : jetons personnels créés dans l'admin par un utilisateur
  autorisé (stockés hachés, révocables, date d'expiration, portée
  `read` / `write` / `publish`). Seuls les utilisateurs de l'admin peuvent en créer.
- **Outils** (lecture) : `get_tonight`, `get_schedule`, `list_menus`, `get_menu`,
  `list_pizzas`, `list_ingredients`, `list_messages`, `list_archives`,
  `get_history`, `get_analytics_summary` (PostHog), `preview_url`.
- **Outils** (écriture → brouillon ou publication) : `upsert_pizza`,
  `set_pizza_du_moment`, `upsert_ingredient`, `upsert_drink`, `set_supplements`,
  `create_menu_from`, `activate_menu`, `add_exception` (fermeture, vacances,
  lieu ponctuel), `set_season_schedule`, `schedule_modal_message`,
  `translate_content`, `archive`, `restore_revision`, `generate_print` (PDF).
- **Changesets** : `propose_changes` → `list_drafts` → `publish_draft` / `discard_draft`.
- **Journal** : chaque appel MCP est journalisé (jeton, outil, paramètres, résultat).
- **Skill Claude Code** dans le dépôt (`.claude/skills/sestini-admin`) : comment
  se connecter au MCP, recettes courantes (nouvelle saison, vacances, PDM, flyer).
- **API REST** sous-jacente (`/api/admin/*`) = même logique métier, partagée
  par l'admin, le MCP et les tests.

### 3.6 Atelier d'impression (PDF)

- Modèles : **menu complet** (A4, A3), **flyer pizza du moment** (A5/A4),
  **affiche fermeture / vacances** (A4/A3), **annonce événement**, **carte des
  emplacements de la semaine**.
- Rendu : pages Vue dédiées `/print/[modele]` avec CSS `@page` (A4/A3, fonds
  perdus), alimentées par les données réelles et les visuels du stock (Vercel Blob).
- Export PDF : bouton dans l'admin (impression navigateur) et génération serveur
  (Chromium headless) stockée dans Vercel Blob, disponible aussi via l'outil MCP
  `generate_print` qui renvoie l'URL du PDF.

### 3.7 Médias

- **Vercel Blob** (pas de Cloudinary) : photos pizzas, ambiance, flyers générés.
- Optimisation `@nuxt/image` (AVIF/WebP, tailles responsives).
- En attendant les originaux HD : visuels existants + placeholders propres.

### 3.8 Internationalisation

- `@nuxtjs/i18n` : FR (défaut, sans préfixe), EN, ES, IT.
- Textes d'interface : fichiers de traduction.
- Contenus (pizzas, ingrédients, messages) : champs traduits en base, repli
  sur le français. L'IA peut traduire via `translate_content`.
- `hreflang`, sitemap multilingue.

### 3.9 Analytics

- PostHog (projet existant), mode **sans cookies** (pas de bandeau), proxy
  first-party pour éviter les bloqueurs.
- Objectifs suivis : clic sur « Appeler » et consultation de la carte.
- Résumé 7 jours dans l'admin et via MCP (adaptateur mocké tant que la clé
  API PostHog n'est pas fournie).

## 4. L'accueil et le design

Les trois landings du départ (3D « Le Four », « Ce soir », « La Tournée ») ont
été abandonnées après revue (octobre 2026) au profit d'**un seul accueil**, et
le site public a adopté le design system « Crema & Nero » (maquettes et bilan
de la revue : `public/_maquette/`, non versionné).

- **Design** : fonds crème et noir en alternance, un seul accent rouge (appel),
  or en touche rare, Instrument Serif pour les titres et les noms de pizzas,
  Hanken Grotesk pour le texte, Cinzel uniquement pour le logo (en texte).
  Pas de dégradé décoratif, pas de motif ; la photo fait le décor.
- **Accueil** : photo plein écran avec la semaine en bas, pizza du moment
  (composition), mosaïque des pizzas qui ont une photo (chaque tuile mène à la
  pizza sur la carte), « Commander » (téléphone ou camion), avis Google.
- **En-tête** : pastille d'état calculée d'après le planning (vert : ouvert,
  abricot : ce soir, gris : fermé), lien d'appel. **Barre d'appel** fixe en
  bas sur mobile (La carte, Nous trouver, Appeler).
- **Messages** : affichés en **bandeau** sous l'en-tête (plus de modale).

## 5. Exigences non fonctionnelles

- **Performance** : Lighthouse mobile ≥ 95 (perf, a11y, SEO, bonnes pratiques)
  sur toutes les pages publiques. LCP < 2,0 s en 4G.
- **Accessibilité** : WCAG 2.2 AA, navigation clavier, contrastes, `reduced-motion`.
- **SEO** : rendu serveur des pages publiques, schema.org (`Restaurant`,
  `Menu`, `OpeningHoursSpecification`, `FoodEstablishment`), sitemap, robots,
  `llms.txt` dynamique, images OG générées par page et par langue.
- **PWA** : manifeste complet (icônes maskable, captures d'écran), raccourcis
  (Carte, Nous trouver, Appeler), widget « Ce soir » (Windows/Edge, carte
  adaptative), hors-ligne pour la carte et les horaires, `apple-touch-icon`,
  thème clair/sombre de la barre système.
- **Sécurité** : sessions chiffrées (cookies `httpOnly`, `SameSite=Lax`),
  jetons hachés (SHA-256), limitation de fréquence (connexion, MCP), en-têtes de
  sécurité (CSP, HSTS), validation Zod de toutes les entrées, RGPD (pas de
  cookie tiers).
- **Rendu** : pages publiques SSR mises en cache (ISR, 60 s) ; admin en SPA
  (`ssr: false`) ; API serveur Nitro.

## 6. Architecture technique

| Couche | Choix | Pourquoi |
|---|---|---|
| Framework | Nuxt 4.6, Vue 3.5, TypeScript strict | Demandé ; rendu hybride via `routeRules` |
| UI publique | Tailwind CSS v4, design sur mesure | Contrôle total, pas de look « template » |
| UI admin | Nuxt UI v4 | Formulaires, tableaux, modales prêts et accessibles |
| Base de données | **libSQL / SQLite** via Drizzle ORM | Fichier local en dev ; **Turso** en prod en changeant deux variables |
| Auth | `nuxt-auth-utils` + lien magique maison | Sessions scellées, simple |
| E-mail | Resend (adaptateur ; console en dev) | Validé |
| Médias | Vercel Blob (adaptateur ; disque local en dev) | Validé |
| MCP | `@nuxtjs/mcp-toolkit` | Outils définis dans Nuxt, partagent la logique métier |
| i18n | `@nuxtjs/i18n` v10 | FR / EN / ES / IT |
| SEO | `@nuxtjs/seo` (sitemap, robots, schema.org, OG image) | Standard Nuxt |
| PWA | `@vite-pwa/nuxt` | Manifeste, service worker, raccourcis |
| Tests | Vitest (unitaires), Playwright (e2e), Lighthouse CI | |
| Hébergement | Vercel (projet dédié, aperçus par branche) | Validé |
| Paquets | pnpm | Rapide, strict |

**Adaptateurs** (port/adapter) pour tout service externe pas encore branché :
`db` (libSQL local ↔ Turso), `mailer` (console ↔ Resend), `storage` (disque ↔
Blob), `reviews` (mock ↔ Google Places), `analytics` (mock ↔ PostHog API). On
branche en fournissant les variables d'environnement, sans toucher au code.

### 6.1 Modèle de données (résumé)

`users`, `magic_links`, `api_tokens`, `settings`, `locations`, `seasons`,
`schedule_slots`, `schedule_exceptions`, `ingredients`, `allergens`,
`ingredient_allergens`, `bases`, `pizzas`, `pizza_ingredients`, `menus`,
`menu_items`, `featured_pizzas` (pizza du moment), `supplement_groups`,
`drinks`, `desserts`, `modal_messages`, `media`, `translations`,
`revisions`, `changesets`, `audit_log`, `print_jobs`.

Les données actuelles (carte Automne-Hiver 2026, boissons, suppléments, lieux,
horaires, anciennes PDM archivées) sont **importées dans le seed**.

## 7. Organisation du projet

- **Branches** : `main` (production) ← `preprod` (préproduction) ← `feat/*`,
  `fix/*`, `chore/*`. PR obligatoire, CI verte avant fusion.
- **Commits** : Conventional Commits (`feat:`, `fix:`, `chore:`…), description en français.
- **Versions** : SemVer. `0.x` pendant la construction, `1.0.0` à la bascule du
  domaine. CHANGELOG et releases GitHub générés par release-please.
- **CI** (GitHub Actions) : lint, typecheck, tests unitaires, build, e2e.
- **Docs** : `README.md`, `AGENTS.md` (+ `CLAUDE.md` qui pointe dessus),
  `docs/` (CDC, ADR, guide MCP).

### 7.1 Jalons

| Version | Contenu |
|---|---|
| 0.1.0 | Socle Nuxt, design system, CI, docs |
| 0.2.0 | Base de données, schéma, seed des données actuelles, logique horaires |
| 0.3.0 | Pages publiques (carte, nous trouver, modale), i18n FR/EN/ES/IT |
| 0.4.0 | Admin + connexion par lien magique |
| 0.5.0 | Historique, brouillons, serveur MCP, skill |
| 0.6.0 | Trois landing pages + A/B test |
| 0.7.0 | PWA, SEO, OG images, JSON-LD, llms.txt |
| 0.8.0 | Atelier d'impression PDF |
| 0.9.0 | Branchement Turso, Resend, Blob, Google, PostHog ; recette |
| 1.0.0 | Bascule de sestini-pizza.fr |

## 8. Ce qui reste à fournir (non bloquant)

- Jeton Turso (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`).
- Clé Resend + DNS du domaine `sestini-pizza.fr` (SPF/DKIM).
- `BLOB_READ_WRITE_TOKEN` (Vercel Blob).
- Clé Google Places + Place ID pour les avis.
- Clé API personnelle PostHog (lecture) pour les stats dans l'admin.
- Photos HD (four, camion, pizzas, pâton).
- E-mail de Jérémy.

## 9. Hors périmètre

Commande et paiement en ligne, publication sur les réseaux sociaux, comptes clients.
