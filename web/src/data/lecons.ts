// Génération des étapes d'une leçon à partir de sa fiche (LeconMeta).
// Les exercices sont mélangés à chaque ouverture de la leçon : on révise
// toujours dans un ordre différent.

import { lettreParId, LETTRES, type Lettre } from './lettres'
import type { LeconMeta } from './curriculum'

export interface Carte {
  /** Texte arabe affiché en grand */
  ar: string
  /** Texte prononcé (par défaut : ar) */
  dire?: string
  legende?: string
  sousLegende?: string
}

export type Etape =
  | { type: 'info'; titre: string; texte: string; ar?: string }
  | { type: 'decouverte'; titre: string; sousTitre?: string; cartes: Carte[] }
  | {
      type: 'qcm'
      question: string
      /** Ce qu'on montre / fait écouter comme énoncé */
      enonce: Carte
      /** L'énoncé est joué en audio et masqué */
      audioSeul?: boolean
      choix: Carte[]
      bonneReponse: number
      /** Petits caractères → grands boutons arabes */
      choixArabes?: boolean
    }
  | { type: 'paires'; titre: string; paires: { gauche: Carte; droite: Carte }[] }
  | { type: 'fin'; titre: string; texte: string }

export function melanger<T>(tableau: T[]): T[] {
  const copie = [...tableau]
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copie[i], copie[j]] = [copie[j], copie[i]]
  }
  return copie
}

function distracteurs(cible: Lettre, nombre: number): Lettre[] {
  return melanger(LETTRES.filter((l) => l.id !== cible.id)).slice(0, nombre)
}

/** QCM : j'entends le nom d'une lettre → je retrouve sa forme écrite */
function qcmAudioVersLettre(l: Lettre): Etape {
  const choix = melanger([l, ...distracteurs(l, 3)])
  return {
    type: 'qcm',
    question: 'Écoute, puis choisis la bonne lettre',
    enonce: { ar: l.isole, dire: l.nomAr },
    audioSeul: true,
    choix: choix.map((c) => ({ ar: c.isole, dire: c.nomAr })),
    bonneReponse: choix.indexOf(l),
    choixArabes: true,
  }
}

/** QCM : je vois une lettre → je retrouve son nom */
function qcmLettreVersNom(l: Lettre): Etape {
  const choix = melanger([l, ...distracteurs(l, 3)])
  return {
    type: 'qcm',
    question: 'Comment s\'appelle cette lettre ?',
    enonce: { ar: l.isole, dire: l.nomAr },
    choix: choix.map((c) => ({ ar: c.nomFr, dire: c.nomAr })),
    bonneReponse: choix.indexOf(l),
  }
}

/** QCM : quelle est la forme attachée de cette lettre ? */
function qcmForme(l: Lettre, position: 'debut' | 'milieu' | 'fin'): Etape {
  const nomPosition = { debut: 'au début', milieu: 'au milieu', fin: 'à la fin' }[position]
  const choix = melanger([l, ...distracteurs(l, 3)])
  return {
    type: 'qcm',
    question: `Retrouve ${l.nomFr} (${l.isole}) ${nomPosition} du mot`,
    enonce: { ar: l.isole, dire: l.nomAr },
    audioSeul: true,
    choix: choix.map((c) => ({ ar: c.formes[position], dire: c.nomAr })),
    bonneReponse: choix.indexOf(l),
    choixArabes: true,
  }
}

