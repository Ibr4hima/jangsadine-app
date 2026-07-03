# Jàng Araab — Apprendre l'arabe 🗝️

Web app d'apprentissage de la langue arabe pour les musulmans, pensée comme une
_sadaqah jâriyah_ : gratuite, légère, sans publicité. Inspirée de la sobriété de
[miftah.app](https://miftah.app/) et construite pour aller beaucoup plus loin :
jusqu'à la lecture autonome des textes religieux.

## Le cursus — 5 paliers

| # | Palier | Contenu | Sources |
|---|--------|---------|---------|
| 1 | **المفتاح — La Clé** | Alphabet, sons, règles de lecture (8 niveaux, façon qâʿida) | — |
| 2 | **التأسيس — Fondations** | Premiers mots, phrases nominales, vocabulaire du dîn | Médine T1 · ABY 1 |
| 3 | **البناء — Construction** | Verbes, structure de la phrase, textes suivis | Médine T2 · ABY 2 |
| 4 | **الانطلاق — Envol** | Sarf, analyse grammaticale, textes religieux adaptés | Médine T3 · ABY 3 |
| 5 | **الإتقان — Maîtrise** | Coran + tafsir simplifié, hadiths, livres des savants | Série de Riyadh |

Le palier 1 est fonctionnel (niveaux 1 et 2 : lettres isolées et formes
attachées — 16 leçons interactives avec tests). Les niveaux 3 à 8 (voyelles,
tanwîn, prolongations, soukoun, shadda, lecture courante) sont structurés dans
`src/data/curriculum.ts` et restent à remplir.

## Lancer en local

```bash
cd web
npm install
npm run dev       # développement
npm run build     # build de production → dist/
```

Le build est 100 % statique : `dist/` se déploie tel quel sur n'importe quel
hébergement (GitHub Pages, Netlify, Cloudflare Pages…). Le routage utilise le
hash (`#/…`), aucune configuration serveur n'est nécessaire.

## Architecture

- `src/data/lettres.ts` — l'alphabet : noms, sons, formes attachées, mots d'exemple
- `src/data/curriculum.ts` — paliers, niveaux et fiches de leçons
- `src/data/lecons.ts` — génération des étapes d'exercices (mélangées à chaque passage)
- `src/composants/Etapes.tsx` — les exercices : découverte, QCM audio/visuel, paires
- `src/ecrans/` — accueil, palier, niveau, lecteur de leçon
- `src/lib/audio.ts` — audio (synthèse vocale aujourd'hui, mp3 demain : déposer `public/audio/<id>.mp3`)
- `src/lib/progres.ts` — progression sur l'appareil (localStorage)
- `src/lib/routeur.ts` — mini-routeur hash sans dépendance

## Prochaines étapes

1. Enregistrements audio réels (récitateur) pour remplacer la synthèse vocale
2. Niveaux 3 → 8 du palier Lecture (harakât, tanwîn, mudûd, soukoun, shadda)
3. Palier 2 : leçons de vocabulaire/phrases tirées de la sélection Médine + ABY
4. Comptes et synchronisation de la progression (Supabase, déjà utilisé côté app mobile)
5. Passage en app mobile (le contenu de `src/data` est réutilisable tel quel dans l'app Expo)
