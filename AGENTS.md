# AGENTS.md

Guide pour les agents (Claude Code, Codex…) qui travaillent sur ce dépôt.

## Le projet

Site de **Sestini Pizza**, camion pizza au feu de bois près de Montpellier.
Commande par téléphone uniquement, retrait sur place. Le cahier des charges
complet est dans [`docs/CDC.md`](docs/CDC.md).

**Le contenu (carte, horaires, messages) ne se modifie pas dans le code.** Il
vit en base et se pilote depuis l'admin (`/atelier`) ou le serveur MCP
(`/mcp`). Ne réintroduis pas de données en dur ni de « code mort » pour garder
un historique : l'historique est géré par les révisions en base.

## Commandes

| Commande | Rôle |
|---|---|
| `pnpm dev` | Serveur de développement |
| `pnpm build` | Build de production |
| `pnpm lint` / `pnpm lint:fix` | ESLint (règles Nuxt + stylistic) |
| `pnpm typecheck` | Vérification TypeScript (vue-tsc) |
| `pnpm test` | Tests unitaires (Vitest) |

## Conventions

- **Commits** : [Conventional Commits](https://www.conventionalcommits.org/fr/),
  vérifiés par commitlint. Types : `feat`, `fix`, `perf`, `refactor`, `content`,
  `docs`, `test`, `build`, `ci`, `chore`, `style`, `revert`. Description en français.
- **Branches** : `main` (production) ← `preprod` ← `feat/*`, `fix/*`, `chore/*`.
- **Versions** : release-please ouvre une PR de release sur `main` et génère le
  `CHANGELOG.md`. SemVer, `0.x` jusqu'à la mise en ligne.
- Nuxt 4 : le code client est dans `app/`, le serveur dans `server/`, le code
  partagé (types, schémas Zod, logique pure) dans `shared/`.
- Texte de l'interface en français par défaut, traduit via `i18n/locales/`.