function etapesLettresIsolees(lettres: Lettre[]): Etape[] {
  const etapes: Etape[] = []
  etapes.push({
    type: 'decouverte',
    titre: 'Découvre les nouvelles lettres',
    sousTitre: 'Touche chaque carte pour l\'écouter',
    cartes: lettres.map((l) => ({
      ar: l.isole,
      dire: l.nomAr,
      legende: l.nomFr,
      sousLegende: l.son,
    })),
  })
  for (const l of melanger(lettres)) etapes.push(qcmAudioVersLettre(l))
  etapes.push({
    type: 'paires',
    titre: 'Associe chaque lettre à son nom',
    paires: lettres.map((l) => ({
      gauche: { ar: l.isole, dire: l.nomAr },
      droite: { ar: l.nomFr },
    })),
  })
  for (const l of melanger(lettres)) etapes.push(qcmLettreVersNom(l))
  etapes.push({
    type: 'decouverte',
    titre: 'Ces lettres dans de vrais mots',
    sousTitre: 'Touche pour écouter — retrouve la lettre étudiée dans chaque mot',
    cartes: lettres.map((l) => ({
      ar: l.exemple.ar,
      legende: l.exemple.translit,
      sousLegende: l.exemple.fr,
    })),
  })
  return etapes
}

function etapesLettresFormes(lettres: Lettre[]): Etape[] {
  const etapes: Etape[] = []
  etapes.push({
    type: 'info',
    titre: 'Les lettres s\'attachent',
    texte:
      "En arabe, les lettres d'un même mot s'attachent entre elles. Chaque lettre a donc une forme au début, au milieu et à la fin du mot.",
    ar: 'بـ ـبـ ـب',
  })
  etapes.push({
    type: 'decouverte',
    titre: 'Découvre les trois formes',
    sousTitre: 'Début · milieu · fin — touche pour écouter',
    cartes: lettres.map((l) => ({
      ar: `${l.formes.debut} ${l.formes.milieu} ${l.formes.fin}`,
      dire: l.nomAr,
      legende: l.nomFr,
      sousLegende: l.nonConnectrice
        ? 'Cette lettre ne s\'attache jamais à la lettre suivante'
        : undefined,
    })),
  })
  const positions: Array<'debut' | 'milieu' | 'fin'> = ['debut', 'milieu', 'fin']
  melanger(lettres).forEach((l, i) => {
    etapes.push(qcmForme(l, positions[i % positions.length]))
  })
  etapes.push({
    type: 'paires',
    titre: 'Associe la forme isolée à la forme attachée',
    paires: lettres.map((l) => ({
      gauche: { ar: l.isole, dire: l.nomAr },
      droite: { ar: l.formes.milieu, dire: l.nomAr },
    })),
  })
  return etapes
}

function etapesTest(lettres: Lettre[], type: string): Etape[] {
  const etapes: Etape[] = []
  etapes.push({
    type: 'info',
    titre: 'Test du niveau',
    texte:
      'Douze questions sur toutes les lettres du niveau. Prends ton temps, et qu\'Allah te facilite !',
    ar: 'بِسْمِ الله',
  })
  const selection = melanger(lettres).slice(0, 12)
  selection.forEach((l, i) => {
    if (type === 'lettres-formes') {
      const positions: Array<'debut' | 'milieu' | 'fin'> = ['debut', 'milieu', 'fin']
      etapes.push(qcmForme(l, positions[i % 3]))
    } else {
      etapes.push(i % 2 === 0 ? qcmAudioVersLettre(l) : qcmLettreVersNom(l))
    }
  })
  return etapes
}

export function genererEtapes(lecon: LeconMeta): Etape[] {
  const lettres = lecon.lettres.map((id) => lettreParId.get(id)!)
  let etapes: Etape[]
  if (lecon.type === 'test') {
    etapes = etapesTest(lettres, niveauTestType(lecon.id))
  } else if (lecon.type === 'lettres-formes') {
    etapes = etapesLettresFormes(lettres)
  } else {
    etapes = etapesLettresIsolees(lettres)
  }
  etapes.push({
    type: 'fin',
    titre: 'مَا شَاءَ الله',
    texte: 'Leçon terminée. Qu\'Allah bénisse ton apprentissage !',
  })
  return etapes
}

function niveauTestType(leconId: string): string {
  return leconId.startsWith('n2') ? 'lettres-formes' : 'lettres-isolees'
}
