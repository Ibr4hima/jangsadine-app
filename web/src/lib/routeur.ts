// Mini-routeur basé sur le hash de l'URL : aucune dépendance, fonctionne
// sur n'importe quel hébergement statique.
//   #/                → accueil
//   #/lecture         → niveaux du palier Lecture
//   #/niveau/n1       → leçons d'un niveau
//   #/lecon/n1-l1     → lecteur de leçon

import { useSyncExternalStore } from 'react'

export type Route =
  | { nom: 'accueil' }
  | { nom: 'lecture' }
  | { nom: 'niveau'; id: string }
  | { nom: 'lecon'; id: string }

function analyser(): Route {
  const hash = window.location.hash.replace(/^#\/?/, '')
  const [tete, param] = hash.split('/')
  if (tete === 'lecture') return { nom: 'lecture' }
  if (tete === 'niveau' && param) return { nom: 'niveau', id: param }
  if (tete === 'lecon' && param) return { nom: 'lecon', id: param }
  return { nom: 'accueil' }
}

function sAbonner(rappel: () => void) {
  window.addEventListener('hashchange', rappel)
  return () => window.removeEventListener('hashchange', rappel)
}

let derniereRoute: Route = { nom: 'accueil' }
let dernierHash: string | null = null

function lireRoute(): Route {
  if (window.location.hash !== dernierHash) {
    dernierHash = window.location.hash
    derniereRoute = analyser()
  }
  return derniereRoute
}

export function useRoute(): Route {
  return useSyncExternalStore(sAbonner, lireRoute)
}

export function aller(chemin: string) {
  window.location.hash = chemin
  window.scrollTo(0, 0)
}
