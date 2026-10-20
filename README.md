# Sestini Pizza — 2026

Site de [Sestini Pizza](https://www.sestini-pizza.fr), camion pizza au feu de bois près de Montpellier :
site public multilingue, **atelier** (administration) et **serveur MCP** pour piloter le contenu par IA.

- Cahier des charges : [`docs/CDC.md`](docs/CDC.md)
- Serveur MCP : [`docs/MCP.md`](docs/MCP.md) · skill Claude Code : [`.claude/skills/sestini-atelier`](.claude/skills/sestini-atelier/SKILL.md)
- Guide pour les agents : [`AGENTS.md`](AGENTS.md)

## Démarrer

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

Sans configuration, la base est un fichier SQLite local (`.data/sestini.db`), créée et remplie au
premier démarrage avec la carte actuelle. L'atelier est sur `/atelier` : en développement, le lien de
connexion s'affiche à l'écran (aucun e-mail n'est envoyé).

## Ce qu'il y a dedans

| Partie | Où | Notes |
|---|---|---|
| Site public | `app/pages`, `app/components/site`, `app/components/menu` | FR / EN / ES / IT, SSR |
| Landings | `app/components/landing` | `four` (3D), `ce-soir` (éditoriale), `tournee` (carte) — choix dans Réglages, aperçu `/?variante=…` |
| Atelier | `app/pages/atelier`, `app/components/admin` | Nuxt UI, connexion par lien magique |
| Domaine | `shared/` | Planning en couches, modale programmée, schémas Zod des opérations |
| Base | `server/database` | Drizzle + libSQL (fichier local ou Turso) |
| Écritures | `server/services/operations.ts` | Transactions, révisions, brouillons |
| API | `server/api` | `public/*` (site), `admin/*` (session), `auth/*` |
| MCP | `server/mcp`, `server/middleware/mcp-auth.ts` | Jetons personnels, brouillon par défaut |
| PWA / SEO | `nuxt.config.ts`, `server/services/seo.ts` | Manifeste, widget, JSON-LD, `llms.txt`, OG |

## Variables d'environnement

Toutes facultatives : chaque service a un mode dégradé pour le développement.

| Variable | Rôle | Sans elle |
|---|---|---|
| `NUXT_DB_URL`, `NUXT_DB_AUTH_TOKEN` | Base Turso (`libsql://…`) | Fichier local ; sur Vercel, base de démo dans `/tmp` (perdue à chaque démarrage) |
| `NUXT_SESSION_PASSWORD` | Chiffrement des sessions (≥ 32 caractères) | Générée en dev ; **obligatoire en production** |
| `NUXT_RESEND_API_KEY` | Envoi des liens de connexion | Lien affiché dans les logs |
| `NUXT_RESEND_FROM` | Expéditeur (domaine vérifié chez Resend) | `Sestini Pizza <atelier@sestini-pizza.fr>` |
| `NUXT_BLOB_TOKEN` | Vercel Blob (photos) | — |
| `NUXT_PUBLIC_POSTHOG_KEY`, `NUXT_PUBLIC_POSTHOG_HOST` | Mesure d'audience (sans cookie) | Pas de mesure |
| `NUXT_POSTHOG_PERSONAL_API_KEY`, `NUXT_POSTHOG_PROJECT_ID` | Stats dans l'atelier et via MCP | Données de démo, signalées comme telles |

## Commandes

| Commande | Rôle |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm preview` | Développement, build, aperçu du build |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | Qualité (lancés par la CI) |
| `pnpm db:generate` | Nouvelle migration après un changement de `server/database/schema.ts` |
| `pnpm assets:brand` | Régénère icônes PWA et images de partage depuis le logo |
| `pnpm assets:screenshots` | Captures du manifeste PWA (site lancé, `BASE_URL`) |

## Flux Git et versions

- `main` = production, `preprod` = préproduction, travail sur `feat/*`, `fix/*`, `chore/*` → PR vers `preprod`.
- Commits [conventionnels](https://www.conventionalcommits.org/fr/) vérifiés par commitlint (husky).
- **release-please** prépare sur `main` une PR de version avec `CHANGELOG.md` ; la fusionner crée le tag
  et la release GitHub. Versions `0.x` jusqu'à la bascule du domaine (`1.0.0`).

## Déploiement (Vercel)

1. Importer le dépôt dans Vercel (preset Nuxt détecté).
2. Renseigner au minimum `NUXT_SESSION_PASSWORD`, puis `NUXT_DB_URL` / `NUXT_DB_AUTH_TOKEN` (Turso).
3. Les migrations s'appliquent au démarrage ; une base vide est remplie avec la carte actuelle.
4. Chaque branche a son URL de prévisualisation ; `main` part en production.
