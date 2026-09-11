# Casa Caraïbes — CRM (refonte enterprise)

CRM immobilier React 18 + TypeScript strict, refactorisé en architecture modulaire,
sécurisée (RLS Supabase) et hautement scannable.

## Stack

- **Vite + React 18 + TypeScript strict** (`strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`)
- **Tailwind CSS** — design tokens "Quiet Luxury" (aucune chaîne CSS globale)
- **TanStack Query** (cache Supabase) + **TanStack Table** (tableaux triables)
- **Zustand** — état UI / session / filtres
- **Zod** — source de vérité unique (types métier inférés via `z.infer`)
- **@react-pdf/renderer** — rapport PDF natif (lazy-loadé)
- **Supabase** — backend, sécurisé par Row Level Security

## Démarrage

```bash
npm install
cp .env.example .env.local        # renseigner VITE_SUPABASE_ANON_KEY
# Exécuter supabase/migrations/001_rls.sql puis 011_docs_locaux.sql dans le SQL Editor Supabase
npm run dev                        # http://localhost:5173
```

Comptes : plus de mots de passe dans le code. Créer Luc / Noham / Steeve dans
Supabase → Authentication → Users, puis exécuter `supabase/migrations/012_profiles.sql`.

## Scripts

| Commande | Effet |
|----------|-------|
| `npm run dev` | Serveur de dev (port 5173) |
| `npm run build` | `tsc --noEmit` + build de production Vite |
| `npm run preview` | Prévisualise le build |

## Architecture

```
src/
├── schemas/        Zod — source de vérité (validation + types inférés)
├── types/          database (snake_case) + domain (barrel inféré)
├── services/       couche données isolée (api, mappers, services entités, sync compromis→revenus)
├── hooks/          useFinancials (mémoïsé) + queries/ (TanStack Query + mutations)
├── store/          Zustand (ui / session / filters)
├── components/     layout, shared (DataTable…), + une vue par domaine métier
├── reports/        RapportFinancier (@react-pdf, 3 pages dédiées)
└── lib/            tokens, format, cn
```

## Points de sécurité

- **RLS activé** (`supabase/migrations/001_rls.sql`) : cloisonnement par `agent_id`,
  le directeur voit tout. La clé anon dans le bundle est publique par conception —
  la protection réelle vient des policies, pas du masquage de la clé.
- **Rédacteur juridique** : aperçu rendu via composants React (zéro `dangerouslySetInnerHTML`),
  export bloqué tant que le schéma Zod ne valide pas tous les champs requis.
- **ErrorBoundary** global + `ApiError` typée (table + opération).

## Synchronisation financière

`services/compromis.service.ts` synchronise atomiquement un compromis et son revenu lié :
passage en « Acte signé » → création/MAJ du revenu ; retour en arrière → suppression du revenu fantôme.
Tout le calcul est centralisé et mémoïsé dans `useFinancials`.

## Persistance documents (étape 1)

Les **baux** et **valeurs locatives** ne vivent plus dans le navigateur.
Ils sont stockés dans Supabase (`public.baux`, `public.valeurs_locatives`).

## Auth agence (étape 2)

1. Authentication → Providers → Email : **Confirm email OFF**
2. Authentication → Users → Add user (auto-confirm) :
   - luc@casacaraibes.com
   - noham@casacaraibes.com
   - steeve@casacaraibes.com
3. SQL Editor → `supabase/migrations/012_profiles.sql` → Run
4. Se connecter dans le CRM avec ces emails (nouveaux mots de passe)
