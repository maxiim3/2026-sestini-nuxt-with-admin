---
name: sestini-atelier
description: Mettre à jour le contenu du site Sestini Pizza (carte, pizza du moment, horaires, lieux, fermetures, messages de la modale, réglages) via le serveur MCP du site, et analyser l'audience. À utiliser dès que la demande porte sur le contenu du site plutôt que sur son code.
---

# Piloter le site Sestini Pizza

Le contenu du site **n'est pas dans le code** : il vit en base et se modifie via le serveur MCP
`sestini` (outils ci-dessous) ou l'atelier (`/atelier`). Ne modifie jamais de fichiers du dépôt pour
changer la carte, les horaires ou un message.

## Connexion

Un administrateur crée un jeton dans l'atelier, page **IA & MCP**, puis :

```bash
claude mcp add --transport http sestini https://www.sestini-pizza.fr/mcp \
  --header "Authorization: Bearer sestini_…"
```

Sans jeton valide, le serveur répond 401 : demande à l'utilisateur d'en créer un.

## Méthode

1. `site_overview` d'abord : ce soir, 14 jours, carte active, pizza du moment, modale, brouillons.
2. Lis avant d'écrire : `get_menu`, `get_schedule`, `search_catalog` (archives comprises),
   `list_modal_messages`, `get_settings`, `get_history`.
3. Écris avec l'outil le plus spécifique ; sinon `apply_operations` (transaction tout-ou-rien).
4. **Brouillon par défaut.** Ne passe `publish: true` que si l'utilisateur l'a demandé
   explicitement et que le jeton a la portée `publish`. Sinon, donne le lien de validation
   (`/atelier/brouillons`).
5. Termine par un récapitulatif : ce qui change, à partir de quand, et où le vérifier.

## Recettes

| Demande | Outils |
|---|---|
| Nouvelle pizza du moment | `search_catalog` (une ancienne PDM peut servir de modèle) → `set_pizza_du_moment` |
| Fermeture / vacances | `add_schedule_exception` (kind `closed`) **+** `schedule_modal_message` (kind `closure`, même période, priorité 80) |
| Événement dans un autre lieu | `add_schedule_exception` (kind `relocated`, `newLocation` si besoin) + message `event` |
| Nouvelle carte de saison | `get_menu` → `apply_operations` : `create menu` (ref `$carte`) + `setMenuItems` + pizzas (`upsert_pizza`), puis `activateMenu` le jour J |
| Changement de prix | `upsert_pizza` (ou `update pizza { priceCents }`) |
| Horaires d'été | `get_schedule` → `create season` (dates, priorité 10) + `setScheduleSlots` |
| Annuler une erreur | `get_history` → `apply_operations [{ op: "restoreRevision", revisionId }]` |
| Optimiser le site | `get_analytics` (si `source: "demo"`, les chiffres sont fictifs) |
| Créer un flyer / une affiche | voir ci-dessous |

## Règles métier

- Commande **par téléphone uniquement**, retrait au camion, pas de paiement en ligne.
- Le public ne voit que l'heure d'ouverture (« dès 18h »), pas la fermeture.
- On **archive**, on ne supprime pas : les archives servent de modèles.
- Tout texte visible doit être traduit (`i18n: { en, es, it }`), ton chaleureux et sobre.
- Allergènes : déduits des ingrédients (14 allergènes UE) ; ajoute `extraAllergens` si besoin.
- Prix : `priceEuros` dans les outils dédiés, `priceCents` dans `apply_operations`.

## Créer un flyer / une affiche

1. Le contenu d'abord : le document reprend les données publiées (carte, PDM, exceptions, messages).
   Pour des congés, crée l'exception `closed` (et son message) ; pour un événement, l'exception
   `relocated` ou `extra`. Fais valider le brouillon : un brouillon n'apparaît pas à l'impression.
2. `get_print_document` sans argument liste les modèles et leurs paramètres ; puis appelle-le avec
   `model`, `format` (A5 flyer, A4, A3 affiche), `orientation`, `theme` (`clair` pour imprimer au bureau,
   `sombre` pour une affiche à l'écran ou chez l'imprimeur), `lang` et `params`
   (ex. `{ exception: "<id>" }`, `{ from, to }`, `{ message: "none" }`, `{ title, body }`).
3. Donne l'URL à l'utilisateur (bouton « Imprimer / Enregistrer en PDF »), ou produis le PDF toi-même
   avec un navigateur headless : `emulateMedia({ media: 'print' })`, attendre `[data-print-ready="1"]`,
   puis `page.pdf({ preferCSSPageSize: true, printBackground: true })`. Vérifie qu'il fait une page.

