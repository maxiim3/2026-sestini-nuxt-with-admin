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
| `set_pizza_du_moment` | write | Nouvelle PDM (existante ou à créer) |
| `upsert_pizza` | write | Créer / modifier une pizza, l'ajouter à une carte |
| `add_schedule_exception` | write | Fermeture, vacances, lieu ponctuel, horaires spéciaux |
| `schedule_modal_message` | write | Message de modale programmé |
| `apply_operations` | write | Opérations génériques (transaction) |
| `decide_draft` | write / publish | Rejeter / publier un brouillon |

Le skill [`.claude/skills/sestini-atelier`](../.claude/skills/sestini-atelier/SKILL.md) décrit les
recettes courantes pour un agent Claude Code.
