// Progression de l'élève, conservée sur l'appareil (localStorage).

import { useSyncExternalStore } from 'react'

export interface ProgresLecon {
  terminee: boolean
  /** score du dernier passage, sur 100 */
  score?: number
}

type Progres = Record<string, ProgresLecon>

const CLE = 'jang-araab-progres'
const abonnes = new Set<() => void>()
let cache: Progres | null = null

function lire(): Progres {
  if (cache) return cache
  try {
    cache = JSON.parse(localStorage.getItem(CLE) ?? '{}') as Progres
  } catch {
    cache = {}
  }
  return cache
}

export function marquerTerminee(leconId: string, score?: number) {
  const progres = { ...lire(), [leconId]: { terminee: true, score } }
  cache = progres
  try {
    localStorage.setItem(CLE, JSON.stringify(progres))
  } catch {
    // stockage indisponible (navigation privée) : la progression reste en mémoire
  }
  abonnes.forEach((f) => f())
}

function sAbonner(rappel: () => void) {
  abonnes.add(rappel)
  return () => abonnes.delete(rappel)
}

export function useProgres(): Progres {
  return useSyncExternalStore(sAbonner, lire)
}

export function compterTerminees(leconIds: string[], progres: Progres): number {
  return leconIds.filter((id) => progres[id]?.terminee).length
}
