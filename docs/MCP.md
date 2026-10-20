# Serveur MCP

Le site expose un serveur [MCP](https://modelcontextprotocol.io) sur `/mcp` (Streamable HTTP)
pour que les propriétaires confient les mises à jour à leur agent IA.

## Sécurité

- Accès par **jeton personnel** (`Authorization: Bearer sestini_…`) créé dans l'atelier
  (`/atelier/ia`) par un utilisateur autorisé. Jetons stockés hachés (SHA-256), révocables,
  avec expiration.
- Portées : `read` (lecture), `write` (brouillons), `publish` (publication directe).
- **Brouillon par défaut** : une écriture crée un changeset à valider dans `/atelier/brouillons`.
  `publish: true` n'est accepté qu'avec la portée `publish`.
- Chaque appel est journalisé (`audit_log`), chaque modification crée une révision restaurable.
- Le middleware `server/middleware/mcp-auth.ts` refuse toute requête sans jeton valide (401).

## Outils

| Outil | Portée | Rôle |
|---|---|---|
| `site_overview` | read | Ce soir, 14 jours, carte, PDM, modale, brouillons |
| `get_menu` | read | Carte détaillée ou liste des cartes |
| `search_catalog` | read | Pizzas, ingrédients, boissons, suppléments, desserts (archives comprises) |
| `get_schedule` | read | Lieux, saisons, exceptions, calendrier résolu |
| `list_modal_messages` | read | Messages programmés et leur état |
| `get_history` | read | Révisions et brouillons |
| `get_settings` | read | Réglages du site |
| `get_analytics` | read | Audience PostHog (ou démo) |
| `get_print_document` | read | URL d'un document imprimable (carte, flyer PDM, fermeture, événement, semaine ; A5/A4/A3) |
| `set_pizza_du_moment` | write | Nouvelle PDM (existante ou à créer) |
| `upsert_pizza` | write | Créer / modifier une pizza, l'ajouter à une carte |
| `add_schedule_exception` | write | Fermeture, vacances, lieu ponctuel, horaires spéciaux |
| `schedule_modal_message` | write | Message de modale programmé |
| `apply_operations` | write | Opérations génériques (transaction) |
| `decide_draft` | write / publish | Rejeter / publier un brouillon |

Le skill [`.claude/skills/sestini-atelier`](../.claude/skills/sestini-atelier/SKILL.md) décrit les
recettes courantes pour un agent Claude Code.

## Impression (PDF)

Les documents imprimables sont des pages `/print/<modele>` (`carte`, `pizza-du-moment`, `fermeture`,
`evenement`, `semaine`) au format exact (`@page`, A5 / A4 / A3, portrait ou paysage), alimentées par
`/api/print/<modele>` (lecture seule, données publiques). Paramètres communs : `format`, `orientation`,
`theme` (`clair` par défaut, économe en encre ; `sombre` pour l'affichage), `lang` (`fr`, `en`, `es`, `it`).

L'outil `get_print_document` renvoie l'URL ; il ne génère pas de PDF côté serveur (pas de Chromium
embarqué). Pour obtenir le fichier :

- un humain ouvre l'URL (ou l'atelier, page **Impression**) et clique « Imprimer / Enregistrer en PDF »,
  marges « Aucune », arrière-plans cochés ;
- un agent ouvre l'URL dans un navigateur headless, attend `[data-print-ready="1"]` (polices chargées,
  ajustement terminé) puis appelle `page.pdf({ preferCSSPageSize: true, printBackground: true })`.

