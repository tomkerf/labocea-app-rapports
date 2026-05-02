# _MANIFEST.md — labocea-app-rapports

Projet : application web (PWA) de saisie terrain et de génération des rapports d'intervention pour Labocea (technicien environnemental, spécialité eau).

## Tier 1 — fichiers à lire en priorité

- `README.md` — état actuel, stack, install, déploiement.
- `src/schemas/intervention.ts` — modèle de données racine (discriminator par type de fiche).
- `src/schemas/pauto.ts` — schéma Zod de la fiche PENV-SU-0120.
- `src/schemas/common.ts` — sous-schémas communs (identification, observations, réception labo).
- `src/pages/forms/PautoForm.tsx` — formulaire de saisie complet 0120.
- `src/pages/InterventionForm.tsx` — page d'édition (FormProvider + auto-save Dexie).

## Stack

- React 19 + TypeScript + Vite 8
- Tailwind CSS v4
- React Router v7
- React Hook Form + Zod
- Dexie (IndexedDB) + dexie-react-hooks
- vite-plugin-pwa (offline + installable)
- Déploiement : Cloudflare (wrangler)

## Type de fiche implémenté (MVP)

**PENV-SU-0120** : prélèvement automatique avec asservissement au débit (effluents). Bilan 24h, 1 dispositif unique par fiche.

## Types de fiches à venir (Phase 4)

- **PENV-SU-0114** : eaux souterraines (piézomètre/forage).
- **PENV-SU-0117** : eaux superficielles (rivière, salines, résiduaires).

## Conventions

- Stockage **local-first** (IndexedDB). Aucun backend pour le moment.
- Auto-save sur chaque mutation de champ (debounce 500 ms).
- Discriminated union par `typeFiche` (`PAUTO` | `ESO` | `ESU`).
- Référence aux fiches papier originales : déposées dans `uploads/` (PENV-SU-0114, 0117, 0120).

## Commande de déploiement

```bash
npm run deploy
```
