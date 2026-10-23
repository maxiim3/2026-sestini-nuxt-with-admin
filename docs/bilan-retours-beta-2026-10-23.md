# Sestini Pizza · Retours sur la bêta (23 octobre 2026)

Session de travail sur le nouveau site (Nuxt, dépôt `2026-sestini-nuxt-with-admin`) après la première mise en ligne de la bêta sur Vercel. Max a fait ses retours desktop puis mobile, et Claude les a traités sur une branche dédiée.

## Où en est-on

- **Branche** : `feat/retours-beta`, partie de `main` (identique à `preprod`).
- **PR** : [maxiim3/2026-sestini-nuxt-with-admin#43](https://github.com/maxiim3/2026-sestini-nuxt-with-admin/pull/43), vers `preprod`, **non mergée**. Rien n'est mergé en `preprod` ni en `main`.
- **Aperçu à tester** : https://2026-sestini-nuxt-with-admin-git-feat-8c2fce-maxiim3s-projects.vercel.app (suit le dernier commit de la branche, sur la vraie base Turso).
- **Contrôles** : lint, typecheck, 40 tests unitaires et 16 tests e2e au vert, en local comme en CI.
- **Rappels** : le site reste en bêta. sestini-pizza.fr reste sur l'ancien site (dépôt `sestini-pizza-2023`), qu'on lit sans jamais le modifier.
- **Versions** : release-please est déjà en place sur `main` (version actuelle 0.2.0). La PWA est déjà en place.

## Les retours de Max et ce qui a été fait

| Retour | Décision | État |
|---|---|---|
| Logo de l'en-tête : « PIZZA » plus petit, police bizarre | On reprend le lettrage d'origine (`public/brand/wordmark.svg`, S et A ornés) au lieu d'un texte en Cinzel, dans l'en-tête et le pied de page. Le cadre du SVG rognait les lettres : agrandi. | Fait |
| Logo rond (favicon du site en ligne) | Favicon, icône iPhone et icônes PWA reprennent le logo rond (`public/brand/emblem-rond.svg`). `scripts/generate-brand-assets.mjs --icons-only` les régénère. | Fait |
| Police des titres : Cinzel / Cinzel Decorative comme l'ancien site | Bouton d'essai à 3 modes (voir plus bas). Le mode **Hybride** est retenu par défaut. | Fait, à valider |
| Carte : ancienne trop monotone, nouvelle trop chargée | Fiche pizza sobre : une seule couleur, « Sauce tomate » et « Après cuisson : » en gras, plus d'italique ni d'ocre. Les allergènes de la pâte (soja, gluten, lait) sont rappelés une fois en tête de carte. Sur chaque pizza, on n'affiche que les allergènes en plus. | Fait |
| Section « Commander » invisible sur l'accueil | Refaite à la verticale avec un vrai titre et le numéro en bouton. Textes revus (voir plus bas). | Fait |
| Accueil mobile déséquilibré, trop de rouge | Bandeau de message réduit à une ligne sur mobile (titre et lien). Textes et marges du hero resserrés. Le bouton « Appeler » reste rouge. | Fait en partie |
| Hauteurs iPhone (barre Safari qui se replie) | La photo de l'accueil se cale entre l'en-tête (et le bandeau, dont la hauteur est mesurée) et la barre d'appel, en `svh`. La bande des soirées n'est plus cachée sous « Appeler ». | Fait, non testé sur un vrai iPhone |
| Bande des soirées scrollable | Gardée telle quelle (appréciée). | Conservé |
| « Nous trouver » sur mobile : la carte change en haut, hors de l'écran | La carte, l'adresse et l'itinéraire s'ouvrent en tiroir sous la soirée touchée. Le desktop garde la carte fixe à droite. | Fait |
| « 9 pizzas » mal aligné | Aligné sur la dernière ligne du titre de section, sans passer à la ligne sur mobile. | Fait |
| Connexion à l'atelier : « Invalid `from` field » | La variable Vercel `NUXT_RESEND_FROM` était mal formée. Elle vaut maintenant `Sestini Pizza <atelier@admin.sestini-pizza.fr>` (Production et Preview), domaine validé pour l'envoi chez Resend. Aperçu redéployé. | Fait, envoi à tester |

## Le système de titres (décision clé)

Les titres sont rangés en quatre niveaux, et un mode s'applique toujours à un niveau entier, pour garder une hiérarchie visuelle cohérente sur tout le site :

| Niveau | Exemples | Mode Hybride (par défaut) |
|---|---|---|
| Grand titre de l'accueil | « La pizza au feu de *bois*. » | Instrument Serif, « bois » en italique abricot |
| Titre de page | « La carte », « Nous trouver », « Mentions légales » | Cinzel en capitales, première et dernière lettre en Cinzel Decorative, comme le logo (S…A) |
| Titre de section | « Nos pizzas base tomate », « À la carte cette saison », « Par téléphone ou sur place », Softs / Eaux / Bières / Vins | Instrument Serif |
| Nom dans une liste | pizzas (y compris la pizza du moment), boissons, desserts, villes | Cinzel en capitales et en gras |

Prix, chiffres et accroches restent toujours en Instrument Serif. Le texte courant est en Hanken Grotesk.

- **Pourquoi les sections en Instrument** : les noms de pizzas juste en dessous sont en Cinzel capitales. Si le titre de section l'était aussi, les deux niveaux se confondraient.
- **« À la carte cette saison »** reste en Instrument par cohérence avec les autres titres de section de l'accueil. Max hésitait à l'aligner sur « La carte ».
- **Autres modes du bouton** (en bas à droite, choix gardé dans le navigateur, forçable avec `?titres=instrument|hybride|cinzel`) :
  - **Cinzel** reproduit le site 2023 : tout en Cinzel capitales, initiale de chaque mot ornée dans les sections. Dans ce mode, seuls le L de « La » et le S de « bois » sont ornés dans le grand titre de l'accueil.
  - **Instrument** est la refonte d'origine.
- **Technique** :
  - Les classes `.title-hero`, `.title-display`, `.title-section` et `.title-item` sont décrites dans `app/assets/css/main.css`.
  - Les lettres ornées passent par `SiteDecoText`.
  - `font-size-adjust: cap-height` ramène Cinzel, bien plus large, à la carrure d'Instrument sans changer les tailles déclarées.

## Textes revus (section Commander)

- Titre : **Par téléphone ou sur place** (on évite « au camion »).
- 1 · **Appelez ou commandez sur place** : « Au 07 88 52 91 78, ou directement sur place. »
- 2 · **On prépare votre commande** : « Pâte fraîche, cuite au feu de bois. »
- 3 · **Retrait sur place** : « Paiement en espèces ou par carte bancaire. » En petit : « Nous ne prenons ni les chèques ni les tickets restaurant. Merci de votre compréhension. »
- Encadré : « Avant de venir, vérifiez bien l'emplacement du soir : nous ne sommes pas au même endroit tous les jours », avec un lien « Où nous trouver ».
- « Au camion » devient « sur place » dans le pied de page, le bloc du soir de « Nous trouver » et `llms.txt`. Les quatre langues (fr, en, es, it) sont à jour.

## Ce qui reste à faire

1. **Tester l'aperçu** (desktop et iPhone) :
   - le logo entier ;
   - le mode Hybride sur l'accueil, la carte et « Nous trouver » ;
   - la bande des soirées au-dessus de « Appeler » ;
   - le tiroir de carte sur « Nous trouver » ;
   - la section Commander ;
   - le favicon ;
   - la connexion à l'atelier par lien e-mail.
2. **Trancher la police** : valider Hybride (ou un autre mode). Ensuite, retirer le bouton d'essai et garder une seule règle dans le CSS.
3. **Points en suspens** :
   - « À la carte cette saison » en Instrument ou en Cinzel ;
   - la quantité de rouge sur mobile (bouton « Appeler ») ;
   - vérifier que les textes de paiement sont exacts.
4. **Merger la PR #43** vers `preprod` après validation de Max. Le passage `preprod` → `main` ne se fait que sur sa demande.
5. **Production Vercel** : elle ne prendra la nouvelle adresse d'expéditeur qu'au prochain déploiement de `main`.
6. **Resend** : l'enregistrement MX de réception de `admin.sestini-pizza.fr` est en échec. Ça ne gêne pas l'envoi, seulement la réception de mails sur ce domaine.
7. **Restes ouverts d'avant cette session** : lien LinkedIn, boutons rapides Ouvert/Fermé pour Jérémy, vrais avis Google, vraies photos.
