// Le cursus complet : 5 paliers, du déchiffrage des lettres à la lecture
// autonome des textes religieux. Les paliers 2 à 5 sont construits à partir
// d'une sélection des Tomes de Médine, d'Al-ʿArabiyya bayna yadayk et de la
// série de Riyadh.

import { GROUPES_LETTRES, lettreParId } from './lettres'

export interface Palier {
  id: string
  num: number
  nomAr: string
  nomFr: string
  description: string
  sources?: string
  disponible: boolean
}

export const PALIERS: Palier[] = [
  {
    id: 'lecture',
    num: 1,
    nomAr: 'المِفْتَاح',
    nomFr: 'La Clé — lire l\'arabe',
    description:
      "L'alphabet, les sons et les règles de lecture, pas à pas, jusqu'à lire n'importe quel texte vocalisé.",
    disponible: true,
  },
  {
    id: 'fondations',
    num: 2,
    nomAr: 'التَّأْسِيس',
    nomFr: 'Les Fondations',
    description:
      'Premiers mots, phrases simples et vocabulaire du quotidien et de la religion.',
    sources: 'Tome de Médine 1 · Al-ʿArabiyya bayna yadayk 1',
    disponible: false,
  },
  {
    id: 'construction',
    num: 3,
    nomAr: 'البِنَاء',
    nomFr: 'La Construction',
    description:
      'Les verbes, la structure de la phrase et les premiers textes suivis.',
    sources: 'Tome de Médine 2 · Al-ʿArabiyya bayna yadayk 2',
    disponible: false,
  },
  {
    id: 'envol',
    num: 4,
    nomAr: 'الاِنْطِلَاق',
    nomFr: "L'Envol",
    description:
      'Morphologie (sarf), analyse grammaticale et textes religieux adaptés.',
    sources: 'Tome de Médine 3 · Al-ʿArabiyya bayna yadayk 3',
    disponible: false,
  },
  {
    id: 'maitrise',
    num: 5,
    nomAr: 'الإِتْقَان',
    nomFr: 'La Maîtrise',
    description:
      'Lecture autonome : Coran avec tafsir simplifié, hadiths et livres des savants.',
    sources: 'Série de Riyadh · textes authentiques',
    disponible: false,
  },
]

export interface NiveauLecture {
  id: string
  num: number
  nomAr: string
  nomFr: string
  description: string
  disponible: boolean
  lecons: LeconMeta[]
}

export interface LeconMeta {
  id: string
  titreAr: string
  titreFr: string
  type: 'lettres-isolees' | 'lettres-formes' | 'test'
  /** ids des lettres travaillées dans la leçon */
  lettres: string[]
}

function titreGroupe(groupe: string[]): string {
  return groupe.map((id) => lettreParId.get(id)!.isole).join(' ')
}

function leconsNiveau(
  niveauId: string,
  type: 'lettres-isolees' | 'lettres-formes',
): LeconMeta[] {
  const lecons: LeconMeta[] = GROUPES_LETTRES.map((groupe, i) => ({
    id: `${niveauId}-l${i + 1}`,
    titreAr: titreGroupe(groupe),
    titreFr: `Leçon ${i + 1}`,
    type,
    lettres: groupe,
  }))
  lecons.push({
    id: `${niveauId}-test`,
    titreAr: 'اِخْتِبَار',
    titreFr: 'Test du niveau',
    type: 'test',
    lettres: GROUPES_LETTRES.flat(),
  })
  return lecons
}

export const NIVEAUX_LECTURE: NiveauLecture[] = [
  {
    id: 'n1',
    num: 1,
    nomAr: 'الحُرُوف',
    nomFr: 'Les lettres de l\'alphabet',
    description: 'Reconnaître et prononcer les 28 lettres, dans leur forme isolée.',
    disponible: true,
    lecons: leconsNiveau('n1', 'lettres-isolees'),
  },
  {
    id: 'n2',
    num: 2,
    nomAr: 'أَشْكَال الحُرُوف',
    nomFr: 'Les formes des lettres',
    description: 'Chaque lettre change de forme au début, au milieu et à la fin du mot.',
    disponible: true,
    lecons: leconsNiveau('n2', 'lettres-formes'),
  },
  {
    id: 'n3',
    num: 3,
    nomAr: 'الحَرَكَات',
    nomFr: 'Les voyelles courtes',
    description: 'Fatha, kasra et damma : lire ses premières syllabes.',
    disponible: false,
    lecons: [],
  },
  {
    id: 'n4',
    num: 4,
    nomAr: 'التَّنْوِين',
    nomFr: 'Le tanwîn',
    description: 'Les terminaisons « an », « in », « oun ».',
    disponible: false,
    lecons: [],
  },
  {
    id: 'n5',
    num: 5,
    nomAr: 'المُدُود',
    nomFr: 'Les prolongations',
    description: 'Les voyelles longues avec alif, wâw et yâ.',
    disponible: false,
    lecons: [],
  },
  {
    id: 'n6',
    num: 6,
    nomAr: 'السُّكُون',
    nomFr: 'Le soukoun',
    description: 'Les syllabes fermées : lire des mots complets.',
    disponible: false,
    lecons: [],
  },
  {
    id: 'n7',
    num: 7,
    nomAr: 'الشَّدَّة',
    nomFr: 'La shadda',
    description: 'Les lettres doublées.',
    disponible: false,
    lecons: [],
  },
  {
    id: 'n8',
    num: 8,
    nomAr: 'القِرَاءَة',
    nomFr: 'Lecture courante',
    description: 'Lâm solaire et lunaire, hamzat al-wasl : lire des phrases entières.',
    disponible: false,
    lecons: [],
  },
]

export const leconParId = new Map(
  NIVEAUX_LECTURE.flatMap((n) => n.lecons).map((l) => [l.id, l]),
)

export function niveauDeLecon(leconId: string): NiveauLecture | undefined {
  return NIVEAUX_LECTURE.find((n) => n.lecons.some((l) => l.id === leconId))
}
