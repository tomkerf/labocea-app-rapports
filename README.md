# Labocea — Rapports terrain

Application web (PWA) pour la saisie terrain et la génération des rapports d'intervention chez Labocea (eau).

## État actuel — MVP Phase 1

Type de fiche implémenté : **PENV-SU-0120** — Prélèvement automatique avec asservissement au débit (effluents, FD T90-523-2). Bilan 24h sur 1 dispositif unique par fiche.

Fonctionnalités :

- Liste des interventions enregistrées (recherche, statuts).
- Création d'une nouvelle fiche (le sélecteur propose les 3 types ; seuls PAUTO est actif aujourd'hui).
- Formulaire de saisie complet 0120 (sections déroulantes : identification, localisation, dispositif jaugeur, débitmètre, métrologie, échantillonneur auto, vérifications vitesse + volume + température enceinte, mesures in situ, constitution, réception labo, observations).
- Auto-save local (IndexedDB via Dexie) à chaque modification de champ.
- PWA installable et utilisable hors-ligne.
- Responsive desktop / mobile.

Les données sont stockées **localement** dans le navigateur (IndexedDB) — aucun backend pour le moment.

## Prochaines étapes

- Phase 2 : import des résultats d'analyses (CSV/Excel du LIMS).
- Phase 3 : génération PDF du rapport d'intervention (template Labocea).
- Phase 4 : décliner le formulaire pour PENV-SU-0114 (eaux souterraines) et PENV-SU-0117 (eaux superficielles).
- Phase 5 : backend Supabase + sync multi-appareils.

## Installation

```bash
npm install --legacy-peer-deps
```

Le flag `--legacy-peer-deps` est nécessaire car `vite-plugin-pwa` n'a pas encore aligné son peer-dep sur Vite 8.

## Développement

```bash
npm run dev
```

L'app est servie sur http://localhost:5173.

## Build

```bash
npm run build
```

## Déploiement

```bash
npm run deploy
```

(déploie sur Cloudflare via wrangler)

## Architecture

```
src/
├── App.tsx              # Routes
├── main.tsx             # Bootstrap + BrowserRouter
├── index.css            # Tailwind + variables thème
├── components/
│   ├── Layout.tsx       # Sidebar desktop + bottom-nav mobile
│   └── ui/              # Field, Section, Radio, Checkbox réutilisables
├── pages/
│   ├── InterventionsList.tsx   # Liste + recherche
│   ├── NewIntervention.tsx     # Sélecteur de type de fiche
│   ├── InterventionForm.tsx    # Page d'édition (charge l'intervention + auto-save)
│   ├── Settings.tsx            # Paramètres (effacer la base locale)
│   └── forms/
│       └── PautoForm.tsx       # Formulaire complet PENV-SU-0120
├── schemas/
│   ├── common.ts        # Identification, observations, réception, énumérations
│   ├── intervention.ts  # Schéma racine + discriminator typeFiche
│   └── pauto.ts         # Schéma fiche 0120 (Zod)
├── db/
│   ├── db.ts            # Dexie (IndexedDB)
│   └── interventions.ts # Hooks + CRUD
└── lib/
    └── cn.ts            # clsx wrapper
```
